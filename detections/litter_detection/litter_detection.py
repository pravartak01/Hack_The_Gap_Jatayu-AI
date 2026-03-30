"""Litter dumping detection with person/trash tracking, event clips, and Cloudinary upload."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import hashlib
import importlib.util
import logging
import re
import time

import cv2
import requests
import torch
import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class SimpleIOUTracker:
    """Lightweight tracker using IoU-based assignment for stable object IDs."""

    def __init__(self, iou_threshold: float = 0.25, max_age_frames: int = 20):
        self.iou_threshold = float(max(0.05, min(0.95, iou_threshold)))
        self.max_age_frames = int(max(1, max_age_frames))
        self.next_id = 1
        self.tracks: Dict[int, Dict] = {}

    @staticmethod
    def _iou(a: List[int], b: List[int]) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        ix1 = max(ax1, bx1)
        iy1 = max(ay1, by1)
        ix2 = min(ax2, bx2)
        iy2 = min(ay2, by2)
        iw = max(0, ix2 - ix1)
        ih = max(0, iy2 - iy1)
        inter = float(iw * ih)
        if inter <= 0.0:
            return 0.0
        a_area = float(max(1, (ax2 - ax1) * (ay2 - ay1)))
        b_area = float(max(1, (bx2 - bx1) * (by2 - by1)))
        return inter / (a_area + b_area - inter)

    def update(self, detections: List[Dict], frame_index: int) -> List[Dict]:
        assigned_track_ids = set()
        assigned_det_indices = set()

        candidates: List[Tuple[float, int, int]] = []
        for det_i, det in enumerate(detections):
            for track_id, track in self.tracks.items():
                iou = self._iou(det["bbox"], track["bbox"])
                if iou >= self.iou_threshold:
                    candidates.append((iou, det_i, track_id))

        candidates.sort(key=lambda x: x[0], reverse=True)
        for _, det_i, track_id in candidates:
            if det_i in assigned_det_indices or track_id in assigned_track_ids:
                continue
            det = detections[det_i]
            track = self.tracks[track_id]
            track["bbox"] = det["bbox"]
            track["confidence"] = float(det["confidence"])
            track["class_name"] = str(det["class_name"])
            track["last_seen"] = frame_index
            track["hits"] += 1
            assigned_det_indices.add(det_i)
            assigned_track_ids.add(track_id)

        for det_i, det in enumerate(detections):
            if det_i in assigned_det_indices:
                continue
            track_id = self.next_id
            self.next_id += 1
            self.tracks[track_id] = {
                "id": track_id,
                "bbox": det["bbox"],
                "confidence": float(det["confidence"]),
                "class_name": str(det["class_name"]),
                "last_seen": frame_index,
                "first_seen": frame_index,
                "hits": 1,
            }

        stale_ids = []
        for track_id, track in self.tracks.items():
            if frame_index - track["last_seen"] > self.max_age_frames:
                stale_ids.append(track_id)
        for track_id in stale_ids:
            del self.tracks[track_id]

        out: List[Dict] = []
        for track in self.tracks.values():
            if frame_index - track["last_seen"] <= self.max_age_frames:
                out.append(
                    {
                        "id": int(track["id"]),
                        "bbox": list(track["bbox"]),
                        "confidence": float(track["confidence"]),
                        "class_name": str(track["class_name"]),
                        "age": int(frame_index - track["first_seen"]),
                    }
                )
        return out


class LitterDetector:
    def __init__(
        self,
        model_id: str,
        device: str,
        confidence_threshold: float,
        person_confidence_threshold: float,
        trash_confidence_threshold: float,
        inference_size: int,
        person_class: str,
        trash_classes: List[str],
        iou_threshold: float,
        max_age_frames: int,
        proximity_px: int,
        min_near_frames: int,
        stationary_movement_px: int,
        min_stationary_frames: int,
        away_distance_px: int,
        max_drop_window_frames: int,
        event_exit_grace_frames: int,
        event_clip_fps: float,
        save_directory: str,
        save_full_annotated_video: bool,
        cloudinary_cfg: Dict,
    ):
        if importlib.util.find_spec("ultralytics") is None:
            raise RuntimeError("Missing dependency 'ultralytics'. Run: pip install -r requirements.txt")
        from ultralytics import YOLO

        self.device = device
        self.confidence_threshold = float(confidence_threshold)
        self.person_confidence_threshold = float(max(0.01, min(1.0, person_confidence_threshold)))
        self.trash_confidence_threshold = float(max(0.01, min(1.0, trash_confidence_threshold)))
        self.inference_size = int(max(320, inference_size))
        self.person_class = str(person_class).strip().lower() or "person"
        self.trash_classes = {c.strip().lower() for c in trash_classes if str(c).strip()}

        self.person_tracker = SimpleIOUTracker(iou_threshold=iou_threshold, max_age_frames=max_age_frames)
        self.trash_tracker = SimpleIOUTracker(iou_threshold=iou_threshold, max_age_frames=max_age_frames)

        self.proximity_px = float(max(5, proximity_px))
        self.min_near_frames = int(max(1, min_near_frames))
        self.stationary_movement_px = float(max(1, stationary_movement_px))
        self.min_stationary_frames = int(max(1, min_stationary_frames))
        self.away_distance_px = float(max(5, away_distance_px))
        self.max_drop_window_frames = int(max(10, max_drop_window_frames))
        self.event_exit_grace_frames = int(max(1, event_exit_grace_frames))
        self.event_clip_fps = float(max(1.0, min(60.0, event_clip_fps)))

        self.save_directory = Path(save_directory)
        self.save_full_annotated_video = bool(save_full_annotated_video)
        self.cloudinary_cfg = cloudinary_cfg or {}

        self.model = YOLO(model_id)
        try:
            self.model.to(self.device)
        except Exception:
            pass

        names = getattr(self.model.model, "names", {}) or {}
        self.label_map = {int(k): str(v) for k, v in names.items()} if isinstance(names, dict) else {}

        self.trash_state: Dict[int, Dict] = {}
        self.alerted_track_ids = set()

    @staticmethod
    def _center(box: List[int]) -> Tuple[float, float]:
        x1, y1, x2, y2 = box
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    @staticmethod
    def _distance(a: Tuple[float, float], b: Tuple[float, float]) -> float:
        dx = a[0] - b[0]
        dy = a[1] - b[1]
        return (dx * dx + dy * dy) ** 0.5

    def _predict_raw(self, frame) -> Tuple[List[Dict], List[Dict]]:
        people: List[Dict] = []
        trash: List[Dict] = []

        results = self.model.predict(
            source=frame,
            conf=self.confidence_threshold,
            imgsz=self.inference_size,
            verbose=False,
            device=self.device,
        )
        if not results:
            return people, trash

        result = results[0]
        boxes = getattr(result, "boxes", None)
        if boxes is None:
            return people, trash

        for b in boxes:
            cls_id = int(b.cls.item())
            conf = float(b.conf.item())
            xyxy = b.xyxy[0].tolist()
            bbox = [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]
            name = self.label_map.get(cls_id, str(cls_id)).strip().lower()
            item = {"bbox": bbox, "confidence": conf, "class_name": name}

            if name == self.person_class:
                if conf >= self.person_confidence_threshold:
                    people.append(item)
            elif name in self.trash_classes:
                if conf >= self.trash_confidence_threshold:
                    trash.append(item)

        return people, trash

    def _update_state_and_detect_events(
        self,
        person_tracks: List[Dict],
        trash_tracks: List[Dict],
        frame_index: int,
    ) -> List[Dict]:
        events: List[Dict] = []

        person_centers = {p["id"]: self._center(p["bbox"]) for p in person_tracks}

        active_trash_ids = set()
        for t in trash_tracks:
            trash_id = int(t["id"])
            active_trash_ids.add(trash_id)
            t_center = self._center(t["bbox"])

            nearest_person_id = None
            nearest_dist = float("inf")
            for person_id, p_center in person_centers.items():
                d = self._distance(t_center, p_center)
                if d < nearest_dist:
                    nearest_dist = d
                    nearest_person_id = person_id

            state = self.trash_state.get(
                trash_id,
                {
                    "first_seen": frame_index,
                    "near_frames": 0,
                    "stationary_frames": 0,
                    "owner_id": None,
                    "last_center": t_center,
                    "last_bbox": t["bbox"],
                },
            )

            movement = self._distance(t_center, state["last_center"])
            if movement <= self.stationary_movement_px:
                state["stationary_frames"] += 1
            else:
                state["stationary_frames"] = 0

            if nearest_dist <= self.proximity_px and nearest_person_id is not None:
                state["near_frames"] += 1
                state["owner_id"] = nearest_person_id

            owner_far = False
            owner_id = state.get("owner_id")
            if owner_id in person_centers:
                owner_dist = self._distance(t_center, person_centers[owner_id])
                owner_far = owner_dist >= self.away_distance_px

            age = frame_index - int(state["first_seen"])
            ready_for_event = (
                state["near_frames"] >= self.min_near_frames
                and state["stationary_frames"] >= self.min_stationary_frames
                and owner_far
                and age <= self.max_drop_window_frames
            )

            if ready_for_event and trash_id not in self.alerted_track_ids:
                event_id = f"litter_{frame_index}_{trash_id}_{int(time.time())}"
                events.append(
                    {
                        "event_id": event_id,
                        "frame_index": frame_index,
                        "trash_track_id": trash_id,
                        "owner_person_id": owner_id,
                        "bbox": list(t["bbox"]),
                        "label": "dumping_event",
                    }
                )
                self.alerted_track_ids.add(trash_id)

            state["last_center"] = t_center
            state["last_bbox"] = list(t["bbox"])
            self.trash_state[trash_id] = state

        stale_ids = [tid for tid in self.trash_state.keys() if tid not in active_trash_ids]
        for tid in stale_ids:
            del self.trash_state[tid]

        return events

    def _annotate(
        self,
        frame,
        person_tracks: List[Dict],
        trash_tracks: List[Dict],
        events: List[Dict],
    ):
        out = frame.copy()

        for p in person_tracks:
            x1, y1, x2, y2 = p["bbox"]
            cv2.rectangle(out, (x1, y1), (x2, y2), (255, 0, 0), 3)
            txt = f"PERSON #{p['id']}"
            cv2.putText(out, txt, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 0, 0), 2)

        for t in trash_tracks:
            x1, y1, x2, y2 = t["bbox"]
            cv2.rectangle(out, (x1, y1), (x2, y2), (0, 255, 0), 3)
            cls = str(t.get("class_name", "trash")).replace("_", " ").title()
            txt = f"GARBAGE #{t['id']} {cls}"
            cv2.putText(out, txt, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.56, (0, 255, 0), 2)

        for e in events:
            x1, y1, x2, y2 = e["bbox"]
            cv2.rectangle(out, (x1, y1), (x2, y2), (0, 0, 255), 3)
            cv2.putText(out, "DUMPING EVENT", (x1, max(18, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)

        if events:
            cv2.rectangle(out, (0, 0), (out.shape[1], 42), (0, 0, 255), -1)
            cv2.putText(out, "LITTERING ALERT DETECTED", (10, 29), cv2.FONT_HERSHEY_SIMPLEX, 0.82, (255, 255, 255), 2)
        else:
            summary = f"People: {len(person_tracks)} | Garbage: {len(trash_tracks)}"
            cv2.rectangle(out, (0, 0), (out.shape[1], 34), (30, 30, 30), -1)
            cv2.putText(out, summary, (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.62, (255, 255, 255), 2)

        return out

    def _upload_to_cloudinary(self, local_path: Path) -> Optional[str]:
        if not bool(self.cloudinary_cfg.get("enabled", False)):
            return None

        cloud_name = str(self.cloudinary_cfg.get("cloud_name", "")).strip()
        api_key = str(self.cloudinary_cfg.get("api_key", "")).strip()
        api_secret = str(self.cloudinary_cfg.get("api_secret", "")).strip()
        folder = str(self.cloudinary_cfg.get("folder", "garbage-clips")).strip() or "garbage-clips"

        if not cloud_name or not api_key or not api_secret:
            logger.warning("Cloudinary config incomplete; skipping upload")
            return None

        timestamp = int(time.time())
        public_id = f"{self._safe_public_id(local_path.stem)}_{timestamp}"
        to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(to_sign.encode("utf-8")).hexdigest()

        url = f"https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload"
        data = {
            "api_key": api_key,
            "timestamp": str(timestamp),
            "signature": signature,
            "folder": folder,
            "public_id": public_id,
            "resource_type": "auto",
        }

        try:
            with local_path.open("rb") as f:
                files = {"file": f}
                resp = requests.post(url, data=data, files=files, timeout=90)
            if resp.status_code not in (200, 201):
                logger.warning("Cloudinary upload failed (%s): %s", resp.status_code, resp.text)
                return None
            payload = resp.json()
            return payload.get("secure_url")
        except Exception as ex:
            logger.warning("Cloudinary upload error for %s: %s", local_path, ex)
            return None

    @staticmethod
    def _safe_public_id(name: str) -> str:
        """Normalize Cloudinary public IDs to avoid URL fetch issues with spaces/special chars."""
        safe = re.sub(r"[^A-Za-z0-9_-]+", "_", str(name))
        safe = re.sub(r"_+", "_", safe).strip("_")
        return safe or "clip"

    @staticmethod
    def _create_mp4_writer(output_path: str, fps: float, width: int, height: int) -> cv2.VideoWriter:
        """Create MP4 writer with codec fallback for better Cloudinary/browser compatibility."""
        for codec in ("avc1", "H264", "mp4v"):
            writer = cv2.VideoWriter(
                output_path,
                cv2.VideoWriter_fourcc(*codec),
                float(fps),
                (width, height),
            )
            if writer is not None and writer.isOpened():
                logger.info("Using video codec: %s", codec)
                return writer
            if writer is not None:
                writer.release()
        raise RuntimeError("Unable to initialize MP4 video writer with available codecs")

    def _run_stream(
        self,
        cap,
        save_dir: Path,
        frame_skip: int,
        preview: bool,
        source_tag: str,
    ) -> Dict:
        if not cap.isOpened():
            return {"success": False, "error": "Unable to open source"}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        fps = float(cap.get(cv2.CAP_PROP_FPS)) or 20.0

        clips_dir = save_dir / "alert_clips"
        clips_dir.mkdir(parents=True, exist_ok=True)
        snap_dir = save_dir / "snapshots"
        snap_dir.mkdir(parents=True, exist_ok=True)
        full_dir = save_dir / "annotated_video"
        full_dir.mkdir(parents=True, exist_ok=True)

        full_writer = None
        full_video_path = None
        if self.save_full_annotated_video:
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            full_video_path = full_dir / f"{source_tag}_{stamp}_annotated.mp4"
            full_writer = self._create_mp4_writer(str(full_video_path), fps, width, height)

        in_event = False
        event_writer = None
        event_clip_path = None
        no_event_frames = 0
        frame_index = 0
        event_count = 0
        uploads: List[Dict] = []
        all_events: List[Dict] = []

        cached_people: List[Dict] = []
        cached_trash: List[Dict] = []

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            if frame_index % frame_skip == 0:
                raw_people, raw_trash = self._predict_raw(frame)
                cached_people = self.person_tracker.update(raw_people, frame_index)
                cached_trash = self.trash_tracker.update(raw_trash, frame_index)
            person_tracks = cached_people
            trash_tracks = cached_trash

            events = self._update_state_and_detect_events(person_tracks, trash_tracks, frame_index)
            if events:
                all_events.extend(events)

            annotated = self._annotate(frame, person_tracks, trash_tracks, events)
            if full_writer is not None:
                full_writer.write(annotated)

            if events and not in_event:
                in_event = True
                no_event_frames = 0
                event_count += 1
                stamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                event_clip_path = clips_dir / f"litter_event_{stamp}.mp4"
                event_writer = self._create_mp4_writer(
                    str(event_clip_path),
                    self.event_clip_fps,
                    width,
                    height,
                )

                snap_path = snap_dir / f"litter_event_{stamp}.jpg"
                cv2.imwrite(str(snap_path), annotated)
                snap_url = self._upload_to_cloudinary(snap_path)
                if snap_url:
                    uploads.append({"type": "snapshot", "local_path": str(snap_path), "url": snap_url})

            if in_event and event_writer is not None:
                event_writer.write(annotated)
                if events:
                    no_event_frames = 0
                else:
                    no_event_frames += 1

                if no_event_frames > self.event_exit_grace_frames:
                    event_writer.release()
                    event_writer = None
                    in_event = False
                    no_event_frames = 0

                    if event_clip_path is not None:
                        clip_url = self._upload_to_cloudinary(event_clip_path)
                        if clip_url:
                            uploads.append({"type": "clip", "local_path": str(event_clip_path), "url": clip_url})
                        event_clip_path = None

            if preview:
                cv2.imshow("Litter Detection", annotated)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break

            frame_index += 1

        if event_writer is not None:
            event_writer.release()
            if event_clip_path is not None:
                clip_url = self._upload_to_cloudinary(event_clip_path)
                if clip_url:
                    uploads.append({"type": "clip", "local_path": str(event_clip_path), "url": clip_url})

        if full_writer is not None:
            full_writer.release()

        cap.release()
        if preview:
            cv2.destroyAllWindows()

        return {
            "success": True,
            "frames": frame_index,
            "events": all_events,
            "event_count": event_count,
            "uploads": uploads,
            "full_video_path": str(full_video_path) if full_video_path else None,
        }

    def detect_in_webcam(self, source=0, frame_skip: int = 1) -> Dict:
        cap = self._open_camera_source(source)
        if cap is None:
            return {"success": False, "error": f"Unable to open camera source: {source}"}

        logger.info("Press 'q' to stop litter detection webcam stream")
        return self._run_stream(
            cap=cap,
            save_dir=self.save_directory,
            frame_skip=max(1, int(frame_skip)),
            preview=True,
            source_tag="webcam",
        )

    def detect_in_video(self, video_path: str, frame_skip: int = 1, preview: bool = True) -> Dict:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"success": False, "error": f"Unable to open video: {video_path}"}

        return self._run_stream(
            cap=cap,
            save_dir=self.save_directory,
            frame_skip=max(1, int(frame_skip)),
            preview=bool(preview),
            source_tag=Path(video_path).stem,
        )

    @staticmethod
    def _open_camera_source(source):
        if isinstance(source, str) and not source.strip().isdigit():
            cap = cv2.VideoCapture(source)
            return cap if cap.isOpened() else None

        try:
            base_index = int(source)
        except Exception:
            base_index = 0

        candidate_indices = [base_index, 0, 1, 2]
        backends = [
            getattr(cv2, "CAP_DSHOW", 700),
            getattr(cv2, "CAP_MSMF", 1400),
            0,
        ]

        seen = set()
        for idx in candidate_indices:
            if idx in seen:
                continue
            seen.add(idx)
            for backend in backends:
                cap = cv2.VideoCapture(idx, backend)
                if cap is not None and cap.isOpened():
                    logger.info("Opened webcam index %s with backend %s", idx, backend)
                    return cap
                if cap is not None:
                    cap.release()

        return None


def load_config() -> Dict:
    cfg_path = Path(__file__).resolve().parent / "config.yaml"
    if not cfg_path.exists():
        return {}
    with cfg_path.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def _safe_input(prompt: str, default: str) -> str:
    try:
        value = input(prompt).strip()
        return value if value else default
    except EOFError:
        return default


def build_detector_from_config(cfg: Dict) -> LitterDetector:
    model_cfg = cfg.get("model", {})
    detection_cfg = cfg.get("detection", {})
    tracking_cfg = cfg.get("tracking", {})
    event_cfg = cfg.get("event", {})
    output_cfg = cfg.get("output", {})

    device_cfg = model_cfg.get("device", "auto")
    if str(device_cfg).lower() == "auto":
        device_cfg = "cuda" if torch.cuda.is_available() else "cpu"

    return LitterDetector(
        model_id=str(model_cfg.get("model_id", "yolov8n.pt")),
        device=str(device_cfg),
        confidence_threshold=float(detection_cfg.get("confidence_threshold", 0.25)),
        person_confidence_threshold=float(
            detection_cfg.get("person_confidence_threshold", detection_cfg.get("confidence_threshold", 0.25))
        ),
        trash_confidence_threshold=float(detection_cfg.get("trash_confidence_threshold", 0.12)),
        inference_size=int(detection_cfg.get("inference_size", 832)),
        person_class=str(detection_cfg.get("person_class", "person")),
        trash_classes=list(detection_cfg.get("trash_classes", [])),
        iou_threshold=float(tracking_cfg.get("iou_threshold", 0.25)),
        max_age_frames=int(tracking_cfg.get("max_age_frames", 20)),
        proximity_px=int(event_cfg.get("proximity_px", 120)),
        min_near_frames=int(event_cfg.get("min_near_frames", 4)),
        stationary_movement_px=int(event_cfg.get("stationary_movement_px", 12)),
        min_stationary_frames=int(event_cfg.get("min_stationary_frames", 10)),
        away_distance_px=int(event_cfg.get("away_distance_px", 170)),
        max_drop_window_frames=int(event_cfg.get("max_drop_window_frames", 180)),
        event_exit_grace_frames=int(event_cfg.get("event_exit_grace_frames", 12)),
        event_clip_fps=float(event_cfg.get("event_clip_fps", 10.0)),
        save_directory=str(output_cfg.get("save_directory", "detections/litter_detection")),
        save_full_annotated_video=bool(output_cfg.get("save_full_annotated_video", True)),
        cloudinary_cfg=cfg.get("cloudinary", {}),
    )


if __name__ == "__main__":
    config = load_config()
    detector = build_detector_from_config(config)

    print("1. Detect in webcam")
    print("2. Detect in video")
    choice = _safe_input("Enter choice (1-2) [default 2]: ", "2")

    if choice == "1":
        webcam_cfg = config.get("webcam", {})
        source_default = webcam_cfg.get("source", 0)
        src_in = _safe_input(f"Camera source [default {source_default}]: ", str(source_default))
        source = src_in if src_in else source_default
        if isinstance(source, str) and source.isdigit():
            source = int(source)
        result = detector.detect_in_webcam(source=source, frame_skip=1)
        print(result)
    elif choice == "2":
        video_cfg = config.get("video", {})
        video_path = _safe_input("Video path: ", "")
        frame_skip_default = int(video_cfg.get("frame_skip", 1))
        frame_skip = int(_safe_input(f"Frame skip [default {frame_skip_default}]: ", str(frame_skip_default)))
        preview_default = bool(video_cfg.get("preview", True))
        preview_in = _safe_input(f"Preview window? (y/n) [default {'y' if preview_default else 'n'}]: ", "")
        if preview_in.strip().lower() in ("y", "yes", "1", "true"):
            preview = True
        elif preview_in.strip().lower() in ("n", "no", "0", "false"):
            preview = False
        else:
            preview = preview_default

        result = detector.detect_in_video(video_path=video_path, frame_skip=frame_skip, preview=preview)
        print(result)
    else:
        print("Invalid choice")

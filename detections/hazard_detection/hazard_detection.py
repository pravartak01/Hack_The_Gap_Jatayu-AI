"""Hazard Detection (fire/smoke/accident) with selectable pretrained backends.

Supported backends:
- yolo8 (Ultralytics YOLOv8)
- detr (Hugging Face DETR)

Important:
- Generic pretrained models often do not include explicit fire/smoke classes.
- Best results come from custom hazard-trained weights (YOLOv8 recommended).
"""

from pathlib import Path
from typing import Dict, List, Optional
import hashlib
import importlib.util
import logging
import re
import shutil
import time
from datetime import datetime

import cv2
import requests
import torch
import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


DEFAULT_HAZARD_LABELS = {
    "fire",
    "smoke",
    "flame",
    "hazard",
    "explosion",
    "accident",
    "crash",
    "collision",
}

VEHICLE_LABELS = {
    "car",
    "truck",
    "bus",
    "motorcycle",
    "motorbike",
}

HAZARD_CATEGORY_FOLDERS = {
    "fire": "fire_detection",
    "smoke": "smoke_detection",
    "accident": "accident_detection",
    "other": "other_hazard_detection",
}


class HazardDetector:
    def __init__(
        self,
        backend: str = "yolo8",
        model_id: str = "yolov8n.pt",
        confidence_threshold: float = 0.25,
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
        hazard_classes: Optional[List[str]] = None,
        inference_size: int = 832,
        enable_color_fire_fallback: bool = True,
        color_fire_min_area: int = 900,
        enable_color_smoke_fallback: bool = True,
        color_smoke_min_area: int = 1400,
        enable_vehicle_accident_fallback: bool = True,
        enable_pre_collision_detection: bool = True,
        pre_collision_distance_ratio: float = 1.55,
        pre_collision_min_closing_px: float = 8.0,
    ):
        self.backend = backend.strip().lower()
        self.model_id = model_id
        self.device = device
        self.confidence_threshold = float(confidence_threshold)
        self.inference_size = int(max(320, inference_size))
        self.hazard_classes = {
            c.strip().lower() for c in (hazard_classes or list(DEFAULT_HAZARD_LABELS)) if c and c.strip()
        }
        self.enable_color_fire_fallback = bool(enable_color_fire_fallback)
        self.color_fire_min_area = int(max(100, color_fire_min_area))
        self.enable_color_smoke_fallback = bool(enable_color_smoke_fallback)
        self.color_smoke_min_area = int(max(200, color_smoke_min_area))
        self.enable_vehicle_accident_fallback = bool(enable_vehicle_accident_fallback)
        self.enable_pre_collision_detection = bool(enable_pre_collision_detection)
        self.pre_collision_distance_ratio = float(max(1.05, pre_collision_distance_ratio))
        self.pre_collision_min_closing_px = float(max(1.0, pre_collision_min_closing_px))
        self._prev_vehicle_boxes: List[List[int]] = []

        self.model = None
        self.label_map: Dict[int, str] = {}
        self.detr_processor = None
        self.cloudinary_cfg: Dict = {}

        if self.backend == "yolo8":
            self._load_yolo8()
        elif self.backend == "detr":
            self._load_detr()
        else:
            raise ValueError(f"Unsupported backend '{self.backend}'. Use 'yolo8' or 'detr'.")

        self._log_label_support()

    def _load_yolo8(self):
        if importlib.util.find_spec("ultralytics") is None:
            raise RuntimeError("Missing dependency 'ultralytics'. Run: pip install -r requirements.txt")
        from ultralytics import YOLO

        logger.info(f"Loading YOLOv8 model: {self.model_id} on {self.device}")
        self.model = YOLO(self.model_id)
        try:
            self.model.to(self.device)
        except Exception:
            # Some setups auto-place model; keep fallback silent.
            pass

        names = getattr(self.model.model, "names", {}) or {}
        self.label_map = {int(k): str(v) for k, v in names.items()} if isinstance(names, dict) else {}

    def _load_detr(self):
        if importlib.util.find_spec("transformers") is None:
            raise RuntimeError("Missing dependency 'transformers'. Run: pip install -r requirements.txt")
        try:
            from transformers import DetrImageProcessor, DetrForObjectDetection

            logger.info(f"Loading DETR model: {self.model_id} on {self.device}")
            self.detr_processor = DetrImageProcessor.from_pretrained(self.model_id)
            self.model = DetrForObjectDetection.from_pretrained(self.model_id)
            self.model.to(self.device)
            self.model.eval()

            self.label_map = {
                int(k): str(v)
                for k, v in (self.model.config.id2label or {}).items()
            }
        except Exception as ex:
            logger.warning(
                "DETR backend unavailable in current environment (often torch/transformers mismatch). "
                f"Falling back to YOLOv8 pretrained model. Error: {ex}"
            )
            self.backend = "yolo8"
            # Use a known pretrained YOLOv8 checkpoint as safe fallback.
            self.model_id = "yolov8n.pt"
            self._load_yolo8()

    def _is_hazard(self, class_name: str) -> bool:
        label = class_name.strip().lower()
        if label in self.hazard_classes:
            return True
        return any(k in label for k in self.hazard_classes)

    def _log_label_support(self):
        names = {v.strip().lower() for v in self.label_map.values()}
        overlap = sorted(names.intersection(self.hazard_classes))
        if overlap:
            logger.info(f"[{self.backend}] model supports configured hazard labels: {overlap}")
        else:
            logger.warning(
                f"[{self.backend}] no overlap with configured hazard labels. "
                "Use custom hazard-trained weights/checkpoint for fire/smoke reliability."
            )

    def _predict_yolo8(self, frame) -> List[Dict]:
        detections: List[Dict] = []
        vehicle_boxes: List[List[int]] = []
        results = self.model.predict(
            source=frame,
            conf=self.confidence_threshold,
            imgsz=self.inference_size,
            verbose=False,
            device=self.device,
        )
        if not results:
            return detections

        r = results[0]
        boxes = getattr(r, "boxes", None)
        if boxes is None:
            return detections

        for b in boxes:
            cls_id = int(b.cls.item())
            conf = float(b.conf.item())
            xyxy = b.xyxy[0].tolist()
            class_name = self.label_map.get(cls_id, str(cls_id))
            bbox = [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]

            if class_name.strip().lower() in VEHICLE_LABELS:
                vehicle_boxes.append(bbox)

            if conf >= self.confidence_threshold and self._is_hazard(class_name):
                detections.append(
                    {
                        "bbox": bbox,
                        "confidence": conf,
                        "class_name": class_name,
                    }
                )

        if self.enable_pre_collision_detection:
            pre_collision_boxes = self._infer_pre_collision_vehicle_pair(vehicle_boxes)
            for box in pre_collision_boxes:
                detections.append(
                    {
                        "bbox": box,
                        "confidence": 0.58,
                        "class_name": "pre_collision",
                    }
                )

        if self.enable_vehicle_accident_fallback:
            accident_box = self._infer_accident_from_vehicle_layout(vehicle_boxes)
            if accident_box is not None:
                detections.append(
                    {
                        "bbox": accident_box,
                        "confidence": 0.60,
                        "class_name": "accident",
                    }
                )

        self._prev_vehicle_boxes = vehicle_boxes

        return detections

    def _infer_pre_collision_vehicle_pair(self, vehicle_boxes: List[List[int]]) -> List[List[int]]:
        """Detect two vehicles converging and near each other before impact."""
        if len(vehicle_boxes) < 2 or len(self._prev_vehicle_boxes) < 2:
            return []

        prev_pairs: Dict[tuple[int, int], float] = {}
        for i in range(len(self._prev_vehicle_boxes)):
            for j in range(i + 1, len(self._prev_vehicle_boxes)):
                a = self._prev_vehicle_boxes[i]
                b = self._prev_vehicle_boxes[j]
                acx, acy = self._box_center(a)
                bcx, bcy = self._box_center(b)
                prev_pairs[(i, j)] = ((acx - bcx) ** 2 + (acy - bcy) ** 2) ** 0.5

        best_pair = None
        best_score = -1e9
        for i in range(len(vehicle_boxes)):
            for j in range(i + 1, len(vehicle_boxes)):
                a = vehicle_boxes[i]
                b = vehicle_boxes[j]
                acx, acy = self._box_center(a)
                bcx, bcy = self._box_center(b)
                curr_dist = ((acx - bcx) ** 2 + (acy - bcy) ** 2) ** 0.5

                aw = max(1.0, float(a[2] - a[0]))
                bw = max(1.0, float(b[2] - b[0]))
                near_limit = self.pre_collision_distance_ratio * ((aw + bw) / 2.0)

                # Match each current box to closest previous box and compare pair distance trend.
                prev_i = self._closest_prev_index(a)
                prev_j = self._closest_prev_index(b, exclude_index=prev_i)
                if prev_i is None or prev_j is None or prev_i == prev_j:
                    continue

                key = (min(prev_i, prev_j), max(prev_i, prev_j))
                prev_dist = prev_pairs.get(key)
                if prev_dist is None:
                    continue

                closing = prev_dist - curr_dist
                if curr_dist <= near_limit and closing >= self.pre_collision_min_closing_px:
                    score = closing + max(0.0, near_limit - curr_dist)
                    if score > best_score:
                        best_score = score
                        best_pair = (a, b)

        if best_pair is None:
            return []

        a, b = best_pair
        return [a, b]

    def _closest_prev_index(self, box: List[int], exclude_index: Optional[int] = None) -> Optional[int]:
        if not self._prev_vehicle_boxes:
            return None

        cx, cy = self._box_center(box)
        best_idx = None
        best_dist = 1e18
        for idx, pbox in enumerate(self._prev_vehicle_boxes):
            if exclude_index is not None and idx == exclude_index:
                continue
            pcx, pcy = self._box_center(pbox)
            d = (cx - pcx) ** 2 + (cy - pcy) ** 2
            if d < best_dist:
                best_dist = d
                best_idx = idx

        return best_idx

    @staticmethod
    def _box_iou(a: List[int], b: List[int]) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        inter_x1 = max(ax1, bx1)
        inter_y1 = max(ay1, by1)
        inter_x2 = min(ax2, bx2)
        inter_y2 = min(ay2, by2)
        iw = max(0, inter_x2 - inter_x1)
        ih = max(0, inter_y2 - inter_y1)
        inter = float(iw * ih)
        if inter <= 0:
            return 0.0
        a_area = float(max(1, (ax2 - ax1) * (ay2 - ay1)))
        b_area = float(max(1, (bx2 - bx1) * (by2 - by1)))
        return inter / (a_area + b_area - inter)

    @staticmethod
    def _box_center(box: List[int]) -> tuple[float, float]:
        x1, y1, x2, y2 = box
        return ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

    def _infer_accident_from_vehicle_layout(self, vehicle_boxes: List[List[int]]) -> Optional[List[int]]:
        """Heuristic: close/overlapping vehicles suggest collision/accident."""
        if len(vehicle_boxes) < 2:
            return None

        # Find the strongest interacting pair (overlap or close centers).
        best_pair = None
        best_score = -1.0
        for i in range(len(vehicle_boxes)):
            for j in range(i + 1, len(vehicle_boxes)):
                a = vehicle_boxes[i]
                b = vehicle_boxes[j]
                iou = self._box_iou(a, b)
                acx, acy = self._box_center(a)
                bcx, bcy = self._box_center(b)
                dx = acx - bcx
                dy = acy - bcy
                center_dist = (dx * dx + dy * dy) ** 0.5
                # Normalize by average box width for scale invariance.
                aw = max(1, a[2] - a[0])
                bw = max(1, b[2] - b[0])
                norm_dist = center_dist / ((aw + bw) / 2.0)

                # Higher score = more likely collision interaction.
                score = iou + max(0.0, 1.2 - norm_dist)
                if score > best_score:
                    best_score = score
                    best_pair = (a, b)

        if best_pair is None or best_score < 0.45:
            return None

        a, b = best_pair
        x1 = max(0, min(a[0], b[0]) - 20)
        y1 = max(0, min(a[1], b[1]) - 20)
        x2 = max(a[2], b[2]) + 20
        y2 = max(a[3], b[3]) + 20
        return [int(x1), int(y1), int(x2), int(y2)]

    def _predict_detr(self, frame) -> List[Dict]:
        from PIL import Image

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb)

        inputs = self.detr_processor(images=pil_image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = self.model(**inputs)

        target_sizes = torch.tensor([pil_image.size[::-1]], device=self.device)
        processed = self.detr_processor.post_process_object_detection(
            outputs=outputs,
            threshold=self.confidence_threshold,
            target_sizes=target_sizes,
        )[0]

        detections: List[Dict] = []
        for score, label, box in zip(processed["scores"], processed["labels"], processed["boxes"]):
            class_name = self.label_map.get(int(label.item()), str(int(label.item())))
            if not self._is_hazard(class_name):
                continue
            x1, y1, x2, y2 = box.tolist()
            detections.append(
                {
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "confidence": float(score.item()),
                    "class_name": class_name,
                }
            )
        return detections

    def _predict(self, frame) -> List[Dict]:
        if self.backend == "yolo8":
            detections = self._predict_yolo8(frame)
        else:
            detections = self._predict_detr(frame)

        # Fallback for obvious flames when pretrained labels don't include fire.
        if self.enable_color_fire_fallback:
            detections.extend(self._predict_fire_color_fallback(frame))

        if self.enable_color_smoke_fallback:
            detections.extend(self._predict_smoke_color_fallback(frame))

        return detections

    def _predict_smoke_color_fallback(self, frame) -> List[Dict]:
        """Detect smoke-like gray plumes with low saturation and medium brightness."""
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        # Gray-ish smoke: low saturation, moderate value.
        smoke_mask = cv2.inRange(hsv, (0, 0, 45), (179, 60, 210))

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        smoke_mask = cv2.morphologyEx(smoke_mask, cv2.MORPH_OPEN, kernel)
        smoke_mask = cv2.morphologyEx(smoke_mask, cv2.MORPH_DILATE, kernel)

        contours, _ = cv2.findContours(smoke_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections: List[Dict] = []
        frame_area = float(frame.shape[0] * frame.shape[1])

        for c in contours:
            area = float(cv2.contourArea(c))
            if area < self.color_smoke_min_area:
                continue
            x, y, w, h = cv2.boundingRect(c)
            # Smoke usually occupies larger diffuse region; keep wide/tall blobs.
            if w < 20 or h < 20:
                continue
            conf = min(0.85, max(0.28, area / frame_area * 6.0))
            detections.append(
                {
                    "bbox": [int(x), int(y), int(x + w), int(y + h)],
                    "confidence": float(conf),
                    "class_name": "smoke",
                }
            )

        return detections

    def _predict_fire_color_fallback(self, frame) -> List[Dict]:
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Fire-like colors: red/orange/yellow ranges with high saturation/value.
        mask_red1 = cv2.inRange(hsv, (0, 120, 140), (15, 255, 255))
        mask_red2 = cv2.inRange(hsv, (160, 120, 140), (179, 255, 255))
        mask_orange = cv2.inRange(hsv, (15, 100, 140), (40, 255, 255))
        mask = cv2.bitwise_or(cv2.bitwise_or(mask_red1, mask_red2), mask_orange)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_DILATE, kernel)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections: List[Dict] = []
        frame_area = float(frame.shape[0] * frame.shape[1])

        for c in contours:
            area = float(cv2.contourArea(c))
            if area < self.color_fire_min_area:
                continue
            x, y, w, h = cv2.boundingRect(c)
            conf = min(0.95, max(0.30, area / frame_area * 8.0))
            detections.append(
                {
                    "bbox": [int(x), int(y), int(x + w), int(y + h)],
                    "confidence": float(conf),
                    "class_name": "fire",
                }
            )

        return detections

    @staticmethod
    def _annotate(frame, detections: List[Dict]):
        out = frame.copy()
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cv2.rectangle(out, (x1, y1), (x2, y2), (0, 0, 255), 3)
            class_name = str(det.get("class_name", "hazard")).replace("_", " ").title()
            label = f"{class_name} {det['confidence']:.2f}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            top = max(0, y1 - th - 10)
            cv2.rectangle(out, (x1, top), (x1 + tw + 8, y1), (0, 0, 255), -1)
            cv2.putText(out, label, (x1 + 4, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        if detections:
            cv2.rectangle(out, (0, 0), (out.shape[1], 40), (0, 0, 255), -1)
            cv2.putText(out, "HAZARD DETECTED", (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        return out

    @staticmethod
    def _categorize_label(class_name: str) -> str:
        label = class_name.strip().lower()
        if "fire" in label or "flame" in label:
            return "fire"
        if "smoke" in label:
            return "smoke"
        if "accident" in label or "crash" in label or "collision" in label or "pre_collision" in label:
            return "accident"
        return "other"

    def _categories_from_detections(self, detections: List[Dict]) -> List[str]:
        categories = {self._categorize_label(d["class_name"]) for d in detections}
        return sorted(categories)

    def _ensure_category_dirs(self, base_dir: str) -> Dict[str, Path]:
        base = Path(base_dir)
        base.mkdir(parents=True, exist_ok=True)
        out: Dict[str, Path] = {}
        for key, folder_name in HAZARD_CATEGORY_FOLDERS.items():
            p = base / folder_name
            p.mkdir(parents=True, exist_ok=True)
            out[key] = p
        return out

    def detect_in_image(self, image_path: str, save_dir: str = "detections/hazard_detections") -> Dict:
        img = cv2.imread(image_path)
        if img is None:
            return {"success": False, "error": f"Unable to read image: {image_path}"}

        detections = self._predict(img)
        annotated = self._annotate(img, detections)

        category_dirs = self._ensure_category_dirs(save_dir)
        categories = self._categories_from_detections(detections)
        if not categories:
            categories = ["other"]

        output_paths: List[str] = []
        for cat in categories:
            out_path = category_dirs[cat] / f"{Path(image_path).stem}_hazard.jpg"
            cv2.imwrite(str(out_path), annotated)
            output_paths.append(str(out_path))

        return {
            "success": True,
            "backend": self.backend,
            "model_id": self.model_id,
            "image_path": image_path,
            "categories": categories,
            "output_paths": output_paths,
            "detections": detections,
            "count": len(detections),
        }

    def _upload_to_cloudinary(self, local_path: Path) -> Optional[str]:
        """Upload event clip to Cloudinary with sanitized public ID."""
        if not hasattr(self, 'cloudinary_cfg'):
            return None
        
        if not bool(self.cloudinary_cfg.get("enabled", False)):
            return None

        cloud_name = str(self.cloudinary_cfg.get("cloud_name", "")).strip()
        api_key = str(self.cloudinary_cfg.get("api_key", "")).strip()
        api_secret = str(self.cloudinary_cfg.get("api_secret", "")).strip()
        folder = str(self.cloudinary_cfg.get("folder", "hazard-clips")).strip() or "hazard-clips"

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

    def detect_in_webcam(
        self,
        source=0,
        save_dir: str = "detections/hazard_detections",
        event_exit_grace_frames: int = 12,
        event_clip_fps: float = 8.0,
    ):
        cap = self._open_camera_source(source)
        if cap is None:
            logger.error(f"Unable to open camera source: {source}")
            return {"success": False, "error": f"Unable to open camera source: {source}"}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        clip_fps = float(max(1.0, min(60.0, event_clip_fps)))
        grace_frames = max(0, int(event_exit_grace_frames))
        category_dirs = self._ensure_category_dirs(save_dir)

        in_event = False
        event_writer = None
        event_temp_path = None
        frames_since_hazard = 0
        event_categories = set()
        event_start_ts = None
        event_end_ts = None
        event_clips: List[Dict] = []

        logger.info("Press 'q' to stop webcam hazard detection")
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            detections = self._predict(frame)
            annotated = self._annotate(frame, detections)

            if detections:
                detected_categories = self._categories_from_detections(detections)
                if not in_event:
                    in_event = True
                    frames_since_hazard = 0
                    event_categories = set(detected_categories)
                    event_start_ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                    event_end_ts = event_start_ts

                    tmp_dir = Path(save_dir) / "_event_tmp"
                    tmp_dir.mkdir(parents=True, exist_ok=True)
                    event_temp_path = tmp_dir / f"hazard_event_{event_start_ts}.mp4"
                    event_writer = self._create_mp4_writer(
                        str(event_temp_path),
                        clip_fps,
                        width,
                        height,
                    )
                    logger.warning(f"HAZARD EVENT STARTED -> {event_temp_path}")
                else:
                    event_categories.update(detected_categories)
                    event_end_ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")

                frames_since_hazard = 0
            elif in_event:
                frames_since_hazard += 1

            if in_event and event_writer is not None:
                event_writer.write(annotated)

                if frames_since_hazard > grace_frames:
                    event_writer.release()
                    event_writer = None

                    if not event_categories:
                        event_categories = {"other"}

                    output_paths: List[str] = []
                    for cat in sorted(event_categories):
                        target = category_dirs[cat] / f"hazard_event_{event_start_ts}.mp4"
                        shutil.copy2(str(event_temp_path), str(target))
                        output_paths.append(str(target))

                    event_clips.append(
                        {
                            "start": event_start_ts,
                            "end": event_end_ts,
                            "categories": sorted(event_categories),
                            "output_paths": output_paths,
                        }
                    )
                    logger.warning(f"HAZARD EVENT ENDED -> {output_paths}")

                    # Attempt Cloudinary upload
                    if output_paths:
                        for output_path in output_paths:
                            try:
                                upload_url = self._upload_to_cloudinary(Path(output_path))
                                if upload_url:
                                    logger.info(f"Uploaded to Cloudinary: {upload_url}")
                            except Exception as ex:
                                logger.warning(f"Cloudinary upload failed: {ex}")

                    try:
                        Path(event_temp_path).unlink(missing_ok=True)
                    except Exception:
                        pass

                    in_event = False
                    frames_since_hazard = 0
                    event_categories = set()
                    event_temp_path = None
                    event_start_ts = None
                    event_end_ts = None

            cv2.imshow("Hazard Detection", annotated)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

        if in_event and event_writer is not None:
            event_writer.release()
            if not event_categories:
                event_categories = {"other"}

            output_paths: List[str] = []
            for cat in sorted(event_categories):
                target = category_dirs[cat] / f"hazard_event_{event_start_ts}.mp4"
                shutil.copy2(str(event_temp_path), str(target))
                output_paths.append(str(target))

            event_clips.append(
                {
                    "start": event_start_ts,
                    "end": event_end_ts,
                    "categories": sorted(event_categories),
                    "output_paths": output_paths,
                }
            )

            # Attempt Cloudinary upload
            if output_paths:
                for output_path in output_paths:
                    try:
                        upload_url = self._upload_to_cloudinary(Path(output_path))
                        if upload_url:
                            logger.info(f"Uploaded to Cloudinary: {upload_url}")
                    except Exception as ex:
                        logger.warning(f"Cloudinary upload failed: {ex}")

            try:
                Path(event_temp_path).unlink(missing_ok=True)
            except Exception:
                pass

        cap.release()
        cv2.destroyAllWindows()
        return {"success": True, "event_clips": event_clips, "event_count": len(event_clips)}

    @staticmethod
    def _open_camera_source(source):
        """Open camera source with backend/index fallbacks (helpful on Windows)."""
        # For URL-based sources, direct open is usually correct.
        if isinstance(source, str) and not source.strip().isdigit():
            cap = cv2.VideoCapture(source)
            return cap if cap.isOpened() else None

        # Numeric camera sources: try common Windows backends and nearby indices.
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
                    logger.info(f"Opened webcam index {idx} with backend {backend}")
                    return cap
                if cap is not None:
                    cap.release()

        return None

    def detect_in_video(
        self,
        video_path: str,
        save_dir: str = "detections/hazard_detections",
        frame_skip: int = 1,
    ) -> Dict:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {"success": False, "error": f"Unable to open video: {video_path}"}

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
        fps = float(cap.get(cv2.CAP_PROP_FPS)) or 20.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        frame_skip = max(1, int(frame_skip))

        category_dirs = self._ensure_category_dirs(save_dir)
        out_path = Path(save_dir) / f"{Path(video_path).stem}_hazard.mp4"
        writer = self._create_mp4_writer(
            str(out_path),
            fps,
            width,
            height,
        )

        frame_idx = 0
        processed_frames = 0
        frames_with_hazard = 0
        total_detections = 0
        last_detections: List[Dict] = []
        video_categories = set()

        while True:
            ok, frame = cap.read()
            if not ok:
                break

            if frame_idx % frame_skip == 0:
                detections = self._predict(frame)
                last_detections = detections
                processed_frames += 1
            else:
                detections = last_detections

            if detections:
                frames_with_hazard += 1
                total_detections += len(detections)
                video_categories.update(self._categories_from_detections(detections))

            annotated = self._annotate(frame, detections)
            writer.write(annotated)

            frame_idx += 1
            if frame_idx % 60 == 0 and total_frames > 0:
                logger.info(f"Processed {frame_idx}/{total_frames} frames")

        cap.release()
        writer.release()

        if not video_categories:
            video_categories = {"other"}

        output_paths: List[str] = []
        for cat in sorted(video_categories):
            target = category_dirs[cat] / out_path.name
            shutil.copy2(out_path, target)
            output_paths.append(str(target))

        # Attempt Cloudinary upload for all detected videos
        for output_path in output_paths:
            try:
                upload_url = self._upload_to_cloudinary(Path(output_path))
                if upload_url:
                    logger.info(f"Uploaded to Cloudinary: {upload_url}")
            except Exception as ex:
                logger.warning(f"Cloudinary upload failed: {ex}")

        return {
            "success": True,
            "backend": self.backend,
            "model_id": self.model_id,
            "video_path": video_path,
            "categories": sorted(video_categories),
            "output_paths": output_paths,
            "total_frames": total_frames,
            "processed_frames": processed_frames,
            "frames_with_hazard": frames_with_hazard,
            "total_detections": total_detections,
        }


def load_config() -> Dict:
    script_dir = Path(__file__).resolve().parent
    cfg_path = script_dir / "config.yaml"
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


if __name__ == "__main__":
    cfg = load_config()
    model_cfg = cfg.get("model", {})
    detection_cfg = cfg.get("detection", {})
    webcam_cfg = cfg.get("webcam", {})
    output_cfg = cfg.get("output", {})

    device_cfg = model_cfg.get("device", "auto")
    if device_cfg == "auto":
        device_cfg = "cuda" if torch.cuda.is_available() else "cpu"

    backend = str(model_cfg.get("backend", "yolo8")).strip().lower()
    model_id = model_cfg.get("model_id")
    if not model_id:
        if backend == "detr":
            model_id = "facebook/detr-resnet-50"
        else:
            model_id = model_cfg.get("weights_path") or "yolov8n.pt"

    detector = HazardDetector(
        backend=backend,
        model_id=model_id,
        confidence_threshold=float(detection_cfg.get("confidence_threshold", 0.25)),
        device=device_cfg,
        hazard_classes=detection_cfg.get("hazard_classes"),
        inference_size=int(detection_cfg.get("inference_size", 832)),
        enable_color_fire_fallback=bool(detection_cfg.get("enable_color_fire_fallback", True)),
        color_fire_min_area=int(detection_cfg.get("color_fire_min_area", 900)),
        enable_color_smoke_fallback=bool(detection_cfg.get("enable_color_smoke_fallback", True)),
        color_smoke_min_area=int(detection_cfg.get("color_smoke_min_area", 1400)),
        enable_vehicle_accident_fallback=bool(detection_cfg.get("enable_vehicle_accident_fallback", True)),
        enable_pre_collision_detection=bool(detection_cfg.get("enable_pre_collision_detection", True)),
        pre_collision_distance_ratio=float(detection_cfg.get("pre_collision_distance_ratio", 1.55)),
        pre_collision_min_closing_px=float(detection_cfg.get("pre_collision_min_closing_px", 8.0)),
    )
    
    # Attach Cloudinary config
    detector.cloudinary_cfg = cfg.get("cloudinary", {})

    print("1. Detect in image")
    print("2. Detect in webcam")
    print("3. Detect in video")
    choice = _safe_input("Enter choice (1-3) [default 2]: ", "2")

    if choice == "1":
        image_path = _safe_input("Image path: ", "")
        save_dir = output_cfg.get("save_directory", "detections/hazard_detections")
        result = detector.detect_in_image(image_path, save_dir=save_dir)
        print(result)
    elif choice == "2":
        src = webcam_cfg.get("source", 0)
        src_in = _safe_input(f"Camera source [default {src}]: ", str(src))
        source = src_in if src_in else src
        if isinstance(source, str) and source.isdigit():
            source = int(source)
        save_dir = output_cfg.get("save_directory", "detections/hazard_detections")
        grace = int(webcam_cfg.get("event_exit_grace_frames", 12))
        clip_fps = float(webcam_cfg.get("event_clip_fps", 8.0))
        result = detector.detect_in_webcam(
            source=source,
            save_dir=save_dir,
            event_exit_grace_frames=grace,
            event_clip_fps=clip_fps,
        )
        print(result)
    elif choice == "3":
        video_path = _safe_input("Video path: ", "")
        frame_skip = int(_safe_input("Frame skip [default 1]: ", "1"))
        save_dir = output_cfg.get("save_directory", "detections/hazard_detections")
        result = detector.detect_in_video(video_path, save_dir=save_dir, frame_skip=frame_skip)
        print(result)
    else:
        print("Invalid choice")

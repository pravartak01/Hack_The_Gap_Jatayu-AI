"""
Weapon Detection System using YOLOv5
This script provides weapon detection capabilities using the YOLOv5 model.
Focus on reducing false positives while maintaining good recall.
"""

import torch
import cv2
import numpy as np
import importlib.util
import os
import sys
import subprocess
import warnings
import time
import hashlib
from pathlib import Path
from typing import List, Tuple, Dict, Optional, Union
import logging
from datetime import datetime
import json
import yaml
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Silence repeated deprecation warnings emitted inside cached YOLOv5 internals.
warnings.filterwarnings(
    "ignore",
    category=FutureWarning,
    message=r"`torch\.cuda\.amp\.autocast\(args\.\.\.\)` is deprecated.*"
)


DEFAULT_WEAPON_LABELS = {
    'weapon',
    'knife',
    'scissors',
    'baseball bat',
    'gun',
    'handgun',
    'long gun',
    'machine gun',
    'smg',
    'assault rifle',
    'sniper',
    'carbine',
    'ak47',
    'ar15',
    'pistol',
    'rifle',
    'shotgun',
    'firearm',
    'revolver',
    'sword',
    'dagger',
    'machete',
    'axe',
    'grenade',
    'spear',
    'bow',
    'arrow',
    'crossbow',
    'taser',
}


class WeaponDetector:
    """
    Weapon detection model using YOLOv5.
    
    Args:
        model_name: YOLOv5 model size ('n', 's', 'm', 'l', 'x')
        model_weights: Optional path to custom YOLOv5 .pt model (recommended for firearm detection)
        confidence_threshold: Minimum confidence score (0.0 to 1.0)
        device: 'cuda' for GPU, 'cpu' for CPU
        detection_mode: 'all' to show all classes, 'weapon_only' to filter only weapon labels
        weapon_classes: Optional list of weapon labels to keep (lower/upper case allowed)
        alert_banner: Show an alert banner when a weapon-like class is detected
    """
    
    def __init__(
        self,
        model_name: str = 's',
        model_weights: Optional[str] = None,
        confidence_threshold: float = 0.5,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
        detection_mode: str = 'all',
        weapon_classes: Optional[List[str]] = None,
        alert_banner: bool = True,
        alerting_enabled: bool = False,
        alert_webhook_url: Optional[str] = None,
        alert_cooldown_seconds: float = 2.0,
        source_name: str = 'local-camera',
        stream_enabled: bool = False,
        stream_frame_url: Optional[str] = None,
        stream_fps: float = 8.0,
        stream_jpeg_quality: int = 75,
        cloudinary_enabled: bool = False,
        cloudinary_cloud_name: Optional[str] = None,
        cloudinary_api_key: Optional[str] = None,
        cloudinary_api_secret: Optional[str] = None,
        cloudinary_folder: str = 'weapon-detection-clips',
        image_inference_size: int = 960,
        video_inference_size: int = 832,
        webcam_inference_size: int = 832,
        use_tta: bool = False
    ):
        """Initialize the weapon detector."""
        self.confidence_threshold = confidence_threshold
        self.device = device
        self.model_name = model_name
        self.model_weights = model_weights
        self.detection_mode = detection_mode
        self.alert_banner = alert_banner
        self.alerting_enabled = alerting_enabled
        self.alert_webhook_url = alert_webhook_url
        self.alert_cooldown_seconds = max(0.0, float(alert_cooldown_seconds))
        self.source_name = source_name
        self.stream_enabled = stream_enabled
        self.stream_frame_url = stream_frame_url
        self.stream_fps = max(0.1, float(stream_fps))
        self.stream_jpeg_quality = int(max(30, min(95, stream_jpeg_quality)))
        self.cloudinary_enabled = bool(cloudinary_enabled)
        self.cloudinary_cloud_name = cloudinary_cloud_name
        self.cloudinary_api_key = cloudinary_api_key
        self.cloudinary_api_secret = cloudinary_api_secret
        self.cloudinary_folder = (cloudinary_folder or 'weapon-detection-clips').strip()
        self.image_inference_size = int(max(320, image_inference_size))
        self.video_inference_size = int(max(320, video_inference_size))
        self.webcam_inference_size = int(max(320, webcam_inference_size))
        self.use_tta = bool(use_tta)
        self._last_alert_sent_at = 0.0
        self._last_stream_sent_at = 0.0
        self.weapon_classes = {
            c.strip().lower() for c in (weapon_classes or list(DEFAULT_WEAPON_LABELS)) if c and c.strip()
        }
        
        logger.info(f"Loading YOLOv5 model: {model_name}")
        logger.info(f"Using device: {self.device}")
        logger.info(f"Detection mode: {self.detection_mode}")
        logger.info(f"Alert banner: {self.alert_banner}")
        logger.info(f"Webhook alerting: {self.alerting_enabled}")
        if self.alert_webhook_url:
            logger.info(f"Alert webhook URL: {self.alert_webhook_url}")
        logger.info(f"Live stream push: {self.stream_enabled}")
        if self.stream_frame_url:
            logger.info(f"Stream frame URL: {self.stream_frame_url}")
        logger.info(f"Cloudinary upload: {self.cloudinary_enabled}")
        if self.cloudinary_enabled and self.cloudinary_cloud_name:
            logger.info(f"Cloudinary cloud: {self.cloudinary_cloud_name}")
        logger.info(
            f"Inference sizes (img/video/webcam): "
            f"{self.image_inference_size}/{self.video_inference_size}/{self.webcam_inference_size}"
        )
        logger.info(f"TTA enabled: {self.use_tta}")
        if self.model_weights:
            logger.info(f"Using custom model weights: {self.model_weights}")
        
        # Load YOLOv5 model
        try:
            self._ensure_runtime_dependencies()
            # Prevent broken Windows shell auto-update command inside YOLOv5 dependency checks.
            os.environ['YOLOv5_AUTOINSTALL'] = '0'
            os.environ['YOLOv5_VERBOSE'] = '0'
            if importlib.util.find_spec('ultralytics') is None:
                raise ModuleNotFoundError("No module named 'ultralytics'", name='ultralytics')

            if self.model_weights:
                self.model = torch.hub.load(
                    'ultralytics/yolov5',
                    'custom',
                    path=self.model_weights,
                    force_reload=False
                )
            else:
                self.model = torch.hub.load('ultralytics/yolov5', f'yolov5{model_name}')

            self.model.to(self.device)
            self.model.conf = confidence_threshold
            logger.info(f"Model loaded successfully. Confidence threshold: {self.confidence_threshold}")
            self._log_weapon_class_coverage()
            self._log_firearm_support_warning()
        except ModuleNotFoundError as e:
            if e.name == 'ultralytics':
                logger.error("Failed to load model: missing 'ultralytics' package")
                logger.error("Install dependencies with: pip install -r requirements.txt")
                raise RuntimeError(
                    "Missing dependency 'ultralytics'. Run: pip install -r requirements.txt"
                ) from e
            logger.error(f"Failed to load model: {e}")
            raise

    def _ensure_runtime_dependencies(self):
        """Install critical runtime dependencies in the current interpreter if missing."""
        missing = []
        for package_name in ('requests', 'urllib3'):
            if importlib.util.find_spec(package_name) is None:
                missing.append(package_name)

        if not missing:
            return

        logger.info(f"Installing missing runtime dependencies: {missing}")
        cmd = [
            sys.executable,
            '-m',
            'pip',
            'install',
            '--disable-pip-version-check',
            'requests>=2.32.2',
            'urllib3>=2.6.0',
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            logger.info("Runtime dependencies installed successfully")
        except Exception as e:
            logger.warning(f"Could not auto-install runtime dependencies: {e}")

    def _is_weapon_label(self, class_name: str) -> bool:
        """Check whether a predicted class should be treated as a weapon."""
        label = class_name.strip().lower()
        if label in self.weapon_classes:
            return True
        return any(keyword in label for keyword in self.weapon_classes)

    def _log_weapon_class_coverage(self):
        """Log overlap between configured weapon labels and model labels."""
        try:
            model_labels = {str(name).strip().lower() for name in self.model.names.values()}
            overlap = sorted(model_labels.intersection(self.weapon_classes))
            logger.info(f"Configured weapon labels: {sorted(self.weapon_classes)}")
            if overlap:
                logger.info(f"Model supports these configured weapon labels: {overlap}")
            else:
                logger.warning(
                    "No direct overlap between configured weapon labels and model labels. "
                    "If this is a COCO model, expected labels usually include 'knife', 'scissors', and 'baseball bat'."
                )
        except Exception as e:
            logger.warning(f"Unable to check weapon class coverage: {e}")

    def _log_firearm_support_warning(self):
        """Warn when model labels do not include firearm classes."""
        try:
            model_labels = {str(name).strip().lower() for name in self.model.names.values()}
            firearm_labels = {
                'gun', 'handgun', 'pistol', 'rifle', 'shotgun',
                'firearm', 'revolver', 'machine gun', 'assault rifle'
            }
            if model_labels.intersection(firearm_labels):
                logger.info("Model label set includes firearm classes")
            else:
                logger.warning(
                    "Current model label set does not include firearm classes. "
                    "Gun detection will be weak or absent unless you use custom weapon-trained weights."
                )
        except Exception as e:
            logger.warning(f"Unable to check firearm class support: {e}")

    def _get_weapon_detections(self, detections: List[Dict]) -> List[Dict]:
        """Return detections that match weapon labels."""
        return [det for det in detections if self._is_weapon_label(det['class_name'])]

    def _build_alert_text(self, weapon_detections: List[Dict]) -> str:
        """Build short alert text."""
        if not weapon_detections:
            return ""
        return "ALERT DETECTED"

    def _send_alert(
        self,
        source_type: str,
        weapon_detections: List[Dict],
        extra: Optional[Dict] = None,
        bypass_cooldown: bool = False
    ):
        """Send weapon alert to configured webhook endpoint with cooldown protection."""
        if not self.alerting_enabled or not self.alert_webhook_url or not weapon_detections:
            return

        now = time.time()
        if (not bypass_cooldown) and (now - self._last_alert_sent_at < self.alert_cooldown_seconds):
            return

        labels = sorted({det['class_name'] for det in weapon_detections})
        confidences = [float(det['confidence']) for det in weapon_detections]

        payload = {
            'timestamp': datetime.now().isoformat(),
            'source_name': self.source_name,
            'source_type': source_type,
            'alert': 'ALERT DETECTED',
            'weapon_labels': labels,
            'max_confidence': max(confidences) if confidences else 0.0,
            'count': len(weapon_detections),
            'detections': weapon_detections,
        }
        if extra:
            payload.update(extra)

        try:
            requests.post(self.alert_webhook_url, json=payload, timeout=3)
            self._last_alert_sent_at = now
            logger.warning(f"Alert sent to webhook: labels={labels}")
        except Exception as e:
            logger.warning(f"Failed to send alert webhook: {e}")

    def _send_stream_frame(self, frame: np.ndarray):
        """Push current annotated frame to stream endpoint at configured fps."""
        if not self.stream_enabled or not self.stream_frame_url:
            return

        now = time.time()
        min_interval = 1.0 / self.stream_fps
        if now - self._last_stream_sent_at < min_interval:
            return

        ok, encoded = cv2.imencode(
            '.jpg',
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), self.stream_jpeg_quality]
        )
        if not ok:
            return

        try:
            requests.post(
                self.stream_frame_url,
                data=encoded.tobytes(),
                headers={'Content-Type': 'image/jpeg'},
                timeout=0.2,
            )
            self._last_stream_sent_at = now
        except Exception:
            # Keep stream best-effort and throttle retries when server is unavailable.
            self._last_stream_sent_at = now

    def _upload_clip_to_cloudinary(self, clip_path: str) -> Optional[Dict]:
        """Upload an event clip to Cloudinary and return upload metadata."""
        if not self.cloudinary_enabled:
            return None
        if not all([self.cloudinary_cloud_name, self.cloudinary_api_key, self.cloudinary_api_secret]):
            logger.warning("Cloudinary enabled but credentials are incomplete; skipping upload")
            return None

        file_path = Path(clip_path)
        if not file_path.exists():
            logger.warning(f"Cloudinary upload skipped: clip not found {clip_path}")
            return None

        timestamp = int(time.time())
        public_id = f"{file_path.stem}_{timestamp}"
        sign_params = {
            'folder': self.cloudinary_folder,
            'public_id': public_id,
            'timestamp': timestamp,
        }
        string_to_sign = "&".join(f"{k}={sign_params[k]}" for k in sorted(sign_params.keys()))
        signature = hashlib.sha1((string_to_sign + self.cloudinary_api_secret).encode('utf-8')).hexdigest()

        endpoint = f"https://api.cloudinary.com/v1_1/{self.cloudinary_cloud_name}/video/upload"
        data = {
            'api_key': self.cloudinary_api_key,
            'timestamp': timestamp,
            'signature': signature,
            'folder': self.cloudinary_folder,
            'public_id': public_id,
            'resource_type': 'video',
        }

        try:
            with open(file_path, 'rb') as clip_file:
                response = requests.post(endpoint, data=data, files={'file': clip_file}, timeout=45)
            if response.status_code >= 400:
                logger.warning(f"Cloudinary upload failed ({response.status_code}): {response.text[:300]}")
                return None

            payload = response.json()
            secure_url = payload.get('secure_url')
            if not secure_url:
                logger.warning("Cloudinary upload succeeded but secure_url missing")
                return None

            logger.info(f"Cloudinary upload complete: {secure_url}")
            return {
                'cloudinary_url': secure_url,
                'cloudinary_public_id': payload.get('public_id'),
                'cloudinary_bytes': payload.get('bytes'),
                'cloudinary_duration': payload.get('duration'),
                'cloudinary_format': payload.get('format'),
            }
        except Exception as e:
            logger.warning(f"Cloudinary upload error: {e}")
            return None

    def _save_alert_snapshot(
        self,
        frame: np.ndarray,
        detections: List[Dict],
        source_type: str,
        frame_index: Optional[int] = None,
        save_dir: str = 'detections'
    ) -> Dict[str, str]:
        """Save an alert snapshot in detections folder and return path metadata."""
        alerts_dir = Path(save_dir) / 'alerts' / source_type
        alerts_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        suffix = f"_f{frame_index}" if frame_index is not None else ""
        filename = f"alert_{timestamp}{suffix}.jpg"
        output_path = alerts_dir / filename

        annotated = self._annotate_image(frame, detections)
        cv2.imwrite(str(output_path), annotated)

        relpath = output_path.relative_to(Path(save_dir)).as_posix()
        return {
            'alert_image_path': str(output_path),
            'alert_image_relpath': relpath,
        }
    
    def detect_in_image(
        self,
        image_path: str,
        save_result: bool = True,
        save_dir: str = 'detections'
    ) -> Dict:
        """
        Detect weapons in a single image.
        
        Args:
            image_path: Path to the image file
            save_result: Whether to save the annotated image
            save_dir: Directory to save results
        
        Returns:
            Dictionary containing detection results
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Failed to read image: {image_path}")
                return {'error': 'Failed to read image', 'detections': []}
            
            logger.info(f"Processing image: {image_path}")
            
            # Run inference
            results = self.model(
                img,
                size=self.image_inference_size,
                augment=self.use_tta
            )
            
            # Parse results
            detections = self._parse_results(results, img.shape)
            weapon_detections = self._get_weapon_detections(detections)
            alert_triggered = len(weapon_detections) > 0
            
            logger.info(f"Detected {len(detections)} weapon(s)")
            if alert_triggered:
                logger.warning(self._build_alert_text(weapon_detections))
                self._send_alert(
                    source_type='image',
                    weapon_detections=weapon_detections,
                    extra={'image_path': image_path}
                )
            
            # Save annotated image if requested
            if save_result and len(detections) > 0:
                Path(save_dir).mkdir(exist_ok=True)
                output_path = self._save_annotated_image(
                    img, detections, image_path, save_dir
                )
                logger.info(f"Annotated image saved: {output_path}")
            
            return {
                'image_path': image_path,
                'detections': detections,
                'weapon_detections': weapon_detections,
                'alert_triggered': alert_triggered,
                'num_detections': len(detections),
                'success': True
            }
        
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {'error': str(e), 'detections': []}
    
    def detect_in_video(
        self,
        video_path: str,
        save_result: bool = True,
        save_dir: str = 'detections',
        frame_skip: int = 1,
        confidence_threshold: Optional[float] = None
    ) -> Dict:
        """
        Detect weapons in video frames.
        
        Args:
            video_path: Path to the video file
            save_result: Whether to save the output video
            save_dir: Directory to save results
            frame_skip: Process every nth frame (1 = every frame)
        
        Returns:
            Dictionary containing detection results
        """
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                logger.error(f"Failed to open video: {video_path}")
                return {'error': 'Failed to open video', 'detections': []}
            
            logger.info(f"Processing video: {video_path}")
            
            # Video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            frame_skip = max(1, int(frame_skip))

            # Optional per-video confidence override (useful for harder scenes).
            old_conf = self.model.conf
            old_threshold = self.confidence_threshold
            if confidence_threshold is not None:
                self.model.conf = float(confidence_threshold)
                self.confidence_threshold = float(confidence_threshold)
                logger.info(f"Video confidence threshold set to {self.model.conf}")

            if frame_skip > 1:
                logger.warning(
                    f"frame_skip={frame_skip} may miss short weapon appearances. "
                    "Use frame_skip=1 for best detection quality."
                )
            
            # Setup video writer if saving results
            out = None
            if save_result:
                Path(save_dir).mkdir(exist_ok=True)
                output_path = self._get_output_path(video_path, save_dir, extension='.mp4')
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            all_detections = []
            alert_frames = 0
            alert_classes: Dict[str, int] = {}
            frame_count = 0
            processed_frames = 0
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every nth frame
                if frame_count % frame_skip == 0:
                    results = self.model(
                        frame,
                        size=self.video_inference_size,
                        augment=self.use_tta
                    )
                    detections = self._parse_results(results, frame.shape)
                    weapon_detections = self._get_weapon_detections(detections)
                    
                    if len(detections) > 0:
                        all_detections.append({
                            'frame': frame_count,
                            'detections': detections
                        })

                    if weapon_detections:
                        alert_frames += 1
                        for det in weapon_detections:
                            name = det['class_name']
                            alert_classes[name] = alert_classes.get(name, 0) + 1
                        if frame_count % 30 == 0:
                            logger.warning(
                                f"ALERT frame {frame_count}: weapon classes {sorted({d['class_name'] for d in weapon_detections})}"
                            )
                    
                    # Annotate and write frame
                    if out is not None:
                        annotated_frame = self._annotate_image(frame, detections)
                        out.write(annotated_frame)
                    
                    processed_frames += 1
                
                elif out is not None:
                    out.write(frame)
                
                frame_count += 1
                
                if frame_count % 30 == 0:
                    logger.info(f"Processed {frame_count}/{total_frames} frames")
            
            cap.release()
            if out is not None:
                out.release()
                logger.info(f"Output video saved: {output_path}")

            # Restore global threshold after video processing.
            self.model.conf = old_conf
            self.confidence_threshold = old_threshold
            
            logger.info(f"Video processing complete. Total detections: {len(all_detections)}")
            if alert_frames > 0:
                logger.warning(f"ALERT summary: {alert_frames} frame(s) with weapons, classes={alert_classes}")
                representative = [
                    {'class_name': label, 'confidence': 1.0}
                    for label in sorted(alert_classes.keys())
                ]
                self._send_alert(
                    source_type='video',
                    weapon_detections=representative,
                    extra={
                        'video_path': video_path,
                        'alert_frames': alert_frames,
                        'alert_classes': alert_classes,
                    }
                )
            
            return {
                'video_path': video_path,
                'total_frames': total_frames,
                'processed_frames': processed_frames,
                'frames_with_detections': len(all_detections),
                'alert_triggered': alert_frames > 0,
                'alert_frames': alert_frames,
                'alert_classes': alert_classes,
                'detections': all_detections,
                'success': True
            }
        
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            return {'error': str(e), 'detections': []}
    
    def detect_in_webcam(
        self,
        duration: Optional[int] = None,
        confidence_threshold: Optional[float] = None,
        save_result: bool = False,
        save_dir: str = 'detections',
        event_exit_grace_frames: int = 12,
        event_clip_fps: float = 8.0,
        camera_source: Union[int, str] = 0,
        process_every_n_frames: int = 1
    ) -> Dict:
        """
        Detect weapons from webcam feed.
        
        Args:
            duration: Duration to capture in seconds (None for continuous until q)
            confidence_threshold: Optional confidence threshold override for webcam session
            save_result: Whether to save annotated webcam video
            save_dir: Directory to save webcam output
            event_exit_grace_frames: Number of non-weapon frames to wait before closing an event clip
            event_clip_fps: Playback FPS for saved weapon event clips
            camera_source: Camera source index (0,1,...) or IP stream URL
            process_every_n_frames: Run model every Nth frame for smoother preview
        
        Returns:
            Dictionary containing detection statistics
        """
        try:
            if isinstance(camera_source, str) and camera_source.strip().isdigit():
                camera_source = int(camera_source.strip())

            cap = cv2.VideoCapture(camera_source)
            if not cap.isOpened():
                logger.error(f"Failed to open camera source: {camera_source}")
                return {
                    'error': f'Failed to open camera source: {camera_source}',
                    'detections': []
                }
            
            if duration is None:
                logger.info(f"Capturing from source={camera_source} continuously. Press 'q' to stop.")
            else:
                logger.info(f"Capturing from source={camera_source} for {duration} seconds")

            old_conf = self.model.conf
            old_threshold = self.confidence_threshold
            if confidence_threshold is not None:
                self.model.conf = float(confidence_threshold)
                self.confidence_threshold = float(confidence_threshold)
                logger.info(f"Webcam confidence threshold set to {self.model.conf}")

            out = None
            output_path = None
            if save_result:
                Path(save_dir).mkdir(exist_ok=True)
                output_path = self._get_output_path('webcam.mp4', save_dir, extension='.mp4')
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
                fps = int(cap.get(cv2.CAP_PROP_FPS)) or 20
                fourcc = cv2.VideoWriter_fourcc(*'mp4v')
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            detections_count = 0
            frames_with_detections = 0
            alert_frames = 0
            frame_count = 0
            processed_inference_frames = 0
            class_counts: Dict[str, int] = {}
            alert_classes: Dict[str, int] = {}
            event_videos: List[Dict] = []
            in_event = False
            event_writer = None
            event_video_path = None
            event_video_relpath = None
            current_event_id = None
            event_start_frame = 0
            event_end_frame = 0
            event_label_counts: Dict[str, int] = {}
            frames_since_weapon = 0
            process_every_n_frames = max(1, int(process_every_n_frames))
            last_detections: List[Dict] = []
            last_weapon_detections: List[Dict] = []
            start_time = datetime.now()
            
            while True:
                if duration is not None and (datetime.now() - start_time).seconds >= duration:
                    break
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % process_every_n_frames == 0:
                    results = self.model(
                        frame,
                        size=self.webcam_inference_size,
                        augment=self.use_tta
                    )
                    detections = self._parse_results(results, frame.shape)
                    weapon_detections = self._get_weapon_detections(detections)
                    last_detections = detections
                    last_weapon_detections = weapon_detections
                    detections_count += len(detections)
                    processed_inference_frames += 1
                    if detections:
                        frames_with_detections += 1
                        for det in detections:
                            class_name = det['class_name']
                            class_counts[class_name] = class_counts.get(class_name, 0) + 1
                        if frame_count % 10 == 0:
                            unique_labels = sorted({d['class_name'] for d in detections})
                            logger.info(f"Frame {frame_count}: detected {unique_labels}")
                else:
                    detections = last_detections
                    weapon_detections = last_weapon_detections

                if weapon_detections:
                    alert_frames += 1
                    for det in weapon_detections:
                        class_name = det['class_name']
                        alert_classes[class_name] = alert_classes.get(class_name, 0) + 1
                        event_label_counts[class_name] = event_label_counts.get(class_name, 0) + 1

                    if not in_event:
                        in_event = True
                        frames_since_weapon = 0
                        event_start_frame = frame_count
                        event_end_frame = frame_count
                        event_label_counts = {det['class_name']: 1 for det in weapon_detections}

                        event_dir = Path(save_dir) / 'weapon_detections'
                        event_dir.mkdir(parents=True, exist_ok=True)
                        event_name = f"weapon_event_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.mp4"
                        event_path = event_dir / event_name
                        event_video_path = str(event_path)
                        event_video_relpath = event_path.relative_to(Path(save_dir)).as_posix()
                        current_event_id = event_path.stem

                        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
                        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
                        clip_fps = float(max(1.0, min(60.0, event_clip_fps)))
                        event_writer = self._create_mp4_writer(event_video_path, clip_fps, width, height)
                        logger.warning(f"ALERT EVENT STARTED at frame {frame_count} -> {event_video_path}")

                    if frame_count % 10 == 0:
                        logger.warning(
                            f"ALERT frame {frame_count}: weapon classes {sorted({d['class_name'] for d in weapon_detections})}"
                        )
                    frames_since_weapon = 0
                    event_end_frame = frame_count
                elif in_event:
                    frames_since_weapon += 1
                
                # Annotate and display
                annotated_frame = self._annotate_image(frame, detections)
                cv2.putText(
                    annotated_frame,
                    f"mode={self.detection_mode} det={len(detections)}",
                    (10, 28),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 255),
                    2
                )
                cv2.imshow('Weapon Detection', annotated_frame)

                if out is not None:
                    out.write(annotated_frame)

                self._send_stream_frame(annotated_frame)

                if in_event and event_writer is not None:
                    event_writer.write(annotated_frame)

                    if frames_since_weapon > max(0, int(event_exit_grace_frames)):
                        event_writer.release()
                        event_writer = None

                        labels = sorted(event_label_counts.keys())
                        representative = [
                            {'class_name': lbl, 'confidence': 1.0}
                            for lbl in labels
                        ]
                        base_extra = {
                            'event': 'weapon_event_clip',
                            'event_id': current_event_id,
                            'start_frame': event_start_frame,
                            'end_frame': event_end_frame,
                            'alert_video_path': event_video_path,
                            'alert_video_relpath': event_video_relpath,
                            'alert_classes': event_label_counts,
                        }

                        cloudinary_meta = self._upload_clip_to_cloudinary(event_video_path) or {}
                        if cloudinary_meta.get('cloudinary_url'):
                            base_extra.update({
                                'cloudinary_video_url': cloudinary_meta.get('cloudinary_url'),
                                'cloudinary_public_id': cloudinary_meta.get('cloudinary_public_id'),
                            })

                        self._send_alert(
                            source_type='webcam',
                            weapon_detections=representative,
                            extra=base_extra,
                            bypass_cooldown=True,
                        )
                        event_videos.append({
                            'path': event_video_path,
                            'relpath': event_video_relpath,
                            'start_frame': event_start_frame,
                            'end_frame': event_end_frame,
                            'classes': dict(event_label_counts),
                        })
                        logger.warning(
                            f"ALERT EVENT ENDED at frame {event_end_frame} -> {event_video_path}"
                        )
                        in_event = False
                        frames_since_weapon = 0
                        event_video_path = None
                        event_video_relpath = None
                        current_event_id = None
                        event_label_counts = {}
                
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
                frame_count += 1
            
            cap.release()
            if out is not None:
                out.release()
                logger.info(f"Webcam output video saved: {output_path}")

            if in_event and event_writer is not None:
                event_writer.release()
                labels = sorted(event_label_counts.keys())
                representative = [
                    {'class_name': lbl, 'confidence': 1.0}
                    for lbl in labels
                ]
                base_extra = {
                    'event': 'weapon_event_clip',
                    'event_id': current_event_id,
                    'start_frame': event_start_frame,
                    'end_frame': event_end_frame,
                    'alert_video_path': event_video_path,
                    'alert_video_relpath': event_video_relpath,
                    'alert_classes': event_label_counts,
                }

                cloudinary_meta = self._upload_clip_to_cloudinary(event_video_path) or {}
                if cloudinary_meta.get('cloudinary_url'):
                    base_extra.update({
                        'cloudinary_video_url': cloudinary_meta.get('cloudinary_url'),
                        'cloudinary_public_id': cloudinary_meta.get('cloudinary_public_id'),
                    })

                self._send_alert(
                    source_type='webcam',
                    weapon_detections=representative,
                    extra=base_extra,
                    bypass_cooldown=True,
                )
                event_videos.append({
                    'path': event_video_path,
                    'relpath': event_video_relpath,
                    'start_frame': event_start_frame,
                    'end_frame': event_end_frame,
                    'classes': dict(event_label_counts),
                })

            cv2.destroyAllWindows()

            self.model.conf = old_conf
            self.confidence_threshold = old_threshold
            
            logger.info(
                f"Capture complete. Frames: {frame_count}, "
                f"Frames with detections: {frames_with_detections}, Total detections: {detections_count}"
            )
            if class_counts:
                logger.info(f"Webcam class counts: {class_counts}")
            if alert_frames > 0:
                logger.warning(f"ALERT summary: {alert_frames} frame(s) with weapons, classes={alert_classes}")
            
            return {
                'camera_source': camera_source,
                'frames_captured': frame_count,
                'processed_inference_frames': processed_inference_frames,
                'frames_with_detections': frames_with_detections,
                'alert_triggered': alert_frames > 0,
                'alert_frames': alert_frames,
                'alert_classes': alert_classes,
                'event_videos': event_videos,
                'total_detections': detections_count,
                'class_counts': class_counts,
                'output_video': output_path,
                'success': True
            }
        
        except Exception as e:
            logger.error(f"Error accessing webcam: {e}")
            return {'error': str(e), 'detections': []}
    
    def _parse_results(self, results, image_shape: Tuple[int, int, int]) -> List[Dict]:
        """Parse YOLOv5 detection results."""
        detections = []
        
        try:
            # Extract prediction data
            pred = results.xyxy[0].cpu().numpy()  # Bounding box + confidence
            effective_threshold = float(getattr(self.model, 'conf', self.confidence_threshold))
            
            for detection in pred:
                x1, y1, x2, y2, conf, cls = detection
                class_name = results.names[int(cls)]
                
                # Additional filtering for false positives
                keep_detection = self.detection_mode == 'all' or self._is_weapon_label(class_name)
                if conf >= effective_threshold and keep_detection:
                    detections.append({
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': float(conf),
                        'class': int(cls),
                        'class_name': class_name
                    })
        
        except Exception as e:
            logger.warning(f"Error parsing results: {e}")
        
        return detections
    
    def _annotate_image(self, image: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """Draw bounding boxes on the image."""
        annotated = image.copy()

        weapon_detections = self._get_weapon_detections(detections)
        for detection in weapon_detections:
            x1, y1, x2, y2 = detection['bbox']
            conf = detection['confidence']
            class_name = detection['class_name']
            
            # Draw bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
            
            # Draw label
            display_name = "Weapon"
            label = f"{display_name}: {conf:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(
                annotated,
                (x1, y1 - label_size[1] - 4),
                (x1 + label_size[0] + 4, y1),
                (0, 0, 255),
                -1
            )
            cv2.putText(
                annotated,
                label,
                (x1 + 2, y1 - 2),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )

        if self.alert_banner and weapon_detections:
            alert_text = self._build_alert_text(weapon_detections)
            cv2.rectangle(annotated, (0, 0), (annotated.shape[1], 42), (0, 0, 255), -1)
            cv2.putText(
                annotated,
                alert_text,
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (255, 255, 255),
                2
            )
        
        return annotated
    
    def _save_annotated_image(
        self,
        image: np.ndarray,
        detections: List[Dict],
        image_path: str,
        save_dir: str
    ) -> str:
        """Save annotated image to file."""
        annotated = self._annotate_image(image, detections)
        output_path = self._get_output_path(image_path, save_dir)
        cv2.imwrite(output_path, annotated)
        return output_path
    
    def _get_output_path(self, input_path: str, save_dir: str, extension: str = None) -> str:
        """Generate output file path."""
        input_name = Path(input_path).stem
        ext = extension or Path(input_path).suffix
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return str(Path(save_dir) / f"{input_name}_{timestamp}{ext}")

    def _create_mp4_writer(self, output_path: str, fps: float, width: int, height: int) -> cv2.VideoWriter:
        """Create a VideoWriter with codec fallback for browser playback."""
        for codec in ('avc1', 'H264', 'mp4v'):
            writer = cv2.VideoWriter(
                output_path,
                cv2.VideoWriter_fourcc(*codec),
                float(fps),
                (width, height),
            )
            if writer is not None and writer.isOpened():
                logger.info(f"Using video codec: {codec}")
                return writer
            if writer is not None:
                writer.release()
        raise RuntimeError("Unable to initialize MP4 video writer with available codecs")
    
    def set_confidence_threshold(self, threshold: float):
        """Update confidence threshold."""
        if 0.0 <= threshold <= 1.0:
            self.confidence_threshold = threshold
            self.model.conf = threshold
            logger.info(f"Confidence threshold updated to {threshold}")
        else:
            logger.warning(f"Invalid threshold {threshold}. Must be between 0 and 1")

    def set_weapon_classes(self, weapon_classes: List[str]):
        """Update the list of weapon labels used for filtering."""
        normalized = {c.strip().lower() for c in weapon_classes if c and c.strip()}
        if not normalized:
            logger.warning("Weapon class list is empty; keeping existing configuration")
            return
        self.weapon_classes = normalized
        logger.info(f"Weapon classes updated: {sorted(self.weapon_classes)}")
        self._log_weapon_class_coverage()


if __name__ == "__main__":
    # Example usage
    print("=" * 60)
    print("YOLOv5 Weapon Detection System")
    print("=" * 60)
    
    # Load optional runtime config
    cfg = {}
    cfg_path = Path('config.yaml')
    if cfg_path.exists():
        try:
            cfg = yaml.safe_load(cfg_path.read_text()) or {}
        except Exception as e:
            logger.warning(f"Failed to read config.yaml, using defaults: {e}")

    model_cfg = cfg.get('model', {})
    detection_cfg = cfg.get('detection', {})
    alerting_cfg = cfg.get('alerting', {})
    streaming_cfg = cfg.get('streaming', {})
    cloudinary_cfg = cfg.get('cloudinary', {})
    inference_cfg = cfg.get('inference', {})

    device_cfg = model_cfg.get('device', 'auto')
    if device_cfg == 'auto':
        device_cfg = 'cuda' if torch.cuda.is_available() else 'cpu'

    # Initialize detector with focus on reducing false positives
    detector = WeaponDetector(
        model_name=model_cfg.get('name', 'm'),
        model_weights=model_cfg.get('weights_path'),
        confidence_threshold=float(detection_cfg.get('confidence_threshold', 0.5)),
        device=device_cfg,
        detection_mode=detection_cfg.get('mode', 'all'),
        weapon_classes=detection_cfg.get('weapon_classes'),
        alert_banner=bool(detection_cfg.get('alert_banner', True)),
        alerting_enabled=bool(alerting_cfg.get('enabled', False)),
        alert_webhook_url=alerting_cfg.get('webhook_url'),
        alert_cooldown_seconds=float(alerting_cfg.get('cooldown_seconds', 0.0)),
        source_name=alerting_cfg.get('source_name', 'local-camera'),
        stream_enabled=bool(streaming_cfg.get('enabled', True)),
        stream_frame_url=streaming_cfg.get('frame_url', 'http://127.0.0.1:5001/frame'),
        stream_fps=float(streaming_cfg.get('fps', 8)),
        stream_jpeg_quality=int(streaming_cfg.get('jpeg_quality', 75)),
        cloudinary_enabled=bool(cloudinary_cfg.get('enabled', False)),
        cloudinary_cloud_name=(cloudinary_cfg.get('cloud_name') or os.getenv('CLOUDINARY_CLOUD_NAME')),
        cloudinary_api_key=(cloudinary_cfg.get('api_key') or os.getenv('CLOUDINARY_API_KEY')),
        cloudinary_api_secret=(cloudinary_cfg.get('api_secret') or os.getenv('CLOUDINARY_API_SECRET')),
        cloudinary_folder=cloudinary_cfg.get('folder', 'weapon-detection-clips'),
        image_inference_size=int(inference_cfg.get('image_size', 960)),
        video_inference_size=int(inference_cfg.get('video_size', 832)),
        webcam_inference_size=int(inference_cfg.get('webcam_size', 832)),
        use_tta=bool(inference_cfg.get('use_tta', False))
    )
    
    print("\nDetector initialized. Choose an option:")
    print("1. Detect in image")
    print("2. Detect in video")
    print("3. Detect in webcam")
    
    choice = input("Enter choice (1-3): ").strip()
    
    if choice == '1':
        image_path = input("Enter image path: ").strip()
        result = detector.detect_in_image(image_path)
        print(f"\nDetections: {result['num_detections']}")
        if result.get('alert_triggered'):
            print("!!! ALERT: WEAPON DETECTED !!!")
            print(f"Weapon classes: {sorted({d['class_name'] for d in result['weapon_detections']})}")
        for det in result['detections']:
            print(f"  - {det['class_name']}: {det['confidence']:.2%}")
    
    elif choice == '2':
        video_path = input("Enter video path: ").strip()
        default_frame_skip = int(cfg.get('video', {}).get('frame_skip', 1))
        default_video_conf = float(cfg.get('video', {}).get('confidence_threshold', 0.25))
        frame_skip = int(
            input(f"Frame skip (1=every frame, 5=every 5th frame) [default {default_frame_skip}]: ")
            or str(default_frame_skip)
        )
        video_conf = float(
            input(f"Video confidence threshold (0-1) [default {default_video_conf}]: ")
            or str(default_video_conf)
        )
        result = detector.detect_in_video(
            video_path,
            frame_skip=frame_skip,
            confidence_threshold=video_conf
        )
        print(f"\nFrames with detections: {result['frames_with_detections']}/{result['total_frames']}")
        if result.get('alert_triggered'):
            print("!!! ALERT: WEAPON DETECTED IN VIDEO !!!")
            print(f"Alert frames: {result['alert_frames']}")
            print(f"Weapon classes: {result['alert_classes']}")
    
    elif choice == '3':
        webcam_cfg = cfg.get('webcam', {})
        duration_input = input("Capture duration (seconds, blank = continuous until q): ").strip()
        duration = int(duration_input) if duration_input else None
        default_webcam_source = webcam_cfg.get('source', 0)
        default_webcam_conf = float(webcam_cfg.get('confidence_threshold', 0.25))
        default_webcam_event_grace = int(webcam_cfg.get('event_exit_grace_frames', 12))
        default_webcam_event_clip_fps = float(webcam_cfg.get('event_clip_fps', 8.0))
        default_webcam_process_every_n_frames = int(webcam_cfg.get('process_every_n_frames', 1))
        webcam_source_input = input(
            f"Camera source (0=laptop camera, or IP URL) [default {default_webcam_source}]: "
        ).strip()
        webcam_source = webcam_source_input if webcam_source_input else default_webcam_source
        if isinstance(webcam_source, str) and webcam_source.isdigit():
            webcam_source = int(webcam_source)
        webcam_conf = float(
            input(f"Webcam confidence threshold (0-1) [default {default_webcam_conf}]: ")
            or str(default_webcam_conf)
        )
        webcam_event_grace = int(
            input(f"Webcam event exit grace frames [default {default_webcam_event_grace}]: ")
            or str(default_webcam_event_grace)
        )
        webcam_event_clip_fps = float(
            input(f"Webcam event clip FPS [default {default_webcam_event_clip_fps}]: ")
            or str(default_webcam_event_clip_fps)
        )
        webcam_process_every_n_frames = int(
            input(f"Webcam process every N frames [default {default_webcam_process_every_n_frames}]: ")
            or str(default_webcam_process_every_n_frames)
        )
        save_webcam = (input("Save webcam output video? (y/n) [default y]: ").strip().lower() or 'y') == 'y'
        result = detector.detect_in_webcam(
            duration=duration,
            confidence_threshold=webcam_conf,
            save_result=save_webcam,
            event_exit_grace_frames=webcam_event_grace,
            event_clip_fps=webcam_event_clip_fps,
            camera_source=webcam_source,
            process_every_n_frames=webcam_process_every_n_frames
        )
        print(f"Camera source: {result.get('camera_source')}")
        print(f"\nFrames captured: {result['frames_captured']}")
        print(f"Frames with detections: {result['frames_with_detections']}")
        print(f"Total detections: {result['total_detections']}")
        if result.get('alert_triggered'):
            print("!!! ALERT: WEAPON DETECTED IN WEBCAM !!!")
            print(f"Alert frames: {result['alert_frames']}")
            print(f"Weapon classes: {result['alert_classes']}")
        if result['class_counts']:
            print(f"Detected classes: {result['class_counts']}")
        if result.get('output_video'):
            print(f"Saved webcam video: {result['output_video']}")
    
    else:
        print("Invalid choice")

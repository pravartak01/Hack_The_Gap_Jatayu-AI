#!/usr/bin/env python
"""Test collision detection on uploaded video."""

from hazard_detection import HazardDetector, load_config
from pathlib import Path

cfg = load_config()
model_cfg = cfg.get('model', {})
detection_cfg = cfg.get('detection', {})
output_cfg = cfg.get('output', {})

# Initialize detector with Cloudinary config
detector = HazardDetector(
    backend='yolo8',
    model_id='yolov8n.pt',
    confidence_threshold=float(detection_cfg.get('confidence_threshold', 0.25)),
    device='cpu'
)

detector.cloudinary_cfg = cfg.get('cloudinary', {})

# Test on collision video
video_path = '../test_collision.mp4'
save_dir = output_cfg.get('save_directory', 'detections/hazard_detections')

print(f'Testing collision video: {video_path}')
print(f'Cloudinary enabled: {detector.cloudinary_cfg.get("enabled", False)}')
print(f'Cloudinary folder: {detector.cloudinary_cfg.get("folder", "not-set")}')
print()

result = detector.detect_in_video(video_path, save_dir=save_dir, frame_skip=1)

print('\n=== DETECTION RESULT ===')
print(f'Success: {result.get("success")}')
print(f'Categories detected: {result.get("categories")}')
print(f'Output paths: {result.get("output_paths")}')
print(f'Total detections: {result.get("total_detections")}')
print(f'Frames with hazard: {result.get("frames_with_hazard")}')
print(f'Total frames processed: {result.get("processed_frames")}')

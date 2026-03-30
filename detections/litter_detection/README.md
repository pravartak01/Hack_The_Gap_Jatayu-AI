# Litter Detection Module

This module detects possible garbage dumping behavior using:

1. Person detection and tracking
2. Trash object detection and tracking
3. Event rules to infer dumping (person near object, object becomes stationary, person moves away)
4. Alert clip recording
5. Cloudinary upload to `litter-clips`

## Run

From project root:

```bash
python litter_detection/litter_detection.py
```

Menu:

1. Webcam detection
2. Video detection

## How Event Logic Works

A `dumping_event` is triggered when all are true:

1. A tracked trash object stays near a tracked person for a minimum number of frames.
2. The trash object then remains mostly stationary.
3. The associated person moves away from that trash object.

This is heuristic behavior logic, not action recognition. Accuracy improves with camera-specific tuning.

## Output

Saved under:

- `detections/litter_detection/annotated_video` (optional full video)
- `detections/litter_detection/alert_clips`
- `detections/litter_detection/snapshots`

Each event clip is uploaded to Cloudinary folder `litter-clips` if enabled in config.

## Notes

- Pretrained COCO classes do not include every garbage type. For best results, use custom litter-trained YOLO weights in `model.model_id`.
- Tune `event.*` thresholds in `litter_detection/config.yaml` for your camera angle and road scene.

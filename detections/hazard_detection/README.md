# Hazard Detection Module

This folder is a separate pipeline for hazard detection (fire, smoke, accidents, and other hazardous events).

## Supported Pretrained Backends

1. YOLOv8 (`backend: yolo8`) - best choice for real-time webcam/video.
2. DETR (`backend: detr`) - transformer-based object detection backend.

## Configure Model

Edit `hazard_detection/config.yaml`:

```yaml
model:
  backend: yolo8
  model_id: yolov8n.pt
  device: auto

detection:
  confidence_threshold: 0.25
  inference_size: 832
  enable_color_fire_fallback: true
  color_fire_min_area: 900
```

`enable_color_fire_fallback` adds a color-based fire region detector so clear flames can still
get a red box when generic pretrained labels do not include `fire`.

Examples:

1. YOLOv8 custom hazard model (recommended for fire/smoke):

```yaml
model:
  backend: yolo8
  model_id: path/to/your/roboflow_hazard_model.pt
```

2. DETR pretrained model:

```yaml
model:
  backend: detr
  model_id: facebook/detr-resnet-50
```

## Run

From project root:

```bash
python hazard_detection/hazard_detection.py
```

Menu options:

1. Image detection
2. Webcam detection (event clips)
3. Video detection (saves fully annotated output with red hazard boxes)

Webcam event clip logic:

1. Hazard appears in frame: recording starts.
2. Hazard disappears for configured grace frames: recording stops.
3. Clip is saved into category folder(s): fire, smoke, accident, or other hazard.

## Output

Detections are saved to:

- `detections/hazard_detections/fire_detection`
- `detections/hazard_detections/smoke_detection`
- `detections/hazard_detections/accident_detection`
- `detections/hazard_detections/other_hazard_detection`

For image/video runs, the annotated result is placed into one or more category folders based on detected class labels.

## Important Note

Generic pretrained models may not contain explicit `fire`/`smoke` labels.
For reliable hazard detection, use a custom hazard-trained checkpoint.

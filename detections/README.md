# Weapon Detection System using YOLOv5

A comprehensive Python-based weapon detection system using the YOLOv5 deep learning model. Designed with a focus on reducing false positives and maintaining high recall across different datasets.

## Features

- ✅ Real-time weapon detection in images, videos, and webcam streams
- ✅ Multiple YOLOv5 model sizes (nano to extra-large)
- ✅ Configurable confidence thresholds for false positive reduction
- ✅ Batch processing support
- ✅ Cross-dataset validation capabilities
- ✅ GPU acceleration with CUDA support
- ✅ Comprehensive logging and error handling
- ✅ Extensible architecture for custom modifications

## Installation

### 1. Install Python Requirements

```bash
# Create a virtual environment (recommended)
python -m venv weapon_env
source weapon_env/Scripts/activate  # On Windows: weapon_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Download YOLOv5 Model

The model will automatically download on first run, or you can pre-download:

```bash
python -c "import torch; torch.hub.load('ultralytics/yolov5', 'yolov5m')"
```

### 3. Verify Installation

```bash
python -c "from weapon_detection import WeaponDetector; print('✓ Installation successful')"
```

## Quick Start

### Alert Route + Web Dashboard (Local)

This project can send weapon alerts to a route and display them on a web page.

1. Start alert server:

```bash
python alert_server.py
```

2. Open dashboard:

```text
http://127.0.0.1:5001/
```

Live stream endpoint (MJPEG):

```text
http://127.0.0.1:5001/stream
```

3. Keep `config.yaml` alerting enabled:

```yaml
alerting:
  enabled: true
  webhook_url: http://127.0.0.1:5001/alerts
  cooldown_seconds: 0
  source_name: webcam-dev

streaming:
  enabled: true
  frame_url: http://127.0.0.1:5001/frame
  fps: 8
  jpeg_quality: 75

cloudinary:
  enabled: false
  cloud_name: ""
  api_key: ""
  api_secret: ""
  folder: weapon-detection-clips
```

### Upload detected clips to Cloudinary

If you want detected webcam event clips to be stored on Cloudinary instead of relying on local file serving, set:

```yaml
cloudinary:
  enabled: true
  cloud_name: your_cloud_name
  api_key: your_api_key
  api_secret: your_api_secret
  folder: weapon-detection-clips
```

Behavior:
1. Each completed weapon event clip is uploaded to Cloudinary.
2. Alert payload includes `cloudinary_video_url` and `cloudinary_public_id`.
3. Dashboard prefers `cloudinary_video_url` when available.

When a weapon is detected (image/video/webcam), an alert payload is posted to `/alerts` and shown on the dashboard.
For webcam, alerts are now grouped as event clips:
1. Clip starts when weapon enters frame.
2. Clip stops after weapon leaves frame (with configurable grace frames).
3. Server receives one event payload per clip and dashboard shows that video.

For continuous webcam monitoring (no timer), leave duration blank in CLI and press `q` to stop.

Recommended start order for live stream + alerts:
1. `python alert_server.py`
2. `python weapon_detection.py`
3. Start webcam mode in detector
4. Open `http://127.0.0.1:5001/` to watch live stream and event clips

### Basic Image Detection

```python
from weapon_detection import WeaponDetector

detector = WeaponDetector(
    model_name='m',              # Medium model
    confidence_threshold=0.5      # 50% confidence threshold
)

result = detector.detect_in_image('path/to/image.jpg')
print(f"Detected {result['num_detections']} weapons")
```

### Video Detection

```python
result = detector.detect_in_video(
    'path/to/video.mp4',
    frame_skip=2  # Process every 2nd frame for speed
)
print(f"Frames with detections: {result['frames_with_detections']}")
```

### Webcam Detection

```python
result = detector.detect_in_webcam(duration=30)  # 30 seconds
print(f"Total detections: {result['total_detections']}")
```

Webcam output also includes:
1. `frames_with_detections`
2. `class_counts` (which classes were actually detected)
3. Optional `output_video` path when saving is enabled

## Model Selection Guide

| Model | Speed | Accuracy | GPU Memory | Use Case |
|-------|-------|----------|------------|----------|
| **nano (n)** | Very Fast | Lower | ~1GB | Edge devices, real-time |
| **small (s)** | Fast | Good | ~2GB | Balanced performance |
| **medium (m)** | Normal | Better | ~4GB | **Recommended for most** |
| **large (l)** | Slower | Best | ~8GB | High accuracy needed |
| **xlarge (x)** | Slowest | Best+ | ~16GB | Maximum accuracy |

**Recommendation**: Start with `'m'` (medium) for the best balance.

## Confidence Threshold Tuning

The confidence threshold controls the sensitivity of detection:

```python
detector = WeaponDetector(confidence_threshold=0.5)

# Reduce false positives (higher threshold)
detector.set_confidence_threshold(0.65)

# Increase recall (lower threshold)
detector.set_confidence_threshold(0.4)
```

**Tuning Strategy (based on your preference)**:
1. Start at 0.5
2. Run on validation set
3. If too many false positives: increase to 0.6-0.7
4. If missing weapons: decrease to 0.4-0.45

## Usage Examples

### Run Interactive Menu

```bash
python weapon_detection.py
```

### Run Examples

```bash
python examples.py
```

Available examples:
1. Image Detection
2. Video Detection
3. Confidence Tuning
4. Model Selection
5. Batch Processing
6. Cross-Dataset Validation

### Batch Processing Multiple Images

```python
from pathlib import Path

detector = WeaponDetector()

for image_path in Path('data/images').glob('*.jpg'):
    result = detector.detect_in_image(str(image_path), save_result=True)
    print(f"{image_path.name}: {result['num_detections']} detections")
```

### Cross-Dataset Validation

```python
# Test model on different datasets to ensure generalization
datasets = ['dataset_1', 'dataset_2', 'dataset_3']

for dataset_name in datasets:
    detector = WeaponDetector()
    # Process all images in dataset
    results = detector.detect_in_image(f'data/{dataset_name}')
    print(f"{dataset_name}: {results['num_detections']} detections")
```

## Configuration

Edit `config.yaml` to customize settings:

```yaml
model:
  name: 'm'                    # Model size
  device: 'auto'               # 'cuda', 'cpu', or 'auto'

detection:
  confidence_threshold: 0.35   # Lower for better knife recall on difficult frames
  mode: all                    # all | weapon_only

video:
  confidence_threshold: 0.2    # Lower for harder video scenes
  frame_skip: 1                # Process every nth frame

webcam:
  source: 0                    # 0 for laptop camera, or set IP webcam URL
  confidence_threshold: 0.2    # Lower for small/fast objects in webcam
  process_every_n_frames: 2     # 2-3 improves smoothness on slower systems
  event_clip_fps: 8.0           # Stable playback FPS for weapon event clips (avoid fast-forward)
  save_output: true

inference:
  image_size: 960              # Higher size improves small object recall in images
  video_size: 832              # Trade-off between accuracy and speed
  webcam_size: 832             # Trade-off between accuracy and speed
  use_tta: false               # True increases recall but is slower
```

Important: default COCO YOLOv5 weights do not include strong firearm classes. For confident gun detection,
use a custom weapon-trained model and set `model.weights_path`.

To use an IP webcam, set webcam source to a stream URL, for example:

```yaml
webcam:
  source: "http://192.168.1.50:8080/video"
```

You can also enter this URL at runtime in the webcam prompt.

Weapon event clips are saved in:

```text
detections/weapon_detections/
```

## Output Structure

Detected results are saved in the following format:

```
detections/
├── image_20260325_120000.jpg      # Annotated image
├── video_20260325_120001.mp4      # Annotated video
└── ...
```

Each detection includes:
- **Bounding box** coordinates (x1, y1, x2, y2)
- **Confidence score** (0.0 to 1.0)
- **Class name** (weapon type)

## Performance Optimization

### Speed Up Detection

```python
# Use smaller model + GPU
detector = WeaponDetector(model_name='s', device='cuda')

# Skip frames in video processing
detector.detect_in_video(video_path, frame_skip=3)
```

### Improve Accuracy

```python
# Use larger model
detector = WeaponDetector(model_name='l', device='cuda')

# Lower confidence threshold (catches more, may increase false positives)
detector.set_confidence_threshold(0.4)
```

## Troubleshooting

### Gun In Image But 0 Detections

If logs show model support like `['baseball bat', 'knife', 'scissors']`, you are using default COCO weights.
COCO does not provide a dedicated `gun` class, so firearm detections can be missed even if a gun is visible.

Use a custom weapon-trained YOLO model:

1. Put your model file in the project (example: `models/weapon_best.pt`)
2. Update config:

```yaml
model:
  name: m
  device: auto
  weights_path: models/weapon_best.pt
```

3. Run:

```bash
python weapon_detection.py
```

The app now reads `weights_path` from config and loads custom model classes automatically.

### No Boxes Around Objects

If you want the old behavior (show all detected objects, including person), set:

```yaml
detection:
  mode: all
```

If you only want configured weapon labels, set:

```yaml
detection:
  mode: weapon_only
```

For video quality specifically:

1. Use `frame_skip: 1`
2. Use `video.confidence_threshold: 0.25` (or 0.20 for very hard scenes)

### "CUDA out of memory" Error

```python
# Use smaller model
detector = WeaponDetector(model_name='s')

# Or force CPU
detector = WeaponDetector(device='cpu')
```

### Model Not Found

```bash
# Download model manually
python -c "import torch; torch.hub.load('ultralytics/yolov5', 'yolov5m', force_reload=True)"
```

### Low Detection Accuracy

1. Check confidence threshold (lower = more detections)
2. Try larger model (`'l'` or `'x'`)
3. Ensure good image quality
4. Validate on multiple datasets

## Hardware Requirements

**Minimum**:
- CPU: 4-core processor
- RAM: 8GB
- Storage: 500MB for model + space for outputs

**Recommended**:
- GPU: NVIDIA RTX 3060+ (12GB VRAM)
- RAM: 16GB
- Storage: 2GB

**GPU Support**:
```python
import torch
print(f"CUDA Available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0)}")
```

## Advanced Usage

### Custom Detection Pipeline

```python
detector = WeaponDetector()

# Process with custom logic
image = cv2.imread('image.jpg')
results = detector.model(image)
detections = detector._parse_results(results, image.shape)

# Filter additional criteria
high_confidence = [d for d in detections if d['confidence'] > 0.7]
```

### Save Detection Logs

```python
import json
from pathlib import Path

detector = WeaponDetector()
result = detector.detect_in_image('image.jpg')

# Save as JSON
with open('detections.json', 'w') as f:
    json.dump(result['detections'], f, indent=2)
```

## Model Training/Fine-tuning

To train a custom weapon detection model:

```bash
# Clone YOLOv5 repo
git clone https://github.com/ultralytics/yolov5
cd yolov5

# Train on your data
python train.py --img 640 --batch 16 --epochs 100 --data data.yaml --weights yolov5m.pt
```

## API Reference

### WeaponDetector Class

#### `__init__(model_name='s', confidence_threshold=0.5, device='cuda')`
Initialize the detector.

#### `detect_in_image(image_path, save_result=True, save_dir='detections')`
Detect weapons in a single image.

#### `detect_in_video(video_path, save_result=True, save_dir='detections', frame_skip=1)`
Detect weapons in video frames.

#### `detect_in_webcam(duration=30)`
Detect weapons from webcam feed.

#### `set_confidence_threshold(threshold)`
Update confidence threshold (0.0 to 1.0).

## License

This weapon detection system uses YOLOv5 from Ultralytics (GNU General Public License v3.0).

## References

- [YOLOv5 Documentation](https://github.com/ultralytics/yolov5)
- [PyTorch Documentation](https://pytorch.org/docs/stable/index.html)
- [OpenCV Documentation](https://docs.opencv.org/)

## Notes

- This system is designed for research and legitimate security applications
- Always obtain necessary approvals and comply with local regulations
- Test thoroughly before production deployment
- Monitor model performance regularly

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the examples
3. Consult the official YOLOv5 documentation

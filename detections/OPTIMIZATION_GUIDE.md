# Weapon Detection - Optimization & Best Practices

## 🎯 Confidence Threshold Tuning

### Understanding False Positives vs. False Negatives

```
Confidence Threshold Impact:
├─ 0.3-0.4 (Low)    → High recall, more false positives
├─ 0.5 (Balanced)   → Good balance (recommended starting point)
└─ 0.6-0.7 (High)   → Fewer false positives, may miss some weapons
```

### Tuning Strategy

```python
from weapon_detection import WeaponDetector

# Step 1: Baseline testing
detector = WeaponDetector(confidence_threshold=0.5)
result = detector.detect_in_image('test_image.jpg')

# Step 2: Adjust based on results
if result['num_detections'] > expected:
    # Too many detections = increase threshold
    detector.set_confidence_threshold(0.60)
elif result['num_detections'] < expected:
    # Too few detections = decrease threshold
    detector.set_confidence_threshold(0.40)

# Step 3: Validate on test dataset
```

## 📊 Cross-Dataset Validation

Test your model on multiple datasets to ensure generalization:

```python
datasets = [
    'data/dataset_daytime',
    'data/dataset_nighttime',
    'data/dataset_outdoor',
    'data/dataset_indoor'
]

detector = WeaponDetector()
for dataset in datasets:
    # Test on each dataset
    results = analyze_dataset(dataset)
    print(f"{dataset}: {results['accuracy']:.2%}")
```

## ⚡ Performance Optimization

### Speed vs. Accuracy Trade-offs

| Goal | Configuration | Speed | Accuracy |
|------|---------------|-------|----------|
| **Real-time** | `yolov5n` + frame_skip=3 | Fastest | Lower |
| **Balanced** | `yolov5m` + frame_skip=1 | Medium | Good |
| **Maximum** | `yolov5l` + no skipping | Slower | Highest |

### Implementation

```python
from weapon_detection import WeaponDetector

# Fast real-time processing
fast_detector = WeaponDetector(model_name='n', device='cuda')

# High accuracy processing
accurate_detector = WeaponDetector(model_name='l', device='cuda')
```

## 🚀 GPU Optimization

### CUDA Memory Management

```python
import torch

# Check available GPU memory
print(f"Total GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")

# Clear cache between runs
torch.cuda.empty_cache()

# Use smaller batch size if out of memory
detector = WeaponDetector(model_name='s')  # Smaller model
```

### Multi-GPU Processing

```python
# For multi-GPU systems
import torch

if torch.cuda.device_count() > 1:
    # Use multiple GPUs
    detector.model = torch.nn.DataParallel(detector.model)
```

## 📈 Batch Processing Best Practices

### Efficient Batch Processing

```python
from pathlib import Path
from weapon_detection import WeaponDetector

detector = WeaponDetector(model_name='m')

# Process directory efficiently
image_dir = Path('data/images')
results = []

for image_path in sorted(image_dir.glob('*.jpg')):
    result = detector.detect_in_image(str(image_path))
    results.append({
        'file': image_path.name,
        'detections': result['num_detections']
    })

# Summary statistics
total_detections = sum(r['detections'] for r in results)
print(f"Total detections: {total_detections}")
print(f"Average per image: {total_detections / len(results):.2f}")
```

### Parallel Processing

```python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

detector = WeaponDetector()

def process_image(image_path):
    return detector.detect_in_image(image_path)

# Parallel processing
image_paths = list(Path('data/images').glob('*.jpg'))

with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(process_image, image_paths))

print(f"Processed {len(results)} images in parallel")
```

## 🔍 Quality Validation

### Validation Checklist

```python
class ValidationReport:
    """Generate validation metrics."""
    
    @staticmethod
    def generate(results):
        """Generate comprehensive validation report."""
        metrics = {
            'total_images': len(results),
            'total_detections': sum(r['num_detections'] for r in results),
            'images_with_detections': sum(1 for r in results if r['num_detections'] > 0),
            'detection_rate': sum(1 for r in results if r['num_detections'] > 0) / len(results),
            'avg_detections_per_image': sum(r['num_detections'] for r in results) / len(results),
            'confidence_stats': {
                'min': min(d['confidence'] for r in results for d in r['detections']),
                'max': max(d['confidence'] for r in results for d in r['detections']),
                'mean': sum(d['confidence'] for r in results for d in r['detections']) / 
                        sum(r['num_detections'] for r in results)
            }
        }
        return metrics
```

## 🛡️ False Positive Reduction Techniques

### 1. Confidence Threshold Adjustment
```python
# Increase threshold to be more selective
detector.set_confidence_threshold(0.65)
```

### 2. Post-detection Filtering
```python
def filter_detections(detections, min_confidence=0.7, min_area=100):
    """Additional filtering to reduce false positives."""
    filtered = []
    for det in detections:
        # Check confidence
        if det['confidence'] < min_confidence:
            continue
        
        # Check size (filter very small boxes)
        x1, y1, x2, y2 = det['bbox']
        area = (x2 - x1) * (y2 - y1)
        if area < min_area:
            continue
        
        filtered.append(det)
    
    return filtered
```

### 3. Ensemble Methods
```python
# Use multiple confidence levels
thresholds = [0.5, 0.6, 0.7]

for threshold in thresholds:
    detector.set_confidence_threshold(threshold)
    result = detector.detect_in_image('image.jpg')
    print(f"Threshold {threshold}: {result['num_detections']} detections")
```

## 📊 Monitoring and Logging

### Enable Detailed Logging

```python
import logging

# Set logging level
logging.basicConfig(level=logging.DEBUG)

# This will show detailed information
detector = WeaponDetector()
```

### Save Results to File

```python
import json
from datetime import datetime

results = detector.detect_in_image('image.jpg')

# Save results
output_file = f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w') as f:
    json.dump(results, f, indent=2)

print(f"Results saved to {output_file}")
```

## 🔄 Continuous Improvement

### Workflow for Model Refinement

```
1. Baseline Testing
   └─ Run on initial dataset with threshold 0.5
   
2. Analysis
   └─ Review false positives and false negatives
   
3. Threshold Adjustment
   └─ Increase threshold if too many FPs
   └─ Decrease threshold if too many FNs
   
4. Cross-Dataset Validation
   └─ Test on different datasets
   └─ Ensure generalization
   
5. Fine-tuning (Optional)
   └─ Train custom model if needed
   └─ See README.md for training setup
```

## 🎓 Common Scenarios

### Scenario 1: Too Many False Positives
```python
# Solution: Increase confidence threshold
detector.set_confidence_threshold(0.70)

# Or use larger model for better accuracy
detector = WeaponDetector(model_name='l')
```

### Scenario 2: Missing Some Weapons
```python
# Solution: Lower confidence threshold
detector.set_confidence_threshold(0.40)

# Or check image quality
```

### Scenario 3: Slow Processing
```python
# Solution 1: Use smaller model
detector = WeaponDetector(model_name='s')

# Solution 2: Skip frames
detector.detect_in_video('video.mp4', frame_skip=5)

# Solution 3: Use GPU
detector = WeaponDetector(device='cuda')
```

### Scenario 4: GPU Out of Memory
```python
# Solution: Use smaller model
detector = WeaponDetector(model_name='n')

# Or force CPU mode
detector = WeaponDetector(device='cpu')
```

## 📈 Benchmarking

```python
import time

def benchmark_detector(detector, image_path):
    """Measure detection performance."""
    
    # Warmup
    detector.detect_in_image(image_path, save_result=False)
    
    # Benchmark
    start = time.time()
    result = detector.detect_in_image(image_path, save_result=False)
    elapsed = time.time() - start
    
    print(f"Detection time: {elapsed:.3f}s")
    print(f"Detections: {result['num_detections']}")
    print(f"FPS equivalent: {1/elapsed:.1f}")

# Run benchmark
detector = WeaponDetector(model_name='m')
benchmark_detector(detector, 'test_image.jpg')
```

## 🔗 Next Steps

1. **Setup** → Run `python setup_utils.py --setup`
2. **Test** → Run `python weapon_detection.py`
3. **Optimize** → Use tuning examples in this guide
4. **Validate** → Run cross-dataset validation
5. **Deploy** → Use in production with confidence

---

**Remember**: The key to a good detection system is iterative refinement. Start with baseline settings, measure performance, and adjust accordingly.

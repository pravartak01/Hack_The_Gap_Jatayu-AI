"""
Advanced Weapon Detection Examples
Demonstrates various usage patterns and optimization techniques.
"""

from weapon_detection import WeaponDetector
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def example_image_detection():
    """Example: Detect weapons in an image."""
    detector = WeaponDetector(
        model_name='m',
        confidence_threshold=0.5
    )
    
    image_path = "sample_image.jpg"
    result = detector.detect_in_image(image_path, save_result=True)
    
    print(f"\nImage Detection Results:")
    print(f"Path: {result['image_path']}")
    print(f"Detections: {result['num_detections']}")
    
    for detection in result['detections']:
        print(f"\n  Class: {detection['class_name']}")
        print(f"  Confidence: {detection['confidence']:.2%}")
        print(f"  Bounding Box: {detection['bbox']}")


def example_video_detection():
    """Example: Detect weapons in a video with frame skipping."""
    detector = WeaponDetector(
        model_name='s',  # Smaller model for faster processing
        confidence_threshold=0.55
    )
    
    video_path = "sample_video.mp4"
    
    # Skip every other frame for faster processing
    result = detector.detect_in_video(
        video_path,
        save_result=True,
        frame_skip=2
    )
    
    print(f"\nVideo Detection Results:")
    print(f"Total frames: {result['total_frames']}")
    print(f"Processed frames: {result['processed_frames']}")
    print(f"Frames with detections: {result['frames_with_detections']}")


def example_confidence_tuning():
    """Example: Tune confidence threshold to reduce false positives."""
    detector = WeaponDetector(
        model_name='m',
        confidence_threshold=0.3  # Start low
    )
    
    image_path = "sample_image.jpg"
    
    # Test different confidence levels
    thresholds = [0.3, 0.4, 0.5, 0.6, 0.7]
    
    print("\nConfidence Threshold Tuning:")
    for threshold in thresholds:
        detector.set_confidence_threshold(threshold)
        result = detector.detect_in_image(image_path, save_result=False)
        print(f"  Threshold {threshold}: {result['num_detections']} detections")


def example_model_selection():
    """Example: Compare different model sizes."""
    image_path = "sample_image.jpg"
    models = ['n', 's', 'm', 'l']  # nano, small, medium, large
    
    print("\nModel Size Comparison:")
    for model_name in models:
        try:
            detector = WeaponDetector(
                model_name=model_name,
                confidence_threshold=0.5
            )
            result = detector.detect_in_image(image_path, save_result=False)
            print(f"  YOLOv5-{model_name}: {result['num_detections']} detections")
        except Exception as e:
            logger.error(f"Error with model {model_name}: {e}")


def example_batch_processing():
    """Example: Process multiple images in batch."""
    from pathlib import Path
    
    detector = WeaponDetector(
        model_name='m',
        confidence_threshold=0.5
    )
    
    # Get all images in a directory
    image_dir = Path("data/images")
    image_files = list(image_dir.glob("*.jpg")) + list(image_dir.glob("*.png"))
    
    print(f"\nBatch Processing {len(image_files)} images:")
    
    total_detections = 0
    for image_path in image_files:
        result = detector.detect_in_image(str(image_path), save_result=True)
        if result['success']:
            count = result['num_detections']
            total_detections += count
            print(f"  {image_path.name}: {count} weapons detected")
    
    print(f"\nTotal detections: {total_detections}")


def example_cross_dataset_validation():
    """
    Example: Cross-dataset validation for model robustness.
    Tests model on different datasets to ensure generalization.
    """
    from pathlib import Path
    
    detector = WeaponDetector(
        model_name='m',
        confidence_threshold=0.5
    )
    
    datasets = {
        'dataset_1': Path("data/dataset_1"),
        'dataset_2': Path("data/dataset_2"),
    }
    
    print("\nCross-Dataset Validation:")
    
    results_summary = {}
    for dataset_name, dataset_path in datasets.items():
        if not dataset_path.exists():
            logger.warning(f"Dataset not found: {dataset_path}")
            continue
        
        image_files = list(dataset_path.glob("*.jpg")) + list(dataset_path.glob("*.png"))
        total_detections = 0
        
        for image_path in image_files:
            result = detector.detect_in_image(str(image_path), save_result=False)
            if result['success']:
                total_detections += result['num_detections']
        
        results_summary[dataset_name] = {
            'total_images': len(image_files),
            'total_detections': total_detections,
            'avg_detections_per_image': total_detections / len(image_files) if image_files else 0
        }
        
        print(f"\n{dataset_name}:")
        print(f"  Images: {results_summary[dataset_name]['total_images']}")
        print(f"  Total detections: {results_summary[dataset_name]['total_detections']}")
        print(f"  Avg per image: {results_summary[dataset_name]['avg_detections_per_image']:.2f}")


if __name__ == "__main__":
    print("=" * 60)
    print("YOLOv5 Weapon Detection - Advanced Examples")
    print("=" * 60)
    
    examples = {
        '1': ('Image Detection', example_image_detection),
        '2': ('Video Detection', example_video_detection),
        '3': ('Confidence Tuning', example_confidence_tuning),
        '4': ('Model Selection', example_model_selection),
        '5': ('Batch Processing', example_batch_processing),
        '6': ('Cross-Dataset Validation', example_cross_dataset_validation),
    }
    
    print("\nAvailable Examples:")
    for key, (name, _) in examples.items():
        print(f"  {key}. {name}")
    
    choice = input("\nEnter example number: ").strip()
    
    if choice in examples:
        name, func = examples[choice]
        print(f"\nRunning: {name}")
        print("-" * 60)
        func()
    else:
        print("Invalid choice")

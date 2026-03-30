"""
Setup and configuration utilities for weapon detection system.
"""

import os
import sys
from pathlib import Path
import yaml
import logging

logger = logging.getLogger(__name__)


class ConfigManager:
    """Manage configuration settings for weapon detection."""
    
    def __init__(self, config_file='config.yaml'):
        self.config_file = config_file
        self.config = self._load_config()
    
    def _load_config(self) -> dict:
        """Load configuration from YAML file."""
        if not Path(self.config_file).exists():
            logger.warning(f"Config file not found: {self.config_file}")
            return self._default_config()
        
        try:
            with open(self.config_file, 'r') as f:
                config = yaml.safe_load(f)
            return config if config else self._default_config()
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return self._default_config()
    
    def _default_config(self) -> dict:
        """Return default configuration."""
        return {
            'model': {
                'name': 'm',
                'device': 'auto'
            },
            'detection': {
                'confidence_threshold': 0.5,
                'weapon_classes': [
                    'knife', 'scissors', 'baseball bat', 'gun', 'pistol', 'rifle',
                    'shotgun', 'firearm', 'revolver', 'sword', 'dagger', 'machete',
                    'axe', 'grenade', 'spear', 'bow', 'arrow', 'crossbow', 'taser'
                ]
            },
            'output': {
                'save_detections': True,
                'save_directory': 'detections',
                'save_format': 'jpg'
            },
            'video': {
                'frame_skip': 1,
                'output_format': 'mp4'
            },
            'performance': {
                'batch_size': 1,
                'num_threads': 4
            },
            'validation': {
                'datasets': [],
                'enabled': False
            }
        }
    
    def get(self, key: str, default=None):
        """Get configuration value by dot notation."""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value):
        """Set configuration value by dot notation."""
        keys = key.split('.')
        config = self.config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value
    
    def save(self):
        """Save configuration to file."""
        try:
            with open(self.config_file, 'w') as f:
                yaml.dump(self.config, f, default_flow_style=False)
            logger.info(f"Configuration saved to {self.config_file}")
        except Exception as e:
            logger.error(f"Error saving config: {e}")


def check_environment():
    """Check if environment is properly set up."""
    print("\n" + "=" * 60)
    print("ENVIRONMENT CHECK")
    print("=" * 60)
    
    checks = {
        'Python Version': _check_python(),
        'PyTorch': _check_pytorch(),
        'OpenCV': _check_opencv(),
        'GPU/CUDA': _check_cuda(),
        'Directory Structure': _check_directories()
    }
    
    print("\nResults:")
    all_passed = True
    for check_name, (passed, message) in checks.items():
        status = "✓" if passed else "✗"
        print(f"  {status} {check_name}: {message}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ All checks passed! Ready to use.")
    else:
        print("✗ Some checks failed. See messages above.")
    print("=" * 60)
    
    return all_passed


def _check_python():
    """Check Python version."""
    version = sys.version_info
    min_version = (3, 8)
    
    if version >= min_version:
        return True, f"Python {version.major}.{version.minor}.{version.micro}"
    else:
        return False, f"Python {version.major}.{version.minor} (required 3.8+)"


def _check_pytorch():
    """Check PyTorch installation."""
    try:
        import torch
        return True, f"PyTorch {torch.__version__}"
    except ImportError:
        return False, "Not installed"


def _check_opencv():
    """Check OpenCV installation."""
    try:
        import cv2
        return True, f"OpenCV {cv2.__version__}"
    except ImportError:
        return False, "Not installed"


def _check_cuda():
    """Check CUDA availability."""
    try:
        import torch
        if torch.cuda.is_available():
            device = torch.cuda.get_device_name(0)
            return True, f"{device} (CUDA {torch.version.cuda})"
        else:
            return False, "GPU not available (CPU mode)"
    except Exception:
        return False, "Error checking GPU"


def _check_directories():
    """Check required directories."""
    required_dirs = ['detections', 'data']
    
    for dir_name in required_dirs:
        Path(dir_name).mkdir(exist_ok=True)
    
    return True, "Directories created"


def setup_project():
    """Interactive setup for the project."""
    print("\n" + "=" * 60)
    print("WEAPON DETECTION SYSTEM - SETUP")
    print("=" * 60)
    
    # Check environment
    if not check_environment():
        print("\n⚠ Please fix the issues above before continuing.")
        return False
    
    # Create directories
    print("\nSetting up directories...")
    for dir_name in ['detections', 'data', 'logs']:
        Path(dir_name).mkdir(exist_ok=True)
    print("✓ Directories ready")
    
    # Load/create config
    print("\nConfiguring settings...")
    config_manager = ConfigManager()
    
    # Ask for model size
    print("\nSelect model size:")
    print("  n - Nano (fastest, least accurate)")
    print("  s - Small (fast, good accuracy)")
    print("  m - Medium (balanced)")
    print("  l - Large (slower, better accuracy)")
    print("  x - Extra Large (slowest, best accuracy)")
    
    model_choice = input("Enter choice (default: m): ").strip() or 'm'
    config_manager.set('model.name', model_choice)
    
    # Ask for confidence threshold
    threshold = input("Enter confidence threshold (0.0-1.0, default 0.5): ").strip()
    try:
        threshold = float(threshold) if threshold else 0.5
        if 0.0 <= threshold <= 1.0:
            config_manager.set('detection.confidence_threshold', threshold)
        else:
            print("Invalid value, using default 0.5")
    except ValueError:
        print("Invalid value, using default 0.5")
    
    config_manager.save()
    print("✓ Configuration saved")
    
    print("\n" + "=" * 60)
    print("✓ Setup complete!")
    print("\nNext steps:")
    print("  1. Place your images in the 'data' folder")
    print("  2. Run: python weapon_detection.py")
    print("  3. Or run: python examples.py")
    print("=" * 60)
    
    return True


def print_quick_start():
    """Print quick start guide."""
    guide = """
╔═══════════════════════════════════════════════════════════╗
║         WEAPON DETECTION - QUICK START GUIDE              ║
╚═══════════════════════════════════════════════════════════╝

1. INSTALL DEPENDENCIES
   -------------------
   pip install -r requirements.txt

2. RUN SETUP (Optional but recommended)
   ----------------------------------
   python setup_utils.py

3. BASIC USAGE
   -----------
   # Interactive mode
   python weapon_detection.py
   
   # Run examples
   python examples.py

4. PYTHON CODE EXAMPLE
   -------------------
   from weapon_detection import WeaponDetector
   
   detector = WeaponDetector(model_name='m', confidence_threshold=0.5)
   result = detector.detect_in_image('image.jpg')
   print(f"Detected {result['num_detections']} weapons")

5. CONFIDENCE TUNING (Reduce False Positives)
   -----------------------------------------
   detector.set_confidence_threshold(0.65)  # Higher = fewer FPs

6. DATASETS & VALIDATION
   ----------------------
   Place your images in 'data/' folder
   Use examples.py to run batch processing and validation

═════════════════════════════════════════════════════════════
For detailed documentation, see README.md
╚═══════════════════════════════════════════════════════════╝
"""
    print(guide)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Weapon Detection Setup Utilities')
    parser.add_argument('--setup', action='store_true', help='Run interactive setup')
    parser.add_argument('--check', action='store_true', help='Check environment')
    parser.add_argument('--quick', action='store_true', help='Print quick start guide')
    
    args = parser.parse_args()
    
    if args.setup:
        setup_project()
    elif args.check:
        check_environment()
    elif args.quick:
        print_quick_start()
    else:
        print_quick_start()
        print("\nUsage:")
        print("  python setup_utils.py --setup    Run interactive setup")
        print("  python setup_utils.py --check    Check environment")
        print("  python setup_utils.py --quick    Show quick start guide")

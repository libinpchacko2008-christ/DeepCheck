import os
import cv2
from typing import Tuple, Optional

# Constants
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_VIDEO_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_VIDEO_DURATION_SECONDS = 60.0   # 60 seconds

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4"}

def detect_file_format_from_bytes(header: bytes) -> Optional[str]:
    """
    Inspects magic bytes to detect file format.
    Returns: 'jpg', 'png', 'mp4', or None
    """
    if len(header) < 12:
        return None
    
    # JPEG magic bytes: FF D8 FF
    if header.startswith(b"\xff\xd8\xff"):
        return "jpg"
    
    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    
    # MP4 file type box: offset 4 contains 'ftyp'
    if header[4:8] == b"ftyp":
        return "mp4"
        
    return None


def validate_file_metadata(filename: str, file_size: int, mime_type: Optional[str] = None) -> Tuple[bool, str, str]:
    """
    Validates file size and basic extension.
    Returns (is_valid, media_type, error_message).
    media_type is 'image' or 'video'.
    """
    ext = os.path.splitext(filename)[1].lower()
    
    if ext in [".jpg", ".jpeg", ".png"]:
        media_type = "image"
        if file_size > MAX_IMAGE_BYTES:
            max_mb = MAX_IMAGE_BYTES // (1024 * 1024)
            size_mb = round(file_size / (1024 * 1024), 2)
            return False, media_type, f"Image size exceeds the {max_mb} MB limit (uploaded file is {size_mb} MB)."
        return True, media_type, ""
        
    elif ext == ".mp4":
        media_type = "video"
        if file_size > MAX_VIDEO_BYTES:
            max_mb = MAX_VIDEO_BYTES // (1024 * 1024)
            size_mb = round(file_size / (1024 * 1024), 2)
            return False, media_type, f"Video size exceeds the {max_mb} MB limit (uploaded file is {size_mb} MB)."
        return True, media_type, ""
        
    else:
        return False, "unknown", f"Unsupported file extension '{ext}'. Only JPG, PNG, and MP4 files are accepted."


def validate_file_content(file_path: str, expected_media_type: str) -> Tuple[bool, str]:
    """
    Validates magic bytes and media integrity (using OpenCV).
    For videos, verifies duration does not exceed 60 seconds.
    """
    if not os.path.exists(file_path):
        return False, "Temporary file could not be found."
        
    # Read header
    try:
        with open(file_path, "rb") as f:
            header = f.read(32)
    except Exception as e:
        return False, f"Could not read uploaded file: {str(e)}"
        
    detected_format = detect_file_format_from_bytes(header)
    if not detected_format:
        return False, "Corrupted or invalid file header. The file signature does not match standard JPG, PNG, or MP4 formats."
        
    if expected_media_type == "image":
        if detected_format not in ["jpg", "png"]:
            return False, f"File signature ({detected_format}) does not match an image format."
        # Validate that OpenCV / Pillow can actually decode it
        img = cv2.imread(file_path)
        if img is None or img.size == 0:
            return False, "The image file appears to be corrupted or cannot be decoded."
            
    elif expected_media_type == "video":
        if detected_format != "mp4":
            return False, f"File signature ({detected_format}) does not match MP4 video format."
            
        # Check video stream and duration with OpenCV
        cap = cv2.VideoCapture(file_path)
        if not cap.isOpened():
            cap.release()
            return False, "The video stream cannot be opened or is corrupted."
            
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        cap.release()
        
        if fps <= 0 or frame_count <= 0:
            return False, "Invalid video properties: unable to determine frame rate or duration."
            
        duration = frame_count / fps
        if duration > MAX_VIDEO_DURATION_SECONDS:
            return False, f"Video duration ({round(duration, 1)}s) exceeds the maximum allowed limit of {int(MAX_VIDEO_DURATION_SECONDS)} seconds."
            
    return True, ""

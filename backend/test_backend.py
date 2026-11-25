import os
import sys
import cv2
import numpy as np

# Ensure app package is in path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.validator import detect_file_format_from_bytes, validate_file_metadata, validate_file_content
from app.detector import detector_service, MANIPULATION_THRESHOLD, AUTHENTIC_THRESHOLD
from app.samples import get_sample_reports

def run_tests():
    print("=== [1] Testing Validator Module ===")
    
    # 1. Magic byte tests
    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01"
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    mp4_bytes = b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00"
    bad_bytes = b"NOT_A_VALID_MEDIA_FILE_HEADER"
    
    assert detect_file_format_from_bytes(jpeg_bytes) == "jpg", "JPEG detection failed"
    assert detect_file_format_from_bytes(png_bytes) == "png", "PNG detection failed"
    assert detect_file_format_from_bytes(mp4_bytes) == "mp4", "MP4 detection failed"
    assert detect_file_format_from_bytes(bad_bytes) is None, "Bad bytes falsely recognized"
    print("✓ Magic bytes verification passed.")

    # 2. Size limit tests
    val, mtype, err = validate_file_metadata("photo.jpg", 5 * 1024 * 1024)
    assert val and mtype == "image", f"Valid image rejected: {err}"
    
    val, mtype, err = validate_file_metadata("huge.jpg", 15 * 1024 * 1024)
    assert not val and "exceeds" in err, "Oversized image was not blocked"

    val, mtype, err = validate_file_metadata("clip.mp4", 45 * 1024 * 1024)
    assert val and mtype == "video", f"Valid video rejected: {err}"

    val, mtype, err = validate_file_metadata("huge.mp4", 60 * 1024 * 1024)
    assert not val and "exceeds" in err, "Oversized video was not blocked"

    val, mtype, err = validate_file_metadata("bad.exe", 1000)
    assert not val and "Unsupported file extension" in err, "Unsupported extension was not blocked"
    print("✓ File limits & extension validation passed.")

    print("\n=== [2] Testing Sample Reports Module ===")
    samples = get_sample_reports()
    assert len(samples) >= 3, "Expected at least 3 sample reports"
    assert any(s["verdict"] == "Manipulation indicators detected" for s in samples)
    assert any(s["verdict"] == "No strong manipulation indicators detected" for s in samples)
    assert any(s["verdict"] == "Inconclusive" for s in samples)
    for s in samples:
        assert s["is_sample"] is True
    print(f"✓ Sample reports valid ({len(samples)} benchmark cases available).")

    print("\n=== [3] Initializing Detector & Loading Model ===")
    success, err = detector_service.load_model()
    print(f"Model load success: {success}, error: {err}")
    assert success, f"Detector failed to load model: {err}"
    assert detector_service.is_loaded, "detector_service.is_loaded is False"

    print("\n=== [4] Testing No-Face Handling ===")
    # Generate synthetic image without any face (pure solid background with text)
    blank_img_path = os.path.abspath("test_no_face.jpg")
    blank = np.zeros((400, 400, 3), dtype=np.uint8)
    cv2.putText(blank, "DeepCheck Test No Face", (30, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.imwrite(blank_img_path, blank)

    res_no_face = detector_service.analyze_image(blank_img_path)
    if os.path.exists(blank_img_path):
        os.remove(blank_img_path)
        
    print("No-face result verdict:", res_no_face.get("verdict"))
    print("No-face reason:", res_no_face.get("reason"))
    assert res_no_face["verdict"] == "Inconclusive", "No-face image must yield Inconclusive"
    assert "No usable faces detected" in res_no_face["reason"]
    print("✓ No-face detection correctly returns 'Inconclusive'.")

    print("\n=== [5] Testing Image Face Inference with Workspace Photo ===")
    # Check if a workspace photo with a face exists
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    sample_photos = [f for f in os.listdir(parent_dir) if f.lower().endswith(".jpg")]
    
    analyzed_real_photo = False
    for photo_name in sample_photos[:5]:
        full_path = os.path.join(parent_dir, photo_name)
        if os.path.getsize(full_path) < 10 * 1024 * 1024:
            print(f"Testing real photo: {photo_name}")
            res = detector_service.analyze_image(full_path)
            print(f"  Faces detected: {res['faces_detected']}")
            print(f"  Verdict: {res['verdict']}")
            print(f"  Model score: {res['model_score']}")
            print(f"  Reason: {res['reason']}")
            analyzed_real_photo = True
            break
            
    if not analyzed_real_photo:
        print("Note: No suitable <10MB photo in directory, skipped real photo test.")
    else:
        print("✓ Real photo inference succeeded.")

    print("\n=== [6] Testing Synthetic Video Sampling & Timeline ===")
    # Create a 2-second synthetic video
    test_video_path = os.path.abspath("test_clip.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(test_video_path, fourcc, 20.0, (320, 240))
    for i in range(40):
        frame = np.zeros((240, 320, 3), dtype=np.uint8)
        cv2.putText(frame, f"Frame {i}", (50, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        out.write(frame)
    out.release()

    res_video = detector_service.analyze_video(test_video_path)
    if os.path.exists(test_video_path):
        os.remove(test_video_path)
        
    print("Video verdict:", res_video["verdict"])
    print("Frames analyzed:", res_video["frames_analyzed"])
    print("Timeline entries:", len(res_video["timeline"]))
    assert res_video["verdict"] == "Inconclusive", "Video with no faces must return Inconclusive"
    assert len(res_video["timeline"]) > 0, "Timeline points should be recorded"
    print("✓ Video frame sampling and timeline generation verified.")

    print("\n==========================================")
    print("ALL DEEPCHECK BACKEND TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()

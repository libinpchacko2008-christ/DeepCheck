import os
import cv2
import numpy as np
import requests

BASE_URL = "http://127.0.0.1:8000/api"

def test_api():
    print("=== [1] Testing /health ===")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    health = r.json()
    print("Health response:", health)
    assert health["detector_available"] is True

    print("\n=== [2] Testing /sample-reports ===")
    r = requests.get(f"{BASE_URL}/sample-reports")
    assert r.status_code == 200
    samples = r.json()["samples"]
    print(f"Retrieved {len(samples)} sample reports.")
    assert len(samples) >= 3

    print("\n=== [3] Testing Live Authentic Photo Upload ===")
    photo_path = os.path.abspath("../../IMG-20250829-WA0005.jpg")
    if os.path.exists(photo_path):
        with open(photo_path, "rb") as f:
            r = requests.post(f"{BASE_URL}/analyze", files={"file": ("portrait.jpg", f, "image/jpeg")})
        assert r.status_code == 200, f"Analysis failed: {r.text}"
        data = r.json()
        print("Verdict:", data["verdict"])
        print("Model score:", data["model_score"])
        print("Faces detected:", data["faces_detected"])
        assert data["verdict"] == "No strong manipulation indicators detected"
        print("✓ Authentic photo test passed.")

    print("\n=== [4] Testing No-Face Image Upload ===")
    # Generate blank image
    blank = np.zeros((300, 300, 3), dtype=np.uint8)
    cv2.putText(blank, "No Face", (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    _, buf = cv2.imencode(".png", blank)
    r = requests.post(f"{BASE_URL}/analyze", files={"file": ("blank.png", buf.tobytes(), "image/png")})
    assert r.status_code == 200, f"No-face test failed: {r.text}"
    data = r.json()
    print("No-face Verdict:", data["verdict"])
    print("No-face Reason:", data["reason"])
    assert data["verdict"] == "Inconclusive"
    assert "No usable faces detected" in data["reason"]
    print("✓ No-face handling verified.")

    print("\n=== [5] Testing Video Upload & Frame Timeline ===")
    # Create 2-second clip
    temp_vid = "temp_test_clip.mp4"
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_vid, fourcc, 15.0, (320, 240))
    for i in range(30):
        f = np.zeros((240, 320, 3), dtype=np.uint8)
        cv2.putText(f, f"F{i}", (30, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)
        out.write(f)
    out.release()

    with open(temp_vid, "rb") as f:
        r = requests.post(f"{BASE_URL}/analyze", files={"file": ("clip.mp4", f, "video/mp4")})
    if os.path.exists(temp_vid):
        os.remove(temp_vid)

    assert r.status_code == 200, f"Video test failed: {r.text}"
    data = r.json()
    print("Video Verdict:", data["verdict"])
    print("Frames analyzed:", data["frames_analyzed"])
    print("Timeline entries count:", len(data["timeline"]))
    assert data["media_type"] == "video"
    assert len(data["timeline"]) > 0
    print("✓ Video upload, frame sampling, and timeline verified.")

    print("\n=== [6] Testing Invalid/Corrupted File Signature ===")
    fake_payload = b"FAKE_CORRUPTED_BYTES_NOT_A_VALID_HEADER_FOR_JPG"
    r = requests.post(f"{BASE_URL}/analyze", files={"file": ("bad.jpg", fake_payload, "image/jpeg")})
    print("Bad file status code:", r.status_code)
    print("Bad file error message:", r.json()["detail"])
    assert r.status_code == 400
    assert "signature does not match" in r.json()["detail"] or "header" in r.json()["detail"]
    print("✓ Invalid signature rejected with friendly 400 error.")

    print("\n=== [7] Testing Oversized File Rejection ===")
    # 11 MB fake payload
    oversized = b"\xff\xd8\xff\xe0" + b"\x00" * (11 * 1024 * 1024)
    r = requests.post(f"{BASE_URL}/analyze", files={"file": ("huge.jpg", oversized, "image/jpeg")})
    print("Oversized file status:", r.status_code)
    assert r.status_code in [400, 413]
    print("✓ Oversized payload successfully blocked.")

    print("\n==========================================")
    print("ALL LIVE END-TO-END VERIFICATIONS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    test_api()

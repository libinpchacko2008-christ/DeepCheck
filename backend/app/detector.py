import os
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

# Global detector state
MODEL_ID = "dima806/deepfake_vs_real_image_detection"
MANIPULATION_THRESHOLD = 0.65
AUTHENTIC_THRESHOLD = 0.35
MAX_VIDEO_SAMPLED_FRAMES = 16

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "weights")
YUNET_PATH = os.path.join(WEIGHTS_DIR, "face_detection_yunet_2023mar.onnx")
HAAR_PATH = os.path.join(WEIGHTS_DIR, "haarcascade_frontalface_default.xml")

class DeepfakeDetectorService:
    def __init__(self):
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.processor = None
        self.model = None
        self.device = "cpu"
        self.yunet_detector = None
        self.face_cascade = None
        self.last_detector_used: Optional[str] = None
        
        # Load face detector
        self._init_face_detector()
        
    def _init_face_detector(self):
        """
        Initializes YuNet ONNX face detector as primary, with Haar Cascade as fallback.
        """
        # Primary: OpenCV YuNet
        if os.path.exists(YUNET_PATH):
            try:
                # Dummy input size (320, 320), dynamically updated during detection
                self.yunet_detector = cv2.FaceDetectorYN.create(
                    model=YUNET_PATH,
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000
                )
            except Exception as e:
                print(f"[Detector] Notice: YuNet initialization failed: {e}")
                self.yunet_detector = None

        # Fallback: Haar Cascade (if available in OpenCV build)
        if hasattr(cv2, "CascadeClassifier"):
            cascade_src = HAAR_PATH if os.path.exists(HAAR_PATH) else (cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            if os.path.exists(cascade_src):
                try:
                    self.face_cascade = cv2.CascadeClassifier(cascade_src)
                except Exception as e:
                    self.face_cascade = None
        else:
            self.face_cascade = None
            
    def load_model(self) -> Tuple[bool, Optional[str]]:
        """
        Loads the pretrained Vision Transformer model and image processor.
        """
        if self.is_loaded:
            return True, None
            
        try:
            import torch
            from transformers import AutoImageProcessor, AutoModelForImageClassification
            
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"[Detector] Loading model {MODEL_ID} on {self.device}...")
            
            self.processor = AutoImageProcessor.from_pretrained(MODEL_ID)
            self.model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
            self.model.to(self.device)
            self.model.eval()
            
            self.is_loaded = True
            self.load_error = None
            print(f"[Detector] Model {MODEL_ID} loaded successfully.")
            return True, None
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[Detector] Model load failed: {e}")
            return False, self.load_error

    def detect_faces(self, cv2_bgr_image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Locates face bounding boxes (x, y, w, h) in the image.
        Uses YuNet if available, with automatic resolution downscaling for efficiency,
        falling back to Haar Cascade.
        """
        h_orig, w_orig = cv2_bgr_image.shape[:2]
        if h_orig == 0 or w_orig == 0:
            return []

        # 1. Try YuNet
        if self.yunet_detector is not None:
            try:
                # Downsample if ultra high-res (e.g. > 1600px) to optimize detection speed & accuracy
                scale = 1.0
                max_dim = max(h_orig, w_orig)
                if max_dim > 1280:
                    scale = 1280.0 / max_dim
                    w_scaled = int(w_orig * scale)
                    h_scaled = int(h_orig * scale)
                    img_for_detect = cv2.resize(cv2_bgr_image, (w_scaled, h_scaled))
                else:
                    w_scaled, h_scaled = w_orig, h_orig
                    img_for_detect = cv2_bgr_image

                self.yunet_detector.setInputSize((w_scaled, h_scaled))
                _, faces = self.yunet_detector.detect(img_for_detect)
                
                if faces is not None and len(faces) > 0:
                    self.last_detector_used = "OpenCV YuNet"
                    results = []
                    for face in faces:
                        fx, fy, fw, fh = face[:4]
                        # Scale back to original coordinates
                        x = int(fx / scale)
                        y = int(fy / scale)
                        w = int(fw / scale)
                        h = int(fh / scale)
                        # Sanity checks
                        x = max(0, min(x, w_orig - 1))
                        y = max(0, min(y, h_orig - 1))
                        w = max(10, min(w, w_orig - x))
                        h = max(10, min(h, h_orig - y))
                        results.append((x, y, w, h))
                    return results
            except Exception as e:
                print(f"[Detector] YuNet detection error: {e}")

        # 2. Fallback: Haar Cascade
        if self.face_cascade is not None and not self.face_cascade.empty():
            try:
                gray = cv2.cvtColor(cv2_bgr_image, cv2.COLOR_BGR2GRAY)
                scale = 1.0
                if max(h_orig, w_orig) > 1280:
                    scale = 1280.0 / max(h_orig, w_orig)
                    gray = cv2.resize(gray, (int(w_orig * scale), int(h_orig * scale)))
                gray = cv2.equalizeHist(gray)
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(30, 30)
                )
                if len(faces) > 0:
                    self.last_detector_used = "Haar Cascade"
                    return [(int(x / scale), int(y / scale), int(w / scale), int(h / scale)) for (x, y, w, h) in faces]
            except Exception as e:
                print(f"[Detector] Haar detection error: {e}")

        self.last_detector_used = None
        return []

    def _crop_face_with_margin(self, cv2_bgr_image: np.ndarray, bbox: Tuple[int, int, int, int], factor: float = 1.85) -> np.ndarray:
        """
        Crops a portrait-style head region centered on the detected face (factor ~1.85),
        matching the distribution of portrait datasets (FFHQ / CelebA-HQ / 140k Real/Fake)
        on which ViT classifiers are trained (including hair, chin, ears, and neck boundaries).
        """
        h_img, w_img = cv2_bgr_image.shape[:2]
        x, y, w, h = bbox
        cx, cy = x + w / 2.0, y + h / 2.0
        
        # Bounding box size for full head/portrait crop
        size = int(max(w, h) * factor)
        
        # Shift vertical center slightly downward to capture hair and upper chest/neck
        y_center_shift = int(size * 0.05)
        
        x1 = max(0, int(cx - size / 2.0))
        y1 = max(0, int(cy - size / 2.0 - y_center_shift))
        x2 = min(w_img, int(cx + size / 2.0))
        y2 = min(h_img, int(cy + size / 2.0 + y_center_shift))
        
        crop = cv2_bgr_image[y1:y2, x1:x2]
        if crop.size == 0:
            return cv2_bgr_image[y:y+h, x:x+w]
        return crop

    def classify_face_crop(self, face_bgr: np.ndarray) -> float:
        """
        Runs ViT classification on the face crop.
        Returns: fake_score float between 0.0 and 1.0 (1.0 = manipulation detected)
        """
        if not self.is_loaded or self.model is None or self.processor is None:
            raise RuntimeError("Detector model is not loaded.")
            
        import torch
        # Convert BGR to RGB PIL Image
        face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(face_rgb)
        
        inputs = self.processor(images=pil_img, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1).squeeze().cpu().numpy()
            
        # id2label mapping: 0 -> Real, 1 -> Fake
        fake_score = float(probs[1])
        return fake_score

    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyzes a single image file for facial manipulation.
        """
        if not self.is_loaded:
            return {
                "detector_available": False,
                "error": f"Detector unavailable: {self.load_error or 'Weights not loaded'}"
            }
            
        img = cv2.imread(image_path)
        if img is None:
            return {
                "verdict": "Inconclusive",
                "verdict_severity": "warning",
                "reason": "Unable to decode image file format.",
                "faces_detected": 0,
                "frames_analyzed": 0,
                "model_score": None,
                "timeline": []
            }
            
        faces = self.detect_faces(img)
        if not faces:
            return {
                "verdict": "Inconclusive",
                "verdict_severity": "warning",
                "confidence_level": "No Faces Found",
                "reason": "No usable faces detected in the provided image. Face manipulation analysis requires visible facial regions.",
                "faces_detected": 0,
                "frames_analyzed": 1,
                "model_score": None,
                "timeline": [],
                "model_info": self.get_model_info(),
                "disclaimer": self.get_disclaimer()
            }
            
        face_scores = []
        for bbox in faces:
            crop = self._crop_face_with_margin(img, bbox)
            if crop.size > 0:
                score = self.classify_face_crop(crop)
                face_scores.append(score)
                
        if not face_scores:
            return {
                "verdict": "Inconclusive",
                "verdict_severity": "warning",
                "reason": "Face crops were empty or could not be processed.",
                "faces_detected": len(faces),
                "frames_analyzed": 1,
                "model_score": None,
                "timeline": []
            }
            
        # Multi-face aggregation: an image is compromised if ANY face shows manipulation.
        # Use max_score so a manipulated face is not diluted by innocent bystanders.
        avg_score = float(np.mean(face_scores))
        max_score = float(np.max(face_scores))
        primary_score = max_score
        
        face_breakdown = []
        for idx, (score, bbox) in enumerate(zip(face_scores, faces)):
            face_breakdown.append({
                "face_index": idx + 1,
                "score": round(score, 4),
                "bbox": {"x": bbox[0], "y": bbox[1], "w": bbox[2], "h": bbox[3]},
                "flagged": bool(score >= MANIPULATION_THRESHOLD)
            })
        
        verdict, severity, confidence, reason = self._compute_verdict(
            avg_score=primary_score,
            flagged_ratio=1.0 if primary_score >= MANIPULATION_THRESHOLD else 0.0,
            usable_frames=1
        )
        
        if len(faces) > 1:
            if primary_score >= MANIPULATION_THRESHOLD:
                flagged_idx = int(np.argmax(face_scores)) + 1
                reason = f"Face #{flagged_idx} exhibited high manipulation indicators (score: {round(primary_score, 3)}), exceeding the {MANIPULATION_THRESHOLD} threshold across {len(faces)} detected faces."
            elif primary_score > AUTHENTIC_THRESHOLD:
                suspicious_idx = int(np.argmax(face_scores)) + 1
                reason = f"Face #{suspicious_idx} showed borderline elevated score ({round(primary_score, 3)}) in the inconclusive range ({AUTHENTIC_THRESHOLD} - {MANIPULATION_THRESHOLD}) among {len(faces)} detected faces."
            else:
                reason = f"All {len(faces)} detected faces exhibit natural textures below the authentic threshold of {AUTHENTIC_THRESHOLD} (highest face score: {round(primary_score, 3)})."
        
        timeline = [{
            "timestamp_sec": 0.0,
            "frame_index": 0,
            "score": round(primary_score, 4),
            "flagged": bool(primary_score >= MANIPULATION_THRESHOLD)
        }]
        
        return {
            "media_type": "image",
            "is_sample": False,
            "face_detector_used": self.last_detector_used or "OpenCV YuNet",
            "faces_detected": len(faces),
            "face_breakdown": face_breakdown,
            "frames_analyzed": 1,
            "model_score": round(primary_score, 4),
            "score_label": "Model score (Fake likelihood: 0 = Real, 1 = Fake)",
            "verdict": verdict,
            "verdict_severity": severity,
            "confidence_level": confidence,
            "reason": reason,
            "thresholds_applied": {
                "manipulation_threshold": MANIPULATION_THRESHOLD,
                "authentic_threshold": AUTHENTIC_THRESHOLD,
                "flagged_frames_ratio": f"{1 if primary_score >= MANIPULATION_THRESHOLD else 0} of 1 frame ({100.0 if primary_score >= MANIPULATION_THRESHOLD else 0.0}%)"
            },
            "timeline": timeline,
            "model_info": self.get_model_info(),
            "disclaimer": self.get_disclaimer()
        }

    def analyze_video(self, video_path: str) -> Dict[str, Any]:
        """
        Extracts frames across video clip, detects faces, scores each frame,
        and aggregates temporal frame scores into a structured verdict and timeline.
        """
        if not self.is_loaded:
            return {
                "detector_available": False,
                "error": f"Detector unavailable: {self.load_error or 'Weights not loaded'}"
            }
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {
                "verdict": "Inconclusive",
                "verdict_severity": "warning",
                "reason": "Unable to read video stream.",
                "faces_detected": 0,
                "frames_analyzed": 0,
                "model_score": None,
                "timeline": []
            }
            
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        if fps <= 0:
            fps = 30.0
        duration_sec = total_frames / fps
        
        if total_frames <= 0:
            cap.release()
            return {
                "verdict": "Inconclusive",
                "verdict_severity": "warning",
                "reason": "Video stream contained 0 readable frames.",
                "faces_detected": 0,
                "frames_analyzed": 0,
                "model_score": None,
                "timeline": []
            }
            
        # Sample up to MAX_VIDEO_SAMPLED_FRAMES evenly across the video
        sample_indices = np.linspace(0, total_frames - 1, num=min(MAX_VIDEO_SAMPLED_FRAMES, total_frames), dtype=int)
        sample_indices = sorted(list(set(sample_indices)))
        
        timeline: List[Dict[str, Any]] = []
        frame_scores: List[float] = []
        total_faces_found = 0
        
        for idx in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                continue
                
            timestamp_sec = round(idx / fps, 2)
            faces = self.detect_faces(frame)
            if not faces:
                timeline.append({
                    "timestamp_sec": timestamp_sec,
                    "frame_index": int(idx),
                    "score": None,
                    "flagged": False,
                    "note": "No face localized"
                })
                continue
                
            total_faces_found += len(faces)
            per_frame_face_scores = []
            for bbox in faces:
                crop = self._crop_face_with_margin(frame, bbox)
                if crop.size > 0:
                    score = self.classify_face_crop(crop)
                    per_frame_face_scores.append(score)
                    
            if per_frame_face_scores:
                best_score = float(np.max(per_frame_face_scores))
                flagged = bool(best_score >= MANIPULATION_THRESHOLD)
                frame_scores.append(best_score)
                timeline.append({
                    "timestamp_sec": timestamp_sec,
                    "frame_index": int(idx),
                    "score": round(best_score, 4),
                    "flagged": flagged
                })
                
        cap.release()
        
        usable_frames = len(frame_scores)
        if usable_frames == 0:
            return {
                "media_type": "video",
                "is_sample": False,
                "duration_sec": round(duration_sec, 2),
                "faces_detected": 0,
                "frames_analyzed": len(sample_indices),
                "model_score": None,
                "score_label": "Model score (Fake likelihood: 0 = Real, 1 = Fake)",
                "verdict": "Inconclusive",
                "verdict_severity": "warning",
                "confidence_level": "No Usable Faces",
                "reason": "No usable faces detected across any sampled video frames. Face manipulation analysis requires visible facial regions.",
                "thresholds_applied": {
                    "manipulation_threshold": MANIPULATION_THRESHOLD,
                    "authentic_threshold": AUTHENTIC_THRESHOLD,
                    "flagged_frames_ratio": "0 usable frames"
                },
                "timeline": timeline,
                "model_info": self.get_model_info(),
                "disclaimer": self.get_disclaimer()
            }
            
        if usable_frames < 3 and total_frames >= 10:
            avg_score = float(np.mean(frame_scores))
            return {
                "media_type": "video",
                "is_sample": False,
                "duration_sec": round(duration_sec, 2),
                "faces_detected": total_faces_found,
                "frames_analyzed": len(sample_indices),
                "model_score": round(avg_score, 4),
                "score_label": "Model score (Fake likelihood: 0 = Real, 1 = Fake)",
                "verdict": "Inconclusive",
                "verdict_severity": "warning",
                "confidence_level": "Insufficient Frames",
                "reason": f"Only {usable_frames} sampled frame(s) contained detectable faces. Video-level manipulation analysis requires at least 3 usable face frames.",
                "thresholds_applied": {
                    "manipulation_threshold": MANIPULATION_THRESHOLD,
                    "authentic_threshold": AUTHENTIC_THRESHOLD,
                    "flagged_frames_ratio": f"{sum(1 for s in frame_scores if s >= MANIPULATION_THRESHOLD)} of {usable_frames} frames"
                },
                "timeline": timeline,
                "model_info": self.get_model_info(),
                "disclaimer": self.get_disclaimer()
            }
            
        flagged_count = sum(1 for s in frame_scores if s >= MANIPULATION_THRESHOLD)
        flagged_ratio = flagged_count / usable_frames
        avg_score = float(np.mean(frame_scores))
        
        verdict, severity, confidence, reason = self._compute_verdict(
            avg_score=avg_score,
            flagged_ratio=flagged_ratio,
            usable_frames=usable_frames
        )
        
        return {
            "media_type": "video",
            "is_sample": False,
            "face_detector_used": self.last_detector_used or "OpenCV YuNet",
            "duration_sec": round(duration_sec, 2),
            "faces_detected": total_faces_found,
            "frames_analyzed": len(sample_indices),
            "model_score": round(avg_score, 4),
            "score_label": "Model score (Fake likelihood: 0 = Real, 1 = Fake)",
            "verdict": verdict,
            "verdict_severity": severity,
            "confidence_level": confidence,
            "reason": reason,
            "thresholds_applied": {
                "manipulation_threshold": MANIPULATION_THRESHOLD,
                "authentic_threshold": AUTHENTIC_THRESHOLD,
                "flagged_frames_ratio": f"{flagged_count} of {usable_frames} frames ({round(flagged_ratio * 100, 1)}%)"
            },
            "timeline": timeline,
            "model_info": self.get_model_info(),
            "disclaimer": self.get_disclaimer()
        }

    def _compute_verdict(self, avg_score: float, flagged_ratio: float, usable_frames: int) -> Tuple[str, str, str, str]:
        """
        Determines verdict based on explicit threshold rules.
        Returns (verdict, severity, confidence, reason).
        """
        if avg_score >= MANIPULATION_THRESHOLD or flagged_ratio >= 0.40:
            verdict = "Manipulation indicators detected"
            severity = "high"
            confidence = "High Confidence" if (avg_score >= 0.75 or flagged_ratio >= 0.6) else "Moderate Confidence"
            reason = (
                f"Elevated synthesis indicators detected across facial crops (average score: {round(avg_score, 3)}, "
                f"flagged frames: {round(flagged_ratio * 100, 1)}%), exceeding the manipulation threshold of {MANIPULATION_THRESHOLD}."
            )
        elif avg_score <= AUTHENTIC_THRESHOLD and flagged_ratio <= 0.15:
            verdict = "No strong manipulation indicators detected"
            severity = "low"
            confidence = "High Confidence" if avg_score <= 0.20 else "Moderate Confidence"
            reason = (
                f"Facial regions exhibit natural texture and consistency below the authentic threshold of {AUTHENTIC_THRESHOLD} "
                f"(average score: {round(avg_score, 3)}, flagged frames: {round(flagged_ratio * 100, 1)}%)."
            )
        else:
            verdict = "Inconclusive"
            severity = "warning"
            confidence = "Uncertain Score"
            reason = (
                f"Model score ({round(avg_score, 3)}) falls into the borderline ambiguous range between {AUTHENTIC_THRESHOLD} "
                f"and {MANIPULATION_THRESHOLD}. Features show conflicting or noisy indicators."
            )
            
        return verdict, severity, confidence, reason

    @staticmethod
    def get_model_info() -> Dict[str, str]:
        return {
            "name": MODEL_ID,
            "architecture": "Vision Transformer (ViT-Base-Patch16-224)",
            "provenance": "Google ViT architecture fine-tuned on 140,000 real and synthetic facial images",
            "supported_manipulations": "Facial synthesis, deepfake face-swapping, expression reenactment, neural blending artifacts",
            "license": "Apache 2.0",
            "score_interpretation": "0.0 represents pristine natural face features; 1.0 represents synthetic manipulation indicators."
        }

    @staticmethod
    def get_disclaimer() -> str:
        return (
            "DeepCheck evaluates media against specific facial artifacts and compression features trained in its deepfake "
            "classification model. Detection indicators do not prove authenticity, and absent indicators do not guarantee "
            "media is unmanipulated."
        )

# Singleton detector instance
detector_service = DeepfakeDetectorService()

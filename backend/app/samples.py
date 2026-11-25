"""
Pre-computed sample report data for demonstration and college presentation purposes.
These sample reports are clearly demarcated from live inference results and provide
deterministic visualizations of how DeepCheck reports look across different scenarios.
"""

from typing import Dict, Any, List

SAMPLE_REPORTS: Dict[str, Dict[str, Any]] = {
    "sample_deepfake_video": {
        "id": "sample_deepfake_video",
        "title": "Sample 1: Manipulated Face-Swap Video",
        "media_type": "video",
        "is_sample": True,
        "filename": "sample_manipulated_interview.mp4",
        "file_size_formatted": "18.4 MB",
        "duration_sec": 14.5,
        "faces_detected": 1,
        "frames_analyzed": 12,
        "model_score": 0.865,
        "score_label": "Model score (Fake likelihood: 0 = Real, 1 = Fake)",
        "verdict": "Manipulation indicators detected",
        "verdict_severity": "high",
        "confidence_level": "High Confidence",
        "reason": "Consistent boundary blending artifacts and high per-frame manipulation scores (mean score 0.865, 83.3% frames flagged) across sampled facial crops.",
        "thresholds_applied": {
            "manipulation_threshold": 0.65,
            "authentic_threshold": 0.35,
            "flagged_frames_ratio": "10 of 12 frames (83.3%)"
        },
        "timeline": [
            {"timestamp_sec": 0.0, "frame_index": 0, "score": 0.82, "flagged": True},
            {"timestamp_sec": 1.3, "frame_index": 32, "score": 0.89, "flagged": True},
            {"timestamp_sec": 2.6, "frame_index": 65, "score": 0.91, "flagged": True},
            {"timestamp_sec": 3.9, "frame_index": 98, "score": 0.85, "flagged": True},
            {"timestamp_sec": 5.2, "frame_index": 130, "score": 0.79, "flagged": True},
            {"timestamp_sec": 6.5, "frame_index": 163, "score": 0.58, "flagged": False},
            {"timestamp_sec": 7.8, "frame_index": 195, "score": 0.88, "flagged": True},
            {"timestamp_sec": 9.1, "frame_index": 228, "score": 0.94, "flagged": True},
            {"timestamp_sec": 10.4, "frame_index": 260, "score": 0.89, "flagged": True},
            {"timestamp_sec": 11.7, "frame_index": 293, "score": 0.92, "flagged": True},
            {"timestamp_sec": 13.0, "frame_index": 325, "score": 0.88, "flagged": True},
            {"timestamp_sec": 14.3, "frame_index": 358, "score": 0.61, "flagged": False}
        ],
        "model_info": {
            "architecture": "Vision Transformer (ViT-Base-Patch16-224)",
            "pretrained_weights": "dima806/deepfake_vs_real_image_detection",
            "provenance": "Google ViT architecture fine-tuned on 140,000 real and synthetic facial images",
            "license": "Apache 2.0"
        },
        "disclaimer": "DeepCheck evaluates media against specific facial artifacts and compression features trained in the deepfake classification model. Detection indicators do not prove authenticity, and absent indicators do not guarantee media is unmanipulated."
    },
    "sample_authentic_photo": {
        "id": "sample_authentic_photo",
        "title": "Sample 2: Authentic High-Resolution Portrait",
        "media_type": "image",
        "is_sample": True,
        "filename": "sample_authentic_portrait.jpg",
        "file_size_formatted": "4.2 MB",
        "duration_sec": None,
        "faces_detected": 1,
        "frames_analyzed": 1,
        "model_score": 0.084,
        "score_label": "Model score (Fake likelihood: 0 = Real, 1 = Fake)",
        "verdict": "No strong manipulation indicators detected",
        "verdict_severity": "low",
        "confidence_level": "High Confidence",
        "reason": "Facial crop exhibits natural sensor noise patterns, anatomically consistent reflections, and absence of synthesis boundaries (model fake score 0.084 is below the 0.35 threshold).",
        "thresholds_applied": {
            "manipulation_threshold": 0.65,
            "authentic_threshold": 0.35,
            "flagged_frames_ratio": "0 of 1 frame (0.0%)"
        },
        "timeline": [
            {"timestamp_sec": 0.0, "frame_index": 0, "score": 0.084, "flagged": False}
        ],
        "model_info": {
            "architecture": "Vision Transformer (ViT-Base-Patch16-224)",
            "pretrained_weights": "dima806/deepfake_vs_real_image_detection",
            "provenance": "Google ViT architecture fine-tuned on 140,000 real and synthetic facial images",
            "license": "Apache 2.0"
        },
        "disclaimer": "DeepCheck evaluates media against specific facial artifacts and compression features trained in the deepfake classification model. Detection indicators do not prove authenticity, and absent indicators do not guarantee media is unmanipulated."
    },
    "sample_inconclusive_lowface": {
        "id": "sample_inconclusive_lowface",
        "title": "Sample 3: Inconclusive (Severe Motion Blur & Low Lighting)",
        "media_type": "video",
        "is_sample": True,
        "filename": "sample_night_commute.mp4",
        "file_size_formatted": "12.8 MB",
        "duration_sec": 9.2,
        "faces_detected": 0,
        "frames_analyzed": 10,
        "model_score": None,
        "score_label": "Model score (Fake likelihood: 0 = Real, 1 = Fake)",
        "verdict": "Inconclusive",
        "verdict_severity": "warning",
        "confidence_level": "Insufficient Data",
        "reason": "No usable facial landmarks or face regions could be localized across sampled frames due to low illumination and excessive motion blur.",
        "thresholds_applied": {
            "manipulation_threshold": 0.65,
            "authentic_threshold": 0.35,
            "flagged_frames_ratio": "0 usable frames"
        },
        "timeline": [],
        "model_info": {
            "architecture": "Vision Transformer (ViT-Base-Patch16-224)",
            "pretrained_weights": "dima806/deepfake_vs_real_image_detection",
            "provenance": "Google ViT architecture fine-tuned on 140,000 real and synthetic facial images",
            "license": "Apache 2.0"
        },
        "disclaimer": "DeepCheck evaluates media against specific facial artifacts and compression features trained in the deepfake classification model. Detection indicators do not prove authenticity, and absent indicators do not guarantee media is unmanipulated."
    }
}

def get_sample_reports() -> List[Dict[str, Any]]:
    return list(SAMPLE_REPORTS.values())

def get_sample_report_by_id(sample_id: str) -> Dict[str, Any]:
    return SAMPLE_REPORTS.get(sample_id, SAMPLE_REPORTS["sample_deepfake_video"])

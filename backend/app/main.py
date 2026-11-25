import os
import uuid
import tempfile
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.validator import (
    validate_file_metadata,
    validate_file_content,
    MAX_IMAGE_BYTES,
    MAX_VIDEO_BYTES,
    MAX_VIDEO_DURATION_SECONDS
)
from app.detector import detector_service
from app.samples import get_sample_reports, get_sample_report_by_id

# Lifespan event to preload detector model on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Attempt to load model in background or non-blocking
    print("[Main] Initializing DeepCheck detector service...")
    try:
        # Load model weights
        success, err = detector_service.load_model()
        if success:
            print("[Main] DeepCheck detector model successfully initialized.")
        else:
            print(f"[Main] Notice: Detector model could not be loaded ({err}). 'Detector unavailable' mode active.")
    except Exception as e:
        print(f"[Main] Error initializing detector: {e}")
    yield
    print("[Main] Shutting down DeepCheck service...")

app = FastAPI(
    title="DeepCheck API",
    description="Backend API for Face Manipulation & Deepfake Detection",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite development & general access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """
    Health and detector readiness endpoint.
    """
    return {
        "status": "healthy",
        "service": "DeepCheck Media Detector",
        "detector_available": detector_service.is_loaded,
        "detector_error": detector_service.load_error,
        "device": detector_service.device,
        "model_id": detector_service.get_model_info()["name"],
        "limits": {
            "max_image_mb": MAX_IMAGE_BYTES // (1024 * 1024),
            "max_video_mb": MAX_VIDEO_BYTES // (1024 * 1024),
            "max_video_duration_sec": int(MAX_VIDEO_DURATION_SECONDS),
            "accepted_formats": ["JPG", "PNG", "MP4"]
        }
    }


@app.get("/api/sample-reports")
async def list_samples() -> Dict[str, Any]:
    """
    Returns pre-computed sample reports for college presentation and demo mode.
    Clearly flagged with is_sample=True so sample data is never confused with live inference.
    """
    return {
        "samples": get_sample_reports()
    }


@app.get("/api/sample-reports/{sample_id}")
async def get_sample(sample_id: str) -> Dict[str, Any]:
    report = get_sample_report_by_id(sample_id)
    return report


@app.post("/api/analyze")
async def analyze_media(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    Receives an uploaded media file (JPG, PNG, or MP4), validates size, extension,
    magic byte signature, and video duration, then executes face manipulation detection.
    Guarantees temporary file removal immediately upon completion or error.
    """
    # 1. Enforce live detector availability
    if not detector_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Detector unavailable: Deep learning weights could not be loaded. "
                "You may explore the pre-computed demonstration reports via 'Try a Sample Report'."
            )
        )

    # 2. Basic metadata validation
    filename = file.filename or "uploaded_media"
    temp_dir = tempfile.gettempdir()
    unique_suffix = f"deepcheck_{uuid.uuid4().hex}_{os.path.basename(filename)}"
    temp_path = os.path.join(temp_dir, unique_suffix)

    # Read uploaded bytes and enforce size limits streaming-safe
    chunk_size = 1024 * 1024  # 1 MB chunk
    total_bytes = 0
    max_allowed_bytes = MAX_VIDEO_BYTES if filename.lower().endswith(".mp4") else MAX_IMAGE_BYTES

    try:
        with open(temp_path, "wb") as f_out:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_allowed_bytes:
                    max_mb = max_allowed_bytes // (1024 * 1024)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum size limit of {max_mb} MB."
                    )
                f_out.write(chunk)
                
        # 3. Check metadata and extensions
        meta_valid, media_type, meta_err = validate_file_metadata(filename, total_bytes, file.content_type)
        if not meta_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=meta_err
            )
            
        # 4. Validate magic byte signatures & stream properties
        content_valid, content_err = validate_file_content(temp_path, media_type)
        if not content_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=content_err
            )

        # 5. Execute analysis with a processing timeout
        try:
            # 60s processing timeout safeguard
            if media_type == "image":
                result = await asyncio.wait_for(
                    asyncio.to_thread(detector_service.analyze_image, temp_path),
                    timeout=45.0
                )
            else:
                result = await asyncio.wait_for(
                    asyncio.to_thread(detector_service.analyze_video, temp_path),
                    timeout=60.0
                )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Processing timed out while analyzing media. Please try a shorter video clip or smaller image."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis encountered an internal error: {str(e)}"
            )

        # Add file metadata to report
        result["filename"] = filename
        result["file_size_formatted"] = f"{round(total_bytes / (1024 * 1024), 2)} MB"
        result["is_sample"] = False
        return result

    finally:
        # Guarantee ephemeral file cleanup - never retain user media
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

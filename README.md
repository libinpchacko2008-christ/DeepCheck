# DeepCheck 🛡️ - Face Manipulation & Deepfake Detector

**DeepCheck** is a full-stack media forensics web application designed for a college project demo. It analyzes uploaded portraits and short video clips for subtle facial synthesis artifacts, blending seams, and temporal inconsistencies using computer vision and deep learning.

---

## 🔬 Model Provenance & Forensic Methodology

DeepCheck pairs modern computer vision face localization with deep transformer-based representation learning:

| Attribute | Specification |
| :--- | :--- |
| **Face Localization** | OpenCV YuNet (`face_detection_yunet_2023mar.onnx`) with adaptive resolution scaling |
| **Classifier Model** | `dima806/deepfake_vs_real_image_detection` |
| **Base Architecture** | Vision Transformer (`google/vit-base-patch16-224-in21k`) |
| **Training Dataset** | 140,000 balanced real and synthetic facial crops (FaceForensics++, Celeb-DF, and GAN syntheses) |
| **License** | Apache 2.0 |
| **Supported Manipulations** | Facial reenactment, deepfake face-swapping, expression manipulation, and boundary blending artifacts |

### Score Interpretation & Thresholds

The detector outputs a numeric **Model score** representing the probability that facial features contain synthetic manipulation signatures ($0.0 = \text{Real}, 1.0 = \text{Fake}$):

- **Manipulation indicators detected**: $\text{Model score} \ge 0.65$ or $\ge 40\%$ of video frames flagged.
- **No strong manipulation indicators detected**: $\text{Model score} \le 0.35$ and $< 15\%$ of video frames flagged.
- **Inconclusive**: $0.35 < \text{Model score} < 0.65$, or media with 0 detectable faces, or videos with $< 3$ usable face frames.

> **Honest Scientific Boundary**: DeepCheck evaluates media against specific facial synthesis patterns. Detection indicators do not prove malicious intent, and absent indicators cannot establish absolute authenticity.

---

## 🚀 Setup & Execution Guide (Windows PowerShell)

### Prerequisites
- **Python 3.11+** installed
- **Node.js v20+** installed

### 1. Start the Backend API

Open a PowerShell terminal:

```powershell
# Navigate to backend directory
cd "deepcheck\backend"

# (Optional) Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies (CPU PyTorch + OpenCV + Transformers + FastAPI)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install fastapi uvicorn python-multipart pydantic pillow opencv-python-headless transformers

# Launch FastAPI backend on port 8000
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will start at: **`http://127.0.0.1:8000`**
Interactive Swagger Docs: **`http://127.0.0.1:8000/docs`**

---

### 2. Start the Frontend Dashboard

Open a second PowerShell terminal:

```powershell
# Navigate to frontend directory
cd "deepcheck\frontend"

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend dashboard will be available at: **`http://localhost:5173`**

---

## 📋 College Presentation & Demo Checklist

Use this checklist during your project demonstration to showcase all key features:

1. **Verify Detector Health Indicator**
   - Open `http://localhost:5173`.
   - Observe the top navbar: verify the green badge reads **"Detector Online (ViT)"**.

2. **Drag & Drop Upload & Limits Display**
   - Note the prominent limit badges displayed beside the upload zone:
     - Images: JPG, PNG $\le 10\text{ MB}$
     - Videos: MP4 $\le 50\text{ MB}, \le 60\text{ seconds}$

3. **Live Authentic Photo Test**
   - Select an authentic photo.
   - Click **Analyze Media**. Watch the stage indicator progress:
     *Validating file* $\to$ *Detecting faces* $\to$ *Evaluating features* $\to$ *Aggregating verdict*.
   - Confirm verdict: **"No strong manipulation indicators detected"** (Green badge, low model score $< 0.35$).

4. **Edge Case: No-Face Detection Handling**
   - Upload an image with no human faces (e.g., a landscape or screenshot).
   - Observe immediate, honest verdict: **"Inconclusive"** with reason: *"No usable faces detected in the provided image. Face manipulation analysis requires visible facial regions."*

5. **Video Temporal Timeline Test**
   - Upload an MP4 video clip.
   - Inspect the **Sampled Frame Temporal Timeline** displaying per-frame timestamps (e.g. `0.0s`, `1.5s`, `3.0s`), bar scores, and flagged frame badges.

6. **Presentation Sample Reports (Benchmark Mode)**
   - Click the **"Try a Sample Report"** button in the header.
   - Demonstrate the 3 pre-computed benchmark scenarios:
     1. *Sample 1: Manipulated Face-Swap Video* (Shows high-confidence flagged timeline).
     2. *Sample 2: Authentic High-Resolution Portrait* (Shows low-score authentic verdict).
     3. *Sample 3: Inconclusive (Severe Motion Blur & Low Lighting)* (Demonstrates honest handling of poor data).
   - Note that sample reports are prominently watermarked as **"Demonstration Sample Report"** to prevent any confusion with live inference.

7. **Review "How It Works" Section**
   - Scroll to the bottom section to explain the 4 stages (Localization, ViT Inference, Frame Sampling, Calibration) and the documented limitations.

---

## 🔒 Security & Ephemeral Media Storage
- Uploaded files are verified against magic byte signatures before decoding.
- Processing is wrapped in a strict timeout (45s for images, 60s for video).
- Files are saved with randomized UUID filenames to temporary directory and **guaranteed to be deleted immediately** after inference (or on error) via Python `finally` blocks.
- No user media is logged, stored in databases, or retained on disk.

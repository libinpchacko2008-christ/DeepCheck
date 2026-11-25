import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { UploadArea } from './components/UploadArea';
import { PreviewSection } from './components/PreviewSection';
import { StageProgress } from './components/StageProgress';
import { VerdictCard } from './components/VerdictCard';
import { VideoTimeline } from './components/VideoTimeline';
import { HowItWorks } from './components/HowItWorks';
import { SampleModal } from './components/SampleModal';
import { AnalysisResult, AnalysisStage, SystemHealth } from './types';
import { api } from './api';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState<boolean>(false);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch health status on mount
  useEffect(() => {
    api.getHealth()
      .then((data) => setHealth(data))
      .catch((err) => {
        console.warn('Backend health check error:', err);
        setHealth({
          status: 'degraded',
          service: 'DeepCheck Detector',
          detector_available: false,
          detector_error: 'Unable to reach backend API',
          device: 'cpu',
          model_id: 'dima806/deepfake_vs_real_image_detection',
          limits: {
            max_image_mb: 10,
            max_video_mb: 50,
            max_video_duration_sec: 60,
            accepted_formats: ['JPG', 'PNG', 'MP4'],
          },
        });
      });
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisStage('idle');
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisStage('idle');
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;
    setAnalysisError(null);

    try {
      const result = await api.analyzeMedia(selectedFile, (stage) => {
        setAnalysisStage(stage);
      });
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err.message || 'An error occurred during analysis.');
      setAnalysisStage('error');
    }
  };

  const handleSelectSample = (sample: AnalysisResult) => {
    setSelectedFile(null);
    setAnalysisError(null);
    setAnalysisStage('complete');
    setAnalysisResult(sample);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisStage('idle');
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isVideo = selectedFile
    ? selectedFile.type.startsWith('video/') || selectedFile.name.toLowerCase().endsWith('.mp4')
    : analysisResult?.media_type === 'video';

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 dark:bg-[#0c0e12] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Navigation */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        health={health}
        onOpenSampleModal={() => setIsSampleModalOpen(true)}
        onScrollToHowItWorks={scrollToHowItWorks}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Tagline */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
            Forensic AI Media <span className="text-indigo-600 dark:text-indigo-400">Integrity Check</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            DeepCheck examines uploaded portrait photos and short video clips for subtle facial synthesis artifacts, boundary seams, and temporal anomalies using computer vision.
          </p>
        </div>

        {/* Dynamic Workflow View */}
        {!selectedFile && !analysisResult && (
          <div className="max-w-2xl mx-auto">
            <UploadArea
              onFileSelected={handleFileSelect}
              isDetectorAvailable={health?.detector_available ?? true}
              onOpenSampleReport={() => setIsSampleModalOpen(true)}
            />
          </div>
        )}

        {/* In-Progress or File Selected State (Before Result) */}
        {selectedFile && !analysisResult && (
          <div className="max-w-3xl mx-auto space-y-6">
            <PreviewSection
              file={selectedFile}
              onRemove={handleRemoveFile}
              onAnalyze={handleStartAnalysis}
              isAnalyzing={analysisStage !== 'idle' && analysisStage !== 'error'}
            />

            {analysisStage !== 'idle' && (
              <StageProgress
                stage={analysisStage}
                isVideo={isVideo}
                error={analysisError}
              />
            )}
          </div>
        )}

        {/* Results View: Side-by-Side on Desktop, Stacked on Mobile */}
        {analysisResult && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Media Preview */}
              <div className="lg:col-span-5 w-full">
                {selectedFile ? (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                      Source Media
                    </h3>
                    <div className="relative rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center max-h-[460px] border border-zinc-800">
                      {isVideo ? (
                        <video
                          src={URL.createObjectURL(selectedFile)}
                          controls
                          className="max-h-[460px] w-auto max-w-full rounded-lg"
                        />
                      ) : (
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Source analysis subject"
                          className="max-h-[460px] w-auto max-w-full object-contain rounded-lg"
                        />
                      )}
                    </div>
                    <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm text-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      Demonstration Sample
                    </h3>
                    <div className="p-8 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500">
                      {analysisResult.title || analysisResult.filename}
                      <p className="mt-1 text-[11px] text-zinc-400">
                        {analysisResult.media_type === 'video'
                          ? `Sample Video · ${analysisResult.duration_sec}s · ${analysisResult.file_size_formatted}`
                          : `Sample Image · ${analysisResult.file_size_formatted}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Verdict Card */}
              <div className="lg:col-span-7 w-full">
                <VerdictCard result={analysisResult} onReset={handleReset} />
              </div>
            </div>

            {/* Video Timeline (Full Width Below) */}
            {analysisResult.media_type === 'video' && analysisResult.timeline && analysisResult.timeline.length > 0 && (
              <VideoTimeline
                timeline={analysisResult.timeline}
                framesAnalyzed={analysisResult.frames_analyzed}
                threshold={analysisResult.thresholds_applied?.manipulation_threshold || 0.65}
              />
            )}
          </div>
        )}

        {/* How It Works Educational Section */}
        <HowItWorks />
      </main>

      {/* Presentation Sample Modal */}
      <SampleModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-zinc-950/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DeepCheck &copy; 2026 · College Academic Project Demo</span>
          <span>Computer Vision &amp; Deep Learning Facial Forgery Analysis</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

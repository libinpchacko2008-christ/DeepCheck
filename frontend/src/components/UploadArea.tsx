import React, { useState, useRef } from 'react';
import { Upload, FileImage, FileVideo, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  isDetectorAvailable: boolean;
  onOpenSampleReport: () => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileSelected,
  isDetectorAvailable,
  onOpenSampleReport,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setClientError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png'].includes(ext || '');
    const isVideo = ext === 'mp4';

    if (!isImage && !isVideo) {
      setClientError(`Unsupported file format (.${ext}). Only JPG, PNG, and MP4 files are supported.`);
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setClientError(`Image exceeds the 10 MB limit (selected file is ${sizeMb} MB).`);
      return;
    }

    if (isVideo && file.size > 50 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setClientError(`Video exceeds the 50 MB limit (selected file is ${sizeMb} MB).`);
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Detector offline warning banner if model unavailable */}
      {!isDetectorAvailable && (
        <div className="mb-6 p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Detector Weights Offline</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/90">
                Live inference is unavailable because weights could not be loaded into memory. User uploads will be rejected to prevent falsified mock results.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSampleReport}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors shrink-0"
          >
            Try a Sample Report
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload image or video file for face manipulation analysis"
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.005]'
            : 'border-zinc-300 dark:border-zinc-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/80 bg-zinc-50/50 dark:bg-zinc-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm transition-transform group-hover:scale-105">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Drag & drop media here, or{' '}
              <span className="text-indigo-600 dark:text-indigo-400 hover:underline">browse</span>
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Upload face photos or short video clips to scan for synthetic manipulation artifacts
            </p>
          </div>

          {/* Explicit Limits beside upload control */}
          <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 text-xs border border-zinc-300 dark:border-zinc-700">
            <span className="flex items-center space-x-1 font-medium">
              <FileImage className="w-3.5 h-3.5 text-indigo-500" />
              <span>JPG, PNG (≤ 10 MB)</span>
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">•</span>
            <span className="flex items-center space-x-1 font-medium">
              <FileVideo className="w-3.5 h-3.5 text-indigo-500" />
              <span>MP4 (≤ 50 MB, ≤ 60s)</span>
            </span>
          </div>

          <button
            type="button"
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all pointer-events-none"
          >
            Choose File
          </button>
        </div>
      </div>

      {/* Client validation error message */}
      {clientError && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center space-x-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{clientError}</span>
        </div>
      )}

      {/* Privacy note */}
      <div className="mt-3 flex items-center justify-center space-x-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <Info className="w-3.5 h-3.5" />
        <span>Files are processed in memory and temporary storage, then immediately deleted after analysis.</span>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Trash2, FileImage, FileVideo, Sparkles, Loader2 } from 'lucide-react';

interface PreviewSectionProps {
  file: File;
  onRemove: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  file,
  onRemove,
  onAnalyze,
  isAnalyzing,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isVideo = file.type.startsWith('video/') || file.name.toLowerCase().endsWith('.mp4');
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm transition-all">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            {isVideo ? <FileVideo className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={file.name}>
              {file.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isVideo ? 'MP4 Video' : 'Image'} · {sizeMb} MB
            </p>
          </div>
        </div>

        {/* Remove button */}
        {!isAnalyzing && (
          <button
            onClick={onRemove}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-colors"
            title="Remove file"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Media Preview Box */}
      <div className="mt-4 relative rounded-xl overflow-hidden bg-zinc-950 flex items-center justify-center min-h-[260px] max-h-[420px] border border-zinc-800">
        {previewUrl && (
          isVideo ? (
            <video
              src={previewUrl}
              controls
              className="max-h-[420px] w-auto max-w-full rounded-lg"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={previewUrl}
              alt="Uploaded Preview"
              className="max-h-[420px] w-auto max-w-full object-contain rounded-lg"
            />
          )
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 transition-all ${
            isAnalyzing
              ? 'bg-indigo-500 cursor-not-allowed opacity-80'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
          }`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Media...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze Media</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

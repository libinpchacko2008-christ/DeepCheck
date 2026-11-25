import React, { useEffect, useState } from 'react';
import { X, Sparkles, Film, Image as ImageIcon, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { AnalysisResult } from '../types';
import { api } from '../api';

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: AnalysisResult) => void;
}

export const SampleModal: React.FC<SampleModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  const [samples, setSamples] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getSampleReports()
        .then((data) => {
          setSamples(data.samples);
        })
        .catch((err) => {
          console.error('Failed to load sample reports', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Demo & Presentation Sample Reports
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pre-computed benchmarks to showcase DeepCheck reports during project demonstrations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sample modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-10 text-sm text-zinc-500">Loading samples...</div>
          ) : (
            samples.map((sample) => {
              const isManipulated = sample.verdict === 'Manipulation indicators detected';
              const isAuthentic = sample.verdict === 'No strong manipulation indicators detected';

              return (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample);
                    onClose();
                  }}
                  className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {sample.media_type === 'video' ? (
                        <Film className="w-4 h-4 text-indigo-500" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                      )}
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {sample.title || sample.filename}
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {sample.reason}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isManipulated
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          : isAuthentic
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {isManipulated ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : isAuthentic ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <HelpCircle className="w-3 h-3" />
                      )}
                      <span>{sample.verdict}</span>
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-zinc-100/60 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
          Note: Sample reports are distinctly tagged and maintained separately from live user uploads.
        </div>
      </div>
    </div>
  );
};

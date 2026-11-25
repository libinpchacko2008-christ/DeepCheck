import React from 'react';
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { AnalysisStage } from '../types';

interface StageProgressProps {
  stage: AnalysisStage;
  isVideo: boolean;
  error?: string | null;
}

interface StepDefinition {
  key: AnalysisStage;
  label: string;
  description: string;
}

export const StageProgress: React.FC<StageProgressProps> = ({ stage, isVideo, error }) => {
  const steps: StepDefinition[] = [
    {
      key: 'validating',
      label: 'Validating file',
      description: 'Checking magic bytes, format signature, and file size constraints',
    },
    {
      key: 'detecting_faces',
      label: 'Detecting faces',
      description: 'Running facial landmark localization and bounding crop extraction',
    },
    {
      key: isVideo ? 'analyzing_frames' : 'aggregating',
      label: isVideo ? 'Analyzing frames' : 'Evaluating features',
      description: isVideo
        ? 'Uniformly sampling frames and computing per-frame manipulation probabilities'
        : 'Running Vision Transformer inference across localized facial regions',
    },
    {
      key: 'aggregating',
      label: 'Aggregating verdict',
      description: 'Applying score calibration thresholds and generating forensic report',
    },
  ];

  const getStepIndex = (st: AnalysisStage): number => {
    switch (st) {
      case 'idle':
        return -1;
      case 'validating':
        return 0;
      case 'detecting_faces':
        return 1;
      case 'analyzing_frames':
        return 2;
      case 'aggregating':
        return 3;
      case 'complete':
        return 4;
      case 'error':
        return -2;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(stage);

  if (stage === 'error') {
    return (
      <div className="w-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/80 rounded-2xl p-5 my-6">
        <div className="flex items-start space-x-3 text-red-700 dark:text-red-300">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Analysis Could Not Complete</h4>
            <p className="text-xs mt-1 text-red-600 dark:text-red-300/90">
              {error || 'An error occurred during file processing.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 my-6 shadow-sm">
      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Analysis In Progress
        </h4>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Evaluating media with DeepCheck pipeline
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((s, index) => {
          const isDone = currentIndex > index || stage === 'complete';
          const isCurrent = currentIndex === index;

          return (
            <div key={s.key} className="flex items-start space-x-3 transition-opacity duration-200">
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
                )}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                      : isDone
                      ? 'text-zinc-900 dark:text-zinc-200'
                      : 'text-zinc-400 dark:text-zinc-600'
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

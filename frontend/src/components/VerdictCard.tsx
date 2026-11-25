import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  RotateCcw, 
  Info, 
  Sparkles, 
  Layers, 
  ScanFace, 
  Film
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface VerdictCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ result, onReset }) => {
  const {
    verdict,
    confidence_level,
    reason,
    model_score,
    score_label,
    faces_detected,
    frames_analyzed,
    thresholds_applied,
    model_info,
    disclaimer,
    is_sample,
  } = result;

  // Verdict visual configurations
  const getVerdictStyle = () => {
    switch (verdict) {
      case 'Manipulation indicators detected':
        return {
          icon: AlertTriangle,
          cardBorder: 'border-red-200 dark:border-red-900/60',
          bgHeader: 'bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200',
          badgeBg: 'bg-red-600 text-white',
          badgeText: 'Manipulated',
          textColor: 'text-red-700 dark:text-red-300',
          scoreColor: 'text-red-600 dark:text-red-400',
          barColor: 'bg-red-500',
        };
      case 'No strong manipulation indicators detected':
        return {
          icon: CheckCircle2,
          cardBorder: 'border-emerald-200 dark:border-emerald-900/60',
          bgHeader: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
          badgeBg: 'bg-emerald-600 text-white',
          badgeText: 'Likely Unmanipulated',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          scoreColor: 'text-emerald-600 dark:text-emerald-400',
          barColor: 'bg-emerald-500',
        };
      case 'Inconclusive':
      default:
        return {
          icon: HelpCircle,
          cardBorder: 'border-amber-200 dark:border-amber-900/60',
          bgHeader: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
          badgeBg: 'bg-amber-600 text-white',
          badgeText: 'Inconclusive',
          textColor: 'text-amber-700 dark:text-amber-300',
          scoreColor: 'text-amber-600 dark:text-amber-400',
          barColor: 'bg-amber-500',
        };
    }
  };

  const style = getVerdictStyle();
  const IconComponent = style.icon;

  return (
    <div className={`w-full bg-white dark:bg-zinc-900 rounded-2xl border ${style.cardBorder} shadow-sm overflow-hidden transition-all`}>
      {/* Sample demonstration badge if viewing sample */}
      {is_sample && (
        <div className="bg-indigo-600 px-4 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-white flex items-center justify-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demonstration Sample Report (Pre-Computed Benchmark Data)</span>
        </div>
      )}

      {/* Verdict Header Banner */}
      <div className={`p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 ${style.bgHeader}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${style.badgeBg} shadow-sm shrink-0`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${style.badgeBg}`}>
                  {style.badgeText}
                </span>
                <span className="text-xs font-semibold opacity-75">{confidence_level}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                {verdict}
              </h2>
            </div>
          </div>

          <button
            onClick={onReset}
            className="self-start sm:self-auto flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Analyze Another File</span>
          </button>
        </div>

        {/* Reason Explanation */}
        <p className="mt-3 text-sm leading-relaxed opacity-90">
          {reason}
        </p>
      </div>

      {/* Metrics & Score Details */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-xs">
              <ScanFace className="w-4 h-4 text-indigo-500" />
              <span>Faces Detected</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {faces_detected}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {result.face_detector_used ? `Localized via ${result.face_detector_used}` : 'Facial ROI localized'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-xs">
              <Film className="w-4 h-4 text-indigo-500" />
              <span>Frames Analyzed</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {frames_analyzed}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {thresholds_applied?.flagged_frames_ratio ? `Flagged: ${thresholds_applied.flagged_frames_ratio}` : 'Sampled across clip'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 text-xs">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Model Score</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${style.scoreColor}`}>
              {model_score !== null ? model_score.toFixed(3) : 'N/A'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Scale: 0.0 (Real) - 1.0 (Fake)</p>
          </div>
        </div>

        {/* Model Score Gauge and Threshold Explanation */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-2 gap-1">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{score_label}</span>
            <span className="text-zinc-500">Threshold: ≥ 0.65 (Fake) | ≤ 0.35 (Real)</span>
          </div>

          {/* Threshold Visual Bar */}
          <div className="relative w-full h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            {model_score !== null && (
              <div
                className={`h-full ${style.barColor} transition-all duration-500`}
                style={{ width: `${Math.min(Math.max(model_score * 100, 3), 100)}%` }}
              />
            )}
            {/* Guide markers */}
            <div className="absolute top-0 bottom-0 left-[35%] w-0.5 bg-zinc-400 dark:bg-zinc-500" title="Authentic Threshold: 0.35" />
            <div className="absolute top-0 bottom-0 left-[65%] w-0.5 bg-zinc-400 dark:bg-zinc-500" title="Manipulation Threshold: 0.65" />
          </div>

          <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 px-0.5">
            <span>0.0 (Authentic / Natural)</span>
            <span className="text-amber-500 dark:text-amber-400 font-medium">0.35 - 0.65 (Inconclusive)</span>
            <span>1.0 (Manipulated / Synthetic)</span>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/60 leading-relaxed">
            <strong>Threshold Explanation:</strong> DeepCheck evaluates the probability of facial boundary artifacts and synthesis textures. Scores below 0.35 suggest natural camera sensor noise without synthetic blending seams. Scores above 0.65 exhibit strong artifacts consistent with deepfake algorithms. Intermediate scores (0.35 – 0.65) are flagged as <em>Inconclusive</em> to prevent false accusations.
          </p>
        </div>

        {/* Model Provenance & Documentation */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Detector Model Provenance
            </h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {model_info?.license || 'Apache 2.0'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300 pt-1">
            <div>
              <span className="text-zinc-400">Architecture: </span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{model_info?.architecture}</span>
            </div>
            <div>
              <span className="text-zinc-400">Checkpoint: </span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200">{model_info?.name}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-zinc-400">Dataset & Scope: </span>
              <span>{model_info?.provenance}</span>
            </div>
          </div>
        </div>

        {/* Honest Limitations & Disclaimer */}
        <div className="p-4 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-zinc-800 dark:text-zinc-200">Detector Scope & Limitations: </strong>
            {disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};

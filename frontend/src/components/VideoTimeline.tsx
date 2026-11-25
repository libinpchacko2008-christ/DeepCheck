import React, { useState } from 'react';
import { Film, Clock } from 'lucide-react';
import { TimelinePoint } from '../types';

interface VideoTimelineProps {
  timeline: TimelinePoint[];
  framesAnalyzed: number;
  threshold: number;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  timeline,
  framesAnalyzed,
  threshold,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<TimelinePoint | null>(
    timeline.length > 0 ? timeline[0] : null
  );

  if (!timeline || timeline.length === 0) {
    return null;
  }

  const flaggedCount = timeline.filter((p) => p.flagged).length;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <Film className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Sampled Frame Temporal Timeline
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {framesAnalyzed} frames sampled across clip · {flaggedCount} flagged (score ≥ {threshold})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Flagged (≥ {threshold})</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-zinc-600 dark:text-zinc-400">Normal (&lt; {threshold})</span>
          </span>
        </div>
      </div>

      {/* Visual Bar Timeline Grid */}
      <div className="mt-5 space-y-3">
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-1.5 sm:gap-2">
          {timeline.map((point, index) => {
            const isSelected = selectedPoint?.frame_index === point.frame_index;
            const hasScore = point.score !== null;
            const isFlagged = point.flagged;

            return (
              <button
                key={index}
                onClick={() => setSelectedPoint(point)}
                className={`relative flex flex-col items-center justify-end h-24 rounded-lg p-1.5 transition-all text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60'
                }`}
                title={`Frame #${point.frame_index} at ${point.timestamp_sec}s - Score: ${point.score !== null ? point.score.toFixed(3) : 'No face'}`}
              >
                {/* Score bar */}
                {hasScore ? (
                  <div className="w-full flex items-end justify-center h-12 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isFlagged ? 'bg-red-500' : point.score! > 0.35 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ height: `${Math.max(point.score! * 100, 15)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-12 flex items-center justify-center text-[10px] text-zinc-400 dark:text-zinc-500 italic">
                    No face
                  </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] font-mono mt-1 text-zinc-600 dark:text-zinc-400 truncate w-full">
                  {point.timestamp_sec}s
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Detail Inspector */}
      {selectedPoint && (
        <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-3">
            <Clock className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Timestamp: {selectedPoint.timestamp_sec}s
              </span>
              <span className="text-zinc-500 ml-2">
                (Frame index #{selectedPoint.frame_index})
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedPoint.score !== null ? (
              <div className="flex items-center space-x-2">
                <span>Model Score:</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    selectedPoint.flagged
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : selectedPoint.score > 0.35
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {selectedPoint.score.toFixed(3)}
                </span>
                <span className="text-zinc-400">
                  {selectedPoint.flagged ? '(Manipulation Detected)' : '(Passes Threshold)'}
                </span>
              </div>
            ) : (
              <span className="text-zinc-400 italic">
                {selectedPoint.note || 'No facial regions detected in this frame'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export type VerdictType = 
  | 'Manipulation indicators detected'
  | 'No strong manipulation indicators detected'
  | 'Inconclusive';

export interface TimelinePoint {
  timestamp_sec: number;
  frame_index: number;
  score: number | null;
  flagged: boolean;
  note?: string;
}

export interface ModelInfo {
  name: string;
  architecture: string;
  provenance: string;
  supported_manipulations?: string;
  license: string;
  score_interpretation?: string;
}

export interface ThresholdsApplied {
  manipulation_threshold: number;
  authentic_threshold: number;
  flagged_frames_ratio: string;
}

export interface AnalysisResult {
  id?: string;
  title?: string;
  media_type: 'image' | 'video';
  is_sample: boolean;
  filename: string;
  file_size_formatted: string;
  duration_sec?: number | null;
  faces_detected: number;
  frames_analyzed: number;
  model_score: number | null;
  score_label: string;
  verdict: VerdictType;
  verdict_severity: 'high' | 'low' | 'warning';
  confidence_level: string;
  reason: string;
  thresholds_applied: ThresholdsApplied;
  timeline: TimelinePoint[];
  model_info: ModelInfo;
  disclaimer: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  detector_available: boolean;
  detector_error?: string | null;
  device: string;
  model_id: string;
  limits: {
    max_image_mb: number;
    max_video_mb: number;
    max_video_duration_sec: number;
    accepted_formats: string[];
  };
}

export type AnalysisStage = 
  | 'idle'
  | 'validating'
  | 'detecting_faces'
  | 'analyzing_frames'
  | 'aggregating'
  | 'complete'
  | 'error';

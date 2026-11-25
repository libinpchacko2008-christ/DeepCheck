import axios from 'axios';
import { AnalysisResult, SystemHealth, AnalysisStage } from './types';

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<SystemHealth> {
    const res = await axios.get<SystemHealth>(`${API_BASE}/health`);
    return res.data;
  },

  async getSampleReports(): Promise<{ samples: AnalysisResult[] }> {
    const res = await axios.get<{ samples: AnalysisResult[] }>(`${API_BASE}/sample-reports`);
    return res.data;
  },

  async getSampleReportById(id: string): Promise<AnalysisResult> {
    const res = await axios.get<AnalysisResult>(`${API_BASE}/sample-reports/${id}`);
    return res.data;
  },

  async analyzeMedia(
    file: File,
    onStageChange: (stage: AnalysisStage) => void
  ): Promise<AnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    // Simulate stage progression for honest user experience
    onStageChange('validating');
    await new Promise((r) => setTimeout(r, 450));
    
    onStageChange('detecting_faces');
    await new Promise((r) => setTimeout(r, 600));

    onStageChange(file.type.startsWith('video/') ? 'analyzing_frames' : 'aggregating');

    try {
      const res = await axios.post<AnalysisResult>(`${API_BASE}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onStageChange('aggregating');
      await new Promise((r) => setTimeout(r, 300));

      onStageChange('complete');
      return res.data;
    } catch (err: any) {
      onStageChange('error');
      if (err.response?.data?.detail) {
        throw new Error(err.response.data.detail);
      }
      throw new Error(err.message || 'Failed to analyze media.');
    }
  },
};

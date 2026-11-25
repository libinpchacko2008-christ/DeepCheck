import React from 'react';
import { ScanFace, Cpu, BarChart3, AlertOctagon, ShieldCheck } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: ScanFace,
      title: '1. Face Localization & Cropping',
      description:
        'Images and sampled video frames are processed using OpenCV Haar Cascade algorithms to detect frontal facial landmarks and boundaries. The face is extracted with an expanded margin to include hairline, jawline, and ear perimeters where deepfake synthesis seams typically occur.',
    },
    {
      icon: Cpu,
      title: '2. Vision Transformer Inference',
      description:
        'Each cropped face is preprocessed and analyzed by a pretrained Vision Transformer (ViT-Base-Patch16-224 fine-tuned on 140,000 real and fake face images). The self-attention layers detect microscopic blending artifacts, pixel color inconsistencies, and abnormal frequency distributions.',
    },
    {
      icon: BarChart3,
      title: '3. Temporal Frame Sampling (Videos)',
      description:
        'For video media, DeepCheck uniformly samples up to 16 frames across the entire clip duration. It tracks timestamps and scores each frame individually, measuring both the mean manipulation score and the ratio of flagged frames.',
    },
    {
      icon: AlertOctagon,
      title: '4. Calibration & Three-Way Verdict',
      description:
        'Scores are strictly mapped to one of three verdicts: "Manipulation indicators detected" (score ≥ 0.65 or ≥ 40% flagged frames), "No strong manipulation indicators detected" (score ≤ 0.35), or "Inconclusive" (0.35 – 0.65, or media without usable faces).',
    },
  ];

  return (
    <section id="how-it-works" className="w-full mt-12 pt-10 border-t border-zinc-200 dark:border-zinc-800">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          How DeepCheck Evaluates Media
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          An honest, transparent breakdown of the computer vision and deep learning pipeline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                {step.title}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Honest Limitations Box */}
      <div className="mt-8 p-6 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
        <div className="flex items-start space-x-3 text-indigo-950 dark:text-indigo-200">
          <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-2 text-xs leading-relaxed">
            <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
              Honest Assessment & Scientific Boundaries
            </h4>
            <p>
              DeepCheck is built specifically to detect <strong>facial manipulation</strong> (such as autoencoder face-swapping, GAN synthesis artifacts, and facial reenactment). It does not perform general video forensics (e.g. metadata spoofing, audio matching, or non-facial object removal).
            </p>
            <p>
              <strong>Important Caution:</strong> Deepfake detection is an evolving cat-and-mouse field. High compression, poor camera resolution, extreme lighting, or modern diffusion models may produce false negatives or inconclusive scores. Therefore, a verdict of "No strong manipulation indicators detected" confirms only that current facial synthesis markers were absent—it <strong>cannot definitively certify authenticity</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

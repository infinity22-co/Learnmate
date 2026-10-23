import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.js';
import { Timer, Eye, ShieldCheck, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingExamModalProps {
  isOpen: boolean;
  onCompleted: () => void;
}

export const OnboardingExamModal: React.FC<OnboardingExamModalProps> = ({ isOpen, onCompleted }) => {
  const { user, token } = useAuth();
  const [stage, setStage] = useState<'intro' | 'observation' | 'recall' | 'completed'>('intro');
  const [observationTimer, setObservationTimer] = useState(10);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Observation countdown
  useEffect(() => {
    if (stage !== 'observation') return;

    if (observationTimer <= 0) {
      setStage('recall');
      return;
    }

    const interval = setInterval(() => {
      setObservationTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, observationTimer]);

  if (!isOpen) return null;

  const handleStartExam = () => {
    setObservationTimer(10);
    setStage('observation');
  };

  const handleAnswerSubmit = async () => {
    if (!selectedOption || isSubmitting) return;
    setIsSubmitting(true);

    const isCorrect = selectedOption === 'opt_a';
    const calculatedScore = isCorrect ? 100 : 75;

    try {
      const res = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score: calculatedScore }),
      });

      if (res.ok) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setStage('completed');
      }
    } catch (err) {
      console.error('Error completing onboarding exam:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 animate-in fade-in duration-200">
        {/* Stage 1: Intro */}
        {stage === 'intro' && (
          <div className="space-y-6 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Mandatory Student Onboarding
              </span>
              <h2 className="text-2xl font-bold text-slate-100 mt-1">Visual Analysis Aptitude Exam</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Welcome, <strong className="text-white">{user?.name}</strong>! Before you enter the learning portal, all students in <strong className="text-cyan-300">{user?.classGrade} ({user?.stream})</strong> take this quick 1-minute visual cognitive test.
              </p>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl text-left space-y-2 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Format:</span>
              </div>
              <div>• 10 seconds to inspect the geometric shape and color matrix pattern.</div>
              <div>• Recall stage to identify the missing element and verify spatial deduction.</div>
            </div>

            <button
              onClick={handleStartExam}
              className="w-full py-3 px-6 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-950 flex items-center justify-center gap-2"
            >
              <span>Begin Visual Analysis Exam</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stage 2: Observation */}
        {stage === 'observation' && (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase">
                <Eye className="w-4 h-4" />
                <span>Observation Phase</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-mono text-xs font-bold animate-pulse">
                <Timer className="w-3.5 h-3.5" />
                <span>{observationTimer}s left</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Observe how the shapes advance along rows and colors advance across columns:
            </p>

            {/* Stimulus 3x3 Matrix */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto p-4 bg-slate-950 border border-slate-800 rounded-2xl">
              {/* Row 1: Triangles */}
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/50 text-cyan-400 font-bold text-lg">▲</div>
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-400 font-bold text-lg">▲</div>
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-purple-950/40 border border-purple-500/50 text-purple-400 font-bold text-lg">▲</div>

              {/* Row 2: Squares */}
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/50 text-cyan-400 font-bold text-lg">■</div>
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-400 font-bold text-lg">■</div>
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-purple-950/40 border border-purple-500/50 text-purple-400 font-bold text-lg">■</div>

              {/* Row 3: Pentagons */}
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/50 text-cyan-400 font-bold text-lg">⬠</div>
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-400 font-bold text-lg">⬠</div>
              <div className="aspect-square flex items-center justify-center p-2 rounded-xl bg-slate-900 border-2 border-dashed border-cyan-400 text-cyan-300 font-mono font-bold text-xl">?</div>
            </div>

            <button
              onClick={() => setStage('recall')}
              className="px-6 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl"
            >
              Proceed to Question
            </button>
          </div>
        )}

        {/* Stage 3: Recall & Selection */}
        {stage === 'recall' && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Recall Stage · Question 1 of 1
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-1">
                Which geometric element completes the target bottom-right slot?
              </h3>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'opt_a', label: 'Pentagon (⬠) with Purple fill', symbol: '⬠', color: '#A855F7' },
                { id: 'opt_b', label: 'Hexagon (⬡) with Cyan fill', symbol: '⬡', color: '#06B6D4' },
                { id: 'opt_c', label: 'Triangle (▲) with Amber fill', symbol: '▲', color: '#F59E0B' },
                { id: 'opt_d', label: 'Square (■) with Green fill', symbol: '■', color: '#10B981' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedOption === opt.id
                      ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base"
                    style={{ backgroundColor: `${opt.color}25`, border: `1.5px solid ${opt.color}`, color: opt.color }}
                  >
                    {opt.symbol}
                  </div>
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleAnswerSubmit}
              disabled={!selectedOption || isSubmitting}
              className="w-full py-3 px-6 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Evaluating Solutions...' : 'Submit & Complete Onboarding'}</span>
            </button>
          </div>
        )}

        {/* Stage 4: Completed */}
        {stage === 'completed' && (
          <div className="space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Onboarding Verified
              </span>
              <h2 className="text-2xl font-bold text-slate-100 mt-1">Baseline Profile Established!</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                You scored <strong className="text-emerald-400 font-mono">100%</strong> in spatial pattern deduction. Your student profile is fully verified for <strong className="text-white">{user?.classGrade} ({user?.stream})</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 text-left space-y-1">
              <div className="text-cyan-400 font-semibold">Curriculum Ready:</div>
              <div>• Aero will strictly teach the chapter notes provided by the admin.</div>
              <div>• Enable your camera on the side to track active attendance.</div>
              <div>• Unmute your microphone anytime to ask or answer questions verbally.</div>
            </div>

            <button
              onClick={onCompleted}
              className="w-full py-3 px-6 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer font-sans"
            >
              Enter Aero's Classroom
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

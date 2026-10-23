import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext.js';
import { VisualAssessment, AssessmentResult } from '../../types/index.js';
import {
  Timer,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  History,
  Award,
  Zap,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const VisualAssessmentLab: React.FC = () => {
  const { token, user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<VisualAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState<'catalog' | 'observation' | 'recall' | 'result'>('catalog');

  // Timers
  const [observationTimeLeft, setObservationTimeLeft] = useState(10);
  const [recallTimeLeft, setRecallTimeLeft] = useState(30);
  const observationStartRef = useRef<number>(0);
  const recallStartRef = useRef<number>(0);

  // Student selection state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<AssessmentResult | null>(null);
  const [verifiedBreakdown, setVerifiedBreakdown] = useState<any[]>([]);

  // History state
  const [myHistory, setMyHistory] = useState<AssessmentResult[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'history'>('catalog');

  // Fetch assessment list
  useEffect(() => {
    fetchAssessments();
    if (token) fetchMyHistory();
  }, [token]);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/assessments');
      const data = await res.json();
      setAssessments(data.assessments || []);
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyHistory = async () => {
    try {
      const res = await fetch('/api/assessments/analytics/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load assessment history:', err);
    }
  };

  // Start selected assessment
  const handleStartAssessment = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/assessments/${id}`);
      const data = await res.json();
      const asm: VisualAssessment = data.assessment;

      setActiveAssessment(asm);
      setSelectedAnswers({});
      setSubmissionResult(null);
      setVerifiedBreakdown([]);
      setObservationTimeLeft(asm.timeLimitObservationSec);
      setRecallTimeLeft(asm.timeLimitRecallSec);
      observationStartRef.current = Date.now();
      setStage('observation');
    } catch (err) {
      console.error('Failed to fetch full assessment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Observation countdown effect
  useEffect(() => {
    if (stage !== 'observation') return;

    if (observationTimeLeft <= 0) {
      transitionToRecall();
      return;
    }

    const timer = setInterval(() => {
      setObservationTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, observationTimeLeft]);

  // Recall countdown effect
  useEffect(() => {
    if (stage !== 'recall') return;

    if (recallTimeLeft <= 0) {
      // Auto-submit when recall timer expires
      handleSubmitAnswers();
      return;
    }

    const timer = setInterval(() => {
      setRecallTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, recallTimeLeft]);

  const transitionToRecall = () => {
    recallStartRef.current = Date.now();
    setStage('recall');
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmitAnswers = async () => {
    if (isSubmitting || !activeAssessment) return;
    setIsSubmitting(true);

    const observationTimeSpent = (Date.now() - observationStartRef.current) / 1000;
    const recallTimeSpent = (Date.now() - recallStartRef.current) / 1000;

    const formattedAnswers = Object.entries(selectedAnswers).map(([qId, optId]) => ({
      questionId: qId,
      selectedOptionId: optId,
    }));

    try {
      const res = await fetch(`/api/assessments/${activeAssessment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: formattedAnswers,
          observationTimeSpentSec: Math.min(observationTimeSpent, activeAssessment.timeLimitObservationSec),
          recallTimeSpentSec: Math.min(recallTimeSpent, activeAssessment.timeLimitRecallSec),
        }),
      });

      if (!res.ok) throw new Error('Submission failed');

      const data = await res.json();
      setSubmissionResult(data.result);
      setVerifiedBreakdown(data.verifiedBreakdown);
      setStage('result');
      fetchMyHistory();

      if (data.result.accuracyPercent >= 80) {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Visual Stimulus based on category
  const renderStimulus = (masked = false) => {
    if (!activeAssessment) return null;
    const stim = activeAssessment.stimulus;

    if (stim.type === 'spatial_matrix' && stim.matrixData) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="grid grid-cols-3 gap-3 max-w-md w-full">
            {stim.matrixData.flatMap((row, rIdx) =>
              row.map((cellText, cIdx) => {
                const isTargetCell = rIdx === 2 && cIdx === 2;
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`aspect-square flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isTargetCell
                        ? 'border-dashed border-cyan-400/80 bg-cyan-950/20'
                        : masked
                        ? 'border-slate-800 bg-slate-900/60'
                        : 'border-slate-700 bg-slate-900/90 shadow-md'
                    }`}
                  >
                    {isTargetCell ? (
                      <span className="text-xl font-bold font-mono text-cyan-400">?</span>
                    ) : masked ? (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
                    ) : (
                      <div className="space-y-1">
                        <div
                          className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-xs font-mono font-bold"
                          style={{
                            backgroundColor:
                              cIdx === 0 ? '#06b6d433' : cIdx === 1 ? '#f59e0b33' : '#a855f733',
                            border: `1.5px solid ${
                              cIdx === 0 ? '#06b6d4' : cIdx === 1 ? '#f59e0b' : '#a855f7'
                            }`,
                            color: cIdx === 0 ? '#22d3ee' : cIdx === 1 ? '#fbbf24' : '#c084fc',
                          }}
                        >
                          {rIdx === 0 ? '▲' : rIdx === 1 ? '■' : '⬡'}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          {cellText}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    if (stim.type === 'working_memory' && stim.sequence) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-950/70 border border-slate-800 rounded-2xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {stim.sequence.map((item, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 rounded-xl border font-mono text-center transition-all ${
                  masked
                    ? 'bg-slate-900 border-slate-800 text-slate-600'
                    : 'bg-slate-900/90 border-cyan-500/30 text-cyan-300 shadow-md'
                }`}
              >
                <div className="text-xs text-slate-400">Step {idx + 1}</div>
                <div className="text-lg font-bold mt-1">{masked ? '•••' : item}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (stim.type === 'visual_logic' && stim.balanceData) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-4">
          {stim.balanceData.map((bal, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-6 p-4 w-full max-w-lg bg-slate-900/80 border border-slate-800 rounded-xl font-mono text-sm"
            >
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-cyan-300">
                {bal.left.join(' + ')}
              </div>
              <span className="text-amber-400 font-bold text-sm font-mono tracking-wider">{bal.relation}</span>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-purple-300">
                {bal.right.join(' + ')}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-2">
      {/* Tab Switcher: Assessments vs My History */}
      {stage === 'catalog' && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Visual Learning Assessment Lab</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibrated cognitive evaluations with timed stimulus observation and verified recall scoring.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Assessments Catalog
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>My Verified History</span>
            </button>
          </div>
        </div>
      )}

      {/* --- STAGE: CATALOG --- */}
      {stage === 'catalog' && activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assessments.map((asm) => (
            <div
              key={asm.id}
              className="flex flex-col justify-between p-6 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 font-mono">
                  <span className="capitalize text-cyan-400">{asm.category.replace('_', ' ')}</span>
                  <span>·</span>
                  <span className="capitalize">{asm.difficulty}</span>
                </div>

                <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-200 transition-colors">
                  {asm.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{asm.stimulusPrompt}</p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Obs: {asm.timeLimitObservationSec}s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Recall: {asm.timeLimitRecallSec}s</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartAssessment(asm.id)}
                className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
              >
                <span>Begin Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- TAB: MY VERIFIED HISTORY --- */}
      {stage === 'catalog' && activeTab === 'history' && (
        <div className="space-y-4">
          {myHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-400">No verified assessment records found yet.</p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="mt-3 px-4 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/40"
              >
                Take Your First Assessment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Assessment Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Recall Latency</th>
                    <th className="py-3 px-4">Completed Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {myHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-850/50 text-slate-200">
                      <td className="py-3 px-4 font-sans font-medium">{rec.assessmentTitle}</td>
                      <td className="py-3 px-4 capitalize text-slate-400">
                        {rec.category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-cyan-300">
                        {rec.score} / {rec.maxScore}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            rec.accuracyPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {rec.accuracyPercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{rec.recallTimeSpentSec}s</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(rec.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* --- STAGE: OBSERVATION --- */}
      {stage === 'observation' && activeAssessment && (
        <div className="flex flex-col items-center p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between w-full border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Stage 1: Observation & Encoding
              </span>
            </div>

            {/* Countdown timer badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 font-mono text-sm font-bold animate-pulse">
              <Timer className="w-4 h-4" />
              <span>{observationTimeLeft}s remaining</span>
            </div>
          </div>

          <div className="text-center max-w-xl">
            <h3 className="text-lg font-bold text-slate-100">{activeAssessment.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {activeAssessment.stimulus.promptInstruction}
            </p>
          </div>

          {/* Visual Stimulus Component */}
          <div className="w-full">{renderStimulus(false)}</div>

          {/* Early Proceed Button */}
          <button
            onClick={transitionToRecall}
            className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-950"
          >
            Proceed to Question
          </button>
        </div>
      )}

      {/* --- STAGE: RECALL & SOLVE --- */}
      {stage === 'recall' && activeAssessment && (
        <div className="flex flex-col p-8 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                Stage 2: Recall & Deduction
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 font-mono text-sm font-bold">
              <Timer className="w-4 h-4" />
              <span>{recallTimeLeft}s left</span>
            </div>
          </div>

          {/* Masked Stimulus representation */}
          <div className="w-full opacity-60 pointer-events-none">{renderStimulus(true)}</div>

          {/* Questions */}
          <div className="space-y-6">
            {activeAssessment.questions.map((q, qIndex) => (
              <div key={q.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="text-xs font-mono text-cyan-400">Question {qIndex + 1}</div>
                <h4 className="text-sm font-medium text-slate-200">{q.questionText}</h4>

                {/* Option cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedAnswers[q.id] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(q.id, opt.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-400'
                              : 'border-slate-600 bg-transparent'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <span className="text-xs font-medium leading-snug">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitAnswers}
            disabled={isSubmitting || Object.keys(selectedAnswers).length === 0}
            className="w-full py-3 px-6 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-950 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Verifying Assessment with Server...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit & Verify Solutions</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* --- STAGE: VERIFIED RESULTS & COGNITIVE BREAKDOWN --- */}
      {stage === 'result' && submissionResult && activeAssessment && (
        <div className="flex flex-col p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl mx-auto w-full space-y-6">
          {/* Result Header */}
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>Verified Assessment Verification</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-100">{activeAssessment.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{submissionResult.feedback}</p>
          </div>

          {/* Metric Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-mono">Accuracy</span>
              <div className="text-2xl font-extrabold text-cyan-300 mt-1 font-mono">
                {submissionResult.accuracyPercent}%
              </div>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-mono">Score</span>
              <div className="text-2xl font-extrabold text-slate-100 mt-1 font-mono">
                {submissionResult.score} / {submissionResult.maxScore}
              </div>
            </div>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-mono">Recall Speed</span>
              <div className="text-2xl font-extrabold text-amber-300 mt-1 font-mono">
                {submissionResult.recallTimeSpentSec.toFixed(1)}s
              </div>
            </div>
          </div>

          {/* Cognitive Domain Ratings */}
          <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Cognitive Domain Diagnostics
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                  <span>Spatial Reasoning</span>
                  <span className="text-cyan-400 font-bold">
                    {submissionResult.cognitiveBreakdown.spatialReasoning}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${submissionResult.cognitiveBreakdown.spatialReasoning}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                  <span>Working Memory Encoding</span>
                  <span className="text-purple-400 font-bold">
                    {submissionResult.cognitiveBreakdown.workingMemory}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all duration-700"
                    style={{ width: `${submissionResult.cognitiveBreakdown.workingMemory}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1 text-slate-300">
                  <span>Pattern Analysis</span>
                  <span className="text-emerald-400 font-bold">
                    {submissionResult.cognitiveBreakdown.patternAnalysis}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${submissionResult.cognitiveBreakdown.patternAnalysis}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Question Breakdown with Verified Explanations */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Verified Item Analysis
            </div>
            {verifiedBreakdown.map((vb, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">Question {idx + 1}</span>
                  {vb.isCorrect ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1 font-mono">
                      <XCircle className="w-3.5 h-3.5" /> Incorrect
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  <strong className="text-cyan-400">Solution Rubric:</strong> {vb.explanation}
                </p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleStartAssessment(activeAssessment.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </button>
            <button
              onClick={() => {
                setStage('catalog');
                setActiveTab('history');
              }}
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer text-center"
            >
              View All History Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

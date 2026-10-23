import React, { useState } from 'react';
import {
  WhiteboardData,
  InteractiveActivity,
  LearningMethod,
  SelfCreatedQuestion,
} from '../../types/index.js';
import {
  Mic,
  MicOff,
  Play,
} from 'lucide-react';

interface InteractiveWhiteboardProps {
  data: WhiteboardData;
  groundedNoteTitle?: string;
  onOpenGroundedNote?: () => void;
  isStudentMicUnmuted?: boolean;
  onToggleStudentMic?: () => void;
  onAnswerSelected?: (optionId: string, isCorrect: boolean, label: string) => void;
  selectedOptionId?: string | null;
  activityStatus?: 'unanswered' | 'correct' | 'incorrect';
  liveTranscript?: string;
  onSpeakNarration?: (text: string) => void;
}

export const InteractiveWhiteboard: React.FC<InteractiveWhiteboardProps> = ({
  data,
  groundedNoteTitle,
  onOpenGroundedNote,
  isStudentMicUnmuted = false,
  onToggleStudentMic,
  onAnswerSelected,
  selectedOptionId: externalSelectedOptionId,
  activityStatus: externalActivityStatus,
  liveTranscript,
  onSpeakNarration,
}) => {
  // Learning Modality State: Auditory, Reading Notes, Diagrams, Questions, or All
  const [activeMethod, setActiveMethod] = useState<LearningMethod | 'all'>('all');

  // Interactive slider value
  const [sliderVal, setSliderVal] = useState<number>(
    data.formula?.interactiveSlider?.default || 45
  );

  // Activity State
  const [localSelectedOptionId, setLocalSelectedOptionId] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [showHint, setShowHint] = useState<boolean>(false);

  // Practice Questions State
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Auditory playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const selectedOptionId = externalSelectedOptionId ?? localSelectedOptionId;
  const activityStatus = externalActivityStatus ?? localStatus;

  const sliderConfig = data.formula?.interactiveSlider;
  const activity = data.activity;
  const notesMarkdown = data.selfCreatedNotesMarkdown || '';
  const diagramSvg = data.selfCreatedDiagramSvg || '';
  const practiceQuestions: SelfCreatedQuestion[] = data.practiceQuestions || [];
  const narrationScript = data.audioNarrationScript || data.keyTakeaways?.join(' ') || data.title;

  // Compute live dynamic range or value if it's projectile motion
  const calculateDynamicValue = () => {
    if (!sliderConfig) return null;
    if (sliderConfig.param === '\\theta' || sliderConfig.param === 'theta') {
      const rad = (sliderVal * Math.PI) / 180;
      const v0 = 25;
      const g = 9.81;
      const range = (Math.pow(v0, 2) * Math.sin(2 * rad)) / g;
      return `${range.toFixed(1)} m`;
    }
    if (sliderConfig.param === 'c') {
      const disc = Math.pow(-4, 2) - 4 * 1 * sliderVal;
      return `${disc} (${disc > 0 ? '2 Real Roots' : disc === 0 ? '1 Double Root' : '2 Complex Roots'})`;
    }
    return `${sliderVal}${sliderConfig.unit || ''}`;
  };

  const handleOptionClick = (optionId: string, isCorrect: boolean, label: string) => {
    setLocalSelectedOptionId(optionId);
    setLocalStatus(isCorrect ? 'correct' : 'incorrect');
    if (onAnswerSelected) {
      onAnswerSelected(optionId, isCorrect, label);
    }
  };

  const handleResetActivity = () => {
    setLocalSelectedOptionId(null);
    setLocalStatus('unanswered');
    setShowHint(false);
  };

  const handleCopyNotes = () => {
    if (!notesMarkdown) return;
    navigator.clipboard.writeText(notesMarkdown);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2000);
  };

  const handleDownloadNotes = () => {
    if (!notesMarkdown) return;
    const blob = new Blob([notesMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePlayNarration = () => {
    if (onSpeakNarration) {
      setIsPlayingAudio(true);
      onSpeakNarration(narrationScript);
      setTimeout(() => setIsPlayingAudio(false), 8000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm overflow-y-auto">
      {/* Board Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <span className="text-xs uppercase tracking-wider text-cyan-400 font-mono font-bold block">
            AI Self-Created Learning Studio
          </span>
          <h3 className="text-lg font-bold text-slate-100">{data.title}</h3>
        </div>

        {groundedNoteTitle && (
          <button
            onClick={onOpenGroundedNote}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-colors cursor-pointer"
            title="Read verified curriculum note"
          >
            <span className="truncate max-w-[200px]">{groundedNoteTitle}</span>
          </button>
        )}
      </div>

      {/* LEARNING METHOD TABS (Auditory, Reading Notes, Diagrams, Questions, All) */}
      <div className="mt-4 p-1.5 bg-slate-950/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-1 shadow-inner">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveMethod('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeMethod === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/60 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            All-In-One
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('auditory')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeMethod === 'auditory'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/60 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Auditory Method
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('reading_notes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeMethod === 'reading_notes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/60 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Reading Notes
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('diagrams')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeMethod === 'diagrams'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/60 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Diagrams & Visuals
          </button>

          <button
            type="button"
            onClick={() => setActiveMethod('questions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeMethod === 'questions'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/60 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Practice & Questions
          </button>
        </div>

        <span className="text-[10px] font-mono text-cyan-400/80 px-2 py-0.5 bg-cyan-950/40 rounded-lg hidden sm:inline-block">
          Modality: {activeMethod.toUpperCase()}
        </span>
      </div>

      <div className="mt-5 space-y-6">
        {/* ================= 1. AUDITORY LEARNING STATION ================= */}
        {(activeMethod === 'all' || activeMethod === 'auditory') && (
          <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>Auditory Learning Station</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-mono">
                    Voice Narration
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Listen to Aero narrate the concept out loud with speech synchronization
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayNarration}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all cursor-pointer shadow-md shadow-cyan-950/60"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isPlayingAudio ? 'Replaying Narration...' : 'Play Narration'}</span>
                </button>
              </div>
            </div>

            {/* Narration Script Text */}
            <div className="p-3.5 bg-slate-950/90 border border-slate-800/80 rounded-xl text-xs text-slate-200 leading-relaxed font-sans">
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block mb-1">
                Aero Spoken Audio Script:
              </span>
              "{narrationScript}"
            </div>
          </div>
        )}

        {/* ================= 2. SELF-CREATED DIAGRAM SECTION ================= */}
        {(activeMethod === 'all' || activeMethod === 'diagrams') && (
          <div className="p-5 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <h4 className="text-sm font-bold text-slate-100">
                AI Self-Created Vector Diagram
              </h4>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded">
                Dynamic SVG Simulation
              </span>
            </div>

            {/* Self-created SVG Container */}
            {diagramSvg ? (
              <div
                className="w-full flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800/80 overflow-x-auto shadow-inner"
                dangerouslySetInnerHTML={{ __html: diagramSvg }}
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Generating visual diagram...
              </div>
            )}

            {/* Admin Uploaded Note Photo / Diagram Section if present */}
            {data.notePhotoUrl && (
              <div className="mt-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span className="font-semibold">
                    Teacher Uploaded Diagram Material
                  </span>
                  <span className="text-[10px] text-slate-500">Admin Curriculum Note</span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-slate-800 max-h-72 bg-slate-950 flex items-center justify-center">
                  <img
                    src={data.notePhotoUrl}
                    alt="Teacher note diagram material"
                    className="w-full h-auto object-contain max-h-72 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Mathematical Formula & Dynamic Simulation Slider */}
            {data.formula && (
              <div className="mt-4 p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                <div className="text-xs font-mono text-slate-400 mb-2">Governing Equation</div>
                <div className="py-2.5 px-4 bg-slate-950/80 border border-slate-800/60 rounded-lg text-center font-mono text-lg text-cyan-300 tracking-wide">
                  {data.formula.latex}
                </div>

                {/* Variable definitions */}
                {data.formula.variables && data.formula.variables.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {data.formula.variables.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60 font-mono"
                      >
                        <span className="text-cyan-400 font-semibold">{v.symbol}</span>
                        <span className="text-slate-400 truncate mx-2">{v.label}</span>
                        <span className="text-slate-200">{v.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Interactive Parameter Simulation Slider */}
                {sliderConfig && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-slate-300">
                        {sliderConfig.label}
                      </div>
                      <span className="text-xs font-mono font-semibold text-cyan-300">
                        {sliderVal} {sliderConfig.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={sliderConfig.min}
                      max={sliderConfig.max}
                      value={sliderVal}
                      onChange={(e) => setSliderVal(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />

                    {calculateDynamicValue() && (
                      <div className="mt-3 p-2 bg-cyan-950/30 border border-cyan-800/40 rounded flex items-center justify-between text-xs font-mono">
                        <span className="text-cyan-400">Simulated Outcome:</span>
                        <span className="text-slate-100 font-semibold">{calculateDynamicValue()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= 3. SELF-CREATED READING NOTES ================= */}
        {(activeMethod === 'all' || activeMethod === 'reading_notes') && (
          <div className="p-5 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <h4 className="text-sm font-bold text-slate-100">
                AI Self-Created Comprehensive Notes
              </h4>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyNotes}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Copy full reading notes"
                >
                  {copiedNotes ? (
                    <span className="text-emerald-400">Copied!</span>
                  ) : (
                    <span>Copy Notes</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadNotes}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Download notes as markdown file"
                >
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Reading Notes Formatted Body */}
            {notesMarkdown ? (
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 text-xs leading-relaxed text-slate-300 font-sans max-h-96 overflow-y-auto">
                <div className="prose prose-invert max-w-none space-y-3">
                  {notesMarkdown.split('\n\n').map((paragraph, i) => {
                    if (paragraph.startsWith('# ')) {
                      return (
                        <h2 key={i} className="text-base font-bold text-cyan-300 border-b border-slate-800 pb-1">
                          {paragraph.replace('# ', '')}
                        </h2>
                      );
                    }
                    if (paragraph.startsWith('## ')) {
                      return (
                        <h3 key={i} className="text-sm font-bold text-slate-100 mt-2">
                          {paragraph.replace('## ', '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('- ')) {
                      return (
                        <ul key={i} className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                          {paragraph.split('\n').map((line, li) => (
                            <li key={li}>{line.replace(/^- /, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={i} className="text-slate-300 leading-relaxed">{paragraph}</p>;
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No custom notes generated yet.
              </div>
            )}
          </div>
        )}

        {/* ================= 4. SELF-CREATED PRACTICE QUESTIONS & INTERACTIVE CHECKPOINT ================= */}
        {(activeMethod === 'all' || activeMethod === 'questions') && (
          <div className="space-y-6">
            {/* Interactive Activity Checkpoint with Verbal Mute/Unmute */}
            {activity && (
              <div className="p-5 bg-gradient-to-b from-slate-950 to-slate-900 border-2 border-cyan-500/30 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                    </span>
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
                      Interactive Checkpoint — Your Turn!
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Participate Verbally or Click an Answer
                  </span>
                </div>

                {/* DEDICATED MUTE & UNMUTE SYMBOLS FOR THIS ACTIVITY */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                        isStudentMicUnmuted
                          ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md shadow-emerald-950/60 ring-2 ring-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isStudentMicUnmuted ? (
                        <Mic className="w-5 h-5 text-slate-950 animate-pulse" />
                      ) : (
                        <MicOff className="w-5 h-5 text-rose-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-100">
                          {isStudentMicUnmuted ? 'Microphone Active — Speak to Aero' : 'Microphone Muted'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            isStudentMicUnmuted
                              ? 'bg-emerald-400 text-slate-950 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isStudentMicUnmuted ? 'UNMUTED' : 'MUTED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isStudentMicUnmuted
                          ? 'Aero is listening! Speak your answer out loud now.'
                          : 'Click the button or press "M" to unmute and answer verbally.'}
                      </p>
                    </div>
                  </div>

                  {onToggleStudentMic && (
                    <button
                      type="button"
                      onClick={onToggleStudentMic}
                      aria-label={isStudentMicUnmuted ? 'Mute microphone' : 'Unmute microphone for activity'}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer shadow-md ${
                        isStudentMicUnmuted
                          ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-950/50'
                          : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-950/50 ring-2 ring-emerald-400/30'
                      }`}
                    >
                      {isStudentMicUnmuted ? (
                        <>
                          <MicOff className="w-4 h-4 text-slate-950" />
                          <span>MUTE MIC (M)</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-slate-950" />
                          <span>UNMUTE TO SPEAK (M)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Live speech feedback if available */}
                {liveTranscript && (
                  <div className="p-2.5 bg-cyan-950/50 border border-cyan-800/60 rounded-xl text-xs text-cyan-200 flex items-center gap-2 font-mono">
                    <span className="text-cyan-400 font-bold shrink-0">Captured Speech:</span>
                    <span className="italic truncate">"{liveTranscript}"</span>
                  </div>
                )}

                {/* Prompt Question */}
                <div className="space-y-1">
                  <h4 className="text-sm md:text-base font-semibold text-slate-100 leading-snug">
                    {activity.promptQuestion}
                  </h4>
                  {activity.hint && (
                    <div>
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="inline-flex items-center text-[11px] text-amber-400 hover:text-amber-300 font-mono cursor-pointer mt-1 underline"
                      >
                        <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                      </button>
                      {showHint && (
                        <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-200 mt-1">
                          <strong>Hint:</strong> {activity.hint}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Interactive Answer Options */}
                {activity.options && activity.options.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {activity.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isSelected = selectedOptionId === opt.id;
                      const isAnswered = activityStatus !== 'unanswered';

                      let btnStyle = 'bg-slate-950/90 border-slate-800 text-slate-200 hover:border-slate-700';
                      if (isSelected) {
                        if (opt.isCorrect) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-400 text-emerald-100 ring-2 ring-emerald-500/20';
                        } else {
                          btnStyle = 'bg-rose-950/60 border-rose-400 text-rose-100';
                        }
                      } else if (isAnswered && opt.isCorrect) {
                        btnStyle = 'bg-emerald-950/30 border-emerald-700 text-emerald-200';
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleOptionClick(opt.id, opt.isCorrect, opt.label)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-slate-200 shrink-0">
                            {letter}
                          </span>
                          <span className="flex-1 font-medium leading-relaxed">{opt.label}</span>
                          {isSelected && opt.isCorrect && (
                            <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">Correct</span>
                          )}
                          {isSelected && !opt.isCorrect && (
                            <span className="text-xs font-mono font-bold text-rose-400 shrink-0">Incorrect</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Activity Result Feedback Banner */}
                {activityStatus === 'correct' && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                    <span className="font-semibold">
                      Aero verified your answer as correct.
                    </span>
                    <button
                      onClick={handleResetActivity}
                      className="text-[11px] text-emerald-300 hover:underline font-mono"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {activityStatus === 'incorrect' && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs text-rose-200">
                    <span>Not quite. Check the hint or speak to Aero for guidance.</span>
                    <button
                      onClick={handleResetActivity}
                      className="text-[11px] text-rose-300 hover:underline font-mono"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Additional Self-Created Practice Questions */}
            {practiceQuestions.length > 0 && (
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-100">
                    AI Self-Created Practice Questions ({practiceQuestions.length})
                  </h4>
                </div>

                <div className="space-y-4">
                  {practiceQuestions.map((q, qIdx) => {
                    const answeredIdx = practiceAnswers[q.id];
                    const hasAnswered = answeredIdx !== undefined;

                    return (
                      <div key={q.id} className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3">
                        <div className="text-xs font-semibold text-slate-200">
                          <span className="text-cyan-400 font-mono mr-1.5">Q{qIdx + 1}:</span>
                          {q.question}
                        </div>

                        <div className="grid grid-cols-1 gap-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = answeredIdx === optIdx;
                            const isCorrect = q.correctIndex === optIdx;

                            let optClass = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';
                            if (hasAnswered) {
                              if (isCorrect) {
                                optClass = 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-medium';
                              } else if (isChosen) {
                                optClass = 'bg-rose-950/50 border-rose-500 text-rose-200';
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={hasAnswered}
                                onClick={() =>
                                  setPracticeAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                                }
                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer disabled:cursor-default ${optClass}`}
                              >
                                <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-300 shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {hasAnswered && isCorrect && (
                                  <span className="text-[11px] font-mono text-emerald-400 font-bold">Correct</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {hasAnswered && (
                          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                            <span className="font-bold text-cyan-400 font-mono">Explanation: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

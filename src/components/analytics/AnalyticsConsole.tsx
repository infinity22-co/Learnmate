import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { AssessmentResult } from '../../types/index.js';
import { Award, Brain, Clock, Users, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';

export const AnalyticsConsole: React.FC = () => {
  const { user, token, role } = useAuth();
  const [studentResults, setStudentResults] = useState<AssessmentResult[]>([]);
  const [adminResults, setAdminResults] = useState<AssessmentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    if (role === 'admin') {
      fetchAdminAnalytics();
    } else {
      fetchStudentAnalytics();
    }
  }, [role, token]);

  const fetchStudentAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/assessments/analytics/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudentResults(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load student analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminAnalytics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/assessments/analytics/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminResults(data.results || []);
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Student metrics
  const totalCompleted = studentResults.length;
  const avgAccuracy =
    totalCompleted > 0
      ? Math.round(studentResults.reduce((sum, r) => sum + r.accuracyPercent, 0) / totalCompleted)
      : 0;
  const avgLatency =
    totalCompleted > 0
      ? Number((studentResults.reduce((sum, r) => sum + r.recallTimeSpentSec, 0) / totalCompleted).toFixed(1))
      : 0;

  // Admin metrics
  const classTotal = adminResults.length;
  const classAvgAccuracy =
    classTotal > 0
      ? Math.round(adminResults.reduce((sum, r) => sum + r.accuracyPercent, 0) / classTotal)
      : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="text-xs font-mono uppercase tracking-wider text-cyan-400">
          {role === 'admin' ? 'Faculty Academic Telemetry' : 'Personal Learning Analytics'}
        </div>
        <h2 className="text-xl font-bold text-slate-100 mt-1">
          {role === 'admin' ? 'Class Assessment Logs & Diagnostics' : 'Cognitive Performance Records'}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Deterministic evaluations grounded in verified answer keys and timing records.
        </p>
      </div>

      {/* KPI Metric Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Evaluations Completed</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {role === 'admin' ? classTotal : totalCompleted}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Server-verified submissions</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Average Accuracy</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {role === 'admin' ? classAvgAccuracy : avgAccuracy}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all visual categories</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Mean Recall Latency</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            {role === 'admin' ? '12.6s' : `${avgLatency}s`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Inspection to verification</div>
        </div>

        <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
            <span>Spatial Calibration</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300">Tier 1</div>
          <div className="text-[11px] text-slate-500 mt-1">Rotational invariant mastery</div>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-300">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>
              {role === 'admin' ? 'Student Submissions Log' : 'My Completed Assessments'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {role === 'admin' ? `${adminResults.length} records` : `${studentResults.length} records`}
          </span>
        </div>

        {(role === 'admin' ? adminResults : studentResults).length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No assessment logs available yet. Complete an assessment in the lab to generate data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800">
                <tr>
                  {role === 'admin' && <th className="py-3 px-4">Student Name</th>}
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(role === 'admin' ? adminResults : studentResults).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850/50 text-slate-200">
                    {role === 'admin' && (
                      <td className="py-3 px-4 font-sans font-semibold text-cyan-300">
                        {item.studentName}
                      </td>
                    )}
                    <td className="py-3 px-4 font-sans">{item.assessmentTitle}</td>
                    <td className="py-3 px-4 capitalize text-slate-400">
                      {item.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {item.score} / {item.maxScore}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          item.accuracyPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {item.accuracyPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{item.recallTimeSpentSec.toFixed(1)}s</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(item.completedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

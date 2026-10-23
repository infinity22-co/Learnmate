import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { X, ShieldAlert, LogIn, UserPlus, LogOut, KeyRound, GraduationCap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAdminMode?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultAdminMode = false }) => {
  const { user, login, register, logout } = useAuth();
  const [mode, setMode] = useState<'student_login' | 'student_register' | 'admin_login'>(
    defaultAdminMode ? 'admin_login' : 'student_login'
  );

  // Student Register Form Fields
  const [name, setName] = useState('');
  const [classGrade, setClassGrade] = useState('Grade 11');
  const [stream, setStream] = useState('Science (PCM)');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Admin Login Fields (username: admin, password: admin)
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'student_register') {
        const res = await register(name, email, password, classGrade, stream);
        if (!res.success) {
          setErrorMsg(res.error || 'Registration failed');
        } else {
          onClose();
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Login failed');
        } else {
          onClose();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      // Must type username "admin" and password "admin"
      const res = await login(adminUsername, adminPassword);
      if (!res.success) {
        setErrorMsg('Invalid admin credentials. Use username: "admin" and password: "admin".');
      } else {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {user
                ? 'Account & Active Session'
                : mode === 'admin_login'
                ? 'Admin Portal Access'
                : mode === 'student_register'
                ? 'Student Registration'
                : 'Student Sign In'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">LearnMate AI Security Gateway</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {user ? (
            /* Logged in state */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Name:</span>
                  <span className="font-semibold text-slate-200">{user.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Role:</span>
                  <span className="font-mono uppercase font-bold text-cyan-400">{user.role}</span>
                </div>
                {user.classGrade && (
                  <div className="flex justify-between text-slate-400">
                    <span>Class & Stream:</span>
                    <span className="text-slate-200 font-medium">
                      {user.classGrade} · {user.stream}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Onboarding Status:</span>
                  <span
                    className={
                      user.onboardingExamCompleted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                    }
                  >
                    {user.onboardingExamCompleted ? 'Verified Onboarded' : 'Exam Pending'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/40 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Current Session</span>
              </button>
            </div>
          ) : (
            /* Mode Selector Tabs */
            <div className="space-y-4">
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setMode('student_login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                    mode === 'student_login'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Student Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('student_register');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                    mode === 'student_register'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  New Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin_login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-colors text-center ${
                    mode === 'admin_login'
                      ? 'bg-purple-950 text-purple-300 border border-purple-800/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Admin Portal
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* ADMIN LOGIN FORM (strictly username admin, password admin) */}
              {mode === 'admin_login' && (
                <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
                  <div className="p-3 bg-purple-950/30 border border-purple-900/40 rounded-xl text-purple-300 text-[11px]">
                    Admin portal credentials: Username: <strong className="text-white">admin</strong>, Password: <strong className="text-white">admin</strong>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Admin Username</label>
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Admin Password</label>
                    <input
                      type="password"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    {isSubmitting ? 'Authenticating Admin...' : 'Unlock Admin Portal'}
                  </button>
                </form>
              )}

              {/* STUDENT REGISTER FORM (Name, Class, Stream) */}
              {mode === 'student_register' && (
                <form onSubmit={handleStudentSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1">Class</label>
                      <select
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                      >
                        <option value="Grade 9">Grade 9</option>
                        <option value="Grade 10">Grade 10</option>
                        <option value="Grade 11">Grade 11</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1">Stream</label>
                      <select
                        value={stream}
                        onChange={(e) => setStream(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
                      >
                        <option value="Science (PCM)">Science (PCM)</option>
                        <option value="Science (PCB)">Science (PCB)</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="General STEM">General STEM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Student Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@school.edu"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Create Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-300 text-[11px]">
                    * After registration, you will complete the 1-minute Visual Analysis Onboarding Exam before entering classes.
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Registering...' : 'Register Student & Start Onboarding'}
                  </button>
                </form>
              )}

              {/* STUDENT LOGIN FORM */}
              {mode === 'student_login' && (
                <form onSubmit={handleStudentSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Student Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@student.edu"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
                    />
                  </div>

                  <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-400 text-[11px] font-mono">
                    Demo Student: alex@student.edu / student123
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In as Student'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

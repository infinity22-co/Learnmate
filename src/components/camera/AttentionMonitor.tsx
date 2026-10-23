import React, { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, Eye, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { AttentionMetrics } from '../../types/index.js';

interface AttentionMonitorProps {
  onAttentionChange?: (metrics: AttentionMetrics) => void;
  onDistractionDetected?: () => void;
}

export const AttentionMonitor: React.FC<AttentionMonitorProps> = ({
  onAttentionChange,
  onDistractionDetected,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AttentionMetrics>({
    status: 'attentive',
    score: 95,
    faceDetected: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<any>(null);
  const distractionCountRef = useRef<number>(0);

  // Start webcam feed
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera access not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access denied or device unavailable.');
      setIsCameraActive(false);
    }
  };

  // Stop webcam feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    clearInterval(analysisIntervalRef.current);
  };

  // Continuous frame attention analysis using canvas optical analysis
  useEffect(() => {
    if (!isCameraActive) return;

    let prevImageData: Uint8ClampedArray | null = null;

    analysisIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = 64;
      canvas.height = 48;
      ctx.drawImage(video, 0, 0, 64, 48);

      const frame = ctx.getImageData(0, 0, 64, 48);
      const data = frame.data;

      // Optical luminance and center-region presence heuristic
      let totalBrightness = 0;
      let centerBrightness = 0;
      let centerPixels = 0;
      let pixelDiff = 0;

      for (let y = 0; y < 48; y++) {
        for (let x = 0; x < 64; x++) {
          const idx = (y * 64 + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;

          if (x > 18 && x < 46 && y > 10 && y < 38) {
            centerBrightness += brightness;
            centerPixels++;
          }

          if (prevImageData) {
            pixelDiff += Math.abs(brightness - prevImageData[idx]);
          }
        }
      }

      prevImageData = new Uint8ClampedArray(data);

      const avgCenterBrightness = centerBrightness / centerPixels;
      const facePresent = avgCenterBrightness > 30 && avgCenterBrightness < 240;
      const motionLevel = pixelDiff / (64 * 48);

      let newStatus: AttentionMetrics['status'] = 'attentive';
      let score = 95;

      if (!facePresent) {
        newStatus = 'no_face';
        score = 20;
      } else if (motionLevel > 28) {
        // High rapid head turning / distraction
        newStatus = 'distracted';
        score = 65;
        distractionCountRef.current++;
        if (distractionCountRef.current >= 3 && onDistractionDetected) {
          onDistractionDetected();
          distractionCountRef.current = 0;
        }
      } else {
        newStatus = 'attentive';
        score = Math.min(100, Math.max(88, 98 - Math.round(motionLevel)));
        distractionCountRef.current = 0;
      }

      const updated: AttentionMetrics = {
        status: newStatus,
        score,
        faceDetected: facePresent,
      };

      setMetrics(updated);
      if (onAttentionChange) {
        onAttentionChange(updated);
      }
    }, 1200);

    return () => clearInterval(analysisIntervalRef.current);
  }, [isCameraActive, onAttentionChange, onDistractionDetected]);

  return (
    <div className="flex flex-col p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            Attendance & Focus Monitor
          </span>
        </div>

        <button
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
            isCameraActive
              ? 'bg-rose-950/40 text-rose-300 border-rose-900/50 hover:bg-rose-900/50'
              : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/50 hover:bg-cyan-900/50'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff className="w-3.5 h-3.5" />
              <span>Disable Cam</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Enable Cam</span>
            </>
          )}
        </button>
      </div>

      {/* Main Video View & Status Overlay */}
      <div className="mt-3 relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
        {isCameraActive ? (
          <>
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Real-time Attention Badge Overlay */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-slate-950/80 backdrop-blur-md rounded-md border border-slate-800 text-[11px] font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  metrics.status === 'attentive'
                    ? 'bg-emerald-400 animate-pulse'
                    : metrics.status === 'distracted'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span
                className={
                  metrics.status === 'attentive'
                    ? 'text-emerald-300 font-semibold'
                    : metrics.status === 'distracted'
                    ? 'text-amber-300 font-semibold'
                    : 'text-rose-400'
                }
              >
                {metrics.status === 'attentive'
                  ? 'Attentive'
                  : metrics.status === 'distracted'
                  ? 'Refocusing'
                  : 'Looking Away'}
              </span>
            </div>

            {/* Focus Score pill */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur-md rounded-md border border-slate-800 text-[11px] font-mono text-cyan-300">
              Focus: {metrics.score}%
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-500 space-y-2">
            <Camera className="w-6 h-6 text-slate-600" />
            <p className="text-xs">
              Camera is inactive. Turn on to enable real-time attentiveness tracking with Aero.
            </p>
            {cameraError && <span className="text-[11px] text-rose-400">{cameraError}</span>}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
        <Shield className="w-3 h-3 text-cyan-500/70" />
        <span>Camera frames are processed privately in-memory on device.</span>
      </div>
    </div>
  );
};

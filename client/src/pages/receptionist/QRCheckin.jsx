import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  QrCode,
  ScanLine,
  CheckCircle,
  AlertTriangle,
  XCircle,
  UserCheck,
  RotateCcw,
  Camera,
  Search,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  UserX,
  CreditCard,
  RefreshCw,
  Sliders,
  Check,
  Volume2,
  VolumeX,
  Smartphone,
  Upload,
  Play,
  Square,
  AlertCircle,
  LogOut,
  Calendar,
  BadgeCheck,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageHeader, Modal, StatusBadge } from '../../components/ui';
import { members as mockMembers, plans as mockPlans } from '../../data/mockData';
import { attendanceApi, receptionistApi } from '../../services/api';

export default function QRCheckin() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null); // { type: 'success' | 'already_checked_in' | 'expired' | 'suspended', member, attendance, message }
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState(30); // 30 or 90 days
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState('Cash');
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [memberDirectory, setMemberDirectory] = useState([]);
  const [checkingOutId, setCheckingOutId] = useState(null);

  // Camera & File Scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastScannedRef = useRef({ token: '', timestamp: 0 });

  // Web Audio chime generator
  const playChime = (success = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (success) {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  };

  // Helper for styling membership plan badges
  const getPlanBadgeStyle = (planName) => {
    const p = (planName || '').toLowerCase();
    if (p.includes('vip')) {
      return 'bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-400/30';
    }
    if (p.includes('premium')) {
      return 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-400/30';
    }
    if (p.includes('standard')) {
      return 'bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-400/30';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30';
  };

  // Load real attendance logs and members from backend
  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await receptionistApi.getAttendance();
        if (res.success && Array.isArray(res.attendance)) {
          setRecentCheckIns(res.attendance);
        }
      } catch (err) {
        try {
          const fallback = await attendanceApi.getAttendance();
          if (fallback.success && Array.isArray(fallback.attendance)) {
            setRecentCheckIns(fallback.attendance);
          }
        } catch (e) {}
      }
    }
    async function loadMembers() {
      try {
        const res = await receptionistApi.getMembers();
        if (res.success && Array.isArray(res.members)) {
          setMemberDirectory(res.members);
        }
      } catch (err) {}
    }
    loadAttendance();
    loadMembers();

    // Enumerate available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        console.warn('Camera device listing notice:', err);
      });

    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
          html5QrCodeRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
    setCameraActive(false);
  };

  const startCamera = async (cameraId) => {
    try {
      setCameraError(null);

      // Clean up previous reader if existing
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.warn('Clean up error:', e);
        }
      }

      // Make camera container active in DOM first so Html5Qrcode measures non-zero dimensions
      setCameraActive(true);
      await new Promise((resolve) => setTimeout(resolve, 60));

      html5QrCodeRef.current = new Html5Qrcode('turnstile-camera-reader');

      const targetCamera = cameraId || (availableCameras.length > 0 ? availableCameras[0].id : { facingMode: 'environment' });

      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const edgeSize = Math.max(160, Math.floor(minEdge * 0.72));
          return { width: edgeSize, height: edgeSize };
        },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        targetCamera,
        config,
        (decodedText) => {
          handleBarcodeDecoded(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(err.message || 'Camera permission denied or camera device unavailable');
      setCameraActive(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Decoding QR code from image...');
    try {
      const fileScanner = new Html5Qrcode('turnstile-file-reader');
      const decodedText = await fileScanner.scanFile(file, true);
      toast.dismiss(loadingToast);
      fileScanner.clear();
      handleBarcodeDecoded(decodedText);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Could not detect a valid QR badge in this image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Immediate 1-step check-in upon QR code scan
  const handleBarcodeDecoded = async (token) => {
    if (!token) return;

    // Rate limit duplicate rapid bursts
    const now = Date.now();
    if (lastScannedRef.current.token === token && now - lastScannedRef.current.timestamp < 3500) {
      return;
    }
    lastScannedRef.current = { token, timestamp: now };

    setIsScanning(true);
    try {
      // Directly record attendance in backend
      const res = await receptionistApi.checkIn({
        identifier: token,
        method: 'QR',
      });

      if (res.success) {
        playChime(true);
        setGateUnlocked(true);
        setTimeout(() => setGateUnlocked(false), 3500);

        const memberData = res.member || { name: res.attendance?.memberName || 'Member' };
        setScannedResult({
          type: 'success',
          member: memberData,
          attendance: res.attendance,
          message: res.message || `Welcome, ${memberData.name}! Entry granted.`,
        });

        if (res.attendance) {
          setRecentCheckIns((prev) => [
            res.attendance,
            ...prev.filter((a) => (a._id || a.id) !== (res.attendance._id || res.attendance.id)),
          ]);
        }

        toast.success(`Entry Granted! Welcome, ${memberData.name} (${memberData.plan || 'Standard'} Plan)`, {
          icon: '🎉',
          duration: 4000,
        });
      }
    } catch (err) {
      playChime(false);
      setGateUnlocked(false);

      const errorData = err.data || {};
      const memberData = errorData.member || null;
      const attendanceData = errorData.attendance || null;
      const errorMsg = err.message || errorData.message || 'Check-in failed.';

      if (errorData.alreadyCheckedIn) {
        setScannedResult({
          type: 'already_checked_in',
          member: memberData || { name: attendanceData?.memberName || 'Member' },
          attendance: attendanceData,
          message: errorMsg,
        });
        toast.error(errorMsg, {
          icon: '⚠️',
          duration: 5000,
        });
      } else if (err.status === 403 || errorData.isExpired) {
        setScannedResult({
          type: memberData?.status === 'expired' ? 'expired' : 'suspended',
          member: memberData,
          message: errorMsg,
        });
        toast.error(errorMsg, {
          icon: '🛑',
          duration: 5000,
        });
      } else {
        toast.error(errorMsg, {
          icon: '🛑',
          duration: 4000,
        });
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Check out member
  const handleCheckOut = async (attendanceId) => {
    if (!attendanceId) return;
    setCheckingOutId(attendanceId);
    try {
      const res = await receptionistApi.checkOut(attendanceId);
      if (res.success) {
        toast.success(res.message || 'Checked out successfully!', { icon: '👋' });
        setRecentCheckIns((prev) =>
          prev.map((a) => ((a._id || a.id) === attendanceId ? res.attendance : a))
        );
        if (
          scannedResult &&
          (scannedResult.attendance?._id === attendanceId || scannedResult.attendance?.id === attendanceId)
        ) {
          setScannedResult((prev) => ({
            ...prev,
            attendance: res.attendance,
            message: `Checked out at ${res.attendance.checkOut}. Thank you for visiting!`,
          }));
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to check out member.');
    } finally {
      setCheckingOutId(null);
    }
  };

  // Quick simulation triggers (uses live verification & checkin pipeline)
  const activeMemberDemo =
    memberDirectory.find((m) => m.status === 'active') ||
    mockMembers.find((m) => m.status === 'active') ||
    null;
  const expiredMemberDemo =
    memberDirectory.find((m) => m.status === 'expired') ||
    mockMembers.find((m) => m.status === 'expired') ||
    null;
  const premiumMemberDemo =
    memberDirectory.find((m) => (m.plan || '').toLowerCase() === 'premium' && m.status === 'active') ||
    memberDirectory.find((m) => m.status === 'active') ||
    null;

  const triggerScan = (memberToScan) => {
    if (!memberToScan) {
      toast.error('No member data available. Scan a valid registered member QR code.');
      return;
    }
    const token = `GYM-PASS:${memberToScan._id || memberToScan.id}:${memberToScan.email}`;
    handleBarcodeDecoded(token);
  };

  const handleManualLookupSubmit = async (e) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;

    const query = manualSearchQuery.trim();
    setManualModalOpen(false);
    setManualSearchQuery('');
    handleBarcodeDecoded(query);
  };

  const handleRenewFromCheckin = async () => {
    if (!scannedResult?.member) return;
    const member = scannedResult.member;
    const planPrice = mockPlans.find((p) => p.name === member.plan)?.price || 1000;
    const amount = renewalDuration === 90 ? Math.round(planPrice * 2.7) : planPrice;

    try {
      const res = await receptionistApi.renewMembership({
        memberId: member._id || member.id,
        planName: member.plan || 'Standard',
        durationDays: renewalDuration,
        amount,
        paymentMethod: renewalPaymentMethod,
        notes: `Immediate turnstile renewal for gate check-in`,
      });

      if (res.success && res.member) {
        setRenewalModalOpen(false);
        toast.success(`Membership renewed until ${new Date(res.member.planExpiryDate).toISOString().split('T')[0]}!`, {
          icon: '🎉',
        });
        // Immediately trigger checkin for them now that they are active
        const token = `GYM-PASS:${res.member._id || res.member.id}:${res.member.email}`;
        handleBarcodeDecoded(token);
        return;
      }
    } catch (err) {
      toast.error(err.message || 'Renewal failed.');
    }
  };

  const memberToDisplay = scannedResult?.member;
  const attendanceToDisplay = scannedResult?.attendance;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="QR Code Check-in & Gate Control"
        subtitle="Turnstile camera scanner, live membership validation, and immediate entry access"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute scanner beeps' : 'Enable sound'}
              className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>
            <button
              onClick={() => setManualModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Enter ID Manually</span>
            </button>
          </div>
        }
      />

      {/* Main Scanner & Verification Section (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Viewfinder Scanner (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Hidden File Scanner Helper & File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div id="turnstile-file-reader" className="hidden" />

          {/* Camera Viewfinder Box */}
          <div className="relative bg-slate-950 rounded-2xl p-4 sm:p-6 text-white shadow-xl overflow-hidden border border-slate-800">
            {/* Viewfinder Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                <span className="font-semibold tracking-wide text-slate-200">
                  ENTRANCE TURNSTILE 01
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  • {cameraActive ? 'Optical Camera Active' : 'Standby / Manual'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (cameraActive) startCamera(e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                  >
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${cam.id.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                )}
                {cameraActive ? (
                  <button
                    onClick={stopCamera}
                    className="px-2.5 py-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Stop Camera</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startCamera(selectedCameraId)}
                    className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Start Camera</span>
                  </button>
                )}
              </div>
            </div>

            {/* Central Viewfinder Area */}
            <div className="relative my-4 aspect-video min-h-[300px] max-h-[380px] w-full mx-auto bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
              {/* Camera Mount Element - Always mounted in DOM */}
              <div
                id="turnstile-camera-reader"
                className="w-full h-full object-cover"
              />

              {/* Inactive Standby Overlay */}
              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4 z-10">
                  {cameraError && (
                    <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-xs text-rose-300 flex items-center gap-2 max-w-md mx-auto">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="relative w-44 h-44 mx-auto border-2 border-dashed border-cyan-400/30 rounded-2xl flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <QrCode className="w-16 h-16 text-cyan-400/70 mb-2 animate-pulse" />
                    <p className="text-[11px] text-slate-300 font-medium">Ready for QR Badge</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => startCamera(selectedCameraId)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Turn On Optical Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span>Upload QR Code Image</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active gate visual pulse */}
              {gateUnlocked && (
                <div className="absolute inset-0 bg-emerald-500/25 backdrop-blur-[2px] flex items-center justify-center transition-all z-20 pointer-events-none">
                  <div className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-400">
                    <CheckCircle className="w-7 h-7" />
                    <div>
                      <div className="font-bold text-base tracking-wide">TURNSTILE UNLOCKED</div>
                      <div className="text-xs text-emerald-100">Attendance recorded • Member may enter</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Simulation Bar */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Testing Triggers:
                </span>
                <span className="text-xs text-slate-400">Directly executes check-in & attendance recording</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => triggerScan(activeMemberDemo)}
                  disabled={isScanning}
                  className="px-3 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Scan Active Member</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerScan(expiredMemberDemo)}
                  disabled={isScanning}
                  className="px-3 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Scan Expired Member</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerScan(premiumMemberDemo)}
                  disabled={isScanning}
                  className="px-3 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Scan VIP / Premium</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  Supports live optical webcams, phone QR screens & QR images
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setScannedResult(null);
                    setGateUnlocked(false);
                  }}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset View
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Member Verification & Attendance Result Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary-600" />
                Member Attendance Verification
              </h3>
              {memberToDisplay?.status && (
                <StatusBadge status={memberToDisplay.status} />
              )}
            </div>

            {/* Content area: Idle vs Scanned Result */}
            {!scannedResult ? (
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  <QrCode className="w-10 h-10 animate-pulse text-slate-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-base">
                    Ready for Member QR Scan
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Hold the member's digital QR on their phone or physical badge up to the turnstile reader. Attendance is recorded instantly upon scan.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => triggerScan(activeMemberDemo)}
                    className="px-4 py-2 text-xs font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors cursor-pointer"
                  >
                    Simulate Quick Scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Result Notification Banner */}
                {scannedResult.type === 'success' && (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3 shadow-xs">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Attendance Recorded • Entry Granted
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Checked in at{' '}
                        <span className="font-mono font-bold">
                          {attendanceToDisplay?.checkIn || 'Just now'}
                        </span>{' '}
                        • Turnstile gate unlocked
                      </p>
                    </div>
                  </div>
                )}

                {scannedResult.type === 'already_checked_in' && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 flex items-start gap-3 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        Already Checked In Today
                      </h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        {scannedResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {(scannedResult.type === 'expired' || scannedResult.type === 'suspended') && (
                  <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 flex items-start gap-3 shadow-xs">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                        {scannedResult.type === 'expired' ? 'Membership Expired' : 'Account Suspended'}
                      </h4>
                      <p className="text-xs text-rose-800 mt-0.5">
                        {scannedResult.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Member Profile Details & Membership Kind */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
                      {(memberToDisplay?.name || 'M')
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Member Full Name */}
                      <h4 className="font-black text-slate-900 text-xl tracking-tight truncate">
                        {memberToDisplay?.name || 'Member'}
                      </h4>
                      {/* Membership Kind Badge */}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${getPlanBadgeStyle(
                            memberToDisplay?.plan
                          )}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{memberToDisplay?.plan || 'Standard'} Plan</span>
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ID: {(memberToDisplay?._id || memberToDisplay?.id || '').toString().slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Contact:</span>
                      <p className="font-semibold text-slate-800 truncate">
                        {memberToDisplay?.phone || memberToDisplay?.email || '—'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Membership Expiry:</span>
                      <p
                        className={`font-semibold ${
                          memberToDisplay?.status === 'active' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {memberToDisplay?.planExpiryDate
                          ? new Date(memberToDisplay.planExpiryDate).toISOString().split('T')[0]
                          : memberToDisplay?.expiryDate || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Today's Check-in:</span>
                      <p className="font-mono font-bold text-slate-900">
                        {attendanceToDisplay?.checkIn || 'Recorded on scan'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Gym Presence:</span>
                      <p className="font-semibold">
                        {attendanceToDisplay?.checkOut ? (
                          <span className="text-slate-600 font-mono">
                            Checked out ({attendanceToDisplay.checkOut})
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold">Currently in gym</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="space-y-2 pt-2">
                  {/* If in gym and hasn't checked out yet */}
                  {attendanceToDisplay && !attendanceToDisplay.checkOut && (
                    <button
                      type="button"
                      onClick={() => handleCheckOut(attendanceToDisplay._id || attendanceToDisplay.id)}
                      disabled={checkingOutId === (attendanceToDisplay._id || attendanceToDisplay.id)}
                      className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 shadow-md shadow-rose-200 transition-all cursor-pointer active:scale-98"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>
                        {checkingOutId === (attendanceToDisplay._id || attendanceToDisplay.id)
                          ? 'Recording Check-out...'
                          : `Check Out ${memberToDisplay?.name?.split(' ')[0] || 'Member'}`}
                      </span>
                    </button>
                  )}

                  {/* If expired, provide renewal button */}
                  {scannedResult.type === 'expired' && (
                    <button
                      type="button"
                      onClick={() => setRenewalModalOpen(true)}
                      className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-primary-600 hover:bg-primary-700 flex items-center justify-center gap-2 shadow-md shadow-primary-200 transition-all cursor-pointer active:scale-98"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Renew Membership at Desk</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setScannedResult(null);
                      setGateUnlocked(false);
                    }}
                    className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Scan Next Member
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Check-ins List Below Scanner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              Recent Turnstile Entries Today
            </h3>
            <p className="text-xs text-slate-500">
              Complete chronological audit of entries through the front entrance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Total Recorded Today: <strong className="text-slate-800">{recentCheckIns.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Check-in Time</th>
                <th className="px-4 py-3">Check-out Time</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Actions / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentCheckIns.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-xs text-slate-400">
                    No turnstile check-ins recorded yet today.
                  </td>
                </tr>
              ) : (
                recentCheckIns.map((row) => {
                  const memberData =
                    memberDirectory.find(
                      (m) =>
                        (m._id || m.id) === row.memberId ||
                        (row.memberEmail && m.email === row.memberEmail)
                    ) ||
                    mockMembers.find((m) => m.id === row.memberId) || {
                      plan: 'Standard',
                    };

                  const rowId = row._id || row.id;

                  return (
                    <tr key={rowId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-medium text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-200">
                          {row.memberName?.charAt(0) || 'M'}
                        </div>
                        <span>{row.memberName}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${getPlanBadgeStyle(
                            memberData.plan
                          )}`}
                        >
                          {memberData.plan || 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-mono text-xs">
                        {row.checkIn}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                        {row.checkOut ? (
                          <span>{row.checkOut}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-semibold">Active now</span>
                            <button
                              type="button"
                              onClick={() => handleCheckOut(rowId)}
                              disabled={checkingOutId === rowId}
                              className="px-2 py-0.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                            >
                              Check Out
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            row.method === 'QR'
                              ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.method || 'QR'} Scanner
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3" /> Granted
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Member ID Search Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Enter Member ID or Name"
        size="md"
      >
        <form onSubmit={handleManualLookupSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Type member name, membership ID, email, or phone number to record attendance:
          </p>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. Yonas Tadesse or member ID or phone..."
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Or pick from registered members directory:
            </span>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {memberDirectory.length > 0 ? (
                memberDirectory.map((m) => (
                  <button
                    type="button"
                    key={m._id || m.id}
                    onClick={() => {
                      setManualModalOpen(false);
                      triggerScan(m);
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      <span className="text-slate-400 ml-2 font-mono">
                        ({(m._id || m.id).toString().slice(-6)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">{m.plan}</span>
                      <StatusBadge status={m.status} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No members in directory yet. Register members to check them in.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold cursor-pointer"
            >
              Check In Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Renewal Modal */}
      <Modal
        isOpen={renewalModalOpen}
        onClose={() => setRenewalModalOpen(false)}
        title="Immediate Desk Renewal"
        size="md"
      >
        {memberToDisplay && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900">{memberToDisplay.name}</h4>
              <p className="text-xs text-slate-500">Plan: {memberToDisplay.plan || 'Standard'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Select Renewal Package
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => setRenewalDuration(30)}
                  className={`p-3 border-2 rounded-xl text-center cursor-pointer transition ${
                    renewalDuration === 30
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs">1 Month Renewal</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-1">
                    {mockPlans.find((p) => p.name === memberToDisplay.plan)?.price || 1000} ETB
                  </div>
                </div>
                <div
                  onClick={() => setRenewalDuration(90)}
                  className={`p-3 border-2 rounded-xl text-center cursor-pointer transition ${
                    renewalDuration === 90
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs">3 Months (Discounted)</div>
                  <div className="text-base font-extrabold text-slate-800 mt-1">
                    {Math.round(
                      (mockPlans.find((p) => p.name === memberToDisplay.plan)?.price || 1000) * 2.7
                    )}{' '}
                    ETB
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Payment Received via:
              </label>
              <select
                value={renewalPaymentMethod}
                onChange={(e) => setRenewalPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Cash">Cash (Physical Cash Desk)</option>
                <option value="Mobile Money">Telebirr / CBE Birr QR</option>
                <option value="Bank Transfer">CBE / Awash Mobile Banking</option>
                <option value="Credit Card">Debit / POS Card</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRenewalModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenewFromCheckin}
                className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold shadow-md shadow-emerald-200 cursor-pointer"
              >
                Accept Payment & Check In
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

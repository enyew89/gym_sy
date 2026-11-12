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
  AlertCircle
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageHeader, Modal, StatusBadge } from '../../components/ui';
import { members as mockMembers, attendance as mockAttendance, plans as mockPlans } from '../../data/mockData';
import { attendanceApi, receptionistApi } from '../../services/api';

export default function QRCheckin() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedMember, setScannedMember] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState(30); // 30 or 90 days
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState('Cash');
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [memberDirectory, setMemberDirectory] = useState([]);

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

  // Load real attendance logs and members from backend
  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await attendanceApi.getAttendance();
        if (res.success && Array.isArray(res.attendance)) {
          setRecentCheckIns(res.attendance);
        }
      } catch (err) {}
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
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
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
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('turnstile-camera-reader');
      }
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
      };

      const targetCamera = cameraId || selectedCameraId || { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        targetCamera,
        config,
        (decodedText) => {
          handleBarcodeDecoded(decodedText);
        },
        () => {}
      );

      setCameraActive(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(err.message || 'Camera permission denied or camera unavailable');
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
      const verifyRes = await receptionistApi.verifyMember(token);
      if (!verifyRes.success || !verifyRes.member) {
        playChime(false);
        toast.error(verifyRes.message || 'No member record matches this QR badge.');
        return;
      }

      const member = {
        ...verifyRes.member,
        id: verifyRes.member._id || verifyRes.member.id,
        expiryDate: verifyRes.member.planExpiryDate
          ? new Date(verifyRes.member.planExpiryDate).toISOString().split('T')[0]
          : 'Expired',
      };
      setScannedMember(member);

      if (verifyRes.eligible) {
        playChime(true);
        setGateUnlocked(true);
        try {
          const checkinRes = await receptionistApi.checkIn({
            identifier: token,
            memberId: member.id,
            memberEmail: member.email,
            memberName: member.name,
            method: 'QR',
          });
          if (checkinRes.attendance) {
            setRecentCheckIns((prev) => [checkinRes.attendance, ...prev]);
          }
        } catch (checkinErr) {
          console.warn('Check-in log note:', checkinErr);
        }
        toast.success(`Turnstile Gate Unlocked! Welcome, ${member.name}.`, {
          icon: '🎉',
          duration: 3500,
        });
        setTimeout(() => setGateUnlocked(false), 3200);
      } else {
        playChime(false);
        setGateUnlocked(false);
        toast.error(`Entry Restricted: ${verifyRes.reason}`, {
          icon: '🛑',
          duration: 4500,
        });
        if (verifyRes.isExpired) {
          setRenewalModalOpen(true);
        }
      }
    } catch (err) {
      playChime(false);
      toast.error(err.message || 'Error processing member pass.');
    } finally {
      setIsScanning(false);
    }
  };

  // Quick simulation triggers (uses live verification pipeline)
  const activeMemberDemo = memberDirectory.find((m) => m.status === 'active') || mockMembers.find((m) => m.status === 'active') || null;
  const expiredMemberDemo = memberDirectory.find((m) => m.status === 'expired') || mockMembers.find((m) => m.status === 'expired') || null;
  const premiumMemberDemo = memberDirectory.find((m) => m.plan === 'Premium' && m.status === 'active') || null;

  const triggerScan = (memberToScan) => {
    if (!memberToScan) {
      toast.error('No member data available. Scan a valid registered member QR code.');
      return;
    }
    const token = `GYM-PASS:${memberToScan._id || memberToScan.id}:${memberToScan.email}`;
    handleBarcodeDecoded(token);
  };

  const handleAllowEntry = async () => {
    if (!scannedMember) return;
    setGateUnlocked(true);

    try {
      const res = await receptionistApi.checkIn({
        identifier: scannedMember._id || scannedMember.id,
        memberId: scannedMember._id || scannedMember.id,
        memberEmail: scannedMember.email,
        memberName: scannedMember.name,
        method: 'QR',
      });
      if (res.attendance) {
        setRecentCheckIns((prev) => [res.attendance, ...prev]);
      }
      toast.success(`Turnstile gate opened! Access Granted to ${scannedMember.name}.`, {
        icon: '🎉',
        duration: 3500,
      });
    } catch (err) {
      if (err.message && err.message.includes('expired')) {
        setGateUnlocked(false);
        toast.error(`Entry Denied: Membership expired. Opening renewal form...`, { icon: '🛑' });
        setRenewalModalOpen(true);
        return;
      }
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const fallbackLog = {
        id: `att-${Date.now()}`,
        memberId: scannedMember.id || 'm-temp',
        memberName: scannedMember.name,
        date: new Date().toISOString().split('T')[0],
        checkIn: timeStr,
        checkOut: null,
        method: 'QR',
      };
      setRecentCheckIns((prev) => [fallbackLog, ...prev]);
      toast.success(`Turnstile gate opened for ${scannedMember.name}!`, {
        icon: '🎉',
        duration: 3500,
      });
    }

    // Reset gate animation after 3 seconds
    setTimeout(() => {
      setGateUnlocked(false);
    }, 3000);
  };

  const handleManualLookupSubmit = async (e) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;

    try {
      const res = await receptionistApi.verifyMember(manualSearchQuery.trim());
      if (res.success && res.member) {
        setManualModalOpen(false);
        setManualSearchQuery('');
        const verified = {
          ...res.member,
          id: res.member._id || res.member.id,
          expiryDate: res.member.planExpiryDate
            ? new Date(res.member.planExpiryDate).toISOString().split('T')[0]
            : 'Expired',
        };
        setScannedMember(verified);
        if (res.eligible) {
          toast.success(`Member Verified: ${verified.name} (Access Permitted)`, { icon: '✅' });
        } else {
          toast.error(`Access Denied: ${res.reason}`, { icon: '🛑' });
        }
        return;
      }
    } catch (err) {}

    const found = mockMembers.find(
      (m) =>
        m.name.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
        m.id.toLowerCase() === manualSearchQuery.toLowerCase() ||
        m.phone.includes(manualSearchQuery)
    );

    if (found) {
      setManualModalOpen(false);
      setManualSearchQuery('');
      triggerScan(found);
    } else {
      toast.error('No member found with that name, ID or phone number');
    }
  };

  const handleRenewFromCheckin = async () => {
    if (!scannedMember) return;
    const planPrice = mockPlans.find((p) => p.name === scannedMember.plan)?.price || 1000;
    const amount = renewalDuration === 90 ? Math.round(planPrice * 2.7) : planPrice;

    try {
      const res = await receptionistApi.renewMembership({
        memberId: scannedMember._id || scannedMember.id,
        planName: scannedMember.plan || 'Standard',
        durationDays: renewalDuration,
        amount,
        paymentMethod: renewalPaymentMethod,
        notes: `Immediate turnstile renewal for gate check-in`,
      });

      if (res.success && res.member) {
        const updated = {
          ...scannedMember,
          status: 'active',
          planExpiryDate: res.member.planExpiryDate,
          expiryDate: res.member.planExpiryDate
            ? new Date(res.member.planExpiryDate).toISOString().split('T')[0]
            : 'In 30 days',
        };
        setScannedMember(updated);
        setRenewalModalOpen(false);
        toast.success(`Membership renewed until ${updated.expiryDate}! Gate opening...`, { icon: '🎉' });
        setGateUnlocked(true);
        setTimeout(() => setGateUnlocked(false), 3000);
        return;
      }
    } catch (err) {
      console.warn('Backend renewal error:', err);
    }

    // Fallback
    const updated = { ...scannedMember, status: 'active', expiryDate: '2027-10-18' };
    setScannedMember(updated);
    setRenewalModalOpen(false);
    toast.success(`Membership renewed for ${scannedMember.name}! Access now enabled.`);
    setGateUnlocked(true);
    setTimeout(() => setGateUnlocked(false), 3000);
  };

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
              className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
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
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm"
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
                <span className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className="font-semibold tracking-wide text-slate-200">
                  ENTRANCE TURNSTILE 01
                </span>
                <span className="text-slate-400 hidden sm:inline">• {cameraActive ? 'Optical Camera Active' : 'Standby / Manual'}</span>
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
            <div className="relative my-4 aspect-video min-h-[300px] max-h-[380px] w-full mx-auto bg-slate-900/90 rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
              {/* Camera Mount Element */}
              <div
                id="turnstile-camera-reader"
                className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && (
                <div className="text-center p-6 space-y-4">
                  {cameraError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-600/50 rounded-xl text-xs text-rose-300 flex items-center gap-2 max-w-md mx-auto">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="relative w-44 h-44 mx-auto border-2 border-dashed border-cyan-400/30 rounded-2xl flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <QrCode className="w-16 h-16 text-cyan-400/70 mb-2" />
                    <p className="text-[11px] text-slate-300 font-medium">Ready for QR Badge</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => startCamera(selectedCameraId)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Turn On Optical Camera</span>
                    </button>
                    <button
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
                <div className="absolute inset-0 bg-emerald-500/25 backdrop-blur-[2px] flex items-center justify-center transition-all z-20">
                  <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                    <CheckCircle className="w-7 h-7" />
                    <div>
                      <div className="font-bold text-base">TURNSTILE UNLOCKED</div>
                      <div className="text-xs text-emerald-100">Member may proceed through entrance</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Simulation Bar */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick Simulation Triggers:
                </span>
                <span className="text-xs text-slate-400">Verified through live turnstile backend</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => triggerScan(activeMemberDemo)}
                  disabled={isScanning}
                  className="px-3 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Scan Active Member</span>
                </button>

                <button
                  onClick={() => triggerScan(expiredMemberDemo)}
                  disabled={isScanning}
                  className="px-3 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Scan Expired Member</span>
                </button>

                <button
                  onClick={() => triggerScan(premiumMemberDemo)}
                  disabled={isScanning}
                  className="px-3 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Scan VIP Premium</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  Supports live optical webcams, phone screens & QR images
                </span>
                <button
                  onClick={() => {
                    setScannedMember(null);
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

        {/* Right Column: Verification & Access Decision Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ScanLine className="w-5 h-5 text-primary-600" />
                Member Verification
              </h3>
              {scannedMember && (
                <StatusBadge status={scannedMember.status} />
              )}
            </div>

            {/* Content area: Idle vs Loaded */}
            {!scannedMember ? (
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                  <QrCode className="w-10 h-10 animate-pulse text-slate-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-base">
                    Ready for Member QR Scan
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Hold the member's digital QR on their phone or physical key tag up to the turnstile reader.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => triggerScan(activeMemberDemo)}
                    className="px-4 py-2 text-xs font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    Simulate Quick Scan
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {/* Status Alert Banner */}
                {scannedMember.status === 'active' ? (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        ACTIVE MEMBERSHIP — CLEAR TO ENTER
                      </h4>
                      <p className="text-xs text-emerald-700">
                        Valid subscription until {scannedMember.expiryDate}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">
                        EXPIRED MEMBERSHIP — ACCESS RESTRICTED
                      </h4>
                      <p className="text-xs text-rose-700">
                        Plan expired on {scannedMember.expiryDate}. Renewal required.
                      </p>
                    </div>
                  </div>
                )}

                {/* Member Profile Details */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary-600 text-white font-bold text-xl flex items-center justify-center shadow-md flex-shrink-0">
                      {scannedMember.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-lg truncate">
                        {scannedMember.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        ID: <span className="font-mono text-slate-700">{scannedMember.id.toUpperCase()}</span> • {scannedMember.gender}, {scannedMember.age} yrs
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary-100 text-primary-800">
                          {scannedMember.plan} Plan
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400">Phone:</span>
                      <p className="font-medium text-slate-800">{scannedMember.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Join Date:</span>
                      <p className="font-medium text-slate-800">{scannedMember.joinDate}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Membership Expiry:</span>
                      <p
                        className={`font-semibold ${
                          scannedMember.status === 'active' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {scannedMember.expiryDate}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Personal Trainer:</span>
                      <p className="font-medium text-slate-800">
                        {scannedMember.trainerId ? 'Assigned' : 'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="space-y-2 pt-2">
                  {scannedMember.status === 'active' ? (
                    <button
                      onClick={handleAllowEntry}
                      disabled={gateUnlocked}
                      className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
                        gateUnlocked
                          ? 'bg-emerald-500 shadow-emerald-200 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 active:scale-[0.99]'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>{gateUnlocked ? 'GATE OPENED — WELCOME' : 'ALLOW ENTRY (UNLOCK GATE)'}</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => setRenewalModalOpen(true)}
                        className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-base bg-rose-600 hover:bg-rose-700 flex items-center justify-center gap-2 shadow-lg shadow-rose-200 active:scale-[0.99] transition-all"
                      >
                        <RefreshCw className="w-5 h-5" />
                        <span>RENEW MEMBERSHIP NOW</span>
                      </button>
                      <button
                        onClick={() => {
                          toast('Guest day-pass issued (150 ETB recorded)', { icon: '🎫' });
                          handleAllowEntry();
                        }}
                        className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Issue 1-Day Temporary Pass (150 ETB)
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setScannedMember(null)}
                    className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Clear & Scan Next Member
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
              Total Today: <strong className="text-slate-800">{recentCheckIns.length}</strong>
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
                <th className="px-4 py-3 text-right">Gate Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentCheckIns.map((row) => {
                const memberData = mockMembers.find((m) => m.id === row.memberId) || {
                  plan: 'Standard',
                };
                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-slate-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-200">
                        {row.memberName.charAt(0)}
                      </div>
                      <span>{row.memberName}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {memberData.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-mono text-xs">
                      {row.checkIn}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                      {row.checkOut || <span className="text-emerald-600 font-semibold">Active now</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          row.method === 'QR'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.method} Scanner
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Check className="w-3 h-3" /> Granted
                      </span>
                    </td>
                  </tr>
                );
              })}
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
            Type member name, membership ID (e.g., m1, m2), or phone number:
          </p>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. Yonas Tadesse or m1 or +251..."
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">
              Or pick from directory:
            </span>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {memberDirectory.length > 0 ? (
                memberDirectory.map((m) => (
                  <button
                    type="button"
                    key={m._id || m.id}
                    onClick={() => {
                      setManualModalOpen(false);
                      const mapped = {
                        ...m,
                        id: m._id || m.id,
                        expiryDate: m.planExpiryDate
                          ? new Date(m.planExpiryDate).toISOString().split('T')[0]
                          : 'Expired',
                      };
                      triggerScan(mapped);
                    }}
                    className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{m.name}</span>
                      <span className="text-slate-400 ml-2 font-mono">({(m._id || m.id).toString().slice(-6)})</span>
                    </div>
                    <StatusBadge status={m.status} />
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
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-semibold"
            >
              Search & Verify
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
        {scannedMember && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900">{scannedMember.name}</h4>
              <p className="text-xs text-slate-500">Plan: {scannedMember.plan}</p>
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
                    {mockPlans.find((p) => p.name === scannedMember.plan)?.price || 1000} ETB
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
                    {Math.round((mockPlans.find((p) => p.name === scannedMember.plan)?.price || 1000) * 2.7)} ETB
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
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenewFromCheckin}
                className="px-4 py-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold shadow-md shadow-emerald-200"
              >
                Accept Payment & Open Gate
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

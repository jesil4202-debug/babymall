'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, ShieldCheck, RotateCcw, ChevronLeft, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { CountdownTimer } from '@/components/CountdownTimer';

const COOLDOWN_SECS = 30;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { requestOtp, verifyOtp, isLoading } = useAuthStore();

  const [step, setStep] = useState<'email' | 'otp' | 'name'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus logic
  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus();
    if (step === 'name') nameInputRef.current?.focus();
  }, [step]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startOtpExpiry = () => {
    setOtpExpiry(300); // 5 minutes
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    otpTimerRef.current = setInterval(() => {
      setOtpExpiry((prev) => {
        if (prev <= 1) {
          clearInterval(otpTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    try {
      const data = await requestOtp(email.trim().toLowerCase());
      setIsNewUser(data?.isNewUser || false);
      toast.success('OTP sent! Check your inbox.');
      setStep('otp');
      startCooldown();
      startOtpExpiry();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit OTP.');
      return;
    }
    if (otpExpiry === 0) {
      toast.error('OTP has expired. Please request a new one.');
      return;
    }

    if (isNewUser) {
      setStep('name');
    } else {
      await submitFinalLogin();
    }
  };

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    await submitFinalLogin();
  };

  const submitFinalLogin = async () => {
    try {
      await verifyOtp(email, otp, name.trim());
      toast.success(isNewUser ? 'Welcome to Baby Mall!' : 'Welcome back!', { duration: 3000 });
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp('');
      setStep('otp');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    try {
      const data = await requestOtp(email.trim().toLowerCase());
      setIsNewUser(data?.isNewUser || false);
      toast.success('New OTP sent!');
      setOtp('');
      startCooldown();
      startOtpExpiry();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  const handleOtpInput = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, 6));
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-surface-100 to-surface-50">
      {/* Decorative blurred background shapes to create glassmorphism effect */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse-soft pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-pulse-soft pointer-events-none animation-delay-2000" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <div className="relative w-40 h-16 cursor-pointer" onClick={() => router.push('/')}>
            <Image src="/logo.png" width={120} height={120} alt="Logo" />
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-500">
          
          {/* Step Indicators */}
          <div className="flex items-center gap-3 mb-8">
            {['email', 'otp', 'name'].filter(s => s !== 'name' || isNewUser).map((s, idx) => {
              const isActive = step === s;
              const isPast = ['email', 'otp', 'name'].indexOf(step) > ['email', 'otp', 'name'].indexOf(s);
              return (
                <div key={s} className="flex items-center gap-3 flex-1 last:flex-none">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-800 transition-all duration-300 ${isActive ? 'bg-primary-500 text-white shadow-button' : isPast ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isPast ? <CheckIcon /> : idx + 1}
                  </div>
                  {idx < (isNewUser ? 2 : 1) && (
                    <div className={`flex-1 h-1 rounded-full transition-colors duration-500 ${isPast ? 'bg-primary-400' : 'bg-gray-100'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Step 1: Email ── */}
          {step === 'email' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-3xl font-900 text-gray-900 tracking-tight">Sign In</h1>
                <p className="text-gray-500 font-500 text-sm mt-2 leading-relaxed">Enter your email to receive a secure login code. No passwords required.</p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input pl-12 h-14 text-lg bg-white/50 focus:bg-white"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading || !email.trim() || cooldown > 0} className="btn-primary w-full h-14 text-lg">
                  {isLoading ? 'Sending...' : 'Continue'} <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <div className="animate-fade-in">
              <button 
                onClick={() => { setStep('email'); setOtp(''); setOtpExpiry(0); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors font-600 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Change email
              </button>

              <div className="mb-8 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mx-auto mb-5 shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-primary-500" />
                </div>
                <h1 className="text-3xl font-900 text-gray-900 tracking-tight">Enter OTP</h1>
                <p className="text-gray-500 font-500 text-sm mt-3 leading-relaxed">
                  We sent a 6-digit code to<br />
                  <span className="font-800 text-gray-800 tracking-wide">{email}</span>
                </p>
                <div className="mt-3 inline-flex px-3 py-1 bg-primary-50 rounded-full">
                  <p className="text-xs text-primary-600 font-700">Code expires in <CountdownTimer initialSeconds={otpExpiry} /></p>
                </div>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <input
                    ref={otpInputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => handleOtpInput(e.target.value)}
                    placeholder="• • • • • •"
                    className="input text-center text-3xl h-16 font-900 tracking-[0.5em] placeholder:tracking-normal placeholder:font-500 placeholder:text-gray-300 bg-white/50 focus:bg-white transition-all shadow-inner"
                    disabled={isLoading}
                    autoComplete="one-time-code"
                  />
                </div>

                <button type="submit" disabled={isLoading || otp.length !== 6 || otpExpiry === 0} className="btn-primary w-full h-14 text-lg">
                  {isLoading ? 'Verifying...' : (isNewUser ? 'Verify & Continue' : 'Verify & Sign In')}
                  <ShieldCheck className="w-5 h-5 ml-1.5" />
                </button>
              </form>

              <div className="mt-6 text-center">
                {cooldown > 0 ? (
                  <p className="text-sm text-gray-400 font-600">
                    Resend code in <span className="text-primary-500 tabular-nums">{cooldown}s</span>
                  </p>
                ) : (
                  <button onClick={handleResend} disabled={isLoading} className="text-sm font-700 text-primary-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
                    <RotateCcw className="w-4 h-4" /> Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Name (New User Only) ── */}
          {step === 'name' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary-50 mx-auto mb-5 shadow-inner">
                  <UserIcon className="w-8 h-8 text-secondary-500" />
                </div>
                <h1 className="text-3xl font-900 text-gray-900 tracking-tight text-center">Welcome!</h1>
                <p className="text-gray-500 font-500 text-sm mt-3 leading-relaxed text-center">
                  Since this is your first time, please tell us your name to complete your profile.
                </p>
              </div>

              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      ref={nameInputRef}
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="input pl-12 h-14 text-lg bg-white/50 focus:bg-white"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading || !name.trim()} className="btn-primary w-full h-14 text-lg">
                  {isLoading ? 'Creating Account...' : 'Complete & Sign In'}
                  <ArrowRight className="w-5 h-5 ml-1.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

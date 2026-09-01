'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, CheckCircle2, RefreshCw, ArrowLeft, Clock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [authStep, setAuthStep] = useState<'email' | 'otp' | 'success'>('email');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(300); // 5 mins
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Background Image Slider State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const patronImages = ['/patron1.png', '/patron2.png'];

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown & Image Slider
  useEffect(() => {
    // OTP Timer
    let timerInterval: NodeJS.Timeout;
    if (authStep === 'otp' && timer > 0) {
      timerInterval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    
    // Image Slider
    const slideInterval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % patronImages.length);
    }, 5000); // Change image every 5 seconds

    return () => {
      clearInterval(timerInterval);
      clearInterval(slideInterval);
    };
  }, [authStep, timer, patronImages.length]);

  // Request OTP from real API
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValidEmail || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Email is not registered in the system.');
      }

      setAuthStep('otp');
      setTimer(300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    // Auto advance to next box
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle Paste (Full 6-digit paste support)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (!pastedData) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    if (errorMessage) setErrorMessage('');

    // Focus last filled digit or 6th box
    const focusIndex = Math.min(digits.length, 5);
    otpInputsRef.current[focusIndex]?.focus();
  };

  // Handle Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Verify OTP with real API
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6 || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid or expired OTP code.');
      }

      if (data.token) {
        localStorage.setItem('nsse_token', data.token);
        localStorage.setItem('nsse_user', JSON.stringify(data.user));
        router.push('/dashboard');
        return;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex w-full">
      
      {/* LEFT SIDE - VISIONARY PORTRAIT (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-[#0B462C] flex-col justify-end overflow-hidden">
        {/* Background Image Slider */}
        <div className="absolute inset-0 z-0">
          {patronImages.map((src, index) => (
            <div 
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-80' : 'opacity-0'
              }`}
            >
              <Image 
                src={src} 
                alt={`Chief Patron Image ${index + 1}`} 
                fill
                className="object-cover object-top"
                priority={index === 0}
              />
            </div>
          ))}
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B462C] via-[#0B462C]/30 to-transparent z-10"></div>
        </div>

        {/* Vision Quote Content */}
        <div className="relative z-20 p-12 lg:p-20 text-white max-w-2xl">
          <div className="w-16 h-1.5 bg-[#C5A059] mb-8"></div>
          <h2 className="text-2xl lg:text-3xl font-black font-cinzel leading-[1.4] mb-6 tracking-wide drop-shadow-md">
            "Shaping the Future of Punjab Through World-Class Education and Excellence."
          </h2>
          <div>
            <p className="text-xl font-bold tracking-[0.2em] text-[#E8D4A2] uppercase">Maryam Nawaz Sharif</p>
            <p className="text-sm font-semibold opacity-80 mt-1 uppercase tracking-widest">Chief Minister, Punjab</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 bg-[#F2F9F5] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
        
        {/* Lightish Logo Background Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
          <Image 
            src="/logo.png" 
            alt="Watermark" 
            width={800} 
            height={800} 
            className="object-contain"
          />
        </div>

        {/* Main Luxury Card */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(11,70,44,0.15)] border border-gray-100 p-10 relative z-10">
        
        {/* Logo & School Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-24 h-24 relative mb-6">
            <Image 
              src="/logo.png" 
              alt="NSSE Logo" 
              fill
              priority 
              className="object-contain"
            />
          </div>
          
          <h1 className="text-2xl font-black text-[#0B462C] font-cinzel tracking-widest uppercase leading-tight">
            Nawaz Sharif
          </h1>
          <div className="text-[13px] font-bold text-[#C5A059] font-cinzel tracking-[0.2em] uppercase mt-1">
            School of Eminence
          </div>
          <div className="text-[10px] font-semibold text-[#0B462C]/60 font-cinzel tracking-widest uppercase mt-1">
            Chunian Campus
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50/90 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center animate-fadeIn">
            {errorMessage}
          </div>
        )}

        {/* ================= STEP 1: EMAIL INPUT ================= */}
        {authStep === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1B7C48] transition-colors">
                <Mail className="w-[1.125rem] h-[1.125rem]" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Enter your official email"
                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 focus:border-[#1B7C48] focus:ring-1 focus:ring-[#1B7C48] rounded-2xl text-gray-900 font-medium text-[15px] placeholder-gray-400 transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !isValidEmail}
              className="w-full bg-gradient-to-r from-[#0B462C] to-[#083622] hover:from-[#093c26] hover:to-[#062618] text-[#E8D4A2] py-4 px-6 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(11,70,44,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[#C5A059]" />
              ) : (
                <>
                  <span className="tracking-wide">Send OTP</span>
                  <ArrowRight className="w-[1.125rem] h-[1.125rem] text-[#C5A059]" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ================= STEP 2: OTP CODE INPUT ================= */}
        {authStep === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-8 animate-fadeIn">
            <div className="text-center">
              <p className="text-[13px] text-gray-500 mb-1">
                Security code sent to
              </p>
              <p className="text-[15px] font-bold text-gray-900">
                {email}
              </p>
            </div>

            {/* 6 Digit Inputs */}
            <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputsRef.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onPaste={handlePaste}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold bg-gray-50/50 border border-gray-200 focus:border-[#1B7C48] focus:ring-1 focus:ring-[#1B7C48] focus:bg-white rounded-xl outline-none transition-all text-[#0B462C]"
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-between text-[13px] font-medium text-gray-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C5A059]" />
                <span>{formatTimer(timer)}</span>
              </div>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={timer > 240 || isLoading}
                className="text-[#0B462C] font-semibold hover:text-[#083622] disabled:opacity-40 transition-colors"
              >
                Resend Code
              </button>
            </div>

            {/* Submit Button */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={otp.join('').length !== 6 || isLoading}
                className="w-full bg-gradient-to-r from-[#0B462C] to-[#083622] hover:from-[#093c26] hover:to-[#062618] text-[#E8D4A2] py-4 px-6 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(11,70,44,0.4)] disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-[#C5A059]" />
                ) : (
                  <>
                    <span className="tracking-wide">Verify & Authenticate</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthStep('email');
                  setOtp(['', '', '', '', '', '']);
                }}
                className="w-full py-2 text-[13px] font-semibold text-gray-400 hover:text-gray-700 transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Use a different email</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: SUCCESS STATE ================= */}
        {authStep === 'success' && (
          <div className="text-center py-8 space-y-5 animate-fadeIn">
            <div className="w-20 h-20 bg-green-50 text-[#0B462C] rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-[0_0_40px_rgba(11,70,44,0.1)]">
              <CheckCircle2 className="w-10 h-10 text-[#198754]" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0B462C] tracking-tight">
                Authentication<br/>Successful
              </h2>
              <p className="text-[14px] text-gray-500 mt-2">
                Secured session established for <br/>
                <strong className="text-gray-900 font-semibold">{email}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthStep('email');
                setEmail('');
                setOtp(['', '', '', '', '', '']);
              }}
              className="mt-6 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[13px] font-bold rounded-xl transition-colors border border-gray-200"
            >
              Sign Out Securely
            </button>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}

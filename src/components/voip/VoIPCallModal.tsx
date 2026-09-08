'use client';

import React from 'react';
import { CallState, RemoteUser } from './useVoIP';
import { Phone, PhoneOff, Mic, MicOff, Volume2, User as UserIcon } from 'lucide-react';

export interface VoIPCallModalProps {
  callState: CallState;
  remoteUser: RemoteUser | null;
  formattedDuration: string;
  isMuted: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
}

export default function VoIPCallModal({
  callState,
  remoteUser,
  formattedDuration,
  isMuted,
  onAccept,
  onReject,
  onEnd,
  onToggleMute
}: VoIPCallModalProps) {
  if (callState === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm overflow-hidden bg-slate-900 border border-slate-800/80 rounded-3xl shadow-2xl p-6 text-center text-white space-y-6">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* User Avatar & Pulse Animation */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {callState === 'calling' || callState === 'incoming' ? (
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          ) : null}
          {callState === 'connected' ? (
            <div className="absolute -inset-1 rounded-full bg-emerald-500/30 blur-sm animate-pulse" />
          ) : null}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border-2 border-slate-700/80 flex items-center justify-center text-slate-300 shadow-inner overflow-hidden">
            {remoteUser?.avatar ? (
              <img src={remoteUser.avatar} alt={remoteUser.userName} className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-slate-400" />
            )}
          </div>
        </div>

        {/* Call Info */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white tracking-tight">
            {remoteUser?.userName || 'Staff Member'}
          </h3>
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            {remoteUser?.role || 'Staff Contact'}
          </p>

          {/* Call Status Badge / Timer */}
          <div className="pt-2">
            {callState === 'calling' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold animate-pulse border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Calling...
              </span>
            )}
            {callState === 'incoming' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold animate-bounce border border-emerald-500/30">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" /> Incoming Voice Call
              </span>
            )}
            {callState === 'connected' && (
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {formattedDuration}
                </span>

                {/* Animated Voice Waveform */}
                <div className="flex items-center justify-center gap-1 h-6">
                  {[40, 70, 45, 90, 60, 100, 75, 45, 80, 50].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1 bg-emerald-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>
            )}
            {callState === 'busy' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
                User Busy on Another Call
              </span>
            )}
            {callState === 'ended' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20">
                Call Ended
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex items-center justify-center gap-6">
          {callState === 'incoming' ? (
            <>
              {/* Decline Button */}
              <button
                onClick={onReject}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
                title="Decline Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Accept Button */}
              <button
                onClick={onAccept}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 hover:scale-110 active:scale-95 transition-all animate-bounce"
                title="Accept Call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              {/* Mute Button (Connected Mode) */}
              {callState === 'connected' && (
                <button
                  onClick={onToggleMute}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                    isMuted
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              {/* End Call Button */}
              {(callState === 'calling' || callState === 'connected') && (
                <button
                  onClick={onEnd}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all"
                  title="End Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

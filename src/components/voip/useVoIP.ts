'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { audioSynthesizer } from './audio-synthesizer';

export type CallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'busy' | 'ended';

export interface RemoteUser {
  userId: string | number;
  userName: string;
  role?: string;
  avatar?: string;
}

export interface UseVoIPOptions {
  serverUrl: string; // e.g. ws://13.60.50.153:9000/voip or ws://localhost:9000/voip
  currentUser: {
    id: string | number;
    name: string;
    role?: string;
  } | null;
  onCallConnected?: () => void;
  onCallEnded?: (reason?: string) => void;
}

export function useVoIP({ serverUrl, currentUser, onCallConnected, onCallEnded }: UseVoIPOptions) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteUser, setRemoteUser] = useState<RemoteUser | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; userName: string; inCall: boolean }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingOfferRef = useRef<any>(null);
  const durationTimerRef = useRef<any>(null);

  // Ice servers list
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]);

  // Clean up PeerConnection & Audio
  const cleanupCall = useCallback((reason?: string) => {
    audioSynthesizer.stop();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setIsMuted(false);
    incomingOfferRef.current = null;

    if (onCallEnded) onCallEnded(reason);
  }, [onCallEnded]);

  // Initialize hidden Audio element for remote audio stream playback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audio.autoplay = true;
      remoteAudioRef.current = audio;
    }
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  // Connect WebSocket
  useEffect(() => {
    if (!currentUser || !currentUser.id || !serverUrl) return;

    let isMounted = true;
    let reconnectTimeout: any = null;

    const connectSocket = () => {
      try {
        const ws = new WebSocket(serverUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsSocketConnected(true);
          // Register user
          ws.send(
            JSON.stringify({
              type: 'register',
              userId: String(currentUser.id),
              userName: currentUser.name,
              role: currentUser.role
            })
          );
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type } = data;

            switch (type) {
              case 'registered':
                if (data.iceServers) {
                  iceServersRef.current = data.iceServers;
                }
                break;

              case 'online_users_update':
                setOnlineUsers(data.users || []);
                break;

              // Incoming call from someone
              case 'incoming_call': {
                setRemoteUser({
                  userId: data.callerId,
                  userName: data.callerName || `Staff #${data.callerId}`,
                  role: data.callerRole
                });
                incomingOfferRef.current = data.offer;
                setCallState('incoming');
                audioSynthesizer.playIncomingRingtone();
                break;
              }

              // Callee accepted our call
              case 'call_accepted': {
                audioSynthesizer.stop();
                audioSynthesizer.playConnectedTone();
                if (peerConnectionRef.current && data.answer) {
                  await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                }
                setCallState('connected');
                setCallDuration(0);
                if (durationTimerRef.current) clearInterval(durationTimerRef.current);
                durationTimerRef.current = setInterval(() => {
                  setCallDuration((prev) => prev + 1);
                }, 1000);
                if (onCallConnected) onCallConnected();
                break;
              }

              // Callee rejected our call
              case 'call_rejected': {
                audioSynthesizer.playCallEndedTone();
                setCallState('ended');
                setTimeout(() => {
                  setCallState('idle');
                  cleanupCall('CALL_REJECTED');
                }, 2000);
                break;
              }

              // Target is busy on another call
              case 'call_busy': {
                audioSynthesizer.playCallEndedTone();
                setCallState('busy');
                setTimeout(() => {
                  setCallState('idle');
                  cleanupCall('TARGET_BUSY');
                }, 2500);
                break;
              }

              // Call failed (user offline, etc.)
              case 'call_failed': {
                audioSynthesizer.playCallEndedTone();
                setCallState('ended');
                setTimeout(() => {
                  setCallState('idle');
                  cleanupCall('USER_OFFLINE');
                }, 2000);
                break;
              }

              // Partner ended call
              case 'call_ended': {
                audioSynthesizer.playCallEndedTone();
                setCallState('ended');
                setTimeout(() => {
                  setCallState('idle');
                  cleanupCall('CALL_ENDED_BY_REMOTE');
                }, 1500);
                break;
              }

              // Remote ICE Candidate received
              case 'ice_candidate': {
                if (peerConnectionRef.current && data.candidate) {
                  try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                  } catch (err) {
                    console.warn('Error adding ICE candidate', err);
                  }
                }
                break;
              }

              default:
                break;
            }
          } catch (err) {
            console.error('Socket message parse error', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsSocketConnected(false);
          reconnectTimeout = setTimeout(connectSocket, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.warn('Socket connect error', err);
        reconnectTimeout = setTimeout(connectSocket, 3000);
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [currentUser, serverUrl, cleanupCall, onCallConnected]);

  // Create WebRTC RTCPeerConnection
  const createPeerConnection = (targetUserId: string | number) => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ice_candidate',
            targetUserId: String(targetUserId),
            candidate: event.candidate
          })
        );
      }
    };

    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // 1. Initiate Outgoing Call
  const startCall = async (targetUser: RemoteUser) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('Signaling connection offline. Reconnecting...');
      return;
    }

    try {
      setRemoteUser(targetUser);
      setCallState('calling');
      audioSynthesizer.playOutgoingRing();

      // Acquire microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetUser.userId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      wsRef.current.send(
        JSON.stringify({
          type: 'call_user',
          targetUserId: String(targetUser.userId),
          callerName: currentUser?.name,
          callerRole: currentUser?.role,
          offer
        })
      );
    } catch (err: any) {
      console.error('Call initialization failed', err);
      audioSynthesizer.stop();
      setCallState('idle');
      alert(`Could not start voice call: ${err.message || 'Microphone access denied'}`);
      cleanupCall('MIC_ERROR');
    }
  };

  // 2. Accept Incoming Call
  const acceptCall = async () => {
    audioSynthesizer.stop();
    if (!remoteUser || !incomingOfferRef.current) return;

    try {
      // Acquire microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = createPeerConnection(remoteUser.userId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call_accepted',
            callerId: String(remoteUser.userId),
            answer
          })
        );
      }

      setCallState('connected');
      setCallDuration(0);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      if (onCallConnected) onCallConnected();
    } catch (err: any) {
      console.error('Accept call failed', err);
      rejectCall();
      alert(`Could not answer call: ${err.message || 'Microphone error'}`);
    }
  };

  // 3. Reject Incoming Call
  const rejectCall = () => {
    audioSynthesizer.stop();
    if (remoteUser && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call_rejected',
          callerId: String(remoteUser.userId),
          reason: 'CALL_DECLINED'
        })
      );
    }
    setCallState('idle');
    cleanupCall('REJECTED_BY_ME');
  };

  // 4. Hang up / End Active Call
  const endCall = () => {
    audioSynthesizer.stop();
    if (remoteUser && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'end_call',
          targetUserId: String(remoteUser.userId)
        })
      );
    }
    audioSynthesizer.playCallEndedTone();
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      cleanupCall('ENDED_BY_ME');
    }, 1000);
  };

  // 5. Toggle Mute Local Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return {
    callState,
    remoteUser,
    isMuted,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    isSocketConnected,
    onlineUsers,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute
  };
}

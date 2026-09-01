'use client';

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { api, getStoredUser, User } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher';
import CreateTaskModal from './CreateTaskModal';
import {
  MessageSquare,
  X,
  Search,
  ChevronLeft,
  Paperclip,
  Mic,
  Send,
  Play,
  Pause,
  FileText,
  Check,
  CheckCheck,
  Clock,
  Download,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

export interface StaffContact {
  id: number;
  name: string;
  email: string;
  role: string;
  unread_count: number;
  last_message: {
    message: string;
    type: string;
    created_at: string;
    is_mine: boolean;
  } | null;
}

export interface DirectMessage {
  id: number;
  sender_id: number;
  recipient_id: number;
  message?: string | null;
  type: 'text' | 'voice' | 'image' | 'document';
  attachment_url?: string | null;
  attachment_name?: string | null;
  duration?: number | null;
  is_task: boolean;
  task_id?: number | null;
  task?: {
    id: number;
    title: string;
    status: string;
    priority: string;
  } | null;
  read_at?: string | null;
  created_at: string;
  _pending?: boolean; // Optimistic status
}

// Waveform bar height sequence (18 bars)
const WAVEFORM_BARS = [35, 65, 40, 85, 55, 95, 75, 45, 90, 60, 100, 70, 40, 80, 50, 85, 45, 65];

// Embedded 0.35s pleasant two-tone intercom chime WAV (Zero external dependencies)
const CHIME_AUDIO_URI = 'data:audio/wav;base64,UklGRhQLAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YfAKAACAtd/18tirdUEbCREvXpTG6PXpyJdhMhMLG0Bzp9Tu8t21gk8lDxApU4e53/Hrz6JuPhwOGDhnmsjn8OG/j1wwFhEkSXqs1evr1a17SyUTFzFcjbze7OTGmmg8HRMgQW6fyuXq2baHVy8YFyxSgbDV6OXNpXVHJhceOWOTv93o3b6TYzofGShJdqTL4uTSroBTLxwdNFqHtNXk3sWdb0UnGyVBa5jB2+PVtoteOCEeL1F8qMzf38qmek8vHyQ7YY221ODYvZZqQiggLElyncLZ3s6uhVo4JCM2WIKszNzZw591TS8jKkNokrnT3NG2j2VBKiUyUHihw9fZx6d/VzcnKT1fiK/M2NO8mHBKMCcwSm+XutHXy6+JYUAsKTlXfqXE1NPBoXpUNyovRGaNscvVzbWSa0kyKzZQdZu7z9PEqINePy4uP16DqMTRzrqadVE4LTRLbJGzytHHroxnRzMvPFd6nrzNzr6iflo/MTNGZIiqw87JtJRwUDkxOlFylbTIzcGoh2NGNTRCXX+hvcvJuJx5WD80OExqjKzDy8Suj2xOOjU/V3eZtcfJvKKCYEY3OEhjhKS8yMWzlnVWQDc9UW+QrsLIvqiJaU08OURcfJy2xcW2nX1eRjo8TWiIprzFwK2RcVRBOkJXdJSvwMS5o4VmTD09SmKAnrbCwbGXeVxGPEFSbYyou8K7qIxuU0I9R1x5l7C/wLSdgGNMQEBPZ4ShtsC8rJN1Wkc/RVhyj6m6v7ejh2tSQ0FMYX2ZsL29sJl8YUxCRFRsiKK2vbinjnJZR0JKXHaSqrm8sp6DaFJFRFBmgZywu7mrlHlfTERIWHCLpLW7tKKKb1dJRU5he5WruLmumX9mUUdIVWuFnrC5taaQdV5NR0xddI6ltLiwnoZsV0pIUmZ+l6u2tamVfGRRSUxZb4ifsLaxootzXE5JUGF4kaaztayagmpWS0tWaoKZq7SypZF5YlJLT11zi6CvtK6eiHBcT0xUZXyTprGyqJZ/aFZNT1puhZursq+hjXZhUk1TYXaNoa6xqpqEbltQT1hpf5WnsK+kknxmVk9SXnGInKqwq52Jc2BTUFZlepCira+mloFsW1FSXG2Cl6eurKCOeWVXUVVidYqdqq6omoZxX1RSWml9kqKsrKOSfmpbU1RfcIWYpqypnYt2ZFdTWGV4jJ6pq6WWg29fVVVdbICToqqpn497aVtVV2J0h5mmqqaZiHRjWFVbaXuOnqipoZOAbV9WV2BwgpWiqaecjHloW1ZaZneJmqWoo5ZoWFtuiqConYVqWVpsh56onodsWlpqhJynoIlvXFlogpqmoYxxXVlngJimoo50X1llfZalopB2YVlke5Sko5J4YlpieJKjo5R7ZFphdo+hpJV9ZltgdI2gpJd/aFtfcouepJiCalxfcImdpJqEbF1eboabo5uGbl5ebISZo5yIcGBda4KYop2Kc2FdaYCWop6MdWJdaH2UoZ+Od2RdZ3uSoJ+QeWVeZXmQn6CSe2deZHeOnqCTfWlfZHWMnKCVf2tfY3OKm6CWgmxgYnKImqCXhG5hYnCGmJ+YhXBiYW6Dl5+Zh3JjYW2BlZ+aiXRkYWx/k56bi3ZlYWp+kp2bjXhnYWl8kJycjnpoYWh6jpuckHxqYmd4jJqckX5rYmd2ipmckoBtY2Z1iZick4FuY2Vzh5eclYNwZGVyhZacloVyZWRwg5SclodzZmRvgZObl4h1Z2RugJGbmIp3aGRtfpCamIt5aWRsfI6ZmY16a2RreoyZmY58bGVqeYuYmY9+bWVpd4mXmZB/b2ZpdoiWmZGBcGZodIaUmZKDcmdoc4STmZOEc2hncoOSmZSGdWlncYGRmJWHdmpncH+PmJWJeGtnb36Ol5aKeWxnbnyNl5aLe21nbXuLlpaMfG5obHqKlZeNfm9obHiIlJeOgHFoa3eHk5ePgXJpa3aFkpeQgnNqanSEkZaRhHVqanOCkJaShXZranKBj5aShndsanGAjpWTiHltanB+jJWTiXpuanB9i5SUintvam97ipOUi31wam56iZOUjH5xa255h5KUjX9ya214hpGUjoFza213hZCUj4J0bGx2g4+Uj4N2bWx1go6UkIV3bWx0gY2TkIZ4bmxzgIyTkYd5b2xyfouSkYh7cGxxfYqSkol8cWxxfImRkop9cmxwe4iRkot+c21weoaQkot/dG1veYWPkoyBdW5veISOko2Cdm5ud4OOko6Dd29udoKNko6EeG9udYGMkY+FeXBudICLkY+GenFuc36KkI+He3Fuc32JkJCIfHJucnyIj5CJfXNucnuHj5CJfnRvcXqGjpCKf3VvcXmFjpCLgXZvcXiEjZCLgndwcHiDjJCMg3hwcHeCi5CNhHlxcHaBio+NhHpycHWAio+NhXtycHV/iY+OhnxzcHR+iI6Oh310cHR9h46OiH50cHN8ho2OiH91cXN7hY2OiX92cXJ6hIyOioB3cXJ5g4uOioF4cnJ4gouOi4J5cnJ4gYqOi4N5c3J3gImOjIR6c3J2gImNjIV7dHJ2f4iNjIV8dHJ1foeNjIZ9dXJ1fYaMjYd+dnJ0fIWMjYd/dnJ0e4SLjYh/d3J0e4SLjYmAeHN0eoOKjYmBeHNzeYKKjYqCeXNzeYGJjIqDenRzeICIjIqDe3Rzd4CIjIuEfHVzd3+HjIuFfHVzdn6Gi4uFfXZzdn2Fi4uGfndzdnyFiouHf3d0dXyEiouHgHh0dXuDiouIgHl0dXqCiYuIgXl0dXqCiIuIgnp1dXmBiIuJgnt1dHmAh4uJg3t2dHiAh4uJhHx2dHh/hoqKhH13dHd+hYqKhX13dXd9hYqKhX54dXd9hImKhn94dXZ8g4mKhn95dXZ8g4iKh4B5dXZ7goiKh4F6dnZ6gYiKh4F7dnZ6gYeKiIJ7dnZ5gIaKiIN8d3Z5gIaJiIN8d3Z5f4WJiYR9d3Z4foWJiYR+eHZ4foSJiYV+eHZ4fYSIiYV/eXZ3fYOIiYZ/eXZ3fIKIiYaAenZ3e4KHiYaBend3e4GHiYeBe3d3e4GGiYeCfHd3eoCGiYeCfHh3eoCFiIeDfXh3eX+FiIiDfXh3eX6EiIiEfnl3eX6EiIiEfnl3eH2Dh4iFf3p3eH2Dh4iFgHp3eHyCh4iFgHt3eHyChoiGgXt4eHuBhoiGgXx4eHuBhYiGgnx4eHuAhYiGgn14eHp/hYeHgn15eHp/hIeHg355eHp/hIeHg355eHl+g4eHhH96eHl+g4aHhH96eHl9goaHhH97eHl9goaHhYB7eHl8gYaHhYB8eHl8gYWHhYF8eXh8gIWHhYF8eXh7gISHhoJ9eXh7f4SHhoJ9eXh7f4SGhoN+enh6f4OGhoN+enh6foOGhoN/enl6foKGhoR/e3l6fYKFhoSAe3l6fYKFhoSAfHl5fYGFhoSAfHl5fIGFhoWBfHl5fICEhoWBfXp5fICEhoWCfXp5e4CEhoWCfnp5e3+DhoWCfnp5e3+DhYWDfnt5e36DhYWDf3t5en6ChYWDf3t5en6ChYWDgHx6en2BhYWEgHx6en2BhIWEgHx6en2BhIWEgX16enyAhIWEgX16enyAg4WEgX16enyAg4WFgn57enx/g4WFgn57ent/g4WFgn57ent+goWFgn97ent+goSFg398ent+goSFg4B8ent+gYSFg4B8ent9gYSFg4B9ent9gISFhIB9e3p9gIOFhIF9e3p8gIOFhIF+e3p8';

const playNotificationChime = () => {
  try {
    const audio = new Audio(CHIME_AUDIO_URI);
    audio.volume = 0.8;
    audio.play().catch(() => {});
  } catch (err) {
    console.warn('Audio chime play error', err);
  }
};

export default function FloatingChatWidget() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [contacts, setContacts] = useState<StaffContact[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeContact, setActiveContact] = useState<StaffContact | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoadingContacts, setIsLoadingContacts] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [hasNewIncomingAlert, setHasNewIncomingAlert] = useState<boolean>(false);

  // Keep a fresh mutable ref to activeContact so the single Pusher listener always knows who is active
  const activeContactRef = useRef<StaffContact | null>(null);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Task Modal
  const [taskTargetMessage, setTaskTargetMessage] = useState<DirectMessage | null>(null);

  // Audio Playback & Waveform Progress
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scroll Refs
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Contacts Immediately on Mount so Badges/Dots are accurate
  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true);
      const res = await api.get<StaffContact[]>('/chat/contacts');
      setContacts(res || []);
    } catch (err) {
      console.error('Failed to fetch chat contacts', err);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) {
      fetchContacts();
    }
  }, []);

  // Fetch Messages for Active Contact
  const fetchMessages = async (recipientId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.get<DirectMessage[]>(`/chat/messages/${recipientId}`);
      setMessages(res || []);
      // Decrement unread count locally for this contact
      setContacts((prev) =>
        prev.map((c) => (c.id === recipientId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      setHasNewIncomingAlert(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact.id);
    }
  }, [activeContact]);

  // Robust Scroll-To-Bottom Handler
  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  // Ensure scroll is snapped to bottom when messages load or contact changes
  useLayoutEffect(() => {
    if (activeContact && messages.length > 0) {
      scrollToBottom('auto');
      const t1 = setTimeout(() => scrollToBottom('auto'), 40);
      const t2 = setTimeout(() => scrollToBottom('auto'), 150);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [messages, activeContact, isLoadingMessages]);

  // 📡 Rock-Solid Persistent Pusher Subscription (Subscribes ONCE per user)
  useEffect(() => {
    if (!user?.id) return;

    const pusher = getPusherClient();
    const channelName = `user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    const handleNewMessage = (newMsg: DirectMessage) => {
      const currentUserId = Number(user.id);
      const senderId = Number(newMsg.sender_id);
      const isFromOtherUser = senderId !== currentUserId;
      const currentActive = activeContactRef.current;

      // Play chime tune and show glowing dot on any incoming message
      if (isFromOtherUser) {
        playNotificationChime();
        setHasNewIncomingAlert(true);
      }

      // If chatting with this person right now, append message and scroll down
      if (
        currentActive &&
        (senderId === currentActive.id || Number(newMsg.recipient_id) === currentActive.id)
      ) {
        setMessages((prev) => {
          // If optimistic message exists with negative ID, replace it
          if (senderId === currentUserId) {
            const hasPending = prev.some((m) => m.id < 0 && m.message === newMsg.message);
            if (hasPending) {
              return prev.map((m) => (m.id < 0 && m.message === newMsg.message ? newMsg : m));
            }
          }
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }

      // Update contact list snippet and unread count in real-time
      setContacts((prev) =>
        prev.map((c) => {
          const isSender = c.id === senderId;
          const isRecipient = c.id === Number(newMsg.recipient_id);
          if (isSender || isRecipient) {
            return {
              ...c,
              unread_count:
                isSender && (!currentActive || currentActive.id !== c.id)
                  ? c.unread_count + 1
                  : c.unread_count,
              last_message: {
                message:
                  newMsg.type === 'voice'
                    ? '🎙️ Voice message'
                    : newMsg.type === 'document' || newMsg.type === 'image'
                    ? '📎 Attachment'
                    : newMsg.message || '',
                type: newMsg.type,
                created_at: newMsg.created_at,
                is_mine: senderId === currentUserId,
              },
            };
          }
          return c;
        })
      );
    };

    const handleTaskUpdated = (task: any) => {
      if (task.message_id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === task.message_id
              ? {
                  ...m,
                  is_task: true,
                  task_id: task.id,
                  task: {
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    priority: task.priority,
                  },
                }
              : m
          )
        );
      }
    };

    channel.bind('new-direct-message', handleNewMessage);
    channel.bind('task-updated', handleTaskUpdated);

    return () => {
      channel.unbind('new-direct-message', handleNewMessage);
      channel.unbind('task-updated', handleTaskUpdated);
      pusher.unsubscribe(channelName);
    };
  }, [user?.id]);

  // Instant (Optimistic) Send Text / Attachment Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeContact || (!inputText.trim() && !selectedFile) || !user) return;

    const textToSend = inputText.trim();
    const fileToSend = selectedFile;
    const tempId = -Date.now();
    const msgType = fileToSend
      ? fileToSend.type.startsWith('image/')
        ? 'image'
        : 'document'
      : 'text';

    // ⚡ 1. INSTANT OPTIMISTIC UI UPDATE (0 millisecond delay!)
    const optimisticMessage: DirectMessage = {
      id: tempId,
      sender_id: user.id,
      recipient_id: activeContact.id,
      message: textToSend || null,
      type: msgType,
      attachment_url: fileToSend ? URL.createObjectURL(fileToSend) : null,
      attachment_name: fileToSend ? fileToSend.name : null,
      is_task: false,
      read_at: null,
      created_at: new Date().toISOString(),
      _pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setSelectedFile(null);
    setTimeout(() => scrollToBottom('smooth'), 20);

    // Update contacts preview immediately
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? {
              ...c,
              last_message: {
                message: fileToSend ? '📎 Attachment' : textToSend,
                type: msgType,
                created_at: new Date().toISOString(),
                is_mine: true,
              },
            }
          : c
      )
    );

    // 🚀 2. Background Dispatch
    try {
      const formData = new FormData();
      formData.append('recipient_id', String(activeContact.id));

      if (fileToSend) {
        formData.append('attachment', fileToSend);
        formData.append('type', msgType);
        if (textToSend) formData.append('message', textToSend);
      } else {
        formData.append('type', 'text');
        formData.append('message', textToSend);
      }

      const res = await api.postForm<DirectMessage>('/chat/messages', formData);

      // Replace optimistic temp ID with verified backend ID
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res : m)));
    } catch (err: any) {
      console.error('Failed to dispatch message', err);
      // Mark as error / remove on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert(err.message || 'Network error sending message.');
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: 'audio/webm',
        });
        await sendVoiceNote(audioFile, recordingDuration);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('Microphone access is required to record voice notes.');
    }
  };

  // Stop Voice Recording and Send
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Send Voice Note File (Optimistic UI)
  const sendVoiceNote = async (audioFile: File, duration: number) => {
    if (!activeContact || !user) return;
    const tempId = -Date.now();

    // ⚡ Instant Optimistic Message
    const optimisticVoice: DirectMessage = {
      id: tempId,
      sender_id: user.id,
      recipient_id: activeContact.id,
      type: 'voice',
      attachment_url: URL.createObjectURL(audioFile),
      attachment_name: 'voice_note.webm',
      duration: duration || 1,
      is_task: false,
      read_at: null,
      created_at: new Date().toISOString(),
      _pending: true,
    };

    setMessages((prev) => [...prev, optimisticVoice]);
    setTimeout(() => scrollToBottom('smooth'), 20);

    try {
      const formData = new FormData();
      formData.append('recipient_id', String(activeContact.id));
      formData.append('type', 'voice');
      formData.append('attachment', audioFile);
      formData.append('duration', String(duration || 1));

      const res = await api.postForm<DirectMessage>('/chat/messages', formData);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? res : m)));
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert(err.message || 'Failed to send voice note.');
    }
  };

  // Play / Pause Voice Audio with Waveform Progress Tracking
  const togglePlayAudio = (id: number, url: string) => {
    if (playingAudioId === id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      setAudioPlaybackProgress(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingAudioId(id);
      setAudioPlaybackProgress(0);

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setAudioPlaybackProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.play();
      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioPlaybackProgress(0);
      };
    }
  };

  const totalUnreadCount = contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatSeconds = (sec?: number | null) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <>
      {/* ================= 🟢 FLOATING LAUNCHER BUTTON ================= */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Animated Pulsing Ring when New Message Arrives or Unread exists */}
          {(hasNewIncomingAlert || totalUnreadCount > 0) && (
            <span className="absolute -inset-1.5 rounded-full bg-emerald-500/60 animate-ping" />
          )}

          <button
            onClick={() => {
              setIsOpen(true);
              setHasNewIncomingAlert(false);
            }}
            className="relative w-14 h-14 rounded-full bg-[#0B462C] hover:bg-[#093823] text-white shadow-2xl flex items-center justify-center transition-all transform hover:scale-105 cursor-pointer group"
            title="Staff Intercom & 1-on-1 Chat"
          >
            <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />

            {/* Glowing Unread Dot & Counter */}
            {totalUnreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                {totalUnreadCount}
              </span>
            ) : hasNewIncomingAlert ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-md animate-pulse" />
            ) : null}
          </button>
        </div>
      )}

      {/* ================= 💬 FLOATING CHAT DRAWER / WINDOW ================= */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full sm:w-[430px] h-[610px] max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-scaleIn text-xs">
          {/* SCREEN 1: STAFF DIRECTORY LIST */}
          {!activeContact ? (
            <div className="flex flex-col h-full bg-white">
              {/* Header */}
              <div className="px-5 py-4 bg-[#0B462C] text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm">
                    💬
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">School Staff Intercom</h3>
                    <p className="text-[10px] text-emerald-200 font-medium">1-on-1 Direct Messaging</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3.5 border-b border-gray-100 bg-gray-50/80">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search staff by name or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {isLoadingContacts ? (
                  <div className="p-8 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0B462C]" />
                    <span className="font-semibold">Loading staff directory...</span>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="font-semibold">No staff members found.</p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-gray-900 truncate text-xs">{contact.name}</span>
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-gray-100 text-gray-600 uppercase">
                              {contact.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                            {contact.last_message ? (
                              <>
                                {contact.last_message.is_mine && <span className="text-gray-400">You: </span>}
                                {contact.last_message.message}
                              </>
                            ) : (
                              <span className="text-gray-400 italic">Tap to start conversation</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        {contact.last_message && (
                          <span className="text-[10px] text-gray-400 font-medium">
                            {formatTime(contact.last_message.created_at)}
                          </span>
                        )}
                        {contact.unread_count > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#0B462C] text-white font-black text-[10px] min-w-[18px] text-center shadow-xs">
                            {contact.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* SCREEN 2: 1-ON-1 CONVERSATION CANVAS */
            <div className="flex flex-col h-full bg-[#F7FAF8]">
              {/* Top Chat Header */}
              <div className="p-3.5 bg-white border-b border-gray-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => setActiveContact(null)}
                    className="p-1 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Back to staff list"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                    {activeContact.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-gray-900 text-xs truncate leading-tight">
                      {activeContact.name}
                    </h4>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      {activeContact.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Message Stream with ref for robust scrolling */}
              <div ref={chatScrollContainerRef} className="flex-1 p-3.5 overflow-y-auto space-y-3">
                {isLoadingMessages ? (
                  <div className="p-8 flex items-center justify-center text-gray-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0B462C]" />
                    <span className="font-semibold">Loading conversation...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 space-y-1">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-base">
                      👋
                    </div>
                    <p className="font-bold text-gray-600 text-xs">Direct School Communication</p>
                    <p className="text-[10px]">Send a message, voice note, or task instruction.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs space-y-1.5 ${
                            isMine
                              ? 'bg-[#0B462C] text-white rounded-tr-xs'
                              : 'bg-white text-gray-900 border border-gray-200/90 rounded-tl-xs'
                          }`}
                        >
                          {/* TEXT CONTENT (Large Crisp Font) */}
                          {msg.message && (
                            <p className="text-sm font-medium whitespace-pre-wrap break-words leading-relaxed">
                              {msg.message}
                            </p>
                          )}

                          {/* AUDIO VOICE NOTE WITH DYNAMIC SOUNDWAVE WAVES */}
                          {msg.type === 'voice' && msg.attachment_url && (
                            <div className="flex items-center gap-3 py-1.5 min-w-[200px] max-w-[260px]">
                              {/* Play / Pause Circular Button */}
                              <button
                                type="button"
                                onClick={() => togglePlayAudio(msg.id, msg.attachment_url!)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs shrink-0 cursor-pointer transition-all transform hover:scale-105 ${
                                  isMine ? 'bg-white text-[#0B462C]' : 'bg-[#0B462C] text-white'
                                }`}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>

                              {/* Soundwave Bars Visualizer */}
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-[2.5px] h-6">
                                  {WAVEFORM_BARS.map((heightPct, idx) => {
                                    const barProgress = (idx / WAVEFORM_BARS.length) * 100;
                                    const isPlayed = playingAudioId === msg.id && barProgress <= audioPlaybackProgress;

                                    return (
                                      <div
                                        key={idx}
                                        className={`w-[3px] rounded-full transition-all duration-150 ${
                                          isMine
                                            ? isPlayed
                                              ? 'bg-white'
                                              : 'bg-white/40'
                                            : isPlayed
                                            ? 'bg-[#0B462C]'
                                            : 'bg-gray-300'
                                        } ${playingAudioId === msg.id ? 'animate-pulse' : ''}`}
                                        style={{ height: `${Math.max(15, heightPct * 0.24)}px` }}
                                      />
                                    );
                                  })}
                                </div>

                                <div
                                  className={`flex justify-between text-[10px] font-mono font-bold ${
                                    isMine ? 'text-emerald-200' : 'text-gray-400'
                                  }`}
                                >
                                  <span>Voice Note</span>
                                  <span>{formatSeconds(msg.duration)}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* DOCUMENT / IMAGE ATTACHMENT */}
                          {(msg.type === 'document' || msg.type === 'image') && msg.attachment_url && (
                            <div
                              className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                                isMine
                                  ? 'bg-white/10 border-white/20 text-white'
                                  : 'bg-gray-50 border-gray-200 text-gray-900'
                              }`}
                            >
                              {msg.type === 'image' ? (
                                <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                              ) : (
                                <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                              )}
                              <span className="truncate text-xs font-bold flex-1">
                                {msg.attachment_name || 'Attachment'}
                              </span>
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-md hover:bg-black/10 transition-colors"
                                title="Download Attachment"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}

                          {/* TASK BADGE IF CONVERTED */}
                          {msg.is_task && msg.task && (
                            <div className="mt-1 pt-1.5 border-t border-black/10 flex items-center justify-between text-[10px] font-bold">
                              <span className="flex items-center gap-1 text-amber-300">
                                📌 Task: {msg.task.title}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded uppercase text-[8px] ${
                                  msg.task.status === 'completed'
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {msg.task.status}
                              </span>
                            </div>
                          )}

                          {/* Time & Read Receipts */}
                          <div
                            className={`flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                              isMine ? 'text-emerald-200' : 'text-gray-400'
                            }`}
                          >
                            <span>{formatTime(msg.created_at)}</span>
                            {isMine && (
                              msg._pending ? (
                                <Clock className="w-3 h-3 text-emerald-200/60 animate-spin" />
                              ) : msg.read_at ? (
                                <CheckCheck className="w-3 h-3 text-emerald-300" />
                              ) : (
                                <Check className="w-3 h-3 text-emerald-200/70" />
                              )
                            )}
                          </div>
                        </div>

                        {/* HOVER "MAKE TASK" ACTION BUTTON */}
                        {!msg.is_task && (
                          <button
                            onClick={() => setTaskTargetMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-[10px] font-bold text-gray-500 hover:text-purple-800 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-purple-50 cursor-pointer"
                            title="Turn this message into an assigned task"
                          >
                            <span>📌 Turn into Task</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Upload Preview Pill */}
              {selectedFile && (
                <div className="px-3.5 py-1.5 bg-purple-50 border-t border-purple-200 flex items-center justify-between text-xs text-purple-900 font-bold">
                  <span className="truncate">📎 {selectedFile.name}</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-purple-600 hover:text-purple-900 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Bottom Input Area using Multiline Custom Textarea & Actions */}
              <div className="p-3 bg-white border-t border-gray-200 space-y-2">
                {isRecording ? (
                  /* Live Voice Recording Bar */
                  <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-2xl p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                      <span className="font-mono font-bold text-rose-700 text-xs">
                        Recording {formatSeconds(recordingDuration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRecording}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 font-bold cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Send Note
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Multiline Text Input & Actions */
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />

                    {/* Paperclip File Upload */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0 mb-0.5"
                      title="Attach Document or Image"
                    >
                      <Paperclip className="w-4.5 h-4.5" />
                    </button>

                    {/* Multiline Input */}
                    <div className="flex-1">
                      <textarea
                        rows={2}
                        placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full text-sm font-medium bg-gray-50 border border-gray-200 rounded-2xl p-2.5 text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 focus:outline-none transition-all resize-none max-h-24"
                      />
                    </div>

                    {/* Mic Voice Record Button */}
                    <button
                      type="button"
                      onClick={startRecording}
                      className="p-2.5 rounded-xl text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer shrink-0 mb-0.5"
                      title="Record Voice Note"
                    >
                      <Mic className="w-4.5 h-4.5" />
                    </button>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={!inputText.trim() && !selectedFile}
                      className="p-2.5 rounded-xl bg-[#0B462C] hover:bg-[#093823] text-white shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 mb-0.5"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Creation Modal */}
      {taskTargetMessage && activeContact && (
        <CreateTaskModal
          isOpen={true}
          onClose={() => setTaskTargetMessage(null)}
          message={taskTargetMessage}
          contact={activeContact}
          currentUserId={user.id}
          onTaskCreated={(newTask) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === newTask.message_id
                  ? { ...m, is_task: true, task_id: newTask.id, task: newTask }
                  : m
              )
            );
          }}
        />
      )}
    </>
  );
}

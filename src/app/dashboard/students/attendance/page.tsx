'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Calendar, 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  RotateCcw,
  ChevronRight, 
  Layers, 
  Phone, 
  Filter, 
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  GraduationCap,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  PhoneCall,
  PhoneOff,
  MessageSquare,
  Send,
  MessageCircle,
  Shield,
  CalendarDays,
  Printer,
  TrendingUp,
  BarChart2,
  FileSpreadsheet
} from 'lucide-react';
import { 
  api, 
  downloadAttendanceReportPdf,
  AttendanceStatus, 
  StudentAttendanceRosterItem, 
  AttendanceClassSheet, 
  DailyAttendanceSummary, 
  AbsenteeStudent,
  SchoolSection,
  MonthlyAttendanceRegister,
  MonthlyAttendanceStudent,
  MonthlyAttendanceDay
} from '@/lib/api';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomDropdown from '@/components/CustomDropdown';

const CLASS_LIST = [
  'ECE/Nur',
  'Prep',
  'One (I)',
  'Two (II)',
  'Three (III)',
  'Four (IV)',
  'Five (V)',
  'Six (VI)',
  'Seven (VII)',
  'Eight (VIII)',
  'Nine (IX)',
];

const PRESET_FOLLOW_UP_REASONS = [
  'Sick / Illness',
  'Family Event',
  'Out of Station',
  'Medical Emergency',
  'Transport Issue',
  'Other Reason',
];

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function StudentAttendancePage() {
  const [activeTab, setActiveTab] = useState<'roll_call' | 'daily_monitor' | 'monthly_register'>('roll_call');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedSession, setSelectedSession] = useState<string>('2026-2027');
  const [sessions, setSessions] = useState<string[]>(['2026-2027']);

  // Roll Call State
  const [selectedClass, setSelectedClass] = useState<string>('ECE/Nur');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [classSheet, setClassSheet] = useState<AttendanceClassSheet | null>(null);
  const [roster, setRoster] = useState<StudentAttendanceRosterItem[]>([]);
  const [teacherName, setTeacherName] = useState<string>('');
  const [teachersList, setTeachersList] = useState<string[]>([]);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const teacherDropdownRef = useRef<HTMLDivElement>(null);

  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');

  // Monitor & Follow-up State
  const [dailySummary, setDailySummary] = useState<DailyAttendanceSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [absenteeSearch, setAbsenteeSearch] = useState('');
  const [absenteeFilterClass, setAbsenteeFilterClass] = useState<string>('all');
  const [followUpFilterStatus, setFollowUpFilterStatus] = useState<'all' | 'pending' | 'contacted' | 'unreachable'>('all');

  // Follow-up Modal State
  const [selectedAbsenteeForFollowUp, setSelectedAbsenteeForFollowUp] = useState<AbsenteeStudent | null>(null);
  const [followUpStatus, setFollowUpStatus] = useState<'pending' | 'contacted' | 'unreachable' | 'not_required'>('contacted');
  const [followUpReason, setFollowUpReason] = useState<string>('Sick / Illness');
  const [followUpNotes, setFollowUpNotes] = useState<string>('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

  // WhatsApp Broadcast State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<string>('');
  const [whatsAppPreview, setWhatsAppPreview] = useState<string>('');
  const [isBroadcastingWhatsApp, setIsBroadcastingWhatsApp] = useState(false);
  const [whatsAppBroadcastFeedback, setWhatsAppBroadcastFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [singleWhatsAppSendingId, setSingleWhatsAppSendingId] = useState<number | null>(null);

  // Monthly Register State
  const [monthlyMonth, setMonthlyMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthlyClass, setMonthlyClass] = useState<string>('ECE/Nur');
  const [monthlySection, setMonthlySection] = useState<string>('A');
  const [monthlyRegister, setMonthlyRegister] = useState<MonthlyAttendanceRegister | null>(null);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  const [monthlySearch, setMonthlySearch] = useState('');

  // Fullscreen Photo Lightbox
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{ url: string; name: string; fatherName?: string; regNo?: string } | null>(null);

  // Fetch available sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await api.get<string[]>('/students/sessions');
        if (Array.isArray(res) && res.length > 0) {
          setSessions(res);
          if (!res.includes(selectedSession)) {
            setSelectedSession(res[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load sessions:', err);
      }
    };
    loadSessions();
  }, []);

  // Fetch teachers list for dropdown
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const res = await api.get<string[]>('/student-attendances/teachers-list');
        if (Array.isArray(res)) {
          setTeachersList(res);
        }
      } catch (err) {
        console.error('Failed to load teachers list:', err);
      }
    };
    loadTeachers();
  }, []);

  // Close teacher dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(e.target as Node)) {
        setIsTeacherDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Class Sheet Roster
  const fetchClassSheet = useCallback(async () => {
    try {
      setIsLoadingSheet(true);
      setSubmitFeedback(null);
      const params = new URLSearchParams({
        date: selectedDate,
        session: selectedSession,
        class: selectedClass,
        section: selectedSection,
      });

      const res = await api.get<AttendanceClassSheet>(`/student-attendances/class-sheet?${params.toString()}`);
      setClassSheet(res);
      setRoster(res.roster || []);
      if (res.teacher_name) {
        setTeacherName(res.teacher_name);
      }
    } catch (err) {
      console.error('Failed to load class sheet:', err);
    } finally {
      setIsLoadingSheet(false);
    }
  }, [selectedDate, selectedSession, selectedClass, selectedSection]);

  // Fetch Daily Summary
  const fetchDailySummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      const params = new URLSearchParams({
        date: selectedDate,
        session: selectedSession,
      });

      const res = await api.get<DailyAttendanceSummary>(`/student-attendances/daily-summary?${params.toString()}`);
      setDailySummary(res);
    } catch (err) {
      console.error('Failed to load daily summary:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [selectedDate, selectedSession]);

  // Fetch Section-Wise Monthly Attendance Register
  const fetchMonthlyRegister = useCallback(async () => {
    try {
      setIsLoadingMonthly(true);
      const params = new URLSearchParams({
        month: monthlyMonth,
        session: selectedSession,
        class: monthlyClass,
        section: monthlySection,
      });

      const res = await api.get<MonthlyAttendanceRegister>(`/student-attendances/monthly-register?${params.toString()}`);
      setMonthlyRegister(res);
    } catch (err) {
      console.error('Failed to load monthly register:', err);
    } finally {
      setIsLoadingMonthly(false);
    }
  }, [monthlyMonth, selectedSession, monthlyClass, monthlySection]);

  const handlePrevMonth = () => {
    const [y, m] = monthlyMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setMonthlyMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [y, m] = monthlyMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    setMonthlyMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
  };

  useEffect(() => {
    if (activeTab === 'roll_call') {
      fetchClassSheet();
    } else if (activeTab === 'daily_monitor') {
      fetchDailySummary();
    } else if (activeTab === 'monthly_register') {
      fetchMonthlyRegister();
    }
  }, [activeTab, fetchClassSheet, fetchDailySummary, fetchMonthlyRegister]);

  // Toggle student status (Present <-> Absent on tap)
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadAttendanceReportPdf({
        date: selectedDate,
        session: selectedSession,
        class: selectedClass,
        section: selectedSection,
        fileName: `attendance_${selectedClass}_${selectedSection}_${selectedDate}.pdf`,
      });
    } catch (err: any) {
      alert(err.message || 'PDF generation failed.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const toggleStudentStatus = (studentId: number, newStatus?: AttendanceStatus) => {
    setRoster((prev) =>
      prev.map((item) => {
        if (item.id === studentId) {
          const next = newStatus || (item.attendance_status === 'present' ? 'absent' : 'present');
          return { ...item, attendance_status: next };
        }
        return item;
      })
    );
  };

  // Bulk mark all in active roster
  const setAllStatus = (status: AttendanceStatus) => {
    setRoster((prev) => prev.map((item) => ({ ...item, attendance_status: status })));
  };

  // Reset roster to initial database/default state
  const handleReset = () => {
    if (classSheet && classSheet.roster && classSheet.roster.length > 0) {
      setRoster(classSheet.roster);
    } else {
      setAllStatus('present');
    }
  };

  // Live Count Calculations
  const presentCount = roster.filter((r) => r.attendance_status === 'present').length;
  const absentCount = roster.filter((r) => r.attendance_status === 'absent').length;
  const lateCount = roster.filter((r) => r.attendance_status === 'late').length;
  const leaveCount = roster.filter((r) => r.attendance_status === 'leave').length;

  // Submit Single Class Attendance
  const handleSubmitClassAttendance = async () => {
    if (roster.length === 0) return;

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const payload = {
        date: selectedDate,
        session: selectedSession,
        class: selectedClass,
        section: selectedSection,
        teacher_name: teacherName.trim() || null,
        attendances: roster.map((item) => ({
          student_id: item.id,
          status: item.attendance_status,
          remarks: item.remarks || '',
        })),
      };

      const res: any = await api.post('/student-attendances/submit-class', payload);

      setSubmitFeedback({
        type: 'success',
        message: res.message || `Attendance for ${selectedClass} (${selectedSection}) saved successfully!`,
      });

      // Refresh sheet to sync marked state
      await fetchClassSheet();
    } catch (err: any) {
      setSubmitFeedback({
        type: 'error',
        message: err.message || 'Failed to submit class attendance.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open follow-up modal for an absent student
  const handleOpenFollowUp = (absentee: AbsenteeStudent) => {
    setSelectedAbsenteeForFollowUp(absentee);
    setFollowUpStatus(
      absentee.follow_up_status && absentee.follow_up_status !== 'pending'
        ? absentee.follow_up_status
        : 'contacted'
    );
    setFollowUpReason(absentee.follow_up_reason || 'Sick / Illness');
    setFollowUpNotes(absentee.follow_up_notes || '');
  };

  // Save follow-up discussion & update local state
  const handleSaveFollowUp = async () => {
    if (!selectedAbsenteeForFollowUp) return;
    setIsSavingFollowUp(true);
    try {
      const res: any = await api.post(`/student-attendances/${selectedAbsenteeForFollowUp.id}/follow-up`, {
        follow_up_status: followUpStatus,
        follow_up_reason: followUpStatus === 'contacted' ? followUpReason : null,
        follow_up_notes: followUpNotes.trim() || null,
      });

      if (dailySummary) {
        const updatedAbsentees = dailySummary.absentees.map((a) => {
          if (a.id === selectedAbsenteeForFollowUp.id) {
            return {
              ...a,
              follow_up_status: followUpStatus,
              follow_up_reason: followUpStatus === 'contacted' ? followUpReason : null,
              follow_up_notes: followUpNotes.trim() || null,
              followed_up_by_name: res.data?.followed_up_by_name || 'Staff',
              followed_up_at: res.data?.followed_up_at || 'Just now',
            };
          }
          return a;
        });

        const contacted = updatedAbsentees.filter((a) => a.follow_up_status === 'contacted').length;
        const unreachable = updatedAbsentees.filter((a) => a.follow_up_status === 'unreachable').length;
        const pending = updatedAbsentees.filter((a) => !a.follow_up_status || a.follow_up_status === 'pending').length;

        setDailySummary({
          ...dailySummary,
          absentees: updatedAbsentees,
          follow_up_summary: {
            total_absent: updatedAbsentees.length,
            contacted,
            pending,
            unreachable,
          },
        });
      }

      setSelectedAbsenteeForFollowUp(null);
    } catch (err: any) {
      console.error('Failed to save follow-up:', err);
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  // Open WhatsApp Broadcast Modal & fetch template
  const handleOpenWhatsAppModal = async () => {
    setIsWhatsAppModalOpen(true);
    setWhatsAppBroadcastFeedback(null);
    try {
      const res: any = await api.get(`/student-attendances/whatsapp-template?date=${selectedDate}&session=${selectedSession}`);
      if (res.default_template) {
        setWhatsAppTemplate(res.default_template);
        setWhatsAppPreview(res.preview || '');
      }
    } catch (err) {
      console.error('Failed to load WhatsApp template:', err);
    }
  };

  // Broadcast WhatsApp to all absentees with anti-ban background job
  const handleBroadcastWhatsApp = async () => {
    setIsBroadcastingWhatsApp(true);
    setWhatsAppBroadcastFeedback(null);
    try {
      const payload = {
        date: selectedDate,
        session: selectedSession,
        class: absenteeFilterClass,
        custom_template: whatsAppTemplate.trim() || undefined,
      };

      const res: any = await api.post('/student-attendances/broadcast-whatsapp', payload);

      setWhatsAppBroadcastFeedback({
        type: 'success',
        message: res.message || 'WhatsApp messages queued successfully in background!',
      });

      // Update local absentees state to show 'queued'
      if (dailySummary) {
        const updatedAbsentees = dailySummary.absentees.map((a) => {
          if (absenteeFilterClass === 'all' || a.class?.toLowerCase() === absenteeFilterClass.toLowerCase()) {
            if (a.mobile_no && (!a.whatsapp_status || a.whatsapp_status === 'pending')) {
              return { ...a, whatsapp_status: 'queued' as const };
            }
          }
          return a;
        });

        setDailySummary({
          ...dailySummary,
          absentees: updatedAbsentees,
        });
      }

      setTimeout(() => {
        setIsWhatsAppModalOpen(false);
      }, 2500);
    } catch (err: any) {
      setWhatsAppBroadcastFeedback({
        type: 'error',
        message: err.message || 'Failed to queue WhatsApp messages.',
      });
    } finally {
      setIsBroadcastingWhatsApp(false);
    }
  };

  // Send instant 1-on-1 WhatsApp alert to a single absentee
  const handleSendSingleWhatsApp = async (absentee: AbsenteeStudent) => {
    if (!absentee.mobile_no) return;
    setSingleWhatsAppSendingId(absentee.id);
    try {
      const res: any = await api.post(`/student-attendances/${absentee.id}/send-whatsapp`, {});

      if (dailySummary) {
        const updatedAbsentees = dailySummary.absentees.map((a) => {
          if (a.id === absentee.id) {
            return {
              ...a,
              whatsapp_status: 'sent' as const,
              whatsapp_msg_id: res.whatsapp_msg_id || '3EB...',
              whatsapp_sent_at: 'Just now',
              whatsapp_error: null,
            };
          }
          return a;
        });

        setDailySummary({
          ...dailySummary,
          absentees: updatedAbsentees,
        });
      }
    } catch (err: any) {
      console.error('Failed to send individual WhatsApp:', err);
    } finally {
      setSingleWhatsAppSendingId(null);
    }
  };

  // Switch to next section/class
  const handleGoToNextClass = () => {
    const currentClassIdx = CLASS_LIST.indexOf(selectedClass);
    if (currentClassIdx >= 0 && currentClassIdx < CLASS_LIST.length - 1) {
      setSelectedClass(CLASS_LIST[currentClassIdx + 1]);
      setSelectedSection('A');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-[#0B462C]" />
            Student Attendance Desk
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 font-medium">
            Daily roll-call & classroom attendance synchronization.
          </p>
        </div>

        {/* Global Selectors: Date & Session + PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Download Branded PDF Report */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="bg-[#0B462C] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[#0a3b25] flex items-center gap-2 shrink-0 disabled:opacity-50"
            title="Download branded PDF report for this class & date"
          >
            {downloadingPdf ? 'GENERATING…' : '⬇ Download PDF'}
          </button>

          {/* Custom Date Picker */}
          <div className="w-48 sm:w-52 shrink-0">
            <CustomDatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val || getTodayDateString())}
              allowClear={false}
              placeholder="Select Date"
            />
          </div>

          {/* Session Selector via CustomDropdown */}
          <div className="w-52 sm:w-60 shrink-0">
            <CustomDropdown
              value={selectedSession}
              onChange={setSelectedSession}
              options={sessions.map((s) => ({
                value: s,
                label: `Session: ${s}${s === '2026-2027' ? ' (Active)' : ''}`,
              }))}
              placeholder="Select Session"
            />
          </div>
        </div>
      </div>

      {/* Main View Mode Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('roll_call')}
          className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'roll_call'
              ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>⚡ Roll Call</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('daily_monitor')}
          className={`flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'daily_monitor'
              ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>📊 Daily Monitor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monthly_register')}
          className={`flex-1 min-w-[150px] py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'monthly_register'
              ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>📅 Monthly Register</span>
        </button>
      </div>

      {/* TAB 1: CLASSROOM ROLL CALL */}
      {activeTab === 'roll_call' && (
        <div className="space-y-5">
          {/* Class & Section Control Strip */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            {/* Class Switcher Tabs */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#0B462C]" />
                  Select Class:
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {roster.length} students enrolled in {selectedClass} ({selectedSection})
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CLASS_LIST.map((cls) => {
                  const isSelected = selectedClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        setSelectedSection('A');
                      }}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm scale-[1.02]'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60'
                      }`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section & Teacher on Duty Controls */}
            <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Section Selector with Visual Progress */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Section:
                </span>

                {(classProgressOrFallback(classSheet)).map((sec) => {
                  const isSelected = selectedSection === sec.section;
                  return (
                    <button
                      key={sec.section}
                      type="button"
                      onClick={() => setSelectedSection(sec.section)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-[#0B462C] text-white shadow-xs'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70'
                      }`}
                    >
                      <span>Sec {sec.section}</span>
                      {sec.is_marked ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          {sec.present}/{sec.total}
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200 text-gray-600 font-normal">
                          {sec.total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Teacher Present in Room Selector */}
              <div className="flex items-center gap-2 shrink-0 relative" ref={teacherDropdownRef}>
                <span className="text-xs font-bold text-gray-500">Teacher in Room:</span>

                <div className="relative">
                  <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus-within:border-[#0B462C] focus-within:bg-white">
                    <input
                      type="text"
                      placeholder="e.g. Madam Ayesha"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="bg-transparent outline-none w-36 sm:w-44 text-xs font-bold text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setIsTeacherDropdownOpen((prev) => !prev)}
                      className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                      title="Select teacher"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isTeacherDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-40 max-h-48 overflow-y-auto animate-fadeIn">
                      <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                        Select Teacher:
                      </div>
                      {teachersList.map((tName) => (
                        <button
                          key={tName}
                          type="button"
                          onClick={() => {
                            setTeacherName(tName);
                            setIsTeacherDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-[#0B462C]/10 hover:text-[#0B462C] transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span>{tName}</span>
                          {teacherName === tName && <Check className="w-3.5 h-3.5 text-[#0B462C]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Status Notice / Toast */}
          {submitFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn ${
                submitFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {submitFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <span>{submitFeedback.message}</span>
              </div>

              {submitFeedback.type === 'success' && (
                <button
                  type="button"
                  onClick={handleGoToNextClass}
                  className="px-3 py-1.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-xs font-black flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  <span>Next Class</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Live Counters & Quick Roster Actions Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            {/* Live Count Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {presentCount} Present
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                {absentCount} Absent
              </span>

              {lateCount > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  {lateCount} Late
                </span>
              )}

              {leaveCount > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold">
                  {leaveCount} Leave
                </span>
              )}

              <span className="text-xs text-gray-400 font-medium ml-1">
                ({roster.length} Total in Class)
              </span>
            </div>

            {/* Quick All Actions & Prominent Save Button */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* In-class fast student search */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Find student..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B462C] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setAllStatus('present')}
                className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border border-gray-200 text-xs font-bold transition-colors cursor-pointer"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => setAllStatus('absent')}
                className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-700 hover:text-rose-800 border border-gray-200 text-xs font-bold transition-colors cursor-pointer"
              >
                All Absent
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-800 border border-gray-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Reset to initial state"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || roster.length === 0}
                onClick={handleSubmitClassAttendance}
                className="px-5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] font-black text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 transition-all cursor-pointer shrink-0 ml-1"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#C5A059] stroke-[3]" />
                    <span>Save & Submit Class</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Student Roster Cards Grid */}
          {isLoadingSheet ? (
            <div className="p-16 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center gap-4">
              <div className="relative w-[68px] h-[68px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#0B462C]/15 border-t-[#0B462C] border-r-[#C5A059] animate-spin" />
                <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-center">
                  <Image src="/logo.png" alt="NSSE Logo" width={50} height={50} unoptimized priority className="object-contain" />
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500">Loading class roster...</span>
            </div>
          ) : roster.length === 0 ? (
            <div className="p-16 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-3">
              <GraduationCap className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="text-base font-bold text-gray-800">No students enrolled in this section</h3>
              <p className="text-xs text-gray-500">
                Please select another class or upload students in the Students Directory.
              </p>
            </div>
          ) : (() => {
            const visibleRoster = roster.filter((student) => {
              if (!rosterSearch.trim()) return true;
              const q = rosterSearch.toLowerCase();
              return (
                student.student_name.toLowerCase().includes(q) ||
                (student.father_name && student.father_name.toLowerCase().includes(q)) ||
                (student.registration_no && student.registration_no.toLowerCase().includes(q))
              );
            });

            if (visibleRoster.length === 0) {
              return (
                <div className="p-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-3">
                  <Search className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-700">No students match &ldquo;{rosterSearch}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => setRosterSearch('')}
                    className="px-3 py-1.5 rounded-xl bg-[#0B462C]/10 text-[#0B462C] font-black text-xs hover:bg-[#0B462C]/20 transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {visibleRoster.map((student, idx) => {
                  const status = student.attendance_status;
                  const isAbsent = status === 'absent';
                const isPresent = status === 'present';
                const isLate = status === 'late';
                const isLeave = status === 'leave';

                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudentStatus(student.id)}
                    className={`rounded-3xl p-4 border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                      isAbsent
                        ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/30 shadow-sm'
                        : isPresent
                        ? 'bg-white border-gray-100 hover:border-[#0B462C]/30 shadow-xs'
                        : isLate
                        ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30 shadow-sm'
                        : 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400/30 shadow-sm'
                    }`}
                  >
                    {/* Card Top: Avatar & Meta */}
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        onClick={(e) => {
                          if (student.photo_url) {
                            e.stopPropagation();
                            setFullscreenPhoto({
                              url: student.photo_url,
                              name: student.student_name,
                              fatherName: student.father_name || '',
                              regNo: student.registration_no,
                            });
                          }
                        }}
                        className={`relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-xs ${
                          student.photo_url ? 'cursor-zoom-in hover:border-[#0B462C]' : ''
                        }`}
                        title={student.photo_url ? 'Tap to view full screen' : ''}
                      >
                        {student.photo_url ? (
                          <Image
                            src={student.photo_url}
                            alt={student.student_name}
                            fill
                            unoptimized
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#0B462C]/10 text-[#0B462C] font-black text-xs">
                            {student.student_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono text-gray-400">
                            #{idx + 1}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isAbsent
                                ? 'bg-rose-500 text-white'
                                : isPresent
                                ? 'bg-emerald-100 text-emerald-900'
                                : isLate
                                ? 'bg-amber-500 text-white'
                                : 'bg-sky-500 text-white'
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-gray-900 truncate mt-0.5">
                          {student.student_name}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          s/o {student.father_name || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Card Bottom: Quick 4-Way Status Bar */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 pt-2.5 border-t border-gray-100/80 grid grid-cols-4 gap-1"
                    >
                      <button
                        type="button"
                        onClick={() => toggleStudentStatus(student.id, 'present')}
                        className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                      >
                        P
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStudentStatus(student.id, 'absent')}
                        className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          isAbsent
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-700'
                        }`}
                      >
                        A
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStudentStatus(student.id, 'late')}
                        className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          isLate
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                        }`}
                      >
                        L
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleStudentStatus(student.id, 'leave')}
                        className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                          isLeave
                            ? 'bg-sky-500 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-sky-50 hover:text-sky-700'
                        }`}
                      >
                        Lv
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: DAILY MONITOR & ABSENTEES */}
      {activeTab === 'daily_monitor' && (
        <div className="space-y-6 animate-fadeIn">
          {isLoadingSummary ? (
            <div className="p-16 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center gap-4">
              <div className="relative w-[68px] h-[68px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#0B462C]/15 border-t-[#0B462C] border-r-[#C5A059] animate-spin" />
                <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-center">
                  <Image src="/logo.png" alt="NSSE Logo" width={50} height={50} unoptimized priority className="object-contain" />
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500">Generating daily summary...</span>
            </div>
          ) : (
            <>
              {/* Stat Cards Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs">
                  <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">
                    School Attendance
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-[#0B462C] mt-1 block">
                    {dailySummary?.attendance_rate || 0}%
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5 block">
                    {dailySummary?.total_marked || 0} of {dailySummary?.total_enrolled || 0} marked
                  </span>
                </div>

                <div className="bg-emerald-50/60 p-5 rounded-3xl border border-emerald-100 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-800 block uppercase tracking-wider">
                    Total Present
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">
                    {dailySummary?.present || 0}
                  </span>
                  <span className="text-[11px] text-emerald-600 mt-0.5 block">In Attendance</span>
                </div>

                <div className="bg-rose-50/60 p-5 rounded-3xl border border-rose-100 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-800 block uppercase tracking-wider">
                    Total Absent
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-rose-700 mt-1 block">
                    {dailySummary?.absent || 0}
                  </span>
                  <span className="text-[11px] text-rose-600 mt-0.5 block">Not in School</span>
                </div>

                <div className="bg-amber-50/60 p-5 rounded-3xl border border-amber-100 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-800 block uppercase tracking-wider">
                    Late / Leave
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-700 mt-1 block">
                    {(dailySummary?.late || 0) + (dailySummary?.leave || 0)}
                  </span>
                  <span className="text-[11px] text-amber-600 mt-0.5 block">Excused & Late</span>
                </div>
              </div>

              {/* Today's Absentees Roster & Parent Calling List with Follow-up Process */}
              {(() => {
                const allAbs = dailySummary?.absentees || [];
                const totalAbsent = allAbs.length;
                const contactedCount = allAbs.filter((a) => a.follow_up_status === 'contacted').length;
                const unreachableCount = allAbs.filter((a) => a.follow_up_status === 'unreachable').length;
                const pendingCount = allAbs.filter((a) => !a.follow_up_status || a.follow_up_status === 'pending').length;
                const progressPct = totalAbsent > 0 ? Math.round((contactedCount / totalAbsent) * 100) : 0;

                const filteredAbsentees = allAbs.filter((abs) => {
                  if (absenteeFilterClass !== 'all' && abs.class?.toLowerCase() !== absenteeFilterClass.toLowerCase()) {
                    return false;
                  }
                  if (followUpFilterStatus === 'contacted' && abs.follow_up_status !== 'contacted') {
                    return false;
                  }
                  if (followUpFilterStatus === 'unreachable' && abs.follow_up_status !== 'unreachable') {
                    return false;
                  }
                  if (followUpFilterStatus === 'pending' && abs.follow_up_status && abs.follow_up_status !== 'pending') {
                    return false;
                  }
                  if (!absenteeSearch.trim()) return true;
                  const q = absenteeSearch.toLowerCase();
                  return (
                    abs.student_name.toLowerCase().includes(q) ||
                    (abs.father_name && abs.father_name.toLowerCase().includes(q)) ||
                    abs.class.toLowerCase().includes(q) ||
                    (abs.mobile_no && abs.mobile_no.includes(q)) ||
                    (abs.registration_no && abs.registration_no.toLowerCase().includes(q)) ||
                    (abs.follow_up_reason && abs.follow_up_reason.toLowerCase().includes(q)) ||
                    (abs.follow_up_notes && abs.follow_up_notes.toLowerCase().includes(q))
                  );
                });

                const classFilterOptions = [
                  { value: 'all', label: 'All Classes' },
                  ...CLASS_LIST.map((cls) => ({ value: cls, label: cls })),
                ];

                return (
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-5">
                    {/* Header & Filter Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                          <UserX className="w-4 h-4 text-rose-600" />
                          Today's Absent Students ({filteredAbsentees.length}{totalAbsent !== filteredAbsentees.length ? ` of ${totalAbsent}` : ''})
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                          Direct parent calling, inquiry & WhatsApp notification directory.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                        {/* Send WhatsApp Alerts Button */}
                        {totalAbsent > 0 && (
                          <button
                            type="button"
                            onClick={handleOpenWhatsAppModal}
                            className="px-3.5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-xs font-black flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                            title="Broadcast WhatsApp alerts to absent students"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span>Send WhatsApp Alerts</span>
                          </button>
                        )}

                        {/* Class Filter Dropdown */}
                        <div className="w-44 sm:w-48 shrink-0">
                          <CustomDropdown
                            value={absenteeFilterClass}
                            onChange={setAbsenteeFilterClass}
                            options={classFilterOptions}
                            placeholder="Filter by Class"
                          />
                        </div>

                        {/* Search filter for absentees */}
                        <div className="relative w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search absentee..."
                            value={absenteeSearch}
                            onChange={(e) => setAbsenteeSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B462C] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Follow-up Progress & Status Filter Strip */}
                    {totalAbsent > 0 && (
                      <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Progress Meter */}
                        <div className="space-y-1.5 min-w-[220px]">
                          <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-gray-700 flex items-center gap-1.5">
                              <PhoneCall className="w-3.5 h-3.5 text-[#0B462C]" />
                              Follow-up Progress:
                            </span>
                            <span className="text-[#0B462C]">
                              {contactedCount} of {totalAbsent} Contacted ({progressPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#0B462C] to-emerald-500 transition-all duration-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Follow-up Status Filters */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setFollowUpFilterStatus('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              followUpFilterStatus === 'all'
                                ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                            }`}
                          >
                            All ({totalAbsent})
                          </button>

                          <button
                            type="button"
                            onClick={() => setFollowUpFilterStatus('pending')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              followUpFilterStatus === 'pending'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200/80'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Pending ({pendingCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFollowUpFilterStatus('contacted')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              followUpFilterStatus === 'contacted'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200/80'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Contacted ({contactedCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFollowUpFilterStatus('unreachable')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              followUpFilterStatus === 'unreachable'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200/80'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Unreachable ({unreachableCount})</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {totalAbsent === 0 ? (
                      <div className="p-8 text-center text-xs text-emerald-700 font-bold bg-emerald-50/50 rounded-2xl border border-emerald-100">
                        🎉 100% Attendance or No Absentees Reported Yet Today!
                      </div>
                    ) : filteredAbsentees.length === 0 ? (
                      <div className="p-8 text-center text-xs text-gray-500 space-y-2 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
                        <p className="font-semibold">No absent students match the selected class, follow-up, or search filter.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setAbsenteeFilterClass('all');
                            setFollowUpFilterStatus('all');
                            setAbsenteeSearch('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#0B462C]/10 text-[#0B462C] font-black text-xs hover:bg-[#0B462C]/20 transition-colors cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredAbsentees.map((abs) => {
                          const isContacted = abs.follow_up_status === 'contacted';
                          const isUnreachable = abs.follow_up_status === 'unreachable';
                          const isPending = !abs.follow_up_status || abs.follow_up_status === 'pending';

                          return (
                            <div
                              key={abs.id}
                              className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5 hover:bg-gray-50/60 p-2 rounded-2xl transition-colors"
                            >
                              {/* Left: Avatar + Details + Follow-up Log */}
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div
                                  onClick={() => {
                                    if (abs.photo_url) {
                                      setFullscreenPhoto({
                                        url: abs.photo_url,
                                        name: abs.student_name,
                                        fatherName: abs.father_name || '',
                                        regNo: abs.registration_no,
                                      });
                                    }
                                  }}
                                  className={`relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-xs ${
                                    abs.photo_url ? 'cursor-zoom-in hover:border-[#0B462C]' : ''
                                  }`}
                                >
                                  {abs.photo_url ? (
                                    <Image src={abs.photo_url} alt={abs.student_name} fill unoptimized sizes="48px" className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-rose-100 text-rose-800 font-bold text-xs">
                                      {abs.student_name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-black text-gray-900 truncate">
                                      {abs.student_name}
                                    </h4>

                                    {/* Follow-up Status Badge */}
                                    {isContacted ? (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                                        <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                        <span>Spoke with Parent{abs.follow_up_reason ? ` • ${abs.follow_up_reason}` : ''}</span>
                                      </span>
                                    ) : isUnreachable ? (
                                      <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black flex items-center gap-1">
                                        <PhoneOff className="w-3 h-3 text-rose-600" />
                                        <span>Unreachable / No Answer</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>Call Pending</span>
                                      </span>
                                    )}

                                    {/* WhatsApp Delivery Status Badge */}
                                    {abs.whatsapp_status === 'sent' ? (
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                                        <span>WhatsApp Sent{abs.whatsapp_sent_at ? ` at ${abs.whatsapp_sent_at}` : ''}</span>
                                      </span>
                                    ) : abs.whatsapp_status === 'queued' ? (
                                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                        <Clock className="w-3 h-3 text-sky-600" />
                                        <span>WhatsApp Queued</span>
                                      </span>
                                    ) : abs.whatsapp_status === 'failed' ? (
                                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold flex items-center gap-1" title={abs.whatsapp_error || 'Delivery failed'}>
                                        <AlertCircle className="w-3 h-3 text-rose-600" />
                                        <span>WhatsApp Failed</span>
                                      </span>
                                    ) : null}
                                  </div>

                                  <p className="text-[11px] text-gray-500 font-medium">
                                    s/o {abs.father_name || '—'} • <span className="font-bold text-gray-700">{abs.class} (Sec {abs.section})</span> • Reg #{abs.registration_no}
                                  </p>

                                  {/* Discussion Notes Snippet */}
                                  {abs.follow_up_notes && (
                                    <div className="mt-1.5 p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-gray-700 flex items-start gap-2">
                                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                      <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-emerald-950">
                                          &ldquo;{abs.follow_up_notes}&rdquo;
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                          Logged by {abs.followed_up_by_name || 'Staff'}{abs.followed_up_at ? ` at ${abs.followed_up_at}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Right: Actions (Call Parent, 1-Click WhatsApp & Follow-up Log Button) */}
                              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                {abs.mobile_no ? (
                                  <a
                                    href={`tel:${abs.mobile_no}`}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Call parent"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{abs.mobile_no}</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-gray-400 px-2 py-1 bg-gray-50 rounded-xl border border-gray-100">
                                    No phone
                                  </span>
                                )}

                                {/* Individual WhatsApp Alert Action */}
                                {abs.mobile_no && (
                                  <button
                                    type="button"
                                    disabled={singleWhatsAppSendingId === abs.id}
                                    onClick={() => handleSendSingleWhatsApp(abs)}
                                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                      abs.whatsapp_status === 'sent'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-white text-gray-700 border-gray-200 hover:bg-[#0B462C]/10 hover:text-[#0B462C]'
                                    }`}
                                    title="Send instant WhatsApp alert to this parent"
                                  >
                                    {singleWhatsAppSendingId === abs.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0B462C]" />
                                    ) : (
                                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                                    )}
                                    <span className="hidden sm:inline">WhatsApp</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleOpenFollowUp(abs)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                                    isContacted
                                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'
                                      : isUnreachable
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2]'
                                  }`}
                                >
                                  {isContacted ? (
                                    <>
                                      <MessageSquare className="w-3 h-3 text-gray-600" />
                                      <span>Edit Note</span>
                                    </>
                                  ) : isUnreachable ? (
                                    <>
                                      <PhoneOff className="w-3 h-3 text-rose-600" />
                                      <span>Retry Call</span>
                                    </>
                                  ) : (
                                    <>
                                      <PhoneCall className="w-3 h-3 text-[#C5A059]" />
                                      <span>Log Call</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* TAB 3: SECTION-WISE MONTHLY ATTENDANCE REGISTER */}
      {activeTab === 'monthly_register' && (
        <div className="space-y-6">
          {/* Header Controls & Filter Strip */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            {/* Top Bar: Month Navigator, Search, Print Button */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-gray-100">
              {/* Month Navigator */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative">
                  <input
                    type="month"
                    value={monthlyMonth}
                    onChange={(e) => e.target.value && setMonthlyMonth(e.target.value)}
                    className="px-3.5 py-2 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs font-black text-[#0B462C] outline-none focus:ring-2 focus:ring-[#0B462C]/20 cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {monthlyRegister?.month_name && (
                  <span className="text-sm font-black text-gray-900 ml-1">
                    {monthlyRegister.month_name}
                  </span>
                )}
              </div>

              {/* Actions & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search in Register */}
                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={monthlySearch}
                    onChange={(e) => setMonthlySearch(e.target.value)}
                    placeholder="Filter student / roll #..."
                    className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
                  />
                  {monthlySearch && (
                    <button
                      onClick={() => setMonthlySearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Print Register Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Print Section Register"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-600" />
                  <span className="hidden sm:inline">Print Register</span>
                </button>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={fetchMonthlyRegister}
                  disabled={isLoadingMonthly}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors cursor-pointer"
                  title="Refresh Register"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMonthly ? 'animate-spin text-[#0B462C]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Class Selector Tabs */}
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-2">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#0B462C]" />
                  1. Select Class:
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {monthlyRegister?.students?.length || 0} students enrolled in {monthlyClass} ({monthlySection})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CLASS_LIST.map((cls) => {
                  const isSelected = monthlyClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setMonthlyClass(cls);
                        setMonthlySection('A');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/70'
                      }`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Selector Pills */}
            <div>
              <div className="flex items-center justify-between pb-1.5 mb-2">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#0B462C]" />
                  2. Select Section:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['A', 'B', 'C', 'D', 'E'].map((sec) => {
                  const isSelected = monthlySection === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setMonthlySection(sec)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/80'
                      }`}
                    >
                      <span>Section {sec}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingMonthly ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-[#0B462C]" />
              <div className="text-sm font-bold text-gray-800">
                Generating Section Monthly Register...
              </div>
              <p className="text-xs text-gray-400">
                Loading all calendar days and attendance records for {monthlyClass} (Section {monthlySection}).
              </p>
            </div>
          ) : !monthlyRegister || monthlyRegister.students.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <Users className="w-10 h-10 text-gray-300" />
              <div className="text-base font-black text-gray-800">
                No students found for {monthlyClass} (Section {monthlySection})
              </div>
              <p className="text-xs text-gray-400 max-w-md">
                No enrolled students found in this section for session {selectedSession}. Select another class or section above.
              </p>
            </div>
          ) : (
            <>
              {/* Executive Monthly Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Enrolled</div>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    {monthlyRegister.summary.total_students}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 font-medium">Students in Section</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Working Days</div>
                  <div className="text-xl font-black text-[#0B462C] mt-1">
                    {monthlyRegister.working_days}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 font-medium">Recorded (excl. Sundays)</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Avg Attendance</div>
                  <div className="text-xl font-black text-emerald-600 mt-1 flex items-center gap-1">
                    <span>{monthlyRegister.summary.avg_attendance_rate}%</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5 font-medium">Section Monthly Rate</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-emerald-100/60 shadow-xs bg-emerald-50/20">
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Present (P)</div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {monthlyRegister.summary.total_present_instances}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Total Present Days</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-rose-100/60 shadow-xs bg-rose-50/20">
                  <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Absent (A)</div>
                  <div className="text-xl font-black text-rose-700 mt-1">
                    {monthlyRegister.summary.total_absent_instances}
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5 font-medium">Total Absences</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-sky-100/60 shadow-xs bg-sky-50/20">
                  <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Total Leave (Lv)</div>
                  <div className="text-xl font-black text-sky-700 mt-1">
                    {monthlyRegister.summary.total_leave_instances}
                  </div>
                  <div className="text-[10px] text-sky-600 mt-0.5 font-medium">Approved Leaves</div>
                </div>
              </div>

              {/* Monthly Register Matrix Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header banner */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/40">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#0B462C]" />
                      <span>{monthlyRegister.class} (Section {monthlyRegister.section}) — {monthlyRegister.month_name} Register</span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      Showing complete monthly attendance ledger with day-by-day status breakdown.
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      P = Present
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      A = Absent
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                      L = Late
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-200">
                      Lv = Leave
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                      Sun = Sunday
                    </span>
                  </div>
                </div>

                {/* Table Container with Horizontal Scroll */}
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold">
                        {/* Sticky Left Headers */}
                        <th className="sticky left-0 z-20 bg-gray-50 px-3 py-3 w-12 text-center border-r border-gray-200">
                          #
                        </th>
                        <th className="sticky left-12 z-20 bg-gray-50 px-4 py-3 min-w-[200px] border-r border-gray-200">
                          Student Information
                        </th>

                        {/* Day Columns (01..31) */}
                        {monthlyRegister.days.map((d) => (
                          <th
                            key={d.date}
                            className={`px-1 py-2 text-center border-r border-gray-100 min-w-[32px] ${
                              d.is_sunday
                                ? 'bg-slate-100 text-slate-500'
                                : d.is_today
                                ? 'bg-emerald-100/70 text-[#0B462C]'
                                : 'text-gray-700'
                            }`}
                          >
                            <div className="text-[11px] font-black">{String(d.day).padStart(2, '0')}</div>
                            <div className="text-[9px] uppercase font-semibold text-gray-400">
                              {d.day_name.slice(0, 2)}
                            </div>
                          </th>
                        ))}

                        {/* Sticky Right Summary Headers */}
                        <th className="sticky right-36 z-20 bg-emerald-50/80 px-2 py-3 text-center border-l border-emerald-100 text-emerald-900 font-black min-w-[36px]" title="Total Present">
                          P
                        </th>
                        <th className="sticky right-27 z-20 bg-rose-50/80 px-2 py-3 text-center border-r border-rose-100 text-rose-900 font-black min-w-[36px]" title="Total Absent">
                          A
                        </th>
                        <th className="sticky right-18 z-20 bg-sky-50/80 px-2 py-3 text-center border-r border-sky-100 text-sky-900 font-black min-w-[36px]" title="Total Leave">
                          Lv
                        </th>
                        <th className="sticky right-9 z-20 bg-amber-50/80 px-2 py-3 text-center border-r border-amber-100 text-amber-900 font-black min-w-[36px]" title="Total Late">
                          L
                        </th>
                        <th className="sticky right-0 z-20 bg-gray-100 px-3 py-3 text-center border-l border-gray-200 text-gray-900 font-black min-w-[64px]" title="Attendance Rate %">
                          %
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const filtered = monthlyRegister.students.filter((st) => {
                          if (!monthlySearch) return true;
                          const q = monthlySearch.toLowerCase();
                          return (
                            st.student_name.toLowerCase().includes(q) ||
                            st.father_name?.toLowerCase().includes(q) ||
                            st.registration_no?.toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={monthlyRegister.days.length + 7} className="py-12 text-center text-gray-400">
                                No students match "{monthlySearch}".
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((student, idx) => {
                          const attPct = student.attendance_percentage;
                          const pctColor =
                            attPct >= 90
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : attPct >= 75
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200';

                          return (
                            <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                              {/* Sticky Roll / Sr # */}
                              <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-2.5 text-center font-mono text-[11px] font-bold text-gray-400 border-r border-gray-100">
                                {idx + 1}
                              </td>

                              {/* Sticky Student Profile */}
                              <td className="sticky left-12 z-10 bg-white group-hover:bg-gray-50 px-4 py-2.5 border-r border-gray-100">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    onClick={() =>
                                      student.photo_url &&
                                      setFullscreenPhoto({
                                        url: student.photo_url,
                                        name: student.student_name,
                                        fatherName: student.father_name || undefined,
                                        regNo: student.registration_no,
                                      })
                                    }
                                    className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 cursor-pointer"
                                  >
                                    {student.photo_url ? (
                                      <Image
                                        src={student.photo_url}
                                        alt={student.student_name}
                                        fill
                                        unoptimized
                                        sizes="32px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-[#0B462C]/10 text-[#0B462C] font-black text-[10px]">
                                        {student.student_name.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="font-black text-gray-900 truncate max-w-[140px] text-xs">
                                      {student.student_name}
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-medium truncate max-w-[140px]">
                                      {student.father_name ? `s/o ${student.father_name}` : `Reg #${student.registration_no}`}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Days Matrix Cells */}
                              {monthlyRegister.days.map((d) => {
                                const dayRecord = student.days[d.date];
                                const status = dayRecord?.status || 'future';

                                return (
                                  <td
                                    key={d.date}
                                    title={`${student.student_name} on ${d.date}: ${status.toUpperCase()}${
                                      dayRecord?.remarks ? ` (${dayRecord.remarks})` : ''
                                    }`}
                                    className={`px-0.5 py-2 text-center border-r border-gray-100 text-[11px] ${
                                      d.is_sunday
                                        ? 'bg-slate-50/80 text-slate-400'
                                        : d.is_today
                                        ? 'bg-emerald-50/30'
                                        : ''
                                    }`}
                                  >
                                    {status === 'present' ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-800 font-black text-[11px] border border-emerald-200/90 shadow-2xs">
                                        P
                                      </span>
                                    ) : status === 'absent' ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-100 text-rose-800 font-black text-[11px] border border-rose-200 shadow-2xs">
                                        A
                                      </span>
                                    ) : status === 'late' ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200 shadow-2xs">
                                        L
                                      </span>
                                    ) : status === 'leave' ? (
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-sky-100 text-sky-900 font-bold text-[11px] border border-sky-200 shadow-2xs">
                                        Lv
                                      </span>
                                    ) : status === 'sunday' ? (
                                      <span className="text-[10px] text-gray-400 font-medium">Sun</span>
                                    ) : status === 'unmarked' ? (
                                      <span className="text-gray-300 font-bold">-</span>
                                    ) : (
                                      <span className="text-gray-200">—</span>
                                    )}
                                  </td>
                                );
                              })}

                              {/* Sticky Right Summary Counters */}
                              <td className="sticky right-36 z-10 bg-emerald-50/50 px-2 py-2.5 text-center font-black text-emerald-800 border-l border-emerald-100 text-xs">
                                {student.present_count}
                              </td>
                              <td className="sticky right-27 z-10 bg-rose-50/50 px-2 py-2.5 text-center font-black text-rose-800 border-r border-rose-100 text-xs">
                                {student.absent_count}
                              </td>
                              <td className="sticky right-18 z-10 bg-sky-50/50 px-2 py-2.5 text-center font-black text-sky-800 border-r border-sky-100 text-xs">
                                {student.leave_count}
                              </td>
                              <td className="sticky right-9 z-10 bg-amber-50/50 px-2 py-2.5 text-center font-bold text-amber-800 border-r border-amber-100 text-xs">
                                {student.late_count}
                              </td>
                              <td className="sticky right-0 z-10 bg-white group-hover:bg-gray-50 px-2 py-2.5 text-center border-l border-gray-200">
                                <span className={`px-2 py-0.5 rounded-md border text-[11px] font-black ${pctColor}`}>
                                  {attPct}%
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>

                    {/* Table Footer: Daily Section Aggregate Totals */}
                    <tfoot>
                      <tr className="bg-gray-100/80 border-t-2 border-gray-300 font-black text-gray-800 text-[11px]">
                        <td colSpan={2} className="sticky left-0 z-20 bg-gray-100 px-4 py-3 text-right border-r border-gray-200">
                          Section Daily Present:
                        </td>
                        {monthlyRegister.days.map((d) => {
                          const tot = monthlyRegister.daily_totals[d.date];
                          return (
                            <td key={d.date} className="px-1 py-3 text-center border-r border-gray-200">
                              {d.is_sunday ? (
                                <span className="text-gray-400 font-normal">Off</span>
                              ) : tot && tot.total > 0 ? (
                                <span className="text-emerald-700 font-black">{tot.present}</span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="sticky right-36 z-20 bg-emerald-100/90 px-2 py-3 text-center text-emerald-900 font-black">
                          {monthlyRegister.summary.total_present_instances}
                        </td>
                        <td className="sticky right-27 z-20 bg-rose-100/90 px-2 py-3 text-center text-rose-900 font-black">
                          {monthlyRegister.summary.total_absent_instances}
                        </td>
                        <td className="sticky right-18 z-20 bg-sky-100/90 px-2 py-3 text-center text-sky-900 font-black">
                          {monthlyRegister.summary.total_leave_instances}
                        </td>
                        <td className="sticky right-9 z-20 bg-amber-100/90 px-2 py-3 text-center text-amber-900 font-black">
                          {monthlyRegister.summary.total_late_instances}
                        </td>
                        <td className="sticky right-0 z-20 bg-gray-200 px-2 py-3 text-center text-gray-900 font-black">
                          {monthlyRegister.summary.avg_attendance_rate}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Parent Follow-up & Discussion Logger Modal */}
      {selectedAbsenteeForFollowUp && (
        <div
          onClick={() => setSelectedAbsenteeForFollowUp(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-[#0B462C]" />
                  Parent Follow-up & Discussion Log
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  Record telephone discussion with parents for today's absence.
                </p>
              </div>
              <button
                onClick={() => setSelectedAbsenteeForFollowUp(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Profile Snapshot in Modal */}
            <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0">
                  {selectedAbsenteeForFollowUp.photo_url ? (
                    <Image src={selectedAbsenteeForFollowUp.photo_url} alt={selectedAbsenteeForFollowUp.student_name} fill unoptimized sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0B462C]/10 text-[#0B462C] font-black text-xs">
                      {selectedAbsenteeForFollowUp.student_name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-gray-900">
                    {selectedAbsenteeForFollowUp.student_name}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium">
                    s/o {selectedAbsenteeForFollowUp.father_name || '—'} • {selectedAbsenteeForFollowUp.class} (Sec {selectedAbsenteeForFollowUp.section})
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    Reg #{selectedAbsenteeForFollowUp.registration_no}
                  </div>
                </div>
              </div>

              {selectedAbsenteeForFollowUp.mobile_no && (
                <a
                  href={`tel:${selectedAbsenteeForFollowUp.mobile_no}`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Phone className="w-3.5 h-3.5 text-white" />
                  <span>Call Now</span>
                </a>
              )}
            </div>

            {/* 1. Call Outcome / Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
                1. Call Outcome / Status:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFollowUpStatus('contacted')}
                  className={`p-3 rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    followUpStatus === 'contacted'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${followUpStatus === 'contacted' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span>Spoke with Parent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFollowUpStatus('unreachable')}
                  className={`p-3 rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    followUpStatus === 'unreachable'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <PhoneOff className={`w-4 h-4 ${followUpStatus === 'unreachable' ? 'text-rose-600' : 'text-gray-400'}`} />
                  <span>Unreachable / Busy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFollowUpStatus('pending')}
                  className={`p-3 rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    followUpStatus === 'pending'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className={`w-4 h-4 ${followUpStatus === 'pending' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <span>Pending Call</span>
                </button>
              </div>
            </div>

            {/* 2. Reason for Absence (If Contacted) */}
            {followUpStatus === 'contacted' && (
              <div className="space-y-2 animate-fadeIn">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
                  2. Reason for Absence:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_FOLLOW_UP_REASONS.map((reason) => {
                    const isSelected = followUpReason === reason;
                    return (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setFollowUpReason(reason)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200/70'
                        }`}
                      >
                        {reason}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Discussion Notes */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
                {followUpStatus === 'contacted' ? '3. Parent Discussion / Details:' : '2. Notes / Remark (Optional):'}
              </label>
              <textarea
                rows={3}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder={
                  followUpStatus === 'contacted'
                    ? 'e.g. Spoke with mother. Student has high fever and flu. Doctor advised 2 days bed rest, will return Thursday.'
                    : 'e.g. Called twice, father’s number was switched off. Will retry after 12:00 PM.'
                }
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedAbsenteeForFollowUp(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingFollowUp}
                onClick={handleSaveFollowUp}
                className="px-5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] font-black text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSavingFollowUp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                    <span>Saving Log...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#C5A059] stroke-[3]" />
                    <span>Save Follow-up</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Absentee Broadcast Modal */}
      {isWhatsAppModalOpen && (
        <div
          onClick={() => !isBroadcastingWhatsApp && setIsWhatsAppModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#0B462C]" />
                  Broadcast WhatsApp Absentee Alerts
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  Automated parent notifications via WhatsApp Gateway.
                </p>
              </div>
              {!isBroadcastingWhatsApp && (
                <button
                  onClick={() => setIsWhatsAppModalOpen(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Anti-Ban Safeguards Info Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-950">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-black text-emerald-900 block">🛡️ Balanced Anti-Ban Engine Active</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  • <strong>8–12s random safe delay</strong> per message + <strong>5-min rest</strong> after 100 messages.<br />
                  • <strong>Unique hash fingerprinting & Spintax</strong> guarantees 100% distinct byte content.<br />
                  • <strong>Multi-Number Pool Support</strong> for parallel high-speed broadcasts.
                </p>
              </div>
            </div>

            {/* Recipient Audience Summary */}
            {(() => {
              const allAbs = dailySummary?.absentees || [];
              const eligibleAbs = allAbs.filter((a) => {
                if (absenteeFilterClass !== 'all' && a.class?.toLowerCase() !== absenteeFilterClass.toLowerCase()) {
                  return false;
                }
                return Boolean(a.mobile_no);
              });
              const estMins = Math.max(1, Math.round((eligibleAbs.length * 10) / 60));

              return (
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 font-bold block">Selected Audience:</span>
                    <span className="text-sm font-black text-gray-900">
                      {eligibleAbs.length} Parents ({absenteeFilterClass === 'all' ? 'All Classes' : absenteeFilterClass})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 font-bold block">Estimated Time:</span>
                    <span className="text-xs font-black text-[#0B462C]">~{estMins} min (Background Queue)</span>
                  </div>
                </div>
              );
            })()}

            {/* Message Template Editor */}
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-700 uppercase tracking-wider block">
                Message Template (Urdu & English):
              </label>
              <textarea
                rows={6}
                value={whatsAppTemplate}
                onChange={(e) => setWhatsAppTemplate(e.target.value)}
                placeholder="Write your custom WhatsApp message template..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
              />
              <div className="text-[10px] text-gray-400 font-mono">
                Tags: &#123;student_name&#125;, &#123;father_name&#125;, &#123;class&#125;, &#123;section&#125;, &#123;date&#125;, &#123;school_name&#125;
              </div>
            </div>

            {/* Feedback Message */}
            {whatsAppBroadcastFeedback && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                  whatsAppBroadcastFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                {whatsAppBroadcastFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{whatsAppBroadcastFeedback.message}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isBroadcastingWhatsApp}
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isBroadcastingWhatsApp}
                onClick={handleBroadcastWhatsApp}
                className="px-5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] font-black text-xs flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {isBroadcastingWhatsApp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                    <span>Queueing Messages...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Dispatch WhatsApp Alerts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      {fullscreenPhoto && (
        <div
          onClick={() => setFullscreenPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-sm sm:max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-2xl flex flex-col items-center text-center space-y-4"
          >
            <button
              onClick={() => setFullscreenPhoto(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2 rounded-full transition-all cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden bg-black/30 border-2 border-white/30 shadow-2xl">
              <Image
                src={fullscreenPhoto.url}
                alt={fullscreenPhoto.name}
                fill
                unoptimized
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">{fullscreenPhoto.name}</h3>
              {fullscreenPhoto.fatherName && (
                <p className="text-xs text-gray-300 font-medium">s/o {fullscreenPhoto.fatherName}</p>
              )}
              {fullscreenPhoto.regNo && (
                <span className="inline-block mt-2 px-2.5 py-1 rounded-xl bg-black/30 font-mono text-xs text-gray-300 border border-white/10">
                  #{fullscreenPhoto.regNo}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback helper for section list
function classProgressOrFallback(sheet: AttendanceClassSheet | null): { section: string; total: number; is_marked: boolean; present: number }[] {
  if (sheet && sheet.class_progress && sheet.class_progress.length > 0) {
    return sheet.class_progress;
  }
  return [{ section: 'A', total: sheet?.total_students || 0, is_marked: sheet?.is_marked || false, present: sheet?.present_count || 0 }];
}

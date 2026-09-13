'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { 
  Users,
  UserCheck,
  Clock,
  UserX,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  X,
  RefreshCw,
  Award,
  PhoneCall,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  CalendarDays,
  FileSpreadsheet,
  Briefcase,
  Printer,
  FileText,
  DollarSign,
  Building2,
  Wallet,
  CheckCircle,
  Layers,
  ArrowRight,
  Receipt,
  Gift,
  MinusCircle,
  ShieldCheck,
  Camera,
  GraduationCap
} from 'lucide-react';
import { 
  api, 
  User, 
  Teacher, 
  StaffMember, 
  AttendanceRosterItem, 
  AttendanceStats, 
  TeacherAllowance,
  PayrollItem,
  PayrollAdjustment,
  PayrollSummaryStats
} from '@/lib/api';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import CustomNumberInput from '@/components/CustomNumberInput';
import CustomTextInput from '@/components/CustomTextInput';

interface HRDashboardProps {
  currentUser?: User | null;
}

export default function HRDashboard({ currentUser }: HRDashboardProps) {
  // Top Active Tab: 'attendance' | 'payroll'
  const [activeTab, setActiveTab] = useState<'attendance' | 'payroll'>('attendance');

  // Authorization Check: Only Principal (or Super Admin/Admin/Chairman) can award/modify bonuses
  const canManageBonuses = currentUser
    ? ['principal', 'super_admin', 'admin', 'chairman'].includes(currentUser.role)
    : false;

  const isAccountant = currentUser
    ? ['accountant', 'hr_accountant', 'super_admin', 'director', 'chairman'].includes(currentUser.role)
    : false;

  // ================= ATTENDANCE DESK STATE =================
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    total_staff: 0,
    marked_count: 0,
    unmarked_count: 0,
    present_count: 0,
    late_count: 0,
    absent_count: 0,
    on_leave_count: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teaching' | 'non_teaching'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'absent' | 'on_leave' | 'unmarked'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [markingKey, setMarkingKey] = useState<string | null>(null);

  // ================= PAYROLL DESK STATE =================
  const [payrollMonth, setPayrollMonth] = useState<string>('2026-08');
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [payrollStats, setPayrollStats] = useState<PayrollSummaryStats>({
    total_staff: 0,
    total_gross: 0,
    total_deductions: 0,
    total_net_payout: 0,
    bank_payout_total: 0,
    cash_payout_total: 0,
    paid_count: 0,
    unpaid_count: 0,
  });
  const [isLoadingPayroll, setIsLoadingPayroll] = useState<boolean>(false);
  const [payrollSearch, setPayrollSearch] = useState<string>('');
  const [togglingPayrollId, setTogglingPayrollId] = useState<number | null>(null);
  const [isMarkingAllPaid, setIsMarkingAllPaid] = useState<boolean>(false);

  // ================= PAYROLL ADJUSTMENT MODAL STATE =================
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState<boolean>(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollItem | null>(null);
  const [adjBaseSalary, setAdjBaseSalary] = useState<string>('');
  const [adjAllowedLeaves, setAdjAllowedLeaves] = useState<string>('2');
  const [adjLeaveDays, setAdjLeaveDays] = useState<string>('0');
  const [adjAbsentDays, setAdjAbsentDays] = useState<string>('0');
  const [adjBonuses, setAdjBonuses] = useState<PayrollAdjustment[]>([]);
  const [newBonusTitle, setNewBonusTitle] = useState<string>('');
  const [newBonusAmount, setNewBonusAmount] = useState<string>('');
  const [adjAbsentDeduction, setAdjAbsentDeduction] = useState<string>('');
  const [adjAdvanceDeduction, setAdjAdvanceDeduction] = useState<string>('');
  const [adjCustomDeductions, setAdjCustomDeductions] = useState<PayrollAdjustment[]>([]);
  const [newDeductionTitle, setNewDeductionTitle] = useState<string>('');
  const [newDeductionAmount, setNewDeductionAmount] = useState<string>('');
  const [adjRemarks, setAdjRemarks] = useState<string>('');
  const [isSavingPayrollAdj, setIsSavingPayrollAdj] = useState<boolean>(false);
  const [payrollModalError, setPayrollModalError] = useState<string | null>(null);

  // Print Date Range Modal States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printStartDate, setPrintStartDate] = useState<string>(() => selectedDate);
  const [printEndDate, setPrintEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [printPresetDays, setPrintPresetDays] = useState<number | null>(15);
  const [printCategory, setPrintCategory] = useState<'all' | 'teaching' | 'non_teaching'>('all');

  // Non-Teaching Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffName, setStaffName] = useState<string>('');
  const [staffDesignation, setStaffDesignation] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [staffFatherName, setStaffFatherName] = useState<string>('');
  const [staffCnic, setStaffCnic] = useState<string>('');
  const [staffContact, setStaffContact] = useState<string>('');
  const [staffEmergency, setStaffEmergency] = useState<string>('');
  const [staffAddress, setStaffAddress] = useState<string>('');
  const [staffCity, setStaffCity] = useState<string>('');
  const [staffDateOfJoining, setStaffDateOfJoining] = useState<string>('');
  const [staffSalary, setStaffSalary] = useState<string>('');
  const [staffPaymentMethod, setStaffPaymentMethod] = useState<'bank' | 'cash'>('cash');
  const [staffBankName, setStaffBankName] = useState<string>('');
  const [staffAccountTitle, setStaffAccountTitle] = useState<string>('');
  const [staffAccountNumber, setStaffAccountNumber] = useState<string>('');
  const [staffStatus, setStaffStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [staffPictureFile, setStaffPictureFile] = useState<File | null>(null);
  const [staffPicturePreview, setStaffPicturePreview] = useState<string | null>(null);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState<boolean>(false);
  const [staffModalError, setStaffModalError] = useState<string | null>(null);

  // Teacher Modal State (HR can also add/edit faculty)
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [tName, setTName] = useState<string>('');
  const [tEmail, setTEmail] = useState<string>('');
  const [tFatherName, setTFatherName] = useState<string>('');
  const [tCnic, setTCnic] = useState<string>('');
  const [tContactNumber, setTContactNumber] = useState<string>('');
  const [tEmergencyNumber, setTEmergencyNumber] = useState<string>('');
  const [tQualification, setTQualification] = useState<string>('');
  const [tTeachingSince, setTTeachingSince] = useState<string>('');
  const [tCity, setTCity] = useState<string>('');
  const [tAddress, setTAddress] = useState<string>('');
  const [tDateOfJoining, setTDateOfJoining] = useState<string>('');
  const [tSalary, setTSalary] = useState<string>('');
  const [tPaymentMethod, setTPaymentMethod] = useState<'bank' | 'cash'>('bank');
  const [tBankName, setTBankName] = useState<string>('');
  const [tAccountTitle, setTAccountTitle] = useState<string>('');
  const [tAccountNumber, setTAccountNumber] = useState<string>('');
  const [tStatus, setTStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');
  const [tProfilePictureFile, setTProfilePictureFile] = useState<File | null>(null);
  const [tPreviewPictureUrl, setTPreviewPictureUrl] = useState<string | null>(null);
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState<boolean>(false);
  const [teacherModalError, setTeacherModalError] = useState<string | null>(null);

  // Fetch Attendance Roster for Selected Date
  const fetchRoster = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res: any = await api.get(`/attendance/daily?date=${selectedDate}&type=${categoryFilter}`);
      const data = res?.data || res;
      setRoster(data?.roster || []);
      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load attendance roster:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedDate, categoryFilter]);

  // Fetch Monthly Payroll
  const fetchPayroll = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingPayroll(true);
    try {
      const res: any = await api.get(`/payroll?month=${payrollMonth}&type=${categoryFilter}`);
      const data = res?.data || res;
      setPayrolls(data?.payrolls || []);
      if (data?.stats) {
        setPayrollStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      if (!silent) setIsLoadingPayroll(false);
    }
  }, [payrollMonth, categoryFilter]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchRoster();
    } else {
      fetchPayroll();
    }
  }, [fetchRoster, fetchPayroll, activeTab]);

  // Handle Mark Attendance
  const handleMarkAttendance = async (
    item: AttendanceRosterItem, 
    status: 'present' | 'late' | 'absent' | 'leave'
  ) => {
    setMarkingKey(item.key);

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Optimistic update
    setRoster((prev) =>
      prev.map((r) => {
        if (r.key === item.key) {
          return {
            ...r,
            attendance: {
              status: status === 'leave' ? 'on_leave' : status,
              check_in_time: status === 'present' || status === 'late' ? (r.attendance?.check_in_time || timeString) : null,
              check_out_time: r.attendance?.check_out_time || null,
              remarks: status === 'late' ? 'Marked Late' : status === 'leave' ? 'On Leave' : null,
            },
          };
        }
        return r;
      })
    );

    try {
      await api.post('/attendance/mark', {
        staff_type: item.staff_type,
        staff_id: item.staff_id,
        date: selectedDate,
        status: status,
        check_in_time: status === 'present' || status === 'late' ? timeString : null,
        remarks: status === 'late' ? 'Marked Late arrival' : status === 'leave' ? 'Official leave' : null,
      });
      fetchRoster(true);
    } catch (err) {
      console.error('Failed to mark attendance:', err);
      fetchRoster(true);
    } finally {
      setMarkingKey(null);
    }
  };

  // Change Attendance Date by ±1 Day
  const changeDateBy = (offset: number) => {
    try {
      const current = new Date(selectedDate + 'T00:00:00');
      current.setDate(current.getDate() + offset);
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${d}`);
    } catch {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
  };

  const setDateToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Change Payroll Month by ±1 Month
  const changePayrollMonthBy = (offset: number) => {
    try {
      const parts = payrollMonth.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1 + offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      setPayrollMonth(`${y}-${m}`);
    } catch {
      setPayrollMonth('2026-08');
    }
  };

  // Open Payroll Adjustment Modal
  // Open Payroll Adjustment Modal
  const openEditPayrollModal = (item: PayrollItem) => {
    setEditingPayroll(item);
    const base = parseFloat(String(item.base_salary || '0')) || 0;
    setAdjBaseSalary(String(base));
    setAdjAllowedLeaves(String(item.allowed_leaves ?? 2));
    setAdjLeaveDays(String(item.leave_days ?? 0));
    setAdjAbsentDays(String(item.absent_days ?? 0));
    setAdjBonuses(Array.isArray(item.bonuses) ? item.bonuses : []);
    setNewBonusTitle('');
    setNewBonusAmount('');
    const abs = parseFloat(String(item.absent_deduction || '0')) || 0;
    setAdjAbsentDeduction(String(abs));
    const adv = parseFloat(String(item.advance_deduction || '0')) || 0;
    setAdjAdvanceDeduction(String(adv));
    setAdjCustomDeductions(Array.isArray(item.custom_deductions) ? item.custom_deductions : []);
    setNewDeductionTitle('');
    setNewDeductionAmount('');
    setAdjRemarks(item.remarks || '');
    setPayrollModalError(null);
    setIsPayrollModalOpen(true);
  };

  const handleUpdateLeavePolicy = (allowed: string, leaves: string, absents: string) => {
    setAdjAllowedLeaves(allowed);
    setAdjLeaveDays(leaves);
    setAdjAbsentDays(absents);

    const al = Math.max(0, parseInt(allowed) || 0);
    const lv = Math.max(0, parseInt(leaves) || 0);
    const ab = Math.max(0, parseInt(absents) || 0);

    const excessLeaves = Math.max(0, lv - al);
    const totalDeductible = ab + excessLeaves;

    const wd = editingPayroll?.total_working_days || 26;
    const bs = parseFloat(adjBaseSalary) || 0;
    const alw = Number(editingPayroll?.total_allowances || 0);
    const dailyRate = wd > 0 ? (bs + alw) / wd : 0;
    const autoCut = Math.round(totalDeductible * dailyRate);

    setAdjAbsentDeduction(String(autoCut));
  };

  const handleSyncAutoDeduction = () => {
    const al = Math.max(0, parseInt(adjAllowedLeaves) || 0);
    const lv = Math.max(0, parseInt(adjLeaveDays) || 0);
    const ab = Math.max(0, parseInt(adjAbsentDays) || 0);
    const excessLeaves = Math.max(0, lv - al);
    const totalDeductible = ab + excessLeaves;

    const wd = editingPayroll?.total_working_days || 26;
    const bs = parseFloat(adjBaseSalary) || 0;
    const alw = Number(editingPayroll?.total_allowances || 0);
    const dailyRate = wd > 0 ? (bs + alw) / wd : 0;
    const autoCut = Math.round(totalDeductible * dailyRate);

    setAdjAbsentDeduction(String(autoCut));
  };

  const handleAddBonusRow = () => {
    if (!newBonusTitle.trim() || !newBonusAmount) return;
    const amt = parseFloat(newBonusAmount);
    if (isNaN(amt) || amt <= 0) return;
    const approver = currentUser?.name ? `${currentUser.name} (Principal)` : 'Executive Principal';
    setAdjBonuses([...adjBonuses, { 
      title: newBonusTitle.trim(), 
      amount: amt,
      approved_by: approver 
    }]);
    setNewBonusTitle('');
    setNewBonusAmount('');
  };

  const handleRemoveBonusRow = (index: number) => {
    setAdjBonuses(adjBonuses.filter((_, i) => i !== index));
  };

  const handleAddCustomDeductionRow = () => {
    if (!newDeductionTitle.trim() || !newDeductionAmount) return;
    const amt = parseFloat(newDeductionAmount);
    if (isNaN(amt) || amt <= 0) return;
    setAdjCustomDeductions([...adjCustomDeductions, { title: newDeductionTitle.trim(), amount: amt }]);
    setNewDeductionTitle('');
    setNewDeductionAmount('');
  };

  const handleRemoveCustomDeductionRow = (index: number) => {
    setAdjCustomDeductions(adjCustomDeductions.filter((_, i) => i !== index));
  };

  const handleSavePayrollAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;
    setIsSavingPayrollAdj(true);
    setPayrollModalError(null);

    const payload: Record<string, any> = {
      base_salary: parseFloat(adjBaseSalary) || 0,
      allowed_leaves: parseInt(adjAllowedLeaves) || 0,
      leave_days: parseInt(adjLeaveDays) || 0,
      absent_days: parseInt(adjAbsentDays) || 0,
      absent_deduction: parseFloat(adjAbsentDeduction) || 0,
      advance_deduction: parseFloat(adjAdvanceDeduction) || 0,
      custom_deductions: adjCustomDeductions,
      remarks: adjRemarks.trim() || null,
    };

    if (canManageBonuses) {
      payload.bonuses = adjBonuses;
    }

    try {
      await api.put(`/payroll/${editingPayroll.id}`, payload);

      setIsPayrollModalOpen(false);
      fetchPayroll(true);
    } catch (err: any) {
      setPayrollModalError(err.message || 'Failed to save adjustments.');
    } finally {
      setIsSavingPayrollAdj(false);
    }
  };

  // Live Calculations for Modal
  const previewGross = useMemo(() => {
    const base = parseFloat(adjBaseSalary) || 0;
    const allow = Number(editingPayroll?.total_allowances || 0);
    const bon = adjBonuses.reduce((acc, b) => acc + (b.amount || 0), 0);
    return base + allow + bon;
  }, [adjBaseSalary, editingPayroll, adjBonuses]);

  const leavePolicyMetrics = useMemo(() => {
    const allowed = Math.max(0, parseInt(adjAllowedLeaves) || 0);
    const taken = Math.max(0, parseInt(adjLeaveDays) || 0);
    const absents = Math.max(0, parseInt(adjAbsentDays) || 0);

    const paidLeavesUsed = Math.min(taken, allowed);
    const excessLeaves = Math.max(0, taken - allowed);
    const totalDeductibleDays = absents + excessLeaves;

    const workingDays = editingPayroll?.total_working_days || 26;
    const base = parseFloat(adjBaseSalary) || 0;
    const allowances = Number(editingPayroll?.total_allowances || 0);
    const dailyRate = workingDays > 0 ? (base + allowances) / workingDays : 0;
    const calculatedCut = Math.round(totalDeductibleDays * dailyRate);

    return {
      allowed,
      taken,
      absents,
      paidLeavesUsed,
      excessLeaves,
      totalDeductibleDays,
      dailyRate,
      calculatedCut,
    };
  }, [adjAllowedLeaves, adjLeaveDays, adjAbsentDays, adjBaseSalary, editingPayroll]);

  const previewDeductions = useMemo(() => {
    const abs = parseFloat(adjAbsentDeduction) || 0;
    const adv = parseFloat(adjAdvanceDeduction) || 0;
    const custom = adjCustomDeductions.reduce((acc, c) => acc + (c.amount || 0), 0);
    return abs + adv + custom;
  }, [adjAbsentDeduction, adjAdvanceDeduction, adjCustomDeductions]);

  const previewNet = useMemo(() => {
    return Math.max(0, previewGross - previewDeductions);
  }, [previewGross, previewDeductions]);

  // Mark Individual Payroll as Paid
  const handleTogglePayrollPaid = async (payroll: PayrollItem) => {
    setTogglingPayrollId(payroll.id);
    try {
      await api.post(`/payroll/${payroll.id}/mark-paid`, {});
      fetchPayroll(true);
    } catch (err) {
      console.error('Failed to mark payroll paid:', err);
    } finally {
      setTogglingPayrollId(null);
    }
  };

  // Mark All Payrolls as Paid
  const handleMarkAllPayrollPaid = async () => {
    setIsMarkingAllPaid(true);
    try {
      await api.post('/payroll/mark-all-paid', { month: payrollMonth });
      fetchPayroll(true);
    } catch (err) {
      console.error('Failed to mark all paid:', err);
    } finally {
      setIsMarkingAllPaid(false);
    }
  };

  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffName('');
    setStaffDesignation('');
    setStaffEmail('');
    setStaffFatherName('');
    setStaffCnic('');
    setStaffContact('');
    setStaffEmergency('');
    setStaffAddress('');
    setStaffCity('');
    setStaffDateOfJoining(new Date().toISOString().split('T')[0]);
    setStaffSalary('');
    setStaffPaymentMethod('cash');
    setStaffBankName('');
    setStaffAccountTitle('');
    setStaffAccountNumber('');
    setStaffStatus('active');
    setStaffPictureFile(null);
    setStaffPicturePreview(null);
    setStaffModalError(null);
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = async (staffId: number) => {
    try {
      const res: any = await api.get(`/staff-members/${staffId}`);
      const s = res?.data || res;

      const isPrincipalProfile = (s.user && s.user.role === 'principal') 
        || (s.designation && s.designation.toLowerCase().includes('principal'));

      if (isPrincipalProfile && !['director', 'super_admin', 'admin', 'chairman'].includes(currentUser?.role || '')) {
        alert('The Principal profile is protected and can only be edited by the Executive Director.');
        return;
      }

      setEditingStaff(s);
      setStaffName(s.name || '');
      setStaffDesignation(s.designation || '');
      setStaffEmail(s.user?.email || '');
      setStaffFatherName(s.father_name || '');
      setStaffCnic(s.cnic || '');
      setStaffContact(s.contact_number || '');
      setStaffEmergency(s.emergency_number || '');
      setStaffAddress(s.address || '');
      setStaffCity(s.city || '');
      setStaffDateOfJoining(s.date_of_joining ? String(s.date_of_joining).substring(0, 10) : '');
      setStaffSalary(s.salary ? String(s.salary) : '');
      setStaffPaymentMethod(s.payment_method || 'cash');
      setStaffBankName(s.bank_name || '');
      setStaffAccountTitle(s.account_title || '');
      setStaffAccountNumber(s.account_number || '');
      setStaffStatus(s.status || 'active');
      setStaffPictureFile(null);
      setStaffPicturePreview(s.profile_picture_url || null);
      setStaffModalError(null);
      setIsStaffModalOpen(true);
    } catch (err: any) {
      console.error('Failed to load staff details for editing', err);
    }
  };

  const openAddTeacherModal = () => {
    setEditingTeacher(null);
    setTName('');
    setTEmail('');
    setTFatherName('');
    setTCnic('');
    setTContactNumber('');
    setTEmergencyNumber('');
    setTQualification('');
    setTTeachingSince('');
    setTCity('');
    setTAddress('');
    setTDateOfJoining(new Date().toISOString().split('T')[0]);
    setTSalary('');
    setTPaymentMethod('bank');
    setTBankName('');
    setTAccountTitle('');
    setTAccountNumber('');
    setTStatus('active');
    setTProfilePictureFile(null);
    setTPreviewPictureUrl(null);
    setTeacherModalError(null);
    setIsTeacherModalOpen(true);
  };

  const openEditTeacherModal = async (teacherId: number) => {
    try {
      const res: any = await api.get(`/teachers/${teacherId}`);
      const t = res?.data || res;
      setEditingTeacher(t);
      setTName(t.name || '');
      setTEmail(t.user?.email || '');
      setTFatherName(t.father_name || '');
      setTCnic(t.cnic || '');
      setTContactNumber(t.contact_number || '');
      setTEmergencyNumber(t.emergency_number || '');
      setTQualification(t.qualification || '');
      setTTeachingSince(t.teaching_since || '');
      setTCity(t.city || '');
      setTAddress(t.address || '');
      setTDateOfJoining(t.date_of_joining ? String(t.date_of_joining).substring(0, 10) : '');
      setTSalary(t.salary ? String(t.salary) : '');
      setTPaymentMethod(t.payment_method || 'bank');
      setTBankName(t.bank_name || '');
      setTAccountTitle(t.account_title || '');
      setTAccountNumber(t.account_number || '');
      setTStatus(t.status || 'active');
      setTProfilePictureFile(null);
      setTPreviewPictureUrl(t.profile_picture_url || null);
      setTeacherModalError(null);
      setIsTeacherModalOpen(true);
    } catch (err: any) {
      console.error('Failed to load teacher details for editing', err);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffDesignation.trim()) {
      setStaffModalError('Please enter the staff member name and designation.');
      return;
    }

    setIsSubmittingStaff(true);
    setStaffModalError(null);

    const formData = new FormData();
    formData.append('name', staffName.trim());
    formData.append('designation', staffDesignation.trim());
    if (staffEmail.trim()) formData.append('email', staffEmail.trim());
    if (staffFatherName.trim()) formData.append('father_name', staffFatherName.trim());
    if (staffCnic.trim()) formData.append('cnic', staffCnic.trim());
    if (staffContact.trim()) formData.append('contact_number', staffContact.trim());
    if (staffEmergency.trim()) formData.append('emergency_number', staffEmergency.trim());
    if (staffAddress.trim()) formData.append('address', staffAddress.trim());
    if (staffCity.trim()) formData.append('city', staffCity.trim());
    if (staffDateOfJoining) formData.append('date_of_joining', staffDateOfJoining);
    if (staffSalary) formData.append('salary', staffSalary);
    formData.append('payment_method', staffPaymentMethod);
    if (staffBankName) formData.append('bank_name', staffBankName);
    if (staffAccountTitle) formData.append('account_title', staffAccountTitle);
    if (staffAccountNumber) formData.append('account_number', staffAccountNumber);
    formData.append('status', staffStatus);
    if (staffPictureFile) {
      formData.append('profile_picture', staffPictureFile);
    }

    try {
      if (editingStaff) {
        await api.postFormData(`/staff-members/${editingStaff.id}`, formData);
      } else {
        await api.postFormData('/staff-members', formData);
      }
      setIsStaffModalOpen(false);
      fetchRoster(true);
      fetchPayroll(true);
    } catch (err: any) {
      setStaffModalError(err.message || 'Failed to save staff member.');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tEmail.trim()) {
      setTeacherModalError('Full Name and Login Email are required.');
      return;
    }

    setIsSubmittingTeacher(true);
    setTeacherModalError(null);

    const formData = new FormData();
    formData.append('name', tName.trim());
    formData.append('email', tEmail.trim());
    if (tFatherName.trim()) formData.append('father_name', tFatherName.trim());
    if (tCnic.trim()) formData.append('cnic', tCnic.trim());
    if (tContactNumber.trim()) formData.append('contact_number', tContactNumber.trim());
    if (tEmergencyNumber.trim()) formData.append('emergency_number', tEmergencyNumber.trim());
    if (tQualification.trim()) formData.append('qualification', tQualification.trim());
    if (tTeachingSince.trim()) formData.append('teaching_since', tTeachingSince.trim());
    if (tCity.trim()) formData.append('city', tCity.trim());
    if (tAddress.trim()) formData.append('address', tAddress.trim());
    if (tDateOfJoining) formData.append('date_of_joining', tDateOfJoining);
    if (tSalary) formData.append('salary', tSalary);
    formData.append('payment_method', tPaymentMethod);
    if (tBankName) formData.append('bank_name', tBankName);
    if (tAccountTitle) formData.append('account_title', tAccountTitle);
    if (tAccountNumber) formData.append('account_number', tAccountNumber);
    formData.append('status', tStatus);
    if (tProfilePictureFile) {
      formData.append('profile_picture', tProfilePictureFile);
    }

    try {
      if (editingTeacher) {
        await api.postFormData(`/teachers/${editingTeacher.id}`, formData);
      } else {
        await api.postFormData('/teachers', formData);
      }
      setIsTeacherModalOpen(false);
      fetchRoster(true);
      fetchPayroll(true);
    } catch (err: any) {
      setTeacherModalError(err.message || 'Failed to save teacher.');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  const handleOpenPrintModal = () => {
    setPrintStartDate(selectedDate);
    const start = new Date(selectedDate + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    const y = end.getFullYear();
    const m = String(end.getMonth() + 1).padStart(2, '0');
    const d = String(end.getDate()).padStart(2, '0');
    setPrintEndDate(`${y}-${m}-${d}`);
    setPrintPresetDays(15);
    setPrintCategory(categoryFilter);
    setIsPrintModalOpen(true);
  };

  const setPrintDays = (days: number) => {
    const start = printStartDate ? new Date(printStartDate + 'T00:00:00') : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + (days - 1));
    const y = end.getFullYear();
    const m = String(end.getMonth() + 1).padStart(2, '0');
    const d = String(end.getDate()).padStart(2, '0');
    setPrintEndDate(`${y}-${m}-${d}`);
    setPrintPresetDays(days);
  };

  // Filter Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        (item.cnic && item.cnic.toLowerCase().includes(q)) ||
        (item.contact_number && item.contact_number.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unmarked' && !item.attendance) ||
        item.attendance?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [roster, searchQuery, statusFilter]);

  // Filter Payrolls
  const filteredPayrolls = useMemo(() => {
    return payrolls.filter((item) => {
      const q = payrollSearch.toLowerCase().trim();
      return (
        !q ||
        item.staff_name.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q) ||
        (item.bank_name && item.bank_name.toLowerCase().includes(q)) ||
        (item.account_number && item.account_number.toLowerCase().includes(q))
      );
    });
  }, [payrolls, payrollSearch]);

  const formattedDateString = useMemo(() => {
    try {
      const d = new Date(selectedDate + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const formattedMonthString = useMemo(() => {
    try {
      const d = new Date(payrollMonth + '-01T00:00:00');
      return d.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return payrollMonth;
    }
  }, [payrollMonth]);

  return (
    <div className="space-y-5 pb-12">

      {/* ================= TOP HEADER & TITLE ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-gray-900">HR & Workforce Administration</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B462C] border border-emerald-200 uppercase">
              Staff Portal
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Daily roll-call & Monthly Payroll System • Nawaz Sharif School of Eminence
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'attendance' ? (
            <button
              type="button"
              onClick={handleOpenPrintModal}
              className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Sign-In Sheet</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => window.open('/payroll/bonuses', '_blank')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="View Executive Bonus & Incentive Ledger"
              >
                <Gift className="w-3.5 h-3.5 text-amber-700" />
                <span>Bonus Report</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/payroll/bank-advice?month=${payrollMonth}`, '_blank')}
                className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Print Bank Salary Transfer Advice"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Bank Advice (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(`/payroll/payslip?month=${payrollMonth}&type=${categoryFilter}`, '_blank')}
                className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print All Payslips (A4)</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={openAddTeacherModal}
            className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#0B462C]" />
            <span>Add Faculty</span>
          </button>

          <button
            type="button"
            onClick={openAddStaffModal}
            className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* ================= DESK TAB SELECTOR ================= */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-gray-200/80 shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Attendance Desk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Monthly Payroll & Payslips</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DAILY ATTENDANCE DESK                              */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Attendance KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Staff</span>
                <Users className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-900 mt-1">{stats.total_staff}</div>
              <span className="text-[10px] text-gray-400 font-medium">Teaching & Non-Teaching</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Present</span>
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-900 mt-1">{stats.present_count}</div>
              <span className="text-[10px] text-emerald-700 font-medium">On campus today</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Late</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-900 mt-1">{stats.late_count}</div>
              <span className="text-[10px] text-amber-700 font-medium">Late arrival</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Absent</span>
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-black text-rose-900 mt-1">{stats.absent_count}</div>
              <span className="text-[10px] text-rose-700 font-medium">Unexcused</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">On Leave</span>
                <Calendar className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-xl font-black text-sky-900 mt-1">{stats.on_leave_count}</div>
              <span className="text-[10px] text-sky-700 font-medium">Official leaves</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Unmarked</span>
                <Sparkles className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-700 mt-1">{stats.unmarked_count}</div>
              <span className="text-[10px] text-gray-400 font-medium">Pending roll-call</span>
            </div>
          </div>

          {/* Date Navigation & Filter Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs space-y-4">
            <div className="w-full flex items-center justify-center py-1">
              <div className="inline-flex items-center justify-center gap-2 sm:gap-3 bg-gray-50/70 p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => changeDateBy(-1)}
                  className="p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer shadow-2xs"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="w-44 sm:w-48">
                  <CustomDatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    placeholder="Select roll-call date"
                    allowClear={false}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => changeDateBy(1)}
                  className="p-2 sm:p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer shadow-2xs"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={setDateToToday}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Categories & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200/60 w-fit">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All Staff
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('teaching')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    categoryFilter === 'teaching'
                      ? 'bg-white text-[#0B462C] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Teaching Faculty
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('non_teaching')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    categoryFilter === 'non_teaching'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Non-Teaching Staff
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, CNIC, designation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Attendance Roster Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900">
                Staff Roll–Call Sheet • {formattedDateString}
              </h3>
              <span className="text-xs font-bold text-gray-500">
                {filteredRoster.length} Personnel
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-gray-400 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B462C]" />
                <p className="text-xs font-bold">Loading attendance records...</p>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-gray-300" />
                <h4 className="text-sm font-bold text-gray-700">No staff members found</h4>
                <p className="text-xs text-gray-400">Try adjusting your filters or search keywords.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredRoster.map((item) => {
                  const att = item.attendance;
                  const isMarking = markingKey === item.key;

                  return (
                    <div
                      key={item.key}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Staff Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative shadow-2xs ${
                          item.staff_type === 'teacher'
                            ? 'bg-[#0B462C] text-[#E8D4A2]'
                            : 'bg-amber-800 text-amber-100'
                        }`}>
                          {item.profile_picture_url ? (
                            <img src={item.profile_picture_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{item.name.charAt(0)}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900 truncate">
                              {item.name}
                            </h4>
                            {item.staff_type === 'staff' && (item.name.toLowerCase().includes('principal') || (item.designation && item.designation.toLowerCase().includes('principal'))) && !['director', 'super_admin', 'admin', 'chairman'].includes(currentUser?.role || '') ? (
                              <span 
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200"
                                title="Principal profile is editable by Director only"
                              >
                                Director Only
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => item.staff_type === 'teacher' ? openEditTeacherModal(item.staff_id) : openEditStaffModal(item.staff_id)}
                                className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                title="Edit Personal & Employment Profile"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              item.staff_type === 'teacher'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {item.category_label}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 font-medium mt-0.5">
                            <span className="font-semibold text-gray-700">{item.designation}</span>
                            {item.contact_number && (
                              <span className="flex items-center gap-1 text-gray-400">
                                <PhoneCall className="w-3 h-3" />
                                {item.contact_number}
                              </span>
                            )}
                            {item.cnic && (
                              <span className="text-gray-400 font-mono text-[11px]">
                                CNIC: {item.cnic}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attendance Controls */}
                      <div className="flex flex-wrap items-center gap-2">
                        {att && (
                          <div className="text-right mr-2 hidden sm:block">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Recorded Status
                            </span>
                            <div className="text-xs font-bold text-gray-700">
                              {att.check_in_time ? `In: ${att.check_in_time}` : (att.status === 'present' ? 'Present' : att.status.toUpperCase())}
                            </div>
                          </div>
                        )}

                        {item.is_leave_locked ? (
                          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-2xs">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                            <div>
                              <div className="text-xs font-black flex items-center gap-1 text-emerald-950">
                                <span>Approved Leave 🔒</span>
                              </div>
                              <div className="text-[10px] text-emerald-800 font-semibold leading-tight">
                                {item.leave_info?.leave_type ? `${item.leave_info.leave_type.toUpperCase()} LEAVE` : 'OFFICIAL LEAVE'} • Locked by Principal
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200/70">
                            {/* Present */}
                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(item, 'present')}
                              disabled={isMarking}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                att?.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-gray-600 hover:text-emerald-700 hover:bg-white'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>Present</span>
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(item, 'late')}
                              disabled={isMarking}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                att?.status === 'late'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-gray-600 hover:text-amber-700 hover:bg-white'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span>Late</span>
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(item, 'absent')}
                              disabled={isMarking}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                att?.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-gray-600 hover:text-rose-700 hover:bg-white'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-400" />
                              <span>Absent</span>
                            </button>

                            {/* Leave */}
                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(item, 'leave')}
                              disabled={isMarking}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                att?.status === 'on_leave'
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'text-gray-600 hover:text-sky-700 hover:bg-white'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-sky-400" />
                              <span>Leave</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MONTHLY PAYROLL & PAYSLIPS DESK                    */}
      {/* ========================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-5">
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Payroll</span>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-xl font-black text-gray-900 mt-1">
                PKR {Number(payrollStats.total_gross || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Base + Allowances + Bonuses</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Deductions</span>
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-black text-rose-900 mt-1">
                - PKR {Number(payrollStats.total_deductions || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-rose-700 font-medium">Absents, Advances & Deductions</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-300 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">Total Net Payout</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-[#0B462C] mt-1">
                PKR {Number(payrollStats.total_net_payout || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">Net Remuneration</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Bank Transfers</span>
                <Building2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-900 mt-1">
                PKR {Number(payrollStats.bank_payout_total || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-700 font-medium">Direct bank credits</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Cash Counter</span>
                <Wallet className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-900 mt-1">
                PKR {Number(payrollStats.cash_payout_total || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-700 font-medium">Physical cash payout</span>
            </div>
          </div>

          {/* Month Selector & Payroll Actions */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Centered Month Selector */}
              <div className="inline-flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => changePayrollMonthBy(-1)}
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-4 py-1.5 text-xs font-black text-gray-900">
                  {formattedMonthString}
                </div>

                <button
                  type="button"
                  onClick={() => changePayrollMonthBy(1)}
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchPayroll()}
                  disabled={isLoadingPayroll}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#0B462C] ${isLoadingPayroll ? 'animate-spin' : ''}`} />
                  <span>Recalculate</span>
                </button>

                {isAccountant && (
                  <button
                    type="button"
                    onClick={handleMarkAllPayrollPaid}
                    disabled={isMarkingAllPaid || payrollStats.unpaid_count === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark All as Paid</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.open(`/payroll/bank-advice?month=${payrollMonth}`, '_blank')}
                  className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Print Bank Salary Transfer Advice"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>Bank Advice</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.open(`/payroll/payslip?month=${payrollMonth}&type=${categoryFilter}`, '_blank')}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Print All Slips</span>
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200/60 w-fit">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All Staff
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('teaching')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    categoryFilter === 'teaching'
                      ? 'bg-white text-[#0B462C] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Teaching Faculty
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('non_teaching')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    categoryFilter === 'non_teaching'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Non-Teaching
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payroll by name, bank..."
                  value={payrollSearch}
                  onChange={(e) => setPayrollSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900">
                Staff Payroll Ledger • {formattedMonthString}
              </h3>
              <span className="text-xs font-bold text-gray-500">
                {filteredPayrolls.length} Salaries Calculated
              </span>
            </div>

            {isLoadingPayroll ? (
              <div className="p-12 text-center text-gray-400 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0B462C]" />
                <p className="text-xs font-bold">Calculating monthly payroll records...</p>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <DollarSign className="w-8 h-8 mx-auto text-gray-300" />
                <h4 className="text-sm font-bold text-gray-700">No payroll records for this month</h4>
                <p className="text-xs text-gray-400">Click &quot;Recalculate&quot; to generate payroll from attendance.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200/70">
                      <th className="py-3 px-4 w-10 text-center">#</th>
                      <th className="py-3 px-4">Staff Member & Designation</th>
                      <th className="py-3 px-3">Base & Earnings</th>
                      <th className="py-3 px-3 text-center">Attendance Summary</th>
                      <th className="py-3 px-3 text-right">Deductions</th>
                      <th className="py-3 px-3 text-right">Net Salary</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayrolls.map((p, idx) => {
                      const gross = Number(p.gross_salary || 0);
                      const base = Number(p.base_salary || 0);
                      const bonuses = Number(p.total_bonuses || 0);
                      const deductions = Number(p.absent_deduction || 0) + Number(p.other_deductions || 0);
                      const net = Number(p.net_salary || 0);
                      const isToggling = togglingPayrollId === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-black text-gray-900 text-xs">{p.staff_name}</div>
                            <div className="text-[11px] text-gray-500 font-medium">{p.designation}</div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-gray-900">PKR {gross.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                              <span>Base: {base.toLocaleString()}</span>
                              {bonuses > 0 && (
                                <span className="text-emerald-700 font-bold">
                                  +{bonuses.toLocaleString()} Bon
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800" title="Days Present">
                                {p.present_days}P
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800" title="Late Days">
                                {p.late_days}L
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800" title="Approved Leaves">
                                {p.leave_days}Lv
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800" title="Unexcused Absents">
                                {p.absent_days}A
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-bold text-rose-600 font-mono">
                              {deductions > 0 ? `- PKR ${deductions.toLocaleString()}` : 'PKR 0'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-black text-[#0B462C] font-mono text-sm">
                              PKR {net.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {p.payment_method === 'bank' ? (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700">
                                  <Building2 className="w-3 h-3" />
                                  <span>{p.bank_name || 'Bank Transfer'}</span>
                                </span>
                                {p.account_number && (
                                  <div className="text-[10px] text-gray-400 font-mono truncate max-w-[140px]">
                                    {p.account_number}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                                <Wallet className="w-3 h-3" />
                                <span>Cash Counter</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              p.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border border-amber-300'
                            }`}>
                              {p.status === 'paid' ? 'Paid ✓' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditPayrollModal(p)}
                                disabled={p.status === 'paid'}
                                className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] flex items-center gap-1 transition shadow-2xs ${
                                  p.status === 'paid'
                                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                    : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200 cursor-pointer'
                                }`}
                                title={p.status === 'paid' ? 'Paid salary is locked against editing' : 'Edit Bonuses, Deductions & Off Days'}
                              >
                                <Edit3 className={`w-3 h-3 ${p.status === 'paid' ? 'text-gray-400' : 'text-blue-600'}`} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => window.open(`/payroll/payslip?id=${p.id}`, '_blank')}
                                className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="Print Official Salary Slip"
                              >
                                <Printer className="w-3 h-3 text-[#0B462C]" />
                                <span>Slip</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => window.open(`/teachers/ledger?id=${p.staff_id}&type=${p.staff_type}`, '_blank')}
                                className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#0B462C] font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="View Full Employee Financial Ledger"
                              >
                                <FileSpreadsheet className="w-3 h-3 text-[#0B462C]" />
                                <span>Ledger</span>
                              </button>

                              {isAccountant ? (
                                <button
                                  type="button"
                                  onClick={() => handleTogglePayrollPaid(p)}
                                  disabled={isToggling}
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                                    p.status === 'paid'
                                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                      : 'bg-[#0B462C] hover:bg-[#062E1C] text-white'
                                  }`}
                                >
                                  {isToggling ? '...' : p.status === 'paid' ? 'Paid ✓' : 'Pay'}
                                </button>
                              ) : (
                                p.status === 'paid' ? (
                                  <span className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Paid ✓
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-lg font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                                    Unpaid
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PAYROLL ADJUSTMENTS ================= */}
      {isPayrollModalOpen && editingPayroll && (
        <div 
          onClick={() => setIsPayrollModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative space-y-6 max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsPayrollModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#0B462C] flex items-center justify-center font-black">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Salary Adjustments: {editingPayroll.staff_name}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {editingPayroll.designation} • {formattedMonthString}
                </p>
              </div>
            </div>

            {payrollModalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{payrollModalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePayrollAdjustment} className="space-y-5">
              
              {/* Basic Salary & Attendance Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Base Basic Salary (PKR)
                  </label>
                  <CustomNumberInput
                    value={adjBaseSalary}
                    onChange={setAdjBaseSalary}
                    placeholder="e.g. 50000"
                    min={0}
                  />
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">Attendance Breakdown</span>
                    <span className="font-bold text-gray-900 font-mono text-[11px]">
                      Total: {editingPayroll.total_working_days} Days
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold pt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200" title="Present Days">
                      {editingPayroll.present_days} Present
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200" title="Late Arrivals">
                      {editingPayroll.late_days} Late
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200" title="Official Approved Leaves">
                      {editingPayroll.leave_days} Leaves
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200" title="Unexcused Absents">
                      {editingPayroll.absent_days} Absents
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Bonuses & Special Additions */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <Gift className="w-4 h-4 text-emerald-700" />
                    <span>Bonuses & Special Additions</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Principal Authority
                    </span>
                  </div>
                  {adjBonuses.length > 0 && (
                    <span className="text-xs font-black text-emerald-800">
                      Total: + PKR {adjBonuses.reduce((acc, b) => acc + (b.amount || 0), 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* List of existing bonuses */}
                {adjBonuses.length === 0 && !canManageBonuses && (
                  <div className="text-xs text-gray-400 italic py-1">No bonuses currently recorded for this employee.</div>
                )}

                {adjBonuses.map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">{b.title}</span>
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Approved by: {b.approved_by || 'Principal'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-700">+ PKR {Number(b.amount).toLocaleString()}</span>
                      {canManageBonuses && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBonusRow(idx)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                          title="Remove Bonus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add new bonus input (Principal only) */}
                {canManageBonuses && (
                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <div className="flex-1 w-full">
                      <CustomTextInput
                        value={newBonusTitle}
                        onChange={setNewBonusTitle}
                        placeholder="Bonus Title / Reason (e.g. Eid Bonus, Independence Day, Performance)"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <CustomNumberInput
                        value={newBonusAmount}
                        onChange={setNewBonusAmount}
                        placeholder="Amount (PKR)"
                        min={0}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBonusRow}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 transition cursor-pointer"
                    >
                      + Add Bonus
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Deductions, Leave Policy & Advances */}
              <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                    <MinusCircle className="w-4 h-4 text-rose-700" />
                    <span>Off-Days, Leave Policy & Deductions</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">
                    Daily Rate: <b className="text-gray-900 font-mono">PKR {Math.round(leavePolicyMetrics.dailyRate).toLocaleString()}/day</b>
                  </span>
                </div>

                {/* Leave Policy & Roll-Call Audit Box */}
                <div className="p-3.5 rounded-xl bg-white border border-rose-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                    <span>Monthly Leave Policy & Roll-Call Audit</span>
                    <span className="text-[10.5px] text-gray-500 font-normal">
                      Based on <b>{editingPayroll.total_working_days}</b> working days
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Allowed Paid Leaves Quota
                      </label>
                      <CustomNumberInput
                        value={adjAllowedLeaves}
                        onChange={(v) => handleUpdateLeavePolicy(v, adjLeaveDays, adjAbsentDays)}
                        placeholder="e.g. 2"
                        min={0}
                      />
                      <span className="text-[9.5px] text-gray-400 block mt-0.5">Paid leaves quota / month</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Official Leaves Taken
                      </label>
                      <CustomNumberInput
                        value={adjLeaveDays}
                        onChange={(v) => handleUpdateLeavePolicy(adjAllowedLeaves, v, adjAbsentDays)}
                        placeholder="e.g. 2"
                        min={0}
                      />
                      <span className="text-[9.5px] text-gray-400 block mt-0.5">Approved leave records</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-700 block mb-1">
                        Unexcused Absents
                      </label>
                      <CustomNumberInput
                        value={adjAbsentDays}
                        onChange={(v) => handleUpdateLeavePolicy(adjAllowedLeaves, adjLeaveDays, v)}
                        placeholder="e.g. 0"
                        min={0}
                      />
                      <span className="text-[9.5px] text-gray-400 block mt-0.5">Direct unpaid absent days</span>
                    </div>
                  </div>

                  {/* Dynamic Status / Calculation Breakdown Banner */}
                  <div className={`p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border ${
                    leavePolicyMetrics.totalDeductibleDays === 0
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-950'
                  }`}>
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 text-[11px] flex-wrap">
                        {leavePolicyMetrics.totalDeductibleDays === 0 ? (
                          <span className="text-emerald-700 font-black">✓ No Off-Days Salary Deduction</span>
                        ) : (
                          <span className="text-rose-700 font-black">⚠️ {leavePolicyMetrics.totalDeductibleDays} Deductible Off-Day(s)</span>
                        )}
                        <span className="text-[10px] text-gray-500 font-normal">
                          ({leavePolicyMetrics.paidLeavesUsed} of {leavePolicyMetrics.allowed} allowed leaves used
                          {leavePolicyMetrics.excessLeaves > 0 ? ` • ${leavePolicyMetrics.excessLeaves} excess unpaid leaves` : ''}
                          {leavePolicyMetrics.absents > 0 ? ` • ${leavePolicyMetrics.absents} absents` : ''})
                        </span>
                      </div>
                      <div className="text-[10.5px] text-gray-600 font-mono">
                        {leavePolicyMetrics.totalDeductibleDays} day(s) × PKR {Math.round(leavePolicyMetrics.dailyRate).toLocaleString()} = <b>PKR {leavePolicyMetrics.calculatedCut.toLocaleString()}</b>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSyncAutoDeduction}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-[10.5px] shrink-0 transition cursor-pointer self-start sm:self-center"
                    >
                      ⚡ Sync Calculated Cut
                    </button>
                  </div>
                </div>

                {/* Monetary Deduction Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Off-Days / Absent Deduction (PKR)
                    </label>
                    <CustomNumberInput
                      value={adjAbsentDeduction}
                      onChange={setAdjAbsentDeduction}
                      placeholder="e.g. 3500"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">
                      Advance Salary Deduction (PKR)
                    </label>
                    <CustomNumberInput
                      value={adjAdvanceDeduction}
                      onChange={setAdjAdvanceDeduction}
                      placeholder="e.g. 10000"
                      min={0}
                    />
                  </div>
                </div>

                {/* List of custom deductions */}
                {adjCustomDeductions.map((cd, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-rose-200 text-xs">
                    <span className="font-bold text-gray-800">{cd.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-rose-700">- PKR {Number(cd.amount).toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomDeductionRow(idx)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                        title="Remove Deduction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add new custom deduction input */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <div className="flex-1 w-full">
                    <CustomTextInput
                      value={newDeductionTitle}
                      onChange={setNewDeductionTitle}
                      placeholder="Custom Deduction Reason (e.g. Income Tax, Security, Fine)"
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <CustomNumberInput
                      value={newDeductionAmount}
                      onChange={setNewDeductionAmount}
                      placeholder="Amount (PKR)"
                      min={0}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomDeductionRow}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shrink-0 transition cursor-pointer"
                  >
                    + Add Deduction
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Adjustment Remarks / Approval Notes
                </label>
                <CustomTextInput
                  value={adjRemarks}
                  onChange={setAdjRemarks}
                  placeholder="e.g. Eid bonus approved by Principal, 5k advance salary adjusted"
                />
              </div>

              {/* Live Preview Summary Box */}
              <div className="p-4 rounded-2xl bg-gray-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Calculated Net Remuneration
                  </div>
                  <div className="text-xs text-gray-300">
                    Gross: PKR {previewGross.toLocaleString()} • Total Deductions: -PKR {previewDeductions.toLocaleString()}
                  </div>
                </div>

                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                  PKR {previewNet.toLocaleString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  disabled={isSavingPayrollAdj}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPayrollAdj}
                  className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingPayrollAdj && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Adjustments & Recalculate</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT STAFF MEMBER ================= */}
      {isStaffModalOpen && (
        <div 
          onClick={() => setIsStaffModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative space-y-6 max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center font-black">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  {editingStaff ? `Edit Staff Member: ${editingStaff.name}` : 'Onboard Non-Teaching Staff'}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Gatekeepers, security, office attendants, lab assistants & drivers
                </p>
              </div>
            </div>

            {staffModalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{staffModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <CustomTextInput
                    value={staffName}
                    onChange={setStaffName}
                    placeholder="e.g. Muhammad Rafiq"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Designation / Job Role <span className="text-red-500">*</span>
                  </label>
                  <CustomTextInput
                    value={staffDesignation}
                    onChange={setStaffDesignation}
                    placeholder="e.g. Main Gate Security / Office Boy"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    CNIC / National ID
                  </label>
                  <CustomTextInput
                    value={staffCnic}
                    onChange={setStaffCnic}
                    placeholder="e.g. 35102-1234567-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Contact Number
                  </label>
                  <CustomTextInput
                    type="tel"
                    value={staffContact}
                    onChange={setStaffContact}
                    placeholder="e.g. 0300-1234567"
                  />
                </div>
              </div>

              {/* Salary & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Monthly Salary (PKR)
                  </label>
                  <CustomNumberInput
                    value={staffSalary}
                    onChange={setStaffSalary}
                    placeholder="e.g. 28000"
                    min={0}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Disbursement / Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStaffPaymentMethod('bank')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        staffPaymentMethod === 'bank'
                          ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      🏦 Bank Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffPaymentMethod('cash')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        staffPaymentMethod === 'cash'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      💵 Cash in Hand
                    </button>
                  </div>
                </div>
              </div>

              {/* Conditional Bank Fields */}
              {staffPaymentMethod === 'bank' && (
                <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                  <div className="text-xs font-bold text-blue-900">Bank Account Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Bank Name</label>
                      <CustomTextInput
                        value={staffBankName}
                        onChange={setStaffBankName}
                        placeholder="e.g. Habib Bank (HBL)"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Title</label>
                      <CustomTextInput
                        value={staffAccountTitle}
                        onChange={setStaffAccountTitle}
                        placeholder="e.g. Muhammad Rafiq"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Account / IBAN Number</label>
                      <CustomTextInput
                        value={staffAccountNumber}
                        onChange={setStaffAccountNumber}
                        placeholder="e.g. PK36HABB00..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    City / Town
                  </label>
                  <CustomTextInput
                    value={staffCity}
                    onChange={setStaffCity}
                    placeholder="e.g. Chunian, Kasur"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Optional Portal Login Email
                  </label>
                  <CustomTextInput
                    type="email"
                    value={staffEmail}
                    onChange={setStaffEmail}
                    placeholder="Leave empty if no portal login required"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Residential Address
                </label>
                <CustomTextInput
                  value={staffAddress}
                  onChange={setStaffAddress}
                  placeholder="Full residential street address"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  disabled={isSubmittingStaff}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingStaff && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingStaff ? 'Save Changes' : 'Register Staff Member'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FACULTY (HR ONBOARDING) ================= */}
      {isTeacherModalOpen && (
        <div 
          onClick={() => setIsTeacherModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative space-y-6 max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsTeacherModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Branding Header */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-gray-100">
              <div className="w-11 h-11 relative shrink-0">
                <Image
                  src="/logo.png"
                  alt="NSSE Logo"
                  fill
                  sizes="44px"
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-sm font-black text-[#0B462C] font-cinzel tracking-wider uppercase">
                  Nawaz Sharif School of Eminence
                </div>
                <div className="text-xs font-bold text-gray-500">
                  {editingTeacher ? `Edit Faculty Member: ${editingTeacher.name}` : 'Register New Teaching Faculty'}
                </div>
              </div>
            </div>

            {teacherModalError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{teacherModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-5">
              
              {/* Photo & Profile Identity Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-[#0B462C] text-white flex items-center justify-center font-black text-xl shadow-xs overflow-hidden border-2 border-white">
                    {tPreviewPictureUrl ? (
                      <img 
                        src={tPreviewPictureUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span>{tName.charAt(0) || 'T'}</span>
                    )}
                  </div>
                  <label 
                    htmlFor="hr-teacher-photo"
                    className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-white shadow-md transition cursor-pointer"
                    title="Upload Faculty Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </label>
                  <input 
                    id="hr-teacher-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setTProfilePictureFile(file);
                        setTPreviewPictureUrl(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-gray-900">Faculty Portrait Photo</h4>
                  <p className="text-[11px] text-gray-500">
                    Upload an official photograph for campus identity and staff roster.
                  </p>
                </div>
              </div>

              {/* 1. Personal Identification */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                  1. Personal Identification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Teacher Full Name <span className="text-red-500">*</span>
                    </label>
                    <CustomTextInput
                      value={tName}
                      onChange={setTName}
                      placeholder="e.g. Prof. Tariq Mahmood"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Portal Login Email <span className="text-red-500">*</span>
                    </label>
                    <CustomTextInput
                      type="email"
                      value={tEmail}
                      onChange={setTEmail}
                      placeholder="e.g. teacher@nsse.edu.pk"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Father's Name
                    </label>
                    <CustomTextInput
                      value={tFatherName}
                      onChange={setTFatherName}
                      placeholder="e.g. Abdul Ghafoor"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      CNIC / National ID
                    </label>
                    <CustomTextInput
                      value={tCnic}
                      onChange={setTCnic}
                      placeholder="e.g. 35102-1234567-1"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Contact & Location Details */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                  2. Contact & Residential Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Contact Mobile Number
                    </label>
                    <CustomTextInput
                      type="tel"
                      value={tContactNumber}
                      onChange={setTContactNumber}
                      placeholder="e.g. 0300-1234567"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Emergency Contact Number
                    </label>
                    <CustomTextInput
                      type="tel"
                      value={tEmergencyNumber}
                      onChange={setTEmergencyNumber}
                      placeholder="e.g. 0301-7654321"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      City of Residence
                    </label>
                    <CustomTextInput
                      value={tCity}
                      onChange={setTCity}
                      placeholder="e.g. Chunian, Kasur"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Residential Address
                    </label>
                    <CustomTextInput
                      value={tAddress}
                      onChange={setTAddress}
                      placeholder="e.g. Street #2, Chunian"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Academic & Professional Profile */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                  3. Academic & Professional Profile
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Highest Qualification
                    </label>
                    <CustomTextInput
                      value={tQualification}
                      onChange={setTQualification}
                      placeholder="e.g. M.Sc Mathematics, B.Ed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Teaching Since
                    </label>
                    <CustomTextInput
                      value={tTeachingSince}
                      onChange={setTTeachingSince}
                      placeholder="e.g. 2018 or 5 Years"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Date of Joining
                    </label>
                    <CustomDatePicker
                      value={tDateOfJoining}
                      onChange={setTDateOfJoining}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Compensation & Disbursement */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
                  4. Compensation & Disbursement Mode
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Base Salary (PKR)
                    </label>
                    <CustomNumberInput
                      value={tSalary}
                      onChange={setTSalary}
                      placeholder="e.g. 55000"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Disbursement Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTPaymentMethod('bank')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          tPaymentMethod === 'bank'
                            ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        🏦 Bank Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setTPaymentMethod('cash')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          tPaymentMethod === 'cash'
                            ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        💵 Cash in Hand
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional Bank Details */}
                {tPaymentMethod === 'bank' && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                    <div className="text-xs font-bold text-blue-900">Faculty Bank Account Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 block mb-1">Bank Name</label>
                        <CustomTextInput
                          value={tBankName}
                          onChange={setTBankName}
                          placeholder="e.g. Meezan Bank / HBL"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Title</label>
                        <CustomTextInput
                          value={tAccountTitle}
                          onChange={setTAccountTitle}
                          placeholder="e.g. Prof. Tariq Mahmood"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-600 block mb-1">Account / IBAN</label>
                        <CustomTextInput
                          value={tAccountNumber}
                          onChange={setTAccountNumber}
                          placeholder="e.g. PK44MEZN00..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  disabled={isSubmittingTeacher}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTeacher}
                  className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingTeacher && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTeacher ? 'Save Changes' : 'Register Faculty'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINT DATE RANGE SIGN-IN REGISTER ================= */}
      {isPrintModalOpen && (
        <div 
          onClick={() => setIsPrintModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 relative space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0B462C] flex items-center justify-center border border-emerald-200">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Print Daily Sign-In Register
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Generate multi-day printable A4 register sheets
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Range Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Quick Duration Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 7, 30, 1].map((days) => {
                  const isSelected = printPresetDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setPrintDays(days)}
                      className={`px-2 py-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-[#0B462C] ring-2 ring-emerald-500/20 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {days === 1 ? '1 Day' : `${days} Days`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  From Date
                </label>
                <CustomDatePicker
                  value={printStartDate}
                  onChange={(val) => {
                    setPrintStartDate(val);
                    setPrintPresetDays(null);
                  }}
                  allowClear={false}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  To Date
                </label>
                <CustomDatePicker
                  value={printEndDate}
                  onChange={(val) => {
                    setPrintEndDate(val);
                    setPrintPresetDays(null);
                  }}
                  allowClear={false}
                />
              </div>
            </div>

            {/* Staff Filter */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Staff Category
              </label>
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPrintCategory('all')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                    printCategory === 'all'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All Staff
                </button>
                <button
                  type="button"
                  onClick={() => setPrintCategory('teaching')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                    printCategory === 'teaching'
                      ? 'bg-white text-[#0B462C] shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Faculty Only
                </button>
                <button
                  type="button"
                  onClick={() => setPrintCategory('non_teaching')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                    printCategory === 'non_teaching'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Non-Teaching
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPrintModalOpen(false);
                  window.open(`/attendance/print?startDate=${printStartDate}&endDate=${printEndDate}&type=${printCategory}`, '_blank');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#C5A059]" />
                <span>Open & Print Register Sheets</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap,
  UserPlus,
  RefreshCw,
  Search,
  Award,
  Clock,
  MapPin,
  Edit3,
  X,
  Camera,
  AlertCircle,
  CheckCircle2,
  Trash2,
  PhoneCall,
  Mail,
  Users,
  Gift,
  Wallet,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle,
  Briefcase,
  Plus,
  Building2
} from 'lucide-react';
import { api, User, Teacher, TeacherAllowance, StaffMember, AdvanceSalaryRequest } from '@/lib/api';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import CustomNumberInput from '@/components/CustomNumberInput';
import CustomTextInput from '@/components/CustomTextInput';

interface PrincipalDashboardProps {
  currentUser?: User | null;
}

export default function PrincipalDashboard({ currentUser }: PrincipalDashboardProps) {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [activeRosterTab, setActiveRosterTab] = useState<'teaching' | 'non_teaching'>('teaching');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Staff Management Modal State
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

  // Teacher Management Modal State
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
  const [tAllowances, setTAllowances] = useState<TeacherAllowance[]>([]);
  const [newAllowanceTitle, setNewAllowanceTitle] = useState<string>('');
  const [newAllowanceAmount, setNewAllowanceAmount] = useState<string>('');
  const [tProfilePictureFile, setTProfilePictureFile] = useState<File | null>(null);
  const [tPreviewPictureUrl, setTPreviewPictureUrl] = useState<string | null>(null);
  const [isSubmittingTeacher, setIsSubmittingTeacher] = useState<boolean>(false);
  const [teacherFormError, setTeacherFormError] = useState<string | null>(null);
  const [teacherFormSuccess, setTeacherFormSuccess] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  
  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Advance Salary Approvals Desk State
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceSalaryRequest[]>([]);
  const [isAdvReviewModalOpen, setIsAdvReviewModalOpen] = useState<boolean>(false);
  const [selectedAdvForReview, setSelectedAdvForReview] = useState<AdvanceSalaryRequest | null>(null);
  const [advReviewAction, setAdvReviewAction] = useState<'approve' | 'reject'>('approve');
  const [advReviewRemarks, setAdvReviewRemarks] = useState<string>('');
  const [advRejectionReason, setAdvRejectionReason] = useState<string>('');
  const [isSubmittingAdvReview, setIsSubmittingAdvReview] = useState<boolean>(false);
  const [advReviewError, setAdvReviewError] = useState<string | null>(null);
  const [advReviewSuccess, setAdvReviewSuccess] = useState<string | null>(null);

  // Fetch Teachers, Staff Members, and Advance Requests
  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [teachRes, staffRes, advRes]: any = await Promise.all([
        api.get('/teachers').catch(() => ({ data: [] })),
        api.get('/staff-members').catch(() => ({ data: [] })),
        api.get('/advance-salary-requests').catch(() => ({ requests: [] })),
      ]);
      const teachData = teachRes?.data || teachRes;
      setTeachers(Array.isArray(teachData) ? teachData : (teachData?.data || []));

      const staffData = staffRes?.data || staffRes;
      setStaffMembers(Array.isArray(staffData) ? staffData : (staffData?.data || []));

      if (advRes?.requests) {
        setAdvanceRequests(advRes.requests);
      }
    } catch (err) {
      console.error('Failed to load Principal dashboard data:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const openAdvReviewModal = (adv: AdvanceSalaryRequest, action: 'approve' | 'reject') => {
    setSelectedAdvForReview(adv);
    setAdvReviewAction(action);
    setAdvReviewRemarks(action === 'approve' ? 'Approved by Principal' : '');
    setAdvRejectionReason('');
    setAdvReviewError(null);
    setIsAdvReviewModalOpen(true);
  };

  const handleProcessAdvReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvForReview) return;

    if (advReviewAction === 'reject' && !advRejectionReason.trim()) {
      setAdvReviewError('Please specify the reason for rejecting this advance salary request.');
      return;
    }

    setIsSubmittingAdvReview(true);
    setAdvReviewError(null);

    try {
      if (advReviewAction === 'approve') {
        const res: any = await api.post(`/advance-salary-requests/${selectedAdvForReview.id}/approve`, {
          remarks: advReviewRemarks.trim() || 'Approved by Principal',
        });
        setAdvReviewSuccess(res?.message || 'Advance salary approved.');
      } else {
        const res: any = await api.post(`/advance-salary-requests/${selectedAdvForReview.id}/reject`, {
          rejection_reason: advRejectionReason.trim(),
          remarks: advReviewRemarks.trim() || null,
        });
        setAdvReviewSuccess(res?.message || 'Advance salary rejected.');
      }

      setIsAdvReviewModalOpen(false);
      fetchData(true);
      setTimeout(() => setAdvReviewSuccess(null), 5000);
    } catch (err: any) {
      setAdvReviewError(err?.message || 'Failed to process advance review.');
    } finally {
      setIsSubmittingAdvReview(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    setTAllowances([]);
    setNewAllowanceTitle('');
    setNewAllowanceAmount('');
    setTProfilePictureFile(null);
    setTPreviewPictureUrl(null);
    setTeacherFormError(null);
    setTeacherFormSuccess(null);
    setIsTeacherModalOpen(true);
  };

  const openEditTeacherModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTName(teacher.name || '');
    setTEmail(teacher.user?.email || '');
    setTFatherName(teacher.father_name || '');
    setTCnic(teacher.cnic || '');
    setTContactNumber(teacher.contact_number || '');
    setTEmergencyNumber(teacher.emergency_number || '');
    setTQualification(teacher.qualification || '');
    setTTeachingSince(teacher.teaching_since || '');
    setTCity(teacher.city || '');
    setTAddress(teacher.address || '');
    setTDateOfJoining(teacher.date_of_joining || '');
    setTSalary(teacher.salary ? String(teacher.salary) : '');
    setTPaymentMethod(teacher.payment_method || 'bank');
    setTBankName(teacher.bank_name || '');
    setTAccountTitle(teacher.account_title || '');
    setTAccountNumber(teacher.account_number || '');
    setTStatus(teacher.status || 'active');
    setTAllowances(Array.isArray(teacher.allowances) ? teacher.allowances : []);
    setNewAllowanceTitle('');
    setNewAllowanceAmount('');
    setTProfilePictureFile(null);
    setTPreviewPictureUrl(teacher.profile_picture_url || null);
    setTeacherFormError(null);
    setTeacherFormSuccess(null);
    setIsTeacherModalOpen(true);
  };

  const handleAddAllowanceRow = () => {
    if (!newAllowanceTitle.trim() || !newAllowanceAmount) return;
    const amountNum = parseFloat(newAllowanceAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    setTAllowances([...tAllowances, { title: newAllowanceTitle.trim(), amount: amountNum }]);
    setNewAllowanceTitle('');
    setNewAllowanceAmount('');
  };

  const handleRemoveAllowanceRow = (index: number) => {
    setTAllowances(tAllowances.filter((_, i) => i !== index));
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherFormError(null);
    setTeacherFormSuccess(null);

    if (!tName.trim()) {
      setTeacherFormError('Teacher full name is required.');
      return;
    }
    if (!tEmail.trim()) {
      setTeacherFormError('Teacher email address is required for portal access.');
      return;
    }

    setIsSubmittingTeacher(true);
    try {
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
      formData.append('allowances', JSON.stringify(tAllowances));

      if (tProfilePictureFile) {
        formData.append('profile_picture', tProfilePictureFile);
      }

      if (editingTeacher) {
        await api.postFormData(`/teachers/${editingTeacher.id}`, formData);
        setTeacherFormSuccess(`Teacher ${tName} updated successfully.`);
      } else {
        await api.postFormData('/teachers', formData);
        setTeacherFormSuccess(`Teacher ${tName} registered successfully.`);
      }

      await fetchData(true);
      setTimeout(() => {
        setIsTeacherModalOpen(false);
        setTeacherFormSuccess(null);
      }, 1200);
    } catch (err: any) {
      setTeacherFormError(err.response?.data?.message || err.message || 'Failed to save teacher.');
    } finally {
      setIsSubmittingTeacher(false);
    }
  };

  const handleUpdateTeacherStatus = async (teacher: Teacher, newStatus: 'active' | 'on_leave' | 'inactive') => {
    setTogglingId(teacher.id);

    // Optimistic update
    setTeachers((prev) =>
      prev.map((t) => (t.id === teacher.id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.post(`/teachers/${teacher.id}/status`, { status: newStatus });
    } catch (err) {
      console.error('Failed to update teacher status:', err);
      fetchData(true);
    } finally {
      setTogglingId(null);
    }
  };

  const promptDeleteTeacher = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.delete(`/teachers/${teacherToDelete.id}`);
      setTeachers((prev) => prev.filter((t) => t.id !== teacherToDelete.id));
      if (isTeacherModalOpen && editingTeacher?.id === teacherToDelete.id) {
        setIsTeacherModalOpen(false);
      }
      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to remove faculty member.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter teachers by search query and status
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        (t.father_name && t.father_name.toLowerCase().includes(query)) ||
        (t.cnic && t.cnic.toLowerCase().includes(query)) ||
        (t.contact_number && t.contact_number.toLowerCase().includes(query)) ||
        (t.qualification && t.qualification.toLowerCase().includes(query)) ||
        (t.user?.email && t.user.email.toLowerCase().includes(query)) ||
        (t.city && t.city.toLowerCase().includes(query));

      const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [teachers, searchQuery, selectedStatus]);

  const filteredStaff = useMemo(() => {
    return staffMembers.filter((s) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        s.name.toLowerCase().includes(query) ||
        (s.designation && s.designation.toLowerCase().includes(query)) ||
        (s.father_name && s.father_name.toLowerCase().includes(query)) ||
        (s.cnic && s.cnic.toLowerCase().includes(query)) ||
        (s.contact_number && s.contact_number.toLowerCase().includes(query)) ||
        (s.user?.email && s.user.email.toLowerCase().includes(query)) ||
        (s.city && s.city.toLowerCase().includes(query));

      const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [staffMembers, searchQuery, selectedStatus]);

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

  const openEditStaffModal = (staff: StaffMember) => {
    const isPrincipalProfile = (staff.user && staff.user.role === 'principal') 
      || (staff.designation && staff.designation.toLowerCase().includes('principal'));

    if (isPrincipalProfile && currentUser?.role === 'principal') {
      alert('The Principal profile is protected and can only be edited by the Executive Director.');
      return;
    }

    setEditingStaff(staff);
    setStaffName(staff.name || '');
    setStaffDesignation(staff.designation || '');
    setStaffEmail(staff.user?.email || '');
    setStaffFatherName(staff.father_name || '');
    setStaffCnic(staff.cnic || '');
    setStaffContact(staff.contact_number || '');
    setStaffEmergency(staff.emergency_number || '');
    setStaffAddress(staff.address || '');
    setStaffCity(staff.city || '');
    setStaffDateOfJoining(staff.date_of_joining ? String(staff.date_of_joining).substring(0, 10) : '');
    setStaffSalary(staff.salary ? String(staff.salary) : '');
    setStaffPaymentMethod(staff.payment_method || 'cash');
    setStaffBankName(staff.bank_name || '');
    setStaffAccountTitle(staff.account_title || '');
    setStaffAccountNumber(staff.account_number || '');
    setStaffStatus(staff.status || 'active');
    setStaffPictureFile(null);
    setStaffPicturePreview(staff.profile_picture_url || null);
    setStaffModalError(null);
    setIsStaffModalOpen(true);
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
      fetchData(true);
    } catch (err: any) {
      setStaffModalError(err.message || 'Failed to save staff member.');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const statusDropdownOptions: DropdownOption[] = [
    { value: 'all', label: 'All Faculty' },
    { value: 'active', label: 'Active Faculty' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'inactive', label: 'Inactive / Suspended' },
  ];

  return (
    <div className="space-y-5 pb-12">
      
      {/* ================= TOP TITLE & ACTION BAR ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-gray-900">Principal Desk</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0B462C] border border-emerald-200 uppercase">
              Executive
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Welcome, <strong className="text-gray-700">{currentUser?.name || 'Principal'}</strong>
          </p>
        </div>

        {/* Quick Action Button: Add Teacher & Bonus Report */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.open('/payroll/bonuses', '_blank')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition cursor-pointer shadow-2xs"
            title="View Executive Bonus & Incentive Ledger"
          >
            <Gift className="w-4 h-4 text-amber-700" />
            <span>Bonus Report</span>
          </button>

          <button
            onClick={openAddTeacherModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#C5A059]" />
            <span>Add Teacher</span>
          </button>

          <button
            onClick={openAddStaffModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-100 font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <Briefcase className="w-4 h-4 text-amber-300" />
            <span>Add Staff</span>
          </button>

          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ================= ROSTER & SEARCH CONTAINER ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs space-y-5">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B462C] flex items-center justify-center border border-emerald-100">
              {activeRosterTab === 'teaching' ? <GraduationCap className="w-5 h-5" /> : <Briefcase className="w-5 h-5 text-amber-800" />}
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">
                {activeRosterTab === 'teaching' ? 'Faculty & Teachers Registry' : 'Non-Teaching & Administrative Staff'}
              </h2>
              <p className="text-xs text-gray-500">
                {activeRosterTab === 'teaching' 
                  ? 'Manage school faculty members, personal records, and compensation' 
                  : 'Principal, HR Officer, Accountant, Office staff, and Security personnel'}
              </p>
            </div>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-[#0B462C] font-extrabold border border-emerald-200">
              {activeRosterTab === 'teaching' ? teachers.length : staffMembers.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, CNIC, email, contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#0B462C] focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Sub-Desk Tabs: Teaching Faculty vs Non-Teaching Staff */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveRosterTab('teaching')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeRosterTab === 'teaching'
                ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Teaching Faculty ({teachers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRosterTab('non_teaching')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeRosterTab === 'non_teaching'
                ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Non-Teaching & Admin Staff ({staffMembers.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: TEACHING FACULTY ================= */}
        {activeRosterTab === 'teaching' && (
          <>
            {isLoading ? (
              <div className="p-16 text-center text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0B462C]" />
                <p className="text-sm font-semibold">Loading faculty registry...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#0B462C] flex items-center justify-center mx-auto border border-emerald-100">
                  <Users className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">No Teachers Found</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {searchQuery 
                      ? 'No faculty members match your search criteria. Try a different query.' 
                      : 'No faculty members registered yet. Click "Add Teacher" above to onboard your first faculty member.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={openAddTeacherModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B462C] text-white font-bold text-xs hover:bg-[#062E1C] transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-[#C5A059]" />
                    <span>Add First Teacher</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map((teacher) => {
                  const gross = Number(teacher.gross_salary || (Number(teacher.salary || 0) + Number(teacher.total_allowances || 0)));
                  return (
                    <div 
                      key={teacher.id}
                      className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Top: Avatar & Basic Details */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0B462C] to-emerald-800 text-[#E8D4A2] flex items-center justify-center font-black text-base shrink-0 overflow-hidden relative border border-emerald-100">
                              {teacher.profile_picture_url ? (
                                <img 
                                  src={teacher.profile_picture_url} 
                                  alt={teacher.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <span>{teacher.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-black text-gray-900 leading-tight truncate" title={teacher.name}>
                                {teacher.name}
                              </h4>
                              {teacher.father_name && (
                                <p className="text-[11px] text-gray-400 font-medium truncate">
                                  S/O {teacher.father_name}
                                </p>
                              )}
                              <p className="text-[11px] text-gray-500 font-semibold truncate" title={teacher.user?.email}>
                                {teacher.user?.email}
                              </p>
                            </div>
                          </div>

                          {/* Interactive Status Selector */}
                          <div className="relative inline-flex items-center shrink-0">
                            <select
                              value={teacher.status}
                              onChange={(e) => handleStatusChange(teacher.id, e.target.value as any)}
                              disabled={togglingId === teacher.id}
                              className={`text-[11px] font-black uppercase tracking-wider py-1 pl-2.5 pr-6 rounded-xl border outline-hidden transition cursor-pointer appearance-none ${
                                teacher.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : teacher.status === 'on_leave'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              } ${togglingId === teacher.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <option value="active">Active</option>
                              <option value="on_leave">On Leave</option>
                              <option value="inactive">Inactive</option>
                            </select>
                            <span className="pointer-events-none absolute right-2 text-gray-400 text-[10px]">▼</span>
                          </div>
                        </div>

                        {/* Badges / Meta Info */}
                        <div className="flex flex-wrap gap-1.5">
                          {teacher.qualification && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                              <Award className="w-3 h-3 text-[#0B462C]" />
                              <span>{teacher.qualification}</span>
                            </span>
                          )}
                          {teacher.teaching_since && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>Since {teacher.teaching_since}</span>
                            </span>
                          )}
                          {teacher.city && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-lg">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{teacher.city}</span>
                            </span>
                          )}
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-1 text-xs text-gray-600 pt-1 border-t border-gray-100">
                          {teacher.contact_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">Contact:</span>
                              <span className="font-semibold text-gray-800">{teacher.contact_number}</span>
                            </div>
                          )}
                          {teacher.emergency_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">Emergency:</span>
                              <span className="font-semibold text-gray-800">{teacher.emergency_number}</span>
                            </div>
                          )}
                          {teacher.cnic && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">CNIC:</span>
                              <span className="font-semibold text-gray-700">{teacher.cnic}</span>
                            </div>
                          )}
                          {teacher.date_of_joining && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">Joining Date:</span>
                              <span className="font-semibold text-gray-700">{teacher.date_of_joining}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Compensation & Edit Button */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Monthly Gross
                          </span>
                          <div className="text-sm font-black text-[#0B462C]">
                            PKR {gross.toLocaleString()}
                          </div>
                          {Number(teacher.total_allowances || 0) > 0 && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              (Base: {Number(teacher.salary).toLocaleString()} + Allowances)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => window.open(`/teachers/ledger?id=${teacher.id}&type=teacher`, '_blank')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0B462C] font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title={`Open Financial Ledger for ${teacher.name}`}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0B462C]" />
                            <span>Ledger</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditTeacherModal(teacher)}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => promptDeleteTeacher(teacher)}
                            title={`Delete ${teacher.name}`}
                            className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: NON-TEACHING & ADMIN STAFF ================= */}
        {activeRosterTab === 'non_teaching' && (
          <>
            {isLoading ? (
              <div className="p-16 text-center text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-800" />
                <p className="text-sm font-semibold">Loading staff registry...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto border border-amber-200">
                  <Briefcase className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900">No Staff Members Found</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    {searchQuery 
                      ? 'No staff members match your search criteria. Try a different keyword.' 
                      : 'No non-teaching staff members registered yet. Click "Add Staff" above to onboard.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={openAddStaffModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Add First Staff Member</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStaff.map((staff) => {
                  const isPrincipalProfile = (staff.user && staff.user.role === 'principal') 
                    || (staff.designation && staff.designation.toLowerCase().includes('principal'));
                  const isLockedForPrincipal = isPrincipalProfile && currentUser?.role === 'principal';
                  const salaryNum = Number(staff.salary || 0);

                  return (
                    <div 
                      key={staff.id}
                      className="bg-white rounded-3xl p-5 border border-gray-200/90 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Top: Avatar & Basic Details */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 flex items-center justify-center font-black text-base shrink-0 overflow-hidden relative border border-amber-200">
                              {staff.profile_picture_url ? (
                                <img 
                                  src={staff.profile_picture_url} 
                                  alt={staff.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <span>{staff.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-black text-gray-900 leading-tight truncate" title={staff.name}>
                                {staff.name}
                              </h4>
                              <p className="text-xs font-bold text-amber-900 truncate">
                                {staff.designation || 'Staff Member'}
                              </p>
                              {staff.father_name && (
                                <p className="text-[11px] text-gray-400 font-medium truncate">
                                  S/O {staff.father_name}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl border ${
                            staff.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : staff.status === 'on_leave'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}>
                            {staff.status === 'active' ? 'Active' : staff.status === 'on_leave' ? 'On Leave' : 'Inactive'}
                          </span>
                        </div>

                        {/* Contact & Banking Information */}
                        <div className="space-y-1 text-xs text-gray-600 pt-1 border-t border-gray-100">
                          {staff.contact_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">Contact:</span>
                              <span className="font-semibold text-gray-800">{staff.contact_number}</span>
                            </div>
                          )}
                          {staff.emergency_number && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">Emergency:</span>
                              <span className="font-semibold text-gray-800">{staff.emergency_number}</span>
                            </div>
                          )}
                          {staff.cnic && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">CNIC:</span>
                              <span className="font-semibold text-gray-700">{staff.cnic}</span>
                            </div>
                          )}
                          {staff.date_of_joining && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[11px]">Joining Date:</span>
                              <span className="font-semibold text-gray-700">{String(staff.date_of_joining).substring(0, 10)}</span>
                            </div>
                          )}
                          {staff.bank_name && (
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              <span className="text-blue-700 font-bold flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {staff.bank_name}
                              </span>
                              <span className="font-mono text-gray-500 truncate max-w-[140px]">{staff.account_number}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Compensation & Edit / Authority Actions */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Base Salary
                          </span>
                          <div className="text-sm font-black text-[#0B462C]">
                            PKR {salaryNum.toLocaleString()}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {staff.payment_method === 'bank' ? '🏦 Bank Transfer' : '💵 Cash Counter'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => window.open(`/teachers/ledger?id=${staff.id}&type=staff`, '_blank')}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title={`Open Financial Ledger for ${staff.name}`}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-800" />
                            <span>Ledger</span>
                          </button>

                          {isLockedForPrincipal ? (
                            <div 
                              className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                              title="Principal profile is protected and can only be updated by the Executive Director"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Director Only</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditStaffModal(staff)}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                              title={`Edit ${staff.name}`}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* ================= MODAL: REGISTER / EDIT FACULTY TEACHER ================= */}
      {isTeacherModalOpen && (
        <div 
          onClick={() => setIsTeacherModalOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-150 my-8 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#0B462C]" />
                  {editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : 'Register New Faculty Teacher'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingTeacher 
                    ? 'Update teacher profile, salary, and allowances' 
                    : 'Add teacher personal details, credentials, compensation and create their login account'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Alerts */}
            {teacherFormError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{teacherFormError}</span>
              </div>
            )}

            {teacherFormSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{teacherFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-6">
              
              {/* Photo & Basic Details */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-700 to-[#0B462C] text-white flex items-center justify-center font-black text-2xl shadow-sm overflow-hidden border border-white">
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
                    htmlFor="t-modal-photo"
                    className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-white shadow-md transition cursor-pointer"
                    title="Upload Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </label>
                  <input 
                    id="t-modal-photo"
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

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-900">Faculty Portrait Photo</h4>
                  <p className="text-[11px] text-gray-500">
                    Upload an official photograph (JPG, PNG or WEBP up to 8MB).
                  </p>
                </div>
              </div>

              {/* Personal Identification Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Teacher Full Name *
                  </label>
                  <CustomTextInput
                    value={tName}
                    onChange={setTName}
                    placeholder="e.g. Muhammad Aslam"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Portal Login Email *
                  </label>
                  <CustomTextInput
                    type="email"
                    value={tEmail}
                    onChange={setTEmail}
                    placeholder="e.g. aslam@gmail.com"
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
                    CNIC (National ID)
                  </label>
                  <CustomTextInput
                    value={tCnic}
                    onChange={setTCnic}
                    placeholder="e.g. 35102-1234567-1"
                  />
                </div>

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
                    Qualification
                  </label>
                  <CustomTextInput
                    value={tQualification}
                    onChange={setTQualification}
                    placeholder="e.g. M.Sc Mathematics, B.Ed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Teaching Since (Year)
                  </label>
                  <CustomTextInput
                    value={tTeachingSince}
                    onChange={setTTeachingSince}
                    placeholder="e.g. 2018 or 5 Years"
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

              {/* Employment & Compensation Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-gray-100">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Date of Joining
                  </label>
                  <CustomDatePicker
                    value={tDateOfJoining}
                    onChange={setTDateOfJoining}
                    placeholder="Select joining date"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Base Salary (PKR)
                  </label>
                  <CustomNumberInput
                    value={tSalary}
                    onChange={setTSalary}
                    placeholder="e.g. 45000"
                    min={0}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Faculty Status & Login Clearance
                  </label>
                  <CustomDropdown
                    value={tStatus}
                    options={[
                      { value: 'active', label: 'Active Faculty (Can Login)' },
                      { value: 'on_leave', label: 'On Leave (Can Login)' },
                      { value: 'inactive', label: 'Inactive / Suspended (No Login)' },
                    ]}
                    onChange={(val) => setTStatus(val as 'active' | 'on_leave' | 'inactive')}
                  />
                </div>
              </div>

              {/* Payment Method & Bank Details */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Salary Disbursement Method
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

                {tPaymentMethod === 'bank' && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
                    <div className="text-xs font-bold text-blue-900">Bank Account Details</div>
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

              {/* Dynamic Optional Allowances Section */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Optional Allowances</h4>
                    <p className="text-[11px] text-gray-500">Add custom allowances (e.g. Transport, Medical, House Rent)</p>
                  </div>
                  {tAllowances.length > 0 && (
                    <span className="text-xs font-bold text-[#0B462C]">
                      Total: PKR {tAllowances.reduce((acc, a) => acc + (a.amount || 0), 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Existing allowances list */}
                {tAllowances.length > 0 && (
                  <div className="space-y-2">
                    {tAllowances.map((al, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-gray-200 text-xs">
                        <span className="font-bold text-gray-800">{al.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#0B462C]">PKR {Number(al.amount).toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAllowanceRow(idx)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                            title="Remove Allowance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new allowance row */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <div className="flex-1 w-full">
                    <CustomTextInput
                      value={newAllowanceTitle}
                      onChange={setNewAllowanceTitle}
                      placeholder="Allowance Title (e.g. Transport)"
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <CustomNumberInput
                      value={newAllowanceAmount}
                      onChange={setNewAllowanceAmount}
                      placeholder="Amount (PKR)"
                      min={0}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAllowanceRow}
                    disabled={!newAllowanceTitle.trim() || !newAllowanceAmount}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                {editingTeacher ? (
                  <button
                    type="button"
                    onClick={() => promptDeleteTeacher(editingTeacher)}
                    disabled={isSubmittingTeacher}
                    className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Faculty</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
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
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: CUSTOM DELETE TEACHER CONFIRMATION ================= */}
      {isDeleteModalOpen && teacherToDelete && (
        <div 
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5 animate-in fade-in zoom-in duration-150"
          >
            <button
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* School Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 relative shrink-0">
                <Image
                  src="/logo.png"
                  alt="NSSE Logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-xs font-black text-[#0B462C] font-cinzel tracking-wider uppercase">
                  Nawaz Sharif
                </div>
                <div className="text-[10px] font-bold text-[#C5A059] font-cinzel tracking-wider uppercase">
                  School of Eminence
                </div>
              </div>
            </div>

            {/* Warning Icon & Title */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900 leading-snug">
                  Remove Faculty Member?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to permanently delete this faculty record? This will revoke their school portal access immediately.
                </p>
              </div>
            </div>

            {/* Target Teacher Card Summary */}
            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B462C] text-[#E8D4A2] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden relative">
                {teacherToDelete.profile_picture_url ? (
                  <img src={teacherToDelete.profile_picture_url} alt={teacherToDelete.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{teacherToDelete.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-gray-900 truncate">{teacherToDelete.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{teacherToDelete.user?.email || 'No email registered'}</div>
                {teacherToDelete.qualification && (
                  <div className="text-[10px] text-[#0B462C] font-bold mt-0.5 truncate">{teacherToDelete.qualification}</div>
                )}
              </div>
            </div>

            {/* Error message */}
            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTeacher}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeleting ? 'Removing...' : 'Yes, Delete Faculty'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADVANCE SALARY REVIEW (APPROVE / REJECT) ================= */}
      {isAdvReviewModalOpen && selectedAdvForReview && (
        <div 
          onClick={() => setIsAdvReviewModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-150 relative"
          >
            <button
              onClick={() => setIsAdvReviewModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Wallet className={`w-5 h-5 ${advReviewAction === 'approve' ? 'text-emerald-700' : 'text-rose-700'}`} />
                <span>
                  {advReviewAction === 'approve' ? 'Approve Advance Salary Request' : 'Reject Advance Salary Request'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Executive Action by Principal / Administration
              </p>
            </div>

            {/* Request Summary Box */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Applicant:</span>
                <span className="font-bold text-gray-900">{selectedAdvForReview.staff_name} ({selectedAdvForReview.designation})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Requested Amount:</span>
                <span className="font-mono font-black text-blue-900 text-sm">PKR {Number(selectedAdvForReview.amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Repayment Plan:</span>
                <span className="font-semibold text-gray-700">{selectedAdvForReview.repayment_plan || 'Monthly Payroll Deduction'}</span>
              </div>
              <div className="pt-1 border-t border-gray-200">
                <span className="text-gray-500 block text-[11px]">Reason / Purpose:</span>
                <span className="font-medium text-gray-800 text-xs italic">"{selectedAdvForReview.reason}"</span>
              </div>
            </div>

            {advReviewError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{advReviewError}</span>
              </div>
            )}

            <form onSubmit={handleProcessAdvReview} className="space-y-4">
              {advReviewAction === 'approve' ? (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Approval Remarks / Disbursement Notes
                  </label>
                  <CustomTextInput
                    value={advReviewRemarks}
                    onChange={setAdvReviewRemarks}
                    placeholder="e.g. Approved for disbursement with August salary"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={advRejectionReason}
                    onChange={(e) => setAdvRejectionReason(e.target.value)}
                    placeholder="e.g. Request exceeds policy limit / Outstanding previous balance / Please re-apply next month"
                    rows={3}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdvReviewModalOpen(false)}
                  disabled={isSubmittingAdvReview}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdvReview}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                    advReviewAction === 'approve'
                      ? 'bg-[#0B462C] hover:bg-[#062E1C]'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmittingAdvReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{advReviewAction === 'approve' ? 'Confirm Approval ✓' : 'Confirm Rejection ✗'}</span>
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
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative space-y-6 max-h-[92vh] overflow-y-auto my-8 animate-in fade-in zoom-in duration-150"
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
                  {editingStaff ? 'Update employee profile, salary, and payment method' : 'Add employee personal details, designation, and compensation'}
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
                    placeholder="e.g. Talib Hussain"
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
                    placeholder="e.g. Senior Accountant & Finance Manager"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Emergency Contact
                  </label>
                  <CustomTextInput
                    type="tel"
                    value={staffEmergency}
                    onChange={setStaffEmergency}
                    placeholder="e.g. 0321-7654321"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Father's / Spouse Name
                  </label>
                  <CustomTextInput
                    value={staffFatherName}
                    onChange={setStaffFatherName}
                    placeholder="e.g. Muhammad Aslam"
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
                    placeholder="e.g. 70000"
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
                        placeholder="e.g. Bank of Punjab (BOP)"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Account Title</label>
                      <CustomTextInput
                        value={staffAccountTitle}
                        onChange={setStaffAccountTitle}
                        placeholder="e.g. Talib Hussain"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">Account / IBAN Number</label>
                      <CustomTextInput
                        value={staffAccountNumber}
                        onChange={setStaffAccountNumber}
                        placeholder="e.g. PK88BPUN..."
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Date of Joining
                  </label>
                  <CustomDatePicker
                    value={staffDateOfJoining}
                    onChange={setStaffDateOfJoining}
                  />
                </div>

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
                    Portal Login Email
                  </label>
                  <CustomTextInput
                    type="email"
                    value={staffEmail}
                    onChange={setStaffEmail}
                    placeholder="accountant@nsse.edu.pk"
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

              {/* Status Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Employment Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'on_leave', 'inactive'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStaffStatus(st)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer capitalize ${
                        staffStatus === st
                          ? st === 'active'
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs'
                            : st === 'on_leave'
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                            : 'bg-rose-50 border-rose-400 text-rose-900 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {st === 'active' ? '🟢 Active' : st === 'on_leave' ? '🟡 On Leave' : '🔴 Inactive'}
                    </button>
                  ))}
                </div>
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
                  <span>{editingStaff ? 'Save Changes' : 'Onboard Staff'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

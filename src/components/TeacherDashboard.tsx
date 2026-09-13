'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  api, 
  User, 
  Teacher, 
  PayrollItem, 
  AdvanceSalaryRequest,
  LeaveRequest,
  formatDisplayDate
} from '@/lib/api';
import CustomTextInput from '@/components/CustomTextInput';
import CustomNumberInput from '@/components/CustomNumberInput';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import { 
  GraduationCap, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Calendar, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Camera, 
  Save, 
  Building2, 
  Sparkles,
  Award,
  PhoneCall,
  Clock,
  Wallet,
  FileSpreadsheet,
  FileText,
  Plus,
  CheckCircle,
  X,
  ExternalLink,
  Printer,
  Lock,
  DollarSign
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser?: User | null;
}

const LEAVE_CATEGORY_OPTIONS: DropdownOption[] = [
  { value: 'casual', label: 'Casual Leave (Routine personal / domestic matters)' },
  { value: 'sick', label: 'Sick / Medical Leave (Illness / medical recovery)' },
  { value: 'emergency', label: 'Emergency Leave (Unforeseen family emergencies)' },
  { value: 'annual', label: 'Annual / Scheduled Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'other', label: 'Other Official Grounds' },
];

export default function TeacherDashboard({ currentUser }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'ledger' | 'advances' | 'leaves'>('profile');
  const [profile, setProfile] = useState<Teacher | null>(null);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceSalaryRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  // Advance Salary Modal States
  const [isAdvModalOpen, setIsAdvModalOpen] = useState<boolean>(false);
  const [advAmount, setAdvAmount] = useState<string>('');
  const [advReason, setAdvReason] = useState<string>('');
  const [advRepaymentPlan, setAdvRepaymentPlan] = useState<string>('Deduct from next month salary');
  const [isSubmittingAdv, setIsSubmittingAdv] = useState<boolean>(false);
  const [advError, setAdvError] = useState<string | null>(null);
  const [advSuccess, setAdvSuccess] = useState<string | null>(null);

  // Leave Request Modal States
  const [leaveMonth, setLeaveMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<string>('casual');
  const [leaveStartDate, setLeaveStartDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [leaveEndDate, setLeaveEndDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [isSubmittingLeave, setIsSubmittingLeave] = useState<boolean>(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [cnic, setCnic] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [emergencyNumber, setEmergencyNumber] = useState<string>('');
  const [qualification, setQualification] = useState<string>('');
  const [teachingSince, setTeachingSince] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [previewPictureUrl, setPreviewPictureUrl] = useState<string | null>(null);

  const fetchLeavesForMonth = async (selectedMonth: string) => {
    try {
      const res: any = await api.get(`/leave-requests/my?month=${selectedMonth}`);
      if (res?.data) {
        setLeaveRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaves for month', err);
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [profRes, ledgerRes, advRes, leaveRes]: any = await Promise.all([
        api.get('/teacher/me'),
        api.get('/teacher/my-ledger').catch(() => null),
        api.get('/advance-salary-requests/my').catch(() => null),
        api.get(`/leave-requests/my?month=${leaveMonth}`).catch(() => null),
      ]);

      const data: Teacher = profRes?.data || profRes;
      setProfile(data);

      setName(data.name || currentUser?.name || '');
      setEmail(data.user?.email || currentUser?.email || '');
      setFatherName(data.father_name || '');
      setCnic(data.cnic || '');
      setContactNumber(data.contact_number || '');
      setEmergencyNumber(data.emergency_number || '');
      setQualification(data.qualification || '');
      setTeachingSince(data.teaching_since || '');
      setCity(data.city || '');
      setAddress(data.address || '');
      setPreviewPictureUrl(data.profile_picture_url || null);

      if (ledgerRes?.payrolls) {
        setPayrolls(ledgerRes.payrolls);
      }
      if (advRes?.requests) {
        setAdvanceRequests(advRes.requests);
      }
      if (leaveRes?.data) {
        setLeaveRequests(leaveRes.data);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Double-entry computation of Debit, Credit, and Running Balance
  const ledgerEntries = useMemo(() => {
    const sorted = [...payrolls].sort((a, b) => a.month.localeCompare(b.month));
    let cumulativeCredit = 0;
    let cumulativeDebit = 0;

    const withBalance = sorted.map((p) => {
      const credit = Number(p.net_salary || 0);
      const debit = p.status === 'paid' ? credit : 0;
      cumulativeCredit += credit;
      cumulativeDebit += debit;
      const balance = cumulativeCredit - cumulativeDebit;

      return {
        ...p,
        credit,
        debit,
        balance,
      };
    });

    // Retain chronological order (older month at top, proceeding down to latest)
    return withBalance;
  }, [payrolls]);

  const totalCredit = useMemo(() => ledgerEntries.reduce((sum, e) => sum + e.credit, 0), [ledgerEntries]);
  const totalDebit = useMemo(() => ledgerEntries.reduce((sum, e) => sum + e.debit, 0), [ledgerEntries]);
  const currentOutstandingBalance = totalCredit - totalDebit;

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setPreviewPictureUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('father_name', fatherName);
      formData.append('cnic', cnic);
      formData.append('contact_number', contactNumber);
      formData.append('emergency_number', emergencyNumber);
      formData.append('qualification', qualification);
      formData.append('teaching_since', teachingSince);
      formData.append('city', city);
      formData.append('address', address);

      if (profilePictureFile) {
        formData.append('profile_picture', profilePictureFile);
      }

      const res: any = await api.postFormData('/teacher/me', formData);
      setSaveSuccess(res?.message || 'Profile updated successfully.');
      setProfile(res?.data || null);
      if (res?.data?.profile_picture_url) {
        setPreviewPictureUrl(res.data.profile_picture_url);
      }
      setTimeout(() => setSaveSuccess(''), 5000);
    } catch (err: any) {
      console.error('Failed to update profile', err);
      setSaveError(err?.response?.data?.message || err?.message || 'Failed to update profile information.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyAdvanceSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advAmount || parseFloat(advAmount) <= 0) {
      setAdvError('Please enter a valid advance salary amount.');
      return;
    }
    if (!advReason.trim()) {
      setAdvError('Please enter the purpose / reason for this advance salary request.');
      return;
    }

    setIsSubmittingAdv(true);
    setAdvError(null);
    setAdvSuccess(null);

    try {
      const res: any = await api.post('/advance-salary-requests', {
        amount: parseFloat(advAmount),
        reason: advReason.trim(),
        repayment_plan: advRepaymentPlan.trim() || 'Deduct from monthly payroll',
      });

      setAdvSuccess(res?.message || 'Advance salary request submitted successfully.');
      setAdvAmount('');
      setAdvReason('');
      setIsAdvModalOpen(false);

      // Refresh advance requests
      const advRes: any = await api.get('/advance-salary-requests/my');
      if (advRes?.requests) {
        setAdvanceRequests(advRes.requests);
      }
    } catch (err: any) {
      setAdvError(err?.message || 'Failed to submit advance request.');
    } finally {
      setIsSubmittingAdv(false);
    }
  };

  const computedLeaveDays = useMemo(() => {
    if (!leaveStartDate || !leaveEndDate) return 1;
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [leaveStartDate, leaveEndDate]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      setLeaveError('Please state the purpose / reason for your leave application.');
      return;
    }
    if (computedLeaveDays <= 0) {
      setLeaveError('End date must be on or after the start date.');
      return;
    }

    setIsSubmittingLeave(true);
    setLeaveError(null);
    setLeaveSuccess(null);

    try {
      const res: any = await api.post('/leave-requests', {
        leave_type: leaveType,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        reason: leaveReason.trim(),
      });

      setLeaveSuccess(res?.message || 'Leave application submitted for Principal review.');
      setLeaveReason('');
      setIsLeaveModalOpen(false);

      // Refresh leaves for current month
      fetchLeavesForMonth(leaveMonth);
    } catch (err: any) {
      setLeaveError(err?.message || 'Failed to submit leave application.');
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0B462C]" />
        <span className="text-xs font-semibold">Loading Faculty Profile & Records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      
      {/* ================= 🧭 HEADER GREETING & NAVIGATION TABS ================= */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B462C] to-emerald-800 text-[#E8D4A2] flex items-center justify-center font-black text-2xl shadow-sm shrink-0 overflow-hidden relative border-2 border-emerald-100">
              {previewPictureUrl ? (
                <img 
                  src={previewPictureUrl} 
                  alt={name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span>{name.charAt(0) || 'T'}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                  Faculty Member
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 font-semibold">{currentUser?.email}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                Welcome, {name || 'Faculty Member'}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Nawaz Sharif School of Eminence (NSSE) • Chunian Campus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchProfile}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition cursor-pointer"
              title="Refresh Records"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>My Salary & Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advances')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'advances'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Advance Salary Desk</span>
            {activeTab !== 'advances' && advanceRequests.filter(a => a.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'leaves'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Leave Applications</span>
            {activeTab !== 'leaves' && leaveRequests.filter(l => l.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{saveError}</span>
        </div>
      )}

      {advSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{advSuccess}</span>
        </div>
      )}

      {/* ================= TAB 1: 📋 PROFILE FORM ================= */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#0B462C]" />
                Personal Profile & Faculty Records
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Keep your contact, qualification, and personal identification details up to date
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Faculty Profile
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Section 1: Photo & Basic Identification */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-700 to-[#0B462C] text-white flex items-center justify-center font-black text-3xl shadow-sm overflow-hidden border-2 border-white">
                  {previewPictureUrl ? (
                    <img 
                      src={previewPictureUrl} 
                      alt={name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{name.charAt(0) || 'T'}</span>
                  )}
                </div>
                <label 
                  htmlFor="teacher-photo-upload"
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-white shadow-md transition cursor-pointer"
                  title="Change Profile Photo"
                >
                  <Camera className="w-4 h-4" />
                </label>
                <input 
                  id="teacher-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">Faculty Portrait Photo</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Upload an official clear portrait photo (JPG, PNG or WEBP up to 5MB). This photo will appear on your faculty ID and official school communications.
                </p>
              </div>
            </div>

            {/* Section 2: Personal Identification Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <CustomTextInput
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Prof. Tariq Mahmood"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <CustomTextInput
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="e.g. teacher@nsse.edu.pk"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Father's Name
                </label>
                <CustomTextInput
                  value={fatherName}
                  onChange={setFatherName}
                  placeholder="e.g. Abdul Ghafoor"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  CNIC / National ID
                </label>
                <CustomTextInput
                  value={cnic}
                  onChange={setCnic}
                  placeholder="e.g. 35102-1234567-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Mobile / Contact Number
                </label>
                <CustomTextInput
                  type="tel"
                  value={contactNumber}
                  onChange={setContactNumber}
                  placeholder="e.g. 0300-1234567"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Emergency Contact Number
                </label>
                <CustomTextInput
                  type="tel"
                  value={emergencyNumber}
                  onChange={setEmergencyNumber}
                  placeholder="e.g. 0301-7654321"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Highest Qualification
                </label>
                <CustomTextInput
                  value={qualification}
                  onChange={setQualification}
                  placeholder="e.g. M.Phil Physics, M.Sc Mathematics, B.Ed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Teaching Experience / Teaching Since
                </label>
                <CustomTextInput
                  value={teachingSince}
                  onChange={setTeachingSince}
                  placeholder="e.g. 2018 or 6 Years"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  City of Residence
                </label>
                <CustomTextInput
                  value={city}
                  onChange={setCity}
                  placeholder="e.g. Chunian, Kasur"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Residential Address
                </label>
                <CustomTextInput
                  value={address}
                  onChange={setAddress}
                  placeholder="e.g. Street #3, Model Town, Chunian"
                />
              </div>
            </div>

            {/* Compensation & Bank Info (Read-only for Teacher) */}
            {profile && (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0B462C]" />
                  <span>Compensation & Payment Information (Configured by Administration)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">Base Salary:</span>
                    <span className="font-mono font-bold text-gray-900">PKR {Number(profile.salary || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Disbursement Method:</span>
                    <span className="font-bold text-blue-800">
                      {profile.payment_method === 'bank' ? '🏦 Bank Transfer' : '💵 Cash Counter'}
                    </span>
                  </div>
                  {profile.payment_method === 'bank' && (
                    <div>
                      <span className="text-gray-500 block">Account Details:</span>
                      <span className="font-bold text-gray-800">{profile.bank_name || 'Bank'}</span>
                      <span className="font-mono text-gray-600 block text-[11px]">{profile.account_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 2: 📜 FINANCIAL LEDGER (DEBIT / CREDIT / BALANCE) ================= */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#0B462C]" />
                My Financial Remuneration & Settlement Ledger
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Monthly remuneration statements, double-entry ledger, disbursements, and official salary slips
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3.5 py-1.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-2 text-xs">
                <span className="text-gray-500 font-bold">Net Balance:</span>
                <span className={`font-mono font-black ${
                  currentOutstandingBalance > 0 ? 'text-amber-800' : 'text-emerald-800'
                }`}>
                  PKR {currentOutstandingBalance.toLocaleString()} {currentOutstandingBalance > 0 ? 'Cr (Payable)' : '(Cleared ✓)'}
                </span>
              </div>

              {ledgerEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => window.open(`/payroll/payslip?id=${ledgerEntries[ledgerEntries.length - 1].id}`, '_blank')}
                  className="px-3.5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Print Latest Salary Slip"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Latest Salary Slip (A4)</span>
                </button>
              )}

              <Link
                href="/dashboard/salaries"
                className="px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition flex items-center gap-1.5"
                title="Open Monthly Salaries Desk"
              >
                <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                <span>Salaries Desk</span>
              </Link>

              <Link
                href={profile ? `/teachers/ledger?id=${profile.id}&type=teacher` : '/teachers/ledger'}
                target="_blank"
                className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Ledger (A4)</span>
              </Link>
            </div>
          </div>

          {ledgerEntries.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto" />
              <div>No monthly salary statements generated yet.</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                    <th className="p-3">Month</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3 text-right">Gross Pay</th>
                    <th className="p-3 text-right">Deductions</th>
                    <th className="p-3 text-right bg-emerald-50/60 text-emerald-900 border-x border-emerald-100">
                      Credit (Cr)
                      <span className="block text-[9px] font-medium text-emerald-700 font-sans lowercase">accrued</span>
                    </th>
                    <th className="p-3 text-right bg-blue-50/60 text-blue-900 border-r border-blue-100">
                      Debit (Dr)
                      <span className="block text-[9px] font-medium text-blue-700 font-sans lowercase">paid</span>
                    </th>
                    <th className="p-3 text-right bg-gray-100/70 text-gray-900 font-black">
                      Running Balance
                      <span className="block text-[9px] font-medium text-gray-500 font-sans lowercase">cumulative</span>
                    </th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Salary Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {ledgerEntries.map((p) => {
                    const totalDeductions = 
                      (Number(p.absent_deduction) || 0) + 
                      (Number(p.advance_deduction) || 0) + 
                      (Number(p.other_deductions) || 0);

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3 font-bold text-gray-900 whitespace-nowrap">
                          {p.month}
                        </td>

                        <td className="p-3 text-[11px] text-gray-600 whitespace-nowrap">
                          <span className="font-bold text-gray-800">{p.total_working_days}d</span>
                          <span className="text-gray-400 mx-1">•</span>
                          <span className="text-emerald-700 font-semibold">{p.present_days}P</span>
                          <span className="text-gray-400 mx-1">•</span>
                          <span className="text-amber-700 font-semibold">{p.late_days}L</span>
                          <span className="text-gray-400 mx-1">•</span>
                          <span className="text-rose-700 font-semibold">{p.absent_days}A</span>
                        </td>

                        <td className="p-3 text-right font-mono text-gray-800">
                          PKR {Number(p.gross_salary).toLocaleString()}
                        </td>

                        <td className="p-3 text-right font-mono text-rose-700">
                          {totalDeductions > 0 ? (
                            <span>-PKR {totalDeductions.toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Credit Column (Accrued Net) */}
                        <td className="p-3 text-right font-mono font-black text-emerald-800 bg-emerald-50/40 border-x border-emerald-100 whitespace-nowrap">
                          +PKR {p.credit.toLocaleString()}
                        </td>

                        {/* Debit Column (Disbursed) */}
                        <td className="p-3 text-right font-mono font-black text-blue-900 bg-blue-50/40 border-r border-blue-100 whitespace-nowrap">
                          {p.debit > 0 ? `PKR ${p.debit.toLocaleString()}` : <span className="text-gray-300 font-normal">—</span>}
                        </td>

                        {/* Running Balance Column */}
                        <td className="p-3 text-right font-mono font-black bg-gray-50/60 whitespace-nowrap">
                          {p.balance > 0 ? (
                            <span className="text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                              PKR {p.balance.toLocaleString()} Cr
                            </span>
                          ) : (
                            <span className="text-emerald-700 text-[11px] font-bold">
                              0.00 (Cleared ✓)
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          {p.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle className="w-3 h-3 text-emerald-700" />
                              Paid ✓
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              Unpaid
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <Link
                            href={`/payroll/payslip?id=${p.id}`}
                            target="_blank"
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-[#0B462C] hover:text-[#E8D4A2] text-[#0B462C] border border-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 transition shadow-2xs"
                            title="Open Official Salary Slip"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Salary Slip (A4)</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Ledger Totals Footer */}
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300 font-black text-gray-900 text-xs">
                    <td colSpan={4} className="p-3 text-right uppercase tracking-wider text-[11px]">
                      Ledger Totals & Net Settlement:
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-900 bg-emerald-100/70 border-x border-emerald-200 whitespace-nowrap">
                      PKR {totalCredit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-blue-900 bg-blue-100/70 border-r border-blue-200 whitespace-nowrap">
                      PKR {totalDebit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono bg-gray-200/80 whitespace-nowrap">
                      <span className={currentOutstandingBalance > 0 ? 'text-amber-900 font-black' : 'text-emerald-900'}>
                        PKR {currentOutstandingBalance.toLocaleString()} {currentOutstandingBalance > 0 ? 'Cr' : '✓'}
                      </span>
                    </td>
                    <td colSpan={2} className="p-3 text-center text-[11px] text-gray-500 font-bold">
                      {currentOutstandingBalance === 0 ? 'Fully Settled' : 'Payable Outstanding'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: 💵 ADVANCE SALARY DESK ================= */}
      {activeTab === 'advances' && (
        <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#0B462C]" />
                Advance Salary Requests & Loan Status
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Apply for salary advances for emergencies, festivals, or expenses with executive review
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setAdvError(null);
                setAdvSuccess(null);
                setIsAdvModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Request Salary Advance</span>
            </button>
          </div>

          {advanceRequests.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <Wallet className="w-8 h-8 text-gray-300 mx-auto" />
              <div>No advance salary requests submitted yet.</div>
              <div className="text-[11px] text-gray-400">
                You can apply for full or partial salary advance using the button above.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                    <th className="p-3">Request Date</th>
                    <th className="p-3 text-right">Amount (PKR)</th>
                    <th className="p-3">Reason / Purpose</th>
                    <th className="p-3">Repayment Plan</th>
                    <th className="p-3">Review Status</th>
                    <th className="p-3 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {advanceRequests.map((adv) => (
                    <tr key={adv.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-semibold text-gray-800 whitespace-nowrap">
                        {new Date(adv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="p-3 text-right font-mono font-black text-blue-900 whitespace-nowrap">
                        PKR {Number(adv.amount).toLocaleString()}
                      </td>

                      <td className="p-3 text-gray-700 max-w-xs">
                        <span className="font-semibold">{adv.reason}</span>
                      </td>

                      <td className="p-3 text-[11px] text-gray-600">
                        {adv.repayment_plan || 'Monthly Payroll Deduction'}
                      </td>

                      <td className="p-3 text-[11px]">
                        {adv.status === 'approved' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <ShieldCheck className="w-3 h-3 text-emerald-700" />
                              Approved ✓
                            </span>
                            <div className="text-[10px] text-emerald-800 font-bold">
                              By {adv.reviewed_by_name || 'Executive Authority'}
                            </div>
                          </div>
                        )}

                        {adv.status === 'rejected' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                              <AlertCircle className="w-3 h-3 text-rose-700" />
                              Rejected ✗
                            </span>
                            <div className="text-[10px] text-rose-800 font-semibold">
                              By {adv.reviewed_by_name || 'Executive'}
                            </div>
                            {adv.rejection_reason && (
                              <div className="text-[10px] text-rose-700 italic">
                                Reason: "{adv.rejection_reason}"
                              </div>
                            )}
                          </div>
                        )}

                        {adv.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Awaiting Principal / Director Review
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                        {adv.status === 'approved' ? (
                          <span>PKR {Number(adv.remaining_balance).toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= 📝 TAB 4: LEAVE APPLICATIONS & ATTENDANCE DESK ================= */}
      {activeTab === 'leaves' && (
        <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0B462C]" />
                <h2 className="text-base sm:text-lg font-black text-gray-900">
                  Staff Leave Applications & Attendance History
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Apply for official leaves. Once approved by the Principal, your attendance will be automatically marked and protected.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <CustomMonthPicker
                value={leaveMonth}
                onChange={(newMonth) => {
                  setLeaveMonth(newMonth);
                  fetchLeavesForMonth(newMonth);
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setLeaveError(null);
                  setLeaveSuccess(null);
                  setIsLeaveModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-2xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Apply for Leave</span>
              </button>
            </div>
          </div>

          {leaveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{leaveSuccess}</span>
            </div>
          )}

          {leaveRequests.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-gray-600">No Leave Applications Found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                You haven't submitted any leave applications. Click the button above to request leave from the Principal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-wider">
                    <th className="p-3">Applied On</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">Date Span</th>
                    <th className="p-3 text-center">Total Duration</th>
                    <th className="p-3">Reason / Purpose</th>
                    <th className="p-3">Principal Decision</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {leaveRequests.map((leave) => (
                    <tr key={leave.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-semibold text-gray-800 whitespace-nowrap">
                        {formatDisplayDate(leave.created_at)}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold capitalize bg-blue-50 text-blue-800 border border-blue-200">
                          {leave.leave_type} Leave
                        </span>
                      </td>

                      <td className="p-3 font-bold text-gray-900 whitespace-nowrap">
                        {formatDisplayDate(leave.start_date)}
                        {leave.start_date !== leave.end_date && (
                          <span> – {formatDisplayDate(leave.end_date)}</span>
                        )}
                      </td>

                      <td className="p-3 text-center font-mono font-black text-emerald-800 whitespace-nowrap">
                        {leave.total_days} {leave.total_days === 1 ? 'Day' : 'Days'}
                      </td>

                      <td className="p-3 text-gray-700 max-w-xs">
                        <span className="font-semibold line-clamp-2" title={leave.reason}>{leave.reason}</span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {leave.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Lock className="w-3 h-3 text-emerald-700" />
                            Approved 🔒
                          </span>
                        )}

                        {leave.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                            <X className="w-3 h-3 text-rose-700" />
                            Declined
                          </span>
                        )}

                        {leave.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            Awaiting Principal
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-xs text-gray-500 whitespace-nowrap">
                        {leave.approver_remarks || (leave.status === 'pending' ? 'Under review' : 'No remarks')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: APPLY FOR SALARY ADVANCE ================= */}
      {isAdvModalOpen && (
        <div 
          onClick={() => setIsAdvModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-150 relative"
          >
            <button
              onClick={() => setIsAdvModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#0B462C]" />
                Request Advance Salary
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Submit an advance salary request to the Principal and Board of Directors
              </p>
            </div>

            {advError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{advError}</span>
              </div>
            )}

            <form onSubmit={handleApplyAdvanceSalary} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Advance Amount (PKR) <span className="text-red-500">*</span>
                </label>
                <CustomNumberInput
                  value={advAmount}
                  onChange={setAdvAmount}
                  placeholder="e.g. 25000 (Whole or partial salary)"
                  min={1}
                  required
                />
                <div className="text-[11px] text-gray-400 mt-1">
                  You can request any required amount (e.g. up to or exceeding base pay for emergency requirements).
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Reason / Purpose <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  placeholder="e.g. Medical emergency in family / Eid festival expenses / House maintenance"
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-[#0B462C] focus:ring-1 focus:ring-[#0B462C] outline-hidden transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Repayment Preference / Plan
                </label>
                <CustomTextInput
                  value={advRepaymentPlan}
                  onChange={setAdvRepaymentPlan}
                  placeholder="e.g. Deduct in full next month / 2 Monthly installments"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAdvModalOpen(false)}
                  disabled={isSubmittingAdv}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdv}
                  className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingAdv && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: APPLY FOR LEAVE ================= */}
      {isLeaveModalOpen && (
        <div 
          onClick={() => setIsLeaveModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-150 relative"
          >
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0B462C]" />
                Apply for Official Leave
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Submit an attendance leave application for Executive Principal approval.
              </p>
            </div>

            {leaveError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{leaveError}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Leave Category <span className="text-red-500">*</span>
                </label>
                <CustomDropdown
                  options={LEAVE_CATEGORY_OPTIONS}
                  value={leaveType}
                  onChange={setLeaveType}
                  placeholder="Select Leave Category"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <CustomDatePicker
                    value={leaveStartDate}
                    onChange={(val) => setLeaveStartDate(val || new Date().toISOString().substring(0, 10))}
                    placeholder="Select Start Date"
                    allowClear={false}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <CustomDatePicker
                    value={leaveEndDate}
                    onChange={(val) => setLeaveEndDate(val || new Date().toISOString().substring(0, 10))}
                    placeholder="Select End Date"
                    allowClear={false}
                  />
                </div>
              </div>

              {/* Live Duration Calculation Card */}
              {computedLeaveDays <= 0 ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
                  <span className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Invalid Date Range (End date must be on or after start date)</span>
                  </span>
                  <span className="font-bold text-rose-700">0 Days</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-900">Total Requested Leave Duration:</span>
                  <span className="font-black font-mono text-emerald-800 text-sm">
                    {computedLeaveDays} {computedLeaveDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Reason & Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Urgent family matter in hometown / Medical appointment / High fever"
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-[#0B462C] focus:ring-1 focus:ring-[#0B462C] outline-hidden transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  disabled={isSubmittingLeave}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLeave || computedLeaveDays <= 0}
                  className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmittingLeave && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Leave Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

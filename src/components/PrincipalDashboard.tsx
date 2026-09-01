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
  Users
} from 'lucide-react';
import { api, User, Teacher, TeacherAllowance } from '@/lib/api';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  // Fetch Teachers
  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const teachRes: any = await api.get('/teachers').catch(() => ({ data: [] }));
      const teachData = teachRes?.data || teachRes;
      setTeachers(Array.isArray(teachData) ? teachData : (teachData?.data || []));
    } catch (err) {
      console.error('Failed to load Principal dashboard data:', err);
    } finally {
      if (!silent) setIsLoading(false);
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

        {/* Quick Action Button: Add Teacher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openAddTeacherModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#C5A059]" />
            <span>Add Teacher</span>
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

      {/* ================= FACULTY ROSTER & SEARCH CONTAINER ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs space-y-5">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B462C] flex items-center justify-center border border-emerald-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">Faculty & Teachers Registry</h2>
              <p className="text-xs text-gray-500">Manage school faculty members, personal records, and compensation</p>
            </div>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-[#0B462C] font-extrabold border border-emerald-200">
              {teachers.length}
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

            {/* Status Dropdown Filter */}
            <div className="w-36 sm:w-44">
              <CustomDropdown
                value={selectedStatus}
                options={statusDropdownOptions}
                onChange={setSelectedStatus}
              />
            </div>
          </div>
        </div>

        {/* Teacher Cards Grid */}
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0B462C] to-emerald-800 text-[#E8D4A2] flex items-center justify-center font-black text-lg shrink-0 overflow-hidden relative border border-emerald-100">
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
                        <div>
                          <h4 className="text-sm font-black text-gray-900 leading-tight">
                            {teacher.name}
                          </h4>
                          {teacher.father_name && (
                            <p className="text-[11px] text-gray-400 font-medium">
                              S/O {teacher.father_name}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-500 font-semibold truncate max-w-[170px]">
                            {teacher.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Status Selector */}
                      <div className="relative inline-flex items-center shrink-0">
                        <select
                          value={teacher.status}
                          onChange={(e) => handleUpdateTeacherStatus(teacher, e.target.value as 'active' | 'on_leave' | 'inactive')}
                          disabled={togglingId === teacher.id}
                          className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border transition cursor-pointer focus:outline-none appearance-none pr-6 shadow-2xs ${
                            teacher.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100' 
                              : teacher.status === 'on_leave'
                              ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                              : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
                          }`}
                          title={
                            teacher.status === 'active'
                              ? 'Active Faculty (Can Login)'
                              : teacher.status === 'on_leave'
                              ? 'On Leave (Can Login)'
                              : 'Inactive (Login Blocked)'
                          }
                        >
                          <option value="active">🟢 Active</option>
                          <option value="on_leave">🟡 On Leave</option>
                          <option value="inactive">🔴 Inactive</option>
                        </select>
                        <span className="pointer-events-none absolute right-2 text-[8px] text-gray-400">▼</span>
                      </div>
                    </div>

                    {/* Badges: Qualification & Experience */}
                    <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                      {teacher.qualification && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-[#0B462C] font-bold border border-emerald-100 flex items-center gap-1">
                          <Award className="w-3 h-3 text-[#0B462C]" />
                          {teacher.qualification}
                        </span>
                      )}
                      {teacher.teaching_since && (
                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          Since {teacher.teaching_since}
                        </span>
                      )}
                      {teacher.city && (
                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {teacher.city}
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

    </div>
  );
}

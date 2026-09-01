'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  api, 
  User, 
  Teacher 
} from '@/lib/api';
import CustomTextInput from '@/components/CustomTextInput';
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
  Clock
} from 'lucide-react';

interface TeacherDashboardProps {
  currentUser?: User | null;
}

export default function TeacherDashboard({ currentUser }: TeacherDashboardProps) {
  const [profile, setProfile] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

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

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res: any = await api.get('/teacher/me');
      const data: Teacher = res?.data || res;
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
    } catch (err) {
      console.error('Failed to load teacher profile', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0B462C]" />
        <span className="text-xs font-semibold">Loading Faculty Profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* ================= 🧭 HEADER GREETING ================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-gray-200/90 rounded-3xl p-6 shadow-xs">
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

        <button
          type="button"
          onClick={fetchProfile}
          className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition cursor-pointer"
          title="Refresh Profile"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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

      {/* ================= 📋 PROFILE INFORMATION & EDIT FORM ================= */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
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
              <h3 className="text-sm font-bold text-gray-900">Faculty Profile Picture</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-md">
                Upload a clear formal portrait photo (JPG, PNG or WEBP up to 8MB). This photo is displayed in the school staff registry.
              </p>
            </div>
          </div>

          {/* Section 2: Personal Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Full Name *
              </label>
              <CustomTextInput
                value={name}
                onChange={setName}
                placeholder="e.g. Muhammad Aslam"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Portal Login / Personal Email *
              </label>
              <CustomTextInput
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="e.g. aslam@gmail.com"
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
                CNIC (National Identity Card)
              </label>
              <CustomTextInput
                value={cnic}
                onChange={setCnic}
                placeholder="e.g. 35102-1234567-1"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Contact Mobile Number
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
                City
              </label>
              <CustomTextInput
                value={city}
                onChange={setCity}
                placeholder="e.g. Chunian, Kasur, Lahore"
              />
            </div>
          </div>

          {/* Section 3: Professional & Academic Qualifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Highest Qualification
              </label>
              <CustomTextInput
                value={qualification}
                onChange={setQualification}
                placeholder="e.g. M.Sc Mathematics, B.Ed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Teaching Experience Since (Year)
              </label>
              <CustomTextInput
                value={teachingSince}
                onChange={setTeachingSince}
                placeholder="e.g. 2018 or 5 Years"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Residential Address
              </label>
              <CustomTextInput
                value={address}
                onChange={setAddress}
                placeholder="e.g. House #12, Street 4, Chunian"
              />
            </div>
          </div>

          {/* Institutional Joining & Status Record (Read-Only) */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/90 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Official Date of Joining
              </span>
              <span className="font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0B462C]" />
                {profile?.date_of_joining ? profile.date_of_joining : 'Recorded by Principal'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Registered Institutional Email
              </span>
              <span className="font-bold text-gray-900 mt-0.5 flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-[#0B462C] shrink-0" />
                <span className="truncate">{currentUser?.email}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Institutional Employment Status
              </span>
              <span className="font-black text-emerald-800 mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active Faculty Staff
              </span>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-white text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Profile Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Personal Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Users, 
  Search, 
  UploadCloud, 
  GraduationCap, 
  Phone, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  RefreshCw, 
  CheckCircle2, 
  Filter, 
  X,
  ArrowUpRight,
  Check,
  Layers,
  Plus,
  Trash2,
  Settings2,
  AlertCircle
} from 'lucide-react';
import { api, Student, StudentStats, SchoolSection, formatDisplayDate } from '@/lib/api';

const CLASS_LIST = [
  'all',
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

export default function StudentsDirectoryPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [sections, setSections] = useState<SchoolSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<string[]>(['2026-2027']);
  const [selectedSession, setSelectedSession] = useState<string>('2026-2027');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Multi-select & Bulk Action State
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [targetAssignSection, setTargetAssignSection] = useState('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fullscreen Photo Lightbox State
  const [fullscreenPhoto, setFullscreenPhoto] = useState<{
    url: string;
    name: string;
    fatherName?: string;
    regNo?: string;
    className?: string;
    section?: string;
  } | null>(null);

  // Close actions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(e.target as Node)) {
        setIsActionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Section Management State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [modalTargetClass, setModalTargetClass] = useState('Two (II)');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionCapacity, setNewSectionCapacity] = useState(40);
  const [isCreatingSection, setIsCreatingSection] = useState(false);
  const [sectionError, setSectionError] = useState('');

  const fetchSessions = async () => {
    try {
      const res = await api.get<string[]>('/students/sessions');
      if (Array.isArray(res) && res.length > 0) {
        setSessions(res);
        if (!res.includes(selectedSession)) {
          setSelectedSession(res[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const fetchStats = async (currSession: string = selectedSession) => {
    try {
      const res = await api.get<StudentStats>(`/students/stats?session=${encodeURIComponent(currSession)}`);
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch student stats:', err);
    }
  };

  const fetchSections = useCallback(async (currSession: string = selectedSession, currClass: string = selectedClass) => {
    try {
      const params = new URLSearchParams();
      params.append('session', currSession);
      if (currClass && currClass !== 'all') {
        params.append('class', currClass);
      }
      const res = await api.get<SchoolSection[]>(`/students/sections?${params.toString()}`);
      setSections(res || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  }, [selectedSession, selectedClass]);

  const fetchStudents = useCallback(async (currentPage: number = 1) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('per_page', '100');
      params.append('session', selectedSession);

      if (selectedClass && selectedClass !== 'all') {
        params.append('class', selectedClass);
      }
      if (selectedSection && selectedSection !== 'all') {
        params.append('section', selectedSection);
      }
      if (selectedGender && selectedGender !== 'all') {
        params.append('gender', selectedGender);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res: any = await api.get(`/students?${params.toString()}`);
      setStudents(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotalCount(res.total || 0);
      setPage(res.current_page || 1);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSession, selectedClass, selectedSection, selectedGender, searchQuery]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    fetchStats(selectedSession);
  }, [selectedSession]);

  useEffect(() => {
    fetchSections(selectedSession, selectedClass);
  }, [selectedSession, selectedClass, fetchSections]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchStudents(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Sync modal class when filter changes
  useEffect(() => {
    if (selectedClass !== 'all') {
      setModalTargetClass(selectedClass);
    }
  }, [selectedClass]);

  // Toggle single student selection
  const toggleStudentSelect = (id: number) => {
    setSelectedStudentIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all on current page
  const isAllOnPageSelected = students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id));
  const toggleSelectAllOnPage = () => {
    if (isAllOnPageSelected) {
      const pageIds = students.map((s) => s.id);
      setSelectedStudentIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = students.map((s) => s.id);
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Create section
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setIsCreatingSection(true);
    setSectionError('');

    try {
      await api.post('/students/sections', {
        name: newSectionName.trim().toUpperCase(),
        class: modalTargetClass,
        session: selectedSession,
        capacity: newSectionCapacity || 40,
      });

      setNewSectionName('');
      await fetchSections(selectedSession, selectedClass);
      await fetchStats(selectedSession);
    } catch (err: any) {
      setSectionError(err.message || 'Failed to create section.');
    } finally {
      setIsCreatingSection(false);
    }
  };

  // Delete section
  const handleDeleteSection = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    try {
      await api.delete(`/students/sections/${id}`);
      await fetchSections(selectedSession, selectedClass);
      if (selectedSection !== 'all') {
        setSelectedSection('all');
      }
    } catch (err: any) {
      alert(err.message || 'Cannot delete section.');
    }
  };

  // Bulk Assign Section
  const handleBulkAssign = async () => {
    if (!targetAssignSection.trim() || selectedStudentIds.length === 0) return;

    setIsSubmittingBulk(true);
    setBulkFeedback(null);

    try {
      const res: any = await api.post('/students/bulk-assign-section', {
        student_ids: selectedStudentIds,
        section: targetAssignSection.trim().toUpperCase(),
      });

      setBulkFeedback({ type: 'success', message: res.message || 'Successfully assigned students!' });
      setSelectedStudentIds([]);
      await fetchStudents(page);
      await fetchSections(selectedSession, selectedClass);
      await fetchStats(selectedSession);

      setTimeout(() => {
        setIsBulkAssignModalOpen(false);
        setBulkFeedback(null);
      }, 1200);
    } catch (err: any) {
      setBulkFeedback({ type: 'error', message: err.message || 'Failed to assign section.' });
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Clean Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#0B462C]" />
            Students Directory
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats?.total_students ? `${stats.total_students.toLocaleString()} students enrolled` : 'Official institutional student records'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Session Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 font-medium">Session:</span>
            <select
              value={selectedSession}
              onChange={(e) => {
                setSelectedSession(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="bg-transparent text-[#0B462C] font-bold text-xs outline-none cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s} {s === '2026-2027' ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/dashboard/students/import"
            className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-[#C5A059]" />
            <span>Upload Student Register</span>
          </Link>
        </div>
      </div>

      {/* Control Bar: Class Filter Pills, Section Filter Pills & Search */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
        {/* Row 1: Search & Gender Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student name, registration no, B-form, father..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0B462C] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-200 shrink-0">
            {(['all', 'Male', 'Female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGender === g
                    ? 'bg-[#0B462C] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {g === 'all' ? 'All Genders' : g === 'Male' ? '👦 Boys' : '👧 Girls'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Class Filter Scrollable Tabs */}
        <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Class:
          </span>
          {CLASS_LIST.map((cls) => {
            const count = cls === 'all' ? stats?.total_students : stats?.class_breakdown?.[cls];
            const isSelected = selectedClass === cls;
            return (
              <button
                key={cls}
                onClick={() => {
                  setSelectedClass(cls);
                  setSelectedSection('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/60'
                }`}
              >
                <span>{cls === 'all' ? 'All Classes' : cls}</span>
                {count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Row 3: Section Filter Pills & Manage Sections CTA */}
        <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Section:
            </span>

            {/* All Sections Pill */}
            <button
              onClick={() => setSelectedSection('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedSection === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
              }`}
            >
              All Sections
            </button>

            {/* Dynamic Section Pills */}
            {sections
              .filter((sec) => selectedClass === 'all' || sec.class === selectedClass)
              // Deduplicate section names for display
              .reduce((acc: { name: string; count: number }[], curr) => {
                const existing = acc.find((item) => item.name === curr.name);
                if (existing) {
                  existing.count += curr.count;
                } else {
                  acc.push({ name: curr.name, count: curr.count });
                }
                return acc;
              }, [])
              .map((sec) => {
                const isSelected = selectedSection === sec.name;
                return (
                  <button
                    key={sec.name}
                    onClick={() => setSelectedSection(sec.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0B462C] text-[#E8D4A2] shadow-xs'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60'
                    }`}
                  >
                    <span>Sec {sec.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {sec.count}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* Manage Sections Modal Button */}
          <button
            onClick={() => setIsSectionModalOpen(true)}
            className="px-3 py-1 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#0B462C]" />
            <span>Manage Sections</span>
          </button>
        </div>
      </div>

      {/* Select All on Page Toolbar */}
      {!isLoading && students.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAllOnPage}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold cursor-pointer group"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                isAllOnPageSelected ? 'bg-[#0B462C] border-[#0B462C] text-white' : 'border-gray-300 bg-white group-hover:border-[#0B462C]'
              }`}>
                {isAllOnPageSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span>Select all on page ({students.length})</span>
            </button>

            {selectedStudentIds.length > 0 && (
              <span className="text-[#0B462C] font-bold ml-2">
                • {selectedStudentIds.length} selected in total
              </span>
            )}
          </div>

          {selectedStudentIds.length > 0 && (
            <div className="flex items-center gap-2.5">
              {/* Actions Dropdown Menu */}
              <div className="relative" ref={actionsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsActionsDropdownOpen((prev) => !prev)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Actions</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${isActionsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isActionsDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-30 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Bulk Actions ({selectedStudentIds.length})
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsDropdownOpen(false);
                        setTargetAssignSection(sections[0]?.name || 'A');
                        setIsBulkAssignModalOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-700 hover:bg-[#0B462C]/10 hover:text-[#0B462C] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-[#0B462C]" />
                      <span>Change Section</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedStudentIds([]);
                  setIsActionsDropdownOpen(false);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Student Registry Grid */}
      {isLoading ? (
        <div className="p-16 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center gap-4">
          <div className="relative w-[68px] h-[68px] flex items-center justify-center">
            {/* Animating circle around the logo */}
            <div className="absolute inset-0 rounded-full border-2 border-[#0B462C]/15 border-t-[#0B462C] border-r-[#C5A059] animate-spin" />
            
            {/* 50x50 School Logo */}
            <div className="relative w-[50px] h-[50px] rounded-full overflow-hidden flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="NSSE Logo"
                width={50}
                height={50}
                unoptimized
                priority
                className="object-contain w-[50px] h-[50px]"
              />
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-500">Loading student records...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-dashed border-gray-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No students found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? `No student matching "${searchQuery}" in this category.`
              : 'No students found. Click "Upload Student Register" above to import the government register file.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('all');
                setSelectedSection('all');
                setSelectedGender('all');
              }}
              className="px-4 py-2 text-xs font-bold text-[#0B462C] bg-[#0B462C]/10 rounded-xl hover:bg-[#0B462C]/20 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((student) => {
            const isSelected = selectedStudentIds.includes(student.id);
            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer group relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0B462C] ring-2 ring-[#0B462C]/30 shadow-md bg-emerald-50/10'
                    : 'border-gray-100 shadow-xs hover:shadow-md hover:border-[#0B462C]/20'
                }`}
              >
                {/* Select Checkbox Top-Right */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStudentSelect(student.id);
                  }}
                  className={`absolute top-4 right-4 z-10 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B462C] border-[#0B462C] text-white shadow-xs'
                      : 'bg-white/90 border-gray-300 text-transparent hover:border-[#0B462C] hover:bg-white'
                  }`}
                  title={isSelected ? 'Deselect student' : 'Select student'}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>

                <div className="space-y-3.5">
                  {/* Top Row: Avatar & Class Pill */}
                  <div className="flex items-start justify-between gap-3 pr-8">
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={(e) => {
                          if (student.photo_url) {
                            e.stopPropagation();
                            setFullscreenPhoto({
                              url: student.photo_url,
                              name: student.student_name,
                              fatherName: student.father_name || '',
                              regNo: student.registration_no,
                              className: student.class,
                              section: student.section || 'A',
                            });
                          }
                        }}
                        className={`relative w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-xs transition-all ${
                          student.photo_url ? 'cursor-zoom-in hover:border-[#0B462C] hover:shadow-md' : ''
                        }`}
                        title={student.photo_url ? 'Tap to view full screen' : ''}
                      >
                        {student.photo_url ? (
                          <Image
                            src={student.photo_url}
                            alt={student.student_name}
                            fill
                            unoptimized
                            sizes="56px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0B462C]/10 to-[#0B462C]/5 text-[#0B462C] font-black text-sm">
                            {student.student_name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 group-hover:text-[#0B462C] transition-colors line-clamp-1">
                          {student.student_name}
                        </h4>
                        <div className="text-[11px] text-gray-500 font-medium">
                          s/o {student.father_name || '—'}
                        </div>
                        <span className="inline-block mt-1 font-mono text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                          #{student.registration_no}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Meta */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px]">
                    <div>
                      <span className="text-gray-400 block text-[10px]">B-Form No</span>
                      <span className="font-mono text-gray-700 font-medium">{student.b_form_no || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Gender</span>
                      <span className="text-gray-700 font-semibold">
                        {student.gender === 'Male' ? '👦 Male' : student.gender === 'Female' ? '👧 Female' : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Admission Date</span>
                      <span className="text-gray-700">{formatDisplayDate(student.admission_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Parent Mobile</span>
                      {student.mobile_no ? (
                        <a
                          href={`tel:${student.mobile_no}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0B462C] font-semibold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{student.mobile_no}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#0B462C]/10 text-[#0B462C] border border-[#0B462C]/15">
                      {student.class}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      Sec: {student.section || 'A'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[#0B462C] font-bold text-[11px] group-hover:translate-x-0.5 transition-transform">
                    <span>Profile</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500 font-medium">
            Showing Page <strong className="text-gray-900">{page}</strong> of <strong className="text-gray-900">{totalPages}</strong> ({totalCount} total students)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => fetchStudents(page - 1)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => fetchStudents(page + 1)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manage Sections Modal */}
      {isSectionModalOpen && (
        <div
          onClick={() => setIsSectionModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B462C]/10 text-[#0B462C] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Manage Sections</h3>
                  <p className="text-[11px] text-gray-500">Session: {selectedSession}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Class Selector */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Select Class:</label>
              <select
                value={modalTargetClass}
                onChange={(e) => setModalTargetClass(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-[#0B462C]"
              >
                {CLASS_LIST.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Existing Sections List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Existing Sections in {modalTargetClass}:
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {sections.filter((s) => s.class === modalTargetClass).length === 0 ? (
                  <div className="p-3 rounded-xl bg-gray-50 text-gray-400 text-xs text-center">
                    No custom sections created yet (Default is 'A')
                  </div>
                ) : (
                  sections
                    .filter((s) => s.class === modalTargetClass)
                    .map((sec) => (
                      <div
                        key={sec.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#0B462C] text-[#E8D4A2] font-black text-xs flex items-center justify-center">
                            {sec.name}
                          </span>
                          <span className="font-bold text-gray-800">Section {sec.name}</span>
                          <span className="text-[11px] text-gray-400 font-medium">
                            ({sec.count} students)
                          </span>
                        </div>

                        {sec.count === 0 && (
                          <button
                            onClick={() => handleDeleteSection(sec.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete empty section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Add New Section Form */}
            <form onSubmit={handleCreateSection} className="pt-3 border-t border-gray-100 space-y-3">
              <span className="text-xs font-bold text-gray-700 block">Add New Section:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Section Name (e.g. B, Rose)"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-[#0B462C] outline-none uppercase"
                  maxLength={15}
                />
                <button
                  type="submit"
                  disabled={isCreatingSection || !newSectionName.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {sectionError && (
                <p className="text-[11px] text-red-600 font-medium">{sectionError}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Bulk Assign Section Modal */}
      {isBulkAssignModalOpen && (
        <div
          onClick={() => setIsBulkAssignModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C5A059]/20 text-[#0B462C] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Assign Section</h3>
                  <p className="text-[11px] text-gray-500">
                    Applying to <strong>{selectedStudentIds.length}</strong> selected students
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkAssignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Section Picker */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">
                Choose Target Section:
              </label>

              {/* Fast Pick Chips */}
              <div className="flex flex-wrap gap-2">
                {['A', 'B', 'C', 'D', 'Rose', 'Tulip'].map((secName) => (
                  <button
                    key={secName}
                    type="button"
                    onClick={() => setTargetAssignSection(secName)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      targetAssignSection === secName
                        ? 'bg-[#0B462C] text-[#E8D4A2] shadow-sm ring-2 ring-[#0B462C]/30'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    Section {secName}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="pt-2">
                <span className="text-[11px] text-gray-400 block mb-1">Or enter custom section name:</span>
                <input
                  type="text"
                  placeholder="e.g. Blue, Girls, Jasmine"
                  value={targetAssignSection}
                  onChange={(e) => setTargetAssignSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:border-[#0B462C] outline-none uppercase"
                />
              </div>
            </div>

            {/* Feedback alert */}
            {bulkFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                bulkFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {bulkFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{bulkFeedback.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setIsBulkAssignModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingBulk || !targetAssignSection.trim()}
                onClick={handleBulkAssign}
                className="flex-1 py-3 rounded-xl bg-[#0B462C] hover:bg-[#083622] text-[#E8D4A2] text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingBulk ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#C5A059]" />
                    <span>Assign to Sec {targetAssignSection.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Quick View Modal */}
      {selectedStudent && (
        <div
          onClick={() => setSelectedStudent(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative space-y-6 max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header with School Crest */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 relative shrink-0">
                <Image src="/logo.png" alt="NSSE Logo" fill className="object-contain" />
              </div>
              <div>
                <div className="text-xs font-black text-[#0B462C] font-cinzel tracking-widest uppercase">
                  Nawaz Sharif School of Eminence
                </div>
                <div className="text-[10px] font-bold text-[#C5A059] font-cinzel tracking-wider uppercase">
                  Institutional Student Record
                </div>
              </div>
            </div>

            {/* Profile Hero */}
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div 
                onClick={() => {
                  if (selectedStudent.photo_url) {
                    setFullscreenPhoto({
                      url: selectedStudent.photo_url,
                      name: selectedStudent.student_name,
                      fatherName: selectedStudent.father_name || '',
                      regNo: selectedStudent.registration_no,
                      className: selectedStudent.class,
                      section: selectedStudent.section || 'A',
                    });
                  }
                }}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-sm ${
                  selectedStudent.photo_url ? 'cursor-zoom-in hover:border-[#0B462C] transition-all' : ''
                }`}
                title={selectedStudent.photo_url ? 'Tap to view full screen' : ''}
              >
                {selectedStudent.photo_url ? (
                  <Image
                    src={selectedStudent.photo_url}
                    alt={selectedStudent.student_name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0B462C]/10 text-[#0B462C] font-black text-lg">
                    {selectedStudent.student_name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedStudent.student_name}</h3>
                <div className="text-xs text-gray-500 font-medium">s/o {selectedStudent.father_name || '—'}</div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#0B462C] text-[#E8D4A2]">
                    {selectedStudent.class} • Sec {selectedStudent.section || 'A'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Session {selectedStudent.session || '2026-2027'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-white border border-gray-200 text-gray-600">
                    Reg #{selectedStudent.registration_no}
                  </span>
                </div>
              </div>
            </div>

            {/* Complete Data Rows */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] font-medium">National B-Form</span>
                <span className="font-mono font-bold text-gray-800">{selectedStudent.b_form_no || '—'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] font-medium">Gender</span>
                <span className="font-bold text-gray-800">{selectedStudent.gender || '—'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] font-medium">Admission Date</span>
                <span className="font-bold text-gray-800">{formatDisplayDate(selectedStudent.admission_date)}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] font-medium">Guardian Phone</span>
                {selectedStudent.mobile_no ? (
                  <a
                    href={`tel:${selectedStudent.mobile_no}`}
                    className="font-bold text-[#0B462C] hover:underline"
                  >
                    {selectedStudent.mobile_no}
                  </a>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close
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
            {/* Close Button */}
            <button
              onClick={() => setFullscreenPhoto(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2 rounded-full transition-all cursor-pointer"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Enlarged Photo */}
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

            {/* Student Info Caption */}
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">{fullscreenPhoto.name}</h3>
              {fullscreenPhoto.fatherName && (
                <p className="text-xs text-gray-300 font-medium">s/o {fullscreenPhoto.fatherName}</p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {fullscreenPhoto.className && (
                  <span className="px-3 py-1 rounded-xl bg-white/20 text-[#E8D4A2] text-xs font-bold border border-white/20">
                    {fullscreenPhoto.className} • Sec {fullscreenPhoto.section || 'A'}
                  </span>
                )}
                {fullscreenPhoto.regNo && (
                  <span className="px-2.5 py-1 rounded-xl bg-black/30 font-mono text-xs text-gray-300 border border-white/10">
                    #{fullscreenPhoto.regNo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

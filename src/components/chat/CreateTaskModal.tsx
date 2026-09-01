'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api, getStoredUser, User } from '@/lib/api';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomTextInput from '@/components/CustomTextInput';
import {
  X,
  AlertTriangle,
  Calendar,
  Search,
  ChevronDown,
  Check,
  Loader2,
  Plus
} from 'lucide-react';

interface StaffOption {
  id: number;
  name: string;
  role: string;
  email?: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: {
    id: number;
    message?: string | null;
    type: string;
    sender_id: number;
    recipient_id: number;
  } | null;
  contact?: {
    id: number;
    name: string;
    role: string;
  } | null;
  currentUserId?: number;
  onTaskCreated: (task: any) => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  message,
  contact,
  currentUserId,
  onTaskCreated,
}: CreateTaskModalProps) {
  const currentUser = getStoredUser();
  const myId = currentUserId || currentUser?.id || 1;

  const defaultTitle = message
    ? message.message?.trim() ||
      (message.type === 'voice' ? 'Review voice note instruction' : 'Review attachment task')
    : '';

  const [title, setTitle] = useState<string>(defaultTitle);
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [dueDate, setDueDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Full Staff List
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  // 1. Assigner (Directive From / Ordered By)
  const isSenderCurrentUser = message ? Number(message.sender_id) === Number(myId) : true;
  const initialAssigner: StaffOption = {
    id: message && !isSenderCurrentUser && contact ? contact.id : myId,
    name: message && !isSenderCurrentUser && contact ? contact.name : (currentUser?.name || 'You'),
    role: message && !isSenderCurrentUser && contact ? contact.role : (currentUser?.role || 'Staff'),
  };
  const [selectedAssigner, setSelectedAssigner] = useState<StaffOption>(initialAssigner);
  const [isAssignerDropdownOpen, setIsAssignerDropdownOpen] = useState<boolean>(false);
  const [assignerSearch, setAssignerSearch] = useState<string>('');
  const assignerDropdownRef = useRef<HTMLDivElement>(null);

  // 2. Assignee (Assigned To / Who executes)
  const initialAssignee: StaffOption = {
    id: contact ? contact.id : myId,
    name: contact ? contact.name : (currentUser?.name || 'Staff'),
    role: contact ? contact.role : (currentUser?.role || 'Staff'),
  };
  const [selectedAssignee, setSelectedAssignee] = useState<StaffOption>(initialAssignee);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState<boolean>(false);
  const [assigneeSearch, setAssigneeSearch] = useState<string>('');
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all staff members for the dropdowns
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get<StaffOption[]>('/chat/contacts');
        const all: StaffOption[] = [];
        if (currentUser) {
          all.push({
            id: currentUser.id,
            name: `${currentUser.name} (You)`,
            role: currentUser.role,
          });
        }
        if (res && res.length > 0) {
          res.forEach((s) => {
            if (!all.some((a) => a.id === s.id)) {
              all.push(s);
            }
          });
        }
        setStaffList(all);

        // Pre-select Assigner (Ordered By)
        const targetAssignerId = message && !isSenderCurrentUser && contact ? contact.id : myId;
        const foundAssigner = all.find((s) => s.id === targetAssignerId);
        if (foundAssigner) setSelectedAssigner(foundAssigner);

        // Pre-select Assignee (Assigned To)
        const targetAssigneeId = contact ? contact.id : (all.find((s) => s.id !== myId)?.id || myId);
        const foundAssignee = all.find((s) => s.id === targetAssigneeId);
        if (foundAssignee) setSelectedAssignee(foundAssignee);
      } catch (err) {
        console.error('Failed to load staff list for task assignment', err);
      }
    };
    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen, contact?.id, myId, message]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assignerDropdownRef.current && !assignerDropdownRef.current.contains(event.target as Node)) {
        setIsAssignerDropdownOpen(false);
      }
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target as Node)) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const filteredAssigners = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(assignerSearch.toLowerCase()) ||
      s.role.toLowerCase().includes(assignerSearch.toLowerCase())
  );

  const filteredAssignees = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      s.role.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task description.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        creator_id: selectedAssigner.id,
        assignee_id: selectedAssignee.id,
        title: title.trim(),
        priority,
      };
      if (message?.id) payload.message_id = message.id;
      if (dueDate) payload.due_date = dueDate;

      const createdTask = await api.post('/tasks', payload);
      onTaskCreated(createdTask);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-lg overflow-visible animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-5 bg-gray-50/95 border-b border-gray-200/80 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg shadow-2xs">
              📌
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">
                {message ? 'Convert Message to Task' : 'Create Task / Action Item'}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Delegate directives and track actionable tasks across staff
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Original Message Preview (only if born from a chat message) */}
          {message && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Original Chat Message</span>
              <p className="text-sm text-gray-800 font-medium italic line-clamp-2">
                "{message.message || (message.type === 'voice' ? '🎙️ Voice note' : '📎 Attachment')}"
              </p>
            </div>
          )}

          {/* Task Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-800 block">
              Task Action Item Description <span className="text-rose-500">*</span>
            </label>
            <CustomTextInput
              multiline={true}
              rows={3}
              value={title}
              onChange={setTitle}
              placeholder="What needs to be done? Enter task details..."
              className="text-sm font-medium leading-relaxed"
              required
            />
          </div>

          {/* DUAL SELECTOR: Assigner (Directive From) ➡️ Assignee (Assigned To) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Assigner (Directive From / Ordered By) */}
            <div className="space-y-2 relative" ref={assignerDropdownRef}>
              <label className="text-xs font-bold text-gray-800 block">
                📤 Directive From (Assigner) <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsAssignerDropdownOpen(!isAssignerDropdownOpen);
                  setIsAssigneeDropdownOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/80 border border-gray-200 flex items-center justify-between gap-2 transition-colors cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {selectedAssigner.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-gray-900 block truncate text-xs leading-tight">
                      {selectedAssigner.name}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      {selectedAssigner.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </button>

              {/* Assigner Search Popover */}
              {isAssignerDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3 border-b border-gray-100 bg-gray-50/80">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search ordering staff (e.g. Principal)..."
                        value={assignerSearch}
                        onChange={(e) => setAssignerSearch(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 transition-all shadow-2xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 text-xs">
                    {filteredAssigners.map((staff) => (
                      <button
                        key={`assigner-${staff.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedAssigner(staff);
                          setIsAssignerDropdownOpen(false);
                          setAssignerSearch('');
                        }}
                        className={`w-full p-2.5 flex items-center justify-between gap-2 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedAssigner.id === staff.id ? 'bg-emerald-50/70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                            {staff.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-gray-900 block truncate text-xs">{staff.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{staff.role}</span>
                          </div>
                        </div>
                        {selectedAssigner.id === staff.id && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Assignee (Assigned To / Who executes) */}
            <div className="space-y-2 relative" ref={assigneeDropdownRef}>
              <label className="text-xs font-bold text-gray-800 block">
                📥 Assigned To (Assignee) <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                  setIsAssignerDropdownOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/80 border border-gray-200 flex items-center justify-between gap-2 transition-colors cursor-pointer text-left shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {selectedAssignee.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-gray-900 block truncate text-xs leading-tight">
                      {selectedAssignee.name}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold">
                      {selectedAssignee.role}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
              </button>

              {/* Assignee Search Popover */}
              {isAssigneeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3 border-b border-gray-100 bg-gray-50/80">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search executing staff member..."
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 transition-all shadow-2xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50 text-xs">
                    {filteredAssignees.map((staff) => (
                      <button
                        key={`assignee-${staff.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedAssignee(staff);
                          setIsAssigneeDropdownOpen(false);
                          setAssigneeSearch('');
                        }}
                        className={`w-full p-2.5 flex items-center justify-between gap-2 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedAssignee.id === staff.id ? 'bg-purple-50/70' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-700 to-indigo-800 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                            {staff.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-gray-900 block truncate text-xs">{staff.name}</span>
                            <span className="text-[10px] text-gray-500 uppercase">{staff.role}</span>
                          </div>
                        </div>
                        {selectedAssignee.id === staff.id && <Check className="w-4 h-4 text-purple-700 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Priority Selector & Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 block">Priority Level</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    priority === 'normal'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  🟢 Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    priority === 'urgent'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-gray-500 hover:text-rose-600'
                  }`}
                >
                  🔴 Urgent
                </button>
              </div>
            </div>

            {/* CustomDatePicker for Due Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>Target Due Date (Optional)</span>
              </label>
              <CustomDatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select Target Due Date"
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-7 py-2.5 rounded-2xl bg-[#0B462C] hover:bg-[#093823] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Assign Task</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

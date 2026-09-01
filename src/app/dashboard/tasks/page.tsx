'use client';

import React, { useState, useEffect } from 'react';
import { api, getStoredUser, User } from '@/lib/api';
import { getPusherClient } from '@/lib/pusher';
import CustomTextInput from '@/components/CustomTextInput';
import CreateTaskModal from '@/components/chat/CreateTaskModal';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  User as UserIcon,
  RefreshCw,
  MessageSquare,
  Search,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  Flame,
  Check,
  Info
} from 'lucide-react';

interface TaskCommentItem {
  id: number;
  task_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

interface TaskItem {
  id: number;
  creator_id: number;
  assignee_id: number;
  message_id?: number | null;
  title: string;
  priority: 'normal' | 'urgent';
  due_date?: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string | null;
  creator_deleted_at?: string | null;
  assignee_deleted_at?: string | null;
  created_at: string;
  creator?: {
    id: number;
    name: string;
    role: string;
  };
  assignee?: {
    id: number;
    name: string;
    role: string;
  };
  message?: {
    id: number;
    message?: string;
    type: string;
    created_at: string;
  } | null;
  comments?: TaskCommentItem[];
}

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'assigned_to_me' | 'assigned_by_me'>('assigned_to_me');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [counts, setCounts] = useState<{ assigned_to_me: number; assigned_by_me: number; total_completed: number }>({
    assigned_to_me: 0,
    assigned_by_me: 0,
    total_completed: 0,
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'urgent' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Standalone Create Task Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Discussion / Activity Accordion State
  const [openCommentsTaskId, setOpenCommentsTaskId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingCommentTaskId, setSubmittingCommentTaskId] = useState<number | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ tasks: TaskItem[]; counts: any }>(`/tasks?view=${view}`);
      setTasks(res?.tasks || []);
      setCounts(res?.counts || { assigned_to_me: 0, assigned_by_me: 0, total_completed: 0 });
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, view]);

  // Real-time Pusher listener for task updates, comments, and deletions
  useEffect(() => {
    if (!user) return;
    const pusher = getPusherClient();
    const channelName = `user-${user.id}`;
    const channel = pusher.subscribe(channelName);

    const handleTaskUpdated = (updatedTask: TaskItem) => {
      // If the current user deleted it, remove it
      const isDeletedForMe =
        (view === 'assigned_by_me' && updatedTask.creator_id === user.id && updatedTask.creator_deleted_at) ||
        (view === 'assigned_to_me' && updatedTask.assignee_id === user.id && updatedTask.assignee_deleted_at);

      if (isDeletedForMe) {
        setTasks((prev) => prev.filter((t) => t.id !== updatedTask.id));
      } else {
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === updatedTask.id);
          if (exists) {
            return prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
          }
          // If a new task was assigned to/by this user
          const isRelevant =
            (view === 'assigned_to_me' && updatedTask.assignee_id === user.id) ||
            (view === 'assigned_by_me' && updatedTask.creator_id === user.id);
          if (isRelevant) return [updatedTask, ...prev];
          return prev;
        });
      }
    };

    const handleCommentAdded = (data: { task_id: number; comment: TaskCommentItem }) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === data.task_id) {
            const existing = t.comments || [];
            if (existing.some((c) => c.id === data.comment.id)) return t;

            const tempIndex = existing.findIndex(
              (c) =>
                (typeof c.id === 'string' || c.id > 1000000000) &&
                c.message.trim() === data.comment.message.trim() &&
                Number(c.user_id) === Number(data.comment.user_id)
            );

            if (tempIndex !== -1) {
              const updated = [...existing];
              updated[tempIndex] = data.comment;
              return { ...t, comments: updated };
            }

            return {
              ...t,
              comments: [...existing, data.comment],
            };
          }
          return t;
        })
      );
    };

    channel.bind('task-updated', handleTaskUpdated);
    channel.bind('task-comment-added', handleCommentAdded);

    return () => {
      channel.unbind('task-updated', handleTaskUpdated);
      channel.unbind('task-comment-added', handleCommentAdded);
      pusher.unsubscribe(channelName);
    };
  }, [user, view]);

  // 0ms Optimistic Status Switcher
  const updateStatus = async (taskId: number, newStatus: 'pending' | 'in_progress' | 'completed') => {
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    const previousStatus = currentTask.status;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
            }
          : t
      )
    );

    setCounts((prev) => {
      let assignedToMe = prev.assigned_to_me;
      let assignedByMe = prev.assigned_by_me;
      let totalCompleted = prev.total_completed;

      const isMyAssignee = currentTask.assignee_id === user?.id;
      const isMyCreator = currentTask.creator_id === user?.id;

      if (previousStatus !== 'completed' && newStatus === 'completed') {
        if (isMyAssignee) assignedToMe = Math.max(0, assignedToMe - 1);
        if (isMyCreator) assignedByMe = Math.max(0, assignedByMe - 1);
        totalCompleted += 1;
      } else if (previousStatus === 'completed' && newStatus !== 'completed') {
        if (isMyAssignee) assignedToMe += 1;
        if (isMyCreator) assignedByMe += 1;
        totalCompleted = Math.max(0, totalCompleted - 1);
      }

      return {
        assigned_to_me: assignedToMe,
        assigned_by_me: assignedByMe,
        total_completed: totalCompleted,
      };
    });

    try {
      await api.patch<TaskItem>(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to sync status to server', err);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
    }
  };

  // Delete Confirmation Modal State
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // 0ms Optimistic Delete Execution
  const executeDelete = async () => {
    if (!taskToDelete) return;
    const task = taskToDelete;
    setTaskToDelete(null);

    // Optimistically remove from state
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    // Optimistically adjust count
    setCounts((prev) => {
      let assignedToMe = prev.assigned_to_me;
      let assignedByMe = prev.assigned_by_me;
      let totalCompleted = prev.total_completed;

      if (task.status !== 'completed') {
        if (task.assignee_id === user?.id) assignedToMe = Math.max(0, assignedToMe - 1);
        if (task.creator_id === user?.id) assignedByMe = Math.max(0, assignedByMe - 1);
      } else {
        totalCompleted = Math.max(0, totalCompleted - 1);
      }

      return {
        assigned_to_me: assignedToMe,
        assigned_by_me: assignedByMe,
        total_completed: totalCompleted,
      };
    });

    try {
      await api.delete(`/tasks/${task.id}`);
    } catch (err: any) {
      console.error('Failed to delete task', err);
      fetchTasks();
    }
  };

  // 0ms Optimistic Comment
  const handleSendComment = async (taskId: number) => {
    const text = commentInputs[taskId]?.trim();
    if (!text) return;

    const tempId = Date.now();

    const tempComment: TaskCommentItem = {
      id: tempId,
      task_id: taskId,
      user_id: user?.id || 0,
      message: text,
      created_at: new Date().toISOString(),
      user: {
        id: user?.id || 0,
        name: user?.name || 'You',
        role: user?.role || 'Staff',
      },
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...(t.comments || []).filter((c) => c.id !== tempId), tempComment] }
          : t
      )
    );
    setCommentInputs((prev) => ({ ...prev, [taskId]: '' }));

    try {
      const createdComment = await api.post<TaskCommentItem>(`/tasks/${taskId}/comments`, { message: text });
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const currentComments = t.comments || [];
            if (currentComments.some((c) => c.id === createdComment.id)) {
              return {
                ...t,
                comments: currentComments.filter((c) => c.id !== tempId),
              };
            }
            return {
              ...t,
              comments: currentComments.map((c) => (c.id === tempId ? createdComment : c)),
            };
          }
          return t;
        })
      );
    } catch (err: any) {
      console.error('Failed to post comment', err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      task.creator?.name.toLowerCase().includes(query) ||
      task.assignee?.name.toLowerCase().includes(query) ||
      task.comments?.some((c) => c.message.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return task.status === 'pending';
    if (statusFilter === 'in_progress') return task.status === 'in_progress';
    if (statusFilter === 'completed') return task.status === 'completed';
    if (statusFilter === 'urgent') return task.priority === 'urgent' && task.status !== 'completed';

    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-7 pb-16 animate-fadeIn text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-lg shadow-2xs">
              📌
            </span>
            Staff Action Items & Tasks Desk
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Track directives, progress updates, and activity discussions across school departments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTasks}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-xs transition-all cursor-pointer flex items-center gap-2 font-bold text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0B462C]' : ''}`} />
            <span>Refresh Desk</span>
          </button>

          {/* Primary Create Task Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#0B462C] hover:bg-[#093823] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task / Directive</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Top Controls: View Switcher (Assigned to Me / Assigned by Me) + Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-100">
          {/* Main View Switcher - Clearly Separated with Generous Padding */}
          <div className="flex items-center gap-1.5 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setView('assigned_to_me')}
              className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                view === 'assigned_to_me'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>📥 Assigned to Me</span>
              {counts.assigned_to_me > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900">
                  {counts.assigned_to_me}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('assigned_by_me')}
              className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 ${
                view === 'assigned_by_me'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>📤 Assigned by Me</span>
              {counts.assigned_by_me > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900">
                  {counts.assigned_by_me}
                </span>
              )}
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              ⏳ Pending
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              🔄 In Progress
            </button>
            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'urgent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              🔴 Urgent
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
              }`}
            >
              ✅ Completed
            </button>
          </div>
        </div>

        {/* Search Bar using CustomTextInput Component */}
        <CustomTextInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search tasks by description, staff name, role, or discussion notes..."
          icon={<Search className="w-4 h-4 text-gray-400" />}
          className="text-sm font-medium py-3"
        />

        {/* Tasks List */}
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#0B462C]" />
            <span className="font-bold text-sm">Loading action items...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-16 text-center text-gray-400 space-y-2.5">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto text-2xl shadow-2xs">
              🎉
            </div>
            <p className="font-bold text-gray-800 text-base">No tasks found</p>
            <p className="text-xs text-gray-500">
              {view === 'assigned_to_me'
                ? "You're all caught up! No pending tasks assigned to you in this filter."
                : 'No tasks matching this status or search filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isCommentsOpen = openCommentsTaskId === task.id;

              // Check if the other party deleted this task
              const otherPartyDeleted =
                view === 'assigned_to_me'
                  ? task.creator_deleted_at
                  : task.assignee_deleted_at;

              const otherPartyName =
                view === 'assigned_to_me'
                  ? task.creator?.name || 'Assigner'
                  : task.assignee?.name || 'Assignee';

              const otherPartyDeletedDate =
                view === 'assigned_to_me'
                  ? task.creator_deleted_at
                  : task.assignee_deleted_at;

              return (
                <div
                  key={task.id}
                  className={`border rounded-3xl p-5 sm:p-6 transition-all space-y-4 ${
                    isCompleted
                      ? 'bg-gray-50/60 border-gray-200/70 opacity-85'
                      : task.status === 'in_progress'
                      ? 'bg-indigo-50/20 border-indigo-200/80 shadow-2xs'
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                  }`}
                >
                  {/* Notice if other party deleted it */}
                  {otherPartyDeleted && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                      <Info className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        ⚠️ This task was removed by {otherPartyName} on{' '}
                        {new Date(otherPartyDeletedDate!).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Row 1: Task Details & 3-State Status Switcher */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Left: Title & Directive Metadata */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`font-black text-sm sm:text-base text-gray-900 leading-snug ${
                            isCompleted ? 'line-through text-gray-400 font-normal' : ''
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        {task.priority === 'urgent' && (
                          <span className="px-2.5 py-0.5 rounded-lg font-black text-[10px] bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 shadow-2xs">
                            <Flame className="w-3 h-3 text-rose-600 fill-rose-600" />
                            URGENT
                          </span>
                        )}
                      </div>

                      {/* Subtitle Details: Directive Chain -> Due Date -> Chat Origin */}
                      <div className="flex flex-wrap items-center gap-2.5 text-gray-600 font-medium text-xs pt-0.5">
                        {/* Assigner -> Assignee Chain */}
                        <div className="flex items-center gap-1.5 bg-gray-100/90 px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
                          <span className="text-gray-400">Directive from:</span>
                          <strong className="text-emerald-950 font-black">{task.creator?.name || 'Staff'}</strong>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black">
                            {task.creator?.role}
                          </span>
                          <span className="text-gray-400 mx-1">➔</span>
                          <span className="text-gray-400">To:</span>
                          <strong className="text-purple-950 font-black">{task.assignee?.name || 'Staff'}</strong>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-black">
                            {task.assignee?.role}
                          </span>
                        </div>

                        {/* Target Due Date */}
                        {task.due_date && (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200/80 font-bold text-xs">
                            <Calendar className="w-3.5 h-3.5 text-amber-700" />
                            <span>Due: {task.due_date}</span>
                          </span>
                        )}

                        {/* Origin Link if converted from chat */}
                        {task.message && (
                          <span className="flex items-center gap-1 bg-purple-50 text-purple-900 px-3 py-1.5 rounded-xl border border-purple-200/80 font-bold text-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                            <span>Born from 1-on-1 Chat</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: 3-State Status Switcher & Delete Action */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        {/* 3-State Status Switcher */}
                        <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-2xs text-xs font-bold">
                          <button
                            type="button"
                            disabled={updatingTaskId === task.id}
                            onClick={() => updateStatus(task.id, 'pending')}
                            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                              task.status === 'pending'
                                ? 'bg-amber-500 text-white shadow-xs font-black'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            ⏳ Pending
                          </button>
                          <button
                            type="button"
                            disabled={updatingTaskId === task.id}
                            onClick={() => updateStatus(task.id, 'in_progress')}
                            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                              task.status === 'in_progress'
                                ? 'bg-indigo-600 text-white shadow-xs font-black'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            🔄 In Progress
                          </button>
                          <button
                            type="button"
                            disabled={updatingTaskId === task.id}
                            onClick={() => updateStatus(task.id, 'completed')}
                            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                              task.status === 'completed'
                                ? 'bg-emerald-700 text-white shadow-xs font-black'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                          >
                            ✅ Completed
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setTaskToDelete(task)}
                          className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200/80 transition-colors cursor-pointer"
                          title="Delete / Remove Task from your desk"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <span className="text-[11px] text-gray-400 font-medium">
                        {isCompleted && task.completed_at
                          ? `Completed ${new Date(task.completed_at).toLocaleDateString()}`
                          : `Created ${new Date(task.created_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Accordion Toggle for Mini Task Discussion / Activity Log */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setOpenCommentsTaskId(isCommentsOpen ? null : task.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isCommentsOpen || (task.comments?.length || 0) > 0
                          ? 'bg-purple-100 text-purple-900 hover:bg-purple-200/80'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
                      <span>
                        {(task.comments?.length || 0) > 0
                          ? `Task Activity & Discussion (${task.comments?.length})`
                          : 'Add Discussion / Progress Note'}
                      </span>
                      {isCommentsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Row 3: Expanded Task Mini-Chat & Activity Log */}
                  {isCommentsOpen && (
                    <div className="p-4 sm:p-5 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-4 animate-fadeIn">
                      {/* Discussion History */}
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {(() => {
                          const uniqueComments = (task.comments || []).filter(
                            (c, index, self) => index === self.findIndex((t) => t.id === c.id)
                          );

                          if (uniqueComments.length === 0) {
                            return (
                              <p className="text-xs text-gray-400 italic py-2 text-center">
                                No progress notes yet. Post an update below to log activity on this directive.
                              </p>
                            );
                          }

                          return uniqueComments.map((c, idx) => {
                            const isMyComment = Number(c.user_id) === Number(user?.id);
                            return (
                              <div
                                key={`task-${task.id}-comment-${c.id}-${idx}`}
                                className={`flex flex-col ${isMyComment ? 'items-end' : 'items-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs space-y-1.5 ${
                                    isMyComment
                                      ? 'bg-purple-700 text-white rounded-tr-xs'
                                      : 'bg-white text-gray-900 border border-gray-200 rounded-tl-xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 text-xs">
                                    <strong className={isMyComment ? 'text-purple-100 font-bold' : 'text-gray-900 font-bold'}>
                                      {c.user?.name || 'Staff'}
                                    </strong>
                                    <span
                                      className={`px-2 py-0.5 rounded-md uppercase font-black text-[9px] ${
                                        isMyComment ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {c.user?.role}
                                    </span>
                                    <span className={isMyComment ? 'text-purple-200 text-[11px] ml-auto' : 'text-gray-400 text-[11px] ml-auto'}>
                                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                                    {c.message}
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Reply / Add Note Input using CustomTextInput */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendComment(task.id);
                        }}
                        className="flex items-center gap-2.5 pt-2 border-t border-gray-200/70"
                      >
                        <div className="flex-1">
                          <CustomTextInput
                            value={commentInputs[task.id] || ''}
                            onChange={(val) => setCommentInputs({ ...commentInputs, [task.id]: val })}
                            placeholder="Post a progress note or update (e.g. 'Met director, asked to bring invoice tomorrow')..."
                            className="text-sm font-medium py-2.5"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submittingCommentTaskId === task.id || !commentInputs[task.id]?.trim()}
                          className="px-5 py-2.5 bg-[#0B462C] hover:bg-[#093823] text-white rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                          {submittingCommentTaskId === task.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>Post Note</span>
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Standalone Create Task Modal */}
      {isCreateModalOpen && (
        <CreateTaskModal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          currentUserId={user?.id}
          onTaskCreated={(newTask) => {
            setTasks((prev) => [newTask, ...prev]);
            setCounts((prev) => ({
              ...prev,
              assigned_by_me: prev.assigned_by_me + 1,
            }));
          }}
        />
      )}

      {/* Custom Styled Delete Confirmation Modal Alert */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/90 w-full max-w-md p-6 sm:p-7 space-y-5 animate-scaleIn">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xl shadow-2xs shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 leading-tight">Remove Task from Desk?</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Confirm task deletion from your view
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Task Title</span>
              <p className="text-xs font-bold text-gray-800 line-clamp-2">
                "{taskToDelete.title}"
              </p>
            </div>

            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              This directive will be removed from your desk view. The other party will still see a notice that it was removed by you.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Remove Task</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

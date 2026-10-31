'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api, BioMachine, BioDeviceUser } from '@/lib/api';

const SYNC_BADGE: Record<string, { label: string; cls: string }> = {
  in_sync: { label: 'IN SYNC', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: 'SYNCING TO MACHINE…', cls: 'bg-amber-100 text-amber-700' },
  synced: { label: 'SYNCED', cls: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'SYNC FAILED', cls: 'bg-red-100 text-red-700' },
};

export default function BioMachinesPage() {
  const [machines, setMachines] = useState<BioMachine[]>([]);
  const [selectedSn, setSelectedSn] = useState<string | null>(null);
  const [users, setUsers] = useState<BioDeviceUser[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [savingPin, setSavingPin] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Update info modal state
  const [updateModal, setUpdateModal] = useState<{
    open: boolean;
    pin: string | null;
    loading: boolean;
    form: {
      student_name: string;
      class: string;
      section: string;
      nsse_ref: string;
      bio_user_id: string;
    };
  }>({ open: false, pin: null, loading: false, form: { student_name: '', class: '', section: '', nsse_ref: '', bio_user_id: '' } });

  const showToast = (text: string, kind: 'success' | 'error' = 'success') => {
    setToast({ text, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchMachines = useCallback(async () => {
    try {
      const res: any = await api.get('/bio-machines');
      setMachines(res.machines || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load machines.', 'error');
    } finally {
      setLoadingMachines(false);
    }
  }, []);

  const fetchUsers = useCallback(async (sn: string) => {
    setLoadingUsers(true);
    try {
      const res: any = await api.get(`/bio-machines/${encodeURIComponent(sn)}/users`);
      setUsers(res.users || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load machine students.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  // Refresh on selection
  useEffect(() => {
    if (selectedSn) {
      fetchUsers(selectedSn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSn]);

  const handlePullUsers = async (sn: string) => {
    try {
      const res: any = await api.post(`/bio-machines/${encodeURIComponent(sn)}/sync-users`, {});
      showToast(res.message || 'Fetch queued.');
      fetchMachines();
    } catch (err: any) {
      showToast(err.message || 'Failed to queue the fetch.', 'error');
    }
  };

  const handleSaveName = async (u: BioDeviceUser) => {
    if (!selectedSn) return;
    const name = (edits[u.device_user_id] ?? '').trim();
    if (!name) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    setSavingPin(u.device_user_id);
    try {
      const res: any = await api.post(
        `/bio-machines/${encodeURIComponent(selectedSn)}/users/${encodeURIComponent(u.device_user_id)}/name`,
        { name }
      );
      showToast(res.message || 'Name saved — syncing to machine…');
      setUsers((prev) => prev.map((row) =>
        row.device_user_id === u.device_user_id
          ? { ...row, pending_name: name, name_sync_status: 'pending', student: row.student ? { ...row.student, student_name: name } : null }
          : row
      ));
      setEdits((prev) => ({ ...prev, [u.device_user_id]: '' }));
    } catch (err: any) {
      showToast(err.message || 'Failed to save name.', 'error');
    } finally {
      setSavingPin(null);
    }
  };

  const openUpdateInfo = (u: BioDeviceUser) => {
    setUpdateModal({
      open: true,
      pin: u.device_user_id,
      loading: false,
      form: {
        student_name: u.student?.student_name || u.device_name || '',
        class: u.student?.class || '',
        section: u.student?.section || '',
        nsse_ref: u.student?.nsse_ref || '',
        bio_user_id: u.student?.bio_user_id || u.device_user_id,
      },
    });
  };

  const handleUpdateInfo = async () => {
    if (!selectedSn || !updateModal.pin) return;
    if (!updateModal.form.student_name.trim()) {
      showToast('Student name is required.', 'error');
      return;
    }

    setUpdateModal((prev) => ({ ...prev, loading: true }));
    try {
      const res: any = await api.post(
        `/bio-machines/${encodeURIComponent(selectedSn)}/users/${encodeURIComponent(updateModal.pin)}/update-info`,
        updateModal.form
      );
      showToast(res.message || 'Student info updated — syncing to machine…');

      // Refresh users to reflect changes
      if (selectedSn) await fetchUsers(selectedSn);
      setUpdateModal((prev) => ({ ...prev, open: false, loading: false }));
    } catch (err: any) {
      showToast(err.message || 'Failed to update student info.', 'error');
      setUpdateModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const classOptions = Array.from(
    new Set(users.map((u) => u.student?.class).filter(Boolean))
  ).sort();

  const handleUpdateAll = async () => {
    setRefreshing(true);
    try {
      await fetchMachines();
      if (selectedSn) await fetchUsers(selectedSn);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = users.filter((u) => {
    if (classFilter !== 'ALL' && u.student?.class !== classFilter) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      u.device_user_id.toLowerCase().includes(q) ||
      (u.device_name || '').toLowerCase().includes(q) ||
      (u.student?.student_name || '').toLowerCase().includes(q) ||
      (u.student?.registration_no || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Bio Machines</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enrolled students per fingerprint machine. Correct names here — every save updates the database and pushes to the machine.
          </p>
        </div>
        <button
          onClick={handleUpdateAll}
          className="shrink-0 bg-gray-900 text-white text-xs font-black px-4 py-2.5 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <span className={refreshing ? 'animate-spin' : ''}>⟳</span> {refreshing ? 'UPDATING…' : 'UPDATE'}
        </button>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-semibold ${toast.kind === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.text}
        </div>
      )}

      {/* Machine list */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {loadingMachines ? (
          <div className="col-span-full text-center py-10 text-gray-400 font-semibold">Loading machines…</div>
        ) : machines.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-400 font-semibold">
            No machines seen yet. Once a device is configured with this server, it appears here.
          </div>
        ) : (
          machines.map((m) => (
            <div
              key={m.machine_sn}
              onClick={() => setSelectedSn(m.machine_sn)}
              className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-shadow hover:shadow-md ${
                selectedSn === m.machine_sn ? 'border-gray-900' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-black text-gray-900">SN: {m.machine_sn}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {m.users_count > 0 ? `${m.users_count} enrolled students` : 'Student list not pulled yet'}
                  </div>
                </div>
                {m.users_count > 0 && m.pending_names > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full">
                    {m.pending_names} SYNCING
                  </span>
                )}
              </div>

              <div className="mt-3 text-[11px] text-gray-500 space-y-0.5">
                <div>Last punch: {m.last_punch_at ? new Date(m.last_punch_at).toLocaleString() : '—'}</div>
                <div>Last command: {m.last_command_status || '—'}{m.last_command_at ? ` · ${new Date(m.last_command_at).toLocaleTimeString()}` : ''}</div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedSn(m.machine_sn); }}
                  className="flex-1 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-700"
                >
                  View Students
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePullUsers(m.machine_sn); }}
                  className="flex-1 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-500"
                >
                  ⇩ Pull Students
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Users of selected machine */}
      {selectedSn && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center gap-3 justify-between">
            <div>
              <h2 className="font-black text-gray-900">Enrolled Students — SN {selectedSn}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update info to assign class, section, NSSE ref and link to the database. Name is also pushed to the machine.
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold bg-white"
              >
                <option value="ALL">All Classes</option>
                {classOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID or name…"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 md:w-64"
              />
              <button
                onClick={() => fetchUsers(selectedSn)}
                className="bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-center py-10 text-gray-400 font-semibold">Loading enrolled students…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-semibold">
              No students recorded yet. Press <span className="text-emerald-600 font-black">⇩ Pull Students</span> on the machine card above —
              the machine uploads its full enrollment list within seconds.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-black">Device ID</th>
                    <th className="px-4 py-3 text-left font-black">Name on Device</th>
                    <th className="px-4 py-3 text-left font-black">Matched Student (Database)</th>
                    <th className="px-4 py-3 text-left font-black">Correct Name → Device</th>
                    <th className="px-4 py-3 text-left font-black">Actions</th>
                    <th className="px-4 py-3 text-left font-black">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const badge = SYNC_BADGE[u.name_sync_status] || SYNC_BADGE.in_sync;
                    return (
                      <tr key={u.device_user_id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{u.device_user_id}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {u.device_name || <span className="text-gray-300">—</span>}
                          {u.pending_name && (
                            <div className="text-xs text-gray-500 mt-1">Requested: {u.pending_name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {u.student ? (
                            <div>
                              <div className="font-bold text-gray-900">{u.student.student_name}</div>
                              <div className="text-[11px] text-gray-400">
                                {u.student.registration_no} · {u.student.class} ({u.student.section})
                                {u.student.nsse_ref ? ` · NSSE: {u.student.nsse_ref}` : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">Not enrolled in directory</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <input
                              value={edits[u.device_user_id] ?? ''}
                              onChange={(e) => setEdits((prev) => ({ ...prev, [u.device_user_id]: e.target.value }))}
                              placeholder={u.device_name || 'Type full name…'}
                              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-40 md:w-56"
                            />
                            <button
                              disabled={savingPin === u.device_user_id}
                              onClick={() => handleSaveName(u)}
                              className="bg-gray-900 text-white text-[11px] font-black px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40"
                            >
                              {savingPin === u.device_user_id ? 'SAVING…' : 'SAVE'}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openUpdateInfo(u)}
                            disabled={savingPin === u.device_user_id || updateModal.loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
                          >
                            {savingPin === u.device_user_id ? 'SAVING…' : 'Update Info'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Update Info Modal */}
      {updateModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setUpdateModal((prev) => ({ ...prev, open: false }))} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-gray-900 text-lg">Update Student Info</h2>
              <button
                onClick={() => setUpdateModal((prev) => ({ ...prev, open: false }))}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Device ID</label>
                <input
                  type="text"
                  value={updateModal.pin || ''}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Student Name *</label>
                <input
                  type="text"
                  value={updateModal.form.student_name}
                  onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, student_name: e.target.value } }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Full name as on machine"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Class</label>
                <input
                  type="text"
                  value={updateModal.form.class}
                  onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, class: e.target.value } }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. Grade 5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  value={updateModal.form.section}
                  onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, section: e.target.value } }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="e.g. A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">NSSE Ref</label>
                <input
                  type="text"
                  value={updateModal.form.nsse_ref}
                  onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, nsse_ref: e.target.value } }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="NSSE reference number"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bio User ID (Machine PIN)</label>
                <input
                  type="text"
                  value={updateModal.form.bio_user_id}
                  onChange={(e) => setUpdateModal((prev) => ({ ...prev, form: { ...prev.form, bio_user_id: e.target.value } }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Device enrollment PIN"
                />
              </div>

              <div className="pt-2 text-xs text-gray-500">
                * Name will be pushed to the machine on its next poll. Class, section, NSSE ref and Bio User ID are saved to the school database.
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setUpdateModal((prev) => ({ ...prev, open: false }))}
                className="flex-1 bg-gray-200 text-gray-800 font-bold px-4 py-2.5 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                disabled={updateModal.loading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInfo}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors"
                disabled={updateModal.loading || !updateModal.form.student_name.trim()}
              >
                {updateModal.loading ? 'UPDATING…' : 'Update Info'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

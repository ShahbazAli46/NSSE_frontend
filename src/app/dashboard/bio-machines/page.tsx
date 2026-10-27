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
      showToast(err.message || 'Failed to load machine users.', 'error');
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

  // While anything is still syncing to a machine, keep polling quietly.
  const hasPending = users.some((u) => u.name_sync_status === 'pending') || machines.some((m) => m.pending_names > 0);
  useEffect(() => {
    if (!hasPending) return;
    const t = setInterval(() => {
      fetchMachines();
      if (selectedSn) fetchUsers(selectedSn);
    }, 8000);
    return () => clearInterval(t);
  }, [hasPending, selectedSn, fetchMachines, fetchUsers]);

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
      // Optimistic local state; the 8s poll confirms when the device ACKs.
      setUsers((prev) => prev.map((row) =>
        row.device_user_id === u.device_user_id
          ? { ...row, name_sync_status: 'pending', student: row.student ? { ...row.student, student_name: name } : null }
          : row
      ));
      setEdits((prev) => ({ ...prev, [u.device_user_id]: '' }));
    } catch (err: any) {
      showToast(err.message || 'Failed to save name.', 'error');
    } finally {
      setSavingPin(null);
    }
  };

  const filtered = users.filter((u) => {
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
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Bio Machines</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enrolled users per fingerprint machine. Correct names here — every save updates the database and pushes to the machine.
        </p>
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
                    {m.users_count > 0 ? `${m.users_count} enrolled users` : 'User list not pulled yet'}
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
                  View Users
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePullUsers(m.machine_sn); }}
                  className="flex-1 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-500"
                >
                  ⇩ Pull Users
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
              <h2 className="font-black text-gray-900">Enrolled Users — SN {selectedSn}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Name edits save to the school database and are pushed to the machine automatically.
              </p>
            </div>
            <div className="flex gap-2">
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
            <div className="text-center py-10 text-gray-400 font-semibold">Loading enrolled users…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-semibold">
              No users recorded yet. Press <span className="text-emerald-600 font-black">⇩ Pull Users</span> on the machine card above —
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
                    <th className="px-4 py-3 text-left font-black">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const badge = SYNC_BADGE[u.name_sync_status] || SYNC_BADGE.in_sync;
                    return (
                      <tr key={u.device_user_id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">{u.device_user_id}</td>
                        <td className="px-4 py-3 text-gray-600">{u.device_name || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {u.student ? (
                            <div>
                              <div className="font-bold text-gray-900">{u.student.student_name}</div>
                              <div className="text-[11px] text-gray-400">{u.student.registration_no} · {u.student.class} ({u.student.section})</div>
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
    </div>
  );
}

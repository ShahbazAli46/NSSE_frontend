'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getStoredUser, User, Expense, getTierInfo, getAttachmentUrl } from '@/lib/api';
import { 
  ArrowLeft, 
  Receipt, 
  Eye, 
  Calendar, 
  Tag, 
  CreditCard, 
  Building, 
  User as UserIcon, 
  ShieldCheck, 
  ExternalLink,
  Download,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const expenseId = params?.id as string;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const fetchExpense = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<any>(`/expenses/${expenseId}`);
      if (res?.data) {
        setExpense(res.data);
      } else {
        setError('Expense record not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load expense details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getStoredUser());
    if (expenseId) {
      fetchExpense();
    }
  }, [expenseId]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading voucher details...</p>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 text-rose-300">
          <h2 className="text-lg font-bold text-white mb-2">Voucher Not Found</h2>
          <p className="text-xs text-rose-300 mb-6">{error || 'This expense does not exist or has been removed.'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tier = getTierInfo(Number(expense.amount));

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cockpit
        </Link>
      </div>

      {/* Main Voucher Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Card Header with Color Tier */}
        <div className={`p-6 border-b border-slate-850 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 border-l-8 ${tier.borderColor}`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold border ${tier.badgeBg}`}>
                {tier.label}
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">
                {expense.voucher_no}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">{expense.title}</h1>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">Category: {expense.category}</p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase font-bold text-slate-400">Voucher Total</span>
            <div className={`text-3xl font-black font-mono mt-0.5 ${tier.badgeText}`}>
              Rs. {Number(expense.amount).toLocaleString('en-PK')}
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mt-1">
              <CheckCircle2 className="w-3 h-3" />
              Posted & Active
            </span>
          </div>
        </div>

        {/* Voucher Body Details */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Transaction Particulars</h3>
            
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Mode:</span>
                <span className="text-white font-bold">{expense.payment_method || 'Cash'}</span>
              </div>
              {expense.cheque && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Cheque Attached:</span>
                  <span className="text-blue-400 font-mono font-bold">
                    #{expense.cheque.cheque_no} ({expense.cheque.beneficiary})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Recorded By:</span>
                <span className="text-slate-200">{expense.creator?.name || 'Accountant'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(expense.created_at).toLocaleString('en-GB')}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description / Purpose</h3>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {expense.description}
              </div>
            </div>
          </div>

          {/* Receipt Preview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Physical Bill / Voucher Document</h3>
            {expense.receipt_url ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center">
                <img
                  src={getAttachmentUrl(expense.receipt_url)}
                  alt="Bill Receipt"
                  className="max-h-64 object-contain rounded-xl shadow mb-3"
                />
                <button
                  onClick={() => setPreviewDocUrl(getAttachmentUrl(expense.receipt_url))}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow"
                >
                  <Eye className="w-4 h-4" />
                  View High-Resolution Bill
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No physical bill uploaded for this entry.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <span className="text-xs font-bold text-slate-200">Attached Bill / Receipt</span>
              <button onClick={() => setPreviewDocUrl(null)} className="p-1 text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center max-h-[80vh]">
              <img
                src={previewDocUrl}
                alt="Receipt"
                className="max-h-[75vh] max-w-full object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

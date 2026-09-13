'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Printer, 
  ArrowLeft, 
  Building2, 
  RefreshCw, 
  AlertCircle, 
  FileSpreadsheet,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { api, PayrollItem } from '@/lib/api';

function numberToWordsPKR(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const intPart = Math.floor(num);
  return `${inWords(intPart)} Rupees Only`;
}

function BankAdviceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const monthParam = searchParams.get('month') || new Date().toISOString().substring(0, 7);
  const initialBank = searchParams.get('bank') || 'all';

  const [month, setMonth] = useState(monthParam);
  const [selectedBank, setSelectedBank] = useState<string>(initialBank);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayroll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res: any = await api.get(`/payroll?month=${month}&type=all`);
      if (res && res.payrolls) {
        setPayrolls(res.payrolls);
      } else {
        setPayrolls([]);
      }
    } catch (err: any) {
      console.error('Failed to load bank payroll records', err);
      setError(err?.message || 'Failed to fetch payroll data for bank disbursement.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [month]);

  // Extract all distinct bank names from bank-payment records
  const bankOptions = useMemo(() => {
    const bankSet = new Set<string>();
    payrolls.forEach((p) => {
      if (p.payment_method === 'bank' && p.bank_name && p.bank_name.trim()) {
        bankSet.add(p.bank_name.trim());
      }
    });
    return Array.from(bankSet).sort();
  }, [payrolls]);

  // Filter bank employees for the chosen bank
  const bankEmployees = useMemo(() => {
    return payrolls.filter((p) => {
      if (p.payment_method !== 'bank') return false;
      if (selectedBank === 'all') return true;
      const bName = (p.bank_name || '').trim().toLowerCase();
      return bName === selectedBank.trim().toLowerCase();
    });
  }, [payrolls, selectedBank]);

  const totalDepositAmount = useMemo(() => {
    return bankEmployees.reduce((sum, e) => sum + (Number(e.net_salary) || 0), 0);
  }, [bankEmployees]);

  const formattedMonthLabel = useMemo(() => {
    const [y, m] = month.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [month]);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
        router.back();
      } else {
        window.close();
        setTimeout(() => {
          router.push('/dashboard');
        }, 150);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20 print:bg-white print:p-0 print:pb-0 font-sans">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Top Floating Control Bar (Hidden on physical print) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="h-5 w-[1px] bg-gray-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0B462C]" />
            <span className="text-sm font-black text-gray-900">
              Bank Salary Transfer Advice & Disbursement Statement
            </span>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bank Selector Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500">Filter Bank:</span>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0B462C]"
            >
              <option value="all">All Commercial Banks ({payrolls.filter(p => p.payment_method === 'bank').length})</option>
              {bankOptions.map((b) => {
                const count = payrolls.filter(p => p.payment_method === 'bank' && p.bank_name?.trim() === b).length;
                return (
                  <option key={b} value={b}>
                    {b} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchPayroll}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Bank Advice (A4)</span>
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 print:p-0 print:max-w-none">
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-gray-200 shadow-xs print:border-none">
            <RefreshCw className="w-8 h-8 text-[#0B462C] animate-spin mx-auto" />
            <div className="text-sm font-bold text-gray-600">Generating Bank Transfer Advice...</div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <div className="font-black text-rose-900">Unable to generate bank statement</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Printable Bank Document */}
        {!isLoading && !error && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
            
            {/* School Header Branding */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-black gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 relative shrink-0">
                  <Image
                    src="/logo.png"
                    alt="NSSE Logo"
                    width={64}
                    height={64}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-black font-cinzel tracking-wider uppercase leading-tight">
                    Nawaz Sharif School of Eminence
                  </h1>
                  <p className="text-xs font-bold text-gray-700 font-cinzel tracking-widest uppercase mt-0.5">
                    Chunian Campus
                  </p>
                  <div className="text-xs font-bold text-[#0B462C] uppercase tracking-wider mt-0.5">
                    Accounts & Payroll Department • Bank Transfer Advice
                  </div>
                </div>
              </div>

              <div className="text-right text-xs text-gray-600 space-y-1">
                <div className="font-black text-black text-sm uppercase">
                  {formattedMonthLabel}
                </div>
                <div className="text-[11px]">
                  Ref: <span className="font-mono font-bold text-gray-900">NSSE-BANK-{month.replace('-', '')}</span>
                </div>
                <div className="text-[10px] text-gray-500">
                  Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {/* Target Bank Subject Block */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-gray-500 font-bold uppercase text-[10px] block">Target Financial Institution / Bank:</span>
                <span className="font-black text-base text-gray-900 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>{selectedBank === 'all' ? 'All Registered Employee Bank Accounts' : selectedBank}</span>
                </span>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-gray-500 font-bold uppercase text-[10px] block">Total Staff Beneficiaries:</span>
                <span className="font-black text-gray-900 text-sm">
                  {bankEmployees.length} Employee{bankEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Instruction to the Bank */}
            <p className="text-xs text-gray-700 leading-relaxed italic print:text-[10.5px]">
              Dear Branch Manager, please accept this official remuneration disbursement advice and debit our institutional account to credit the designated employee accounts listed below for the salary billing month of <strong>{formattedMonthLabel}</strong>.
            </p>

            {/* Bank Disbursement Table */}
            {bankEmployees.length === 0 ? (
              <div className="p-10 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No bank payment records found for {selectedBank === 'all' ? 'this month' : `Bank: ${selectedBank}`}.
              </div>
            ) : (
              <div className="w-full overflow-hidden rounded-2xl border border-gray-300 print:rounded-none">
                <table className="w-full text-left text-xs print:text-[10.5px] border-collapse table-auto md:table-fixed print:table-fixed">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300 text-gray-800 font-black uppercase text-[10px] print:text-[9px] tracking-wider">
                      <th className="p-2.5 print:p-1.5 text-center w-[6%]">SR #</th>
                      <th className="p-2.5 print:p-1.5 w-[26%]">Employee Name & Designation</th>
                      <th className="p-2.5 print:p-1.5 w-[22%]">Bank Name</th>
                      <th className="p-2.5 print:p-1.5 w-[28%]">Bank Account / IBAN</th>
                      <th className="p-2.5 print:p-1.5 text-right w-[18%]">Amount to Deposit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium">
                    {bankEmployees.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-2.5 print:p-1.5 text-center font-bold text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 print:p-1.5">
                          <div className="font-black text-gray-900">{emp.staff_name}</div>
                          <div className="text-[10px] text-gray-500 font-medium">{emp.designation}</div>
                        </td>
                        <td className="p-2.5 print:p-1.5 text-gray-800 font-semibold">
                          {emp.bank_name || 'Commercial Bank'}
                        </td>
                        <td className="p-2.5 print:p-1.5 font-mono font-bold text-blue-950 text-[11.5px] print:text-[10.5px]">
                          {emp.account_number || '—'}
                        </td>
                        <td className="p-2.5 print:p-1.5 text-right font-mono font-black text-gray-900 whitespace-nowrap">
                          PKR {Number(emp.net_salary || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Grand Totals Footer */}
                  <tfoot>
                    <tr className="bg-gray-100 border-t-2 border-black font-black text-gray-900 text-xs print:text-[10px]">
                      <td colSpan={4} className="p-3 print:p-2 text-right uppercase tracking-wider">
                        Grand Total Amount to be Deposited:
                      </td>
                      <td className="p-3 print:p-2 text-right font-mono text-sm print:text-xs text-[#0B462C] whitespace-nowrap">
                        PKR {totalDepositAmount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Total In Words Banner */}
            {bankEmployees.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-emerald-800 font-bold uppercase text-[10px] block">Amount in Words:</span>
                  <span className="font-bold text-emerald-950 italic">
                    {numberToWordsPKR(totalDepositAmount)}
                  </span>
                </div>
                <div className="text-right font-mono font-black text-emerald-900 shrink-0 text-sm">
                  PKR {totalDepositAmount.toLocaleString()}
                </div>
              </div>
            )}

            {/* Official Authorization & Signatures (Print Ready) */}
            <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-gray-800 border-t border-gray-200">
              <div className="space-y-12">
                <div className="border-b border-gray-400 w-4/5 mx-auto" />
                <div>
                  <div>Senior Accountant / HR Officer</div>
                  <div className="text-[10px] text-gray-400 font-normal">Prepared & Reconciled</div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="border-b border-gray-400 w-4/5 mx-auto" />
                <div>
                  <div>Principal / Executive Director</div>
                  <div className="text-[10px] text-gray-400 font-normal">Authorized Signatory</div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="border-b border-gray-400 w-4/5 mx-auto" />
                <div>
                  <div>Branch Manager / Operations</div>
                  <div className="text-[10px] text-gray-400 font-normal">Bank Receiving Stamp</div>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default function BankAdvicePage() {
  return (
    <Suspense fallback={
      <div className="p-16 text-center text-xs font-bold text-gray-400">
        Loading Bank Salary Advice...
      </div>
    }>
      <BankAdviceContent />
    </Suspense>
  );
}

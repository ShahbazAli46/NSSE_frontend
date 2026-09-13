'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  api, 
  Teacher, 
  StaffMember, 
  PayrollItem, 
  AdvanceSalaryRequest, 
  TeacherLedgerData, 
  User, 
  getStoredUser 
} from '@/lib/api';
import { 
  GraduationCap, 
  ArrowLeft, 
  Printer, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  Wallet, 
  FileText, 
  DollarSign, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Gift, 
  MinusCircle, 
  CheckCircle,
  Award,
  ChevronRight,
  FileSpreadsheet,
  Banknote,
  Receipt
} from 'lucide-react';

export default function TeacherLedgerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teacherId = searchParams.get('id');
  const staffType = searchParams.get('type') || 'teacher';

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [data, setData] = useState<TeacherLedgerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLedger = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let endpoint = '';
      if (teacherId) {
        endpoint = `/teachers/${teacherId}/ledger?type=${staffType}`;
      } else {
        endpoint = '/teacher/my-ledger';
      }

      const res: any = await api.get(endpoint);
      if (res?.status === 'success') {
        setData(res);
      } else {
        setError(res?.message || 'Failed to load ledger data.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve faculty financial ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getStoredUser());
    fetchLedger();
  }, [teacherId, staffType]);

  const staff = data?.staff;
  const payrolls = data?.payrolls || [];
  const advanceRequests = data?.advance_requests || [];

  // Advance Salary Metrics
  const totalAdvancesDrawn = useMemo(() => {
    return advanceRequests
      .filter((r) => r.disbursement_status === 'disbursed')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }, [advanceRequests]);

  const totalAdvancesRemaining = useMemo(() => {
    return advanceRequests
      .filter((r) => r.disbursement_status === 'disbursed')
      .reduce((sum, r) => sum + Number(r.remaining_balance || 0), 0);
  }, [advanceRequests]);

  const totalAdvancesRecovered = useMemo(() => {
    return advanceRequests
      .filter((r) => r.disbursement_status === 'disbursed')
      .reduce((sum, r) => sum + Number(r.total_recovered || 0), 0);
  }, [advanceRequests]);

  // Double-entry computation of Debit, Credit, and Running Balance
  const ledgerEntries = useMemo(() => {
    // Sort chronologically (oldest first) to compute cumulative running balance accurately
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

    return withBalance;
  }, [payrolls]);

  const totalCredit = useMemo(() => ledgerEntries.reduce((sum, e) => sum + e.credit, 0), [ledgerEntries]);
  const totalDebit = useMemo(() => ledgerEntries.reduce((sum, e) => sum + e.debit, 0), [ledgerEntries]);
  const currentOutstandingBalance = totalCredit - totalDebit;

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
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20 print:bg-white print:p-0 print:pb-0">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      
      {/* Top Navbar / Header Controls (Hidden during print) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs print:hidden">
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
            <GraduationCap className="w-5 h-5 text-[#0B462C]" />
            <span className="text-sm font-black text-gray-900">
              {staffType === 'teacher' ? 'Faculty Remuneration & Settlement Ledger' : 'Staff Financial & Remuneration Ledger'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchLedger}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ledger (A4)</span>
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6 print:p-0 print:max-w-none">
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-gray-200 shadow-xs print:border-none">
            <RefreshCw className="w-8 h-8 text-[#0B462C] animate-spin mx-auto" />
            <div className="text-sm font-bold text-gray-600">Generating Financial Remuneration Ledger...</div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <div className="font-black text-rose-900">Unable to load employee statement</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && staff && (
          <div className="space-y-6 print:space-y-5">
            
            {/* ================= OFFICIAL INSTITUTIONAL HEADER & EMPLOYEE PROFILE ================= */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
              
              {/* School Branding Crest */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-14 h-14 relative shrink-0">
                  <Image
                    src="/logo.png"
                    alt="NSSE Logo"
                    width={56}
                    height={56}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-black font-cinzel tracking-wider uppercase leading-tight">
                    Nawaz Sharif School of Eminence
                  </h1>
                  <p className="text-xs font-bold text-gray-700 font-cinzel tracking-widest uppercase mt-0.5">
                    Chunian Campus
                  </p>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mt-0.5">
                    {staffType === 'teacher' ? 'Faculty Remuneration & Settlement Ledger' : 'Staff & Administration Remuneration Ledger'}
                  </div>
                </div>
              </div>

              {/* Profile Identity Box */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-200 print:bg-transparent print:border-gray-300">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-gray-900 leading-snug">
                      {staff.name}
                    </h2>
                    {'designation' in staff && staff.designation && (
                      <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                        {staff.designation}
                      </span>
                    )}
                    {'qualification' in staff && staff.qualification && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        {staff.qualification}
                      </span>
                    )}
                    {'father_name' in staff && staff.father_name && (
                      <span className="text-xs text-gray-500">
                        S/D/W of: <span className="font-bold text-gray-700">{staff.father_name}</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-gray-200/70">
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">CNIC / ID:</span>
                      <span className="font-mono font-bold text-gray-800">{staff.cnic || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Mobile:</span>
                      <span className="font-semibold text-gray-800">{staff.contact_number || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Payment Method:</span>
                      <span className="font-bold text-gray-800 uppercase">
                        {staff.payment_method === 'bank' ? '🏦 Bank Transfer' : '💵 Cash Counter'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[10px] uppercase">Base Salary:</span>
                      <span className="font-mono font-black text-emerald-800">
                        PKR {Number(staff.salary || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Faculty Portrait Photo */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-800 to-[#0B462C] text-white flex items-center justify-center font-black text-2xl shadow-xs overflow-hidden border border-gray-200 shrink-0">
                  {staff.profile_picture_url ? (
                    <img 
                      src={staff.profile_picture_url} 
                      alt={staff.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{staff.name.charAt(0)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ================= FINANCIAL KPI SUMMARY CARDS ================= */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 print:grid-cols-4">
              <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Monthly Base Salary
                </span>
                <div className="text-lg font-black text-gray-900 font-mono">
                  PKR {Number(staff.salary || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Standard compensation</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-emerald-200 shadow-xs space-y-1 bg-gradient-to-br from-emerald-50/50 to-transparent">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Accrued (Credit)
                </span>
                <div className="text-lg font-black text-emerald-900 font-mono">
                  PKR {totalCredit.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">{ledgerEntries.length} payroll periods</span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-amber-200 shadow-xs space-y-1 bg-gradient-to-br from-amber-50/50 to-transparent">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Advance Salary Drawn
                  </span>
                  {totalAdvancesRemaining > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-200 text-amber-950">
                      Active Loan
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-amber-900 font-mono">
                  PKR {totalAdvancesDrawn.toLocaleString()}
                </div>
                <span className="text-[10px] text-amber-800 font-semibold block">
                  PKR {totalAdvancesRemaining.toLocaleString()} Outstanding Balance
                </span>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-blue-200 shadow-xs space-y-1 bg-gradient-to-br from-blue-50/50 to-transparent">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  Net Settlement (Payable)
                </span>
                <div className="text-lg font-black font-mono text-blue-950">
                  PKR {currentOutstandingBalance.toLocaleString()}
                </div>
                <span className="text-[10px] font-bold text-blue-700">
                  {currentOutstandingBalance === 0 ? 'Fully Cleared ✓' : 'Payable by School'}
                </span>
              </div>
            </div>

            {/* ================= MONTH-BY-MONTH REMUNERATION & SETTLEMENT LEDGER ================= */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-[#0B462C]" />
                  <div>
                    <h3 className="text-base font-black text-gray-900">
                      Monthly Remuneration & Settlement Statement
                    </h3>
                    <p className="text-xs text-gray-500">Double-entry record of accrued earnings (Credit), disbursements (Debit), and running balances</p>
                  </div>
                </div>

                {/* Outstanding Balance Badge */}
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-2 text-xs">
                    <span className="text-gray-500 font-bold">Ledger Balance:</span>
                    <span className={`font-mono font-black ${
                      currentOutstandingBalance > 0 ? 'text-amber-800' : 'text-emerald-800'
                    }`}>
                      PKR {currentOutstandingBalance.toLocaleString()} {currentOutstandingBalance > 0 ? 'Cr (Payable)' : '(Cleared ✓)'}
                    </span>
                  </div>
                </div>
              </div>

              {ledgerEntries.length === 0 ? (
                <div className="p-8 text-center text-xs font-bold text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No monthly payroll statements generated yet for this employee.
                </div>
              ) : (
                <div className="w-full overflow-hidden rounded-2xl border border-gray-200 print:border-gray-300">
                  <table className="w-full text-left text-xs print:text-[10px] border-collapse table-auto md:table-fixed print:table-fixed">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-black uppercase text-[10px] print:text-[8.5px] tracking-wider">
                        <th className="p-2.5 print:p-1 w-[11%]">Month</th>
                        <th className="p-2.5 print:p-1 w-[20%]">Attendance Details</th>
                        <th className="p-2.5 print:p-1 text-right w-[11%]">Gross Pay</th>
                        <th className="p-2.5 print:p-1 text-right w-[13%]">Deductions & Advances</th>
                        <th className="p-2.5 print:p-1 text-right bg-emerald-50/60 text-emerald-900 border-x border-emerald-100 w-[13%]">
                          Credit (Cr)
                          <span className="block text-[8px] font-medium text-emerald-700 font-sans lowercase">accrued</span>
                        </th>
                        <th className="p-2.5 print:p-1 text-right bg-blue-50/60 text-blue-900 border-r border-blue-100 w-[13%]">
                          Debit (Dr)
                          <span className="block text-[8px] font-medium text-blue-700 font-sans lowercase">paid</span>
                        </th>
                        <th className="p-2.5 print:p-1 text-right bg-gray-100/70 text-gray-900 font-black w-[13%]">
                          Running Balance
                          <span className="block text-[8px] font-medium text-gray-500 font-sans lowercase">cumulative</span>
                        </th>
                        <th className="p-2.5 print:p-1 text-center w-[9%]">Status</th>
                        <th className="p-2.5 print:p-1 text-center print:hidden w-[5%]">Slip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {ledgerEntries.map((p) => {
                        const totalDeductions = Math.max(
                          0, 
                          Math.round(Number(p.gross_salary || 0) - Number(p.net_salary || 0))
                        );

                        return (
                          <tr key={p.id} className="hover:bg-gray-50/80 transition">
                            <td className="p-2.5 print:p-1 font-bold text-gray-900 whitespace-nowrap">
                              {p.month}
                            </td>
                            
                            <td className="p-2.5 print:p-1 text-[11px] print:text-[9.5px] text-gray-600">
                              <span className="font-bold text-gray-800">{p.total_working_days}d</span>
                              <span className="text-gray-400 mx-0.5">•</span>
                              <span className="text-emerald-700 font-semibold">{p.present_days}P</span>
                              <span className="text-gray-400 mx-0.5">•</span>
                              <span className="text-amber-700 font-semibold">{p.late_days}L</span>
                              <span className="text-gray-400 mx-0.5">•</span>
                              <span className="text-blue-700 font-semibold">{p.leave_days || 0}Lv</span>
                              <span className="text-gray-400 mx-0.5">•</span>
                              <span className="text-rose-700 font-semibold">{p.absent_days}A</span>
                            </td>

                            <td className="p-2.5 print:p-1 text-right font-mono text-gray-800 whitespace-nowrap">
                              PKR {Number(p.gross_salary).toLocaleString()}
                            </td>

                            <td className="p-2.5 print:p-1 text-right font-mono text-rose-700 whitespace-nowrap">
                              {totalDeductions > 0 ? (
                                <div>
                                  <span className="font-bold">-PKR {totalDeductions.toLocaleString()}</span>
                                  {Number(p.absent_deduction) > 0 && (
                                    <div className="text-[9px] text-gray-400">Absent: {Number(p.absent_deduction).toLocaleString()}</div>
                                  )}
                                  {Number(p.advance_deduction) > 0 && (
                                    <div className="text-[9px] text-amber-700 font-bold">Advance: -PKR {Number(p.advance_deduction).toLocaleString()}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>

                            {/* Credit Column (Earned Net Salary) */}
                            <td className="p-2.5 print:p-1 text-right font-mono font-black text-emerald-800 bg-emerald-50/40 border-x border-emerald-100 whitespace-nowrap">
                              +PKR {p.credit.toLocaleString()}
                            </td>

                            {/* Debit Column (Disbursed/Paid) */}
                            <td className="p-2.5 print:p-1 text-right font-mono font-black text-blue-900 bg-blue-50/40 border-r border-blue-100 whitespace-nowrap">
                              {p.debit > 0 ? `PKR ${p.debit.toLocaleString()}` : <span className="text-gray-300 font-normal">—</span>}
                            </td>

                            {/* Running Balance Column */}
                            <td className="p-2.5 print:p-1 text-right font-mono font-black bg-gray-50/60 whitespace-nowrap">
                              {p.balance > 0 ? (
                                <span className="text-amber-900 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded text-[10.5px] print:text-[9.5px]">
                                  PKR {p.balance.toLocaleString()} Cr
                                </span>
                              ) : (
                                <span className="text-emerald-700 text-[10.5px] print:text-[9.5px] font-bold">
                                  0.00 (Cleared ✓)
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 print:p-1 text-center whitespace-nowrap">
                              {p.status === 'paid' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] print:text-[8.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  Paid ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] print:text-[8.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  Unpaid
                                </span>
                              )}
                            </td>

                            <td className="p-2.5 print:p-1 text-center print:hidden">
                              <Link
                                href={`/payroll/payslip?id=${p.id}`}
                                target="_blank"
                                className="p-1 rounded-lg text-[#0B462C] hover:bg-emerald-50 border border-emerald-200 transition inline-flex items-center justify-center font-bold text-[10px]"
                                title="Open Payslip"
                              >
                                View ↗
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    
                    {/* Ledger Totals Footer */}
                    <tfoot>
                      <tr className="bg-gray-100 border-t-2 border-gray-300 font-black text-gray-900 text-xs print:text-[9.5px]">
                        <td colSpan={4} className="p-2.5 print:p-1 text-right uppercase tracking-wider text-[10px] print:text-[8.5px]">
                          Ledger Totals & Net Settlement:
                        </td>
                        <td className="p-2.5 print:p-1 text-right font-mono text-emerald-900 bg-emerald-100/70 border-x border-emerald-200 whitespace-nowrap">
                          PKR {totalCredit.toLocaleString()}
                        </td>
                        <td className="p-2.5 print:p-1 text-right font-mono text-blue-900 bg-blue-100/70 border-r border-blue-200 whitespace-nowrap">
                          PKR {totalDebit.toLocaleString()}
                        </td>
                        <td className="p-2.5 print:p-1 text-right font-mono bg-gray-200/80 whitespace-nowrap">
                          <span className={currentOutstandingBalance > 0 ? 'text-amber-900 font-black' : 'text-emerald-900'}>
                            PKR {currentOutstandingBalance.toLocaleString()} {currentOutstandingBalance > 0 ? 'Cr' : '✓'}
                          </span>
                        </td>
                        <td className="p-2.5 print:p-1 text-center text-[10px] print:text-[8.5px] text-gray-600 font-bold whitespace-nowrap">
                          {currentOutstandingBalance === 0 ? 'Settled' : 'Payable'}
                        </td>
                        <td className="print:hidden" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

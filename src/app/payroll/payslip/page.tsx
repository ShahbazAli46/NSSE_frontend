'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Printer, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api, PayrollItem } from '@/lib/api';

// Helper to convert number to Pakistani Rupees Words
function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  const intPart = Math.floor(Math.abs(num));
  return inWords(intPart) + ' Rupees Only';
}

export default function PayslipPrintPage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const monthParam = searchParams.get('month') || '2026-08';
  const typeParam = searchParams.get('type') || 'all';

  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (idParam) {
          const res: any = await api.get(`/payroll/${idParam}`);
          const item = res?.payroll || res?.data || res;
          setPayrolls([item]);
        } else {
          const res: any = await api.get(`/payroll?month=${monthParam}&type=${typeParam}`);
          const data = res?.data || res;
          setPayrolls(data?.payrolls || []);
        }
      } catch (err: any) {
        console.error('Failed to load payslips:', err);
        setError(err.message || 'Failed to fetch payroll data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [idParam, monthParam, typeParam]);

  // Format month label (e.g. August 2026)
  const monthLabel = useMemo(() => {
    if (payrolls.length > 0 && payrolls[0].month) {
      try {
        const d = new Date(payrolls[0].month + '-01T00:00:00');
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } catch {
        return payrolls[0].month;
      }
    }
    return monthParam;
  }, [payrolls, monthParam]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-gray-500 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0B462C]" />
        <p className="text-sm font-bold">Generating Official Salary Slips...</p>
      </div>
    );
  }

  if (error || payrolls.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-3 font-sans">
        <div className="text-rose-600 font-bold text-lg">No Payslips Available</div>
        <p className="text-xs text-gray-500">{error || 'No payroll records found for this selection.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white text-gray-900 p-2 sm:p-6 font-sans">
      
      {/* Top Floating Control Bar (Hidden on physical print) */}
      <div className="max-w-4xl mx-auto mb-4 bg-white p-4 rounded-2xl shadow-md border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-sm font-black text-gray-900">
            Official Salary Slips • {monthLabel}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {payrolls.length} {payrolls.length === 1 ? 'Salary Slip' : 'Salary Slips'} Ready for Printing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C5A059]" />
            <span>Print {payrolls.length} {payrolls.length === 1 ? 'Slip' : 'Slips'} (A4)</span>
          </button>
          
          <button
            type="button"
            onClick={() => window.close()}
            className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* ================= PRINTABLE PAYSLIP SLIPS ================= */}
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-0">
        {payrolls.map((item, index) => {
          const gross = Number(item.gross_salary || 0);
          const base = Number(item.base_salary || 0);
          const allowances = is_array(item.allowances) ? item.allowances : [];
          const bonuses = is_array(item.bonuses) ? item.bonuses : [];
          const absentDeduction = Number(item.absent_deduction || 0);
          const advanceDeduction = Number(item.advance_deduction || 0);
          const customDeductions = is_array(item.custom_deductions) ? item.custom_deductions : [];
          const otherDeduction = Number(item.other_deductions || 0);
          const totalDeductions = absentDeduction + otherDeduction;
          const netPay = Number(item.net_salary || 0);

          function is_array(arr: any): arr is any[] {
            return Array.isArray(arr);
          }

          return (
            <div
              key={item.id}
              className="payslip-page bg-white p-6 sm:p-8 border border-gray-300 rounded-2xl shadow-xs print:p-0 print:border-none print:shadow-none space-y-4"
            >
              {/* Slip Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
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

                <div className="text-center flex-1 px-4">
                  <h1 className="text-lg sm:text-xl font-black text-black font-cinzel tracking-wider uppercase leading-tight">
                    Nawaz Sharif School of Eminence
                  </h1>
                  <p className="text-xs font-bold text-gray-700 font-cinzel tracking-widest uppercase mt-0.5">
                    Chunian Campus • Accounts & Payroll Department
                  </p>
                  <div className="inline-block px-3 py-0.5 mt-1 rounded bg-gray-100 border border-gray-400 text-[11px] font-black uppercase tracking-wider text-black">
                    Monthly Salary Disbursement Slip — {monthLabel}
                  </div>
                </div>

                <div className="text-right text-xs text-black font-bold shrink-0 space-y-0.5">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Voucher / Slip Ref</div>
                  <div className="font-mono text-xs font-black">PAY-{item.month.replace('-', '')}-{String(item.id).padStart(4, '0')}</div>
                  <div className="text-[10px] text-gray-600 font-semibold">Session 2026-2027</div>
                </div>
              </div>

              {/* Employee & Attendance Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-300 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Employee Name</span>
                  <span className="font-black text-black text-sm">{item.staff_name}</span>
                </div>

                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Designation & Role</span>
                  <span className="font-bold text-gray-800">{item.designation}</span>
                </div>

                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Disbursement Mode</span>
                  <span className="font-bold text-gray-900">
                    {item.payment_method === 'bank' ? `🏦 Bank (${item.bank_name || 'Bank Transfer'})` : '💵 Cash in Hand'}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Account / IBAN</span>
                  <span className="font-mono font-bold text-gray-800 text-[11px]">
                    {item.account_number || (item.payment_method === 'cash' ? 'Cash Counter' : 'N/A')}
                  </span>
                </div>
              </div>

              {/* Attendance Breakdown Bar */}
              <div className="grid grid-cols-5 gap-2 p-2 bg-gray-100/80 border border-gray-200 rounded-lg text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">Working Days</span>
                  <span className="font-black text-gray-900">{item.total_working_days}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-800 font-bold block">Days Present</span>
                  <span className="font-black text-emerald-900">{item.present_days}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 font-bold block">Late Days</span>
                  <span className="font-black text-amber-900">{item.late_days}</span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-800 font-bold block">Approved Leaves</span>
                  <span className="font-black text-sky-900">{item.leave_days}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-800 font-bold block">Unexcused Absents</span>
                  <span className="font-black text-rose-900">{item.absent_days}</span>
                </div>
              </div>

              {/* Earnings vs Deductions Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Left: Earnings */}
                <div className="border border-black rounded-xl overflow-hidden text-xs">
                  <div className="bg-gray-100 px-3 py-1.5 font-black uppercase text-[10.5px] border-b border-black text-black">
                    1. Earnings, Allowances & Bonuses
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                      <span className="text-gray-700 font-medium">Basic Base Salary</span>
                      <span className="font-mono font-bold text-gray-900">PKR {base.toLocaleString()}</span>
                    </div>

                    {allowances.map((al: any, aIdx: number) => (
                      <div key={`al-${aIdx}`} className="flex justify-between items-center py-1 border-b border-gray-200 text-gray-600">
                        <span>{al.title} (Allowance)</span>
                        <span className="font-mono font-bold text-gray-800">+ PKR {Number(al.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}

                    {bonuses.map((b: any, bIdx: number) => (
                      <div key={`b-${bIdx}`} className="flex justify-between items-center py-1 border-b border-gray-200 text-emerald-800 bg-emerald-50/50 px-1 rounded">
                        <span className="font-semibold">{b.title} (Bonus)</span>
                        <span className="font-mono font-bold">+ PKR {Number(b.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-2 font-black text-black text-[12px]">
                      <span>Total Gross Earnings</span>
                      <span className="font-mono text-sm">PKR {gross.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Deductions */}
                <div className="border border-black rounded-xl overflow-hidden text-xs flex flex-col justify-between">
                  <div>
                    <div className="bg-gray-100 px-3 py-1.5 font-black uppercase text-[10.5px] border-b border-black text-black">
                      2. Deductions & Advances
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">
                          Absent Days Deduction ({item.absent_days} {item.absent_days === 1 ? 'day' : 'days'})
                        </span>
                        <span className="font-mono font-bold text-rose-700">
                          - PKR {absentDeduction.toLocaleString()}
                        </span>
                      </div>

                      {advanceDeduction > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-gray-200 text-rose-700">
                          <span className="font-medium">Advance Salary Deduction</span>
                          <span className="font-mono font-bold">
                            - PKR {advanceDeduction.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {customDeductions.map((cd: any, cdIdx: number) => (
                        <div key={`cd-${cdIdx}`} className="flex justify-between items-center py-1 border-b border-gray-200 text-rose-700">
                          <span>{cd.title}</span>
                          <span className="font-mono font-bold">
                            - PKR {Number(cd.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 border-t border-gray-300">
                    <div className="flex justify-between items-center font-black text-black text-[12px]">
                      <span>Total Deductions</span>
                      <span className="font-mono text-sm text-rose-800">
                        - PKR {totalDeductions.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Net Payable Highlight Banner */}
              <div className="p-4 rounded-xl bg-gray-100 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 block">
                    Net Monthly Remuneration Payable
                  </span>
                  <div className="text-sm font-bold text-gray-800 italic mt-0.5">
                    Amount in words: <span className="font-black not-italic text-black">{numberToWords(netPay)}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-black text-[#0B462C] font-mono tracking-tight">
                    PKR {netPay.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    Disbursement: {item.payment_method === 'bank' ? 'Bank Transfer' : 'Cash Counter'}
                  </span>
                </div>
              </div>

              {/* Signatures Authorization Footer */}
              <div className="grid grid-cols-3 gap-6 pt-6 pb-2 text-xs break-inside-avoid">
                <div className="space-y-10 text-center">
                  <div className="border-t border-black pt-1">
                    <div className="font-black text-black text-[11px] uppercase">Employee Signature</div>
                    <div className="text-[9.5px] text-gray-500">Receiver Acknowledgement</div>
                  </div>
                </div>

                <div className="space-y-10 text-center">
                  <div className="border-t border-black pt-1">
                    <div className="font-black text-black text-[11px] uppercase">Accounts / HR Officer</div>
                    <div className="text-[9.5px] text-gray-500">Prepared & Verified</div>
                  </div>
                </div>

                <div className="space-y-10 text-center">
                  <div className="border-t border-black pt-1">
                    <div className="font-black text-black text-[11px] uppercase">Principal / Executive Seal</div>
                    <div className="text-[9.5px] text-gray-500">Authorized Campus Approval</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-1 flex items-center justify-between text-[9px] text-gray-400">
                <span>NSSE Institutional Management System • Payroll Record</span>
                <span>Slip Ref: PAY-{item.month}-{item.id}</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Print Styles for A4 Paper with Page Breaks */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          html, body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .payslip-page {
            break-after: page;
            page-break-after: always;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 0 !important;
          }
          .payslip-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}

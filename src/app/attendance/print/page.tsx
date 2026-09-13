'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Printer, X, RefreshCw, Calendar } from 'lucide-react';
import { api, AttendanceRosterItem } from '@/lib/api';

export default function AttendancePrintPage() {
  const searchParams = useSearchParams();
  const startDateParam = searchParams.get('startDate') || searchParams.get('date') || new Date().toISOString().split('T')[0];
  const endDateParam = searchParams.get('endDate') || startDateParam;
  const typeParam = searchParams.get('type') || 'all';

  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Generate array of consecutive dates between startDate and endDate
  const datesList = useMemo(() => {
    try {
      const start = new Date(startDateParam + 'T00:00:00');
      const end = new Date(endDateParam + 'T00:00:00');
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return [startDateParam];
      }
      const dates: string[] = [];
      const curr = new Date(start);
      // Safety limit up to 45 days
      let count = 0;
      while (curr <= end && count < 45) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
        count++;
      }
      return dates.length > 0 ? dates : [startDateParam];
    } catch {
      return [startDateParam];
    }
  }, [startDateParam, endDateParam]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res: any = await api.get(`/attendance/daily?date=${startDateParam}&type=${typeParam}`);
        const data = res?.data || res;
        setRoster(data?.roster || []);
      } catch (err: any) {
        console.error('Failed to load roster for printing:', err);
        setError(err.message || 'Failed to fetch attendance data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDateParam, typeParam]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 text-gray-500 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0B462C]" />
        <p className="text-sm font-bold">Preparing Official Sign-In Sheets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center space-y-3 font-sans">
        <div className="text-rose-600 font-bold text-lg">Unable to load print register</div>
        <p className="text-xs text-gray-500">{error}</p>
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
        <div className="space-y-0.5">
          <h2 className="text-sm font-black text-gray-900">
            Daily Staff Sign-In Register ({datesList.length} {datesList.length === 1 ? 'Day' : 'Days'} Sheet)
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {formatDateDisplay(datesList[0])} {datesList.length > 1 ? ` — ${formatDateDisplay(datesList[datesList.length - 1])}` : ''} • {roster.length} Personnel
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-[#E8D4A2] font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#C5A059]" />
            <span>Print {datesList.length} {datesList.length === 1 ? 'Sheet' : 'Sheets'} (A4)</span>
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

      {/* ================= PRINTABLE DAILY PAGES ================= */}
      <div className="max-w-4xl mx-auto space-y-6 print:space-y-0">
        {datesList.map((dateStr, pageIndex) => {
          return (
            <div 
              key={dateStr}
              className="print-page bg-white p-5 sm:p-6 border border-gray-300 rounded-2xl shadow-xs print:p-0 print:border-none print:shadow-none space-y-4"
            >
              {/* Header with NSSE Crest */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
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

                <div className="text-center flex-1 px-3">
                  <h1 className="text-lg sm:text-xl font-black text-black font-cinzel tracking-wider uppercase leading-tight">
                    Nawaz Sharif School of Eminence
                  </h1>
                  <p className="text-[11px] font-bold text-gray-700 font-cinzel tracking-widest uppercase mt-0.5">
                    Chunian Campus
                  </p>
                  <div className="inline-block px-3 py-0.5 mt-1 rounded bg-gray-100 border border-gray-400 text-[10.5px] font-black uppercase tracking-wider text-black">
                    Daily Faculty & Staff Sign-In Register
                  </div>
                </div>

                <div className="text-right text-xs text-black font-bold shrink-0 space-y-0.5">
                  <div className="text-[11px] text-gray-600 uppercase font-semibold">Date</div>
                  <div className="text-xs font-black">{formatDateDisplay(dateStr)}</div>
                  <div className="text-[10px] text-gray-500 font-medium">Session: 2026-2027</div>
                </div>
              </div>

              {/* Clean Table: Sr # | Staff Name | In-Time | Morning Signature | Out-Time | Closing Signature */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-black font-black uppercase text-[10px] tracking-wider">
                      <th className="border border-black px-2 py-2 text-center w-10">Sr #</th>
                      <th className="border border-black px-3 py-2 text-left">Staff Member Name</th>
                      <th className="border border-black px-2.5 py-2 text-center w-28">Arrival Time</th>
                      <th className="border border-black px-3 py-2 text-center w-40">Morning Signature</th>
                      <th className="border border-black px-2.5 py-2 text-center w-28">Departure Time</th>
                      <th className="border border-black px-3 py-2 text-center w-40">Closing Signature</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((member, idx) => {
                      return (
                        <tr key={member.key} className="hover:bg-gray-50/50">
                          <td className="border border-black px-2 py-2.5 text-center font-bold text-black text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="border border-black px-3 py-2.5">
                            <div className="font-black text-black text-[12px]">{member.name}</div>
                          </td>
                          <td className="border border-black px-2.5 py-2.5 text-center font-mono text-[11px]">
                            {/* Blank space for arrival time entry */}
                          </td>
                          <td className="border border-black px-3 py-2.5 text-center">
                            {/* Signature Box */}
                            <div className="h-6" />
                          </td>
                          <td className="border border-black px-2.5 py-2.5 text-center font-mono text-[11px]">
                            {/* Blank space for departure time entry */}
                          </td>
                          <td className="border border-black px-3 py-2.5 text-center">
                            {/* Signature Box */}
                            <div className="h-6" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          );
        })}
      </div>

      {/* Print Styles with Reduced Margins and Page Breaks */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 6mm;
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
          .print-page {
            break-after: page;
            page-break-after: always;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 0 !important;
          }
          .print-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}

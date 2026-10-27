const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'director' | 'chairman' | 'accountant' | 'principal' | 'super_admin' | 'hr_accountant' | 'teacher' | string;
  is_active?: boolean;
}
export interface Student {
  id: number;
  registration_no: string;
  student_name: string;
  father_name?: string | null;
  b_form_no?: string | null;
  class: string;
  session: string;
  section: string;
  gender?: string | null;
  admission_date?: string | null;
  mobile_no?: string | null;
  photo_path?: string | null;
  photo_url?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  creator?: {
    id: number;
    name: string;
    role: string;
  };
}

export interface StudentStats {
  total_students: number;
  with_photos: number;
  gender_breakdown: Record<string, number>;
  class_breakdown: Record<string, number>;
}

export interface SchoolSection {
  id: number;
  name: string;
  class: string;
  session: string;
  capacity?: number;
  count: number;
  created_at?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface BioMachine {
  machine_sn: string;
  users_count: number;
  pending_names: number;
  last_registry_seen?: string | null;
  last_punch_at?: string | null;
  last_command_status?: string | null;
  last_command_at?: string | null;
}

export interface BioDeviceUser {
  device_user_id: string;
  device_name?: string | null;
  name_sync_status: 'in_sync' | 'pending' | 'synced' | 'failed';
  card_no?: string | null;
  privilege: number;
  last_seen_at?: string | null;
  student?: {
    id: number;
    registration_no: string;
    student_name: string;
    class: string;
    section: string;
  } | null;
}
export interface StudentAttendanceRosterItem {
  id: number;
  registration_no: string;
  student_name: string;
  father_name?: string | null;
  b_form_no?: string | null;
  class: string;
  section: string;
  gender?: string | null;
  mobile_no?: string | null;
  photo_url?: string | null;
  attendance_status: AttendanceStatus;
  remarks?: string | null;
}

export interface AttendanceClassProgress {
  section: string;
  total: number;
  is_marked: boolean;
  present: number;
  absent: number;
  teacher_name?: string | null;
  marked_at?: string | null;
}

export interface AttendanceClassSheet {
  date: string;
  session: string;
  class: string;
  section: string;
  is_marked: boolean;
  teacher_name?: string | null;
  marked_at?: string | null;
  total_students: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  leave_count: number;
  roster: StudentAttendanceRosterItem[];
  class_progress: AttendanceClassProgress[];
}

export interface AbsenteeStudent {
  id: number;
  student_id: number;
  student_name: string;
  father_name?: string | null;
  registration_no: string;
  mobile_no?: string | null;
  photo_url?: string | null;
  class: string;
  section: string;
  teacher_name?: string | null;
  remarks?: string | null;
  follow_up_status?: 'pending' | 'contacted' | 'unreachable' | 'not_required';
  follow_up_reason?: string | null;
  follow_up_notes?: string | null;
  followed_up_by?: number | null;
  followed_up_by_name?: string | null;
  followed_up_at?: string | null;
  whatsapp_status?: 'pending' | 'queued' | 'sent' | 'failed' | 'skipped';
  whatsapp_msg_id?: string | null;
  whatsapp_sent_at?: string | null;
  whatsapp_error?: string | null;
}

export interface FollowUpSummary {
  total_absent: number;
  contacted: number;
  pending: number;
  unreachable: number;
}

export interface WhatsAppBroadcastSummary {
  total_absent: number;
  sent: number;
  queued: number;
  failed: number;
  skipped: number;
  pending: number;
}

export interface DailyAttendanceSummary {
  date: string;
  session: string;
  total_enrolled: number;
  total_marked: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendance_rate: number;
  classes_summary: {
    class: string;
    section: string;
    teacher_name?: string | null;
    last_marked_at?: string | null;
    present: number | string;
    absent: number | string;
    total: number;
  }[];
  follow_up_summary?: FollowUpSummary;
  whatsapp_summary?: WhatsAppBroadcastSummary;
  absentees: AbsenteeStudent[];
}

export interface MonthlyAttendanceDay {
  day: number;
  date: string;
  day_name: string;
  is_sunday: boolean;
  is_weekend: boolean;
  is_future: boolean;
  is_today: boolean;
}

export interface MonthlyAttendanceDayStatus {
  status: 'present' | 'absent' | 'late' | 'leave' | 'sunday' | 'future' | 'unmarked';
  code: 'P' | 'A' | 'L' | 'Lv' | 'Sun' | '—' | '-';
  remarks?: string | null;
}

export interface MonthlyAttendanceStudent {
  id: number;
  registration_no: string;
  student_name: string;
  father_name?: string | null;
  b_form_no?: string | null;
  class: string;
  section: string;
  gender?: string | null;
  mobile_no?: string | null;
  photo_url?: string | null;
  days: Record<string, MonthlyAttendanceDayStatus>;
  present_count: number;
  absent_count: number;
  late_count: number;
  leave_count: number;
  marked_days: number;
  attendance_percentage: number;
}

export interface MonthlyAttendanceRegister {
  session: string;
  class: string;
  section: string;
  month: string;
  month_name: string;
  days_in_month: number;
  days: MonthlyAttendanceDay[];
  working_days: number;
  summary: {
    total_students: number;
    avg_attendance_rate: number;
    total_present_instances: number;
    total_absent_instances: number;
    total_late_instances: number;
    total_leave_instances: number;
  };
  daily_totals: Record<string, {
    present: number;
    absent: number;
    late: number;
    leave: number;
    unmarked: number;
    total: number;
  }>;
  students: MonthlyAttendanceStudent[];
}

export interface TeacherAllowance {
  title: string;
  amount: number;
}

export interface Teacher {
  id: number;
  user_id?: number;
  name: string;
  father_name?: string;
  cnic?: string;
  contact_number?: string;
  emergency_number?: string;
  qualification?: string;
  teaching_since?: string;
  profile_picture?: string;
  profile_picture_url?: string;
  address?: string;
  city?: string;
  date_of_joining?: string;
  salary: number | string;
  allowances?: TeacherAllowance[] | null;
  total_allowances?: number;
  gross_salary?: number;
  payment_method?: 'bank' | 'cash';
  bank_name?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  status: 'active' | 'on_leave' | 'inactive';
  created_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active?: boolean;
  };
}

export interface StaffMember {
  id: number;
  user_id?: number;
  name: string;
  designation: string;
  father_name?: string;
  cnic?: string;
  contact_number?: string;
  emergency_number?: string;
  address?: string;
  city?: string;
  date_of_joining?: string;
  salary: number | string;
  allowances?: TeacherAllowance[] | null;
  total_allowances?: number;
  gross_salary?: number;
  payment_method?: 'bank' | 'cash';
  bank_name?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  status: 'active' | 'on_leave' | 'inactive';
  profile_picture?: string;
  profile_picture_url?: string;
  created_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active?: boolean;
  };
}

export interface AttendanceRecord {
  id?: number;
  status: 'present' | 'late' | 'absent' | 'on_leave';
  check_in_time?: string | null;
  check_out_time?: string | null;
  remarks?: string | null;
  marked_by?: number | null;
}

export interface AttendanceRosterItem {
  key: string;
  staff_type: 'teacher' | 'non_teaching';
  staff_id: number;
  user_id?: number | null;
  name: string;
  category_label: string;
  designation: string;
  cnic?: string | null;
  contact_number?: string | null;
  profile_picture_url?: string | null;
  payment_method?: 'bank' | 'cash';
  bank_name?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  staff_status: 'active' | 'on_leave' | 'inactive';
  attendance?: AttendanceRecord | null;
  is_leave_locked?: boolean;
  leave_info?: { leave_type?: string } | null;
}

export interface AttendanceStats {
  total_staff: number;
  marked_count: number;
  unmarked_count: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  on_leave_count: number;
}

export interface PayrollAdjustment {
  title: string;
  amount: number;
  approved_by?: string | null;
}

export interface TeacherLedgerData {
  status?: string;
  staff?: Teacher | StaffMember;
  staff_type?: 'teacher' | 'non_teaching';
  payrolls: PayrollItem[];
  advance_requests: AdvanceSalaryRequest[];
}

export interface PayrollItem {
  id: number;
  month: string;
  staff_type: 'teacher' | 'non_teaching';
  staff_id: number;
  staff_name: string;
  designation: string;
  base_salary: number | string;
  allowances?: TeacherAllowance[] | null;
  total_allowances: number | string;
  bonuses?: PayrollAdjustment[] | null;
  total_bonuses?: number | string;
  gross_salary: number | string;
  total_working_days: number;
  present_days: number;
  late_days: number;
  absent_days: number;
  leave_days: number;
  allowed_leaves?: number;
  deductible_days?: number;
  daily_rate?: number | string;
  absent_deduction: number | string;
  advance_deduction?: number | string;
  custom_deductions?: PayrollAdjustment[] | null;
  other_deductions: number | string;
  net_salary: number | string;
  payment_method: 'bank' | 'cash';
  bank_name?: string | null;
  account_title?: string | null;
  account_number?: string | null;
  remarks?: string | null;
  status: 'generated' | 'paid';
  paid_at?: string | null;
  staff_profile?: Teacher | StaffMember;
  created_at?: string;
}

export interface PayrollSummaryStats {
  total_staff: number;
  total_gross: number;
  total_deductions: number;
  total_net_payout: number;
  bank_payout_total: number;
  cash_payout_total: number;
  paid_count: number;
  unpaid_count: number;
}

export interface AdvanceSalaryRequest {
  id: number;
  staff_type: 'teacher' | 'non_teaching';
  staff_id: number;
  user_id?: number | null;
  staff_name: string;
  designation: string;
  amount: number;
  reason: string;
  repayment_plan?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_by_role?: string | null;
  reviewed_at?: string | null;
  review_remarks?: string | null;
  rejection_reason?: string | null;
  disbursement_status: string;
  total_recovered: number;
  remaining_balance: number;
  payment_source?: 'bank' | 'cash';
  disbursed_by_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface LeaveRequest {
  id: number;
  user_id?: number | null;
  staff_type: 'teacher' | 'non_teaching';
  staff_id: number;
  staff_name: string;
  designation?: string | null;
  leave_type: 'casual' | 'sick' | 'emergency' | 'annual' | 'maternity' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: number | null;
  approver_name?: string | null;
  approver_remarks?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface LeaveStats {
  total_requests: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  total_approved_days: number;
  active_leaves_today: number;
}

export type AmountTier = 1 | 2 | 3 | 4;
export type TierColor = 'green' | 'blue' | 'orange' | 'red';

export interface Expense {
  id: number;
  voucher_no?: string;
  title: string;
  category: string;
  amount: string | number;
  amount_tier: AmountTier;
  tier_color: TierColor;
  description: string;
  receipt_url?: string;
  payment_method?: string;
  payment_reference?: string;
  expense_type?: 'general' | 'director' | 'capital';
  director_id?: number;
  director?: { id: number; name: string };
  cheque_id?: number;
  cheque?: {
    id: number;
    cheque_no: string;
    beneficiary: string;
    amount: string | number;
  };
  status: 'disbursed' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  creator?: { id: number; name: string; role: string };
}

export interface Grant {
  id: number;
  title: string;
  amount: string | number;
  deposit_date: string;
  bank_account: string;
  reference_no?: string;
  slip_url?: string;
  notes?: string;
  created_at: string;
  creator?: { id: number; name: string; role: string };
}

export interface Cheque {
  id: number;
  cheque_no: string;
  amount: string | number;
  amount_tier: AmountTier;
  tier_color: TierColor;
  issue_date: string;
  cashed_date?: string;
  status: 'issued' | 'cashed';
  beneficiary: string;
  purpose: string;
  description?: string;
  slip_url?: string;
  created_at: string;
  creator?: { id: number; name: string; role: string };
}

export interface CashInflow {
  id: number;
  title: string;
  amount: string | number;
  deposit_date: string;
  category: string;
  reference_no?: string;
  slip_url?: string;
  notes?: string;
  created_at: string;
  creator?: { id: number; name: string; role: string };
}

export interface BankStatementItem {
  id: string;
  type: 'credit' | 'debit';
  category: string;
  title: string;
  reference: string;
  date: string;
  credit: number;
  debit: number;
  raw_date?: string;
  running_balance: number;
  slip_url?: string;
  notes?: string;
  amount_tier: AmountTier;
  tier_color: TierColor;
  is_petty_cash?: boolean;
}

export interface CashDrawerStatementItem {
  id: string;
  type: 'credit' | 'debit';
  source: string;
  title: string;
  reference: string;
  date: string;
  inflow: number;
  outflow: number;
  raw_date?: string;
  running_balance: number;
  slip_url?: string;
  notes?: string;
}

export interface Director {
  id: number;
  user_id?: number | null;
  name: string;
  cnic?: string;
  phone?: string;
  email?: string;
  share_percentage: number;
  capital_share_percentage?: number;
  expected_monthly_contribution?: number;
  bank_name?: string;
  bank_account_no?: string;
  bank_iban?: string;
  status: 'active' | 'inactive';
  net_capital?: number;
  total_capital_injected: number;
  total_expenses_paid?: number;
  total_direct_injected?: number;
  total_capital_consumed: number;
  total_profit_earned: number;
  total_withdrawn: number;
  live_balance: number;
}

export interface SettlementTransfer {
  from_director_id: number;
  to_director_id: number;
  amount: number;
  notes?: string;
}

export interface PnlDirector {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  cnic?: string;
  net_capital: number;
  live_balance?: number;
  share_percentage: number;
  expected_monthly_contribution: number;
  month_paid_amount: number;
  contribution_variance: number;
  is_surplus: boolean;
  loan_amount: number;
  shortfall_amount: number;
  profit_share: number;
  base_profit_share?: number;
  bank_name?: string;
  bank_account_no?: string;
}

export interface PnlSummary {
  total_govt_income: number;
  total_general_expenses: number;
  remaining_amount: number;
  remaining_profit: number;
  net_margin_percentage: number;
  total_expected_contributions?: number;
  total_paid_in_month?: number;
  is_distributed?: boolean;
  distribution?: {
    id: number;
    period_month: string;
    total_profit_pool: number;
    distributed_at: string;
    distributed_by_name?: string;
    notes?: string;
    breakdown?: any;
  } | null;
}

export interface DirectorTransactionItem {
  id: number | string;
  type: 'capital_injection' | 'capital_expense' | 'profit_credit' | 'withdrawal' | 'opening_balance';
  type_label?: string;
  title: string;
  category_name?: string;
  reference_no?: string;
  date: string;
  payment_method?: string;
  period_month?: string;
  credit: number;
  debit: number;
  running_balance: number;
  notes?: string;
  slip_url?: string | null;
  creator_name?: string;
}

export interface ProfitDistributionItem {
  id: number;
  period_month: string;
  total_profit_pool: number;
  notes?: string;
  distribution_breakdown?: any;
  created_at: string;
  distributor?: { id: number; name: string };
}

export interface DirectorSummary {
  total_directors: number;
  total_net_capital?: number;
  total_capital_injected: number;
  total_expenses_paid?: number;
  total_direct_injected?: number;
  total_capital_consumed: number;
  total_profit_allocated: number;
  total_withdrawn: number;
  total_undrawn_pool: number;
  total_share_percentage: number;
  total_expected_contributions?: number;
}

export interface FinancialSummary {
  selected_month?: string;
  month_name: string;
  month_grants?: number;
  month_cheques_cashed?: number;
  month_petty_cash_inflow?: number;
  month_expenses: number;
  month_cash_expenses?: number;
  month_bank_net?: number;
  month_cash_net?: number;
  bank_balance: number;
  cash_in_hand: number;
  total_grants_received: number;
  total_cheques_cashed: number;
  pending_cheques_amount: number;
  total_expenses: number;
}

export function getTierInfo(amount: number): {
  tier: AmountTier;
  color: TierColor;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  borderGlow: string;
} {
  if (amount < 5000) {
    return {
      tier: 1,
      color: 'green',
      label: 'Petty (< 5k)',
      badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      borderColor: 'border-l-emerald-500',
      borderGlow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    };
  } else if (amount <= 25000) {
    return {
      tier: 2,
      color: 'blue',
      label: 'Operational (5k-25k)',
      badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
      badgeText: 'text-sky-700 dark:text-sky-300',
      borderColor: 'border-l-sky-500',
      borderGlow: 'hover:shadow-[0_0_15px_rgba(2,132,199,0.15)]',
    };
  } else if (amount <= 50000) {
    return {
      tier: 3,
      color: 'orange',
      label: 'Moderate (25k-50k)',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      badgeText: 'text-amber-700 dark:text-amber-300',
      borderColor: 'border-l-amber-500',
      borderGlow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
    };
  } else {
    return {
      tier: 4,
      color: 'red',
      label: 'High Value (> 50k)',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      badgeText: 'text-rose-700 dark:text-rose-300',
      borderColor: 'border-l-rose-500',
      borderGlow: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    };
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nsse_token');
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('nsse_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nsse_token');
    localStorage.removeItem('nsse_user');
    window.location.href = '/';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearSession();
    throw new Error('Your 24-hour session has expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Request failed. Please try again.');
  }

  return data;
}

export async function downloadAttendanceReportPdf(params: {
  date: string;
  session: string;
  class: string;
  section: string;
  fileName: string;
}): Promise<void> {
  const qs = new URLSearchParams({
    date: params.date,
    session: params.session,
    class: params.class,
    section: params.section,
  }).toString();

  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/student-attendances/daily-report-pdf?${qs}`, { headers });

  if (res.status === 401) {
    clearSession();
    throw new Error('Your 24-hour session has expired. Please log in again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'PDF generation failed.');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = params.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, {
      method: 'DELETE',
    }),
  postForm: <T = any>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),
  postFormData: <T = any>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),
  patchForm: <T = any>(endpoint: string, formData: FormData) => {
    formData.append('_method', 'PATCH');
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  },
};

export function getAttachmentUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function downloadBlob(endpoint: string, defaultFilename = 'NSSE_Report.pdf'): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });

  if (res.status === 401) {
    clearSession();
    throw new Error('Your session has expired. Please log in again.');
  }

  if (!res.ok) {
    throw new Error('Failed to generate and download PDF report.');
  }

  let filename = defaultFilename;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '');
    }
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
}

export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const cleanStr = dateStr.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const [year, month, day] = cleanStr.split('-').map(Number);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${day} ${monthNames[month - 1]} ${year}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

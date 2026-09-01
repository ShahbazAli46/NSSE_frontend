'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
  api, 
  User, 
  Expense, 
  Grant, 
  Cheque, 
  BankStatementItem, 
  CashDrawerStatementItem,
  CashInflow,
  FinancialSummary, 
  getTierInfo, 
  getAttachmentUrl,
  downloadBlob,
  formatDisplayDate
} from '@/lib/api';
import CustomDropdown, { DropdownOption } from '@/components/CustomDropdown';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomMonthPicker from '@/components/CustomMonthPicker';
import CustomNumberInput from '@/components/CustomNumberInput';
import { 
  Receipt, 
  PlusCircle, 
  Building,
  RefreshCw,
  X,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Eye,
  FileText,
  Landmark,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Download,
  ExternalLink,
  ShieldCheck,
  Layers,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const TIER_OPTIONS: DropdownOption[] = [
  { value: '', label: 'All Amount Tiers', icon: '🎨' },
  { value: '1', label: '🟢 Tier 1: Micro (< 5k)', icon: '🟢' },
  { value: '2', label: '🔵 Tier 2: Operational (5k-25k)', icon: '🔵' },
  { value: '3', label: '🟠 Tier 3: Moderate (25k-50k)', icon: '🟠' },
  { value: '4', label: '🔴 Tier 4: High Value (> 50k)', icon: '🔴' },
];

const PAYMENT_METHODS: DropdownOption[] = [
  { value: 'Cash', label: 'Cash (Drawer)', icon: '💵' },
  { value: 'Bank Transfer', label: 'Bank Transfer (Online)', icon: '🏦' },
  { value: 'Cheque', label: 'Cheque Payment', icon: '🧾' },
];

const CHEQUE_PURPOSES: DropdownOption[] = [
  { value: 'petty_cash', label: 'Self (Withdrawal for Petty Cash)', icon: '💵' },
  { value: 'vendor_payment', label: 'Vendor / Supplier Payment', icon: '🏢' },
  { value: 'salary', label: 'Staff Salaries Disbursal', icon: '👥' },
  { value: 'utility', label: 'Electricity / Gas / Water Bills', icon: '💡' },
  { value: 'infrastructure', label: 'Construction / Maintenance', icon: '🏗️' },
  { value: 'other', label: 'Other School Expense', icon: '📋' },
];

const getCurrentMonthString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AccountantDashboard({ currentUser }: { currentUser: User | null }) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'cheques' | 'grants' | 'passbook' | 'cash_drawer'>('expenses');
  
  // Financial Month Selection & 3-Way Balances
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);

  // Expenses Tab State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [amountSort, setAmountSort] = useState<'default' | 'asc' | 'desc'>('default');
  const [availableCategories, setAvailableCategories] = useState<{ id: number; name: string }[]>([]);

  // Debounce search query to prevent page blinking / jumpy requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const sortedExpenses = useMemo(() => {
    if (amountSort === 'desc') {
      return [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount));
    }
    if (amountSort === 'asc') {
      return [...expenses].sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    return expenses;
  }, [expenses, amountSort]);

  // Cheques Tab State
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [isLoadingCheques, setIsLoadingCheques] = useState<boolean>(false);
  const [chequeStatusFilter, setChequeStatusFilter] = useState<string>('');
  const [chequeSearch, setChequeSearch] = useState<string>('');
  const [debouncedChequeSearch, setDebouncedChequeSearch] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedChequeSearch(chequeSearch.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [chequeSearch]);

  // Grants Tab State
  const [grants, setGrants] = useState<Grant[]>([]);
  const [isLoadingGrants, setIsLoadingGrants] = useState<boolean>(false);
  const [grantSearch, setGrantSearch] = useState<string>('');
  const [debouncedGrantSearch, setDebouncedGrantSearch] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedGrantSearch(grantSearch.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [grantSearch]);

  // Passbook State
  const [statement, setStatement] = useState<BankStatementItem[]>([]);
  const [isLoadingPassbook, setIsLoadingPassbook] = useState<boolean>(false);

  // Cash Drawer State
  const [cashDrawerStatement, setCashDrawerStatement] = useState<CashDrawerStatementItem[]>([]);
  const [isLoadingCashDrawer, setIsLoadingCashDrawer] = useState<boolean>(false);
  const [cashDrawerSearch, setCashDrawerSearch] = useState<string>('');

  // Modals State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isCashInflowModalOpen, setIsCashInflowModalOpen] = useState(false);
  const [cashOutCheque, setCashOutCheque] = useState<Cheque | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any | null>(null);

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Maintenance');
  const [expAmount, setExpAmount] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expPaymentMethod, setExpPaymentMethod] = useState('Cash');
  const [expChequeId, setExpChequeId] = useState<string>('');
  const [expChequeNo, setExpChequeNo] = useState<string>('');
  const [expChequeBeneficiary, setExpChequeBeneficiary] = useState<string>('');
  const [expChequeIssueDate, setExpChequeIssueDate] = useState<string>(getTodayDateString());
  const [expChequeCashedDate, setExpChequeCashedDate] = useState<string>(getTodayDateString());
  const [expReceiptFile, setExpReceiptFile] = useState<File | null>(null);
  const [expSubmitting, setExpSubmitting] = useState(false);
  const [expError, setExpError] = useState('');
  const [expSuccess, setExpSuccess] = useState('');

  // Cheque Form State
  const [chqNo, setChqNo] = useState('');
  const [chqAmount, setChqAmount] = useState('');
  const [chqIssueDate, setChqIssueDate] = useState(getTodayDateString());
  const [chqBeneficiary, setChqBeneficiary] = useState('');
  const [chqPurpose, setChqPurpose] = useState('petty_cash');
  const [chqDescription, setChqDescription] = useState('');
  const [chqSlipFile, setChqSlipFile] = useState<File | null>(null);
  const [chqAlreadyCashed, setChqAlreadyCashed] = useState(true);
  const [chqCashedDate, setChqCashedDate] = useState(getTodayDateString());
  const [chqSubmitting, setChqSubmitting] = useState(false);
  const [chqError, setChqError] = useState('');

  // Grant Form State
  const [grTitle, setGrTitle] = useState('');
  const [grAmount, setGrAmount] = useState('');
  const [grDate, setGrDate] = useState(getTodayDateString());
  const [grBankAcc, setGrBankAcc] = useState('HBL - School Main Account');
  const [grRefNo, setGrRefNo] = useState('');
  const [grNotes, setGrNotes] = useState('');
  const [grSlipFile, setGrSlipFile] = useState<File | null>(null);
  const [grSubmitting, setGrSubmitting] = useState(false);
  const [grError, setGrError] = useState('');

  // Cash Inflow (Direct Drawer Deposit) Form State
  const [inflowTitle, setInflowTitle] = useState('');
  const [inflowAmount, setInflowAmount] = useState('');
  const [inflowDate, setInflowDate] = useState(getTodayDateString());
  const [inflowCategory, setInflowCategory] = useState('Opening Balance');
  const [inflowRef, setInflowRef] = useState('');
  const [inflowNotes, setInflowNotes] = useState('');
  const [inflowSlipFile, setInflowSlipFile] = useState<File | null>(null);
  const [inflowSubmitting, setInflowSubmitting] = useState(false);
  const [inflowError, setInflowError] = useState('');

  // Cash-Out Modal State
  const [cashOutDate, setCashOutDate] = useState(getTodayDateString());
  const [cashOutSlip, setCashOutSlip] = useState<File | null>(null);
  const [cashOutSubmitting, setCashOutSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const data = await api.get<FinancialSummary>(`/financial-summary?month=${selectedMonth}`);
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get<{ id: number; name: string }[]>('/categories?active_only=true');
      if (Array.isArray(res) && res.length > 0) {
        setAvailableCategories(res);
        if (!expCategory) setExpCategory(res[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('date', selectedDate);
      } else if (selectedMonth) {
        params.append('month', selectedMonth);
      }
      if (categoryFilter) params.append('category', categoryFilter);
      if (tierFilter) params.append('tier', tierFilter);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

      const res: any = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const fetchCheques = async () => {
    setIsLoadingCheques(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (chequeStatusFilter) params.append('status', chequeStatusFilter);
      if (debouncedChequeSearch) params.append('search', debouncedChequeSearch);

      const res: any = await api.get(`/cheques?${params.toString()}`);
      setCheques(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCheques(false);
    }
  };

  const fetchGrants = async () => {
    setIsLoadingGrants(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (debouncedGrantSearch) params.append('search', debouncedGrantSearch);

      const res: any = await api.get(`/grants?${params.toString()}`);
      setGrants(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingGrants(false);
    }
  };

  const fetchPassbook = async () => {
    setIsLoadingPassbook(true);
    try {
      const res: any = await api.get(`/bank/statement?month=${selectedMonth}`);
      setStatement(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPassbook(false);
    }
  };

  const fetchCashDrawer = async () => {
    setIsLoadingCashDrawer(true);
    try {
      const res: any = await api.get(`/cash-drawer/statement?month=${selectedMonth}`);
      setCashDrawerStatement(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingCashDrawer(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchCategories();
  }, [selectedMonth]);

  useEffect(() => {
    if (activeTab === 'expenses') fetchExpenses();
    if (activeTab === 'cheques') fetchCheques();
    if (activeTab === 'grants') fetchGrants();
    if (activeTab === 'passbook') fetchPassbook();
    if (activeTab === 'cash_drawer') fetchCashDrawer();
  }, [activeTab, selectedMonth, selectedDate, categoryFilter, tierFilter, debouncedSearchQuery, chequeStatusFilter, debouncedChequeSearch, debouncedGrantSearch]);

  // Dynamic Tier helper
  const currentExpAmountNum = parseFloat(expAmount) || 0;
  const currentTier = currentExpAmountNum > 0 ? getTierInfo(currentExpAmountNum) : null;

  // Handle Create Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expCategory || currentExpAmountNum <= 0 || !expDescription) {
      setExpError('Please fill in all required fields.');
      return;
    }

    if (expPaymentMethod === 'Cheque' && !expChequeId && !expChequeNo.trim()) {
      setExpError('Please enter Cheque Number for cheque payment.');
      return;
    }

    setExpSubmitting(true);
    setExpError('');
    setExpSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', expTitle.trim());
      formData.append('category', expCategory.trim());
      formData.append('amount', expAmount.trim());
      formData.append('description', expDescription.trim());
      formData.append('payment_method', expPaymentMethod);

      if (expPaymentMethod === 'Cheque') {
        if (expChequeId) {
          formData.append('cheque_id', expChequeId);
        } else if (expChequeNo.trim()) {
          formData.append('cheque_no', expChequeNo.trim());
          formData.append('cheque_beneficiary', expChequeBeneficiary.trim() || expTitle.trim());
          formData.append('cheque_issue_date', expChequeIssueDate);
          formData.append('cheque_cashed_date', expChequeCashedDate);
        }
      }

      if (expReceiptFile) formData.append('receipt', expReceiptFile);

      const res: any = await api.postForm('/expenses', formData);
      setExpSuccess(res?.message || 'Expense posted successfully!');
      
      setExpTitle('');
      setExpAmount('');
      setExpDescription('');
      setExpChequeNo('');
      setExpChequeBeneficiary('');
      setExpChequeId('');
      setExpReceiptFile(null);
      
      fetchSummary();
      fetchExpenses();
      if (expPaymentMethod === 'Cheque') fetchCheques();

      setTimeout(() => {
        setIsExpenseModalOpen(false);
        setExpSuccess('');
      }, 1200);
    } catch (err: any) {
      setExpError(err.message || 'Failed to submit expense entry.');
    } finally {
      setExpSubmitting(false);
    }
  };

  // Handle Create Cheque
  const handleCreateCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(chqAmount);
    if (!chqNo || amt <= 0 || !chqBeneficiary) {
      setChqError('Please fill in all required fields.');
      return;
    }

    setChqSubmitting(true);
    setChqError('');

    try {
      const formData = new FormData();
      formData.append('cheque_no', chqNo.trim());
      formData.append('amount', chqAmount.trim());
      formData.append('issue_date', chqIssueDate);
      formData.append('beneficiary', chqBeneficiary.trim());
      formData.append('purpose', chqPurpose);
      if (chqDescription) formData.append('description', chqDescription.trim());
      formData.append('is_already_cashed', chqAlreadyCashed ? '1' : '0');
      if (chqAlreadyCashed) formData.append('cashed_date', chqCashedDate);
      if (chqSlipFile) formData.append('slip', chqSlipFile);

      await api.postForm('/cheques', formData);
      
      setChqNo('');
      setChqAmount('');
      setChqBeneficiary('');
      setChqDescription('');
      setChqSlipFile(null);
      setIsChequeModalOpen(false);

      fetchSummary();
      fetchCheques();
    } catch (err: any) {
      setChqError(err.message || 'Failed to issue cheque.');
    } finally {
      setChqSubmitting(false);
    }
  };

  // Handle Grant Deposit
  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(grAmount);
    if (!grTitle || amt <= 0 || !grDate) {
      setGrError('Please enter grant title and valid amount.');
      return;
    }

    setGrSubmitting(true);
    setGrError('');

    try {
      const formData = new FormData();
      formData.append('title', grTitle.trim());
      formData.append('amount', grAmount.trim());
      formData.append('deposit_date', grDate);
      formData.append('bank_account', grBankAcc.trim());
      if (grRefNo) formData.append('reference_no', grRefNo.trim());
      if (grNotes) formData.append('notes', grNotes.trim());
      if (grSlipFile) formData.append('slip', grSlipFile);

      await api.postForm('/grants', formData);

      setGrTitle('');
      setGrAmount('');
      setGrRefNo('');
      setGrNotes('');
      setGrSlipFile(null);
      setIsGrantModalOpen(false);

      fetchSummary();
      fetchGrants();
    } catch (err: any) {
      setGrError(err.message || 'Failed to record grant.');
    } finally {
      setGrSubmitting(false);
    }
  };

  // Handle Mark Cheque as Cashed
  const handleCashOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashOutCheque) return;

    setCashOutSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('cashed_date', cashOutDate);
      if (cashOutSlip) formData.append('slip', cashOutSlip);

      await api.patchForm(`/cheques/${cashOutCheque.id}/cash-out`, formData);
      setCashOutCheque(null);
      setCashOutSlip(null);

      fetchSummary();
      fetchCheques();
    } catch (err: any) {
      alert(err.message || 'Failed to update cheque status.');
    } finally {
      setCashOutSubmitting(false);
    }
  };

  // Handle Create Cash Inflow (Direct Drawer Deposit)
  const handleCreateCashInflow = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(inflowAmount);
    if (!inflowTitle || amt <= 0 || !inflowCategory || !inflowDate) {
      setInflowError('Please fill in all required fields.');
      return;
    }

    setInflowSubmitting(true);
    setInflowError('');

    try {
      const formData = new FormData();
      formData.append('title', inflowTitle.trim());
      formData.append('amount', inflowAmount.trim());
      formData.append('deposit_date', inflowDate);
      formData.append('category', inflowCategory);
      if (inflowRef.trim()) formData.append('reference_no', inflowRef.trim());
      if (inflowNotes.trim()) formData.append('notes', inflowNotes.trim());
      if (inflowSlipFile) formData.append('slip', inflowSlipFile);

      await api.postForm('/cash-inflows', formData);

      setInflowTitle('');
      setInflowAmount('');
      setInflowRef('');
      setInflowNotes('');
      setInflowSlipFile(null);
      setIsCashInflowModalOpen(false);

      fetchSummary();
      fetchCashDrawer();
    } catch (err: any) {
      setInflowError(err.message || 'Failed to record cash drawer deposit.');
    } finally {
      setInflowSubmitting(false);
    }
  };

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingChequesPdf, setIsExportingChequesPdf] = useState(false);
  const [isExportingPassbookPdf, setIsExportingPassbookPdf] = useState(false);

  // Secure Background PDF Export for Expenses
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('date', selectedDate);
      } else if (selectedMonth) {
        params.append('month', selectedMonth);
      }
      if (categoryFilter) params.append('category', categoryFilter);
      if (tierFilter) params.append('tier', tierFilter);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

      await downloadBlob(`/expenses/export-pdf?${params.toString()}`, `Expense_Report_${selectedMonth || 'ledger'}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Secure Background PDF Export for Cheque Register
  const handleExportChequesPdf = async () => {
    setIsExportingChequesPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (chequeStatusFilter) params.append('status', chequeStatusFilter);
      if (debouncedChequeSearch) params.append('search', debouncedChequeSearch);

      await downloadBlob(`/cheques/export-pdf?${params.toString()}`, `Cheque_Register_${selectedMonth || 'ledger'}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download Cheque Register PDF.');
    } finally {
      setIsExportingChequesPdf(false);
    }
  };

  // Secure Background PDF Export for Digital Bank Passbook
  const handleExportPassbookPdf = async () => {
    setIsExportingPassbookPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);

      await downloadBlob(`/bank/statement/export-pdf?${params.toString()}`, `Bank_Passbook_${selectedMonth || 'ledger'}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download Passbook PDF.');
    } finally {
      setIsExportingPassbookPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ================= 🗓️ MONTH SELECTOR HEADER RIBBON ================= */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4ED] border border-[#0B462C]/20 flex items-center justify-center text-[#0B462C]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 leading-tight">
              Financial Cockpit
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Active ledger & analytics period: <strong className="text-[#0B462C]">{summary?.month_name || selectedMonth}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-gray-600">Select Month:</span>
          <div className="w-44">
            <CustomMonthPicker
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val || getCurrentMonthString())}
              placeholder="Select Month"
              allowClear={false}
              align="right"
            />
          </div>
        </div>
      </div>

      {/* ================= 🔝 MONTH-SCOPED THEMED KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Bank Inflows (Govt Grants) this Month */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0B462C]">
                <Landmark className="w-4 h-4 text-[#C5A059]" />
                <span>Govt Grants ({summary?.month_name || 'Month'})</span>
              </div>
              <h3 className="text-2xl font-black mt-2 font-mono tracking-tight text-gray-900">
                Rs. {summary?.month_grants !== undefined ? Number(summary.month_grants).toLocaleString('en-PK') : '0'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#E6F4ED] border border-[#0B462C]/20 flex items-center justify-center text-[#0B462C]">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span>Cheques Cashed: <strong className="text-gray-800">Rs. {summary?.month_cheques_cashed !== undefined ? Number(summary.month_cheques_cashed).toLocaleString() : '0'}</strong></span>
            <span className="text-[#0B462C] font-bold">Bal: Rs. {summary ? Number(summary.bank_balance).toLocaleString() : '0'}</span>
          </div>
        </div>

        {/* Card 2: Cash Inflow / Petty Cash Drawer this Month */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Petty Drawn ({summary?.month_name || 'Month'})</span>
              </div>
              <h3 className="text-2xl font-black mt-2 font-mono tracking-tight text-emerald-700">
                Rs. {summary?.month_petty_cash_inflow !== undefined ? Number(summary.month_petty_cash_inflow).toLocaleString('en-PK') : '0'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span>Cash Spent: <strong className="text-gray-800">Rs. {summary?.month_cash_expenses !== undefined ? Number(summary.month_cash_expenses).toLocaleString() : '0'}</strong></span>
            <span className="text-emerald-700 font-bold">In Hand: Rs. {summary ? Number(summary.cash_in_hand).toLocaleString() : '0'}</span>
          </div>
        </div>

        {/* Card 3: Total Expenses Spent this Month */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Spent in {summary?.month_name || 'Month'}</span>
              </div>
              <h3 className="text-2xl font-black mt-2 font-mono tracking-tight text-rose-700">
                Rs. {summary?.month_expenses !== undefined ? Number(summary.month_expenses).toLocaleString('en-PK') : '0'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2.5">
            <span>All-Time Spend: <strong className="text-gray-800">Rs. {summary ? Number(summary.total_expenses).toLocaleString() : '0'}</strong></span>
          </div>
        </div>

        {/* Card 4: Quick Actions */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#C5A059]" />
              + Expense
            </button>
            <button
              onClick={() => setIsChequeModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              + Cheque
            </button>
            <button
              onClick={() => setIsGrantModalOpen(true)}
              className="px-3 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all col-span-2 cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-purple-200" />
              + Record Govt Grant (Deposit)
            </button>
          </div>
        </div>
      </div>

      {/* ================= 🧭 MASTER NAVIGATION TABS ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200/90 shadow-xs">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}
          >
            <FileText className="w-4 h-4" />
            Expenses Ledger
          </button>
          <button
            onClick={() => setActiveTab('cheques')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cheques'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Cheque Register
          </button>
          <button
            onClick={() => setActiveTab('grants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'grants'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}
          >
            <Landmark className="w-4 h-4" />
            Govt Grants (Income)
          </button>
          <button
            onClick={() => setActiveTab('passbook')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'passbook'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}
          >
            <Layers className="w-4 h-4" />
            Digital Passbook
          </button>
          <button
            onClick={() => setActiveTab('cash_drawer')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cash_drawer'
                ? 'bg-[#0B462C] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Cash Drawer
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'cash_drawer' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setChqPurpose('petty_cash');
                  setChqBeneficiary('Self (Petty Cash Drawer Replenishment)');
                  setIsChequeModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                + Replenish Drawer
              </button>
              <button
                onClick={() => setIsCashInflowModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-[#C5A059]" />
                + Cash Deposit
              </button>
            </div>
          )}

          {activeTab === 'expenses' && (
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
              title="Export filtered ledger as A4 Audit PDF"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-rose-600" />
                  Download Audit PDF ({summary?.month_name || selectedMonth})
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              fetchSummary();
              if (activeTab === 'expenses') fetchExpenses();
              if (activeTab === 'cheques') fetchCheques();
              if (activeTab === 'grants') fetchGrants();
              if (activeTab === 'passbook') fetchPassbook();
            }}
            className="p-2 rounded-xl bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 shadow-xs transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: 💸 EXPENSES LEDGER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters Bar (Solid White) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            {/* Date Filter (Leftmost Position) */}
            <div className="w-44">
              <CustomDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Filter by Date"
              />
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search title, description or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 transition-all"
              />
              {isLoadingExpenses && (
                <RefreshCw className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#0B462C] animate-spin" />
              )}
            </div>

            {/* Tier Filter */}
            <div className="w-44">
              <CustomDropdown
                options={TIER_OPTIONS}
                value={tierFilter}
                onChange={setTierFilter}
                placeholder="Filter by Tier"
              />
            </div>

            {/* Category Filter */}
            <div className="w-44">
              <CustomDropdown
                options={[
                  { value: '', label: 'All Categories', icon: '📁' },
                  ...availableCategories.map((c) => ({ value: c.name, label: c.name, icon: '🏷️' })),
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
                placeholder="Category"
              />
            </div>

            {/* Clear Filters */}
            {(selectedDate || categoryFilter || tierFilter || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDate('');
                  setCategoryFilter('');
                  setTierFilter('');
                  setSearchQuery('');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs text-gray-700 font-bold cursor-pointer transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {/* Expenses Table (Solid White Background - NO Transparency) */}
          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-800 bg-white">
                <thead className="bg-gray-50/90 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12 text-gray-500">#</th>
                    <th className="py-3 px-4">Amount Tier</th>
                    <th className="py-3 px-4">Title & Description</th>
                    <th 
                      onClick={() => setAmountSort(prev => prev === 'default' ? 'desc' : prev === 'desc' ? 'asc' : 'default')}
                      className="py-3 px-4 cursor-pointer hover:bg-gray-100/90 transition select-none group"
                      title="Click to sort by amount"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Amount</span>
                        <span className="text-gray-400 group-hover:text-gray-900 transition">
                          {amountSort === 'desc' ? (
                            <ArrowDown className="w-3.5 h-3.5 text-[#0B462C] font-black" />
                          ) : amountSort === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#0B462C] font-black" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </span>
                      </div>
                    </th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Date & Recorded By</th>
                    <th className="py-3 px-4 text-center">Bill Receipt</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-100 font-medium bg-white transition-opacity duration-150 ${isLoadingExpenses && expenses.length > 0 ? 'opacity-60' : 'opacity-100'}`}>
                  {isLoadingExpenses && expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500 bg-white">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0B462C]" />
                        Loading expenses for {summary?.month_name || selectedMonth}...
                      </td>
                    </tr>
                  ) : sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500 bg-white">
                        <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="font-bold text-gray-700">
                          {debouncedSearchQuery ? `No expenses found matching "${debouncedSearchQuery}".` : `No expenses recorded for ${summary?.month_name || selectedMonth}.`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {debouncedSearchQuery ? 'Try searching with another keyword or clearing filters.' : 'Click "+ Expense" above to log your first expense.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map((item, index) => {
                      const tier = getTierInfo(Number(item.amount));
                      return (
                        <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors bg-white">
                          <td className="py-3.5 px-3.5 text-center font-mono font-bold text-gray-400 whitespace-nowrap">
                            {index + 1}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${tier.badgeBg}`}>
                              {tier.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                              <span className="text-[#0B462C] font-semibold">{item.category}</span>
                              {item.description && <span className="truncate max-w-xs text-gray-500">• {item.description}</span>}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className={`font-black font-mono text-base ${tier.badgeText}`}>
                              Rs. {Number(item.amount).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-600" />
                              {item.payment_method || 'Cash'}
                              {item.cheque && (
                                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-mono">
                                  #{item.cheque.cheque_no}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-gray-800 font-medium">{new Date(item.created_at).toLocaleDateString('en-GB')}</div>
                            <div className="text-[10px] text-gray-500">{item.creator?.name || 'Accountant'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {item.receipt_url ? (
                              <button
                                onClick={() => setPreviewDocUrl(getAttachmentUrl(item.receipt_url))}
                                className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B462C] border border-[#0B462C]/20 text-[11px] font-bold items-center gap-1 transition-all cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                View Bill
                              </button>
                            ) : (
                              <span className="text-gray-400 text-[11px]">No Receipt</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: 🧾 CHEQUE REGISTER */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cheques' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search cheque #, beneficiary or purpose..."
                value={chequeSearch}
                onChange={(e) => setChequeSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-700/10 transition-all"
              />
              {isLoadingCheques && (
                <RefreshCw className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-sky-700 animate-spin" />
              )}
            </div>

            <div className="w-44">
              <CustomDropdown
                options={[
                  { value: '', label: 'All Statuses', icon: '📋' },
                  { value: 'cashed', label: 'Cashed Out (Cleared)', icon: '🟢' },
                  { value: 'issued', label: 'Issued (Pending Clearance)', icon: '🟡' },
                ]}
                value={chequeStatusFilter}
                onChange={setChequeStatusFilter}
                placeholder="Status"
              />
            </div>

            {/* Export Cheques PDF Button */}
            <button
              onClick={handleExportChequesPdf}
              disabled={isExportingChequesPdf}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Download Official Cheque Register PDF"
            >
              {isExportingChequesPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-sky-700" />
              ) : (
                <Download className="w-4 h-4 text-sky-700" />
              )}
              {isExportingChequesPdf ? 'Generating...' : 'Export PDF'}
            </button>

            <button
              onClick={() => setIsChequeModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + Issue Cheque
            </button>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-800 bg-white">
                <thead className="bg-gray-50/90 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Cheque #</th>
                    <th className="py-3 px-4">Beneficiary & Purpose</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Cashed Date</th>
                    <th className="py-3 px-4">Counterfoil</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-100 font-medium bg-white transition-opacity duration-150 ${isLoadingCheques && cheques.length > 0 ? 'opacity-60' : 'opacity-100'}`}>
                  {isLoadingCheques && cheques.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-500 bg-white">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-700" />
                        Loading cheques...
                      </td>
                    </tr>
                  ) : cheques.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-500 bg-white">
                        <CreditCard className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="font-bold text-gray-700">
                          {debouncedChequeSearch ? `No cheques found matching "${debouncedChequeSearch}".` : `No cheques recorded for ${summary?.month_name || selectedMonth}.`}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {debouncedChequeSearch ? 'Try another search term.' : 'Click "+ Issue Cheque" above to log a bank cheque for this month.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    cheques.map((item) => {
                      const tier = getTierInfo(Number(item.amount));
                      return (
                        <tr key={item.id} className="hover:bg-sky-50/30 transition-colors bg-white">
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-gray-900 text-sm">
                            {item.cheque_no}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-gray-900">{item.beneficiary}</div>
                            <div className="text-[11px] text-sky-700 font-semibold capitalize mt-0.5">
                              {item.purpose.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className={`font-black font-mono text-base ${tier.badgeText}`}>
                              Rs. {Number(item.amount).toLocaleString()}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.status === 'cashed' ? (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                Cashed Out
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" />
                                Pending at Bank
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-gray-700 font-medium">
                            {formatDisplayDate(item.issue_date)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.cashed_date ? (
                              <span className="text-emerald-700 font-bold">{formatDisplayDate(item.cashed_date)}</span>
                            ) : (
                              <span className="text-gray-400 italic">Not Cashed Yet</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.slip_url ? (
                              <button
                                onClick={() => setPreviewDocUrl(getAttachmentUrl(item.slip_url))}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                View Slip
                              </button>
                            ) : (
                              <span className="text-gray-400 text-[11px]">No Slip</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {item.status === 'issued' && (
                              <button
                                onClick={() => {
                                  setCashOutCheque(item);
                                  setCashOutDate(getTodayDateString());
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#0B462C] hover:bg-[#062E1C] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                Mark as Cashed
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: 🏛️ GOVT GRANTS (INCOME) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'grants' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search grant tranche, reference or notes..."
                value={grantSearch}
                onChange={(e) => setGrantSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-700/10 transition-all"
              />
              {isLoadingGrants && (
                <RefreshCw className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-700 animate-spin" />
              )}
            </div>

            <button
              onClick={() => setIsGrantModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              + Record Govt Grant Deposit
            </button>
          </div>

          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-800 bg-white">
                <thead className="bg-gray-50/90 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Tranche / Grant Title</th>
                    <th className="py-3 px-4">Amount Credited</th>
                    <th className="py-3 px-4">Deposit Date</th>
                    <th className="py-3 px-4">Bank Account & Ref</th>
                    <th className="py-3 px-4">Deposit Slip</th>
                    <th className="py-3 px-4">Recorded By</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-100 font-medium bg-white transition-opacity duration-150 ${isLoadingGrants && grants.length > 0 ? 'opacity-60' : 'opacity-100'}`}>
                  {isLoadingGrants && grants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-500 bg-white">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-700" />
                        Loading grants...
                      </td>
                    </tr>
                  ) : grants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-500 bg-white">
                        <Landmark className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="font-bold text-gray-700">
                          {debouncedGrantSearch ? `No grants found matching "${debouncedGrantSearch}".` : 'No government grants recorded yet.'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {debouncedGrantSearch ? 'Try another search keyword.' : 'Click "+ Record Govt Grant" above to log the school\'s bank tranche deposit.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    grants.map((item) => (
                      <tr key={item.id} className="hover:bg-purple-50/30 transition-colors bg-white">
                        <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                          {item.title}
                          {item.notes && <div className="text-[11px] text-gray-500 font-normal">{item.notes}</div>}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-black font-mono text-base text-emerald-700">
                            + Rs. {Number(item.amount).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-800">
                          {formatDisplayDate(item.deposit_date)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-gray-800">{item.bank_account}</div>
                          {item.reference_no && <div className="text-[10px] text-purple-700 font-mono">Ref: {item.reference_no}</div>}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.slip_url ? (
                            <button
                              onClick={() => setPreviewDocUrl(getAttachmentUrl(item.slip_url))}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              View Deposit Slip
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[11px]">No Slip Attached</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-600">
                          {item.creator?.name || 'Accountant'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: 🏦 DIGITAL PASSBOOK */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'passbook' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3 bg-gray-50/80">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Chronological Bank Passbook</h4>
                <p className="text-xs text-gray-500">Combines Govt Tranches (Credits) and Cashed Cheques (Debits) for {summary?.month_name || selectedMonth}.</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Export Passbook PDF Button */}
                <button
                  onClick={handleExportPassbookPdf}
                  disabled={isExportingPassbookPdf}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Download Official Bank Passbook PDF"
                >
                  {isExportingPassbookPdf ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#0B462C]" />
                  ) : (
                    <Download className="w-4 h-4 text-[#0B462C]" />
                  )}
                  {isExportingPassbookPdf ? 'Generating...' : 'Export PDF'}
                </button>

                <div className="text-right pl-3 border-l border-gray-200">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Live Bank Balance</span>
                  <div className="text-lg font-black font-mono text-[#0B462C] leading-none mt-0.5">
                    Rs. {summary ? Number(summary.bank_balance).toLocaleString('en-PK') : '0'}
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-800 bg-white">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transaction / Reference</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-emerald-700">Credit (+)</th>
                    <th className="py-3 px-4 text-rose-700">Debit (-)</th>
                    <th className="py-3 px-4 text-right font-mono">Running Balance</th>
                    <th className="py-3 px-4 text-center">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium bg-white">
                  {isLoadingPassbook ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500 bg-white">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0B462C]" />
                        Loading passbook...
                      </td>
                    </tr>
                  ) : statement.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-500 bg-white">
                        No transactions found in passbook for {summary?.month_name || selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    statement.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors bg-white">
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-700">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{item.title}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{item.reference}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'credit' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-700">
                          {item.credit > 0 ? `+ Rs. ${item.credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-rose-700">
                          {item.debit > 0 ? `- Rs. ${item.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-black text-gray-900 text-sm">
                          Rs. {item.running_balance.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.slip_url ? (
                            <button
                              onClick={() => setPreviewDocUrl(getAttachmentUrl(item.slip_url))}
                              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                              title="View Slip"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: 💵 CASH DRAWER STATEMENT & LOG */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cash_drawer' && (
        <div className="space-y-4">
          {/* Cash Drawer Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs border-l-4 border-l-[#0B462C]">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cash on Hand (Drawer)</div>
              <div className="text-xl font-black font-mono text-[#0B462C] mt-1">
                Rs. {summary ? Number(summary.cash_in_hand).toLocaleString('en-PK') : '0'}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">Physical Cash Balance Available</div>
            </div>

            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs border-l-4 border-l-sky-500">
              <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Cheques Cashed to Drawer</div>
              <div className="text-xl font-black font-mono text-sky-700 mt-1">
                Rs. {summary?.month_petty_cash_inflow ? Number(summary.month_petty_cash_inflow).toLocaleString('en-PK') : '0'}
              </div>
              <div className="text-[10px] text-sky-600 mt-0.5">Drawn from bank in {summary?.month_name || selectedMonth}</div>
            </div>

            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs border-l-4 border-l-rose-500">
              <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Cash Expenses Paid</div>
              <div className="text-xl font-black font-mono text-rose-700 mt-1">
                Rs. {summary?.month_cash_expenses ? Number(summary.month_cash_expenses).toLocaleString('en-PK') : '0'}
              </div>
              <div className="text-[10px] text-rose-600 mt-0.5">Cash disbursed in {summary?.month_name || selectedMonth}</div>
            </div>

            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs border-l-4 border-l-emerald-500">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Net Cash Flow ({summary?.month_name || selectedMonth})</div>
              <div className={`text-xl font-black font-mono mt-1 ${
                (summary?.month_cash_net || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {(summary?.month_cash_net || 0) >= 0 ? '+' : ''} Rs. {summary?.month_cash_net ? Number(summary.month_cash_net).toLocaleString('en-PK') : '0'}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Monthly Drawer Delta</div>
            </div>
          </div>

          {/* Cash Drawer Table */}
          <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50/80 gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Physical Cash Drawer Statement & Ledger</h4>
                <p className="text-xs text-gray-500">Chronological statement of all cash inflows (cheques cashed from bank + deposits) and cash expense outflows for {summary?.month_name || selectedMonth}.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setChqPurpose('petty_cash');
                    setChqBeneficiary('Self (Petty Cash Drawer Replenishment)');
                    setIsChequeModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-bold hover:bg-sky-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-sky-700" />
                  Replenish Drawer (Cheque)
                </button>
                <button
                  onClick={() => setIsCashInflowModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 text-[#0B462C] border border-[#0B462C]/20 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#C5A059]" />
                  + Cash Deposit
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-800 bg-white">
                <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-12 text-gray-500">#</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Particulars / Source</th>
                    <th className="py-3 px-4">Category / Type</th>
                    <th className="py-3 px-4 text-emerald-700">Cash Inflow (+)</th>
                    <th className="py-3 px-4 text-rose-700">Cash Outflow (-)</th>
                    <th className="py-3 px-4 text-right font-mono">Drawer Balance</th>
                    <th className="py-3 px-4 text-center">Receipt / Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium bg-white">
                  {isLoadingCashDrawer ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-500 bg-white">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0B462C]" />
                        Loading cash drawer ledger...
                      </td>
                    </tr>
                  ) : cashDrawerStatement.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-500 bg-white">
                        No transactions recorded in Cash Drawer for {summary?.month_name || selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    cashDrawerStatement.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors bg-white">
                        <td className="py-3.5 px-3.5 text-center font-mono font-bold text-gray-400 whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-gray-700">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900">{item.title}</div>
                          {item.reference && <div className="text-[10px] text-gray-500 font-mono">{item.reference}</div>}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'credit' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {item.source}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-700">
                          {item.inflow > 0 ? `+ Rs. ${item.inflow.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-rose-700">
                          {item.outflow > 0 ? `- Rs. ${item.outflow.toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-black text-gray-900 text-sm">
                          Rs. {item.running_balance.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {item.slip_url ? (
                            <button
                              onClick={() => setPreviewDocUrl(getAttachmentUrl(item.slip_url))}
                              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                              title="View Slip"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🔮 MODAL: CREATE EXPENSE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isExpenseModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Institutional School Branding Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-[#F2F9F5]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 relative shrink-0">
                  <Image
                    src="/logo.png"
                    alt="NSSE Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#0B462C] font-cinzel uppercase tracking-wide">
                    Nawaz Sharif School of Eminence
                  </h3>
                  <p className="text-[10px] font-bold text-[#C5A059] font-cinzel tracking-widest uppercase">
                    Chunian Campus — Post Expense Voucher
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 overflow-y-auto space-y-4">
              {expError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {expError}
                </div>
              )}
              {expSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {expSuccess}
                </div>
              )}

              {/* Amount & Real-Time Dynamic Tier Preview */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Amount (PKR) *</label>
                  {currentTier && (
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${currentTier.badgeBg}`}>
                      {currentTier.label}
                    </span>
                  )}
                </div>
                <CustomNumberInput
                  value={expAmount}
                  onChange={setExpAmount}
                  placeholder="Enter amount..."
                  prefix="Rs."
                  required
                  className="font-mono font-bold text-base"
                />
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expense Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Lab Chemicals"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category / Head *</label>
                  <CustomDropdown
                    options={availableCategories.map((c) => ({ value: c.name, label: c.name, icon: '🏷️' }))}
                    value={expCategory}
                    onChange={setExpCategory}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                  <CustomDropdown
                    options={PAYMENT_METHODS}
                    value={expPaymentMethod}
                    onChange={setExpPaymentMethod}
                  />
                </div>

                {/* Cash Drawer Balance Check (When paying with Cash) */}
                {expPaymentMethod === 'Cash' && (
                  <div className={`p-3.5 rounded-2xl border transition-all ${
                    currentExpAmountNum > (summary?.cash_in_hand || 0)
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Wallet className={`w-4 h-4 ${currentExpAmountNum > (summary?.cash_in_hand || 0) ? 'text-rose-700' : 'text-[#0B462C]'}`} />
                        <span>Cash Drawer Balance Check</span>
                      </div>
                      <span className="font-mono font-black text-xs">
                        Rs. {(summary?.cash_in_hand || 0).toLocaleString()} Available
                      </span>
                    </div>
                    {currentExpAmountNum > (summary?.cash_in_hand || 0) ? (
                      <p className="text-[11px] text-rose-700 font-semibold mt-1.5 leading-snug">
                        ⚠️ Insufficient funds in Cash Drawer. Cannot record cash expense of Rs. {currentExpAmountNum.toLocaleString()} when the drawer has only Rs. {(summary?.cash_in_hand || 0).toLocaleString()}. Please cash a replenishment cheque from bank first or pay via Cheque.
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-700 font-medium mt-1 leading-snug">
                        ✓ Sufficient cash in drawer. This amount will be deducted directly from Cash in Hand upon logging.
                      </p>
                    )}
                  </div>
                )}

                {/* Integrated Cheque Entry Section (Auto Bank Ledger Link) */}
                {expPaymentMethod === 'Cheque' && (
                  <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                        <CreditCard className="w-4 h-4 text-sky-700" />
                        <span>Bank Cheque Particulars (Auto-Ledger Entry)</span>
                      </div>
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded border border-sky-200">
                        Debits Official Bank Account
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Cheque Number *</label>
                        <input
                          type="text"
                          placeholder="e.g. CHQ-781920"
                          value={expChequeNo}
                          onChange={(e) => setExpChequeNo(e.target.value)}
                          required={expPaymentMethod === 'Cheque'}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-300 text-xs font-bold text-gray-900 font-mono focus:outline-none focus:border-sky-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Payee / Beneficiary</label>
                        <input
                          type="text"
                          placeholder={expTitle || "e.g. Alpha Scientific Stores"}
                          value={expChequeBeneficiary}
                          onChange={(e) => setExpChequeBeneficiary(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-sky-300 text-xs font-semibold text-gray-900 focus:outline-none focus:border-sky-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Cheque Issue Date</label>
                        <CustomDatePicker value={expChequeIssueDate} onChange={setExpChequeIssueDate} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Bank Clearance / Cashed Date</label>
                        <CustomDatePicker value={expChequeCashedDate} onChange={setExpChequeCashedDate} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description / Paid To *</label>
                <textarea
                  rows={2}
                  placeholder="Purchased from Alpha Stationery for Grade 9 & 10 exams..."
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B462C] focus:ring-2 focus:ring-[#0B462C]/10 transition-all"
                />
              </div>

              {/* Receipt File */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Physical Bill / Receipt / Cheque Photo</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setExpReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E6F4ED] file:text-[#0B462C] hover:file:bg-[#d8ece2] cursor-pointer"
                />
              </div>

              <div className="pt-2">
                {(() => {
                  const isInsufficientCash = expPaymentMethod === 'Cash' && currentExpAmountNum > (summary?.cash_in_hand || 0);
                  return (
                    <button
                      type="submit"
                      disabled={expSubmitting || isInsufficientCash}
                      className={`w-full py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all ${
                        isInsufficientCash
                          ? 'bg-rose-100 text-rose-700 cursor-not-allowed border border-rose-200'
                          : 'bg-[#0B462C] hover:bg-[#062E1C] text-white cursor-pointer disabled:opacity-50'
                      }`}
                    >
                      {expSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Posting & Broadcasting Alert...
                        </>
                      ) : isInsufficientCash ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          Cannot Post — Insufficient Cash in Drawer
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                          Post Expense Record Immediately
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🔮 MODAL: ISSUE CHEQUE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isChequeModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-sky-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Issue Bank Cheque</h3>
                  <p className="text-xs text-gray-500">Record cheque number, amount and clearance</p>
                </div>
              </div>
              <button onClick={() => setIsChequeModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCheque} className="p-5 overflow-y-auto space-y-4">
              {chqError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {chqError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cheque Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-981240"
                    value={chqNo}
                    onChange={(e) => setChqNo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-sky-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount (PKR) *</label>
                  <CustomNumberInput
                    value={chqAmount}
                    onChange={setChqAmount}
                    placeholder="e.g. 50,000"
                    prefix="Rs."
                    required
                    className="font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Beneficiary (Payee) *</label>
                  <input
                    type="text"
                    placeholder="e.g. Self (Petty Cash) OR Alpha Solar"
                    value={chqBeneficiary}
                    onChange={(e) => setChqBeneficiary(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-sky-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Purpose *</label>
                  <CustomDropdown
                    options={CHEQUE_PURPOSES}
                    value={chqPurpose}
                    onChange={setChqPurpose}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Issue Date *</label>
                <CustomDatePicker value={chqIssueDate} onChange={setChqIssueDate} />
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chqAlreadyCashed}
                    onChange={(e) => setChqAlreadyCashed(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-700 focus:ring-0"
                  />
                  This cheque is ALREADY cashed out at the bank
                </label>
                {chqAlreadyCashed && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Bank Clearance / Cashed Date</label>
                    <CustomDatePicker value={chqCashedDate} onChange={setChqCashedDate} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Counterfoil / Bank Slip Photo</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setChqSlipFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-50 file:text-sky-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={chqSubmitting}
                className="w-full py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {chqSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Cheque Record
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🔮 MODAL: RECORD GOVT GRANT (INCOME) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isGrantModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-purple-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Record Government Grant Inflow</h3>
                  <p className="text-xs text-gray-500">Add deposited tranche to official school bank balance</p>
                </div>
              </div>
              <button onClick={() => setIsGrantModalOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGrant} className="p-5 overflow-y-auto space-y-4">
              {grError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {grError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Grant / Tranche Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Operational Grant 2026-27"
                  value={grTitle}
                  onChange={(e) => setGrTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-purple-700"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount Deposited (PKR) *</label>
                  <CustomNumberInput
                    value={grAmount}
                    onChange={setGrAmount}
                    placeholder="e.g. 1,500,000"
                    prefix="Rs."
                    required
                    className="font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Date *</label>
                  <CustomDatePicker value={grDate} onChange={setGrDate} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank Ref / Slip No</label>
                <input
                  type="text"
                  placeholder="e.g. DEP-91024"
                  value={grRefNo}
                  onChange={(e) => setGrRefNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 text-xs text-gray-900 font-mono focus:outline-none focus:border-purple-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Slip / Bank Statement Photo</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setGrSlipFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={grSubmitting}
                className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {grSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Landmark className="w-4 h-4" />}
                Save Grant & Broadcast Alert
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🔮 MODAL: MARK CHEQUE AS CASHED OUT */}
      {/* ───────────────────────────────────────────────────────────── */}
      {cashOutCheque && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Mark Cheque as Cashed</h3>
              <button onClick={() => setCashOutCheque(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1">
              <div className="font-bold text-gray-900">Cheque #{cashOutCheque.cheque_no}</div>
              <div className="text-gray-500">Beneficiary: {cashOutCheque.beneficiary}</div>
              <div className="font-mono font-bold text-emerald-700 text-sm">
                Amount: Rs. {Number(cashOutCheque.amount).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleCashOutSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cashed-Out Date *</label>
                <CustomDatePicker value={cashOutDate} onChange={setCashOutDate} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank Debit Slip (Optional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setCashOutSlip(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={cashOutSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {cashOutSubmitting ? 'Updating...' : 'Confirm Cheque Clearance'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🔮 MODAL: RECORD CASH DRAWER DEPOSIT / INFLOW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCashInflowModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-[#F2F9F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0B462C] flex items-center justify-center text-white shadow-xs">
                  <Wallet className="w-5 h-5 text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[#0B462C]">
                    Record Direct Cash Deposit / Inflow
                  </h3>
                  <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider">
                    Adds Physical Cash directly into the Cash Drawer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCashInflowModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashInflow} className="p-5 overflow-y-auto space-y-4">
              {inflowError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {inflowError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Initial Drawer Opening Cash Balance / Student Fine"
                  value={inflowTitle}
                  onChange={(e) => setInflowTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B462C]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount (PKR) *</label>
                  <CustomNumberInput
                    value={inflowAmount}
                    onChange={setInflowAmount}
                    placeholder="e.g. 50,000"
                    prefix="Rs."
                    required
                    className="font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Date *</label>
                  <CustomDatePicker value={inflowDate} onChange={setInflowDate} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inflow Category *</label>
                  <CustomDropdown
                    options={[
                      { value: 'Opening Balance', label: 'Opening Balance', icon: '💵' },
                      { value: 'Direct Donation', label: 'Direct Donation', icon: '🎁' },
                      { value: 'Fee / Fine Collection', label: 'Fee / Fine Collection', icon: '🧾' },
                      { value: 'Scrap / Asset Sale', label: 'Scrap / Asset Sale', icon: '♻️' },
                      { value: 'Miscellaneous Inflow', label: 'Miscellaneous Inflow', icon: '📦' },
                    ]}
                    value={inflowCategory}
                    onChange={setInflowCategory}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Receipt / Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. RCPT-10029"
                    value={inflowRef}
                    onChange={(e) => setInflowRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B462C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Received From</label>
                <textarea
                  rows={2}
                  placeholder="Received from admin office for petty cash pool..."
                  value={inflowNotes}
                  onChange={(e) => setInflowNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0B462C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Physical Cash Receipt / Slip</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setInflowSlipFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E6F4ED] file:text-[#0B462C] hover:file:bg-[#d8ece2] cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inflowSubmitting}
                  className="w-full py-3 rounded-xl bg-[#0B462C] hover:bg-[#062E1C] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {inflowSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Recording Cash Inflow...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
                      Confirm Cash Drawer Deposit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🔮 MODAL: FULL-SCREEN BILL / SLIP PREVIEW */}
      {/* ───────────────────────────────────────────────────────────── */}
      {previewDocUrl && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative max-w-4xl max-h-[90vh] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <span className="text-xs font-bold text-gray-800">Attached Document Preview</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-xs text-gray-800 flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-3 overflow-auto flex items-center justify-center max-h-[80vh] bg-gray-100">
              {previewDocUrl.endsWith('.pdf') ? (
                <iframe src={previewDocUrl} className="w-[700px] h-[550px] rounded-lg" />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="Bill / Slip"
                  className="max-h-[75vh] max-w-full object-contain rounded-lg shadow"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

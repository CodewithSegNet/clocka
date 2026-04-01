import React, { useState } from 'react';
import { X, Download, Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import Badge from '@/components/Badge';
import { Calendar } from '@/app/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { format } from 'date-fns';
import InvoiceModal from '@/components/InvoiceModal';

interface Transaction {
  date: string;
  amount: number;
  status: string;
  invoice: string;
  students: number;
  paymentMethod?: string;
  reference?: string;
}

interface AllTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudentCount: number;
}

export default function AllTransactionsModal({ 
  isOpen, 
  onClose,
  currentStudentCount
}: AllTransactionsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'successful' | 'pending' | 'failed'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | 'card' | 'ussd' | 'bank transfer'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);

  // Get school info from localStorage
  const getSchoolInfo = () => {
    const schoolInfo = JSON.parse(localStorage.getItem('schoolInfo') || '{}');
    return {
      name: schoolInfo.name || 'School Name',
      address: schoolInfo.address || 'School Address',
      email: schoolInfo.email || 'school@email.com',
      phone: schoolInfo.phone || '+234 000 000 0000'
    };
  };

  // Function to reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterPaymentMethod('all');
    setFilterDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setTempStartDate('');
    setTempEndDate('');
    setShowCustomDateModal(false);
  };

  // Handle modal close with filter reset
  const handleClose = () => {
    resetFilters();
    onClose();
  };

  if (!isOpen) return null;

  // Generate more sample transactions
  const allTransactions: Transaction[] = [
    { date: 'Jan 15, 2026', amount: currentStudentCount * 5000, status: 'Successful', invoice: '#INV-2026-01', students: currentStudentCount, paymentMethod: 'Card', reference: 'REF-2026-001' },
    { date: 'Oct 15, 2025', amount: Math.max(1, currentStudentCount - 2) * 5000, status: 'Successful', invoice: '#INV-2025-10', students: Math.max(1, currentStudentCount - 2), paymentMethod: 'Bank Transfer', reference: 'REF-2025-010' },
    { date: 'Jul 15, 2025', amount: Math.max(1, currentStudentCount - 5) * 5000, status: 'Successful', invoice: '#INV-2025-07', students: Math.max(1, currentStudentCount - 5), paymentMethod: 'Card', reference: 'REF-2025-007' },
    { date: 'Apr 15, 2025', amount: Math.max(1, currentStudentCount - 8) * 5000, status: 'Pending', invoice: '#INV-2025-04', students: Math.max(1, currentStudentCount - 8), paymentMethod: 'USSD', reference: 'REF-2025-004' },
    { date: 'Jan 15, 2025', amount: Math.max(1, currentStudentCount - 10) * 5000, status: 'Successful', invoice: '#INV-2025-01', students: Math.max(1, currentStudentCount - 10), paymentMethod: 'Card', reference: 'REF-2025-001' },
    { date: 'Oct 15, 2024', amount: Math.max(1, currentStudentCount - 12) * 5000, status: 'Failed', invoice: '#INV-2024-10', students: Math.max(1, currentStudentCount - 12), paymentMethod: 'USSD', reference: 'REF-2024-010' },
    { date: 'Jul 15, 2024', amount: Math.max(1, currentStudentCount - 15) * 5000, status: 'Successful', invoice: '#INV-2024-07', students: Math.max(1, currentStudentCount - 15), paymentMethod: 'Bank Transfer', reference: 'REF-2024-007' },
    { date: 'Apr 15, 2024', amount: Math.max(1, currentStudentCount - 18) * 5000, status: 'Successful', invoice: '#INV-2024-04', students: Math.max(1, currentStudentCount - 18), paymentMethod: 'Card', reference: 'REF-2024-004' },
  ];

  // Filter transactions
  const filteredTransactions = allTransactions.filter(transaction => {
    const matchesSearch = 
      transaction.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || transaction.status.toLowerCase() === filterStatus;
    
    const matchesPaymentMethod = filterPaymentMethod === 'all' || transaction.paymentMethod?.toLowerCase() === filterPaymentMethod;
    
    const matchesDateRange = filterDateRange === 'all' || {
      'today': transaction.date === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      'week': new Date(transaction.date) >= new Date(new Date().setDate(new Date().getDate() - 7)) && new Date(transaction.date) <= new Date(),
      'month': new Date(transaction.date).getMonth() === new Date().getMonth() && new Date(transaction.date).getFullYear() === new Date().getFullYear(),
      'quarter': new Date(transaction.date).getMonth() >= new Date().getMonth() - (new Date().getMonth() % 3) && new Date(transaction.date).getFullYear() === new Date().getFullYear(),
      'year': new Date(transaction.date).getFullYear() === new Date().getFullYear(),
      'custom': new Date(transaction.date) >= new Date(customStartDate) && new Date(transaction.date) <= new Date(customEndDate),
    }[filterDateRange];
    
    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDateRange;
  });

  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">All Transactions</h2>
              <p className="text-indigo-100 text-sm mt-1">Complete payment history for your school</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Summary Bar */}
          <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount Paid</p>
                <p className="text-2xl font-bold text-indigo-600">₦{totalAmount.toLocaleString()}</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 text-sm font-medium">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by invoice, date, or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value as any)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="card">Card</option>
                  <option value="ussd">USSD</option>
                  <option value="bank transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={filterDateRange === 'custom' && customStartDate && customEndDate ? 'custom' : filterDateRange}
                  onChange={(e) => {
                    const value = e.target.value as any;
                    if (value === 'custom') {
                      setTempStartDate(customStartDate);
                      setTempEndDate(customEndDate);
                      setShowCustomDateModal(true);
                    } else {
                      setFilterDateRange(value);
                    }
                  }}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">
                    {customStartDate && customEndDate ? `${customStartDate} to ${customEndDate}` : 'Custom Range'}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No transactions found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          transaction.status === 'Successful' ? 'bg-green-100' : 
                          transaction.status === 'Pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <span className={`text-2xl font-bold ${
                            transaction.status === 'Successful' ? 'text-green-600' : 
                            transaction.status === 'Pending' ? 'text-yellow-600' : 'text-red-600'
                          }`}>₦</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-semibold text-gray-900 text-lg">{transaction.invoice}</p>
                            <Badge variant={
                              transaction.status === 'Successful' ? 'success' : 
                              transaction.status === 'Pending' ? 'warning' : 'error'
                            }>
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>📅 {transaction.date}</span>
                            <span>•</span>
                            <span>👥 {transaction.students} students</span>
                            {transaction.paymentMethod && (
                              <>
                                <span>•</span>
                                <span>💳 {transaction.paymentMethod}</span>
                              </>
                            )}
                          </div>
                          {transaction.reference && (
                            <p className="text-xs text-gray-500 mt-1">Ref: {transaction.reference}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          ₦{transaction.amount.toLocaleString()}
                        </p>
                        <button
                          onClick={() => setSelectedInvoice(transaction)}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomDateModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            onClick={() => setShowCustomDateModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">Select Date Range</h3>
                </div>
                <button
                  onClick={() => setShowCustomDateModal(false)}
                  className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className={tempStartDate ? 'text-gray-900' : 'text-gray-400'}>
                          {tempStartDate ? format(new Date(tempStartDate), 'PPP') : 'Pick a date'}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white z-[70]" align="start">
                      <Calendar
                        mode="single"
                        selected={tempStartDate ? new Date(tempStartDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setTempStartDate(format(date, 'yyyy-MM-dd'));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className={tempEndDate ? 'text-gray-900' : 'text-gray-400'}>
                          {tempEndDate ? format(new Date(tempEndDate), 'PPP') : 'Pick a date'}
                        </span>
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white z-[70]" align="start">
                      <Calendar
                        mode="single"
                        selected={tempEndDate ? new Date(tempEndDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setTempEndDate(format(date, 'yyyy-MM-dd'));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Info Message */}
                {tempStartDate && tempEndDate && new Date(tempStartDate) > new Date(tempEndDate) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">Start date must be before end date</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCustomDateModal(false);
                    setTempStartDate('');
                    setTempEndDate('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (tempStartDate && tempEndDate && new Date(tempStartDate) <= new Date(tempEndDate)) {
                      setCustomStartDate(tempStartDate);
                      setCustomEndDate(tempEndDate);
                      setFilterDateRange('custom');
                      setShowCustomDateModal(false);
                    }
                  }}
                  disabled={!tempStartDate || !tempEndDate || new Date(tempStartDate) > new Date(tempEndDate)}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (() => {
        const schoolInfo = getSchoolInfo();
        const invoiceData = {
          invoiceNumber: selectedInvoice.invoice,
          date: selectedInvoice.date,
          schoolName: schoolInfo.name,
          schoolAddress: schoolInfo.address,
          schoolEmail: schoolInfo.email,
          schoolPhone: schoolInfo.phone,
          studentsCount: selectedInvoice.students,
          pricePerStudent: 5000,
          totalAmount: selectedInvoice.amount,
          billingPeriod: '3 months',
          nextBillingDate: 'Apr 15, 2026'
        };
        
        return (
          <InvoiceModal
            isOpen={true}
            onClose={() => setSelectedInvoice(null)}
            invoiceData={invoiceData}
          />
        );
      })()}
    </>
  );
}
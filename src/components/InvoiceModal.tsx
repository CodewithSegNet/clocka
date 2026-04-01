import React from 'react';
import { X, Download, Printer, Mail } from 'lucide-react';
import paystackLogo from 'figma:asset/f599648322cc42d0b295d07fc8184dc2d13c5056.png';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    invoiceNumber: string;
    date: string;
    schoolName: string;
    schoolAddress: string;
    schoolEmail: string;
    schoolPhone: string;
    studentsCount: number;
    pricePerStudent: number;
    totalAmount: number;
    billingPeriod: string;
    nextBillingDate: string;
  };
}

export default function InvoiceModal({ isOpen, onClose, invoiceData }: InvoiceModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('PDF download functionality would be implemented here using jsPDF library');
  };

  const handleEmail = () => {
    alert(`Email invoice to: ${invoiceData.schoolEmail}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Hidden on Print */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden z-10">
            <h2 className="text-xl font-bold text-gray-900">Invoice</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEmail}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Email Invoice"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print Invoice"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Content */}
          <div className="p-8 md:p-12">
            {/* Header Section */}
            <div className="mb-8 pb-8 border-b-2 border-gray-200">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-indigo-600 mb-2">INVOICE</h1>
                  <p className="text-gray-600">School Attendance SaaS Platform</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-sm text-gray-500 mb-1">Invoice Number</p>
                  <p className="text-2xl font-bold text-gray-900 mb-3">{invoiceData.invoiceNumber}</p>
                  <p className="text-sm text-gray-500 mb-1">Date Issued</p>
                  <p className="text-gray-900 font-medium">{invoiceData.date}</p>
                </div>
              </div>
            </div>

            {/* Bill To Section */}
            <div className="mb-8 grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-bold text-gray-900 text-lg mb-2">{invoiceData.schoolName}</p>
                  <p className="text-gray-600 text-sm mb-1">{invoiceData.schoolAddress}</p>
                  <p className="text-gray-600 text-sm mb-1">📧 {invoiceData.schoolEmail}</p>
                  <p className="text-gray-600 text-sm">📞 {invoiceData.schoolPhone}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment Details</h3>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 text-sm">Billing Period:</span>
                    <span className="font-semibold text-gray-900">{invoiceData.billingPeriod}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 text-sm">Payment Method:</span>
                    <span className="font-semibold text-gray-900">Paystack</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Next Billing:</span>
                    <span className="font-semibold text-gray-900">{invoiceData.nextBillingDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Items</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">School Attendance System Subscription</p>
                        <p className="text-sm text-gray-500">Per student fee for {invoiceData.billingPeriod}</p>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-900">{invoiceData.studentsCount}</td>
                      <td className="px-4 py-4 text-right text-gray-900">₦{invoiceData.pricePerStudent.toLocaleString()}</td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">₦{invoiceData.totalAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-80">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
                  <div className="flex justify-between mb-3 pb-3 border-b border-indigo-200">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-gray-900">₦{invoiceData.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-3 pb-3 border-b border-indigo-200">
                    <span className="text-gray-700">Tax (0%):</span>
                    <span className="font-semibold text-gray-900">₦0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Due:</span>
                    <span className="text-3xl font-bold text-indigo-600">₦{invoiceData.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Included */}
            <div className="mb-8 bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-green-900 uppercase mb-3">✓ Services Included</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs">✓</span>
                  Unlimited parents per student
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs">✓</span>
                  GPS-based attendance tracking
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs">✓</span>
                  Real-time notifications
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs">✓</span>
                  Photo verification
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs">✓</span>
                  Custom school branding
                </div>
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <span className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-green-700 text-xs">✓</span>
                  Attendance reports & analytics
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Thank you for choosing our School Attendance SaaS Platform!</p>
              <p className="text-xs text-gray-500">
                For questions about this invoice, please contact us at support@schoolattendance.com
              </p>
            </div>
          </div>

          {/* Footer Actions - Hidden on Print */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Invoice
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
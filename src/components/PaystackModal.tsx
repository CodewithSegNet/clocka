import React, { useState } from 'react';
import { X, CreditCard, Lock, Building2, Smartphone, Wallet } from 'lucide-react';
import paystackLogo from 'figma:asset/f599648322cc42d0b295d07fc8184dc2d13c5056.png';

interface PaystackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reference: string) => void;
  paymentData: {
    email: string;
    amount: number; // in Naira
    schoolName: string;
    studentsCount: number;
    reference: string;
  };
}

export default function PaystackModal({ isOpen, onClose, onSuccess, paymentData }: PaystackModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'bank' | 'ussd' | 'transfer'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMethod === 'card') {
      if (!cardNumber || !expiryDate || !cvv || !cardName) {
        alert('Please fill in all card details');
        return;
      }
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(paymentData.reference);
      alert('✅ Payment Successful!\n\nReference: ' + paymentData.reference);
      onClose();
    }, 2000);
  };

  const paymentMethods = [
    { id: 'card', icon: CreditCard, label: 'Card' },
    { id: 'bank', icon: Building2, label: 'Bank' },
    { id: 'ussd', icon: Smartphone, label: 'USSD' },
    { id: 'transfer', icon: Wallet, label: 'Transfer' }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
            {/* Left Sidebar - Payment Methods */}
            <div className="md:w-32 bg-gray-50 border-r border-gray-200 p-4">
              <div className="flex md:flex-col gap-2">
                <div className="mb-4 hidden md:block">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Pay With</p>
                </div>
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                      selectedMethod === method.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                    title={method.label}
                  >
                    <method.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content - Payment Form */}
            <div className="flex-1 overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{paymentData.email}</p>
                    <p className="font-semibold text-gray-900">Pay ₦{paymentData.amount.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Payment Form */}
              <div className="p-6 md:p-8">
                <form onSubmit={handlePayment}>
                  {selectedMethod === 'card' && (
                    <>
                      <p className="text-gray-600 mb-6">Enter your card details to pay</p>

                      <div className="space-y-4 mb-6">
                        {/* Card Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              placeholder="1234 5678 9012 3456"
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              maxLength={19}
                            />
                            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Expiry Date */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              value={expiryDate}
                              onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                              placeholder="MM/YY"
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              maxLength={5}
                            />
                          </div>

                          {/* CVV */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                              placeholder="123"
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                              maxLength={4}
                            />
                          </div>
                        </div>

                        {/* Card Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name on Card
                          </label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="JOHN DOE"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all uppercase"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedMethod === 'bank' && (
                    <div className="py-8 text-center">
                      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pay with Bank Account</h3>
                      <p className="text-gray-600 mb-6">
                        Select your bank and authorize the payment directly from your bank account
                      </p>
                      <select className="w-full pl-4 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none mb-4 appearance-none bg-white"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                          backgroundPosition: 'right 0.75rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                        }}
                      >
                        <option>Select your bank</option>
                        <option>Access Bank</option>
                        <option>GTBank</option>
                        <option>First Bank</option>
                        <option>Zenith Bank</option>
                        <option>UBA</option>
                        <option>Stanbic IBTC</option>
                      </select>
                    </div>
                  )}

                  {selectedMethod === 'ussd' && (
                    <div className="py-8 text-center">
                      <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Pay with USSD</h3>
                      <p className="text-gray-600 mb-6">
                        Dial the USSD code from your phone to complete payment
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-600 mb-2">Dial this code on your phone:</p>
                        <p className="text-2xl font-bold text-gray-900">*737*000*{paymentData.amount}#</p>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'transfer' && (
                    <div className="py-8 text-center">
                      <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Bank Transfer</h3>
                      <p className="text-gray-600 mb-6">
                        Transfer to the account details below
                      </p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                          <p className="font-semibold text-gray-900">Wema Bank</p>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-1">Account Number</p>
                          <p className="font-semibold text-gray-900 text-lg">1234567890</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Amount</p>
                          <p className="font-semibold text-gray-900 text-lg">₦{paymentData.amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className={`w-full py-4 rounded-lg font-semibold text-white text-lg transition-all ${
                      isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/50'
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Pay ₦${paymentData.amount.toLocaleString()}`
                    )}
                  </button>

                  {/* Security Notice */}
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      Secured by <span className="font-semibold text-blue-600">Paystack</span>
                    </p>
                  </div>
                </form>

                {/* Payment Details */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Payment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">School:</span>
                        <span className="font-medium text-gray-900">{paymentData.schoolName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-medium text-gray-900">{paymentData.studentsCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium text-gray-900">₦5,000/student/term</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="text-gray-600">Reference:</span>
                        <span className="font-mono text-xs text-gray-900">{paymentData.reference}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
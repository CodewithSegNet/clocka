import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Users, ArrowLeft, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import clockaLogo from 'figma:asset/dfa24a908ac139b2bdeb523b3c03bad0066dc258.png';

export default function ParentLoginNew() {
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { parentLogin } = useAuth();
  const { parents, students } = useData();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Trim inputs
    const trimmedStudentId = studentId.trim();
    const trimmedPin = pin.trim();
    
    console.log('🔍 Login attempt:', { 
      studentId: trimmedStudentId, 
      pin: trimmedPin,
      totalParents: parents.length 
    });
    
    // Validate student exists
    const student = students.find(s => s.id === trimmedStudentId);
    if (!student) {
      setError('Invalid Student ID');
      return;
    }
    
    // Find parent by student ID and PIN
    const parent = parents.find(p => 
      p.childrenIds.includes(trimmedStudentId) && 
      (p.pin === trimmedPin || p.password === trimmedPin) // Support both new PIN and old password
    );
    
    console.log('📋 Found parent:', parent);
    
    if (parent) {
      parentLogin(parent);
      navigate('/parent/dashboard');
      toast.success(`Welcome back, ${parent.name}!`);
    } else {
      // Check if there are any parents for this student
      const studentParents = parents.filter(p => p.childrenIds.includes(trimmedStudentId));
      
      if (studentParents.length === 0) {
        setError('No parent account registered for this student. Please create an account first.');
      } else {
        setError('Invalid PIN. Please check and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl text-center mb-2 font-bold">Parent Login</h1>
          <p className="text-gray-600 text-center mb-8">
            Enter your child's Student ID and your PIN
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-gray-700 font-medium">
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Enter your child's Student ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 font-medium">
                PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Enter PIN"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Enter the 4-digit PIN you created during registration
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Login
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/parent/register')}
                className="text-green-600 font-semibold hover:text-green-700 hover:underline inline-flex items-center gap-1"
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </button>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center mt-6 text-xs text-gray-500">
          Secured & Powered by <span className="font-semibold">Clocka</span>
        </p>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Users, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import clockaLogo from 'figma:asset/dfa24a908ac139b2bdeb523b3c03bad0066dc258.png';

export default function ParentLogin() {
  const [parentId, setParentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { parentLogin } = useAuth();
  const { getParentByCredentials, parents } = useData();

  // Check if parent has a school code and redirect to school-specific login
  useEffect(() => {
    const schoolCode = localStorage.getItem('currentParentSchoolCode');
    if (schoolCode) {
      navigate(`/school/${schoolCode}/parent-login`, { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Trim whitespace from inputs
    const trimmedParentId = parentId.trim();
    const trimmedPassword = password.trim();
    
    console.log('🔍 Login attempt:', { 
      parentId: trimmedParentId, 
      password: trimmedPassword,
      totalParents: parents.length 
    });
    
    console.log('📋 All parents in database:', parents.map(p => ({
      id: p.id,
      parentId: p.parentId,
      name: p.name,
      password: p.password,
      familyId: p.familyId
    })));
    
    const parent = getParentByCredentials(trimmedParentId, trimmedPassword);
    
    console.log('✅ Found parent:', parent);
    
    if (parent) {
      parentLogin(parent);
      navigate('/parent/dashboard');
    } else {
      console.error('❌ Login failed - no matching parent found');
      setError('Invalid credentials. Please check your Parent ID and password.');
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
          
          <h1 className="text-3xl text-center mb-2">Parent Login</h1>
          <p className="text-gray-600 text-center mb-8">
            Enter your credentials to access the attendance system
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Parent ID
              </label>
              <input
                type="text"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                placeholder="Enter your Parent ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
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
                className="text-green-600 font-semibold hover:text-green-700 hover:underline"
              >
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
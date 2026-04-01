import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, User, Lock } from 'lucide-react';
import clockaLogo from 'figma:asset/c6c92aab0f7d59ff7afbce0ebd8b122d9715bdde.png';
import { toast } from 'sonner';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Super admin credentials
    if (username === 'superadmin' && password === 'super123') {
      setTimeout(() => {
        localStorage.setItem('superAdminAuth', 'true');
        toast.success('Super Admin login successful!');
        navigate('/super-admin/dashboard');
        setIsLoading(false);
      }, 800);
    } else {
      setTimeout(() => {
        toast.error('Invalid super admin credentials');
        setIsLoading(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-[#0039E6] hover:text-[#0029B3] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Home</span>
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-[#0039E6]">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#0039E6] to-[#0029B3] p-8 text-white text-center">
            <img 
              src={clockaLogo} 
              alt="Clocka Logo" 
              className="w-20 h-20 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold mb-2">Super Admin Portal</h1>
            <p className="text-blue-100 text-sm">Platform Management Dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0039E6] focus:outline-none transition-colors"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0039E6] focus:outline-none transition-colors"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#0039E6] to-[#0029B3] text-white py-3 rounded-xl font-semibold hover:from-[#0029B3] hover:to-[#001F80] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center mt-6 text-sm text-gray-600">
          Secured & Powered by <span className="font-bold bg-gradient-to-r from-[#0039E6] to-[#3366FF] bg-clip-text text-transparent">Clocka</span>
        </p>
      </div>
    </div>
  );
}
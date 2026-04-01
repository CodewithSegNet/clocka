import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { School, Eye, EyeOff, Loader } from 'lucide-react';
import clockaLogo from 'figma:asset/c6c92aab0f7d59ff7afbce0ebd8b122d9715bdde.png';
import * as supabaseApi from '@/utils/supabaseApi';
import { toast } from 'sonner';

export default function SchoolLogin() {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const navigate = useNavigate();
  const { schoolLogin } = useAuth();

  useEffect(() => {
    const loadSchool = async () => {
      if (!schoolCode) {
        setError('Invalid school link');
        setIsLoading(false);
        return;
      }

      try {
        // Try to load from Supabase first
        const school = await supabaseApi.getSchoolByCode(schoolCode);
        if (school) {
          setSchoolInfo(school);
          setIsLoading(false);
          return;
        }

        // Fall back to localStorage
        const schools = JSON.parse(localStorage.getItem('schools') || '[]');
        const localSchool = schools.find((s: any) => s.schoolCode === schoolCode);
        
        if (localSchool) {
          setSchoolInfo(localSchool);
        } else {
          setError('School not found. Please check the link and try again.');
        }
      } catch (err) {
        console.error('Error loading school:', err);
        setError('Failed to load school information');
      } finally {
        setIsLoading(false);
      }
    };

    loadSchool();
  }, [schoolCode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!schoolInfo) {
      setError('School information not loaded');
      return;
    }

    // Check credentials
    if (schoolInfo.username === username && schoolInfo.password === password) {
      schoolLogin(schoolInfo);
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#0039E6] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading school information...</p>
        </div>
      </div>
    );
  }

  if (error && !schoolInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <School className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[#0039E6] text-white rounded-xl font-semibold hover:bg-[#0029B3] transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with School Branding */}
          <div className="bg-gradient-to-br from-[#0039E6] to-[#0029B3] p-8 text-white text-center">
            {schoolInfo?.logo ? (
              <img 
                src={schoolInfo.logo} 
                alt={schoolInfo.name} 
                className="w-20 h-20 rounded-xl mx-auto mb-4 bg-white/20 p-2"
              />
            ) : (
              <div className="bg-white/20 w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <School className="w-10 h-10 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold mb-2">{schoolInfo?.name}</h1>
            <p className="text-blue-100 text-sm">Administrator Login</p>
            <p className="text-blue-200 text-xs mt-1">Manage your school's attendance & student records</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0039E6] focus:outline-none transition-colors"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#0039E6] focus:outline-none transition-colors pr-12"
                  placeholder="Enter your password"
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
              className="w-full bg-[#0039E6] text-white py-3 rounded-xl hover:bg-[#0029B3] transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              Login
            </button>

            {/* School Code Display */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-2">School Code</p>
              <p className="font-mono font-bold text-[#0039E6] text-center text-lg">{schoolCode}</p>
            </div>
          </form>

          {/* Clocka Branding */}
          <div className="px-8 pb-6">
            <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
              <img src={clockaLogo} alt="Clocka" className="w-6 h-6" />
              <p className="text-sm text-gray-600">
                Powered by <span className="font-bold bg-gradient-to-r from-[#0039E6] to-[#3366FF] bg-clip-text text-transparent">Clocka</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

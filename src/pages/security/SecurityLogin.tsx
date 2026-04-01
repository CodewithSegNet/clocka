import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, User, Lock, Eye, EyeOff, LogIn, Loader2, Building2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import * as supabaseApi from '@/utils/supabaseApi';

export default function SecurityLogin() {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const navigate = useNavigate();
  const { getSecurityByCredentials } = useData();
  const { securityLogin } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchoolInfo() {
      if (!schoolCode) {
        toast.error('School code missing');
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        console.log('📡 Fetching school info for security login:', schoolCode);
        
        // Try fetching from Supabase first
        const school = await supabaseApi.getSchoolInfo(schoolCode);
        
        if (school) {
          console.log('✅ School loaded from Supabase:', school.name);
          
          if (school.status !== 'active') {
            toast.error('This school is currently inactive. Please contact your administrator.');
            navigate('/');
            return;
          }
          
          setSchoolInfo(school);
          sessionStorage.setItem('schoolCode', schoolCode);
        } else {
          // School not found in Supabase, try localStorage fallback
          console.warn('⚠️ School not found in Supabase, checking localStorage...');
          
          const storedSchoolInfo = localStorage.getItem('schoolInfo');
          const storedSchoolCode = localStorage.getItem('schoolCode');
          
          if (storedSchoolInfo && storedSchoolCode === schoolCode) {
            const localSchool = JSON.parse(storedSchoolInfo);
            console.log('✅ School loaded from localStorage:', localSchool.name);
            
            setSchoolInfo({
              id: schoolCode,
              schoolCode: schoolCode,
              name: localSchool.name || 'School',
              address: localSchool.address || '',
              email: localSchool.email || '',
              phone: localSchool.phone || '',
              logo: localSchool.logo || '',
              status: 'active'
            });
            sessionStorage.setItem('schoolCode', schoolCode);
          } else {
            // School not found anywhere
            toast.error('School not found. Please check your link or contact the school.');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('❌ Error loading school info:', error);
        
        // Try localStorage as last resort
        const storedSchoolInfo = localStorage.getItem('schoolInfo');
        const storedSchoolCode = localStorage.getItem('schoolCode');
        
        if (storedSchoolInfo && storedSchoolCode === schoolCode) {
          const localSchool = JSON.parse(storedSchoolInfo);
          console.log('🔄 Using localStorage fallback:', localSchool.name);
          
          setSchoolInfo({
            id: schoolCode,
            schoolCode: schoolCode,
            name: localSchool.name || 'School',
            address: localSchool.address || '',
            email: localSchool.email || '',
            phone: localSchool.phone || '',
            logo: localSchool.logo || '',
            status: 'active'
          });
          sessionStorage.setItem('schoolCode', schoolCode);
        } else {
          toast.error('Unable to load school information. Please try again later or contact the school.');
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    }

    loadSchoolInfo();
  }, [schoolCode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      // Validate credentials
      const security = getSecurityByCredentials(username.trim(), password.trim());

      if (!security) {
        toast.error('Invalid credentials', {
          description: 'Please check your username and password'
        });
        setIsLoading(false);
        return;
      }

      if (!security.isActive) {
        toast.error('Account deactivated', {
          description: 'Your account has been deactivated. Please contact administration.'
        });
        setIsLoading(false);
        return;
      }

      // Log in
      securityLogin(security);
      
      toast.success(`Welcome, ${security.fullName}!`);
      navigate('/security/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: 'An error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-2xl mb-4">
            <Shield className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading school information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Clocka Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Clocka</h1>
          <p className="text-blue-200 text-sm">Security Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with School Logo and Name */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8 text-center">
            {/* School Logo */}
            {schoolInfo?.logo ? (
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-white shadow-lg">
                  <img
                    src={schoolInfo.logo}
                    alt={schoolInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
            
            {/* School Name */}
            {schoolInfo && (
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">{schoolInfo.name}</h2>
                <p className="text-blue-100 text-sm mt-1">Code: {schoolCode}</p>
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-white mb-2">Security Login</h3>
            <p className="text-blue-100 text-sm">
              Access attendance logs and assignee information
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Login to Security Portal
                </>
              )}
            </Button>

            {/* Help Text */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Don't have credentials?{' '}
                <span className="text-blue-600 font-semibold">
                  Contact your School Administrator
                </span>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-blue-200 text-sm">
            Powered by <span className="font-bold">Clocka</span> - Secure Attendance Management
          </p>
        </div>
      </div>
    </div>
  );
}
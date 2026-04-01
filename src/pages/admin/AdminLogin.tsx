import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { School, ArrowLeft, Eye, EyeOff, Shield, Zap, Baby, Heart, GraduationCap, Star, Lock, Mail } from 'lucide-react';
import clockaLogo from 'figma:asset/c6c92aab0f7d59ff7afbce0ebd8b122d9715bdde.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { schoolLogin } = useAuth();
  
  // Detect if running in Figma preview (iframe)
  const isInFigmaPreview = window.self !== window.top;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Figma Preview Quick Login - bypass authentication
    if (isInFigmaPreview) {
      const demoSchool = {
        id: '1',
        name: 'Greenwood High School',
        address: '123 Education Lane, Springfield',
        email: 'admin@greenwood.edu',
        phone: '+1 (555) 123-4567',
        username: 'greenwood_admin',
        password: 'green123',
        schoolCode: 'GRE847291001',
        logo: ''
      };
      schoolLogin(demoSchool);
      navigate('/admin/dashboard');
      return;
    }
    
    // Try Supabase first
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const { projectId, publicAnonKey } = await import('@/utils/supabase/info');
      const supabaseClient = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );
      
      const { data: school } = await supabaseClient
        .from('schools')
        .select('*')
        .eq('email', email)
        .eq('admin_password', password)
        .maybeSingle();
      
      if (school) {
        const schoolObj = {
          id: school.id,
          name: school.name,
          address: school.address || '',
          email: school.email,
          phone: school.phone || '',
          password: school.admin_password,
          schoolCode: school.school_code,
          logo: school.logo || '',
          settings: school.settings || {},
          parentPortalAppearance: school.parent_portal_appearance || {},
        };
        schoolLogin(schoolObj);
        // Store school code for data context
        sessionStorage.setItem('schoolCode', school.school_code);
        localStorage.setItem('schoolCode', school.school_code);
        navigate('/admin/dashboard');
        return;
      }
    } catch (err) {
      console.warn('Supabase login check failed, falling back to localStorage');
    }
    
    // Fallback: check localStorage
    const schools = JSON.parse(localStorage.getItem('schools') || '[]');
    const school = schools.find((s: any) => 
      s.email === email && s.password === password
    );
    
    if (school) {
      schoolLogin(school);
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials. Please check your email and password.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0039E6] via-[#3366FF] to-[#667EEA]">
        {/* Animated Gradient Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="gradient-blob gradient-blob-1"></div>
          <div className="gradient-blob gradient-blob-2"></div>
          <div className="gradient-blob gradient-blob-3"></div>
          <div className="gradient-blob gradient-blob-4"></div>
        </div>
      </div>

      {/* Floating Child & Security Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Child-related icons */}
        <div className="absolute top-[15%] left-[8%] text-white/10 animate-float">
          <Baby className="w-12 h-12" />
        </div>
        <div className="absolute top-[25%] right-[12%] text-white/15 animate-float-delayed">
          <Heart className="w-10 h-10" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] text-white/12 animate-float-slow">
          <GraduationCap className="w-14 h-14" />
        </div>
        <div className="absolute top-[45%] right-[10%] text-white/10 animate-float">
          <Star className="w-8 h-8" />
        </div>
        <div className="absolute bottom-[35%] right-[18%] text-white/15 animate-float-delayed">
          <School className="w-11 h-11" />
        </div>
        
        {/* Security-related icons */}
        <div className="absolute top-[60%] left-[10%] text-white/12 animate-float-slow">
          <Shield className="w-10 h-10" />
        </div>
        <div className="absolute bottom-[15%] right-[8%] text-white/10 animate-float">
          <Lock className="w-9 h-9" />
        </div>
        <div className="absolute top-[35%] left-[5%] text-white/8 animate-float-delayed">
          <Heart className="w-7 h-7" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-white/90 hover:text-white transition-colors backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0039E6] to-[#3366FF] rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-white p-3 rounded-2xl shadow-lg">
                <img 
                  src={clockaLogo} 
                  alt="Clocka" 
                  className="w-14 h-14"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0039E6] to-[#3366FF] bg-clip-text text-transparent mb-1">
              Clocka
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>School Admin Portal</span>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 text-sm">
              Sign in to manage your school's attendance system
            </p>
          </div>
          
          {/* Figma Preview Quick Login Badge */}
          {isInFigmaPreview && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-purple-900 font-semibold text-sm mb-1">
                <Zap className="w-4 h-4" />
                <span>Figma Quick Login Active</span>
              </div>
              <p className="text-center text-purple-700 text-xs">
                Just click "Login" button to access dashboard
              </p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0039E6]/20 focus:border-[#0039E6] outline-none transition-all"
                placeholder="Enter email"
                required={!isInFigmaPreview}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0039E6]/20 focus:border-[#0039E6] outline-none transition-all"
                  placeholder="Enter password"
                  required={!isInFigmaPreview}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0039E6] to-[#3366FF] text-white py-4 rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold text-base shadow-lg"
            >
              Login to Dashboard
            </button>
          </form>

          {/* Forgot Password Link - Centered below login button */}
          <div className="mt-4 text-center">
            <p className="text-center text-sm text-[#0039E6]/80 hover:text-[#0039E6] transition-colors">
              Forgot credentials? Please contact your{' '}
              <span className="font-semibold">System Administrator</span>
              {' '}to reset password
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center mt-6 text-sm text-white/80 backdrop-blur-sm">
          Secured & Powered by <span className="font-bold">Clocka</span>
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes gradient-shift {
          0%, 100% {
            transform: translate(0%, 0%) scale(1) rotate(0deg);
            opacity: 0.5;
          }
          33% {
            transform: translate(40%, 30%) scale(1.2) rotate(120deg);
            opacity: 0.7;
          }
          66% {
            transform: translate(-30%, 40%) scale(0.9) rotate(240deg);
            opacity: 0.6;
          }
        }
        
        .animate-float {
          animation: float 7s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 9s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 11s ease-in-out infinite;
        }
        
        .gradient-blob {
          position: absolute;
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          filter: blur(50px);
          animation: gradient-shift 15s ease-in-out infinite;
          mix-blend-mode: screen;
        }
        
        .gradient-blob-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(45deg, rgba(51, 102, 255, 0.6), rgba(102, 126, 234, 0.5));
          top: -15%;
          left: -15%;
          animation-delay: 0s;
        }
        
        .gradient-blob-2 {
          width: 700px;
          height: 700px;
          background: linear-gradient(135deg, rgba(0, 57, 230, 0.5), rgba(51, 102, 255, 0.6));
          bottom: -20%;
          right: -20%;
          animation-delay: -5s;
        }
        
        .gradient-blob-3 {
          width: 550px;
          height: 550px;
          background: linear-gradient(225deg, rgba(102, 126, 234, 0.55), rgba(147, 197, 253, 0.5));
          top: 30%;
          right: -10%;
          animation-delay: -10s;
        }
        
        .gradient-blob-4 {
          width: 500px;
          height: 500px;
          background: linear-gradient(315deg, rgba(51, 102, 255, 0.45), rgba(0, 57, 230, 0.55));
          bottom: 20%;
          left: -5%;
          animation-delay: -7.5s;
        }
      `}</style>
    </div>
  );
}
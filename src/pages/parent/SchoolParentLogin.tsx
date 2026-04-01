import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Users, ArrowLeft, Eye, EyeOff, Building2, UserPlus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import clockaLogo from 'figma:asset/dfa24a908ac139b2bdeb523b3c03bad0066dc258.png';
import * as supabaseApi from '@/utils/supabaseApi';
import PINResetModal from '@/components/PINResetModal';

export default function SchoolParentLogin() {
  const { schoolCode } = useParams<{ schoolCode: string }>();
  const [studentId, setStudentId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPINResetModal, setShowPINResetModal] = useState(false);
  const navigate = useNavigate();
  const { parentLogin } = useAuth();
  const { parents, students } = useData();

  useEffect(() => {
    async function loadSchoolInfo() {
      if (!schoolCode) {
        toast.error('School code missing');
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        console.log('📡 Fetching school info for:', schoolCode);
        
        // Try fetching from Supabase first
        const school = await supabaseApi.getSchoolInfo(schoolCode);
        
        if (school) {
          console.log('✅ School loaded from Supabase:', school.name);
          console.log('🎨 [SCHOOL] Parent Portal Appearance:', school.parentPortalAppearance);
          
          if (school.status !== 'active') {
            toast.error('This school is currently inactive. Please contact your administrator.');
            navigate('/');
            return;
          }
          
          setSchoolInfo(school);
        } else {
          // School not found in Supabase, try localStorage fallback
          console.warn('⚠️ School not found in Supabase, checking localStorage...');
          
          const storedSchoolInfo = localStorage.getItem('schoolInfo');
          const storedSchoolCode = localStorage.getItem('schoolCode');
          
          if (storedSchoolInfo && storedSchoolCode === schoolCode) {
            const localSchool = JSON.parse(storedSchoolInfo);
            console.log('✅ School loaded from localStorage:', localSchool.name);
            
            // Load parent portal appearance from localStorage
            const storedAppearance = localStorage.getItem('parentPortalAppearance');
            const parentPortalAppearance = storedAppearance 
              ? JSON.parse(storedAppearance) 
              : {
                  backgroundType: 'gradient',
                  backgroundColor: '#10b981',
                  gradientFrom: '#10b981',
                  gradientTo: '#14b8a6',
                  backgroundImage: ''
                };
            
            console.log('🎨 [SCHOOL] Loaded appearance from localStorage:', parentPortalAppearance);
            
            setSchoolInfo({
              id: schoolCode,
              schoolCode: schoolCode,
              name: localSchool.name || 'School',
              address: localSchool.address || '',
              email: localSchool.email || '',
              phone: localSchool.phone || '',
              logo: localSchool.logo || '',
              status: 'active',
              parentPortalAppearance: parentPortalAppearance
            });
          } else {
            // School not found anywhere
            toast.error('School not found. Please check your link or contact the school.');
            navigate('/');
          }
        }
      } catch (error) {
        console.error('❌ Error loading school:', error);
        
        // Try localStorage as fallback
        const storedSchoolInfo = localStorage.getItem('schoolInfo');
        const storedSchoolCode = localStorage.getItem('schoolCode');
        
        if (storedSchoolInfo && storedSchoolCode === schoolCode) {
          const localSchool = JSON.parse(storedSchoolInfo);
          console.log('🔄 Using localStorage fallback:', localSchool.name);
          
          // Load parent portal appearance from localStorage
          const storedAppearance = localStorage.getItem('parentPortalAppearance');
          const parentPortalAppearance = storedAppearance 
            ? JSON.parse(storedAppearance) 
            : {
                backgroundType: 'gradient',
                backgroundColor: '#10b981',
                gradientFrom: '#10b981',
                gradientTo: '#14b8a6',
                backgroundImage: ''
              };
          
          console.log('🎨 [SCHOOL] Loaded appearance from localStorage (error fallback):', parentPortalAppearance);
          
          setSchoolInfo({
            id: schoolCode,
            schoolCode: schoolCode,
            name: localSchool.name || 'School',
            address: localSchool.address || '',
            email: localSchool.email || '',
            phone: localSchool.phone || '',
            logo: localSchool.logo || '',
            status: 'active',
            parentPortalAppearance: parentPortalAppearance
          });
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!schoolInfo) {
      setError('School information not found');
      return;
    }
    
    // Trim inputs
    const trimmedStudentId = studentId.trim();
    const trimmedPin = pin.trim();
    
    console.log('🔍 School Login attempt:', { 
      studentId: trimmedStudentId, 
      pin: trimmedPin,
      schoolCode,
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
    
    console.log('✅ Found parent:', parent);
    
    if (parent) {
      // Store school code for this parent's session
      localStorage.setItem('currentParentSchoolCode', schoolCode || '');
      
      // Add schoolCode to parent object for the session
      const parentWithSchoolCode = {
        ...parent,
        schoolCode: schoolCode
      };
      
      console.log('✅ Logging in parent with school code:', schoolCode);
      
      parentLogin(parentWithSchoolCode);
      navigate('/parent/dashboard');
      toast.success(`Welcome back, ${parent.name}!`);
    } else {
      // Check if there are any parents for this student at all
      const anyParentForStudent = parents.some(p => p.childrenIds.includes(trimmedStudentId));
      
      if (!anyParentForStudent) {
        console.error('❌ Login failed - Account not found or has been deleted');
        setError('Account not found. This account may have been deleted by the school. Please contact your school administrator.');
      } else {
        console.error('❌ Login failed - Invalid PIN');
        setError('Invalid PIN. Please check your 4-digit PIN and try again.');
      }
    }
  };

  // Generate background style based on school settings
  const getBackgroundStyle = () => {
    if (!schoolInfo?.parentPortalAppearance) {
      // Default gradient while loading
      console.log('🎨 [BG] No appearance settings, using default');
      return {
        background: 'linear-gradient(to bottom right, rgb(243 244 246), rgb(229 231 235), rgb(209 213 219))'
      };
    }

    const { backgroundType, backgroundColor, backgroundImage, gradientFrom, gradientTo } = schoolInfo.parentPortalAppearance;
    
    console.log('🎨 [BG] Applying background:', { backgroundType, backgroundColor, gradientFrom, gradientTo, hasImage: !!backgroundImage });

    if (backgroundType === 'gradient') {
      const gradientStyle = {
        background: `linear-gradient(to bottom right, ${gradientFrom || '#10b981'}, ${gradientTo || '#14b8a6'})`
      };
      console.log('🎨 [BG] Using gradient:', gradientStyle.background);
      return gradientStyle;
    } else if (backgroundType === 'image' && backgroundImage) {
      console.log('🎨 [BG] Using image:', backgroundImage);
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      };
    } else if (backgroundType === 'color') {
      const colorStyle = {
        backgroundColor: backgroundColor || '#10b981'
      };
      console.log('🎨 [BG] Using solid color:', colorStyle.backgroundColor);
      return colorStyle;
    }

    // Fallback
    console.log('🎨 [BG] Using fallback gradient');
    return {
      background: 'linear-gradient(to bottom right, rgb(243 244 246), rgb(229 231 235), rgb(209 213 219))'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={getBackgroundStyle()}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4" style={getBackgroundStyle()}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* School Info Header */}
          {schoolInfo && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 px-6 sm:px-8 py-8 sm:py-10 text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                {schoolInfo.logo ? (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white shadow-lg">
                    <img 
                      src={schoolInfo.logo} 
                      alt={schoolInfo.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center shadow-lg">
                    <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 px-2">{schoolInfo.name}</h1>
              <p className="text-gray-300 text-xs sm:text-sm">Parent Portal Login</p>
            </div>
          )}

          {/* Login Form */}
          <div className="p-6 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 text-center">Welcome Back</h2>
            <p className="text-gray-600 text-center mb-6 sm:mb-8 text-sm">
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

            {/* Forgot PIN Link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowPINResetModal(true)}
                className="text-green-600 font-semibold hover:text-green-700 hover:underline text-sm inline-flex items-center gap-1"
              >
                <KeyRound className="w-4 h-4" />
                Forgot PIN?
              </button>
            </div>

            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    // Store schoolCode and school info before navigating to registration
                    if (schoolCode && schoolInfo) {
                      localStorage.setItem('schoolCode', schoolCode);
                      localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
                      localStorage.setItem('schoolLogo', schoolInfo.logo || '');
                      localStorage.setItem('schoolName', schoolInfo.name);
                      console.log('✅ [REGISTRATION] School context saved:', schoolCode, schoolInfo.name);
                    }
                    navigate('/parent/register');
                  }}
                  className="text-green-600 font-semibold hover:text-green-700 hover:underline inline-flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </button>
              </p>
            </div>

            {/* School Info */}
            {schoolInfo && (
              <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">
                  <strong>{schoolInfo.name}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">{schoolInfo.address}</p>
                {schoolInfo.phone && (
                  <p className="text-xs text-gray-500">{schoolInfo.phone}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center mt-6 text-xs text-gray-500">
          Secured & Powered by <span className="font-semibold">Clocka</span>
        </p>
      </div>

      {/* PIN Reset Modal */}
      {schoolInfo && (
        <PINResetModal
          isOpen={showPINResetModal}
          onClose={() => setShowPINResetModal(false)}
          schoolCode={schoolCode || ''}
          schoolName={schoolInfo.name}
        />
      )}
    </div>
  );
}
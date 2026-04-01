import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertCircle, Clock, UserCheck, Fingerprint, Building2, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import clockaLogo from 'figma:asset/dfa24a908ac139b2bdeb523b3c03bad0066dc258.png';
import * as supabaseApi from '@/utils/supabaseApi';

export default function AssigneeLogin() {
  const navigate = useNavigate();
  const { schoolCode } = useParams<{ schoolCode?: string }>();
  const dataContext = useData();
  const { assigneeLogin } = useAuth();
  
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Safe access to data with fallbacks
  const getAssigneeByAccessCode = dataContext?.getAssigneeByAccessCode;
  const schools = dataContext?.schools || [];
  
  // Load school info with branding
  useEffect(() => {
    async function loadSchoolInfo() {
      if (!schoolCode) {
        toast.error('School code missing');
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        console.log('📡 [ASSIGNEE] Fetching school info for:', schoolCode);
        
        // Try fetching from Supabase first
        const school = await supabaseApi.getSchoolInfo(schoolCode);
        
        if (school) {
          console.log('✅ [ASSIGNEE] School loaded from Supabase:', school.name);
          console.log('🎨 [ASSIGNEE] Parent Portal Appearance:', school.parentPortalAppearance);
          
          if (school.status !== 'active') {
            toast.error('This school is currently inactive. Please contact your administrator.');
            navigate('/');
            return;
          }
          
          setSchoolInfo(school);
        } else {
          // School not found in Supabase, try localStorage fallback
          console.warn('⚠️ [ASSIGNEE] School not found in Supabase, checking localStorage...');
          
          const storedSchoolInfo = localStorage.getItem('schoolInfo');
          const storedSchoolCode = localStorage.getItem('schoolCode');
          
          if (storedSchoolInfo && storedSchoolCode === schoolCode) {
            const localSchool = JSON.parse(storedSchoolInfo);
            console.log('✅ [ASSIGNEE] School loaded from localStorage:', localSchool.name);
            
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
            
            console.log('🎨 [ASSIGNEE] Loaded appearance from localStorage:', parentPortalAppearance);
            
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
        console.error('❌ [ASSIGNEE] Error loading school:', error);
        
        // Try localStorage as fallback
        const storedSchoolInfo = localStorage.getItem('schoolInfo');
        const storedSchoolCode = localStorage.getItem('schoolCode');
        
        if (storedSchoolInfo && storedSchoolCode === schoolCode) {
          const localSchool = JSON.parse(storedSchoolInfo);
          console.log('🔄 [ASSIGNEE] Using localStorage fallback:', localSchool.name);
          
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
          
          console.log('🎨 [ASSIGNEE] Loaded appearance from localStorage (error fallback):', parentPortalAppearance);
          
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

  // Generate background style based on school settings
  const getBackgroundStyle = () => {
    if (!schoolInfo?.parentPortalAppearance) {
      // Default gradient while loading
      console.log('🎨 [ASSIGNEE-BG] No appearance settings, using default');
      return {
        background: 'linear-gradient(to bottom right, rgb(16 185 129), rgb(20 184 166))'
      };
    }

    const { backgroundType, backgroundColor, backgroundImage, gradientFrom, gradientTo } = schoolInfo.parentPortalAppearance;
    
    console.log('🎨 [ASSIGNEE-BG] Applying background:', { backgroundType, backgroundColor, gradientFrom, gradientTo, hasImage: !!backgroundImage });

    if (backgroundType === 'gradient') {
      const gradientStyle = {
        background: `linear-gradient(to bottom right, ${gradientFrom || '#10b981'}, ${gradientTo || '#14b8a6'})`
      };
      console.log('🎨 [ASSIGNEE-BG] Using gradient:', gradientStyle.background);
      return gradientStyle;
    } else if (backgroundType === 'image' && backgroundImage) {
      console.log('🎨 [ASSIGNEE-BG] Using image:', backgroundImage);
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
      console.log('🎨 [ASSIGNEE-BG] Using solid color:', colorStyle.backgroundColor);
      return colorStyle;
    }

    // Fallback
    console.log('🎨 [ASSIGNEE-BG] Using fallback gradient');
    return {
      background: 'linear-gradient(to bottom right, rgb(16 185 129), rgb(20 184 166))'
    };
  };

  // Show loading state if data isn't ready
  if (!dataContext || !getAssigneeByAccessCode || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={getBackgroundStyle()}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast.error('Please enter your access code');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔍 [ASSIGNEE LOGIN] Searching for access code:', accessCode.trim().toUpperCase());
      console.log('🔍 [ASSIGNEE LOGIN] School code from URL:', schoolCode);
      console.log('🔍 [ASSIGNEE LOGIN] DataContext available:', !!dataContext);
      console.log('🔍 [ASSIGNEE LOGIN] getAssigneeByAccessCode available:', !!getAssigneeByAccessCode);
      console.log('🔍 [ASSIGNEE LOGIN] Available assignees:', dataContext.assignees?.length || 0);
      
      // Log all assignees with their access codes for debugging
      if (dataContext.assignees && dataContext.assignees.length > 0) {
        console.log('📋 [ASSIGNEE LOGIN] All assignee access codes:', 
          dataContext.assignees.map(a => ({ 
            name: a.fullName, 
            code: a.accessCode, 
            active: a.isActive,
            expires: a.expiresAt,
            schoolCode: a.schoolCode
          }))
        );
      } else {
        console.warn('⚠️ [ASSIGNEE LOGIN] No assignees found in DataContext!');
        
        // Try to manually check localStorage
        const storedAssignees = localStorage.getItem('assignees');
        if (storedAssignees) {
          const parsed = JSON.parse(storedAssignees);
          console.log('📦 [ASSIGNEE LOGIN] Found assignees in localStorage:', parsed.length);
          console.log('📦 [ASSIGNEE LOGIN] LocalStorage assignees:', 
            parsed.map((a: any) => ({ 
              name: a.fullName, 
              code: a.accessCode 
            }))
          );
        } else {
          console.error('❌ [ASSIGNEE LOGIN] No assignees in localStorage either!');
        }
      }
      
      const assignee = getAssigneeByAccessCode(accessCode.trim().toUpperCase());
      
      console.log('🔍 [ASSIGNEE LOGIN] Found assignee:', assignee);
      
      if (!assignee) {
        toast.error('Invalid access code', {
          description: 'Please check your code and try again'
        });
        setIsLoading(false);
        return;
      }

      // Check if expired
      const expiresAt = new Date(assignee.expiresAt);
      const now = new Date();
      
      if (expiresAt < now) {
        toast.error('Access code has expired', {
          description: 'Please contact the parent for a new code'
        });
        setIsLoading(false);
        return;
      }

      if (!assignee.isActive) {
        toast.error('Access has been revoked', {
          description: 'Please contact the parent'
        });
        setIsLoading(false);
        return;
      }

      // Ensure the assignee has the schoolCode
      if (!assignee.schoolCode && schoolCode) {
        console.log('⚠️ [ASSIGNEE LOGIN] Assignee missing schoolCode, adding from URL:', schoolCode);
        assignee.schoolCode = schoolCode;
      }

      // Use the assigneeLogin function from AuthContext
      assigneeLogin(assignee);
      
      console.log('✅ [ASSIGNEE LOGIN] Successfully logged in with schoolCode:', assignee.schoolCode);
      
      toast.success(`Welcome, ${assignee.fullName}!`);
      navigate('/assignee/dashboard');
      
    } catch (error) {
      console.error('Assignee login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4" style={getBackgroundStyle()}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
          {/* School Info Header - Same as Parent Login */}
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
              <p className="text-gray-300 text-xs sm:text-sm">Assignee Portal Login</p>
            </div>
          )}

          {/* Form Section */}
          <div className="p-6 sm:p-8">
            {/* Info Banner */}
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900">Temporary Access Portal</p>
                  <p className="text-amber-700 mt-1">
                    Enter the access code provided by the parent/guardian
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Access Code Input */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 font-medium">
                  Access Code
                </label>
                <div className="relative">
                  <input
                    type={showAccessCode ? "text" : "password"}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center text-lg font-bold tracking-wider uppercase"
                    maxLength={20}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showAccessCode ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Code provided by parent (e.g., ASGK7X8M2ABC)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying Access...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5" />
                    Access Portal
                  </span>
                )}
              </button>
            </form>

            {/* Features Grid */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 text-center">
                What You Can Do
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="bg-emerald-100 p-2 rounded-lg mb-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Time-Limited Access</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-lg mb-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Clock In/Out Children</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-purple-50 rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-lg mb-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Verified Access</span>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-orange-50 rounded-lg">
                  <div className="bg-orange-100 p-2 rounded-lg mb-2">
                    <Fingerprint className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">Secure Login</span>
                </div>
              </div>
            </div>

            {/* School Info - Same as Parent Login */}
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

        {/* Footer Note - Clocka Branding */}
        <p className="text-center mt-6 text-xs text-white/80">
          Secured & Powered by <span className="font-semibold">Clocka</span>
        </p>
      </div>
    </div>
  );
}
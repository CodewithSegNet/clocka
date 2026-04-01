import React from 'react';
import { useNavigate } from 'react-router-dom';
import { School, ArrowLeft, AlertCircle, Phone, Mail } from 'lucide-react';
import clockaLogo from 'figma:asset/dfa24a908ac139b2bdeb523b3c03bad0066dc258.png';

export default function ParentLoginRedirect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center">
              <School className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          
          {/* Message */}
          <h1 className="text-3xl text-center mb-4 font-bold text-gray-900">Parent Login</h1>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-blue-900 mb-3">
                  Please use your school's login link
                </p>
                <p className="text-blue-800 text-sm mb-4">
                  Parents must access the login page through the unique link provided by their school. 
                  This ensures you're logging into the correct school's system with proper branding and settings.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Get Your School's Link
              </h3>
              <p className="text-sm text-gray-700 ml-8">
                Your school administrator will provide you with a unique login link that looks like:
              </p>
              <p className="text-xs font-mono bg-white p-2 rounded mt-2 ml-8 text-gray-600">
                yourschool.com/school/ABC123/parent-login
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Use That Link to Login
              </h3>
              <p className="text-sm text-gray-700 ml-8">
                Click on or visit the link provided by your school. You'll see your school's logo and name on the login page.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                Create Account (If New)
              </h3>
              <p className="text-sm text-gray-700 ml-8">
                If you don't have an account yet, click "Create Account" on your school's login page.
              </p>
            </div>
          </div>

          {/* Contact School */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Don't have your school's login link?
            </p>
            <p className="text-sm text-orange-800 mb-3">
              Please contact your school administrator to receive your unique parent login link.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-orange-800">
                <Phone className="w-4 h-4" />
                <span>Call your school's main office</span>
              </div>
              <div className="flex items-center gap-2 text-orange-800">
                <Mail className="w-4 h-4" />
                <span>Email your school administrator</span>
              </div>
            </div>
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

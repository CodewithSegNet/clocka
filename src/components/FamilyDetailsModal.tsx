import React from 'react';
import { X, Mail, Briefcase, MapPin, Users, Phone } from 'lucide-react';
import { Parent, Student } from '@/contexts/DataContext';

interface FamilyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: Parent[];
  children: Student[];
}

export default function FamilyDetailsModal({ isOpen, onClose, family, children }: FamilyDetailsModalProps) {
  if (!isOpen) return null;

  const father = family.find(p => p.type === 'father');
  const mother = family.find(p => p.type === 'mother');

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
          className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Family Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                {children.length} {children.length === 1 ? 'Child' : 'Children'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Parents Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Parents Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {father && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={father.photo}
                        alt={father.name}
                        className="w-16 h-16 rounded-full bg-gray-200 object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{father.name}</p>
                        <p className="text-sm text-blue-600">👨 Father</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">ID: {father.parentId}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Occupation</p>
                          <p className="text-gray-900 font-medium">{father.occupation}</p>
                        </div>
                      </div>
                      {father.phoneNumber && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="text-gray-900 font-medium">{father.phoneNumber}</p>
                          </div>
                        </div>
                      )}
                      {father.email && (
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="text-gray-900 font-medium">{father.email}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Address</p>
                          <p className="text-gray-900 font-medium">{father.residentialAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {mother && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img
                        src={mother.photo}
                        alt={mother.name}
                        className="w-16 h-16 rounded-full bg-gray-200 object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{mother.name}</p>
                        <p className="text-sm text-pink-600">👩 Mother</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">ID: {mother.parentId}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Occupation</p>
                          <p className="text-gray-900 font-medium">{mother.occupation}</p>
                        </div>
                      </div>
                      {mother.phoneNumber && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="text-gray-900 font-medium">{mother.phoneNumber}</p>
                          </div>
                        </div>
                      )}
                      {mother.email && (
                        <div className="flex items-start gap-2">
                          <Mail className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="text-gray-900 font-medium">{mother.email}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">Address</p>
                          <p className="text-gray-900 font-medium">{mother.residentialAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Children Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Children ({children.length})
              </h3>
              <div className="grid gap-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-4"
                  >
                    <img
                      src={child.image}
                      alt={child.name}
                      className="w-14 h-14 rounded-full bg-gray-200 object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{child.name}</p>
                      <p className="text-sm text-gray-600">
                        {child.class} • Age {child.age} • {child.gender}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Credentials */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Login Credentials</h3>
              <div className="space-y-1 text-sm text-yellow-800">
                {father && (
                  <p>• Father ({father.name}): Password managed by parent</p>
                )}
                {mother && (
                  <p>• Mother ({mother.name}): Password managed by parent</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
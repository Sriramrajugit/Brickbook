'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { validatePasswordStrength } from '@/lib/formatters';
import { useRouter } from 'next/navigation';

interface Company {
  id: number;
  name: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Password change form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<any>(null);

  // Fetch company details
  useEffect(() => {
    if (!user?.companyId) return;

    const fetchCompany = async () => {
      try {
        if (!user.companyId) return;
        
        const cachedCompanyName = localStorage.getItem(`company_${user.companyId}`);
        if (cachedCompanyName) {
          setCompany({ id: user.companyId, name: cachedCompanyName });
          setLoading(false);
          return;
        }

        const res = await fetch('/api/companies');
        if (res.ok) {
          const companies = await res.json();
          const comp = companies.find((c: any) => c.id === user.companyId);
          if (comp) {
            setCompany(comp);
            localStorage.setItem(`company_${user.companyId}`, comp.name);
          }
        }
      } catch (err) {
        console.error('Error fetching company:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [user?.companyId]);

  // Validate password strength as user types
  useEffect(() => {
    if (newPassword) {
      setPasswordValidation(validatePasswordStrength(newPassword));
    } else {
      setPasswordValidation(null);
    }
  }, [newPassword]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    // Check password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      setPasswordError(validation.errors.join('. '));
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        setPasswordError(error.error || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      
      // Auto-logout after 2 seconds
      setTimeout(async () => {
        await logout();
      }, 2000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError('Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl">
                👤
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">{user?.name || user?.email}</h1>
                <p className="text-blue-100">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-8 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Company</label>
                <p className="text-lg text-gray-900 font-semibold">{company?.name || 'Loading...'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Role</label>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                    user?.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                    user?.role === 'SITE_MANAGER' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.role || 'N/A'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>
              {user?.siteId && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Assigned Site</label>
                  <p className="text-lg text-gray-900">Site #{user.siteId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Password Change Section */}
          <div className="px-6 py-8">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </button>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
                
                {passwordSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {passwordSuccess}
                  </div>
                )}

                {passwordError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    
                    {/* Password Strength Indicator */}
                    {passwordValidation && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                              newPassword.length >= 8 ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {newPassword.length >= 8 ? '✓' : '○'}
                            </span>
                            <span className={newPassword.length >= 8 ? 'text-green-700' : 'text-gray-600'}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                              /[A-Z]/.test(newPassword) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {/[A-Z]/.test(newPassword) ? '✓' : '○'}
                            </span>
                            <span className={/[A-Z]/.test(newPassword) ? 'text-green-700' : 'text-gray-600'}>
                              One uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                              /[0-9]/.test(newPassword) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {/[0-9]/.test(newPassword) ? '✓' : '○'}
                            </span>
                            <span className={/[0-9]/.test(newPassword) ? 'text-green-700' : 'text-gray-600'}>
                              One number
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                              /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? '✓' : '○'}
                            </span>
                            <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'text-green-700' : 'text-gray-600'}>
                              One special character (!@#$%^&* etc)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                    )}
                    {newPassword && confirmPassword && newPassword === confirmPassword && (
                      <p className="mt-2 text-sm text-green-600">Passwords match</p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={savingPassword || !passwordValidation?.isValid || newPassword !== confirmPassword}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {savingPassword ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Change Password'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                        setPasswordSuccess('');
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

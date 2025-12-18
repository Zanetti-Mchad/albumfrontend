'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FiUser, FiMail, FiPhone, FiLock, FiCamera, FiSave, FiX } from 'react-icons/fi';
import DialogBox from '@/components/dialogbox';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  role: string;
  relationship: string;
  birthOrder: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [resetVia, setResetVia] = useState<'email' | 'phone'>('email');
  const [resetStep, setResetStep] = useState<'request' | 'otp' | 'password'>('request');

  const [formData, setFormData] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    photo: '',
    role: 'user',
    relationship: '',
    birthOrder: 'N/A',
  });

  const [passwords, setPasswords] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const relationshipOptions = [
    'Father',
    'Mother',
    'Grandfather',
    'Grandmother',
    'Brother',
    'Sister',
    'Son',
    'Daughter',
    'Uncle',
    'Aunt',
    'Nephew',
    'Niece',
    'Cousin'
  ];

  const birthOrderOptions = [
    'N/A',
    '1st Born',
    '2nd Born',
    '3rd Born',
    '4th Born',
    '5th Born',
    '6th Born'
  ];

  const handlePhotoFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, photo: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async (file: File) => {
    // Mirror Cloudinary direct upload used in settings page
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setDialogMessage('Please upload a valid image file (JPEG, PNG, or WebP)');
      setShowDialog(true);
      return;
    }

    if (file.size > maxSize) {
      setDialogMessage('Image size should be less than 5MB');
      setShowDialog(true);
      return;
    }

    const cloudinaryConfig = {
      cloudName: 'duewutucc',
      apiKey: '386283264593581',
      uploadPreset: 'family_album'
    } as const;

    try {
      setIsUploadingPhoto(true);

      const { cloudName, apiKey, uploadPreset } = cloudinaryConfig;
      if (!cloudName || !apiKey) {
        throw new Error('Cloudinary configuration is missing');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('cloud_name', cloudName);
      formData.append('api_key', apiKey);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.error?.message || 'Failed to upload image';
        throw new Error(errorMsg);
      }

      if (!data.secure_url) {
        throw new Error('No image URL returned from Cloudinary');
      }

      setFormData(prev => ({ ...prev, photo: data.secure_url }));
      setDialogMessage('Photo uploaded successfully!');
      setShowDialog(true);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setDialogMessage(
        error instanceof Error ? `Upload failed: ${error.message}` : 'Failed to upload photo. Please try again.'
      );
      setShowDialog(true);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  useEffect(() => {

    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        console.log('Fetching user profile...');
        const response = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('Profile response status:', response.status);
        
        if (response.status === 401) {
          setDialogMessage('Your session may have expired. Please refresh or log in again.');
          setShowDialog(true);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch user profile');
        }

        const responseData = await response.json();
        console.log('Profile data:', responseData);
        
        // Adjust this based on your actual API response structure
        const userData = responseData.data?.user || responseData.user || responseData.data || responseData;
        
        if (!userData) {
          throw new Error('Invalid user data received');
        }

        setFormData({
          id: userData.id || '',
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User',
          email: userData.email || '',
          phone: userData.phone || '',
          photo: userData.photo || userData.avatar || '',
          role: userData.role || 'user',
          relationship: userData.relationship || '',
          birthOrder: userData.birthOrder || 'N/A',
        });
        // Initialize delivery preference
        if (userData.email) {
          setResetVia('email');
        } else if (userData.phone) {
          setResetVia('phone');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setDialogMessage(
          error instanceof Error 
            ? `Error: ${error.message}` 
            : 'Failed to load profile. Please log in again.'
        );
        setShowDialog(true);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setDialogMessage('Your session has expired. Please log in again.');
      setShowDialog(true);
      router.push('/login');
      return;
    }

    try {
      console.log('Updating profile...');
      const response = await fetch(`${API_BASE}/auth/update-user`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' '),
          phone: formData.phone,
          relationship: formData.relationship,
          birthOrder: formData.birthOrder,
          photo: formData.photo
        })
      });

      console.log('Update profile response status:', response.status);
      
      if (response.status === 401) {
        setDialogMessage('Unable to save: your session may have expired. Please log in again.');
        setShowDialog(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update profile error:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await response.json();
      console.log('Update profile success:', result);

      setDialogMessage('Profile updated successfully!');
      setShowDialog(true);
      setIsEditing(false);
      
      // Refresh the profile data
      const userData = result.data?.user || result.user || result.data || result;
      if (userData) {
        setFormData(prev => ({
          ...prev,
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || prev.name,
          phone: userData.phone || prev.phone,
          relationship: userData.relationship || prev.relationship,
          birthOrder: userData.birthOrder || prev.birthOrder,
          photo: userData.photo || userData.avatar || prev.photo
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setDialogMessage(
        error instanceof Error 
          ? `Error: ${error.message}` 
          : 'Failed to update profile. Please try again.'
      );
      setShowDialog(true);
    }
  };

  const handleSendOtp = async () => {
    try {
      const identifier = resetVia === 'email' ? formData.email : formData.phone;
      if (!identifier) {
        setDialogMessage('No email or phone on your profile to send OTP.');
        setShowDialog(true);
        return;
      }

      const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.status?.returnMessage || data?.message || 'Failed to initiate password reset');
      }

      const delivery = data?.data?.delivery || (resetVia === 'email' ? 'email' : 'sms');
      const expiry = typeof data?.data?.expiresInSeconds === 'number' ? data.data.expiresInSeconds : 300;
      setDialogMessage(`OTP sent via ${delivery}. Expires in ${Math.ceil(expiry / 60)} min.`);
      setShowDialog(true);

      const possibleOtp = data?.data?.otp || data?.data?.token || data?.otp || data?.token;
      if (possibleOtp) {
        console.log('Received OTP from backend (dev only):', possibleOtp);
      }

      setResetStep('otp');
    } catch (error) {
      setDialogMessage(error instanceof Error ? error.message : 'Password update failed');
      setShowDialog(true);
    }
  };

  const handleProceedToPasswords = () => {
    if (!passwords.current || passwords.current.length !== 6) {
      setDialogMessage('Enter the 6-digit OTP.');
      setShowDialog(true);
      return;
    }
    setResetStep('password');
  };

  const handleResetPassword = async () => {
    try {
      if (!passwords.next || !passwords.confirm) {
        setDialogMessage('Enter new password and confirmation.');
        setShowDialog(true);
        return;
      }
      if (passwords.next !== passwords.confirm) {
        setDialogMessage('New password and confirmation do not match.');
        setShowDialog(true);
        return;
      }
      if (!passwords.current || passwords.current.length !== 6) {
        setDialogMessage('OTP must be 6 digits.');
        setShowDialog(true);
        return;
      }

      const identifier = resetVia === 'email' ? formData.email : formData.phone;
      const resetResponse = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: passwords.current,
          newPassword: passwords.next,
          ...(identifier ? { identifier } : {}),
        }),
      });
      const resetData = await resetResponse.json().catch(() => ({}));
      if (!resetResponse.ok) {
        throw new Error(resetData?.status?.returnMessage || resetData?.message || 'Failed to reset password');
      }

      setDialogMessage('Password changed successfully.');
      setShowDialog(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setResetStep('request');
    } catch (error) {
      setDialogMessage(error instanceof Error ? error.message : 'Password update failed');
      setShowDialog(true);
    }
  };

  // (deprecated) handleChangePassword was replaced by step-specific handlers

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            {formData.photo ? (
              <Image 
                src={formData.photo} 
                alt={formData.name} 
                width={48} 
                height={48} 
                className="rounded-xl object-cover w-full h-full"
              />
            ) : (
              <FiUser className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your personal information and security</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <FiSave className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiX className="w-4 h-4" />
                Cancel
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Avatar + Basic Info */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="relative">
            {formData.photo ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100">
                <Image src={formData.photo} alt={formData.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-4 ring-gray-100 text-2xl font-bold">
                {formData.name.charAt(0).toUpperCase()}
              </div>
            )}
            <label className={`absolute -bottom-2 -right-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-medium ${isUploadingPhoto ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
              <FiCamera className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">{isUploadingPhoto ? 'Uploading...' : 'Change'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingPhoto}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePhotoFile(file);
                    handlePhotoUpload(file);
                  }
                }}
              />
            </label>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <div className="relative">
                <FiUser className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                  className={`w-full pl-9 pr-4 py-3 rounded-xl ${
                    isEditing 
                      ? 'border-2 border-indigo-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="Your name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <div className="relative">
                <FiPhone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  readOnly={!isEditing}
                  disabled={!isEditing}
                  className={`w-full pl-9 pr-4 py-3 rounded-xl ${
                    isEditing 
                      ? 'border-2 border-indigo-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
                      : 'bg-gray-50 border-2 border-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <input
                type="text"
                value={formData.role}
                readOnly
                disabled
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                placeholder="User role"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl ${
                  isEditing 
                    ? 'border-2 border-indigo-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {relationshipOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Birth Order</label>
              <select
                value={formData.birthOrder}
                onChange={(e) => setFormData({...formData, birthOrder: e.target.value})}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl ${
                  isEditing 
                    ? 'border-2 border-indigo-200 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500' 
                    : 'bg-gray-50 border-2 border-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {birthOrderOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            
          </div>
        </div>

        {/* Read-only mode: hide Save Changes button */}
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <FiLock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
        </div>

        {/* OTP delivery preference */}
        {(formData.email || formData.phone) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.email && formData.phone ? (
              <div className="col-span-1 md:col-span-2">
                <p className="text-sm text-gray-700 font-semibold mb-2">Send OTP via</p>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="otpDelivery"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      checked={resetVia === 'email'}
                      onChange={() => setResetVia('email')}
                    />
                    <span className="text-sm text-gray-700">Email ({formData.email})</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="otpDelivery"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      checked={resetVia === 'phone'}
                      onChange={() => setResetVia('phone')}
                    />
                    <span className="text-sm text-gray-700">SMS ({formData.phone})</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="col-span-1 md:col-span-2">
                <p className="text-sm text-gray-600">
                  OTP will be sent to {formData.email ? `email (${formData.email})` : `phone (${formData.phone})`}.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resetStep === 'request' && (
            <div className="md:col-span-3 flex justify-start">
              <button
                onClick={handleSendOtp}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
              >
                Send OTP
              </button>
            </div>
          )}

          {resetStep === 'otp' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="6-digit code"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleProceedToPasswords}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {resetStep === 'password' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="md:col-span-1 flex items-end justify-start">
                <button
                  onClick={handleResetPassword}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
                >
                  Update Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <DialogBox
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="Success!"
        message={dialogMessage}
        type="success"
      />
    </div>
  );
}
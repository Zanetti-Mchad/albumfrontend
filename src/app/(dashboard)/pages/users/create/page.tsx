'use client';

import { useState, useRef } from 'react';
import { FiUserPlus, FiLoader } from 'react-icons/fi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DialogBox from '@/components/dialogbox';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://albumbackend-production-7eed.up.railway.app/api/v1';

export default function CreateMemberPage() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloudinary configuration
  const cloudinaryConfig = {
    cloudName: 'duewutucc',
    apiKey: '386283264593581',
    uploadPreset: 'family_album'
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'member',
    // Additional family member fields
    relationship: '',
    birthOrder: '',
    dateOfBirth: '',
    photo: ''
  });

  const handlePhotoFile = async (file?: File) => {
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setDialogMessage('Please upload a valid image file (JPEG, PNG, or WebP)');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    if (file.size > maxSize) {
      setDialogMessage('Image size should be less than 5MB');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    try {
      setIsUploading(true);
      
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
      setIsError(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      setDialogMessage(
        error instanceof Error 
          ? `Upload failed: ${error.message}` 
          : 'Failed to upload image. Please try again.'
      );
      setIsError(true);
      setShowDialog(true);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

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

  const handleAddMember = async () => {
    if (!formData.firstName || !formData.lastName || !formData.relationship) {
      setDialogMessage('Name and relationship are required');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    if (isUploading) {
      setDialogMessage('Please wait for the photo to finish uploading');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Prepare the data to send to the registration API
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phoneNumber, // <-- FIXED to match backend key
        role: formData.role
      };

      // Additional family member data (to be saved after registration)
      const familyMemberData = {
        relationship: formData.relationship,
        birthOrder: formData.birthOrder,
        dateOfBirth: formData.dateOfBirth,
        photo: formData.photo
      };

      // 1. First register the user
      const registerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      let registerData;
      try {
        registerData = await registerResponse.json();
      } catch {
        const text = await registerResponse.text();
        console.error('Non-JSON response from server:', text);
        setDialogMessage('Registration failed: Server response was not valid JSON.');
        setIsError(true);
        setShowDialog(true);
        return;
      }

      if (!registerResponse.ok) {
        console.error('Registration API FAILED:', registerData);
        throw new Error(registerData.message || 'Failed to register user');
      }
      console.log('Registration API successful:', registerData);

      // 2. If registration is successful, save additional family member data
      const memberResponse = await fetch(`${API_BASE}/integration/family-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: registerData.data.user.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          ...familyMemberData
        })
      });

      let memberResponseData;
      const contentType = memberResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        memberResponseData = await memberResponse.json();
      } else {
        const text = await memberResponse.text();
        throw new Error('Unexpected server response: ' + text);
      }

      if (!memberResponse.ok) {
        console.error('Family member API FAILED:', memberResponseData);
        throw new Error(memberResponseData.message || 'Failed to save family member details');
      }
      console.log('Family member API successful:', memberResponseData);

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: 'member',
        relationship: '',
        birthOrder: '',
        dateOfBirth: '',
        photo: ''
      });

      setDialogMessage('Family member added successfully!');
      setIsError(false);
      setShowDialog(true);
      
      // Redirect to view page after 2 seconds
      setTimeout(() => {
        router.push('/pages/users/view');
      }, 2000);
    } catch (error) {
      console.error('Error saving family member:', error);
      setDialogMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to save family member. Please try again.'
      );
      setIsError(true);
      setShowDialog(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <FiUserPlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Family Member</h1>
          <p className="text-gray-600">Create a new member in your family tree</p>
        </div>
      </div>

      {/* Add Member Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Add New Family Member</h2>
          {/* Photo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Photo</label>
            <div className="flex items-center gap-6">
              {formData.photo ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-100">
                  <Image src={formData.photo} alt={`${formData.firstName} ${formData.lastName}` || 'Member photo'} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-4 ring-gray-100 text-lg font-bold">
                  {`${formData.firstName?.charAt(0) || ''}${formData.lastName?.charAt(0) || ''}` || 'FM'}
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Choose Photo'
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                placeholder="Enter last name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="">Select relationship</option>
                {relationshipOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="Enter email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="Enter password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              required
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Birth Order
              </label>
              <select
                value={formData.birthOrder}
                onChange={(e) => setFormData({ ...formData, birthOrder: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              >
                {birthOrderOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => router.push('/pages/users/view')}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMember}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Add Member
            </button>
          </div>
        </div>

      {/* Success Dialog */}
      <DialogBox
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={isError ? 'Error' : 'Success'}
        message={dialogMessage}
        type={isError ? 'error' : 'success'}
      />
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { FiUsers, FiCamera, FiLoader } from 'react-icons/fi';
import Image from 'next/image';
import DialogBox from '@/components/dialogbox';

// Endpoint constants and types
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';
const ENDPOINTS = {
  putFamily: `${API_BASE}/settings/family`,
  getFamily: `${API_BASE}/settings/family`,
  getFamilyPublic: `${API_BASE}/settings/family/public`,
};

type FamilyProfile = {
  id?: string;
  familyName: string;
  familyBio: string;
  familyPhoto: string;
  updatedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ApiStatus = {
  returnCode: number;
  returnMessage: string;
};

type ApiResponse<T> = {
  status: ApiStatus;
  data: T;
};

export default function FamilySettings() {
  const [familyName, setFamilyName] = useState('');
  const [familyBio, setFamilyBio] = useState('');
  const [familyPhoto, setFamilyPhoto] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloudinary configuration
  const cloudinaryConfig = {
    cloudName: 'duewutucc',
    apiKey: '386283264593581',
    uploadPreset: 'family_album'
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      // Add folder if needed
      // formData.append('folder', 'family_photos');

      console.log('Uploading image to Cloudinary...', { 
        cloudName,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type
      });

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Cloudinary response:', data);

      if (!response.ok) {
        const errorMsg = data.error?.message || 'Failed to upload image';
        console.error('Cloudinary upload error:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.secure_url) {
        throw new Error('No image URL returned from Cloudinary');
      }

      setFamilyPhoto(data.secure_url);
      setDialogMessage('Image uploaded successfully!');
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

  // Fetch family data on component mount
  useEffect(() => {
    const fetchFamilyData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setDialogMessage('Please log in to view family settings');
        setShowDialog(true);
        setIsError(true);
        return;
      }

      try {
        const response = await fetch(ENDPOINTS.getFamily, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          setDialogMessage('Your session has expired. Please log in again.');
          setShowDialog(true);
          setIsError(true);
          return;
        }
        
        const data: ApiResponse<FamilyProfile> = await response.json();
        
        if (response.ok) {
          setFamilyName(data.data?.familyName || '');
          setFamilyBio(data.data?.familyBio || '');
          setFamilyPhoto(data.data?.familyPhoto || '');
        } else {
          throw new Error(data.status?.returnMessage || 'Failed to fetch family data');
        }
      } catch (error) {
        console.error('Error fetching family data:', error);
        setDialogMessage(
          error instanceof Error ? error.message : 'Failed to load family data'
        );
        setShowDialog(true);
        setIsError(true);
      }
    };

    fetchFamilyData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      setDialogMessage('Please log in to update family settings');
      setShowDialog(true);
      setIsError(true);
      return;
    }
    
    if (isUploading) {
      setDialogMessage('Please wait for the image to finish uploading');
      setShowDialog(true);
      setIsError(true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (!familyName?.trim() || !familyBio?.trim()) {
        throw new Error('familyName and familyBio are required');
      }

      if (!familyPhoto) {
        throw new Error('Please upload a family photo');
      }
      
      // Log the data being sent to the backend
      console.log('Sending to backend:', {
        familyName,
        familyBio,
        familyPhoto: familyPhoto ? 'URL present' : 'No photo'
      });
      
      // Send the update request to our API
      const response = await fetch(ENDPOINTS.putFamily, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          familyName,
          familyBio,
          familyPhoto
        } satisfies FamilyProfile),
      });

      const data: ApiResponse<FamilyProfile> = await response.json();
      console.log('Backend response:', data);

      if (response.status === 401) {
        localStorage.removeItem('token');
        setDialogMessage('Your session has expired. Please log in again.');
        setShowDialog(true);
        setIsError(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.status?.returnMessage || 'Failed to update family profile');
      }

      setDialogMessage(data.status?.returnMessage || 'Family profile updated successfully!');
      setShowDialog(true);
      setIsError(false);
    } catch (error) {
      console.error('Error updating family profile:', error);
      setDialogMessage(
        error instanceof Error ? error.message : 'Failed to update family profile. Please try again.'
      );
      setShowDialog(true);
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-5xl mx-auto p-8">
      <DialogBox
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={isError ? 'Error' : 'Success'}
        message={dialogMessage}
        type={isError ? 'error' : 'success'}
      />
      {/* Family Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <FiUsers className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Family Profile</h2>
              <p className="text-sm text-gray-600">Update your family&apos;s profile information</p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8 space-y-8">
          {/* Family Photo Upload */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Family Photo
              </label>
              <div className="relative group">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {familyPhoto ? (
                    <Image
                      src={familyPhoto}
                      alt="Family Photo"
                      fill
                      sizes="(max-width: 768px) 100vw, 128px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <FiUsers className="text-gray-400" size={40} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? <FiLoader className="animate-spin" /> : <FiCamera size={20} />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 pt-8">
              <p className="text-xs text-gray-500 mt-3">Recommended: Square image, at least 400x400px</p>
            </div>
          </div>

          {/* Family Name */}
          <div>
            <label htmlFor="familyName" className="block text-sm font-semibold text-gray-700 mb-2">
              Family Name
            </label>
            <input
              type="text"
              id="familyName"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 font-medium placeholder-gray-400"
              placeholder="Enter your family name"
            />
          </div>
          
          {/* Family Bio */}
          <div>
            <label htmlFor="familyBio" className="block text-sm font-semibold text-gray-700 mb-2">
              Family Bio
            </label>
            <textarea
              id="familyBio"
              rows={4}
              value={familyBio}
              onChange={(e) => setFamilyBio(e.target.value)}
              className="w-full px-5 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-gray-900 resize-none placeholder-gray-400"
              placeholder="Tell us about your family..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center"
            disabled={isSaving || isUploading}
          >
            {isSaving ? (
              <>
                <FiLoader className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
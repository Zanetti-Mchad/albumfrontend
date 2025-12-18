'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUpload, FiX, FiPlus, FiVideo, FiStar } from 'react-icons/fi';
import Image from 'next/image';

type MediaFile = {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  isCover: boolean;
};

export default function CreateAlbum() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

  // Client-side upload to Cloudinary; backend will receive URLs (JSON)
  const uploadToCloudinary = useCallback(async (file: File, type: 'image' | 'video') => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'duewutucc';
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '386283264593581';
    const uploadPreset = 'family_album';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);
    formData.append('api_key', apiKey);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
    const res = await fetch(endpoint, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      throw new Error(data?.error?.message || 'Failed to upload file');
    }
    return data.secure_url as string;
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
      isCover: false
    }));

    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles, ...newFiles];
      // If this is the first file, set it as cover by default
      if (prevFiles.length === 0 && newFiles.length > 0) {
        updatedFiles[0].isCover = true;
      }
      return updatedFiles;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prevFiles => {
      const newFiles = prevFiles.filter(file => file.id !== id);
      // If we removed the cover and there are still files left, set a new cover
      if (newFiles.length > 0 && !newFiles.some(f => f.isCover)) {
        newFiles[0].isCover = true;
      }
      return newFiles;
    });
  }, []);

  const setAsCover = useCallback((id: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => ({
        ...file,
        isCover: file.id === id
      }))
    );
  }, []);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [files]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Album title is required');
      return;
    }

    if (files.length === 0) {
      setError('Please add at least one photo or video');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1) Upload all files to Cloudinary and collect URLs
      const uploaded = await Promise.all(
        files.map(async (f) => {
          const url = await uploadToCloudinary(f.file, f.type);
          return {
            url,
            type: f.type,
            // Basic client-side metadata; backend can refine
            thumbnail: f.type === 'image' ? url : null,
            size: f.file.size,
            mimeType: f.file.type,
            isCover: f.isCover,
          };
        })
      );

      const cover = uploaded.find(u => u.isCover) || uploaded[0];

      // 2) Send JSON payload with URLs to backend
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const endpoint = `${API_BASE}/albums`;
      const payload = {
        title,
        description,
        isPublic: true,
        cover: cover?.url || null,
        media: uploaded.map(({ url, type, thumbnail, size, mimeType }) => ({ url, type, thumbnail, size, mimeType })),
      };

      console.log('Creating album (URL mode) →', { endpoint, method: 'POST', payload });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));
      console.log('Create album response ←', { status: response.status, ok: response.ok, data: json });

      if (!response.ok) {
        const data = json;
        throw new Error(data?.status?.returnMessage || data?.message || 'Failed to create album');
      }

      router.push('/pages/albums/view');
    } catch (err) {
      setError('Failed to create album. Please try again.');
      console.error('Error creating album:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create New Album</h1>
        <p className="text-gray-600">Fill in the details below to create a new photo album</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Media Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Photos & Videos
          </label>
          
          {/* Media Grid */}
          {files.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                    <div className="aspect-square bg-gray-100 relative">
                      {file.type === 'image' ? (
                        <Image
                          src={file.preview}
                          alt={file.file.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <FiVideo className="text-white text-2xl" />
                        </div>
                      )}
                      
                      {/* Cover Badge */}
                      {file.isCover && (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                          <FiStar className="mr-1" size={10} />
                          Cover
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAsCover(file.id);
                          }}
                          className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                          title="Set as cover"
                        >
                          <FiStar className={file.isCover ? 'text-yellow-500' : 'text-gray-700'} size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                          title="Remove file"
                        >
                          <FiX className="text-red-500" size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Upload Area */}
          <div className="mt-1">
            <label
              htmlFor="media-upload"
              className="cursor-pointer flex flex-col items-center px-6 py-10 bg-white text-gray-400 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:text-blue-500 transition-colors w-full"
            >
              <FiUpload className="w-12 h-12 mb-2" />
              <p className="text-sm text-center">
                Click to upload or drag and drop<br />
                <span className="text-xs text-gray-500">
                  Supports JPG, PNG, MP4 up to 100MB
                </span>
              </p>
              <input
                id="media-upload"
                name="media-upload"
                type="file"
                className="sr-only"
                accept="image/*,video/*"
                onChange={handleFileChange}
                multiple
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
              {files.some(f => f.isCover) && ' • Click on a file to set it as cover'}
            </p>
          </div>
        </div>

        {/* Album Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Album Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            placeholder="Enter album title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
            placeholder="Add a brief description of this album"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              'Creating...'
            ) : (
              <>
                <FiPlus className="mr-2 h-4 w-4" />
                Create Album
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
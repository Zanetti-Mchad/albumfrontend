'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import Image from 'next/image';
import DialogBox from '@/components/dialogbox';

type ApiMedia = {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string | null;
};

type ApiAlbum = {
  id: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  createdAt?: string;
  photoCount?: number;
  media: ApiMedia[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4210/api/v1';

export default function DeleteAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = String(params.id);
  const [album, setAlbum] = useState<ApiAlbum | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const fetchAlbum = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE}/albums/${albumId}`, {
          headers: {
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.status?.returnMessage || json?.message || 'Failed to load album');
        }
        const dataAlbum: ApiAlbum | undefined = json?.data?.album || json?.album;
        if (!dataAlbum) throw new Error('Album not found');
        setAlbum(dataAlbum);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load album');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbum();
  }, [albumId]);

  const imageCount = useMemo(() => (album?.media || []).filter(m => m.type === 'image').length, [album]);
  const videoCount = useMemo(() => (album?.media || []).filter(m => m.type === 'video').length, [album]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/albums/${albumId}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setIsDialogOpen(true);
      } else {
        const json = await res.json().catch(() => ({}));
        const msg = json?.status?.returnMessage || json?.message || 'Failed to delete album';
        setErrorMessage(msg);
        setIsErrorDialogOpen(true);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading album...</p>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">{error || 'Album not found'}</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DialogBox
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); router.push('/pages/albums/delete'); }}
        title="Deleted"
        message="Album deleted successfully."
        type="success"
        mode="alert"
      />
      <DialogBox
        isOpen={isErrorDialogOpen}
        onClose={() => setIsErrorDialogOpen(false)}
        title="Delete failed"
        message={errorMessage || 'We could not delete this album. Please try again.'}
        type="error"
        mode="alert"
      />
      <div className="mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Album
        </button>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-red-100">
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FiAlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Delete Album</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete the album <span className="font-semibold">&quot;{album.title}&quot;</span>? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row-reverse space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Album'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isDeleting}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Album Preview */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-3">Album Preview</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Image
                  src={album.cover || '/next.svg'}
                  alt={album.title}
                  width={80}
                  height={60}
                  className="h-15 w-20 rounded-md object-cover"
                />
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900">{album.title}</h5>
                <p className="text-sm text-gray-500">
                  {imageCount} photos • {videoCount} videos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

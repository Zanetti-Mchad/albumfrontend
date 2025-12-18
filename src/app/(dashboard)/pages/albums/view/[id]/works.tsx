'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiClock, FiImage, FiVideo, FiShare2, FiMoreVertical } from 'react-icons/fi';
import Image from 'next/image';
import PhotoModal from '@/components/PhotoModal';

type ApiMedia = {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string | null;
  size?: number;
  mimeType?: string;
  createdAt?: string;
};

type ApiAlbum = {
  id: string;
  title: string;
  description?: string | null;
  cover?: string | null;
  createdAt?: string;
  photoCount?: number;
  media: ApiMedia[];
  user?: { firstName?: string; lastName?: string; photo?: string | null };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4210/api/v1';

export default function AlbumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = String(params.id);
  const [album, setAlbum] = useState<ApiAlbum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
        if (!dataAlbum) {
          throw new Error('Album not found');
        }
        setAlbum(dataAlbum);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load album');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbum();
  }, [albumId]);

  const videoCount = useMemo(() => (album?.media || []).filter(m => m.type === 'video').length, [album]);

  const modalItems = useMemo(() => {
    const items = (album?.media || []).map((m, idx) => ({
      id: idx,
      url: m.url,
      caption: album?.title || '',
      type: m.type,
      thumbnail: m.thumbnail || undefined,
      likes: 0,
      isLiked: false,
      comments: [],
      uploadedBy: `${album?.user?.firstName || ''} ${album?.user?.lastName || ''}`.trim() || undefined,
      uploaderAvatar: album?.user?.photo || undefined,
    }));
    return items;
  }, [album]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <FiArrowLeft className="mr-2" />
            Back to Albums
          </button>
          
          <div className="flex space-x-3">
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <FiShare2 size={20} />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <FiMoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Album Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/4">
              <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={album.cover || '/next.svg'}
                  alt={album.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{album.title}</h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-500">
                    <FiHeart className="mr-1" />
                    <span>0</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FiMessageCircle className="mr-1" />
                    <span>0</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Image
                    src={album.user?.photo || '/next.svg'}
                    alt={(album.user?.firstName || '') + ' ' + (album.user?.lastName || '')}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="font-medium text-gray-700">{`${album.user?.firstName || ''} ${album.user?.lastName || ''}`.trim() || 'Unknown'}</span>
                </div>
                <span className="mx-2 text-gray-300">•</span>
                <FiClock className="mr-1" size={14} />
                <span>{album.createdAt ? formatDate(album.createdAt) : ''}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <div className="flex items-center mr-4">
                  <FiImage className="mr-1" size={16} />
                  <span>{typeof album.photoCount === 'number' ? album.photoCount : (album.media || []).filter(m => m.type === 'image').length} photos</span>
                </div>
                {videoCount > 0 && (
                  <div className="flex items-center">
                    <FiVideo className="mr-1" size={16} />
                    <span>{videoCount} videos</span>
                  </div>
                )}
              </div>
              
              {/* Description */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 text-sm">
                  {album.description || 'No description available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {(album.media || []).map((item, idx) => (
          <div 
            key={item.id} 
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow duration-200"
            onClick={() => { setCurrentIndex(idx); setIsModalOpen(true); }}
          >
            {item.type === 'image' ? (
              <Image
                src={item.url}
                alt={album.title}
                fill
                className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={item.thumbnail || '/video-placeholder.jpg'}
                  alt={album.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                    <FiVideo className="text-gray-800 ml-1" size={24} />
                  </div>
                </div>
              </div>
            )}
            
            {/* Caption not provided by API; omit for now */}
          </div>
        ))}
      </div>

      {/* Lightbox modal for viewing photos and playing videos */}
      {isModalOpen && modalItems[currentIndex] && (
        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          media={modalItems[currentIndex]}
          onLike={() => {}}
          onAddComment={() => {}}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex < modalItems.length - 1}
          onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
          onNext={() => setCurrentIndex(i => Math.min(modalItems.length - 1, i + 1))}
        />
      )}
    </div>
  );
}

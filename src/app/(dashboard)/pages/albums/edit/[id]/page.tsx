'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiTrash2,
  FiShare2,
  FiMoreVertical,
  FiClock,
  FiImage,
  FiVideo,
  FiPlus,
  FiHeart,
  FiMessageCircle
} from 'react-icons/fi';
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
  user?: { firstName?: string; lastName?: string; photo?: string | null };
};

type MediaItem = {
  id: string;
  url: string;
  caption: string;
  type: 'image' | 'video';
  thumbnail?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4210/api/v1';

export default function EditAlbumPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = String(params.id);

  const [album, setAlbum] = useState<ApiAlbum | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);

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
        setTitle(dataAlbum.title || '');
        setDescription((dataAlbum.description as string) || '');
        setCoverImage(dataAlbum.cover || '/next.svg');
        const mappedMedia: MediaItem[] = (dataAlbum.media || []).map((m) => ({
          id: m.id,
          url: m.url,
          caption: '',
          type: m.type,
          thumbnail: m.thumbnail || undefined,
        }));
        setMediaItems(mappedMedia);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load album');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbum();
  }, [albumId]);

  // You can compute counts from mediaItems when needed

  // Aggregate likes/comments across media for header display
  useEffect(() => {
    const loadTotals = async () => {
      if (!album) return;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const ids = (album.media || []).map(m => m.id);
        const stats = await Promise.all(ids.map(async (mid) => {
          try {
            const [r, c] = await Promise.all([
              fetch(`${API_BASE}/albums/${album.id}/media/${mid}/reactions`, { headers }),
              fetch(`${API_BASE}/albums/${album.id}/media/${mid}/comments`, { headers }),
            ]);
            const [rj, cj] = await Promise.all([r.json().catch(() => ({})), c.json().catch(() => ({}))]);
            const likes = r.ok ? (rj?.data?.likes ?? 0) : 0;
            const comments = c.ok && Array.isArray(cj?.data?.comments) ? cj.data.comments.length : 0;
            return { likes, comments };
          } catch {
            return { likes: 0, comments: 0 };
          }
        }));
        setTotalLikes(stats.reduce((s, x) => s + (x.likes || 0), 0));
        setTotalComments(stats.reduce((s, x) => s + (x.comments || 0), 0));
      } catch {
        // ignore
      }
    };
    loadTotals();
  }, [album, album?.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
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
      <DialogBox
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); router.back(); }}
        title="Saved"
        message="Album updated successfully."
        type="success"
        mode="alert"
      />
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Album</h1>
          
          <div className="mb-6">
            <label htmlFor="album-title" className="block text-sm font-medium text-gray-700 mb-1">
              Album Title
            </label>
            <input
              type="text"
              id="album-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter album title"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="album-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="album-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a brief description of this album"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-32 h-24 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={coverImage}
                  alt="Album cover"
                  width={128}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Paste image URL or upload"
                />
                <p className="mt-1 text-xs text-gray-500">Enter a valid image URL or click to upload</p>
              </div>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <Image
                src={album.user?.photo || '/next.svg'}
                alt={`${album.user?.firstName || ''} ${album.user?.lastName || ''}`.trim() || 'User'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="font-medium text-gray-700">{`${album.user?.firstName || ''} ${album.user?.lastName || ''}`.trim() || 'Unknown'}</span>
            </div>
            <span className="mx-2 text-gray-300">•</span>
            <FiClock className="mr-1" size={14} />
            <span>Edited {formatDate(album.createdAt)}</span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center">
              <FiImage className="mr-1" size={16} />
              <span>{mediaItems.filter(item => item.type === 'image').length} photos</span>
            </div>
            <div className="flex items-center">
              <FiVideo className="mr-1" size={16} />
              <span>{mediaItems.filter(item => item.type === 'video').length} videos</span>
            </div>
            <div className="flex items-center">
              <FiHeart className="mr-1" size={16} />
              <span>{totalLikes}</span>
            </div>
            <div className="flex items-center">
              <FiMessageCircle className="mr-1" size={16} />
              <span>{totalComments}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  setIsSaving(true);
                  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                  const res = await fetch(`${API_BASE}/albums/${album.id}`, {
                    method: 'PUT',
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ title, description, cover: coverImage }),
                  });
                  if (res.ok) {
                    setIsDialogOpen(true);
                  }
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
      </div>

      {/* Media Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Media Items</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaItems.map((item) => (
            <div 
              key={item.id} 
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow duration-200"
            >
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={item.caption || 'Album media'}
                  fill
                  className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                />
              ) : (
                <div className="relative w-full h-full">
                  <Image
                    src={item.thumbnail || '/video-placeholder.jpg'}
                    alt={item.caption || 'Video thumbnail'}
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
              
              <div className="absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaItems(mediaItems.filter(i => i.id !== item.id));
                    }}
                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remove media"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
                
                <div>
                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => {
                      const updatedItems = mediaItems.map(i => 
                        i.id === item.id ? { ...i, caption: e.target.value } : i
                      );
                      setMediaItems(updatedItems);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full p-1.5 text-sm text-white bg-black/30 border border-white/20 rounded-md focus:outline-none focus:ring-1 focus:ring-white/50"
                    placeholder="Add caption"
                  />
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Media Button */}
          <div className="flex items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
            <div className="text-center p-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-2">
                <FiPlus className="h-6 w-6 text-gray-400" />
              </div>
              <span className="text-sm text-gray-500">Add media</span>
            </div>
          </div>
            </div>
        </div>
      </div>
    </div>
  );
}

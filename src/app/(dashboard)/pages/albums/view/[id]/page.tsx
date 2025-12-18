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
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  type ModalItem = {
    id: number;
    url: string;
    caption: string;
    type: 'image' | 'video';
    thumbnail?: string;
    likes: number;
    isLiked: boolean;
    comments: Array<{
      id: number;
      userId: number;
      text: string;
      timestamp: string;
      user: { name: string; avatar: string };
    }>;
    uploadedBy?: string;
    uploaderAvatar?: string;
  };
  const [modalItems, setModalItems] = useState<ModalItem[]>([]);

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

  useEffect(() => {
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
    setModalItems(items);
  }, [album]);

  const mediaIds = useMemo(() => (album?.media || []).map(m => m.id), [album]);

  // Aggregate likes and comments across all media for the header counters
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

  // Load reactions and comments for current media when modal opens or index changes
  useEffect(() => {
    const loadReactionsAndComments = async () => {
      if (!isModalOpen || !album || !mediaIds[currentIndex]) return;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const mediaId = mediaIds[currentIndex];
        const [reactionsRes, commentsRes] = await Promise.all([
          fetch(`${API_BASE}/albums/${album.id}/media/${mediaId}/reactions`, { headers }),
          fetch(`${API_BASE}/albums/${album.id}/media/${mediaId}/comments`, { headers }),
        ]);
        const reactionsJson = await reactionsRes.json().catch(() => ({}));
        const commentsJson = await commentsRes.json().catch(() => ({}));
        const likes = reactionsJson?.data?.likes ?? 0;
        const commentsList = Array.isArray(commentsJson?.data?.comments) ? commentsJson.data.comments : [];
        setModalItems(prev => prev.map((it, i) => i === currentIndex ? {
          ...it,
          likes,
          comments: commentsList.map((c: { content: string; createdAt: string; user?: { firstName?: string; lastName?: string; photo?: string } }, idx: number) => ({
            id: idx + 1,
            userId: 0,
            text: c.content,
            timestamp: c.createdAt,
            user: {
              name: `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || 'User',
              avatar: c.user?.photo || '/next.svg',
            },
          })),
        } : it));
      } catch {
        // ignore
      }
    };
    loadReactionsAndComments();
  }, [isModalOpen, currentIndex, album, mediaIds]);

  const handleToggleLike = async () => {
    if (!album) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const mediaId = mediaIds[currentIndex];
    const liked = modalItems[currentIndex]?.isLiked;
    try {
      const method = liked ? 'DELETE' : 'POST';
      await fetch(`${API_BASE}/albums/${album.id}/media/${mediaId}/like`, { method, headers });
      // Optimistic update
      setModalItems(prev => prev.map((it, i) => i === currentIndex ? {
        ...it,
        isLiked: !liked,
        likes: Math.max(0, (it.likes || 0) + (liked ? -1 : 1)),
      } : it));
    } catch {
      // ignore
    }
  };

  const handleAddComment = async (content: string) => {
    if (!album || !content.trim()) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const mediaId = mediaIds[currentIndex];
    // Optimistic append
    setModalItems(prev => prev.map((it, i) => i === currentIndex ? {
      ...it,
      comments: [
        ...it.comments,
        {
          id: (it.comments?.length || 0) + 1,
          userId: 0,
          text: content,
          timestamp: new Date().toISOString(),
          user: {
            name: 'You',
            avatar: '/next.svg',
          },
        },
      ],
    } : it));
    try {
      const res = await fetch(`${API_BASE}/albums/${album.id}/media/${mediaId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      });
      type CommentResponse = { data?: { comment?: { content?: string; createdAt?: string; user?: { firstName?: string; lastName?: string; photo?: string } } } };
      const json: CommentResponse = await res.json().catch(() => ({} as CommentResponse));
      if (!res.ok) return;
      const c = json?.data?.comment;
      // Replace the last comment (optimistic) with server-confirmed details
      setModalItems(prev => prev.map((it, i) => {
        if (i !== currentIndex) return it;
        const updated = [...it.comments];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            text: c?.content || content,
            timestamp: c?.createdAt || updated[lastIdx].timestamp,
            user: {
              name: `${c?.user?.firstName || ''} ${c?.user?.lastName || ''}`.trim() || updated[lastIdx].user.name,
              avatar: c?.user?.photo || updated[lastIdx].user.avatar,
            },
          };
        }
        return { ...it, comments: updated };
      }));
    } catch {
      // ignore
    }
  };

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
                    <span>{totalLikes}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FiMessageCircle className="mr-1" />
                    <span>{totalComments}</span>
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
          onLike={handleToggleLike}
          onAddComment={handleAddComment}
          hasPrev={currentIndex > 0}
          hasNext={currentIndex < modalItems.length - 1}
          onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
          onNext={() => setCurrentIndex(i => Math.min(modalItems.length - 1, i + 1))}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { FiClock, FiChevronLeft, FiChevronRight, FiMessageCircle } from 'react-icons/fi';
import PhotoModal from '@/components/PhotoModal';

// Reuse data structures and API shape from albums view pages
type ApiAlbum = {
  id: string;
  title: string;
  cover?: string | null;
  photoCount?: number;
  user?: { id?: string; firstName?: string; lastName?: string; photo?: string | null };
  createdAt?: string;
};

type ApiMedia = {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string | null;
  createdAt?: string;
};

type ApiAlbumDetail = ApiAlbum & {
  description?: string | null;
  media: ApiMedia[];
};

interface ModalMediaItem {
  id: number; // local index for modal navigation
  url: string;
  caption: string;
  type: 'image' | 'video';
  thumbnail?: string; // For video thumbnails
  likes: number;
  isLiked: boolean;
  comments: Array<{ id: number; userId: number; text: string; timestamp: string; user: { name: string; avatar: string } }>;
}

interface AlbumCardItem {
  id: string;
  title: string;
  cover: string;
  photoCount: number;
  videoCount: number;
  uploadedBy: string;
  uploaderAvatar?: string;
  uploadedDate: string;
  likes: number;
  comments: number;
}

interface SelectedAlbumForModal {
  id: string;
  title: string;
  uploadedBy: string;
  uploaderAvatar?: string;
  likes: number; // aggregated from media likes
  comments: number; // not aggregated here (left as-is)
  media: ModalMediaItem[];
  mediaIds: string[]; // to call like/comment endpoints
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

const Dashboard = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAlbum, setSelectedAlbum] = useState<SelectedAlbumForModal | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [albums, setAlbums] = useState<AlbumCardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Build slideshow from album covers
  const photos = useMemo(() => (
    albums.map((a, idx) => ({ id: idx + 1, url: a.cover, caption: a.title }))
  ), [albums]);

  // Get unique users from albums
  const users = useMemo(() => {
    const userSet = new Set(albums.map(album => album.uploadedBy));
    return Array.from(userSet);
  }, [albums]);

  // Format ISO date to e.g. 16-Oct-2025
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Filter albums based on selected user
  const filteredAlbums = useMemo(() => {
    const filtered = selectedUser === 'all' 
      ? albums 
      : albums.filter(album => album.uploadedBy === selectedUser);
    return filtered;
  }, [albums, selectedUser]);

  // Load albums from API and aggregate media likes for card counters
  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const res = await fetch(`${API_BASE}/albums`, { headers });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.status?.returnMessage || json?.message || 'Failed to load albums');
        }
        const apiAlbums: ApiAlbum[] = json?.data?.albums || json?.albums || [];
        const mappedBase: AlbumCardItem[] = apiAlbums.map((a) => {
          const name = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.trim() || 'Unknown';
          const avatar = a.user?.photo || '/next.svg';
          const created = a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString();
          return {
            id: a.id,
            title: a.title,
            cover: a.cover || '/next.svg',
            photoCount: typeof a.photoCount === 'number' ? a.photoCount : 0,
            videoCount: 0,
            uploadedBy: name,
            uploaderAvatar: avatar || undefined,
            uploadedDate: created,
            likes: 0,
            comments: 0,
          };
        });
        // For each album, load detail and aggregate media likes and comments
        const withAggregates = await Promise.all(
          mappedBase.map(async (a) => {
            try {
              const d = await fetch(`${API_BASE}/albums/${a.id}`, { headers });
              const dj = await d.json().catch(() => ({}));
              if (!d.ok) return a;
              const detail: ApiAlbumDetail | undefined = dj?.data?.album || dj?.album;
              if (!detail) return a;
              const media = detail.media || [];
              // Fetch likes and comments count for all media in parallel and sum
              const mediaStats = await Promise.all(
                media.map(async (m) => {
                  try {
                    const [mr, mc] = await Promise.all([
                      fetch(`${API_BASE}/albums/${a.id}/media/${m.id}/reactions`, { headers }),
                      fetch(`${API_BASE}/albums/${a.id}/media/${m.id}/comments`, { headers }),
                    ]);
                    const [mrj, mcj] = await Promise.all([
                      mr.json().catch(() => ({})),
                      mc.json().catch(() => ({})),
                    ]);
                    const likes = mr.ok ? (mrj?.data?.likes ?? 0) : 0;
                    const comments = mc.ok && Array.isArray(mcj?.data?.comments) ? mcj.data.comments.length : 0;
                    return { likes, comments };
                  } catch {
                    return { likes: 0, comments: 0 };
                  }
                })
              );
              const totalLikes = mediaStats.reduce((sum, r) => sum + (r.likes || 0), 0);
              const totalComments = mediaStats.reduce((sum, r) => sum + (r.comments || 0), 0);
              const videoCount = media.filter(m => m.type === 'video').length;
              return { ...a, likes: totalLikes, comments: totalComments, videoCount } as AlbumCardItem;
            } catch {
              return a;
            }
          })
        );
        setAlbums(withAggregates);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load albums');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlbums();
  }, []);

  // Handle album click -> load album detail and open modal at first media
  const handleAlbumClick = async (album: AlbumCardItem) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${API_BASE}/albums/${album.id}`, { headers });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.status?.returnMessage || json?.message || 'Failed to load album');
      }
      const dataAlbum: ApiAlbumDetail | undefined = json?.data?.album || json?.album;
      if (!dataAlbum) return;
      const mediaIds = (dataAlbum.media || []).map(m => m.id);
      // fetch per-media likes and embed into modal items
      const mediaLikes = await Promise.all(
        mediaIds.map(async (mid) => {
          try {
            const r = await fetch(`${API_BASE}/albums/${dataAlbum.id}/media/${mid}/reactions`, { headers });
            const rj = await r.json().catch(() => ({}));
            if (!r.ok) return 0;
            return rj?.data?.likes ?? 0;
          } catch {
            return 0;
          }
        })
      );
      const media: ModalMediaItem[] = (dataAlbum.media || []).map((m, idx) => ({
        id: idx,
        url: m.url,
        caption: dataAlbum.title,
        type: m.type,
        thumbnail: m.thumbnail || undefined,
        likes: mediaLikes[idx] || 0,
        isLiked: false,
        comments: [],
      }));
      const selected: SelectedAlbumForModal = {
        id: dataAlbum.id,
        title: dataAlbum.title,
        uploadedBy: `${dataAlbum.user?.firstName || ''} ${dataAlbum.user?.lastName || ''}`.trim() || album.uploadedBy,
        uploaderAvatar: dataAlbum.user?.photo || album.uploaderAvatar,
        likes: media.reduce((sum, mi) => sum + (mi.likes || 0), 0),
        comments: album.comments,
        media,
        mediaIds,
      };
      setSelectedAlbum(selected);
      setCurrentPhotoIndex(0);
    } catch {
      // ignore for now
    }
  };

  // Handle like action (current media)
  const handleLike = async () => {
    if (!selectedAlbum) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const mediaId = selectedAlbum.mediaIds[currentPhotoIndex];
    const liked = !!selectedAlbum.media[currentPhotoIndex]?.isLiked;
    try {
      const method = liked ? 'DELETE' : 'POST';
      await fetch(`${API_BASE}/albums/${selectedAlbum.id}/media/${mediaId}/like`, { method, headers });
      setSelectedAlbum(prev => {
        if (!prev) return prev;
        const mediaArr = [...prev.media];
        const current = mediaArr[currentPhotoIndex];
        const delta = liked ? -1 : 1;
        mediaArr[currentPhotoIndex] = { ...current, isLiked: !liked, likes: Math.max(0, (current.likes || 0) + delta) };
        return { ...prev, media: mediaArr, likes: Math.max(0, prev.likes + delta) };
      });
    } catch {
      // ignore
    }
  };

  // Handle adding a comment (optimistic, server post)
  const handleAddComment = async (content: string) => {
    if (!selectedAlbum || !content.trim()) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const mediaId = selectedAlbum.mediaIds[currentPhotoIndex];
    // Optimistic append to current media comments
    const optimistic = {
      id: (selectedAlbum.media[currentPhotoIndex]?.comments.length || 0) + 1,
      userId: 0,
      text: content,
      timestamp: new Date().toISOString(),
      user: { name: 'You', avatar: '/next.svg' },
    };
    setSelectedAlbum(prev => {
      if (!prev) return prev;
      const mediaArr = [...prev.media];
      const current = mediaArr[currentPhotoIndex];
      mediaArr[currentPhotoIndex] = { ...current, comments: [...current.comments, optimistic] };
      return { ...prev, media: mediaArr };
    });
    try {
      const res = await fetch(`${API_BASE}/albums/${selectedAlbum.id}/media/${mediaId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      // Optionally replace the optimistic last comment with server-confirmed data
      const confirmedUser = json?.data?.comment?.user;
      const confirmedContent = json?.data?.comment?.content;
      const confirmedAt = json?.data?.comment?.createdAt;
      setSelectedAlbum(prev => {
        if (!prev) return prev;
        const mediaArr = [...prev.media];
        const current = mediaArr[currentPhotoIndex];
        const newComments = [...current.comments];
        const last = newComments.length - 1;
        if (last >= 0) {
          newComments[last] = {
            ...newComments[last],
            text: confirmedContent || newComments[last].text,
            timestamp: confirmedAt || newComments[last].timestamp,
            user: {
              name: `${confirmedUser?.firstName || ''} ${confirmedUser?.lastName || ''}`.trim() || newComments[last].user.name,
              avatar: confirmedUser?.photo || newComments[last].user.avatar,
            },
          };
        }
        mediaArr[currentPhotoIndex] = { ...current, comments: newComments };
        return { ...prev, media: mediaArr };
      });
    } catch {
      // ignore
    }
  };

  // Comments are stored per-media on selectedAlbum; no separate list here

  // Handle next/previous photo navigation
  const handleNextPhoto = () => {
    if (selectedAlbum?.media && currentPhotoIndex < selectedAlbum.media.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
    }
  };

  const handlePrevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
    }
  };
  
  // Current photo or video from the selected album
  const currentPhoto = selectedAlbum?.media?.[currentPhotoIndex];

  // Load comments for current media when modal opens or media index changes
  useEffect(() => {
    const loadComments = async () => {
      if (!selectedAlbum) return;
      const mediaId = selectedAlbum.mediaIds[currentPhotoIndex];
      if (!mediaId) return;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
        const res = await fetch(`${API_BASE}/albums/${selectedAlbum.id}/media/${mediaId}/comments`, { headers });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const commentsList: Array<{ content: string; createdAt: string; user?: { firstName?: string; lastName?: string; photo?: string } }> = Array.isArray(json?.data?.comments) ? json.data.comments : [];
        const mapped = commentsList.map((c, idx) => ({
          id: idx + 1,
          userId: 0,
          text: c.content,
          timestamp: c.createdAt,
          user: {
            name: `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || 'User',
            avatar: c.user?.photo || '/next.svg',
          },
        }));
        setSelectedAlbum(prev => {
          if (!prev) return prev;
          const mediaArr = [...prev.media];
          const current = mediaArr[currentPhotoIndex];
          mediaArr[currentPhotoIndex] = { ...current, comments: mapped };
          return { ...prev, media: mediaArr };
        });
      } catch {
        // ignore
      }
    };
    loadComments();
  }, [selectedAlbum, selectedAlbum?.id, currentPhotoIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.max(photos.length, 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.max(photos.length, 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + Math.max(photos.length, 1)) % Math.max(photos.length, 1));

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Photo Slideshow */}
          <div className="relative group">
            <div className="relative h-96 rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={photo.caption}
                    fill
                    className="object-cover"
                    style={{ width: '100%', height: '100%', position: 'absolute' }}
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-bold">{photo.caption}</h3>
                    <p className="text-sm text-white/80 mt-1">Recently uploaded</p>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Albums Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-800">Recent Albums</h2>
              <div className="relative w-full sm:w-64">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Users</option>
                  {users.map((user) => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-slate-500 mt-1">Sorted by upload date</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-3 py-12 text-center text-slate-500">
                  <p>Loading albums...</p>
                </div>
              ) : error ? (
                <div className="col-span-3 py-12 text-center text-red-600">
                  <p>{error}</p>
                </div>
              ) : filteredAlbums.length === 0 ? (
                <div className="col-span-3 py-12 text-center text-slate-500">
                  <p>No albums found for the selected user.</p>
                </div>
              ) : (
                filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => handleAlbumClick(album)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={album.cover}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
                      {album.photoCount} photos
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">{album.title}</h3>
                    
                    <div className="flex items-center gap-2.5 text-sm text-slate-500 mb-3">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                        <Image
                          src={album.uploaderAvatar || '/default-avatar.png'} 
                          alt={album.uploadedBy}
                          width={24}
                          height={24}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <span className="line-clamp-1">{album.uploadedBy}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <FiClock className="w-3.5 h-3.5" />
                        <span>{formatDate(album.uploadedDate)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                        
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <FiMessageCircle className="w-3.5 h-3.5" />
                          <span>{album.comments}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={'none'} stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          <span>{album.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
        </div>
      </div>

      {/* Media Modal */}
      {selectedAlbum && currentPhoto && (
        <PhotoModal
          isOpen={!!selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          media={{
            id: currentPhoto.id,
            url: currentPhoto.url,
            caption: currentPhoto.caption,
            type: currentPhoto.type || 'image',
            thumbnail: currentPhoto.thumbnail,
            likes: selectedAlbum.media[currentPhotoIndex]?.likes || 0,
            isLiked: !!selectedAlbum.media[currentPhotoIndex]?.isLiked,
            comments: selectedAlbum.media[currentPhotoIndex]?.comments || [],
            uploadedBy: selectedAlbum.uploadedBy,
            uploaderAvatar: selectedAlbum.uploaderAvatar
          }}
          onLike={handleLike}
          onAddComment={handleAddComment}
          onNext={handleNextPhoto}
          onPrev={handlePrevPhoto}
          hasNext={!!(selectedAlbum.media && currentPhotoIndex < selectedAlbum.media.length - 1)}
          hasPrev={currentPhotoIndex > 0}
        />
      )}
      
      {/* Debug info - will be shown in development only */}
      {process.env.NODE_ENV === 'development' && selectedAlbum && (
        <div className="hidden">
          <p>Selected Album: {selectedAlbum.title}</p>
          <p>Uploaded By: {selectedAlbum.uploadedBy}</p>
          <p>Avatar URL: {selectedAlbum.uploaderAvatar || 'Not provided'}</p>
        </div>
      )}
    </>
  );
};

export default Dashboard;
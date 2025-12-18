'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiImage, FiVideo, FiChevronRight, FiClock, FiHeart, FiMessageCircle } from 'react-icons/fi';
import Image from 'next/image';

type ApiAlbum = {
  id: string;
  title: string;
  cover?: string | null;
  photoCount?: number;
  user?: { id: string; firstName?: string; lastName?: string; photo?: string | null };
  createdAt?: string;
};

type ViewAlbum = {
  id: string;
  title: string;
  cover: string;
  photoCount: number;
  videoCount: number;
  uploadedBy: string;
  uploaderAvatar: string;
  uploadedDate: string;
  likes: number;
  comments: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

export default function AlbumsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [albums, setAlbums] = useState<ViewAlbum[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch(`${API_BASE}/albums`, {
          headers: {
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.status?.returnMessage || json?.message || 'Failed to load albums');
        }
        const apiAlbums: ApiAlbum[] = json?.data?.albums || json?.albums || [];
        const mappedBase: ViewAlbum[] = apiAlbums.map((a) => {
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
            uploaderAvatar: avatar,
            uploadedDate: created,
            likes: 0,
            comments: 0,
          };
        });
        // For each album, load detail and aggregate media likes and comments
        const withAggregates = await Promise.all(
          mappedBase.map(async (a) => {
            try {
              const d = await fetch(`${API_BASE}/albums/${a.id}`, { headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
              const dj = await d.json().catch(() => ({}));
              if (!d.ok) return a;
              const detail = dj?.data?.album || dj?.album;
              const media = Array.isArray(detail?.media) ? detail.media : [];
              const mediaStats = await Promise.all(
                media.map(async (m: { id: string; type: string }) => {
                  try {
                    const [mr, mc] = await Promise.all([
                      fetch(`${API_BASE}/albums/${a.id}/media/${m.id}/reactions`, { headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
                      fetch(`${API_BASE}/albums/${a.id}/media/${m.id}/comments`, { headers: { 'Accept': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } }),
                    ]);
                    const [mrj, mcj] = await Promise.all([mr.json().catch(() => ({})), mc.json().catch(() => ({}))]);
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
              const videoCount = media.filter((m: { type: string }) => m.type === 'video').length;
              return { ...a, likes: totalLikes, comments: totalComments, videoCount } as ViewAlbum;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading albums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Albums</h1>
          <p className="text-gray-600">View and manage your photo and video albums</p>
        </div>
        <button
          onClick={() => router.push('/pages/albums/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          New Album
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-12">
          <FiImage className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No albums yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new album.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/pages/albums/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              New Album
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => router.push(`/pages/albums/view/${album.id}`)}
              className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer border border-gray-200"
            >
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={album.cover}
                  alt={album.title}
                  fill
                  className="object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center">
                  <FiImage className="mr-1" size={12} />
                  <span>{album.photoCount} photos</span>
                  {album.videoCount > 0 && (
                    <>
                      <span className="mx-1">•</span>
                      <FiVideo className="mr-1" size={12} />
                      <span>{album.videoCount} videos</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Image
                      src={album.uploaderAvatar}
                      alt={album.uploadedBy}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full mr-2"
                    />
                    <span className="font-medium text-gray-700">{album.uploadedBy}</span>
                    <span className="mx-2 text-gray-300">•</span>
                    <FiClock className="mr-1 flex-shrink-0" size={12} />
                    <span>{formatDate(album.uploadedDate)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600">{album.title}</h3>
                  <FiChevronRight className="text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <FiHeart className="mr-1" size={14} />
                    <span>{album.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <FiMessageCircle className="mr-1" size={14} />
                    <span>{album.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { FiPlus, FiImage, FiVideo, FiChevronRight, FiClock, FiHeart, FiMessageCircle } from 'react-icons/fi';
import Image from 'next/image';
import { mockAlbums } from '@/data/mockData';

type Album = {
  id: number;
  title: string;
  cover: string;
  photoCount: number;
  videoCount: number;
  uploadedBy: string;
  uploaderAvatar: string;
  uploadedDate: string;
  likes: number;
  comments: number;
  media: Array<{
    id: number;
    url: string;
    caption: string;
    type: 'image' | 'video';
    thumbnail?: string;
  }>;
};

export default function AlbumsPage() {
  const router = useRouter();
  const isLoading = false;
  const albums: Album[] = mockAlbums;

  const formatDate = (dateString: string) => {
    const [day, month, year] = dateString.split('-');
    const date = new Date(`${month} ${day}, ${year}`);
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
          {albums.map((album: Album) => (
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

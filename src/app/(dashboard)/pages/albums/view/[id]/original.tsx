'use client';

import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiClock, FiImage, FiVideo, FiShare2, FiMoreVertical } from 'react-icons/fi';
import Image from 'next/image';
import { mockAlbums } from '@/data/mockData';


export default function AlbumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const albumId = Number(params.id);
  
  // In a real app, you would fetch the album data here
  const album = mockAlbums.find(a => a.id === albumId);

  if (!album) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Album not found</h2>
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

  const formatDate = (dateString: string) => {
    const [day, month, year] = dateString.split('-');
    const date = new Date(`${month} ${day}, ${year}`);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

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
                  src={album.cover}
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
                    <span>{album.likes}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FiMessageCircle className="mr-1" />
                    <span>{album.comments}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Image
                    src={album.uploaderAvatar}
                    alt={album.uploadedBy}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <span className="font-medium text-gray-700">{album.uploadedBy}</span>
                </div>
                <span className="mx-2 text-gray-300">•</span>
                <FiClock className="mr-1" size={14} />
                <span>{formatDate(album.uploadedDate)}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <div className="flex items-center mr-4">
                  <FiImage className="mr-1" size={16} />
                  <span>{album.photoCount} photos</span>
                </div>
                {album.videoCount > 0 && (
                  <div className="flex items-center">
                    <FiVideo className="mr-1" size={16} />
                    <span>{album.videoCount} videos</span>
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
        {album.media.map((item) => (
          <div 
            key={item.id} 
            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:shadow-lg transition-shadow duration-200"
          >
            {item.type === 'image' ? (
              <Image
                src={item.url}
                alt={item.caption}
                fill
                className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src={item.thumbnail || '/video-placeholder.jpg'}
                  alt={item.caption}
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
            
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

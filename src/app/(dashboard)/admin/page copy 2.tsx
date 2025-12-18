"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { FiClock, FiChevronLeft, FiChevronRight, FiMessageCircle } from 'react-icons/fi';
import PhotoModal from '@/components/PhotoModal';
import { mockUsers, mockComments, mockPhotos, mockAlbums } from '@/data/mockData';

interface MediaItem {
  id: number;
  url: string;
  caption: string;
  type: 'image' | 'video';
  thumbnail?: string; // For video thumbnails
}

interface Album {
  id: number;
  title: string;
  cover: string;
  photoCount: number;
  videoCount: number;
  uploadedBy: string;
  uploaderAvatar?: string;
  uploadedDate: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  media?: MediaItem[];
}

const Dashboard = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [mockLikes, setMockLikes] = useState<Array<{id: number, albumId: number, userId: number, timestamp: string}>>([]);

  // Use photos and albums from mock data
  const photos = mockPhotos;
  
  // Use memoized albums from mock data
  const albums = useMemo<Album[]>(() => mockAlbums, []);

  // Get unique users from albums
  const users = useMemo(() => {
    const userSet = new Set(albums.map(album => album.uploadedBy));
    return Array.from(userSet);
  }, [albums]);

  // Format date to 16-Oct-2025 format
  const formatDate = () => {
    return '16-Oct-2025';
  };
  


  // Filter albums based on selected user
  const filteredAlbums = useMemo(() => {
    console.log('All albums:', albums);
    console.log('Selected user:', selectedUser);
    
    const filtered = selectedUser === 'all' 
      ? albums 
      : albums.filter(album => album.uploadedBy === selectedUser);
      
    console.log('Filtered albums:', filtered);
    return filtered;
  }, [albums, selectedUser]);

  // Handle album click
  const handleAlbumClick = (album: Album) => {
    console.log('Selected album:', {
      title: album.title,
      uploadedBy: album.uploadedBy,
      uploaderAvatar: album.uploaderAvatar
    });
    
    if (album.media && album.media.length > 0) {
      setSelectedAlbum(album);
      setCurrentPhotoIndex(0);
    }
  };

  // Handle like action
  const handleLike = () => {
    if (!selectedAlbum) return;
    
    const isLiked = mockLikes.some(
      like => like.albumId === selectedAlbum.id && like.userId === 1
    );

    if (isLiked) {
      // Unlike
      const updatedLikes = mockLikes.filter(
        like => !(like.albumId === selectedAlbum.id && like.userId === 1)
      );
      setMockLikes(updatedLikes);
      
      const updatedAlbum = {
        ...selectedAlbum,
        likes: Math.max(0, selectedAlbum.likes - 1),
        isLiked: false
      };
      
      setSelectedAlbum(updatedAlbum);
    } else {
      // Like
      const newLike = {
        id: mockLikes.length + 1,
        albumId: selectedAlbum.id,
        userId: 1,
        timestamp: new Date().toISOString()
      };
      
      setMockLikes([...mockLikes, newLike]);
      
      const updatedAlbum = {
        ...selectedAlbum,
        likes: selectedAlbum.likes + 1,
        isLiked: true
      };
      
      setSelectedAlbum(updatedAlbum);
    }
  };

  // Handle adding a comment
  const handleAddComment = () => {
    if (!selectedAlbum) return;
    
    const updatedAlbum = {
      ...selectedAlbum,
      comments: selectedAlbum.comments + 1
    };
    
    setSelectedAlbum(updatedAlbum);
  };

  // Get comments for the current album
  const albumComments = selectedAlbum 
    ? mockComments
        .filter(comment => comment.albumId === selectedAlbum.id)
        .map(comment => ({
          ...comment,
          user: mockUsers.find(u => u.id === comment.userId) || { name: 'Unknown', avatar: '' }
        }))
    : [];

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [photos.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % photos.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length);

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
              {filteredAlbums.length === 0 ? (
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
                        <span>{formatDate()}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                        
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <FiMessageCircle className="w-3.5 h-3.5" />
                          <span>{album.comments}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={album.isLiked ? '#ef4444' : 'none'} stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            likes: selectedAlbum.likes,
            isLiked: !!selectedAlbum.isLiked,
            comments: albumComments,
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
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { FiClock, FiChevronLeft, FiChevronRight, FiHeart, FiMessageCircle } from 'react-icons/fi';
import Menu from '@/components/menu';
import TopNav from '@/components/TopNav';
import PhotoModal from '@/components/PhotoModal';
import { mockUsers, mockComments } from '@/data/mockData';

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

  // Sample photo data for slideshow
  const photos = [
    { id: 1, url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=500&fit=crop', caption: 'Family Beach Trip 2024' },
    { id: 2, url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&h=500&fit=crop', caption: 'Summer Vacation' },
    { id: 3, url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=500&fit=crop', caption: 'Holiday Gathering' },
    { id: 4, url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=500&fit=crop', caption: 'Birthday Celebration' },
  ];

  // Sample albums data with photos and videos
  const albums = useMemo<Album[]>(() => [
    {
      id: 1,
      title: 'Summer Vacation 2024',
      cover: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
      photoCount: 3,
      videoCount: 1,
      uploadedBy: 'Sarah Johnson',
      uploadedDate: '2024-10-10',
      likes: 234,
      comments: 45,
      media: [
        { 
          id: 1, 
          url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop', 
          caption: 'Beach Sunset',
          type: 'image' as const
        },
        { 
          id: 2, 
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', 
          caption: 'Ocean View',
          type: 'image' as const
        },
        { 
          id: 3, 
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop', 
          caption: 'Mountain Lake',
          type: 'image' as const
        },
        {
          id: 4,
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          caption: 'Beach Fun',
          type: 'video' as const,
          thumbnail: 'https://images.unsplash.com/photo-1574717024453-9f988aaeeca4?w=800&h=450&fit=crop'
        }
      ]
    },
    {
      id: 2,
      title: 'Christmas Memories',
      cover: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&h=300&fit=crop',
      photoCount: 2,
      videoCount: 1,
      uploadedBy: 'Michael Chen',
      uploadedDate: '2024-10-08',
      likes: 189,
      comments: 23,
      media: [
        { 
          id: 1, 
          url: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&h=600&fit=crop', 
          caption: 'Christmas Tree',
          type: 'image' as const
        },
        { 
          id: 2, 
          url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop', 
          caption: 'Holiday Decorations',
          type: 'image' as const
        },
        {
          id: 3,
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          caption: 'Christmas Lights',
          type: 'video' as const,
          thumbnail: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&h=450&fit=crop'
        }
      ]
    },
    {
      id: 3,
      title: 'Mountain Hiking',
      cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
      photoCount: 3,
      videoCount: 0,
      uploadedBy: 'Emma Wilson',
      uploadedDate: '2024-10-05',
      likes: 312,
      comments: 78,
      media: [
        { 
          id: 1, 
          url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop', 
          caption: 'Mountain Peak',
          type: 'image' as const
        },
        { 
          id: 2, 
          url: 'https://images.unsplash.com/photo-1506905925346-21bda4d315df?w=800&h=600&fit=crop', 
          caption: 'Mountain Trail',
          type: 'image' as const
        },
        { 
          id: 3, 
          url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&h=600&fit=crop', 
          caption: 'Mountain View',
          type: 'image' as const
        }
      ]
    },
    {
      id: 4,
      title: 'Kids Birthday Party',
      cover: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
      photoCount: 2,
      videoCount: 0,
      uploadedBy: 'Emma Wilson',
      uploadedDate: '2024-10-05',
      likes: 156,
      comments: 28,
      media: [
        { 
          id: 1, 
          url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop', 
          caption: 'Birthday Cake',
          type: 'image' as const
        },
        { 
          id: 2, 
          url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=600&fit=crop', 
          caption: 'Party Decorations',
          type: 'image' as const
        }
      ]
    },
    {
      id: 5,
      title: 'Family Reunion',
      cover: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop',
      photoCount: 2,
      videoCount: 0,
      uploadedBy: 'Lisa Anderson',
      uploadedDate: '2024-09-28',
      likes: 312,
      comments: 67,
      media: [
        { 
          id: 1, 
          url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=600&fit=crop', 
          caption: 'Family Portrait',
          type: 'image' as const
        },
        { 
          id: 2, 
          url: 'https://images.unsplash.com/photo-1529333166437-7750a1dd2114?w=800&h=600&fit=crop', 
          caption: 'Group Photo',
          type: 'image' as const
        }
      ]
    },
    {
      id: 6,
      title: 'Food Adventures',
      cover: 'https://images.unsplash.com/photo-1504674900247-087703934569?w=400&h=300&fit=crop',
      photoCount: 2,
      videoCount: 1,
      uploadedBy: 'John Smith',
      uploadedDate: '2024-09-25',
      likes: 345,
      comments: 67,
      media: [
        { 
          id: 1, 
          url: 'https://images.unsplash.com/photo-1504674900247-087703934569?w=800&h=600&fit=crop', 
          caption: 'Delicious Pasta',
          type: 'image' as const
        },
        { 
          id: 2, 
          url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', 
          caption: 'Gourmet Burger',
          type: 'image' as const
        },
        {
          id: 3,
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          caption: 'Cooking Show',
          type: 'video' as const,
          thumbnail: 'https://images.unsplash.com/photo-1556911220-01550fad6e9d?w=800&h=450&fit=crop'
        }
      ]
    }
  ], []);

  // Get unique users from albums
  const users = useMemo(() => {
    const userSet = new Set(albums.map(album => album.uploadedBy));
    return Array.from(userSet);
  }, [albums]);

  // Filter albums based on selected user
  const filteredAlbums = useMemo(() => {
    if (selectedUser === 'all') return albums;
    return albums.filter(album => album.uploadedBy === selectedUser);
  }, [albums, selectedUser]);

  // Handle album click
  const handleAlbumClick = (album: Album) => {
    // Make sure the album has media items before selecting it
    if (album.media && album.media.length > 0) {
      setSelectedAlbum(album);
      setCurrentPhotoIndex(0);
    }
  };

  // Handle like action
  const handleLike = () => {
    if (!selectedAlbum) return;
    
    // In a real app, you would make an API call here
    const isLiked = mockLikes.some(
      like => like.albumId === selectedAlbum.id && like.userId === 1 // Assuming current user ID is 1
    );

    if (isLiked) {
      // Unlike
      const updatedLikes = mockLikes.filter(
        like => !(like.albumId === selectedAlbum.id && like.userId === 1)
      );
      setMockLikes(updatedLikes);
      
      // Update the album's like count
      const updatedAlbum = {
        ...selectedAlbum,
        likes: Math.max(0, selectedAlbum.likes - 1),
        isLiked: false
      };
      
      // Update the selected album in the modal
      setSelectedAlbum(updatedAlbum);
    } else {
      // Like
      const newLike = {
        id: mockLikes.length + 1,
        albumId: selectedAlbum.id,
        userId: 1, // Assuming current user ID is 1
        timestamp: new Date().toISOString()
      };
      
      setMockLikes([...mockLikes, newLike]);
      
      // Update the album's like count
      const updatedAlbum = {
        ...selectedAlbum,
        likes: selectedAlbum.likes + 1,
        isLiked: true
      };
      
      // Update the selected album in the modal
      setSelectedAlbum(updatedAlbum);
    }
  };

  // Handle adding a comment
  // In a real app, this would send the comment text to the server
  // For now, we're just incrementing the comment count as a mock implementation
  const handleAddComment = () => {
    if (!selectedAlbum) return;
    
    // In a real app, you would make an API call here and handle the response
    // For now, we'll just update the comment count
    
    // Update the selected album with the new comment count
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
    <div className="flex h-screen bg-slate-50">
      <Menu />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
          
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
                          src={mockUsers.find(user => user.name === album.uploadedBy)?.avatar || '/default-avatar.png'}
                          alt={album.uploadedBy}
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      </div>
                      <span className="line-clamp-1">{album.uploadedBy}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <FiClock className="w-3.5 h-3.5" />
                        <span>{new Date(album.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <FiHeart className="w-3.5 h-3.5" />
                          <span>{album.likes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <FiMessageCircle className="w-3.5 h-3.5" />
                          <span>{album.comments}</span>
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
        </main>
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
            comments: albumComments
          }}
          onLike={handleLike}
          onAddComment={handleAddComment}
          onNext={handleNextPhoto}
          onPrev={handlePrevPhoto}
          hasNext={!!(selectedAlbum.media && currentPhotoIndex < selectedAlbum.media.length - 1)}
          hasPrev={currentPhotoIndex > 0}
        />
      )}
    </div>
  );
};

export default Dashboard;
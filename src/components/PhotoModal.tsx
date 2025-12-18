'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiX, FiHeart, FiMessageCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Comment {
  id: number;
  userId: number;
  text: string;
  timestamp: string;
  user: {
    name: string;
    avatar: string;
  };
}

interface MediaItem {
  id: number;
  url: string;
  caption: string;
  type: 'image' | 'video';
  thumbnail?: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  uploadedBy?: string;
  uploaderAvatar?: string;
}

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem;
  onLike: () => void;
  onAddComment: (content: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function PhotoModal({ 
  isOpen, 
  onClose, 
  media, 
  onLike, 
  onAddComment,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false
}: PhotoModalProps) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Add global styles for custom scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #94a3b8 #f1f5f9;
        -webkit-overflow-scrolling: touch;
        overflow-y: auto;
        max-height: 100%;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #94a3b8;
        border-radius: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #64748b;
      }`;
    
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Auto-scroll comments to bottom when new comments arrive
  useEffect(() => {
    if (commentsRef.current) {
      commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
    }
  }, [media.comments?.length, isOpen]);

  if (!isOpen) return null;
  
  // Debug info
  console.log('PhotoModal props:', {
    media: {
      caption: media.caption,
      uploadedBy: media.uploadedBy,
      uploaderAvatar: media.uploaderAvatar,
      hasAvatar: !!media.uploaderAvatar
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(commentText.trim());
      setCommentText('');
      setShowComments(true);
    }
  };

  const togglePlayPause = () => {
    if (media.type === 'video') {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <FiX className="w-8 h-8" />
      </button>

      <div className="bg-white rounded-xl overflow-hidden max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="relative flex-1 flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-2/3 bg-black flex items-center justify-center">
            {/* Mobile comments toggle button */}
            {isMobile && (
              <button 
                onClick={() => setShowComments(!showComments)}
                className="absolute top-4 left-4 z-10 bg-black/50 text-white p-2 rounded-full"
                aria-label={showComments ? 'Hide comments' : 'Show comments'}
              >
                <FiMessageCircle className="w-5 h-5" />
              </button>
            )}
            <div 
              className="relative w-full h-[60vh] sm:h-[70vh] flex items-center justify-center"
              onClick={togglePlayPause}
            >
              {media.type === 'image' ? (
                <Image
                  src={media.url}
                  alt={media.caption}
                  fill
                  className="object-contain cursor-pointer"
                  priority
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    src={media.url}
                    poster={media.thumbnail}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button 
                    className={`absolute inset-0 flex items-center justify-center ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-70'} transition-opacity`}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                  >
                    {!isPlaying && (
                      <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                </>
              )}
              
              {hasPrev && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev?.();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <FiChevronLeft className="w-6 h-6" />
                </button>
              )}
              
              {hasNext && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext?.();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                >
                  <FiChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
          
          {/* Comments section */}
          <div 
            className={`w-full sm:w-1/3 border-t sm:border-t-0 sm:border-l border-gray-200 flex flex-col ${
              isMobile && !showComments ? 'hidden sm:flex' : 'flex'
            }`}
            style={isMobile ? { maxHeight: '50vh' } : {}}
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {media.type === 'video' && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Video
                    </span>
                  )}
                  <h3 className="font-semibold text-lg">{media.caption}</h3>
                </div>
                {media.uploadedBy && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-100">
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium">
                        {media.uploadedBy 
                          ? media.uploadedBy.split(' ').map(n => n[0]).join('.').toUpperCase()
                          : 'U'}
                      </div>
                    </div>
                    <span>By {media.uploadedBy}</span>
                  </div>
                )}
              </div>
              {isMobile && (
                <button 
                  onClick={() => setShowComments(false)}
                  className="sm:hidden text-gray-500 hover:text-gray-700"
                  aria-label="Hide comments"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="flex flex-col" style={{ height: isMobile ? '50vh' : '100%' }}>
              <div ref={commentsRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {media.comments.length > 0 ? (
                media.comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      <Image
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <div className="text-sm font-medium truncate">{comment.user.name}</div>
                        <div className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(comment.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 break-words">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
            
            </div>
            {/* Mobile comment input - always visible at bottom */}
            {isMobile && (
              <div className="p-3 border-t border-gray-200 bg-white/95 backdrop-blur-sm sticky bottom-0 z-10" style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}

            {/* Desktop comment input - inside the comments panel */}
            {!isMobile && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <button 
                    onClick={onLike}
                    className={`p-1 rounded-full ${media.isLiked ? 'text-red-500' : 'text-gray-700 hover:text-gray-900'}`}
                  >
                    <FiHeart className={`w-6 h-6 ${media.isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <span className="text-sm font-medium">{media.likes} {media.likes === 1 ? 'like' : 'likes'}</span>
                </div>
                
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

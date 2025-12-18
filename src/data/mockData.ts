export const mockUsers = [
  { id: 1, name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Michael Chen', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, name: 'David Martinez', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: 5, name: 'Lisa Anderson', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 6, name: 'John Smith', avatar: 'https://i.pravatar.cc/150?img=6' },
  { id: 7, name: 'Alex Turner', avatar: 'https://i.pravatar.cc/150?img=7' },
  { id: 8, name: 'Sophia Garcia', avatar: 'https://i.pravatar.cc/150?img=8' },
  { id: 9, name: 'James Wilson', avatar: 'https://i.pravatar.cc/150?img=9' },
  { id: 10, name: 'Olivia Brown', avatar: 'https://i.pravatar.cc/150?img=10' },
  { id: 11, name: 'Daniel Kim', avatar: 'https://i.pravatar.cc/150?img=11' },
];

// Video URLs and thumbnails are now included directly in the album media items

export const mockComments = [
  { 
    id: 1, 
    albumId: 1, 
    userId: 2, 
    text: 'These photos are amazing! The beach looks beautiful.', 
    timestamp: '2024-10-10T14:30:00Z' 
  },
  { 
    id: 2, 
    albumId: 1, 
    userId: 3, 
    text: 'I love the sunset shots!', 
    timestamp: '2024-10-10T15:45:00Z' 
  },
  { 
    id: 3, 
    albumId: 2, 
    userId: 1, 
    text: 'The Christmas decorations look wonderful!', 
    timestamp: '2024-10-09T10:15:00Z' 
  },
  { 
    id: 4, 
    albumId: 3, 
    userId: 5, 
    text: 'The mountain views are breathtaking!', 
    timestamp: '2024-10-08T16:20:00Z' 
  },
  { 
    id: 5, 
    albumId: 4, 
    userId: 7, 
    text: 'The food looks absolutely delicious!', 
    timestamp: '2024-10-07T11:30:00Z' 
  },
  { 
    id: 6, 
    albumId: 5, 
    userId: 9, 
    text: 'What a wonderful family gathering!', 
    timestamp: '2024-10-06T09:45:00Z' 
  },
  { 
    id: 7, 
    albumId: 6, 
    userId: 11, 
    text: 'The concert was amazing!', 
    timestamp: '2024-10-05T22:10:00Z' 
  },
  { 
    id: 8, 
    albumId: 3, 
    userId: 8, 
    text: 'I want to go there too!', 
    timestamp: '2024-10-08T17:45:00Z' 
  },
  { 
    id: 9, 
    albumId: 5, 
    userId: 10, 
    text: 'Can\'t wait for the next reunion!', 
    timestamp: '2024-10-06T10:30:00Z' 
  }
];

export const mockLikes = [
  // Album 1 likes
  { id: 1, albumId: 1, userId: 2, timestamp: '2024-10-10T14:25:00Z' },
  { id: 2, albumId: 1, userId: 3, timestamp: '2024-10-10T14:40:00Z' },
  { id: 3, albumId: 1, userId: 4, timestamp: '2024-10-10T16:20:00Z' },
  { id: 4, albumId: 1, userId: 7, timestamp: '2024-10-10T17:30:00Z' },
  { id: 5, albumId: 1, userId: 9, timestamp: '2024-10-10T18:15:00Z' },
  
  // Album 2 likes
  { id: 6, albumId: 2, userId: 1, timestamp: '2024-10-09T10:10:00Z' },
  { id: 7, albumId: 2, userId: 5, timestamp: '2024-10-09T11:30:00Z' },
  { id: 8, albumId: 2, userId: 8, timestamp: '2024-10-09T12:45:00Z' },
  { id: 9, albumId: 2, userId: 11, timestamp: '2024-10-09T14:20:00Z' },
  
  // Album 3 likes
  { id: 10, albumId: 3, userId: 2, timestamp: '2024-10-08T15:10:00Z' },
  { id: 11, albumId: 3, userId: 4, timestamp: '2024-10-08T15:30:00Z' },
  { id: 12, albumId: 3, userId: 6, timestamp: '2024-10-08T16:45:00Z' },
  { id: 13, albumId: 3, userId: 8, timestamp: '2024-10-08T17:20:00Z' },
  { id: 14, albumId: 3, userId: 10, timestamp: '2024-10-08T18:30:00Z' },
  
  // Album 4 likes
  { id: 15, albumId: 4, userId: 1, timestamp: '2024-10-07T09:15:00Z' },
  { id: 16, albumId: 4, userId: 3, timestamp: '2024-10-07T10:30:00Z' },
  { id: 17, albumId: 4, userId: 5, timestamp: '2024-10-07T11:45:00Z' },
  { id: 18, albumId: 4, userId: 7, timestamp: '2024-10-07T13:20:00Z' },
  
  // Album 5 likes
  { id: 19, albumId: 5, userId: 2, timestamp: '2024-10-06T08:30:00Z' },
  { id: 20, albumId: 5, userId: 4, timestamp: '2024-10-06T09:45:00Z' },
  { id: 21, albumId: 5, userId: 6, timestamp: '2024-10-06T11:00:00Z' },
  { id: 22, albumId: 5, userId: 8, timestamp: '2024-10-06T12:15:00Z' },
  { id: 23, albumId: 5, userId: 10, timestamp: '2024-10-06T13:30:00Z' },
  
  // Album 6 likes
  { id: 24, albumId: 6, userId: 1, timestamp: '2024-10-05T19:20:00Z' },
  { id: 25, albumId: 6, userId: 3, timestamp: '2024-10-05T20:30:00Z' },
  { id: 26, albumId: 6, userId: 5, timestamp: '2024-10-05T21:45:00Z' },
  { id: 27, albumId: 6, userId: 7, timestamp: '2024-10-05T22:15:00Z' },
  { id: 28, albumId: 6, userId: 9, timestamp: '2024-10-05T23:30:00Z' },
  { id: 29, albumId: 6, userId: 11, timestamp: '2024-10-06T00:45:00Z' }
];

export const mockPhotos = [
  { id: 1, url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=500&fit=crop', caption: 'Family Beach Trip 2024' },
  { id: 2, url: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&h=500&fit=crop', caption: 'Summer Vacation' },
  { id: 3, url: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=500&fit=crop', caption: 'Holiday Gathering' },
  { id: 4, url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=500&fit=crop', caption: 'Birthday Celebration' },
];

export const mockAlbums = [
  {
    id: 1,
    title: 'Summer Vacation 2024',
    cover: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=300&fit=crop',
    photoCount: 3,
    videoCount: 1,
    uploadedBy: 'Sarah Johnson',
    uploaderAvatar: 'https://i.pravatar.cc/150?img=1',
    uploadedDate: '16-Oct-2025',
    likes: 5,
    comments: 2,
    description: 'Our amazing summer vacation at the beach. So many great memories made with family and friends!',
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
    title: 'Christmas 2023',
    cover: 'https://images.unsplash.com/photo-1512389142863-9ac5f7db1721?w=400&h=300&fit=crop',
    photoCount: 4,
    videoCount: 0,
    uploadedBy: 'Michael Chen',
    uploaderAvatar: 'https://i.pravatar.cc/150?img=2',
    uploadedDate: '25-Dec-2023',
    likes: 8,
    comments: 1,
    description: 'Christmas celebration with family. The tree, the lights, and the joy of the holiday season!',
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
        url: 'https://images.unsplash.com/photo-1512389142863-9ac5f7db1721?w=800&h=600&fit=crop', 
        caption: 'Snowman',
        type: 'image' as const
      },
      { 
        id: 4, 
        url: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800&h=600&fit=crop', 
        caption: 'Gifts',
        type: 'image' as const
      }
    ]
  },
  {
    id: 3,
    title: 'Mountain Hiking',
    cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop',
    photoCount: 5,
    videoCount: 2,
    uploadedBy: 'Emma Wilson',
    uploaderAvatar: 'https://i.pravatar.cc/150?img=3',
    uploadedDate: '10-Oct-2024',
    likes: 12,
    comments: 3,
    description: 'Amazing hiking trip to the mountains. The views were absolutely breathtaking!',
    media: [
      { 
        id: 1, 
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop', 
        caption: 'Mountain Peak',
        type: 'image' as const
      },
      { 
        id: 2, 
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', 
        caption: 'Forest Trail',
        type: 'image' as const
      },
      { 
        id: 3, 
        url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800&h=600&fit=crop', 
        caption: 'Mountain Lake',
        type: 'image' as const
      },
      { 
        id: 4, 
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop', 
        caption: 'Sunset View',
        type: 'image' as const
      },
      { 
        id: 5, 
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', 
        caption: 'Waterfall',
        type: 'image' as const
      },
      {
        id: 6,
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        caption: 'Hiking Adventure',
        type: 'video' as const,
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=450&fit=crop'
      },
      {
        id: 7,
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        caption: 'Mountain Climbing',
        type: 'video' as const,
        thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=450&fit=crop'
      }
    ]
  },
  {
    id: 4,
    title: 'Foodie Adventures',
    cover: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
    photoCount: 3,
    videoCount: 1,
    uploadedBy: 'David Martinez',
    uploaderAvatar: 'https://i.pravatar.cc/150?img=4',
    uploadedDate: '05-Sep-2024',
    likes: 7,
    comments: 0,
    description: 'Culinary journey through different cuisines. Each dish tells a story!',
    media: [
      { 
        id: 1, 
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop', 
        caption: 'Gourmet Pasta',
        type: 'image' as const
      },
      { 
        id: 2, 
        url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop', 
        caption: 'Sushi Platter',
        type: 'image' as const
      },
      { 
        id: 3, 
        url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop', 
        caption: 'Pizza Night',
        type: 'image' as const
      },
      {
        id: 4,
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        caption: 'Cooking Show',
        type: 'video' as const,
        thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=450&fit=crop'
      }
    ]
  },
  {
    id: 5,
    title: 'Family Reunion',
    cover: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=300&fit=crop',
    photoCount: 3,
    videoCount: 1,
    uploadedBy: 'Sophia Garcia',
    uploaderAvatar: 'https://i.pravatar.cc/150?img=8',
    uploadedDate: '16-Oct-2025',
    likes: 5,
    comments: 2,
    media: [
      { 
        id: 1, 
        url: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop', 
        caption: 'Family Portrait',
        type: 'image' as const
      },
      { 
        id: 2, 
        url: 'https://images.unsplash.com/photo-1529333245390-6c60cfddee60?w=800&h=600&fit=crop', 
        caption: 'Dinner Time',
        type: 'image' as const
      },
      { 
        id: 3, 
        url: 'https://images.unsplash.com/photo-1529333245390-6c60cfddee60?w=800&h=600&fit=crop', 
        caption: 'Group Photo',
        type: 'image' as const
      },
      {
        id: 4,
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        caption: 'Family Moments',
        type: 'video' as const,
        thumbnail: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=450&fit=crop'
      }
    ]
  },
  {
    id: 6,
    title: 'Concert Night',
    cover: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=400&h=300&fit=crop',
    photoCount: 2,
    videoCount: 2,
    uploadedBy: 'Daniel Kim',
    uploaderAvatar: 'https://i.pravatar.cc/150?img=11',
    uploadedDate: '16-Oct-2025',
    likes: 6,
    comments: 1,
    media: [
      { 
        id: 1, 
        url: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=600&fit=crop', 
        caption: 'Stage Lights',
        type: 'image' as const
      },
      { 
        id: 2, 
        url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=600&fit=crop', 
        caption: 'Crowd Energy',
        type: 'image' as const
      },
      {
        id: 3,
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        caption: 'Opening Act',
        type: 'video' as const,
        thumbnail: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=450&fit=crop'
      },
      {
        id: 4,
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        caption: 'Main Performance',
        type: 'video' as const,
        thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=450&fit=crop'
      }
    ]
  }
];

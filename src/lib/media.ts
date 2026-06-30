const VIDEO_EXT = /\.(mp4|mov|webm|avi|mkv)(\?.*)?$/i;

type MediaLike = { type?: string; url?: string; thumbnail?: string | null };

export type UploadedMedia = {
  url: string;
  type: 'image' | 'video';
  isCover?: boolean;
};

export function isVideoUrl(url: string): boolean {
  return url.includes('/video/upload/') || VIDEO_EXT.test(url);
}

/** First-frame JPG from a Cloudinary video URL (for video grid tiles only). */
export function getCloudinaryVideoThumbnail(url: string): string {
  if (!url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) {
    return '/next.svg';
  }
  const withFrame = url.replace('/video/upload/', '/video/upload/so_0,w_400,h_400,c_fill/');
  return withFrame.replace(VIDEO_EXT, '.jpg');
}

/** Pick an image URL to store as album cover (never a video). */
export function pickImageCoverUrl(media: UploadedMedia[]): string | null {
  const marked = media.find(
    (m) => m.isCover && m.type === 'image' && m.url?.trim() && !isVideoUrl(m.url),
  );
  if (marked?.url) return marked.url.trim();

  const firstImage = media.find(
    (m) => m.type === 'image' && m.url?.trim() && !isVideoUrl(m.url),
  );
  return firstImage?.url?.trim() || null;
}

/** Display URL for album cover — images only; falls back to first photo in album. */
export function resolveAlbumCover(
  cover?: string | null,
  media?: MediaLike[] | null,
): string {
  const trimmed = cover?.trim() || '';

  if (trimmed && !isVideoUrl(trimmed)) return trimmed;

  const firstImage = media?.find(
    (m) => m.url?.trim() && (m.type === 'image' || !isVideoUrl(m.url)),
  );
  const imageUrl = firstImage?.url?.trim();
  if (imageUrl && !isVideoUrl(imageUrl)) return imageUrl;

  return '/next.svg';
}

export function getAlbumCoverUrl(
  cover?: string | null,
  media?: MediaLike[] | null,
): string {
  return resolveAlbumCover(cover, media);
}

export function getMediaThumbnailUrl(
  url: string,
  type: 'image' | 'video',
  thumbnail?: string | null,
): string {
  const trimmed = url?.trim() || '';
  if (!trimmed) return '/next.svg';

  if (type === 'image') {
    return isVideoUrl(trimmed) ? getCloudinaryVideoThumbnail(trimmed) : trimmed;
  }

  if (thumbnail?.trim() && !isVideoUrl(thumbnail)) return thumbnail.trim();
  if (isVideoUrl(trimmed)) return getCloudinaryVideoThumbnail(trimmed);
  return '/next.svg';
}

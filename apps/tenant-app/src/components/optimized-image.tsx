'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Skeleton } from './loading-skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized Image Component
 * 
 * Wraps Next.js Image with:
 * - Lazy loading by default
 * - Loading skeleton
 * - Error handling with fallback
 * - Automatic optimization
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  priority = false,
  quality = 75,
  sizes,
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) {
      onLoad();
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) {
      onError();
    }
  };

  // Show error fallback
  if (hasError) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      {/* Image */}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={fill ? { objectFit } : undefined}
        priority={priority}
        quality={quality}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

/**
 * Job Photo Gallery with Lazy Loading
 */
interface PhotoGalleryProps {
  photos: Array<{ url: string; alt?: string }>;
  columns?: 2 | 3 | 4;
}

export function PhotoGallery({ photos, columns = 3 }: PhotoGalleryProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {photos.map((photo, index) => (
        <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
          <OptimizedImage
            src={photo.url}
            alt={photo.alt || `Photo ${index + 1}`}
            fill
            objectFit="cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Avatar with Fallback
 */
interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Get initials from name
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate background color from name
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  const colorIndex = name.charCodeAt(0) % colors.length;
  const bgColor = colors[colorIndex];

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-semibold ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

/**
 * Thumbnail with Click to Expand
 */
interface ThumbnailProps {
  src: string;
  alt: string;
  onClick?: () => void;
}

export function Thumbnail({ src, alt, onClick }: ThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer"
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        sizes="(max-width: 768px) 50vw, 200px"
      />
    </button>
  );
}

/**
 * Logo with Fallback
 */
interface LogoProps {
  src?: string | null;
  companyName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ src, companyName, size = 'md', className = '' }: LogoProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
  };

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gray-200 rounded flex items-center justify-center text-gray-600 font-bold ${className}`}
      >
        {companyName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      <Image
        src={src}
        alt={companyName}
        fill
        className="object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}


/**
 * Client-Side Image Compression Utility
 * 
 * Compresses images before upload to reduce bandwidth and storage costs
 * Uses browser-image-compression library for efficient compression
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  /**
   * Maximum width or height of the output image (default: 1920)
   */
  maxSizeMB?: number;
  
  /**
   * Maximum width in pixels (default: 1920)
   */
  maxWidthOrHeight?: number;
  
  /**
   * Use WebWorker for compression (default: true)
   */
  useWebWorker?: boolean;
  
  /**
   * Initial quality (0-1, default: 0.8)
   */
  initialQuality?: number;
  
  /**
   * File type (default: preserve original)
   */
  fileType?: string;
}

/**
 * Default compression options optimized for web upload
 */
const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Max 1MB file size
  maxWidthOrHeight: 1920, // Max 1920px width/height
  useWebWorker: true, // Boolean, not number
  initialQuality: 0.8, // 80% quality
};

/**
 * Compress a single image file
 * 
 * @param file - The image file to compress
 * @param options - Compression options (optional)
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  // Skip compression for SVG files (they're already optimized)
  if (file.type === 'image/svg+xml') {
    return file;
  }
  
  // Skip compression if file is already small enough
  const maxBytes = (options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB!) * 1024 * 1024;
  if (file.size <= maxBytes) {
    return file;
  }
  
  try {
    const compressedFile = await imageCompression(file, {
      ...DEFAULT_OPTIONS,
      ...options,
    });
    
    console.log(`[image-compression] Compressed ${file.name}:`, {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
    });
    
    return compressedFile;
  } catch (error) {
    console.error('[image-compression] Compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Compress multiple image files
 * 
 * @param files - Array of image files to compress
 * @param options - Compression options (optional)
 * @returns Array of compressed image files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(
    files.map((file) => compressImage(file, options))
  );
}

/**
 * Compress image with progress callback
 * 
 * @param file - The image file to compress
 * @param onProgress - Progress callback (0-100)
 * @param options - Compression options (optional)
 * @returns Compressed image file
 */
export async function compressImageWithProgress(
  file: File,
  onProgress: (progress: number) => void,
  options: CompressionOptions = {}
): Promise<File> {
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    onProgress(100);
    return file;
  }
  
  // Skip compression for SVG files
  if (file.type === 'image/svg+xml') {
    onProgress(100);
    return file;
  }
  
  try {
    const compressedFile = await imageCompression(file, {
      ...DEFAULT_OPTIONS,
      ...options,
      onProgress: (progress) => {
        onProgress(Math.round(progress));
      },
    });
    
    return compressedFile;
  } catch (error) {
    console.error('[image-compression] Compression failed:', error);
    onProgress(100);
    return file;
  }
}

/**
 * Get estimated compressed size without actually compressing
 * 
 * @param file - The image file
 * @param options - Compression options (optional)
 * @returns Estimated compressed size in bytes
 */
export function estimateCompressedSize(
  file: File,
  options: CompressionOptions = {}
): number {
  // Skip for non-images
  if (!file.type.startsWith('image/')) {
    return file.size;
  }
  
  // Skip for SVG
  if (file.type === 'image/svg+xml') {
    return file.size;
  }
  
  const quality = options.initialQuality || DEFAULT_OPTIONS.initialQuality!;
  const maxBytes = (options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB!) * 1024 * 1024;
  
  // Rough estimation: quality * original size, capped at maxBytes
  const estimated = Math.min(file.size * quality, maxBytes);
  
  return Math.round(estimated);
}

/**
 * Check if a file needs compression
 * 
 * @param file - The file to check
 * @param options - Compression options (optional)
 * @returns True if file needs compression
 */
export function needsCompression(
  file: File,
  options: CompressionOptions = {}
): boolean {
  // Non-images don't need compression
  if (!file.type.startsWith('image/')) {
    return false;
  }
  
  // SVG doesn't need compression
  if (file.type === 'image/svg+xml') {
    return false;
  }
  
  // Check if file exceeds max size
  const maxBytes = (options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB!) * 1024 * 1024;
  return file.size > maxBytes;
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}

/**
 * Preset compression options for different use cases
 */
export const COMPRESSION_PRESETS = {
  /**
   * High quality for important images (e.g., product photos)
   */
  HIGH_QUALITY: {
    maxSizeMB: 2,
    maxWidthOrHeight: 2560,
    initialQuality: 0.9,
  },
  
  /**
   * Standard quality for general use (default)
   */
  STANDARD: DEFAULT_OPTIONS,
  
  /**
   * Low quality for thumbnails and previews
   */
  THUMBNAIL: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    initialQuality: 0.7,
  },
  
  /**
   * Very low quality for avatars and icons
   */
  AVATAR: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 400,
    initialQuality: 0.6,
  },
} as const;


/**
 * React Hook for Image Compression
 * 
 * Provides easy-to-use image compression functionality for file uploads
 */

import { useState, useCallback } from 'react';
import {
  compressImage,
  compressImages,
  compressImageWithProgress,
  needsCompression,
  formatFileSize,
  type CompressionOptions,
} from '@/lib/image-compression';

export interface UseImageCompressionOptions extends CompressionOptions {
  /**
   * Auto-compress on file selection (default: true)
   */
  autoCompress?: boolean;
  
  /**
   * Show compression progress (default: false)
   */
  showProgress?: boolean;
}

export interface CompressionState {
  /**
   * Whether compression is in progress
   */
  isCompressing: boolean;
  
  /**
   * Compression progress (0-100)
   */
  progress: number;
  
  /**
   * Compression error if any
   */
  error: Error | null;
  
  /**
   * Original file size in bytes
   */
  originalSize: number | null;
  
  /**
   * Compressed file size in bytes
   */
  compressedSize: number | null;
  
  /**
   * Compression ratio (0-1)
   */
  compressionRatio: number | null;
}

export interface UseImageCompressionReturn {
  /**
   * Compression state
   */
  state: CompressionState;
  
  /**
   * Compress a single file
   */
  compress: (file: File) => Promise<File>;
  
  /**
   * Compress multiple files
   */
  compressMultiple: (files: File[]) => Promise<File[]>;
  
  /**
   * Check if a file needs compression
   */
  shouldCompress: (file: File) => boolean;
  
  /**
   * Format file size for display
   */
  formatSize: (bytes: number) => string;
  
  /**
   * Reset compression state
   */
  reset: () => void;
}

/**
 * Hook for image compression
 * 
 * @param options - Compression options
 * @returns Compression utilities and state
 */
export function useImageCompression(
  options: UseImageCompressionOptions = {}
): UseImageCompressionReturn {
  const [state, setState] = useState<CompressionState>({
    isCompressing: false,
    progress: 0,
    error: null,
    originalSize: null,
    compressedSize: null,
    compressionRatio: null,
  });
  
  const compress = useCallback(
    async (file: File): Promise<File> => {
      // Reset state
      setState({
        isCompressing: true,
        progress: 0,
        error: null,
        originalSize: file.size,
        compressedSize: null,
        compressionRatio: null,
      });
      
      try {
        let compressedFile: File;
        
        if (options.showProgress) {
          compressedFile = await compressImageWithProgress(
            file,
            (progress) => {
              setState((prev) => ({ ...prev, progress }));
            },
            options
          );
        } else {
          compressedFile = await compressImage(file, options);
        }
        
        const ratio = compressedFile.size / file.size;
        
        setState({
          isCompressing: false,
          progress: 100,
          error: null,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          compressionRatio: ratio,
        });
        
        return compressedFile;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Compression failed');
        
        setState({
          isCompressing: false,
          progress: 0,
          error: err,
          originalSize: file.size,
          compressedSize: null,
          compressionRatio: null,
        });
        
        // Return original file on error
        return file;
      }
    },
    [options]
  );
  
  const compressMultiple = useCallback(
    async (files: File[]): Promise<File[]> => {
      setState({
        isCompressing: true,
        progress: 0,
        error: null,
        originalSize: files.reduce((sum, f) => sum + f.size, 0),
        compressedSize: null,
        compressionRatio: null,
      });
      
      try {
        const compressedFiles = await compressImages(files, options);
        
        const originalSize = files.reduce((sum, f) => sum + f.size, 0);
        const compressedSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
        const ratio = compressedSize / originalSize;
        
        setState({
          isCompressing: false,
          progress: 100,
          error: null,
          originalSize,
          compressedSize,
          compressionRatio: ratio,
        });
        
        return compressedFiles;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Compression failed');
        
        setState({
          isCompressing: false,
          progress: 0,
          error: err,
          originalSize: files.reduce((sum, f) => sum + f.size, 0),
          compressedSize: null,
          compressionRatio: null,
        });
        
        // Return original files on error
        return files;
      }
    },
    [options]
  );
  
  const shouldCompress = useCallback(
    (file: File): boolean => {
      return needsCompression(file, options);
    },
    [options]
  );
  
  const reset = useCallback(() => {
    setState({
      isCompressing: false,
      progress: 0,
      error: null,
      originalSize: null,
      compressedSize: null,
      compressionRatio: null,
    });
  }, []);
  
  return {
    state,
    compress,
    compressMultiple,
    shouldCompress,
    formatSize: formatFileSize,
    reset,
  };
}

/**
 * Hook for automatic image compression on file input change
 * 
 * @param options - Compression options
 * @returns File input handler and compression state
 */
export function useAutoImageCompression(
  options: UseImageCompressionOptions = {}
) {
  const compression = useImageCompression(options);
  
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      
      if (files.length === 0) {
        return [];
      }
      
      if (options.autoCompress !== false) {
        return await compression.compressMultiple(files);
      }
      
      return files;
    },
    [compression, options.autoCompress]
  );
  
  return {
    ...compression,
    handleFileChange,
  };
}


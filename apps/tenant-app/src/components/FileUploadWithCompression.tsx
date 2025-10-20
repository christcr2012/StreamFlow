/**
 * File Upload Component with Automatic Image Compression
 * 
 * This component provides a file upload input with automatic client-side image compression.
 * It reduces bandwidth usage by 50-80% and storage costs significantly.
 * 
 * Features:
 * - Automatic compression for images before upload
 * - Progress tracking for large files
 * - Multiple compression presets
 * - Fallback to original file on error
 * - File size display and compression ratio
 * 
 * Usage:
 *   <FileUploadWithCompression
 *     onFilesSelected={(files) => handleUpload(files)}
 *     preset="STANDARD"
 *     multiple
 *   />
 */

'use client';

import { useAutoImageCompression } from '@/hooks/useImageCompression';
import { COMPRESSION_PRESETS } from '@/lib/image-compression';
import { useState } from 'react';

interface FileUploadWithCompressionProps {
  onFilesSelected: (files: File[]) => void | Promise<void>;
  preset?: keyof typeof COMPRESSION_PRESETS;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  className?: string;
  showProgress?: boolean;
  showStats?: boolean;
}

export function FileUploadWithCompression({
  onFilesSelected,
  preset = 'STANDARD',
  multiple = false,
  accept = 'image/*',
  maxFiles = 10,
  className = '',
  showProgress = true,
  showStats = true,
}: FileUploadWithCompressionProps) {
  const [isUploading, setIsUploading] = useState(false);
  
  const compression = useAutoImageCompression({
    preset,
    onProgress: (progress) => {
      console.log('Compression progress:', progress);
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;
    
    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);

    try {
      // Compress images automatically
      const compressedFiles = await compression.handleFileChange(event);
      
      // Call the callback with compressed files
      await onFilesSelected(compressedFiles);
      
      // Reset input
      event.target.value = '';
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to process files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={isUploading || compression.state.isCompressing}
            className="hidden"
          />
          <div className={`
            px-4 py-2 rounded-lg border-2 border-dashed
            ${isUploading || compression.state.isCompressing
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
              : 'bg-white border-blue-300 hover:border-blue-500 hover:bg-blue-50'
            }
            transition-colors
          `}>
            <span className="text-sm font-medium">
              {isUploading || compression.state.isCompressing
                ? 'Processing...'
                : multiple
                ? 'Choose Files'
                : 'Choose File'
              }
            </span>
          </div>
        </label>

        {showStats && compression.state.originalSize && compression.state.compressedSize && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">
              {compression.formatSize(compression.state.originalSize)}
            </span>
            {' → '}
            <span className="font-medium text-green-600">
              {compression.formatSize(compression.state.compressedSize)}
            </span>
            {compression.state.compressionRatio && (
              <span className="ml-2 text-xs text-gray-500">
                ({Math.round((1 - compression.state.compressionRatio) * 100)}% smaller)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgress && compression.state.isCompressing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Compressing images...</span>
            <span>{Math.round(compression.state.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${compression.state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {compression.state.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {compression.state.error}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500">
        <p>
          Images will be automatically compressed before upload.
          {' '}
          Preset: <span className="font-medium">{preset}</span>
          {' '}
          (max {COMPRESSION_PRESETS[preset].maxSizeMB}MB,
          {' '}
          {COMPRESSION_PRESETS[preset].maxWidthOrHeight}px)
        </p>
      </div>
    </div>
  );
}


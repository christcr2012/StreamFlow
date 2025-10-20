'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader } from '@cortiware/ui';
import { Button } from '@cortiware/ui';
import { Input } from '@cortiware/ui';
import { useAutoImageCompression } from '@/hooks/useImageCompression';
import { showToast } from './ui/toast';
import Image from 'next/image';

interface JobPhoto {
  id: string;
  url: string;
  caption: string | null;
  createdAt: Date;
}

interface JobPhotoGalleryProps {
  jobId: string;
  initialPhotos: JobPhoto[];
  onPhotosChange?: () => void;
}

export function JobPhotoGallery({ jobId, initialPhotos, onPhotosChange }: JobPhotoGalleryProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image compression hook
  const compression = useAutoImageCompression({
    preset: 'STANDARD',
    autoCompress: true,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      // Compress image before upload (50-80% size reduction)
      const compressedFiles = await compression.handleFileChange(e);
      const compressedFile = compressedFiles[0] || file;

      const formData = new FormData();
      formData.append('file', compressedFile);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await fetch(`/api/jobs/${jobId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload photo');
      }

      const { photo } = await response.json();
      setPhotos(prev => [photo, ...prev]);
      setCaption('');
      showToast('Photo uploaded successfully', 'success');
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onPhotosChange) {
        onPhotosChange();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}/photos?photoId=${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete photo');
      }

      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      showToast('Photo deleted successfully', 'success');

      if (onPhotosChange) {
        onPhotosChange();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to delete photo', 'error');
    }
  };

  return (
    <Card>
      <CardHeader
        title={`Photos (${photos.length})`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : '+ Add Photo'}
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {/* Upload Form */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Input
            placeholder="Photo caption (optional)"
            value={caption}
            onChange={(value) => setCaption(value)}
            disabled={isUploading}
            fullWidth
          />
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No photos yet. Click &quot;Add Photo&quot; to upload your first photo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square relative bg-gray-100">
                  <Image
                    src={photo.url}
                    alt={photo.caption || 'Job photo'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
                {photo.caption && (
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-600 truncate">{photo.caption}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      handleDelete(photo.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl max-h-full relative">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300"
              >
                ×
              </button>
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Job photo'}
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain"
              />
              {selectedPhoto.caption && (
                <div className="mt-4 text-white text-center">
                  <p className="text-lg">{selectedPhoto.caption}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}


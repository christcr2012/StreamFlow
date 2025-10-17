/**
 * DemoFrame Component
 * Video/demo placeholder with play button
 */

import { ReactNode, useState } from 'react';

export interface DemoFrameProps {
  thumbnail?: string;
  videoUrl?: string;
  title?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
  children?: ReactNode;
  className?: string;
}

export function DemoFrame({
  thumbnail,
  videoUrl,
  title,
  aspectRatio = '16/9',
  children,
  className = '',
}: DemoFrameProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const aspectClasses = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}
    >
      {!isPlaying ? (
        <>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title || 'Demo'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-3)] flex items-center justify-center">
              {children || (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-[var(--text-tertiary)]">Demo Preview</p>
                </div>
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl"
              aria-label="Play video"
            >
              <svg
                className="w-8 h-8 text-[var(--bg-primary)] ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </>
      ) : videoUrl ? (
        <iframe
          src={videoUrl}
          title={title || 'Demo video'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center">
          <p className="text-[var(--text-tertiary)]">No video URL provided</p>
        </div>
      )}
    </div>
  );
}


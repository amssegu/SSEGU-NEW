import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Film, RotateCcw } from 'lucide-react';
import type { MovieItem, MoviePart } from '../types/movie';

interface FirimuPlayerProps {
  movie: MovieItem;
  activePart?: MoviePart;
  onPlayStart?: () => void;
}

export const FirimuPlayer: React.FC<FirimuPlayerProps> = ({
  movie,
  activePart,
  onPlayStart,
}) => {
  const [unlocked, setUnlocked] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = activePart?.videoUrl ?? movie.videoUrl;
  const playerType = activePart?.playerType ?? movie.playerType;
  const youtubeId = activePart?.youtubeId ?? movie.youtubeId;
  const poster = activePart?.poster || movie.poster;
  const backdrop = activePart?.poster || movie.backdrop || movie.poster;
  const playTitle = activePart ? `${movie.displayTitle} — ${activePart.label}` : movie.displayTitle;

  // Reset player state cleanly when switching movie or part/episode
  useEffect(() => {
    setUnlocked(false);
    setStreamError(false);
    setPosterFailed(false);
  }, [movie.id, videoUrl]);

  const handleUnlock = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (unlocked) {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    setUnlocked(true);
    setStreamError(false);
    onPlayStart?.();

    if (playerType === 'video' && videoRef.current) {
      videoRef.current.controls = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleRetryVideo = () => {
    setStreamError(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  const preventRightClick = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };

  const youtubeEmbedUrl =
    playerType === 'youtube' && youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`
      : '';

  return (
    <div className="space-y-3">
      <div
        className={`firimu-video-box ${unlocked ? 'player-unlocked' : ''}`}
        data-video-url={videoUrl}
        data-unlocked={unlocked ? '1' : '0'}
        onContextMenu={preventRightClick}
        onDragStart={preventRightClick}
        onCopy={preventRightClick}
      >
        <div className="firimu-video-inner">
          {/* Poster backdrop shown behind locked player */}
          {!unlocked && backdrop && !posterFailed && (
            <img
              src={backdrop}
              alt={playTitle}
              referrerPolicy="no-referrer"
              onError={() => setPosterFailed(true)}
              className="absolute inset-0 h-full w-full object-cover opacity-55 transition-opacity duration-200"
            />
          )}

          {!unlocked && (
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/50"
              aria-hidden="true"
            />
          )}

          {/* Direct HTML5 Video (MP4 / WebM / OGG / MKV / MOV / M4V) */}
          {playerType === 'video' && videoUrl && (
            <video
              ref={videoRef}
              key={videoUrl}
              src={videoUrl}
              poster={poster || undefined}
              controls={unlocked}
              controlsList="nodownload"
              disablePictureInPicture
              playsInline
              preload="metadata"
              onPlay={() => {
                if (!unlocked && videoRef.current) {
                  videoRef.current.pause();
                }
              }}
              onError={() => {
                if (unlocked) setStreamError(true);
              }}
            />
          )}

          {/* YouTube Embed (loaded only after Red Play Button click) */}
          {playerType === 'youtube' && unlocked && youtubeEmbedUrl && (
            <iframe
              key={youtubeEmbedUrl}
              src={youtubeEmbedUrl}
              title={playTitle}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}

          {/* External Compatible Iframe (loaded only after Red Play Button click) */}
          {playerType === 'iframe' && unlocked && videoUrl && (
            <iframe
              key={videoUrl}
              src={videoUrl}
              title={playTitle}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )}

          {/* Fallback when no video source is embedded */}
          {playerType === 'none' && (
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-6 text-center">
              <Film className="mb-3 h-10 w-10 text-zinc-400" aria-hidden="true" />
              <p className="font-display text-lg font-semibold text-white">
                Video stream is currently unavailable
              </p>
              <p className="mt-1 max-w-md text-sm text-zinc-300">
                No playable video source was found for this title yet. Please check back later or browse other releases.
              </p>
            </div>
          )}

          {/* Stream playback error recovery */}
          {streamError && unlocked && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <AlertCircle className="mb-3 h-9 w-9 text-[#E50914]" aria-hidden="true" />
              <p className="font-display text-lg font-semibold text-white">
                Unable to play video stream
              </p>
              <p className="mt-1 max-w-md text-sm text-zinc-400">
                The media server may be temporarily busy or unreachable on your network.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetryVideo}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#E50914] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#FF121F]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Retry Playback
                </button>
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
                >
                  Direct Stream Link
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          )}

          {/* Signature FIRIMU Red Play Button */}
          {!unlocked && playerType !== 'none' && (
            <button
              type="button"
              className="ready-play-btn"
              aria-label={`Play ${playTitle}`}
              onClick={handleUnlock}
            />
          )}
        </div>
      </div>

      {/* Helper bar for iframe embeds in case third-party hosts block framing */}
      {playerType === 'iframe' && unlocked && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#121218] px-4 py-3 text-xs text-zinc-400">
          <span>
            Playing embedded FIRIMU player. If the embed is blocked by your browser or network, open it directly.
          </span>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-white underline-offset-4 hover:underline"
          >
            Open Video Source
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
};

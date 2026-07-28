'use client';

import { useEffect, useRef } from 'react';
import { Video } from 'lucide-react';

export function VideoGrid({ peers, localStream, userId }: { peers: Map<string, { video?: MediaStream; audio?: MediaStream }>; localStream: MediaStream | null; userId: string }) {
  const entries = Array.from(peers.entries());
  const showLocal = !!localStream;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {showLocal && (
        <VideoTile key="local" stream={localStream} label={`You (${userId})`} />
      )}
      {entries.map(([peerId, streams]) => (
        <VideoTile key={peerId} stream={streams.video} label={peerId} />
      ))}
      {entries.length === 0 && !showLocal && (
        <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-muted-foreground">
          <Video className="mb-2 h-8 w-8" />
          <p className="text-sm">Waiting for participants...</p>
        </div>
      )}
    </div>
  );
}

function VideoTile({ stream, label }: { stream: MediaStream | undefined; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isLocal = label.startsWith('You');

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;

    el.srcObject = stream;

    const playVideo = () => {
      if (!el) return;
      el.play().catch((err) => {
        console.warn(`[VideoTile] play() failed for ${label}:`, err?.message || err);
        if (!isLocal) {
          el.muted = true;
          el.play().catch((e) => console.error(`[VideoTile] muted fallback play() failed for ${label}:`, e?.message || e));
        }
      });
    };

    playVideo();

    const track = stream.getVideoTracks()[0];
    if (track) {
      track.addEventListener('unmute', playVideo);
    }

    return () => {
      if (track) {
        track.removeEventListener('unmute', playVideo);
      }
      if (el) {
        el.srcObject = null;
      }
    };
  }, [stream, label, isLocal]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className="h-48 w-full object-cover md:h-56" />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-muted md:h-56">
          <span className="text-xs text-muted-foreground">No video</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">{label}</div>
    </div>
  );
}

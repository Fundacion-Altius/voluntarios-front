'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoGrid } from '@/components/video/VideoGrid';
import { VideoControls } from '@/components/video/VideoControls';
import { ActiveSpeakerIndicator } from '@/components/video/ActiveSpeakerIndicator';
import { useMediasoupRoom } from '@/hooks/useMediasoupRoom';
import { useAttentionEstimation } from '@/hooks/useAttentionEstimation';
import { Loader2 } from 'lucide-react';

export default function VideoRoomPage({ params }: { params: { roomId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const attentionCanvasRef = useRef<HTMLCanvasElement>(null);
  const [role, setRole] = useState<'host' | 'guest'>('guest');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { state, startLocalStream, toggleMic, toggleCamera, toggleScreenShare, join, cleanup } = useMediasoupRoom(
    params.roomId,
    role,
  );

  const attention = useAttentionEstimation(localVideoRef, attentionCanvasRef, !!state.localStream && !joining);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  useEffect(() => {
    if (state.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = state.localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [state.localStream]);

  const handleJoin = async () => {
    if (!session?.authToken) return;
    setJoining(true);
    setJoinError(null);
    try {
      await startLocalStream(true, true);
      await join(session?.authToken);
    } catch (err: any) {
      setJoinError(err?.message || err?.toString() || 'Failed to join room');
      cleanup();
      setJoining(false);
    }
  };

  const handleLeave = () => {
    cleanup();
    router.push('/portal');
  };

  if (joining || state.localStream) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Room {params.roomId}</CardTitle>
            <ActiveSpeakerIndicator attention={attention} />
          </CardHeader>
          <CardContent className="space-y-4">
            <VideoGrid peers={state.peers} localStream={state.localStream} userId={state.userId} />
            <VideoControls
              isMicOn={state.isMicOn}
              isCameraOn={state.isCameraOn}
              isScreenSharing={state.isScreenSharing}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              onLeave={handleLeave}
            />
            <canvas ref={attentionCanvasRef} className="hidden" />
            <video ref={localVideoRef} className="hidden" playsInline muted />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Join video room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Room ID: {params.roomId}</p>
          <div className="flex items-center gap-2">
            <Button variant={role === 'guest' ? 'secondary' : 'outline'} onClick={() => setRole('guest')}>
              Join as guest
            </Button>
            <Button variant={role === 'host' ? 'secondary' : 'outline'} onClick={() => setRole('host')}>
              Join as host
            </Button>
          </div>
          <Button className="w-full" onClick={handleJoin} disabled={!session?.authToken || joining}>
            {joining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</> : 'Join room'}
          </Button>
          {joinError && <p className="text-sm text-destructive">{joinError}</p>}
          {!session?.authToken && <p className="text-sm text-destructive">You must be logged in to join</p>}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

// ATENCIÓN: Todo el texto de UI debe estar en español. No agregar texto en inglés.

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoGrid } from '@/components/video/VideoGrid';
import { VideoControls } from '@/components/video/VideoControls';
import { ActiveSpeakerIndicator } from '@/components/video/ActiveSpeakerIndicator';
import { useMediasoupRoom } from '@/hooks/useMediasoupRoom';
import { Loader2 } from 'lucide-react';

export default function VideoRoomPage({ params }: { params: { roomId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('portal.sala');
  const [role, setRole] = useState<'host' | 'guest'>('guest');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { state, startLocalStream, toggleMic, toggleCamera, toggleScreenShare, join, cleanup, disconnect } =
    useMediasoupRoom(params.roomId, role);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleJoin = async () => {
    if (!session?.authToken) return;
    setJoining(true);
    setJoinError(null);
    try {
      await startLocalStream(true, true);
      await join(session?.authToken);
    } catch (err: any) {
      setJoinError(err?.message || err?.toString() || t('errorUnirse'));
      disconnect();
      setJoining(false);
    }
  };

  const handleLeave = () => {
    cleanup();
    router.push('/portal');
  };

  if (state.localStream) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('titulo')} {params.roomId}</CardTitle>
            <ActiveSpeakerIndicator connected={state.connected} />
          </CardHeader>
          <CardContent className="space-y-4">
            <VideoGrid peers={state.peers} localStream={state.localStream} userId={state.userId} />
            {(joinError || state.error) && (
              <p className="text-sm text-destructive">{joinError || state.error}</p>
            )}
            <VideoControls
              isMicOn={state.isMicOn}
              isCameraOn={state.isCameraOn}
              isScreenSharing={state.isScreenSharing}
              cameraRecoveryNeedsGesture={state.cameraRecoveryNeedsGesture}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              onLeave={handleLeave}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('unirseSala')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('salaId')}: {params.roomId}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button className="w-full sm:w-auto" variant={role === 'guest' ? 'secondary' : 'outline'} onClick={() => setRole('guest')}>
              {t('unirseParticipante')}
            </Button>
            <Button className="w-full sm:w-auto" variant={role === 'host' ? 'secondary' : 'outline'} onClick={() => setRole('host')}>
              {t('unirseAnfitrion')}
            </Button>
          </div>
          <Button className="w-full" onClick={handleJoin} disabled={!session?.authToken || joining}>
            {joining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('uniendose')}</> : t('unirseSalaBtn')}
          </Button>
          {joinError && <p className="text-sm text-destructive">{joinError}</p>}
          {!session?.authToken && <p className="text-sm text-destructive">{t('debesIniciarSesion')}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

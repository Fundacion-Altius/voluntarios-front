'use client';

// ATENCIÓN: Todo el texto de UI debe estar en español. No agregar texto en inglés.

import { apiGet } from '@/app/lib/csrf';
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

type RoomMode = 'meeting' | 'livestream';

export default function VideoRoomPage({ params }: { params: { roomId: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('portal.sala');
  const [role, setRole] = useState<'host' | 'guest'>('guest');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [mode, setMode] = useState<RoomMode>('meeting');
  const [inCall, setInCall] = useState(false);

  const { state, startLocalStream, toggleMic, toggleCamera, toggleScreenShare, join, cleanup, disconnect } =
    useMediasoupRoom(params.roomId, role);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet(`/api/video/rooms/${params.roomId}`);
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as { data?: { mode?: string; contextId?: string } };
        const m = body.data?.mode;
        if (m === 'livestream' || String(body.data?.contextId || '').startsWith('livestream:')) {
          setMode('livestream');
        }
      } catch {
        // keep default meeting
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.roomId]);

  const isLivestreamViewer = mode === 'livestream' && role === 'guest';

  const handleJoin = async () => {
    if (!session?.authToken) return;
    setJoining(true);
    setJoinError(null);
    try {
      if (!isLivestreamViewer) {
        await startLocalStream(true, true);
      }
      await join(session?.authToken);
      setInCall(true);
    } catch (err: any) {
      setJoinError(err?.message || err?.toString() || t('errorUnirse'));
      disconnect();
      setInCall(false);
      setJoining(false);
    }
  };

  const handleLeave = () => {
    cleanup();
    setInCall(false);
    router.push('/portal/video');
  };

  if (inCall || state.localStream || state.connected) {
    return (
      <InCallView
        roomId={params.roomId}
        mode={mode}
        isLivestreamViewer={isLivestreamViewer}
        state={state}
        joinError={joinError}
        controls={{ toggleMic, toggleCamera, toggleScreenShare }}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <JoinView
      roomId={params.roomId}
      mode={mode}
      role={role}
      setRole={setRole}
      joining={joining}
      joinError={joinError}
      hasToken={!!session?.authToken}
      onJoin={handleJoin}
    />
  );
}

type RoomState = ReturnType<typeof useMediasoupRoom>['state'];

function InCallView({ roomId, mode, isLivestreamViewer, state, joinError, controls, onLeave }: {
  roomId: string;
  mode: RoomMode;
  isLivestreamViewer: boolean;
  state: RoomState;
  joinError: string | null;
  controls: { toggleMic: () => void; toggleCamera: () => void; toggleScreenShare: () => void };
  onLeave: () => void;
}) {
  const t = useTranslations('portal.sala');
  const errorText = joinError || state.error;
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {t('titulo')} {roomId}
            </CardTitle>
            {mode === 'livestream' ? (
              <p className="text-xs text-muted-foreground">
                {isLivestreamViewer ? t('modoEspectador') : t('modoEmision')}
              </p>
            ) : null}
          </div>
          <ActiveSpeakerIndicator connected={state.connected} />
        </CardHeader>
        <CardContent className="space-y-4">
          <VideoGrid peers={state.peers} localStream={state.localStream} userId={state.userId} />
          {errorText && <p className="text-sm text-destructive">{errorText}</p>}
          {isLivestreamViewer ? (
            <Button type="button" variant="destructive" onClick={onLeave}>
              {t('salir')}
            </Button>
          ) : (
            <VideoControls
              isMicOn={state.isMicOn}
              isCameraOn={state.isCameraOn}
              isScreenSharing={state.isScreenSharing}
              cameraRecoveryNeedsGesture={state.cameraRecoveryNeedsGesture}
              onToggleMic={controls.toggleMic}
              onToggleCamera={controls.toggleCamera}
              onToggleScreenShare={controls.toggleScreenShare}
              onLeave={onLeave}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function JoinView({ roomId, mode, role, setRole, joining, joinError, hasToken, onJoin }: {
  roomId: string;
  mode: RoomMode;
  role: 'host' | 'guest';
  setRole: (r: 'host' | 'guest') => void;
  joining: boolean;
  joinError: string | null;
  hasToken: boolean;
  onJoin: () => void;
}) {
  const t = useTranslations('portal.sala');
  const live = mode === 'livestream';
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('unirseSala')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('salaId')}: {roomId}
          </p>
          {live ? <p className="text-sm text-muted-foreground">{t('livestreamHint')}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="w-full sm:w-auto"
              variant={role === 'guest' ? 'secondary' : 'outline'}
              onClick={() => setRole('guest')}
            >
              {live ? t('unirseEspectador') : t('unirseParticipante')}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant={role === 'host' ? 'secondary' : 'outline'}
              onClick={() => setRole('host')}
            >
              {live ? t('unirseEmisor') : t('unirseAnfitrion')}
            </Button>
          </div>
          <Button className="w-full" onClick={onJoin} disabled={!hasToken || joining}>
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('uniendose')}
              </>
            ) : (
              t('unirseSalaBtn')
            )}
          </Button>
          {joinError && <p className="text-sm text-destructive">{joinError}</p>}
          {!hasToken && <p className="text-sm text-destructive">{t('debesIniciarSesion')}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

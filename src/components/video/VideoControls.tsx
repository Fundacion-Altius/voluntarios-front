'use client';

import { Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VideoControls({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  cameraRecoveryNeedsGesture,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  cameraRecoveryNeedsGesture?: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}) {
  const cameraVariant = cameraRecoveryNeedsGesture ? 'destructive' : isCameraOn ? 'secondary' : 'destructive';
  const cameraLabel = cameraRecoveryNeedsGesture
    ? 'Toca para reconectar la cámara'
    : isCameraOn
      ? 'Stop camera'
      : 'Start camera';
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant={isMicOn ? 'secondary' : 'destructive'} size="icon" onClick={onToggleMic} aria-label={isMicOn ? 'Mute' : 'Unmute'}>
        {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      <Button variant={cameraVariant} size="icon" onClick={onToggleCamera} aria-label={cameraLabel} className={cameraRecoveryNeedsGesture ? 'animate-pulse border-2 border-yellow-400' : ''}>
        {cameraRecoveryNeedsGesture ? <AlertTriangle className="h-4 w-4 text-yellow-300" /> : isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
      </Button>
      <Button variant={isScreenSharing ? 'secondary' : 'outline'} size="icon" onClick={onToggleScreenShare} aria-label="Toggle screen share">
        <MonitorUp className="h-4 w-4" />
      </Button>
      <Button variant="destructive" size="icon" onClick={onLeave} aria-label="Leave call">
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  );
}

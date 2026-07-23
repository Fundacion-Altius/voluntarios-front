'use client';

import { Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VideoControls({
  isMicOn,
  isCameraOn,
  isScreenSharing,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: {
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant={isMicOn ? 'secondary' : 'destructive'} size="icon" onClick={onToggleMic} aria-label={isMicOn ? 'Mute' : 'Unmute'}>
        {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      <Button variant={isCameraOn ? 'secondary' : 'destructive'} size="icon" onClick={onToggleCamera} aria-label={isCameraOn ? 'Stop camera' : 'Start camera'}>
        {isCameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
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

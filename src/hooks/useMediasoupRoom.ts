'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type RoomRole = 'host' | 'guest';

type MediasoupRoomState = {
  roomId: string;
  userId: string;
  peers: Map<string, { video?: MediaStream; audio?: MediaStream }>;
  localStream: MediaStream | null;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  error: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;
const TURN_HOST = process.env.NEXT_PUBLIC_TURN_HOST || 'localhost';
const TURN_PORT = Number(process.env.NEXT_PUBLIC_TURN_PORT || 3478);
const TURN_USERNAME = process.env.NEXT_PUBLIC_TURN_USERNAME || 'voluntarios';
const TURN_PASSWORD = process.env.NEXT_PUBLIC_TURN_PASSWORD || 'turnpassword';

function buildIceServers(): RTCIceServer[] {
  return [
    { urls: `turn:${TURN_HOST}:${TURN_PORT}?transport=udp`, username: TURN_USERNAME, credential: TURN_PASSWORD },
    { urls: `turn:${TURN_HOST}:${TURN_PORT}?transport=tcp`, username: TURN_USERNAME, credential: TURN_PASSWORD },
    { urls: 'stun:stun.l.google.com:19302' },
  ];
}

export function useMediasoupRoom(roomId: string, role: RoomRole = 'guest') {
  const [state, setState] = useState<MediasoupRoomState>({
    roomId,
    userId: '',
    peers: new Map(),
    localStream: null,
    isMicOn: false,
    isCameraOn: false,
    isScreenSharing: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const joinedRef = useRef(false);
  const userIdRef = useRef<string>('');

  const setStatePartial = useCallback((partial: Partial<MediasoupRoomState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const updatePeer = useCallback((peerId: string, stream: MediaStream, kind: 'video' | 'audio') => {
    setState((prev) => {
      const peers = new Map(prev.peers);
      const existing = peers.get(peerId) || {};
      peers.set(peerId, { ...existing, [kind]: stream });
      return { ...prev, peers };
    });
  }, []);

  const removePeerStream = useCallback((peerId: string, kind: 'video' | 'audio') => {
    setState((prev) => {
      const peers = new Map(prev.peers);
      const existing = peers.get(peerId);
      if (existing && existing[kind]) {
        const next = { ...existing };
        delete next[kind];
        if (Object.keys(next).length === 0) peers.delete(peerId);
        else peers.set(peerId, next);
      }
      return { ...prev, peers };
    });
  }, []);

  const sendToWs = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const closePeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    removePeerStream(peerId, 'video');
    removePeerStream(peerId, 'audio');
  }, [removePeerStream]);

  const setupPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
      peerConnectionsRef.current.set(peerId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendToWs({ type: 'ice-candidate', candidate: event.candidate.toJSON(), targetPeerId: peerId });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        const kind = event.track.kind as 'video' | 'audio';
        updatePeer(peerId, stream, kind);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          closePeerConnection(peerId);
        }
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      return pc;
    },
    [sendToWs, updatePeer, closePeerConnection],
  );

  const handleWsMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'new-router-rtp-capabilities':
            break;
          case 'new-transport':
            sendToWs({ type: 'connect-transport', transportId: msg.transportId });
            break;
          case 'new-peers':
          case 'new-peer': {
            const peers = Array.isArray(msg.peers) ? msg.peers : msg.id ? [msg] : [];
            for (const peer of peers) {
              if (peer.id && peer.id !== userIdRef.current && !peerConnectionsRef.current.has(peer.id)) {
                setupPeerConnection(peer.id);
              }
            }
            break;
          }
          case 'peer-left':
            closePeerConnection(msg.from);
            break;
          case 'call-ended':
            setStatePartial({ error: 'This call has ended' });
            break;
          default:
            break;
        }
      } catch {}
    },
    [setupPeerConnection, closePeerConnection, sendToWs, setStatePartial],
  );

  const startLocalStream = useCallback(async (withVideo = true, withAudio = true): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: withVideo ? { width: 640, height: 480 } : false,
      audio: withAudio,
    });
    localStreamRef.current = stream;
    setStatePartial({ localStream: stream });
    return stream;
  }, [setStatePartial]);

  const toggleMic = useCallback(async () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setStatePartial({ isMicOn: audioTrack.enabled });
  }, [setStatePartial]);

  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setStatePartial({ isCameraOn: videoTrack.enabled });
  }, [setStatePartial]);

  const toggleScreenShare = useCallback(async () => {
    if (!screenStreamRef.current) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      setStatePartial({ isScreenSharing: true });
      screenTrack.onended = () => {
        screenStreamRef.current = null;
        setStatePartial({ isScreenSharing: false });
      };
    } else {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setStatePartial({ isScreenSharing: false });
    }
  }, [setStatePartial]);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    joinedRef.current = false;
  }, []);

  const join = useCallback(async () => {
    if (!roomId) return;
    cleanup();
    const wsUrl = `${API_URL.replace(/^http/, 'ws')}/ws/video`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    userIdRef.current = `u_${Math.random().toString(36).slice(2, 8)}`;
    setStatePartial({ userId: userIdRef.current });
    joinedRef.current = true;

    ws.onopen = async () => {
      sendToWs({ type: 'video.join', roomId, role });
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      cleanup();
    };

    ws.onerror = () => {
      setStatePartial({ error: 'WebSocket connection failed' });
    };
  }, [API_URL, roomId, role, sendToWs, handleWsMessage, setStatePartial, cleanup]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    state,
    startLocalStream,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    sendToWs,
    handleWsMessage,
    join,
    cleanup,
    userIdRef,
    joinedRef,
    localStreamRef,
  };
}

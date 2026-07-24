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
function deriveWsUrl(): string {
  try {
    const url = new URL(API_URL);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}`;
  } catch {
    return 'ws://localhost:3001';
  }
}

const WS_BASE = deriveWsUrl();
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

  const sendSignal = useCallback((targetPeerId: string, data: Record<string, unknown>) => {
    sendToWs({ type: 'video.signal', roomId, data });
  }, [sendToWs, roomId]);

  const closePeerConnection = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    removePeerStream(peerId, 'video');
    removePeerStream(peerId, 'audio');
  }, [removePeerStream]);

  const startNegotiation = useCallback(async (pc: RTCPeerConnection, peerId: string) => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(peerId, { type: 'offer', sdp: JSON.parse(JSON.stringify(pc.localDescription)) });
    } catch {}
  }, [sendSignal]);

  const setupPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
      peerConnectionsRef.current.set(peerId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, { type: 'ice-candidate', candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (!stream) return;
        const kind = event.track.kind as 'video' | 'audio';
        updatePeer(peerId, stream, kind);
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
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
    [sendSignal, updatePeer, closePeerConnection],
  );

  const handleWsMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'signal': {
            const data = msg.data as Record<string, unknown> | undefined;
            const from = msg.from as string | undefined;
            if (!from || !data || from === userIdRef.current) break;
            const sdp = data.sdp as { type: string; sdp: string } | undefined;
            const candidate = data.candidate as RTCIceCandidateInit | undefined;

            try {
              if (sdp) {
                let pc = peerConnectionsRef.current.get(from);
                if (!pc) {
                  pc = setupPeerConnection(from);
                }
                if (sdp.type === 'offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sdp as RTCSessionDescriptionInit));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  sendSignal(from, { type: 'answer', sdp: JSON.parse(JSON.stringify(pc.localDescription)) });
                } else if (sdp.type === 'answer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sdp as RTCSessionDescriptionInit));
                }
              }
              if (candidate) {
                const pc = peerConnectionsRef.current.get(from);
                if (pc && pc.remoteDescription) {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
              }
            } catch {}
            break;
          }
          case 'new-peers':
          case 'new-peer':
          case 'peer-joined': {
            const peers = Array.isArray(msg.peers) ? msg.peers : msg.id ? [msg] : msg.from ? [{ id: msg.from }] : [];
            for (const peer of peers) {
              if (peer.id && peer.id !== userIdRef.current && !peerConnectionsRef.current.has(peer.id)) {
                const pc = setupPeerConnection(peer.id);
                startNegotiation(pc, peer.id);
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
    [setupPeerConnection, closePeerConnection, sendSignal, setStatePartial, startNegotiation],
  );

  const startLocalStream = useCallback(async (withVideo = true, withAudio = true): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: withVideo ? { width: 640, height: 480 } : false,
      audio: withAudio,
    });
    localStreamRef.current = stream;
    setStatePartial({ localStream: stream, isMicOn: withAudio, isCameraOn: withVideo });
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

  const cleanupConnections = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    joinedRef.current = false;
  }, []);

  const cleanup = useCallback(() => {
    cleanupConnections();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
  }, [cleanupConnections]);

  const join = useCallback(async (authToken?: string) => {
    if (!roomId) return;
    cleanupConnections();
    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : '';
    const ws = new WebSocket(`${WS_BASE}/ws/video${tokenParam}`);
    wsRef.current = ws;
    userIdRef.current = `u_${Math.random().toString(36).slice(2, 8)}`;
    setStatePartial({ userId: userIdRef.current });
    joinedRef.current = true;

    ws.onopen = async () => {
      sendToWs({ type: 'video.join', roomId, role });
    };

    ws.onmessage = handleWsMessage;

    ws.onclose = () => {
      cleanupConnections();
    };

    ws.onerror = () => {
      setStatePartial({ error: 'WebSocket connection failed' });
    };
  }, [roomId, role, sendToWs, handleWsMessage, setStatePartial, cleanupConnections]);

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

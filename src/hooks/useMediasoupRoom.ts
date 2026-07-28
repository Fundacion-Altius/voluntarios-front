'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Device } from 'mediasoup-client';
import type { Transport, Producer, Consumer, RtpCapabilities, DtlsParameters } from 'mediasoup-client/types';
import { getApiBaseUrl } from '@/lib/apiUrl';

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
  connected: boolean;
  cameraRecoveryNeedsGesture: boolean;
};

function deriveWsUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }
  }
  const api = getApiBaseUrl();
  try {
    const url = new URL(api);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}`;
  } catch {
    return 'ws://localhost:3001';
  }
}

const WS_BASE = deriveWsUrl();

function turnHost(): string {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h !== 'localhost' && h !== '127.0.0.1') return h;
  }
  return process.env.NEXT_PUBLIC_TURN_HOST || 'localhost';
}
const TURN_HOST = turnHost();
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
    connected: false,
    cameraRecoveryNeedsGesture: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const producerRef = useRef<Producer | null>(null);
  const videoProducerRef = useRef<Producer | null>(null);
  const screenProducerRef = useRef<Producer | null>(null);
  const consumersRef = useRef<Map<string, Consumer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const joinedRef = useRef(false);
  const userIdRef = useRef<string>('');

  const monitorCleanupRef = useRef<(() => void) | null>(null);
  const setupTrackMonitorRef = useRef<(track: MediaStreamTrack) => void>();

  const localProducerIdsRef = useRef<Set<string>>(new Set());

  const pendingProducersRef = useRef<Array<{ peerId: string; producerId: string; kind: string }>>([]);
  const resolveTransportSend = useRef<((d: unknown) => void) | null>(null);
  const resolveTransportRecv = useRef<((d: unknown) => void) | null>(null);
  const resolveRouterCaps = useRef<((caps: RtpCapabilities) => void) | null>(null);

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

  const setPeerTrack = useCallback((peerId: string, track: MediaStreamTrack, kind: 'video' | 'audio') => {
    setState((prev) => {
      const peers = new Map(prev.peers);
      const existing = peers.get(peerId) || {};
      const currentVideo = existing.video;
      const currentAudio = existing.audio;

      let allTracks: MediaStreamTrack[] = [track];
      if (kind === 'video' && currentAudio) {
        allTracks = [...currentAudio.getAudioTracks(), track];
      } else if (kind === 'audio' && currentVideo) {
        allTracks = [...currentVideo.getVideoTracks(), track];
      }

      const stream = new MediaStream(allTracks);
      peers.set(peerId, { ...existing, [kind]: stream, video: stream.getVideoTracks().length > 0 ? stream : existing.video, audio: stream.getAudioTracks().length > 0 ? stream : existing.audio });
      return { ...prev, peers };
    });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    setState((prev) => {
      const peers = new Map(prev.peers);
      peers.delete(peerId);
      return { ...prev, peers };
    });
  }, []);

  const sendToWs = useCallback((payload: Record<string, unknown>) => {
    wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify(payload));
  }, []);

  const sendSignal = useCallback((data: Record<string, unknown>) => {
    sendToWs({ type: 'video.signal', roomId, data });
  }, [sendToWs, roomId]);

  const connectTransport = useCallback((transport: Transport, direction: 'send' | 'recv'): void => {
    (transport as any).on('connect', ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, callback: () => void, _errback: (err: Error) => void) => {
      sendSignal({ type: 'connect-transport', transportId: transport.id, dtlsParameters });
      callback();
    });
    if (direction === 'send') {
      (transport as any).on('produce', ({ kind, rtpParameters }: { kind: string; rtpParameters: unknown }, callback: (data: { id: string }) => void, _errback: (err: Error) => void) => {
        sendSignal({ type: 'produce', transportId: transport.id, kind, rtpParameters });
        callback({ id: '' });
      });
    }
  }, [sendSignal]);

  const handleWsMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const rawMsg = JSON.parse(event.data);
        const msg = (rawMsg.type === 'signal' && rawMsg.data && typeof rawMsg.data === 'object') ? rawMsg.data : rawMsg;
        switch (msg.type) {
          case 'new-router-rtp-capabilities': {
            const resolve = resolveRouterCaps.current;
            if (resolve) {
              resolveRouterCaps.current = null;
              resolve(msg.rtpCapabilities as RtpCapabilities);
            }
            break;
          }
          case 'new-transport': {
            const resolveSend = resolveTransportSend.current;
            const resolveRecv = resolveTransportRecv.current;
            if (resolveSend && !sendTransportRef.current) {
              resolveTransportSend.current = null;
              resolveSend(msg);
            } else if (resolveRecv) {
              resolveTransportRecv.current = null;
              resolveRecv(msg);
            }
            break;
          }
          case 'new-producer': {
            const isSelf = (msg.peerId && msg.peerId === userIdRef.current) || localProducerIdsRef.current.has(msg.producerId as string);
            if (isSelf) break;
            const dev = deviceRef.current;
            const recv = recvTransportRef.current;
            if (!dev || !recv) {
              pendingProducersRef.current.push({ peerId: msg.peerId as string, producerId: msg.producerId as string, kind: msg.kind as string });
              break;
            }
            sendSignal({ type: 'consume', transportId: recv.id, producerId: msg.producerId, peerId: msg.peerId, rtpCapabilities: (dev as any).rtpCapabilities });
            break;
          }
          case 'new-consumer': {
            if (consumersRef.current.has(msg.consumerId)) break;
            if (msg.peerId && msg.peerId === userIdRef.current) break;
            const recv = recvTransportRef.current;
            if (!recv) break;
            const consumer = await (recv as any).consume({
              id: msg.consumerId,
              producerId: msg.producerId,
              kind: msg.kind,
              rtpParameters: msg.rtpParameters,
            });
            consumer.observer.on('trackchange', () => {
              if (consumer.track) {
                setPeerTrack(msg.peerId as string, consumer.track, msg.kind as 'video' | 'audio');
              }
            });
            if (consumer.track) {
              setPeerTrack(msg.peerId as string, consumer.track, msg.kind as 'video' | 'audio');
            }
            consumersRef.current.set(consumer.id, consumer);
            break;
          }
          case 'peer-left':
            removePeer(msg.from);
            break;
          case 'call-ended':
            setStatePartial({ error: 'This call has ended' });
            break;
          default:
            break;
        }
      } catch {}
    },
    [setStatePartial, removePeer, updatePeer, setPeerTrack, sendSignal],
  );

  const startLocalStream = useCallback(async (withVideo = true, withAudio = true): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: withVideo ? { width: 640, height: 480 } : false,
      audio: withAudio,
    });
    localStreamRef.current = stream;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        console.warn('[video-instrument] Video track ended. readyState:', videoTrack.readyState, 'muted:', videoTrack.muted);
      });
      videoTrack.addEventListener('mute', () => {
        console.warn('[video-instrument] Video track mute event. readyState:', videoTrack.readyState, 'muted:', videoTrack.muted);
      });
      videoTrack.addEventListener('unmute', () => {
        console.warn('[video-instrument] Video track unmute event. readyState:', videoTrack.readyState, 'muted:', videoTrack.muted);
      });
      setupTrackMonitorRef.current?.(videoTrack);
    }
    setStatePartial({ localStream: stream, isMicOn: withAudio, isCameraOn: withVideo });
    if (sendTransportRef.current && producerRef.current === null) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        producerRef.current = await sendTransportRef.current.produce({ track: audioTrack });
      }
    }
    return stream;
  }, [setStatePartial]);

  const toggleMic = useCallback(async () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) return;
    console.warn('toggleMic: audioTrack.readyState:', audioTrack.readyState, 'muted:', audioTrack.muted);
    if (audioTrack.readyState !== 'live') {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        const newTrack = newStream.getAudioTracks()[0];
        audioTrack.stop();
        if (producerRef.current) {
          await producerRef.current.replaceTrack({ track: newTrack });
          console.log('toggleMic: replaceTrack on producer succeeded');
        }
        const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
        if (oldAudioTrack) localStreamRef.current.removeTrack(oldAudioTrack);
        localStreamRef.current.addTrack(newTrack);
        setStatePartial({ isMicOn: true });
        return;
      } catch (err: any) {
        console.error('toggleMic: getUserMedia failed:', { name: err.name, message: err.message });
        setStatePartial({ error: err?.message ?? 'No se pudo recuperar el micrófono' });
        return;
      }
    }
    audioTrack.enabled = !audioTrack.enabled;
    setStatePartial({ isMicOn: audioTrack.enabled });
  }, [setStatePartial]);

  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;
    console.warn('toggleCamera: videoTrack.readyState:', videoTrack.readyState, 'muted:', videoTrack.muted);
    if (videoTrack.readyState !== 'live') {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        const newTrack = newStream.getVideoTracks()[0];
        videoTrack.stop();
        if (videoProducerRef.current) {
          await videoProducerRef.current.replaceTrack({ track: newTrack });
          console.log('toggleCamera: replaceTrack on producer succeeded');
        }
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) localStreamRef.current.removeTrack(oldVideoTrack);
        localStreamRef.current.addTrack(newTrack);
        setupTrackMonitorRef.current?.(newTrack);
        setStatePartial({ isCameraOn: true, cameraRecoveryNeedsGesture: false });
        return;
      } catch (err: any) {
        console.error('toggleCamera: getUserMedia failed:', { name: err.name, message: err.message });
        setStatePartial({ error: err?.message ?? 'No se pudo recuperar la cámara' });
        return;
      }
    }
    videoTrack.enabled = !videoTrack.enabled;
    setStatePartial({ isCameraOn: videoTrack.enabled, cameraRecoveryNeedsGesture: false });
  }, [setStatePartial]);

  const toggleScreenShare = useCallback(async () => {
    if (!screenStreamRef.current) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      setStatePartial({ isScreenSharing: true });
      if (sendTransportRef.current) {
        screenProducerRef.current = await sendTransportRef.current.produce({ track: screenTrack });
      }
      screenTrack.onended = () => {
        screenProducerRef.current?.close();
        screenProducerRef.current = null;
        screenStreamRef.current = null;
        setStatePartial({ isScreenSharing: false });
      };
    } else {
      screenProducerRef.current?.close();
      screenProducerRef.current = null;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setStatePartial({ isScreenSharing: false });
    }
  }, [setStatePartial]);

  const cleanupConnections = useCallback(() => {
    producerRef.current?.close();
    producerRef.current = null;
    videoProducerRef.current?.close();
    videoProducerRef.current = null;
    screenProducerRef.current?.close();
    screenProducerRef.current = null;
    consumersRef.current.forEach((c) => c.close());
    consumersRef.current.clear();
    sendTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current?.close();
    recvTransportRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    deviceRef.current = null;
    joinedRef.current = false;
    resolveTransportSend.current = null;
    resolveTransportRecv.current = null;
    resolveRouterCaps.current = null;
    localProducerIdsRef.current.clear();
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
    joinedRef.current = true;

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('join timeout')), 15000);

      ws.onopen = async () => {
        try {
          sendToWs({ type: 'video.join', roomId, role });
          const caps = await new Promise<RtpCapabilities>((r) => { resolveRouterCaps.current = r; sendSignal({ type: 'get-router-rtp-capabilities' }); });
          const device = new Device();
          await device.load({ routerRtpCapabilities: caps });
          deviceRef.current = device;

          const sendData = await new Promise<unknown>((r) => { resolveTransportSend.current = r; sendSignal({ type: 'create-webrtc-transport', direction: 'send' }); });
          const sd = sendData as Record<string, unknown>;
          const sendTransport = device.createSendTransport({ id: sd.transportId as string, iceParameters: sd.iceParameters as any, iceCandidates: sd.iceCandidates as any[], dtlsParameters: sd.dtlsParameters as any, iceServers: buildIceServers(), iceTransportPolicy: 'all' as RTCIceTransportPolicy });
          connectTransport(sendTransport, 'send');
          sendTransportRef.current = sendTransport;

          const recvData = await new Promise<unknown>((r) => { resolveTransportRecv.current = r; sendSignal({ type: 'create-webrtc-transport', direction: 'recv' }); });
          const rd = recvData as Record<string, unknown>;
          const recvTransport = device.createRecvTransport({ id: rd.transportId as string, iceParameters: rd.iceParameters as any, iceCandidates: rd.iceCandidates as any[], dtlsParameters: rd.dtlsParameters as any, iceServers: buildIceServers(), iceTransportPolicy: 'all' as RTCIceTransportPolicy });
          connectTransport(recvTransport, 'recv');
          recvTransportRef.current = recvTransport;

          if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack && producerRef.current === null) {
              producerRef.current = await sendTransport.produce({ track: audioTrack });
              localProducerIdsRef.current.add(producerRef.current.id);
            }
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack && videoProducerRef.current === null) {
              videoProducerRef.current = await sendTransport.produce({ track: videoTrack });
              localProducerIdsRef.current.add(videoProducerRef.current.id);
            }
          }

          setStatePartial({ connected: true });
          clearTimeout(timeout);
          resolve();
          const dev = deviceRef.current;
          const recv = recvTransportRef.current;
          if (dev && recv) {
            for (const p of pendingProducersRef.current) {
              sendSignal({ type: 'consume', transportId: recv.id, producerId: p.producerId, peerId: p.peerId, rtpCapabilities: (dev as any).rtpCapabilities });
            }
            pendingProducersRef.current = [];
          }
        } catch (err: any) {
          setStatePartial({ error: err.message });
          clearTimeout(timeout);
          reject(err);
        }
      };

      ws.onmessage = handleWsMessage;
      ws.onclose = () => cleanupConnections();
      ws.onerror = () => { setStatePartial({ error: 'WebSocket connection failed' }); clearTimeout(timeout); reject(new Error('WebSocket connection failed')); };
    });
  }, [roomId, role, sendToWs, sendSignal, handleWsMessage, setStatePartial, cleanupConnections, connectTransport]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  useEffect(() => {
    const setup = (track: MediaStreamTrack) => {
      monitorCleanupRef.current?.();

      let recovering = false;

      const attemptRecovery = async (eventType: string) => {
        if (recovering) return;
        recovering = true;
        console.warn(`[video-monitor] track ${eventType} event — readyState: ${track.readyState}, muted: ${track.muted}`);
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
          const newTrack = newStream.getVideoTracks()[0];
          console.log(`[video-monitor] getUserMedia succeeded, new track readyState: ${newTrack.readyState}`);

          if (videoProducerRef.current) {
            await videoProducerRef.current.replaceTrack({ track: newTrack });
            console.log('[video-monitor] replaceTrack on producer succeeded');
          }

          const oldTrack = localStreamRef.current?.getVideoTracks()[0];
          if (oldTrack) localStreamRef.current?.removeTrack(oldTrack);
          if (localStreamRef.current) localStreamRef.current.addTrack(newTrack);

          setup(newTrack);

          setStatePartial({ isCameraOn: true, cameraRecoveryNeedsGesture: false });
          console.log('[video-monitor] camera recovery succeeded');
        } catch (err: any) {
          console.error(`[video-monitor] getUserMedia failed:`, { name: err.name, message: err.message, constraint: err.constraint });
          if (err.name === 'NotAllowedError') {
            setStatePartial({ cameraRecoveryNeedsGesture: true });
          } else {
            setStatePartial({ error: 'No se pudo recuperar la cámara automáticamente' });
          }
        } finally {
          recovering = false;
        }
      };

      const onEnded = () => attemptRecovery('ended');
      const onMute = () => {
        console.warn('[video-monitor] track muted event (temporary WebRTC state)');
      };
      const onUnmute = () => {
        console.log('[video-monitor] track unmuted — camera available again');
      };

      track.addEventListener('ended', onEnded);
      track.addEventListener('mute', onMute);
      track.addEventListener('unmute', onUnmute);

      const cleanup = () => {
        track.removeEventListener('ended', onEnded);
        track.removeEventListener('mute', onMute);
        track.removeEventListener('unmute', onUnmute);
      };
      monitorCleanupRef.current = cleanup;
    };

    setupTrackMonitorRef.current = setup;

    const stream = localStreamRef.current;
    const videoTrack = stream?.getVideoTracks()[0];
    if (videoTrack) {
      setup(videoTrack);
    }

    return () => {
      monitorCleanupRef.current?.();
      monitorCleanupRef.current = null;
    };
  }, [setStatePartial]);

  return {
    state,
    startLocalStream,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    join,
    cleanup,
    userIdRef,
    joinedRef,
    localStreamRef,
  };
}

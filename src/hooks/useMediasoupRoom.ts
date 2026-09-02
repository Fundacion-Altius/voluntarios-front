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
  if (process.env.NEXT_PUBLIC_WS_BASE_URL) {
    return process.env.NEXT_PUBLIC_WS_BASE_URL;
  }
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

function isNgrokHost(hostname: string): boolean {
  return hostname.includes('ngrok-free.app') || hostname.includes('ngrok.io');
}

function buildIceServers(): RTCIceServer[] {
  const stun = { urls: 'stun:stun.l.google.com:19302' };
  if (typeof window !== 'undefined' && isNgrokHost(window.location.hostname)) {
    return [stun];
  }
  const host = process.env.NEXT_PUBLIC_TURN_HOST || 'localhost';
  const port = Number(process.env.NEXT_PUBLIC_TURN_PORT || 3478);
  const username = process.env.NEXT_PUBLIC_TURN_USERNAME || 'voluntarios';
  const credential = process.env.NEXT_PUBLIC_TURN_PASSWORD || 'turnpassword';
  return [
    { urls: `turn:${host}:${port}?transport=udp`, username, credential },
    { urls: `turn:${host}:${port}?transport=tcp`, username, credential },
    stun,
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
  const pendingConnectRef = useRef<Map<string, () => void>>(new Map());
  const pendingProduceRef = useRef<Array<(id: string) => void>>([]);

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
      const stream = existing.video || existing.audio || new MediaStream();
      if (!stream.getTracks().some((t) => t.id === track.id)) {
        stream.addTrack(track);
      }
      peers.set(peerId, { ...existing, [kind]: stream, video: stream, audio: stream });
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
    (transport as any).on('connect', ({ dtlsParameters }: { dtlsParameters: DtlsParameters }, callback: () => void, errback: (err: Error) => void) => {
      pendingConnectRef.current.set(transport.id, callback);
      try {
        sendSignal({ type: 'connect-transport', transportId: transport.id, dtlsParameters });
      } catch (err: any) {
        pendingConnectRef.current.delete(transport.id);
        errback(err);
      }
    });
    if (direction === 'send') {
      (transport as any).on('produce', ({ kind, rtpParameters }: { kind: string; rtpParameters: unknown }, callback: (data: { id: string }) => void, errback: (err: Error) => void) => {
        pendingProduceRef.current.push((id: string) => callback({ id }));
        try {
          sendSignal({ type: 'produce', transportId: transport.id, kind, rtpParameters });
        } catch (err: any) {
          pendingProduceRef.current.pop();
          errback(err);
        }
      });
    }
  }, [sendSignal]);

  const attachIceLogging = useCallback((transport: Transport, label: string): void => {
    const ice = (transport as any).iceTransport as RTCIceTransport | undefined;
    if (!ice) {
      console.warn(`[ICE] ${label} transport has no iceTransport to observe`);
      return;
    }
    ice.addEventListener('statechange', () => {
      console.log(`[ICE] connectionState: ${label}=${ice.state}`);
    });
    ice.addEventListener('gatheringstatechange', () => {
      console.log(`[ICE] gatheringState: ${label}=${ice.gatheringState}`);
    });
    const handler = (transport as any)._handler as { _pc?: RTCPeerConnection } | undefined;
    const pc = handler?._pc;
    if (pc) {
      pc.addEventListener('icecandidate', (event: RTCPeerConnectionIceEvent) => {
        const candidate = event.candidate;
        if (!candidate) return;
        const protocol = candidate.protocol ?? 'unknown';
        const candidateType = candidate.type ?? 'unknown';
        const lastOctet = candidate.address?.split('.').slice(-1)[0] ?? 'x';
        console.log(`[ICE] candidate type: ${label}=${candidateType} ${protocol} *.${lastOctet}:${candidate.port}`);
      });
    }
  }, []);

  const handleProduced = useCallback((msg: { id?: string }): void => {
    const next = pendingProduceRef.current.shift();
    if (next && msg.id) next(msg.id);
  }, []);

  const handleTransportConnected = useCallback((msg: { transportId?: string }): void => {
    if (!msg.transportId) return;
    const cb = pendingConnectRef.current.get(msg.transportId);
    pendingConnectRef.current.delete(msg.transportId);
    cb?.();
  }, []);

  const handleNewRouterRtpCapabilities = useCallback((msg: { rtpCapabilities: RtpCapabilities }): void => {
    const resolve = resolveRouterCaps.current;
    if (resolve) {
      resolveRouterCaps.current = null;
      resolve(msg.rtpCapabilities as RtpCapabilities);
    }
  }, []);

  const handleNewTransport = useCallback((msg: unknown): void => {
    const resolveSend = resolveTransportSend.current;
    const resolveRecv = resolveTransportRecv.current;
    if (resolveSend && !sendTransportRef.current) {
      resolveTransportSend.current = null;
      resolveSend(msg);
    } else if (resolveRecv) {
      resolveTransportRecv.current = null;
      resolveRecv(msg);
    }
  }, []);

  const handleNewProducer = useCallback((msg: { peerId?: string; producerId?: string; kind?: string }): void => {
    const isSelf = (msg.peerId && msg.peerId === userIdRef.current) || localProducerIdsRef.current.has(msg.producerId as string);
    if (isSelf) return;
    const dev = deviceRef.current;
    const recv = recvTransportRef.current;
    if (!dev || !recv) {
      pendingProducersRef.current.push({ peerId: msg.peerId as string, producerId: msg.producerId as string, kind: msg.kind as string });
      return;
    }
    sendSignal({ type: 'consume', transportId: recv.id, producerId: msg.producerId, peerId: msg.peerId, rtpCapabilities: (dev as any).rtpCapabilities });
  }, [sendSignal]);

  const handleNewConsumer = useCallback(async (msg: { consumerId: string; producerId?: string; peerId?: string; kind: string; rtpParameters: unknown }): Promise<void> => {
    if (consumersRef.current.has(msg.consumerId)) return;
    if (msg.peerId && msg.peerId === userIdRef.current) return;
    const recv = recvTransportRef.current;
    if (!recv) return;
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
    sendSignal({ type: 'resume-consumer', consumerId: consumer.id });
    await consumer.resume();
    if (msg.kind === 'video') {
      sendSignal({ type: 'request-keyframe', consumerId: consumer.id });
    }
  }, [setPeerTrack, sendSignal]);

  const handlePeerLeft = useCallback((from: string): void => {
    removePeer(from);
  }, [removePeer]);

  const handleCallEnded = useCallback((): void => {
    setStatePartial({ error: 'This call has ended' });
  }, [setStatePartial]);

  const handleWsMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const rawMsg = JSON.parse(event.data);
        const msg = (rawMsg.type === 'signal' && rawMsg.data && typeof rawMsg.data === 'object') ? rawMsg.data : rawMsg;
        const handlers: Record<string, (msg: unknown) => void | Promise<void>> = {
          'new-router-rtp-capabilities': handleNewRouterRtpCapabilities as (msg: unknown) => void,
          'new-transport': handleNewTransport as (msg: unknown) => void,
          'new-producer': handleNewProducer as (msg: unknown) => void,
          'new-consumer': handleNewConsumer as (msg: unknown) => Promise<void>,
          produced: handleProduced as (msg: unknown) => void,
          'transport-connected': handleTransportConnected as (msg: unknown) => void,
          'peer-left': (m: unknown) => handlePeerLeft((m as { from: string }).from),
          'call-ended': handleCallEnded as (msg: unknown) => void,
        };
        const handler = handlers[msg.type];
        if (handler) {
          await handler(msg);
        }
      } catch {}
    },
    [handleNewRouterRtpCapabilities, handleNewTransport, handleNewProducer, handleNewConsumer, handleProduced, handleTransportConnected, handlePeerLeft, handleCallEnded],
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
    if (!localStreamRef.current) {
      try {
        await startLocalStream(false, true);
      } catch (err: any) {
        setStatePartial({ error: err?.message ?? 'No se pudo recuperar el micrófono' });
      }
      return;
    }
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        const newTrack = newStream.getAudioTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        if (sendTransportRef.current && producerRef.current === null) {
          producerRef.current = await sendTransportRef.current.produce({ track: newTrack });
        } else if (producerRef.current) {
          await producerRef.current.replaceTrack({ track: newTrack });
        }
        setStatePartial({ isMicOn: true, localStream: localStreamRef.current });
      } catch (err: any) {
        setStatePartial({ error: err?.message ?? 'No se pudo recuperar el micrófono' });
      }
      return;
    }
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
  }, [setStatePartial, startLocalStream]);

  const toggleCamera = useCallback(async () => {
    if (!localStreamRef.current) {
      try {
        await startLocalStream(true, true);
      } catch (err: any) {
        setStatePartial({ error: err?.message ?? 'No se pudo recuperar la cámara' });
      }
      return;
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        const newTrack = newStream.getVideoTracks()[0];
        localStreamRef.current.addTrack(newTrack);
        setupTrackMonitorRef.current?.(newTrack);
        if (sendTransportRef.current && videoProducerRef.current === null) {
          videoProducerRef.current = await sendTransportRef.current.produce({ track: newTrack });
        } else if (videoProducerRef.current) {
          await videoProducerRef.current.replaceTrack({ track: newTrack });
        }
        setStatePartial({ isCameraOn: true, cameraRecoveryNeedsGesture: false, localStream: localStreamRef.current });
      } catch (err: any) {
        setStatePartial({ error: err?.message ?? 'No se pudo recuperar la cámara' });
      }
      return;
    }
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
  }, [setStatePartial, startLocalStream]);

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
    pendingConnectRef.current.clear();
    pendingProduceRef.current = [];
    localProducerIdsRef.current.clear();
  }, []);

  const cleanup = useCallback(() => {
    cleanupConnections();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setStatePartial({
      localStream: null,
      connected: false,
      isMicOn: false,
      isCameraOn: false,
      isScreenSharing: false,
      cameraRecoveryNeedsGesture: false,
    });
  }, [cleanupConnections, setStatePartial]);

  const join = useCallback(async (authToken?: string) => {
    if (!roomId) return;
    cleanupConnections();

    const tokenParam = authToken ? `?token=${encodeURIComponent(authToken)}` : '';
    const ws = new WebSocket(`${deriveWsUrl()}/ws/video${tokenParam}`);
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
          attachIceLogging(recvTransport, 'recv');

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
    disconnect: cleanupConnections,
    userIdRef,
    joinedRef,
    localStreamRef,
  };
}

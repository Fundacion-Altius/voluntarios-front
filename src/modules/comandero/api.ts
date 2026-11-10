/**
 * Comandero (KL-E-022) API client. Thin wrapper over the shared apiClient.
 * Routes are mounted at /api/comandero (behind the `comandero` tenant flag).
 * No tenant id is sent from the browser; the backend resolves it from the host.
 */

import { apiClient, apiUrl, type Result } from '@/lib/apiClient';
import type {
  FloorState,
  LineStatus,
  MenuItem,
  OpenSession,
  Order,
  OrderLine,
  PracticeSession,
  QueueLine,
  SessionMenuItem,
  SessionSummary,
  Station,
  Table,
} from './types';

const base = (path: string) => apiUrl(`/api/comandero${path}`);

export const comanderoApi = {
  // Menu (docente)
  listMenu: () => apiClient.get<MenuItem[]>(base('/menu')),
  createMenuItem: (input: { name: string; category: string; price_cents: number; allergen_code?: string | null }) =>
    apiClient.post<MenuItem>(base('/menu'), input),
  deleteMenuItem: (id: string) => apiClient.delete<void>(base(`/menu/${id}`)),

  // Sessions (docente)
  listOpenSessions: () => apiClient.get<OpenSession[]>(base('/sessions')),
  startSession: (input: { label: string; activity_type_id?: string | null }) =>
    apiClient.post<PracticeSession>(base('/sessions'), input),
  getSnapshot: (sessionId: string) => apiClient.get<SessionMenuItem[]>(base(`/sessions/${sessionId}/snapshot`)),
  getFloor: (sessionId: string) => apiClient.get<FloorState>(base(`/sessions/${sessionId}/floor`)),
  closeSession: (sessionId: string, input: { student_role?: string | null; teacher_note?: string | null }) =>
    apiClient.post<SessionSummary>(base(`/sessions/${sessionId}/close`), input),
  addTable: (sessionId: string, label: string) =>
    apiClient.post<Table>(base(`/sessions/${sessionId}/tables`), { label }),
  stationQueue: (sessionId: string, station: Station) =>
    apiClient.get<QueueLine[]>(base(`/sessions/${sessionId}/stations/${station}`)),

  // Orders & lines (camarero / estación)
  openOrder: (tableId: string) => apiClient.post<Order>(base(`/tables/${tableId}/order`), {}),
  addLine: (orderId: string, input: { snapshot_item_id: string; note?: string | null }) =>
    apiClient.post<OrderLine>(base(`/orders/${orderId}/lines`), input),
  closeBill: (orderId: string) => apiClient.post<Order>(base(`/orders/${orderId}/close`), {}),
  advanceLine: (lineId: string) => apiClient.post<OrderLine>(base(`/lines/${lineId}/advance`), {}),
  serveLine: (lineId: string) => apiClient.post<OrderLine>(base(`/lines/${lineId}/serve`), {}),
};

export type { Result };
export const LINE_STATUS_ORDER: LineStatus[] = ['pedido', 'en_preparacion', 'listo', 'servido'];

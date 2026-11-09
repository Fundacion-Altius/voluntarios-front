/**
 * Comandero (KL-E-022) frontend types. Mirror of the backend module contract.
 * Training simulation only — no real payment. Tenant resolved by the backend from the host.
 */

export type Station = 'cocina' | 'barra';
export type ItemCategory = 'plato' | 'bebida';
export type LineStatus = 'pedido' | 'en_preparacion' | 'listo' | 'servido';
export type OrderStatus = 'abierta' | 'servida' | 'cobrada' | 'cerrada';
export type SessionStatus = 'activa' | 'cerrada';

export interface MenuItem {
  id: string;
  tenant_id: string;
  name: string;
  category: ItemCategory;
  price_cents: number;
  allergen_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionMenuItem {
  id: string;
  session_id: string;
  source_item_id: string | null;
  name: string;
  category: ItemCategory;
  station: Station;
  price_cents: number;
  allergen_code: string | null;
}

export interface PracticeSession {
  id: string;
  label: string;
  status: SessionStatus;
  activity_type_id: string | null;
  student_role: string | null;
  cycle_completed: number;
  teacher_note: string | null;
  started_at: string;
  closed_at: string | null;
}

export interface Table {
  id: string;
  session_id: string;
  label: string;
}

export interface Order {
  id: string;
  session_id: string;
  table_id: string;
  status: OrderStatus;
  subtotal_cents: number;
}

export interface OrderLine {
  id: string;
  order_id: string;
  snapshot_item_id: string;
  name: string;
  station: Station;
  price_cents: number;
  status: LineStatus;
  note: string | null;
  ordered_at: string;
  preparing_at: string | null;
  ready_at: string | null;
  served_at: string | null;
}

export interface FloorTable {
  table: Table;
  open_order: Order | null;
  lines: OrderLine[];
}

export interface FloorState {
  session_id: string;
  tables: FloorTable[];
}

export interface SessionSummary {
  session_id: string;
  avg_phase_ms: { pedido: number; en_preparacion: number; listo: number };
  waiting_lines: number;
  service_order: Array<{ line_id: string; name: string; served_at: string | null }>;
}

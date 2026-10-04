export type OrderStatus =
  | 'draft'
  | 'needs_clarification'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type SourceType =
  | 'paste'
  | 'file_upload'
  | 'csv'
  | 'sample'
  | 'api';

export type MatchStatus =
  | 'exact_match'
  | 'partial_match'
  | 'ambiguous'
  | 'unknown';

export type StockStatus =
  | 'in_stock'
  | 'low_stock'
  | 'insufficient_stock';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  variants: string[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number;
  unit_price_snapshot: number;
  variant: string | null;
  line_total: number;
  match_status: MatchStatus;
  stock_status: StockStatus;
  available_stock: number;
  raw_mention?: string;
  candidate_matches?: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    variant?: string;
  }>;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_contact: string | null;
  delivery_address: string | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  delivery_charge: number;
  total: number;
  source_type: SourceType;
  raw_message: string;
  items: OrderItem[];
  missing_fields: string[];
  warnings: string[];
  suggested_action: string;
  draft_response: string;
  confidence_score: number;
  duplicate_warning: {
    is_duplicate: boolean;
    existing_order_id?: string;
    similarity_reason?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessingSession {
  id: string;
  order_id: string | null;
  processing_mode: 'demo_deterministic' | 'ai_orchestrated';
  input_source: string;
  raw_message: string;
  status: 'in_progress' | 'completed' | 'needs_review' | 'failed';
  confidence_score: number;
  created_at: string;
  completed_at: string | null;
}

export type AgentEventType =
  | 'session_started'
  | 'plan_generated'
  | 'tool_call'
  | 'tool_result'
  | 'validation_warning'
  | 'calculation'
  | 'draft_generated'
  | 'human_action'
  | 'error';

export interface AgentEvent {
  id: string;
  session_id: string;
  order_id?: string;
  event_type: AgentEventType;
  tool_name: string | null;
  outcome: 'success' | 'warning' | 'error' | 'info';
  safe_summary: string;
  actor: 'agent' | 'human';
  details?: Record<string, unknown>;
  created_at: string;
}

export interface ApprovalEvent {
  id: string;
  order_id: string;
  action: 'approved' | 'rejected' | 'edited' | 'clarification_requested';
  previous_status: OrderStatus;
  new_status: OrderStatus;
  reviewer_label: string;
  notes: string | null;
  created_at: string;
}

export interface SystemSettings {
  tax_rate: number; // e.g. 0.05
  delivery_charge: number; // e.g. 5.00
  free_delivery_threshold: number; // e.g. 50.00
  ai_provider: 'demo' | 'gemini' | 'openai' | 'anthropic';
  api_key: string;
  confidence_threshold: number; // e.g. 80
  auto_flag_duplicates: boolean;
  recheck_stock_on_approval: boolean;
}

export interface ToolExecutionStep {
  step_number: number;
  tool_name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'warning';
  duration_ms?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface OrchestrationResult {
  session_id: string;
  order: Order;
  timeline: ToolExecutionStep[];
  confidence_score: number;
  processing_mode: 'demo_deterministic' | 'ai_orchestrated';
  events: AgentEvent[];
}

export interface EvaluationScenario {
  id: number;
  name: string;
  category: 'Parsing' | 'Validation' | 'Inventory' | 'Calculation' | 'Approval' | 'Resilience';
  description: string;
  input_message?: string;
  action_type: 'process_message' | 'approval_check' | 'resilience_test';
  expected_outcome: {
    status?: OrderStatus;
    has_warnings?: boolean;
    missing_fields?: string[];
    blocked_approval?: boolean;
    duplicate_detected?: boolean;
    expected_subtotal?: number;
    error_handled?: boolean;
  };
}

export interface EvaluationResult {
  scenario_id: number;
  name: string;
  passed: boolean;
  duration_ms: number;
  actual_outcome: any;
  error_message?: string;
  assertions: Array<{ name: string; passed: boolean; message?: string }>;
}

export interface EvaluationSummary {
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
  total_duration_ms: number;
  timestamp: string;
  results: EvaluationResult[];
}

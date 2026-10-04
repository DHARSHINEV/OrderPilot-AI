import fs from 'fs';
import path from 'path';
import {
  Product,
  Order,
  ProcessingSession,
  AgentEvent,
  ApprovalEvent,
  SystemSettings,
  OrderStatus,
} from './types';

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  sessions: ProcessingSession[];
  events: AgentEvent[];
  approvals: ApprovalEvent[];
  settings: SystemSettings;
  version: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'orderpilot-db.json');

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'SKU-SHIRT-BLU-M',
    name: 'Blue cotton shirt, medium',
    category: 'Apparel',
    description: '100% breathable premium cotton button-down shirt in navy blue, size Medium.',
    price: 24.99,
    stock_quantity: 15,
    low_stock_threshold: 5,
    variants: ['Medium', 'Blue'],
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'prod-002',
    sku: 'SKU-SHIRT-BLK-L',
    name: 'Black cotton shirt, large',
    category: 'Apparel',
    description: 'Classic fitted black cotton casual shirt, size Large.',
    price: 27.99,
    stock_quantity: 8,
    low_stock_threshold: 5,
    variants: ['Large', 'Black'],
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'prod-003',
    sku: 'SKU-PAPER-A4',
    name: 'A4 paper packet',
    category: 'Stationery',
    description: '75 GSM multipurpose white copy and printer paper, 500 sheets ream.',
    price: 5.5,
    stock_quantity: 50,
    low_stock_threshold: 10,
    variants: ['500 Sheets', 'White'],
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'prod-004',
    sku: 'SKU-PEN-BLU',
    name: 'Blue ink pen',
    category: 'Stationery',
    description: 'Smooth flow ballpoint gel pens with comfortable rubber grip (Pack of 5).',
    price: 3.25,
    stock_quantity: 100,
    low_stock_threshold: 20,
    variants: ['Blue', 'Pack of 5'],
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'prod-005',
    sku: 'SKU-NOTEBOOK',
    name: 'Notebook',
    category: 'Stationery',
    description: 'Spiral-bound ruled notebook, 160 pages, archival-quality paper.',
    price: 4.5,
    stock_quantity: 4, // Intentionally low for testing low stock alert!
    low_stock_threshold: 5,
    variants: ['Spiral Ruled', '160 Pages'],
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'prod-006',
    sku: 'SKU-GEOM-BOX',
    name: 'Geometry box',
    category: 'Stationery',
    description: 'Precision mathematical drawing set with compass, divider, and ruler in metal case.',
    price: 8.99,
    stock_quantity: 12,
    low_stock_threshold: 4,
    variants: ['Standard Metal Case'],
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'prod-007',
    sku: 'SKU-DESK-ORG',
    name: 'Mesh desk organizer',
    category: 'Office',
    description: '6-compartment black metal mesh desk caddy for pens, notes, and stationery.',
    price: 14.99,
    stock_quantity: 0, // Intentionally out-of-stock for shortage tests!
    low_stock_threshold: 3,
    variants: ['Black Mesh'],
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-001',
    customer_name: 'Priya Sharma',
    customer_contact: '+91 98765 43210',
    delivery_address: '14 Lake Road, Apt 3B, Bengaluru',
    status: 'approved',
    subtotal: 130.95,
    tax: 6.55,
    delivery_charge: 0.0,
    total: 137.5,
    source_type: 'paste',
    raw_message: 'Hi, I need 3 blue cotton shirts in medium and 2 black cotton shirts in large. Deliver to 14 Lake Road, Apt 3B. My name is Priya.',
    items: [
      {
        id: 'item-001',
        product_id: 'prod-001',
        product_name_snapshot: 'Blue cotton shirt, medium',
        quantity: 3,
        unit_price_snapshot: 24.99,
        variant: 'Medium',
        line_total: 74.97,
        match_status: 'exact_match',
        stock_status: 'in_stock',
        available_stock: 15,
      },
      {
        id: 'item-002',
        product_id: 'prod-002',
        product_name_snapshot: 'Black cotton shirt, large',
        quantity: 2,
        unit_price_snapshot: 27.99,
        variant: 'Large',
        line_total: 55.98,
        match_status: 'exact_match',
        stock_status: 'in_stock',
        available_stock: 8,
      },
    ],
    missing_fields: [],
    warnings: [],
    suggested_action: 'Order approved and confirmed.',
    draft_response: 'Hi Priya, thank you for your order! Your 3 blue cotton shirts (M) and 2 black cotton shirts (L) have been confirmed and are being prepared for delivery to 14 Lake Road.',
    confidence_score: 98,
    duplicate_warning: null,
    created_at: '2026-10-04T10:15:00.000Z',
    updated_at: '2026-10-04T10:20:00.000Z',
  },
  {
    id: 'ORD-2026-002',
    customer_name: 'Arun Verma',
    customer_contact: null,
    delivery_address: '21 Main Street, Green Park',
    status: 'pending_approval',
    subtotal: 31.75,
    tax: 1.59,
    delivery_charge: 5.0,
    total: 38.34,
    source_type: 'paste',
    raw_message: 'Please send 4 packets of A4 paper and 3 blue ink pens. My name is Arun. Address: 21 Main Street.',
    items: [
      {
        id: 'item-003',
        product_id: 'prod-003',
        product_name_snapshot: 'A4 paper packet',
        quantity: 4,
        unit_price_snapshot: 5.5,
        variant: '500 Sheets',
        line_total: 22.0,
        match_status: 'exact_match',
        stock_status: 'in_stock',
        available_stock: 50,
      },
      {
        id: 'item-004',
        product_id: 'prod-004',
        product_name_snapshot: 'Blue ink pen',
        quantity: 3,
        unit_price_snapshot: 3.25,
        variant: 'Blue',
        line_total: 9.75,
        match_status: 'exact_match',
        stock_status: 'in_stock',
        available_stock: 100,
      },
    ],
    missing_fields: ['customer_contact'],
    warnings: ['Phone contact was not provided in message.'],
    suggested_action: 'Review order details and verify contact if needed.',
    draft_response: 'Hi Arun, thank you for your order. Here is the order summary for your review (4x A4 paper, 3x Blue ink pen, Total: $38.34). Please provide a contact number if possible before we dispatch.',
    confidence_score: 92,
    duplicate_warning: null,
    created_at: '2026-10-04T12:30:00.000Z',
    updated_at: '2026-10-04T12:30:00.000Z',
  },
  {
    id: 'ORD-2026-003',
    customer_name: 'Rohan Mehta',
    customer_contact: 'rohan.mehta@example.com',
    delivery_address: null,
    status: 'needs_clarification',
    subtotal: 17.98,
    tax: 0.9,
    delivery_charge: 5.0,
    total: 23.88,
    source_type: 'paste',
    raw_message: 'Hi this is Rohan (rohan.mehta@example.com). Need 2 geometry boxes urgently for school tomorrow morning.',
    items: [
      {
        id: 'item-005',
        product_id: 'prod-006',
        product_name_snapshot: 'Geometry box',
        quantity: 2,
        unit_price_snapshot: 8.99,
        variant: 'Standard Metal Case',
        line_total: 17.98,
        match_status: 'exact_match',
        stock_status: 'in_stock',
        available_stock: 12,
      },
    ],
    missing_fields: ['delivery_address'],
    warnings: ['Missing delivery address', 'Urgent delivery requested for tomorrow morning'],
    suggested_action: 'Request delivery address from customer before approving.',
    draft_response: 'Hi Rohan, thank you for your order! We have reserved 2 geometry boxes for you. Could you please provide your delivery address so we can schedule the shipment?',
    confidence_score: 75,
    duplicate_warning: null,
    created_at: '2026-10-04T13:45:00.000Z',
    updated_at: '2026-10-04T13:45:00.000Z',
  },
];

const INITIAL_SETTINGS: SystemSettings = {
  tax_rate: 0.05,
  delivery_charge: 5.0,
  free_delivery_threshold: 50.0,
  ai_provider: 'demo',
  api_key: '',
  confidence_threshold: 80,
  auto_flag_duplicates: true,
  recheck_stock_on_approval: true,
};

const INITIAL_EVENTS: AgentEvent[] = [
  {
    id: 'evt-001',
    session_id: 'sess-init-01',
    order_id: 'ORD-2026-001',
    event_type: 'plan_generated',
    tool_name: 'parse_order_message',
    outcome: 'success',
    safe_summary: 'Parsed message from Priya Sharma: 2 line items identified.',
    actor: 'agent',
    created_at: '2026-10-04T10:15:02.000Z',
  },
  {
    id: 'evt-002',
    session_id: 'sess-init-01',
    order_id: 'ORD-2026-001',
    event_type: 'tool_call',
    tool_name: 'search_inventory',
    outcome: 'success',
    safe_summary: 'Matched SKU-SHIRT-BLU-M (Stock: 15) and SKU-SHIRT-BLK-L (Stock: 8).',
    actor: 'agent',
    created_at: '2026-10-04T10:15:04.000Z',
  },
  {
    id: 'evt-003',
    session_id: 'sess-init-01',
    order_id: 'ORD-2026-001',
    event_type: 'human_action',
    tool_name: 'approve_order',
    outcome: 'success',
    safe_summary: 'Human reviewer approved order ORD-2026-001 after stock recheck.',
    actor: 'human',
    created_at: '2026-10-04T10:20:00.000Z',
  },
];

function ensureDataDir(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readDb(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const initialDb: DatabaseSchema = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      sessions: [],
      events: INITIAL_EVENTS,
      approvals: [
        {
          id: 'appr-001',
          order_id: 'ORD-2026-001',
          action: 'approved',
          previous_status: 'pending_approval',
          new_status: 'approved',
          reviewer_label: 'Store Manager (Demo)',
          notes: 'Standard approval, items in stock.',
          created_at: '2026-10-04T10:20:00.000Z',
        },
      ],
      settings: INITIAL_SETTINGS,
      version: '1.0.0',
    };
    writeDb(initialDb);
    return initialDb;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse database file, reinitializing', err);
    const fallbackDb: DatabaseSchema = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      sessions: [],
      events: INITIAL_EVENTS,
      approvals: [],
      settings: INITIAL_SETTINGS,
      version: '1.0.0',
    };
    writeDb(fallbackDb);
    return fallbackDb;
  }
}

function writeDb(db: DatabaseSchema): void {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export const db = {
  // PRODUCTS
  getProducts(): Product[] {
    return readDb().products;
  },

  getProductById(id: string): Product | undefined {
    return readDb().products.find((p) => p.id === id);
  },

  getProductBySku(sku: string): Product | undefined {
    return readDb().products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
  },

  searchProducts(query: string): Product[] {
    const q = query.toLowerCase().trim();
    if (!q) return readDb().products;
    return readDb().products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.variants.some((v) => v.toLowerCase().includes(q))
    );
  },

  createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const current = readDb();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.products.push(newProduct);
    writeDb(current);
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const current = readDb();
    const idx = current.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    current.products[idx] = {
      ...current.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeDb(current);
    return current.products[idx];
  },

  deleteProduct(id: string): boolean {
    const current = readDb();
    const beforeLen = current.products.length;
    current.products = current.products.filter((p) => p.id !== id);
    if (current.products.length !== beforeLen) {
      writeDb(current);
      return true;
    }
    return false;
  },

  adjustStock(id: string, delta: number): Product | null {
    const current = readDb();
    const idx = current.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const currentStock = current.products[idx].stock_quantity;
    const nextStock = currentStock + delta;
    if (nextStock < 0) {
      throw new Error(`Insufficient stock: requested delta ${delta} exceeds available ${currentStock}`);
    }
    current.products[idx].stock_quantity = nextStock;
    current.products[idx].updated_at = new Date().toISOString();
    writeDb(current);
    return current.products[idx];
  },

  // ORDERS
  getOrders(): Order[] {
    return readDb().orders;
  },

  getOrderById(id: string): Order | undefined {
    return readDb().orders.find((o) => o.id === id);
  },

  createOrder(order: Order): Order {
    const current = readDb();
    current.orders.unshift(order);
    writeDb(current);
    return order;
  },

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const current = readDb();
    const idx = current.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    current.orders[idx] = {
      ...current.orders[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeDb(current);
    return current.orders[idx];
  },

  deleteOrder(id: string): boolean {
    const current = readDb();
    const beforeLen = current.orders.length;
    current.orders = current.orders.filter((o) => o.id !== id);
    if (current.orders.length !== beforeLen) {
      writeDb(current);
      return true;
    }
    return false;
  },

  // ATOMIC APPROVAL WITH STOCK RECHECK
  approveOrderAtomically(orderId: string, reviewer: string, notes?: string): Order {
    const current = readDb();
    const orderIdx = current.orders.findIndex((o) => o.id === orderId);
    if (orderIdx === -1) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const order = current.orders[orderIdx];

    // State validation
    if (order.status === 'approved') {
      throw new Error(`Order ${orderId} is already approved. Duplicate approval is prevented.`);
    }

    if (order.status === 'rejected' || order.status === 'cancelled') {
      throw new Error(`Cannot approve order ${orderId} with status '${order.status}'.`);
    }

    // Required fields validation
    if (!order.customer_name || !order.customer_name.trim()) {
      throw new Error(`Cannot approve order: Customer name is missing.`);
    }
    if (!order.delivery_address || !order.delivery_address.trim()) {
      throw new Error(`Cannot approve order: Delivery address is missing.`);
    }
    if (!order.items || order.items.length === 0) {
      throw new Error(`Cannot approve order: Order contains no items.`);
    }

    // Atomic Stock Verification
    for (const item of order.items) {
      if (!item.product_id) {
        throw new Error(`Cannot approve order: Line item "${item.product_name_snapshot}" is not matched to a valid product in inventory.`);
      }

      const product = current.products.find((p) => p.id === item.product_id);
      if (!product) {
        throw new Error(`Product ${item.product_id} no longer exists in inventory.`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient inventory for "${product.name}". Required: ${item.quantity}, Available: ${product.stock_quantity}. Approval blocked to prevent overselling.`
        );
      }
    }

    // Decrement stock atomically
    for (const item of order.items) {
      const pIdx = current.products.findIndex((p) => p.id === item.product_id);
      current.products[pIdx].stock_quantity -= item.quantity;
      current.products[pIdx].updated_at = new Date().toISOString();
    }

    // Update Order Status
    const previousStatus = order.status;
    const now = new Date().toISOString();
    order.status = 'approved';
    order.suggested_action = 'Order approved. Ready for dispatch.';
    order.updated_at = now;

    // Record Approval Event
    const approvalEvent: ApprovalEvent = {
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order_id: orderId,
      action: 'approved',
      previous_status: previousStatus,
      new_status: 'approved',
      reviewer_label: reviewer || 'Store Reviewer',
      notes: notes || 'Verified stock availability and approved order.',
      created_at: now,
    };
    current.approvals.unshift(approvalEvent);

    // Record Agent Activity Log
    const agentEvent: AgentEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      session_id: `session-${orderId}`,
      order_id: orderId,
      event_type: 'human_action',
      tool_name: 'approve_order',
      outcome: 'success',
      safe_summary: `Order ${orderId} approved by ${reviewer || 'Reviewer'}. Inventory decremented successfully.`,
      actor: 'human',
      details: {
        order_id: orderId,
        items_count: order.items.length,
        total: order.total,
      },
      created_at: now,
    };
    current.events.unshift(agentEvent);

    writeDb(current);
    return order;
  },

  // REJECT ORDER
  rejectOrder(orderId: string, reason: string, reviewer: string): Order {
    const current = readDb();
    const orderIdx = current.orders.findIndex((o) => o.id === orderId);
    if (orderIdx === -1) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const order = current.orders[orderIdx];
    if (order.status === 'approved') {
      throw new Error(`Cannot reject already approved order ${orderId}.`);
    }

    const previousStatus = order.status;
    const now = new Date().toISOString();
    order.status = 'rejected';
    order.suggested_action = `Order rejected: ${reason}`;
    order.updated_at = now;

    // Record Approval Event
    current.approvals.unshift({
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order_id: orderId,
      action: 'rejected',
      previous_status: previousStatus,
      new_status: 'rejected',
      reviewer_label: reviewer || 'Store Reviewer',
      notes: reason,
      created_at: now,
    });

    // Record Agent Event
    current.events.unshift({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      session_id: `session-${orderId}`,
      order_id: orderId,
      event_type: 'human_action',
      tool_name: 'reject_order',
      outcome: 'warning',
      safe_summary: `Order ${orderId} rejected by ${reviewer}: ${reason}`,
      actor: 'human',
      details: { reason },
      created_at: now,
    });

    writeDb(current);
    return order;
  },

  // SESSIONS
  createSession(session: ProcessingSession): ProcessingSession {
    const current = readDb();
    current.sessions.unshift(session);
    writeDb(current);
    return session;
  },

  getSession(id: string): ProcessingSession | undefined {
    return readDb().sessions.find((s) => s.id === id);
  },

  updateSession(id: string, updates: Partial<ProcessingSession>): ProcessingSession | null {
    const current = readDb();
    const idx = current.sessions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    current.sessions[idx] = {
      ...current.sessions[idx],
      ...updates,
    };
    writeDb(current);
    return current.sessions[idx];
  },

  // AGENT EVENTS
  recordEvent(event: Omit<AgentEvent, 'id' | 'created_at'>): AgentEvent {
    const current = readDb();
    const newEvent: AgentEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    current.events.unshift(newEvent);
    // Keep max 500 events
    if (current.events.length > 500) {
      current.events = current.events.slice(0, 500);
    }
    writeDb(current);
    return newEvent;
  },

  getEvents(filters?: {
    sessionId?: string;
    orderId?: string;
    eventType?: string;
    outcome?: string;
  }): AgentEvent[] {
    let events = readDb().events;
    if (filters?.sessionId) {
      events = events.filter((e) => e.session_id === filters.sessionId);
    }
    if (filters?.orderId) {
      events = events.filter((e) => e.order_id === filters.orderId);
    }
    if (filters?.eventType) {
      events = events.filter((e) => e.event_type === filters.eventType);
    }
    if (filters?.outcome) {
      events = events.filter((e) => e.outcome === filters.outcome);
    }
    return events;
  },

  // APPROVAL EVENTS
  getApprovals(orderId?: string): ApprovalEvent[] {
    const approvals = readDb().approvals;
    if (orderId) {
      return approvals.filter((a) => a.order_id === orderId);
    }
    return approvals;
  },

  // SETTINGS
  getSettings(): SystemSettings {
    return readDb().settings;
  },

  updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    const current = readDb();
    current.settings = {
      ...current.settings,
      ...updates,
    };
    writeDb(current);
    return current.settings;
  },

  // RESET DATABASE TO SAMPLE STATE
  resetDatabase(): { success: boolean; message: string } {
    const resetData: DatabaseSchema = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      sessions: [],
      events: INITIAL_EVENTS,
      approvals: [
        {
          id: 'appr-001',
          order_id: 'ORD-2026-001',
          action: 'approved',
          previous_status: 'pending_approval',
          new_status: 'approved',
          reviewer_label: 'Store Manager (Demo)',
          notes: 'Standard approval, items in stock.',
          created_at: '2026-10-04T10:20:00.000Z',
        },
      ],
      settings: INITIAL_SETTINGS,
      version: '1.0.0',
    };
    writeDb(resetData);
    return { success: true, message: 'Database reset to initial sample state successfully.' };
  },
};

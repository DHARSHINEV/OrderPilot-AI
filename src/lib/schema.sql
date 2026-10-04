-- OrderPilot AI Database Schema (SQLite / PostgreSQL compatible)
-- Hackathon Track: Agentic AI - WCC Launchpad 30

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL CHECK(price >= 0),
    stock_quantity INTEGER NOT NULL CHECK(stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    variants TEXT DEFAULT '[]', -- JSON array of strings
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_contact TEXT,
    delivery_address TEXT,
    status TEXT NOT NULL CHECK(status IN ('draft', 'needs_clarification', 'pending_approval', 'approved', 'rejected', 'cancelled')),
    subtotal REAL NOT NULL DEFAULT 0.0,
    tax REAL NOT NULL DEFAULT 0.0,
    delivery_charge REAL NOT NULL DEFAULT 0.0,
    total REAL NOT NULL DEFAULT 0.0,
    source_type TEXT NOT NULL CHECK(source_type IN ('paste', 'file_upload', 'csv', 'sample', 'api')),
    raw_message TEXT NOT NULL,
    missing_fields TEXT DEFAULT '[]', -- JSON array
    warnings TEXT DEFAULT '[]',       -- JSON array
    suggested_action TEXT,
    draft_response TEXT,
    confidence_score REAL DEFAULT 0.0,
    duplicate_warning TEXT,          -- JSON object
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 3. OrderItems Table (Snapshots product pricing & variant for historical integrity)
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT,
    product_name_snapshot TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price_snapshot REAL NOT NULL CHECK(unit_price_snapshot >= 0),
    variant TEXT,
    line_total REAL NOT NULL CHECK(line_total >= 0),
    match_status TEXT NOT NULL CHECK(match_status IN ('exact_match', 'partial_match', 'ambiguous', 'unknown')),
    stock_status TEXT NOT NULL CHECK(stock_status IN ('in_stock', 'low_stock', 'insufficient_stock')),
    available_stock INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 4. ProcessingSessions Table
CREATE TABLE IF NOT EXISTS processing_sessions (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    processing_mode TEXT NOT NULL CHECK(processing_mode IN ('demo_deterministic', 'ai_orchestrated')),
    input_source TEXT NOT NULL,
    raw_message TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'needs_review', 'failed')),
    confidence_score REAL DEFAULT 0.0,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 5. AgentEvents Table (Immutable Audit Log)
CREATE TABLE IF NOT EXISTS agent_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    order_id TEXT,
    event_type TEXT NOT NULL,
    tool_name TEXT,
    outcome TEXT NOT NULL CHECK(outcome IN ('success', 'warning', 'error', 'info')),
    safe_summary TEXT NOT NULL,
    actor TEXT NOT NULL CHECK(actor IN ('agent', 'human')),
    details TEXT, -- JSON string
    created_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES processing_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 6. ApprovalEvents Table (Human-in-the-Loop traceability)
CREATE TABLE IF NOT EXISTS approval_events (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('approved', 'rejected', 'edited', 'clarification_requested')),
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    reviewer_label TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_session_id ON agent_events(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_created_at ON agent_events(created_at);
CREATE INDEX IF NOT EXISTS idx_approval_events_order_id ON approval_events(order_id);

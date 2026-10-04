import { db } from '../db';
import {
  Order,
  OrderItem,
  OrchestrationResult,
  ToolExecutionStep,
  SourceType,
  AgentEvent,
} from '../types';
import {
  parse_order_message,
  search_inventory,
  check_stock,
  validate_order_fields,
  calculate_order_total,
  detect_duplicate_order,
  identify_missing_information,
  generate_customer_reply,
} from './tools';

export async function orchestrateOrderProcessing(params: {
  rawMessage: string;
  sourceType?: SourceType;
  mode?: 'demo_deterministic' | 'ai_orchestrated';
  apiKey?: string;
  aiProvider?: string;
}): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const timeline: ToolExecutionStep[] = [];
  const events: AgentEvent[] = [];
  const settings = db.getSettings();

  const isAiMode = params.mode === 'ai_orchestrated' && Boolean(params.apiKey || settings.api_key);
  const effectiveMode = isAiMode ? 'ai_orchestrated' : 'demo_deterministic';
  const effectiveApiKey = params.apiKey || settings.api_key;
  const effectiveProvider = params.aiProvider || settings.ai_provider;

  // Session Init
  db.createSession({
    id: sessionId,
    order_id: orderId,
    processing_mode: effectiveMode,
    input_source: params.sourceType || 'paste',
    raw_message: params.rawMessage,
    status: 'in_progress',
    confidence_score: 0,
    created_at: new Date().toISOString(),
    completed_at: null,
  });

  const pushEvent = (
    eventType: AgentEvent['event_type'],
    toolName: string | null,
    outcome: AgentEvent['outcome'],
    safeSummary: string,
    details?: Record<string, unknown>
  ) => {
    const evt = db.recordEvent({
      session_id: sessionId,
      order_id: orderId,
      event_type: eventType,
      tool_name: toolName,
      outcome,
      safe_summary: safeSummary,
      actor: 'agent',
      details,
    });
    events.push(evt);
  };

  pushEvent('session_started', null, 'info', `Processing session started via ${params.sourceType || 'paste'}. Mode: ${effectiveMode}`);

  // STEP 1: PARSE MESSAGE
  const step1Start = Date.now();
  let extracted;
  try {
    extracted = await parse_order_message(
      params.rawMessage,
      isAiMode ? 'ai' : 'demo',
      effectiveApiKey,
      effectiveProvider
    );

    const step1Duration = Date.now() - step1Start;
    timeline.push({
      step_number: 1,
      tool_name: 'parse_order_message',
      description: 'Extracted customer information, contact, address, and requested items.',
      status: 'completed',
      duration_ms: step1Duration,
      output: {
        customer_name: extracted.customer_name,
        items_count: extracted.requested_items.length,
      },
    });

    pushEvent(
      'tool_call',
      'parse_order_message',
      'success',
      `Parsed customer: "${extracted.customer_name || 'Unknown'}" with ${extracted.requested_items.length} requested items.`
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    timeline.push({
      step_number: 1,
      tool_name: 'parse_order_message',
      description: 'Failed to parse order message.',
      status: 'failed',
      duration_ms: Date.now() - step1Start,
    });
    pushEvent('error', 'parse_order_message', 'error', `Parsing failure: ${errMsg}`);
    throw err;
  }

  // STEP 2 & 3: INVENTORY SEARCH & STOCK VERIFICATION
  const step2Start = Date.now();
  const orderItems: OrderItem[] = [];
  let hasStockShortage = false;
  let hasAmbiguousProduct = false;

  for (let idx = 0; idx < extracted.requested_items.length; idx++) {
    const reqItem = extracted.requested_items[idx];
    const itemId = `item-${orderId}-${idx + 1}`;

    // Search inventory
    const searchRes = search_inventory(reqItem.name, reqItem.variant);

    let unitPrice = 0;
    let lineTotal = 0;
    let stockStatus: OrderItem['stock_status'] = 'in_stock';
    let availableStock = 0;

    if (searchRes.product) {
      unitPrice = searchRes.product.price;
      lineTotal = Math.round(unitPrice * reqItem.quantity * 100) / 100;

      // Check Stock
      const stockRes = check_stock(searchRes.product.id, reqItem.quantity);
      stockStatus = stockRes.stock_status;
      availableStock = stockRes.available_stock;

      if (stockStatus === 'insufficient_stock') {
        hasStockShortage = true;
      }

      orderItems.push({
        id: itemId,
        order_id: orderId,
        product_id: searchRes.product.id,
        product_name_snapshot: searchRes.product.name,
        quantity: reqItem.quantity,
        unit_price_snapshot: unitPrice,
        variant: reqItem.variant || searchRes.product.variants[0] || null,
        line_total: lineTotal,
        match_status: searchRes.match_status,
        stock_status: stockStatus,
        available_stock: availableStock,
        raw_mention: reqItem.raw_text,
      });

      pushEvent(
        'tool_call',
        'search_inventory',
        'success',
        `Matched "${reqItem.name}" -> ${searchRes.product.sku} ($${unitPrice}). Stock: ${availableStock}/${reqItem.quantity}.`
      );
    } else if (searchRes.match_status === 'ambiguous') {
      hasAmbiguousProduct = true;
      orderItems.push({
        id: itemId,
        order_id: orderId,
        product_id: null,
        product_name_snapshot: `${reqItem.name} (Ambiguous Variant)`,
        quantity: reqItem.quantity,
        unit_price_snapshot: 0,
        variant: reqItem.variant || null,
        line_total: 0,
        match_status: 'ambiguous',
        stock_status: 'insufficient_stock',
        available_stock: 0,
        raw_mention: reqItem.raw_text,
        candidate_matches: searchRes.candidates.map((c) => ({
          id: c.id,
          name: c.name,
          sku: c.sku,
          price: c.price,
          stock: c.stock_quantity,
          variant: c.variants.join(', '),
        })),
      });

      pushEvent(
        'tool_call',
        'search_inventory',
        'warning',
        `Ambiguous product match for "${reqItem.name}". Found ${searchRes.candidates.length} candidate variants.`
      );
    } else {
      // Unknown product
      orderItems.push({
        id: itemId,
        order_id: orderId,
        product_id: null,
        product_name_snapshot: reqItem.name,
        quantity: reqItem.quantity,
        unit_price_snapshot: 0,
        variant: reqItem.variant || null,
        line_total: 0,
        match_status: 'unknown',
        stock_status: 'insufficient_stock',
        available_stock: 0,
        raw_mention: reqItem.raw_text,
      });

      pushEvent(
        'tool_call',
        'search_inventory',
        'warning',
        `Unknown product "${reqItem.name}" could not be matched against current inventory.`
      );
    }
  }

  const step2Duration = Date.now() - step2Start;
  timeline.push({
    step_number: 2,
    tool_name: 'search_inventory & check_stock',
    description: 'Searched real database inventory and checked real-time stock levels.',
    status: hasStockShortage || hasAmbiguousProduct ? 'warning' : 'completed',
    duration_ms: step2Duration,
    output: {
      matched_items: orderItems.filter((i) => i.match_status === 'exact_match' || i.match_status === 'partial_match').length,
      shortages: hasStockShortage,
      ambiguities: hasAmbiguousProduct,
    },
  });

  // STEP 4: FINANCIAL ARITHMETIC (Deterministic Calculation)
  const step3Start = Date.now();
  const financialTotals = calculate_order_total(
    orderItems,
    settings.tax_rate,
    settings.delivery_charge,
    settings.free_delivery_threshold
  );

  timeline.push({
    step_number: 3,
    tool_name: 'calculate_order_total',
    description: 'Calculated subtotal, configured tax, and applicable delivery charge deterministically.',
    status: 'completed',
    duration_ms: Date.now() - step3Start,
    output: financialTotals,
  });

  pushEvent(
    'calculation',
    'calculate_order_total',
    'success',
    `Totals calculated: Subtotal $${financialTotals.subtotal}, Tax $${financialTotals.tax}, Delivery $${financialTotals.delivery_charge}, Total $${financialTotals.total}.`
  );

  // STEP 5: DUPLICATE DETECTION
  const step4Start = Date.now();
  const duplicateWarning = detect_duplicate_order(extracted.customer_name, orderItems);
  timeline.push({
    step_number: 4,
    tool_name: 'detect_duplicate_order',
    description: 'Checked existing orders in database for duplicate submissions.',
    status: duplicateWarning ? 'warning' : 'completed',
    duration_ms: Date.now() - step4Start,
    output: { duplicate_found: Boolean(duplicateWarning) },
  });

  if (duplicateWarning) {
    pushEvent(
      'validation_warning',
      'detect_duplicate_order',
      'warning',
      `Potential duplicate order detected: ${duplicateWarning.similarity_reason}`
    );
  }

  // STEP 6: VALIDATE BUSINESS RULES & IDENTIFY MISSING INFO
  const step5Start = Date.now();
  const missingInfo = identify_missing_information(extracted);
  const validation = validate_order_fields({
    customer_name: extracted.customer_name,
    delivery_address: extracted.delivery_address,
    items: orderItems,
  });

  const combinedWarnings = [...validation.warnings];
  if (duplicateWarning) {
    combinedWarnings.push(duplicateWarning.similarity_reason || 'Duplicate order suspected.');
  }

  timeline.push({
    step_number: 5,
    tool_name: 'validate_order_fields',
    description: 'Validated required fields, quantities, stock integrity, and business constraints.',
    status: validation.is_valid ? 'completed' : 'warning',
    duration_ms: Date.now() - step5Start,
    output: {
      is_valid: validation.is_valid,
      missing_count: missingInfo.missing_fields.length,
      warnings_count: combinedWarnings.length,
    },
  });

  // STEP 7: DRAFT CUSTOMER RESPONSE GENERATION
  const step6Start = Date.now();
  const draftReply = generate_customer_reply({
    customer_name: extracted.customer_name,
    items: orderItems,
    total: financialTotals.total,
    missing_fields: missingInfo.missing_fields,
    warnings: combinedWarnings,
    has_stock_issue: hasStockShortage,
    has_ambiguity: hasAmbiguousProduct,
  });

  timeline.push({
    step_number: 6,
    tool_name: 'generate_customer_reply',
    description: 'Generated contextual customer response draft (marked for human review, never auto-sent).',
    status: 'completed',
    duration_ms: Date.now() - step6Start,
    output: { draft_length: draftReply.length },
  });

  pushEvent(
    'draft_generated',
    'generate_customer_reply',
    'success',
    'Draft customer response generated for review.'
  );

  // DETERMINE FINAL ORDER STATUS
  let finalStatus: Order['status'] = 'pending_approval';
  let suggestedAction = 'Ready for human reviewer approval.';

  const hasRequiredMissingFields =
    missingInfo.missing_fields.includes('customer_name') ||
    missingInfo.missing_fields.includes('delivery_address');

  if (!validation.is_valid || hasRequiredMissingFields || hasStockShortage || hasAmbiguousProduct) {
    finalStatus = 'needs_clarification';
    if (hasAmbiguousProduct) {
      suggestedAction = 'Clarify product variant with customer or adjust selection in approval queue.';
    } else if (hasStockShortage) {
      suggestedAction = 'Resolve inventory shortage or adjust quantity with customer.';
    } else if (missingInfo.missing_fields.includes('delivery_address')) {
      suggestedAction = 'Obtain customer delivery address before approving order.';
    } else {
      suggestedAction = 'Review missing information before final approval.';
    }
  }

  // Calculate overall confidence score
  let overallConfidence = extracted.confidence_score;
  if (!validation.is_valid) overallConfidence -= 25;
  if (hasStockShortage) overallConfidence -= 15;
  if (hasAmbiguousProduct) overallConfidence -= 20;
  if (duplicateWarning) overallConfidence -= 10;
  overallConfidence = Math.max(10, Math.min(overallConfidence, 98));

  // PERSIST DRAFT ORDER IN DATABASE
  const finalOrder: Order = {
    id: orderId,
    customer_name: extracted.customer_name || 'Customer (Unspecified)',
    customer_contact: extracted.customer_contact || null,
    delivery_address: extracted.delivery_address || null,
    status: finalStatus,
    subtotal: financialTotals.subtotal,
    tax: financialTotals.tax,
    delivery_charge: financialTotals.delivery_charge,
    total: financialTotals.total,
    source_type: params.sourceType || 'paste',
    raw_message: params.rawMessage,
    items: orderItems,
    missing_fields: missingInfo.missing_fields,
    warnings: combinedWarnings,
    suggested_action: suggestedAction,
    draft_response: draftReply,
    confidence_score: overallConfidence,
    duplicate_warning: duplicateWarning,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.createOrder(finalOrder);

  // Update session
  db.updateSession(sessionId, {
    status: finalStatus === 'pending_approval' ? 'completed' : 'needs_review',
    confidence_score: overallConfidence,
    completed_at: new Date().toISOString(),
  });

  pushEvent(
    'plan_generated',
    'create_draft_order',
    'success',
    `Created draft order ${orderId} with status '${finalStatus}' (${overallConfidence}% confidence). Sent to Approval Queue.`
  );

  return {
    session_id: sessionId,
    order: finalOrder,
    timeline,
    confidence_score: overallConfidence,
    processing_mode: effectiveMode,
    events,
  };
}

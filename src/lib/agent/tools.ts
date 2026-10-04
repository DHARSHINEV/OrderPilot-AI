import { db } from '../db';
import {
  OrderItem,
  Order,
  Product,
  MatchStatus,
  StockStatus,
  AgentEvent,
} from '../types';

export interface ExtractedOrderData {
  customer_name?: string | null;
  customer_contact?: string | null;
  delivery_address?: string | null;
  requested_items: Array<{
    name: string;
    quantity: number;
    variant?: string | null;
    raw_text: string;
  }>;
  requested_delivery_date?: string | null;
  special_instructions?: string | null;
  raw_intent?: string;
  confidence_score: number;
}

// 1. PARSE ORDER MESSAGE (Deterministic + LLM support)
export async function parse_order_message(
  message: string,
  mode: 'demo' | 'ai' = 'demo',
  apiKey?: string,
  aiProvider?: string
): Promise<ExtractedOrderData> {
  if (!message || !message.trim()) {
    return {
      customer_name: null,
      customer_contact: null,
      delivery_address: null,
      requested_items: [],
      confidence_score: 0,
    };
  }

  // If AI mode is requested and API key is provided, try LLM call with safety fallback
  if (mode === 'ai' && apiKey && apiKey.trim()) {
    try {
      const aiResult = await callLlmParser(message, apiKey, aiProvider || 'gemini');
      if (aiResult && aiResult.requested_items && Array.isArray(aiResult.requested_items)) {
        return aiResult;
      }
    } catch (err) {
      console.warn('AI Parsing failed, falling back to deterministic parser:', err);
      // Deterministic fallback continues below
    }
  }

  // Deterministic Pattern-Based Parser (Demo Mode)
  return parseDeterministicMessage(message);
}

// Deterministic Parsing Implementation
function parseDeterministicMessage(message: string): ExtractedOrderData {
  let customerName: string | null = null;
  let customerContact: string | null = null;
  let deliveryAddress: string | null = null;
  let requestedDeliveryDate: string | null = null;
  const specialInstructions: string[] = [];

  // Extract customer name
  const namePatterns = [
    /(?:my name is|i am|i'm|this is|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /name:\s*([A-Za-z\s]+?)(?:[.,\n]|$)/i,
  ];
  for (const pat of namePatterns) {
    const m = message.match(pat);
    if (m && m[1]) {
      customerName = m[1].trim();
      break;
    }
  }

  // Extract phone number or email
  const phoneMatch = message.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) {
    customerContact = phoneMatch[0].trim();
  }
  const emailMatch = message.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    customerContact = customerContact ? `${customerContact}, ${emailMatch[0]}` : emailMatch[0];
  }

  // Extract delivery address
  const addressPatterns = [
    /(?:deliver to|deliver at|address:\s*|send to)\s+([^.\n]+?(?:road|street|st|lane|rd|ave|avenue|apt|apartment|nagar|park|colony|block|sector)?[^.\n]*)/i,
    /address:\s*([^.\n]+)/i,
  ];
  for (const pat of addressPatterns) {
    const m = message.match(pat);
    if (m && m[1]) {
      let addr = m[1].trim();
      // clean up trailing conversational words
      addr = addr.replace(/\s+(please|my name|urgently|thanks|thank you).*$/i, '').trim();
      deliveryAddress = addr;
      break;
    }
  }

  // Extract requested date / urgency
  if (/tomorrow/i.test(message)) {
    requestedDeliveryDate = 'Tomorrow';
  } else if (/urgent|urgently/i.test(message)) {
    requestedDeliveryDate = 'Urgent / Priority';
  }

  // Extract special instructions
  if (/send the total price before confirming/i.test(message)) {
    specialInstructions.push('Customer requested total price confirmation before finalizing.');
  }
  if (/please confirm availability/i.test(message)) {
    specialInstructions.push('Customer requested stock availability confirmation.');
  }

  // Extract requested items with quantities & variants
  const requestedItems: ExtractedOrderData['requested_items'] = [];

  // Patterns like "3 blue cotton shirts in medium", "4 packets of A4 paper", "10 notebooks, 5 pens and 2 geometry boxes"
  const itemRegex =
    /(?:need|send|want|order|deliver)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:packets? of|pieces? of|packs? of)?\s*([a-zA-Z0-9\s-]+?)(?=(?:,\s*|\s+and\s+|\s+deliver|\s+address|\s+my name|\s+please|\s+for tomorrow|\.|$))/gi;

  const numberMap: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(message)) !== null) {
    const rawQty = match[1].toLowerCase();
    const qty = numberMap[rawQty] || parseInt(rawQty, 10);
    const itemPhrase = match[2].trim();

    // Ignore if this match is part of the delivery address or looks like an address
    const isAddressPhrase =
      (deliveryAddress && deliveryAddress.toLowerCase().includes(itemPhrase.toLowerCase())) ||
      /(?:road|street|st\b|lane|ave|avenue|apt|apartment|park|colony|block|sector|drive|dr\b|way\b)/i.test(itemPhrase);

    if (qty > 0 && itemPhrase.length > 2 && !isAddressPhrase) {
      // Check for variant like "in medium", "large", "size M", "blue"
      let variant: string | null = null;
      let cleanedName = itemPhrase;

      if (/in medium|size medium|\bm\b/i.test(itemPhrase)) {
        variant = 'Medium';
        cleanedName = cleanedName.replace(/in medium|size medium|\bm\b/gi, '').trim();
      } else if (/in large|size large|\bl\b/i.test(itemPhrase)) {
        variant = 'Large';
        cleanedName = cleanedName.replace(/in large|size large|\bl\b/gi, '').trim();
      }

      requestedItems.push({
        name: cleanedName.replace(/\s+/g, ' '),
        quantity: qty,
        variant,
        raw_text: match[0].trim(),
      });
    }
  }

  // Fallback item extraction if standard regex missed items
  if (requestedItems.length === 0) {
    const fallbackMatches = message.match(/\b(\d+)\s+([a-zA-Z\s]{3,30})/g);
    if (fallbackMatches) {
      for (const m of fallbackMatches) {
        const parts = m.trim().split(/\s+/);
        const q = parseInt(parts[0], 10);
        const name = parts.slice(1).join(' ');
        if (!isNaN(q) && q > 0 && !name.toLowerCase().includes('lake') && !name.toLowerCase().includes('street')) {
          requestedItems.push({
            name,
            quantity: q,
            variant: null,
            raw_text: m,
          });
        }
      }
    }
  }

  // Calculate baseline confidence
  let confidence = 50;
  if (customerName) confidence += 20;
  if (deliveryAddress) confidence += 20;
  if (requestedItems.length > 0) confidence += 10;

  return {
    customer_name: customerName,
    customer_contact: customerContact,
    delivery_address: deliveryAddress,
    requested_items: requestedItems,
    requested_delivery_date: requestedDeliveryDate,
    special_instructions: specialInstructions.length > 0 ? specialInstructions.join('; ') : null,
    confidence_score: Math.min(confidence, 100),
  };
}

// 2. SEARCH INVENTORY (Exact, Partial, Ambiguous, Unknown)
export function search_inventory(
  query: string,
  variant?: string | null
): {
  match_status: MatchStatus;
  product: Product | null;
  candidates: Product[];
  confidence: number;
} {
  const allProducts = db.getProducts();
  const qClean = query.toLowerCase().trim();
  const vClean = variant ? variant.toLowerCase().trim() : '';

  // 1. Check exact name match
  const exact = allProducts.find(
    (p) =>
      p.name.toLowerCase() === qClean ||
      p.sku.toLowerCase() === qClean ||
      (vClean && p.name.toLowerCase().includes(qClean) && p.variants.some((v) => v.toLowerCase() === vClean))
  );

  if (exact) {
    return {
      match_status: 'exact_match',
      product: exact,
      candidates: [exact],
      confidence: 1.0,
    };
  }

  // 2. Token match / Fuzzy matching
  const queryTokens = qClean.split(/[\s,]+/).filter((t) => t.length > 2);
  const scoredProducts = allProducts.map((p) => {
    let score = 0;
    const pName = p.name.toLowerCase();
    const pCat = p.category.toLowerCase();

    for (const t of queryTokens) {
      if (pName.includes(t)) score += 2;
      if (pCat.includes(t)) score += 1;
    }

    if (vClean && p.variants.some((v) => v.toLowerCase().includes(vClean))) {
      score += 2;
    }

    return { product: p, score };
  });

  const matches = scoredProducts.filter((sp) => sp.score > 1).sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    return {
      match_status: 'unknown',
      product: null,
      candidates: [],
      confidence: 0.0,
    };
  }

  // Check if multiple products have the top score (Ambiguous match)
  if (matches.length > 1 && matches[0].score === matches[1].score && !vClean) {
    return {
      match_status: 'ambiguous',
      product: null,
      candidates: matches.map((m) => m.product),
      confidence: 0.5,
    };
  }

  // Unique top partial match
  return {
    match_status: 'partial_match',
    product: matches[0].product,
    candidates: matches.map((m) => m.product),
    confidence: 0.85,
  };
}

// 3. CHECK STOCK
export function check_stock(
  productId: string,
  requestedQty: number
): {
  stock_status: StockStatus;
  available_stock: number;
  is_available: boolean;
  warning?: string;
} {
  const product = db.getProductById(productId);
  if (!product) {
    return {
      stock_status: 'insufficient_stock',
      available_stock: 0,
      is_available: false,
      warning: `Product ${productId} not found in inventory.`,
    };
  }

  if (requestedQty <= 0) {
    return {
      stock_status: 'insufficient_stock',
      available_stock: product.stock_quantity,
      is_available: false,
      warning: `Requested quantity must be positive (received: ${requestedQty}).`,
    };
  }

  if (product.stock_quantity < requestedQty) {
    return {
      stock_status: 'insufficient_stock',
      available_stock: product.stock_quantity,
      is_available: false,
      warning: `Insufficient stock for "${product.name}". Requested: ${requestedQty}, Available: ${product.stock_quantity}.`,
    };
  }

  if (product.stock_quantity <= product.low_stock_threshold) {
    return {
      stock_status: 'low_stock',
      available_stock: product.stock_quantity,
      is_available: true,
      warning: `Low stock alert: "${product.name}" has only ${product.stock_quantity} units remaining (threshold: ${product.low_stock_threshold}).`,
    };
  }

  return {
    stock_status: 'in_stock',
    available_stock: product.stock_quantity,
    is_available: true,
  };
}

// 4. VALIDATE ORDER FIELDS
export function validate_order_fields(orderData: {
  customer_name?: string | null;
  delivery_address?: string | null;
  items: OrderItem[];
}): {
  is_valid: boolean;
  missing_fields: string[];
  warnings: string[];
  blocking_reasons: string[];
} {
  const missing_fields: string[] = [];
  const warnings: string[] = [];
  const blocking_reasons: string[] = [];

  if (!orderData.customer_name || !orderData.customer_name.trim()) {
    missing_fields.push('customer_name');
    blocking_reasons.push('Customer name is required for order approval.');
  }

  if (!orderData.delivery_address || !orderData.delivery_address.trim()) {
    missing_fields.push('delivery_address');
    blocking_reasons.push('Delivery address is required for dispatch.');
  }

  if (!orderData.items || orderData.items.length === 0) {
    blocking_reasons.push('Order contains no valid items.');
  } else {
    // Check duplicate lines
    const seenProductIds = new Set<string>();
    for (const item of orderData.items) {
      if (item.quantity <= 0) {
        blocking_reasons.push(`Invalid quantity ${item.quantity} for item "${item.product_name_snapshot}".`);
      }

      if (item.match_status === 'unknown') {
        warnings.push(`Unknown product: "${item.product_name_snapshot}" could not be matched in inventory.`);
        blocking_reasons.push(`Unmatched product "${item.product_name_snapshot}".`);
      } else if (item.match_status === 'ambiguous') {
        warnings.push(`Ambiguous product: "${item.product_name_snapshot}" has multiple matching variants. Human review required.`);
        blocking_reasons.push(`Ambiguous variant for "${item.product_name_snapshot}".`);
      }

      if (item.stock_status === 'insufficient_stock') {
        warnings.push(`Stock shortage: "${item.product_name_snapshot}" requested ${item.quantity}, available: ${item.available_stock}.`);
        blocking_reasons.push(`Insufficient inventory for "${item.product_name_snapshot}".`);
      }

      if (item.product_id) {
        if (seenProductIds.has(item.product_id)) {
          warnings.push(`Duplicate line item detected for product "${item.product_name_snapshot}".`);
        }
        seenProductIds.add(item.product_id);
      }
    }
  }

  return {
    is_valid: blocking_reasons.length === 0,
    missing_fields,
    warnings,
    blocking_reasons,
  };
}

// 5. CALCULATE ORDER TOTAL (Strictly Deterministic Financial Arithmetic)
export function calculate_order_total(
  items: OrderItem[],
  taxRate: number = 0.05,
  deliveryCharge: number = 5.0,
  freeDeliveryThreshold: number = 50.0
): {
  subtotal: number;
  tax: number;
  delivery_charge: number;
  total: number;
} {
  const subtotal = items.reduce((acc, item) => acc + (item.line_total || 0), 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const tax = Math.round(roundedSubtotal * taxRate * 100) / 100;
  const applicableDelivery = roundedSubtotal >= freeDeliveryThreshold || roundedSubtotal === 0 ? 0.0 : deliveryCharge;
  const total = Math.round((roundedSubtotal + tax + applicableDelivery) * 100) / 100;

  return {
    subtotal: roundedSubtotal,
    tax,
    delivery_charge: applicableDelivery,
    total,
  };
}

// 6. DETECT DUPLICATE ORDER
export function detect_duplicate_order(
  customerName?: string | null,
  items?: OrderItem[]
): {
  is_duplicate: boolean;
  existing_order_id?: string;
  similarity_reason?: string;
} | null {
  if (!customerName || !items || items.length === 0) return null;

  const existingOrders = db.getOrders();
  const nameClean = customerName.toLowerCase().trim();

  // Find recent orders within 24 hours for the same customer
  const now = new Date().getTime();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  for (const existing of existingOrders) {
    if (existing.customer_name.toLowerCase().trim() === nameClean) {
      const orderTime = new Date(existing.created_at).getTime();
      if (orderTime > dayAgo) {
        // Compare items
        const existingItemIds = existing.items.map((i) => i.product_id).filter(Boolean);
        const currentItemIds = items.map((i) => i.product_id).filter(Boolean);

        const hasOverlap = currentItemIds.some((id) => existingItemIds.includes(id));
        if (hasOverlap) {
          return {
            is_duplicate: true,
            existing_order_id: existing.id,
            similarity_reason: `Identical/similar order placed by ${customerName} recently (${existing.id}).`,
          };
        }
      }
    }
  }

  return null;
}

// 7. IDENTIFY MISSING INFORMATION
export function identify_missing_information(extractedData: ExtractedOrderData): {
  missing_fields: string[];
  clarification_prompts: string[];
} {
  const missing_fields: string[] = [];
  const clarification_prompts: string[] = [];

  if (!extractedData.customer_name) {
    missing_fields.push('customer_name');
    clarification_prompts.push('Customer full name was not provided.');
  }

  if (!extractedData.delivery_address) {
    missing_fields.push('delivery_address');
    clarification_prompts.push('Delivery address was not specified.');
  }

  if (!extractedData.customer_contact) {
    missing_fields.push('customer_contact');
    clarification_prompts.push('Contact number or email is missing.');
  }

  return {
    missing_fields,
    clarification_prompts,
  };
}

// 8. GENERATE CUSTOMER REPLY (Marked as AI-generated draft, not automatically sent)
export function generate_customer_reply(params: {
  customer_name?: string | null;
  items: OrderItem[];
  total: number;
  missing_fields: string[];
  warnings: string[];
  has_stock_issue: boolean;
  has_ambiguity: boolean;
}): string {
  const greeting = params.customer_name ? `Hi ${params.customer_name},` : 'Hello,';

  if (params.has_ambiguity) {
    return `${greeting} thank you for reaching out! Could you please clarify which product variant or size you need? We found more than one matching option in our inventory and want to ensure we prepare the exact right item for you.`;
  }

  if (params.has_stock_issue) {
    const shortageItems = params.items
      .filter((i) => i.stock_status === 'insufficient_stock')
      .map((i) => `${i.product_name_snapshot} (requested ${i.quantity}, currently in stock: ${i.available_stock})`)
      .join(', ');

    return `${greeting} thank you for your order. We are reviewing your request, but currently have limited stock for: ${shortageItems}. Would you like us to fulfill the available units or suggest an alternative before finalizing?`;
  }

  if (params.missing_fields.includes('delivery_address')) {
    return `${greeting} thank you for your order! We have reserved your items. Could you please confirm your complete delivery address so we can calculate final shipping and schedule dispatch?`;
  }

  if (params.missing_fields.includes('customer_name')) {
    return `${greeting} thank you for your order. Could you please confirm your full name so we can record your order accurately?`;
  }

  const itemsSummary = params.items.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ');

  if (params.missing_fields.includes('customer_contact')) {
    return `${greeting} thank you for your order! Here is your order summary for review: ${itemsSummary}. Total: $${params.total.toFixed(2)}. Please confirm that the details are correct, and let us know a phone or contact number if possible before we finalize dispatch.`;
  }

  return `${greeting} thank you for your order! Here is your order summary for review: ${itemsSummary}. Total: $${params.total.toFixed(2)}. Please confirm that the details are correct before we finalize dispatch.`;
}

// 9. CREATE DRAFT ORDER
export function create_draft_order(order: Order): Order {
  return db.createOrder(order);
}

// 10. APPROVE ORDER
export function approve_order(orderId: string, reviewer: string, notes?: string): Order {
  return db.approveOrderAtomically(orderId, reviewer, notes);
}

// 11. REJECT ORDER
export function reject_order(orderId: string, reason: string, reviewer: string): Order {
  return db.rejectOrder(orderId, reason, reviewer);
}

// 12. RECORD AGENT ACTIVITY
export function record_agent_activity(
  sessionId: string,
  event: Omit<AgentEvent, 'id' | 'created_at'>
): AgentEvent {
  return db.recordEvent(event);
}

// Helper: Call LLM API (Google Gemini / OpenAI / Anthropic) with strict JSON validation
async function callLlmParser(
  message: string,
  apiKey: string,
  provider: string
): Promise<ExtractedOrderData | null> {
  const prompt = `You are OrderPilot AI's structured message parser.
Extract order details from this customer message into strictly valid JSON matching this schema:
{
  "customer_name": string or null,
  "customer_contact": string or null,
  "delivery_address": string or null,
  "requested_delivery_date": string or null,
  "special_instructions": string or null,
  "requested_items": [
    {
      "name": string,
      "quantity": number,
      "variant": string or null,
      "raw_text": string
    }
  ]
}
Do NOT hallucinate or invent missing data. If not mentioned, set to null.
Customer message:
"""${message}"""`;

  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        throw new Error(`Gemini API error: ${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No content returned from Gemini');

      const parsed = JSON.parse(text);
      parsed.confidence_score = 90;
      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  // OpenAI / generic compatible
  if (provider === 'openai') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error(`OpenAI API error: ${resp.status}`);
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('No content returned');
      const parsed = JSON.parse(text);
      parsed.confidence_score = 92;
      return parsed;
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
}

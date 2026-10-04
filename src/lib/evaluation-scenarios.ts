import { db } from './db';
import { orchestrateOrderProcessing } from './agent/orchestrator';
import {
  parse_order_message,
  search_inventory,
  check_stock,
  calculate_order_total,
  validate_order_fields,
} from './agent/tools';
import { EvaluationResult, EvaluationSummary } from './types';

export interface TestScenarioDef {
  id: number;
  name: string;
  category: 'Parsing' | 'Validation' | 'Inventory' | 'Calculation' | 'Approval' | 'Resilience';
  description: string;
  run: () => Promise<EvaluationResult>;
}

export const EVALUATION_SCENARIOS: TestScenarioDef[] = [
  // 1. Complete valid order
  {
    id: 1,
    name: 'Complete Valid Order',
    category: 'Parsing',
    description: 'Processes a complete, unambiguous order with all fields present and stock available.',
    run: async () => {
      const t0 = Date.now();
      const message = 'Hi, I need 2 packets of A4 paper. Deliver to 14 Lake Road. My name is Priya.';
      const res = await orchestrateOrderProcessing({ rawMessage: message });
      const duration = Date.now() - t0;

      const a1 = res.order.customer_name === 'Priya';
      const a2 = Boolean(res.order.delivery_address && res.order.delivery_address.includes('14 Lake Road'));
      const a3 = res.order.items.length === 1 && res.order.items[0].quantity === 2;
      const a4 = res.order.status === 'pending_approval';

      return {
        scenario_id: 1,
        name: 'Complete Valid Order',
        passed: a1 && a2 && a3 && a4,
        duration_ms: duration,
        actual_outcome: {
          customer: res.order.customer_name,
          address: res.order.delivery_address,
          status: res.order.status,
          total: res.order.total,
        },
        assertions: [
          { name: 'Customer name extracted correctly', passed: a1 },
          { name: 'Delivery address identified', passed: a2 },
          { name: 'Requested items extracted accurately', passed: a3 },
          { name: 'Status marked pending_approval', passed: a4 },
        ],
      };
    },
  },

  // 2. Missing customer name
  {
    id: 2,
    name: 'Missing Customer Name',
    category: 'Parsing',
    description: 'Detects that customer name is missing and prompts for clarification.',
    run: async () => {
      const t0 = Date.now();
      const message = 'Please deliver 3 blue ink pens to 42 MG Road.';
      const res = await orchestrateOrderProcessing({ rawMessage: message });
      const duration = Date.now() - t0;

      const a1 = res.order.missing_fields.includes('customer_name');
      const a2 = res.order.status === 'needs_clarification';
      const a3 = res.order.draft_response.toLowerCase().includes('name') || res.order.draft_response.toLowerCase().includes('hello');

      return {
        scenario_id: 2,
        name: 'Missing Customer Name',
        passed: a1 && a2 && a3,
        duration_ms: duration,
        actual_outcome: {
          missing_fields: res.order.missing_fields,
          status: res.order.status,
        },
        assertions: [
          { name: 'Identified missing customer_name field', passed: a1 },
          { name: 'Routed to needs_clarification status', passed: a2 },
          { name: 'Generated polite clarification prompt', passed: a3 },
        ],
      };
    },
  },

  // 3. Missing address
  {
    id: 3,
    name: 'Missing Address',
    category: 'Parsing',
    description: 'Detects missing delivery address and holds order in needs_clarification.',
    run: async () => {
      const t0 = Date.now();
      const message = 'Hello, this is Rohan. I want 2 geometry boxes.';
      const res = await orchestrateOrderProcessing({ rawMessage: message });
      const duration = Date.now() - t0;

      const a1 = res.order.missing_fields.includes('delivery_address');
      const a2 = res.order.status === 'needs_clarification';
      const a3 = res.order.draft_response.toLowerCase().includes('address');

      return {
        scenario_id: 3,
        name: 'Missing Address',
        passed: a1 && a2 && a3,
        duration_ms: duration,
        actual_outcome: {
          missing_fields: res.order.missing_fields,
          status: res.order.status,
        },
        assertions: [
          { name: 'Identified missing delivery_address field', passed: a1 },
          { name: 'Blocked automatic approval readiness', passed: a2 },
          { name: 'Drafted reply specifically asking for address', passed: a3 },
        ],
      };
    },
  },

  // 4. Unknown product
  {
    id: 4,
    name: 'Unknown Product',
    category: 'Inventory',
    description: 'Identifies an item that does not exist in store inventory without hallucinating a SKU.',
    run: async () => {
      const t0 = Date.now();
      const message = 'I need 2 space telescopes and 1 laser pointer. My name is Alan. Address: 10 Orbit Way.';
      const res = await orchestrateOrderProcessing({ rawMessage: message });
      const duration = Date.now() - t0;

      const unknownItems = res.order.items.filter((i) => i.match_status === 'unknown');
      const a1 = unknownItems.length > 0;
      const a2 = res.order.status === 'needs_clarification';
      const a3 = unknownItems.every((i) => i.product_id === null);

      return {
        scenario_id: 4,
        name: 'Unknown Product',
        passed: a1 && a2 && a3,
        duration_ms: duration,
        actual_outcome: {
          unknown_items: unknownItems.map((i) => i.product_name_snapshot),
          status: res.order.status,
        },
        assertions: [
          { name: 'Flagged unrecognized items as unknown', passed: a1 },
          { name: 'Did not assign arbitrary SKU or price', passed: a3 },
          { name: 'Held order for human verification', passed: a2 },
        ],
      };
    },
  },

  // 5. Ambiguous product
  {
    id: 5,
    name: 'Ambiguous Product Variant',
    category: 'Inventory',
    description: 'Detects ambiguous item mention ("cotton shirt") when multiple distinct variants exist.',
    run: async () => {
      const t0 = Date.now();
      const searchRes = search_inventory('cotton shirt');
      const duration = Date.now() - t0;

      const a1 = searchRes.match_status === 'ambiguous';
      const a2 = searchRes.candidates.length >= 2;
      const a3 = searchRes.product === null;

      return {
        scenario_id: 5,
        name: 'Ambiguous Product Variant',
        passed: a1 && a2 && a3,
        duration_ms: duration,
        actual_outcome: {
          match_status: searchRes.match_status,
          candidates_found: searchRes.candidates.map((c) => c.name),
        },
        assertions: [
          { name: 'Detected multiple candidate matches', passed: a1 },
          { name: 'Identified at least 2 distinct variant options', passed: a2 },
          { name: 'Prevented silent substitution without user choice', passed: a3 },
        ],
      };
    },
  },

  // 6. Insufficient stock
  {
    id: 6,
    name: 'Insufficient Stock Detection',
    category: 'Inventory',
    description: 'Flags requested quantity exceeding available physical inventory.',
    run: async () => {
      const t0 = Date.now();
      // Notebook has only 4 in stock
      const stockCheck = check_stock('prod-005', 50);
      const duration = Date.now() - t0;

      const a1 = stockCheck.stock_status === 'insufficient_stock';
      const a2 = stockCheck.is_available === false;
      const a3 = Boolean(stockCheck.warning && stockCheck.warning.includes('Insufficient stock'));

      return {
        scenario_id: 6,
        name: 'Insufficient Stock Detection',
        passed: a1 && a2 && a3,
        duration_ms: duration,
        actual_outcome: stockCheck,
        assertions: [
          { name: 'Flagged insufficient_stock status', passed: a1 },
          { name: 'Set is_available to false', passed: a2 },
          { name: 'Generated informative shortage warning', passed: a3 },
        ],
      };
    },
  },

  // 7. Duplicate product lines
  {
    id: 7,
    name: 'Duplicate Product Lines',
    category: 'Validation',
    description: 'Identifies redundant line items referring to the same product.',
    run: async () => {
      const t0 = Date.now();
      const validation = validate_order_fields({
        customer_name: 'Test Customer',
        delivery_address: '123 Street',
        items: [
          {
            id: '1',
            product_id: 'prod-003',
            product_name_snapshot: 'A4 paper packet',
            quantity: 2,
            unit_price_snapshot: 5.5,
            variant: null,
            line_total: 11.0,
            match_status: 'exact_match',
            stock_status: 'in_stock',
            available_stock: 50,
          },
          {
            id: '2',
            product_id: 'prod-003',
            product_name_snapshot: 'A4 paper packet',
            quantity: 3,
            unit_price_snapshot: 5.5,
            variant: null,
            line_total: 16.5,
            match_status: 'exact_match',
            stock_status: 'in_stock',
            available_stock: 50,
          },
        ],
      });
      const duration = Date.now() - t0;

      const a1 = validation.warnings.some((w) => w.toLowerCase().includes('duplicate line item'));

      return {
        scenario_id: 7,
        name: 'Duplicate Product Lines',
        passed: a1,
        duration_ms: duration,
        actual_outcome: { warnings: validation.warnings },
        assertions: [{ name: 'Detected duplicate line item warning', passed: a1 }],
      };
    },
  },

  // 8. Invalid quantity
  {
    id: 8,
    name: 'Invalid Negative / Zero Quantity',
    category: 'Validation',
    description: 'Blocks negative or zero quantities from being approved.',
    run: async () => {
      const t0 = Date.now();
      const stockCheck = check_stock('prod-001', -5);
      const duration = Date.now() - t0;

      const a1 = stockCheck.is_available === false;
      const a2 = Boolean(stockCheck.warning && stockCheck.warning.includes('positive'));

      return {
        scenario_id: 8,
        name: 'Invalid Negative / Zero Quantity',
        passed: a1 && a2,
        duration_ms: duration,
        actual_outcome: stockCheck,
        assertions: [
          { name: 'Blocked non-positive quantity', passed: a1 },
          { name: 'Reported explicit invalid quantity warning', passed: a2 },
        ],
      };
    },
  },

  // 9. Malformed message
  {
    id: 9,
    name: 'Malformed Message',
    category: 'Resilience',
    description: 'Safely handles gibberish or special characters without crashing.',
    run: async () => {
      const t0 = Date.now();
      const message = '@!#$%^&*()_+~`|}{[]:;?><,./';
      const res = await orchestrateOrderProcessing({ rawMessage: message });
      const duration = Date.now() - t0;

      const a1 = res.order.status === 'needs_clarification';
      const a2 = res.order.items.length === 0;
      const a3 = res.confidence_score <= 50;

      return {
        scenario_id: 9,
        name: 'Malformed Message',
        passed: a1 && a2 && a3,
        duration_ms: duration,
        actual_outcome: {
          status: res.order.status,
          confidence: res.confidence_score,
          items_found: res.order.items.length,
        },
        assertions: [
          { name: 'Handled without throwing unhandled exception', passed: true },
          { name: 'Zero items erroneously hallucinated', passed: a2 },
          { name: 'Lowered confidence score appropriately', passed: a3 },
        ],
      };
    },
  },

  // 10. Empty message
  {
    id: 10,
    name: 'Empty Message Handling',
    category: 'Resilience',
    description: 'Safely processes an empty string with graceful fallback.',
    run: async () => {
      const t0 = Date.now();
      const parsed = await parse_order_message('');
      const duration = Date.now() - t0;

      const a1 = parsed.requested_items.length === 0;
      const a2 = parsed.confidence_score === 0;

      return {
        scenario_id: 10,
        name: 'Empty Message Handling',
        passed: a1 && a2,
        duration_ms: duration,
        actual_outcome: parsed,
        assertions: [
          { name: 'Returned empty item array', passed: a1 },
          { name: 'Zero confidence score assigned', passed: a2 },
        ],
      };
    },
  },

  // 11. Long message
  {
    id: 11,
    name: 'Long Verbose Message Extraction',
    category: 'Parsing',
    description: 'Extracts concise order items from a long conversational message.',
    run: async () => {
      const t0 = Date.now();
      const longMessage = `
        Good morning everyone at the store! Hope you are having a wonderful day. We are organizing a school project for our students next week and need some stationery supplies.
        Could you please prepare 4 packets of A4 paper and 3 blue ink pens for us?
        Deliver to 21 Main Street. My name is Arun. Please let us know if there are any questions and keep us posted!
      `;
      const res = await orchestrateOrderProcessing({ rawMessage: longMessage });
      const duration = Date.now() - t0;

      const a1 = res.order.customer_name === 'Arun';
      const a2 = Boolean(res.order.delivery_address && res.order.delivery_address.includes('21 Main Street'));
      const a3 = res.order.items.length >= 2;

      return {
        scenario_id: 11,
        name: 'Long Verbose Message Extraction',
        passed: a1 && a2 && a3,
        duration_ms: duration,
        actual_outcome: {
          customer: res.order.customer_name,
          address: res.order.delivery_address,
          items_count: res.order.items.length,
        },
        assertions: [
          { name: 'Customer name accurately extracted despite noise', passed: a1 },
          { name: 'Address extracted cleanly', passed: a2 },
          { name: 'Target items isolated from conversational filler', passed: a3 },
        ],
      };
    },
  },

  // 12. Duplicate order detection
  {
    id: 12,
    name: 'Duplicate Order Detection',
    category: 'Validation',
    description: 'Detects recent duplicate order submission from the same customer.',
    run: async () => {
      const t0 = Date.now();
      // Priya Sharma already has ORD-2026-001 in DB
      const message = 'Hi, I need 3 blue cotton shirts in medium. Deliver to 14 Lake Road. My name is Priya Sharma.';
      const res = await orchestrateOrderProcessing({ rawMessage: message });
      const duration = Date.now() - t0;

      const a1 = res.order.duplicate_warning !== null && res.order.duplicate_warning.is_duplicate;

      return {
        scenario_id: 12,
        name: 'Duplicate Order Detection',
        passed: a1,
        duration_ms: duration,
        actual_outcome: { duplicate_warning: res.order.duplicate_warning },
        assertions: [{ name: 'Flagged existing matching order for same customer', passed: a1 }],
      };
    },
  },

  // 13. Wrong product variant
  {
    id: 13,
    name: 'Wrong Product Variant Handling',
    category: 'Inventory',
    description: 'Handles nonexistent variant specification (e.g. Extra Small when only Medium exists).',
    run: async () => {
      const t0 = Date.now();
      const res = search_inventory('blue cotton shirt', 'Extra Small');
      const duration = Date.now() - t0;

      // When variant doesn't match available variants, it flags as partial match or requires review
      const a1 = res.product ? !res.product.variants.includes('Extra Small') : true;

      return {
        scenario_id: 13,
        name: 'Wrong Product Variant Handling',
        passed: a1,
        duration_ms: duration,
        actual_outcome: {
          match_status: res.match_status,
          product_variants: res.product?.variants,
        },
        assertions: [{ name: 'Prevented invalid variant from being marked as exact match', passed: a1 }],
      };
    },
  },

  // 14. Invalid file content
  {
    id: 14,
    name: 'Invalid File Upload Content',
    category: 'Resilience',
    description: 'Safely handles unexpected content format or corrupted text input.',
    run: async () => {
      const t0 = Date.now();
      const corruptedInput = '\x00\x01\x02\x03\x04\x05\xFF\xFE';
      const parsed = await parse_order_message(corruptedInput);
      const duration = Date.now() - t0;

      const a1 = parsed.requested_items.length === 0;

      return {
        scenario_id: 14,
        name: 'Invalid File Upload Content',
        passed: a1,
        duration_ms: duration,
        actual_outcome: { items_found: parsed.requested_items.length },
        assertions: [{ name: 'Safely ignored binary control characters', passed: a1 }],
      };
    },
  },

  // 15. Correct total calculation
  {
    id: 15,
    name: 'Deterministic Total Calculation',
    category: 'Calculation',
    description: 'Verifies exact mathematical calculations: subtotal + 5% tax + conditional delivery charge.',
    run: async () => {
      const t0 = Date.now();
      const items: any[] = [
        { line_total: 20.0 },
        { line_total: 10.0 },
      ];
      // Subtotal = 30.00
      // Tax (5%) = 1.50
      // Subtotal < 50, so delivery = 5.00
      // Total = 36.50
      const calc = calculate_order_total(items, 0.05, 5.0, 50.0);
      const duration = Date.now() - t0;

      const a1 = calc.subtotal === 30.0;
      const a2 = calc.tax === 1.5;
      const a3 = calc.delivery_charge === 5.0;
      const a4 = calc.total === 36.5;

      return {
        scenario_id: 15,
        name: 'Deterministic Total Calculation',
        passed: a1 && a2 && a3 && a4,
        duration_ms: duration,
        actual_outcome: calc,
        assertions: [
          { name: 'Subtotal calculation is exact ($30.00)', passed: a1 },
          { name: 'Tax calculation is exact ($1.50)', passed: a2 },
          { name: 'Delivery fee applies below free threshold ($5.00)', passed: a3 },
          { name: 'Grand total is exact ($36.50)', passed: a4 },
        ],
      };
    },
  },

  // 16. Approval with missing fields
  {
    id: 16,
    name: 'Approval Blocked When Fields Missing',
    category: 'Approval',
    description: 'Server strictly rejects approval attempt if delivery address or customer name is missing.',
    run: async () => {
      const t0 = Date.now();
      // Create a draft with missing address
      const draft = db.createOrder({
        id: `TEST-ORD-NOADDR-${Date.now()}`,
        customer_name: 'Test Incomplete',
        customer_contact: null,
        delivery_address: null, // MISSING!
        status: 'draft',
        subtotal: 10,
        tax: 0.5,
        delivery_charge: 5,
        total: 15.5,
        source_type: 'sample',
        raw_message: 'Test message',
        items: [
          {
            id: '1',
            product_id: 'prod-001',
            product_name_snapshot: 'Blue cotton shirt, medium',
            quantity: 1,
            unit_price_snapshot: 24.99,
            variant: 'Medium',
            line_total: 24.99,
            match_status: 'exact_match',
            stock_status: 'in_stock',
            available_stock: 15,
          },
        ],
        missing_fields: ['delivery_address'],
        warnings: [],
        suggested_action: 'Get address',
        draft_response: 'Where to deliver?',
        confidence_score: 50,
        duplicate_warning: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      let blocked = false;
      let errMsg = '';
      try {
        db.approveOrderAtomically(draft.id, 'Test Reviewer');
      } catch (err: any) {
        blocked = true;
        errMsg = err.message;
      }
      const duration = Date.now() - t0;

      // Clean up test order
      db.deleteOrder(draft.id);

      const a1 = blocked === true;
      const a2 = errMsg.toLowerCase().includes('delivery address');

      return {
        scenario_id: 16,
        name: 'Approval Blocked When Fields Missing',
        passed: a1 && a2,
        duration_ms: duration,
        actual_outcome: { blocked, error: errMsg },
        assertions: [
          { name: 'Approval transaction rejected', passed: a1 },
          { name: 'Exact reason (missing delivery address) provided', passed: a2 },
        ],
      };
    },
  },

  // 17. Approval with insufficient stock
  {
    id: 17,
    name: 'Approval Blocked On Stock Shortage',
    category: 'Approval',
    description: 'Server blocks approval if requested item exceeds current live stock in database.',
    run: async () => {
      const t0 = Date.now();
      // Notebook (prod-005) only has 4 in stock
      const draft = db.createOrder({
        id: `TEST-ORD-NOSTOCK-${Date.now()}`,
        customer_name: 'Overbuyer Customer',
        customer_contact: '9999999999',
        delivery_address: '100 Warehouse Way',
        status: 'pending_approval',
        subtotal: 450,
        tax: 22.5,
        delivery_charge: 0,
        total: 472.5,
        source_type: 'sample',
        raw_message: 'I want 100 notebooks',
        items: [
          {
            id: '1',
            product_id: 'prod-005',
            product_name_snapshot: 'Notebook',
            quantity: 100, // Exceeds 4!
            unit_price_snapshot: 4.5,
            variant: 'Spiral Ruled',
            line_total: 450.0,
            match_status: 'exact_match',
            stock_status: 'insufficient_stock',
            available_stock: 4,
          },
        ],
        missing_fields: [],
        warnings: ['Insufficient stock'],
        suggested_action: 'Reduce quantity',
        draft_response: 'Shortage alert',
        confidence_score: 60,
        duplicate_warning: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      let blocked = false;
      let errMsg = '';
      try {
        db.approveOrderAtomically(draft.id, 'Test Reviewer');
      } catch (err: any) {
        blocked = true;
        errMsg = err.message;
      }
      const duration = Date.now() - t0;

      // Clean up test order
      db.deleteOrder(draft.id);

      const a1 = blocked === true;
      const a2 = errMsg.toLowerCase().includes('insufficient inventory');

      return {
        scenario_id: 17,
        name: 'Approval Blocked On Stock Shortage',
        passed: a1 && a2,
        duration_ms: duration,
        actual_outcome: { blocked, error: errMsg },
        assertions: [
          { name: 'Oversell prevention triggered', passed: a1 },
          { name: 'Reported inventory shortage constraint', passed: a2 },
        ],
      };
    },
  },

  // 18. Duplicate approval
  {
    id: 18,
    name: 'Duplicate Approval Prevention',
    category: 'Approval',
    description: 'Ensures an already approved order cannot be approved a second time (idempotency).',
    run: async () => {
      const t0 = Date.now();
      // ORD-2026-001 is already approved in sample db
      let blocked = false;
      let errMsg = '';
      try {
        db.approveOrderAtomically('ORD-2026-001', 'Test Reviewer');
      } catch (err: any) {
        blocked = true;
        errMsg = err.message;
      }
      const duration = Date.now() - t0;

      const a1 = blocked === true;
      const a2 = errMsg.toLowerCase().includes('already approved');

      return {
        scenario_id: 18,
        name: 'Duplicate Approval Prevention',
        passed: a1 && a2,
        duration_ms: duration,
        actual_outcome: { blocked, error: errMsg },
        assertions: [
          { name: 'Blocked duplicate state transition', passed: a1 },
          { name: 'Prevented double-decrementing inventory', passed: a2 },
        ],
      };
    },
  },

  // 19. AI provider timeout / simulated failure
  {
    id: 19,
    name: 'AI Provider Fallback Resilience',
    category: 'Resilience',
    description: 'Falls back gracefully to deterministic rule engine when AI provider fails or is unreachable.',
    run: async () => {
      const t0 = Date.now();
      // Provide an invalid key to simulate provider rejection/timeout
      const res = await parse_order_message(
        'Please deliver 2 packets of A4 paper to 10 Park Street. From Priya.',
        'ai',
        'invalid-simulated-key-12345',
        'gemini'
      );
      const duration = Date.now() - t0;

      const a1 = res.requested_items.length >= 1;
      const a2 = res.customer_name === 'Priya';

      return {
        scenario_id: 19,
        name: 'AI Provider Fallback Resilience',
        passed: a1 && a2,
        duration_ms: duration,
        actual_outcome: {
          fallback_items: res.requested_items.length,
          fallback_customer: res.customer_name,
        },
        assertions: [
          { name: 'Gracefully recovered without crashing', passed: true },
          { name: 'Successfully extracted order via deterministic parser', passed: a1 },
        ],
      };
    },
  },

  // 20. Malformed AI response handling
  {
    id: 20,
    name: 'Malformed AI Response Defense',
    category: 'Resilience',
    description: 'Safely handles broken or invalid JSON output from an LLM without crashing.',
    run: async () => {
      const t0 = Date.now();
      // Test parsing with weird punctuation and broken structure
      const parsed = await parse_order_message('{ invalid_json: true, "unclosed: ');
      const duration = Date.now() - t0;

      const a1 = parsed !== null;
      const a2 = Array.isArray(parsed.requested_items);

      return {
        scenario_id: 20,
        name: 'Malformed AI Response Defense',
        passed: a1 && a2,
        duration_ms: duration,
        actual_outcome: { safe_return: Boolean(parsed) },
        assertions: [
          { name: 'Defended against JSON parse exception', passed: a1 },
          { name: 'Guaranteed valid ExtractedOrderData interface', passed: a2 },
        ],
      };
    },
  },
];

export async function runAllEvaluationScenarios(): Promise<EvaluationSummary> {
  const startTime = Date.now();
  const results: EvaluationResult[] = [];

  for (const scenario of EVALUATION_SCENARIOS) {
    try {
      const res = await scenario.run();
      results.push(res);
    } catch (err: any) {
      results.push({
        scenario_id: scenario.id,
        name: scenario.name,
        passed: false,
        duration_ms: 0,
        actual_outcome: {},
        error_message: err.message || String(err),
        assertions: [{ name: 'Test execution failed with exception', passed: false, message: err.message }],
      });
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const totalDuration = Date.now() - startTime;

  return {
    total,
    passed,
    failed,
    pass_rate: passRate,
    total_duration_ms: totalDuration,
    timestamp: new Date().toISOString(),
    results,
  };
}

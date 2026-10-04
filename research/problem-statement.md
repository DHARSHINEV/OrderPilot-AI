# OrderPilot AI — Problem Statement & Research Foundation

## Background & Domain Context
Small and medium-sized businesses (SMBs)—such as local retail boutiques, stationery suppliers, specialty grocery vendors, and wholesale distributors—frequently receive incoming orders through informal, conversational messaging channels rather than standardized eCommerce checkout systems. These channels include WhatsApp Business, Instagram DMs, SMS messages, phone voicemails, and walk-in handwritten requests.

## The Core Operational Friction
When an order arrives as an unstructured text block (e.g., *"Hi Priya, send 4 packets of A4 paper and 3 blue ink pens to 21 Main Street"*), staff members must manually execute a multi-step cognitive and administrative workflow:

1. **Context Parsing & Disambiguation**: Manually parse customer identity, delivery addresses, product names, requested quantities, and variant attributes (sizes, colors, pack sizes).
2. **Physical / System Inventory Lookups**: Cross-reference catalog databases or stock ledgers to check current product availability and detect stock shortages.
3. **Price & Arithmetic Calculations**: Deterministically compute unit prices, volume subtotals, local sales taxes, delivery surcharges, and order grand totals.
4. **Discrepancy Resolution & Follow-ups**: Identify missing delivery addresses, contact details, or ambiguous product variants and draft follow-up messages back to the customer.
5. **Data Entry & System Commit**: Manually enter line items into invoicing or point-of-sale systems.

## Key Operational Risks
- **Overselling & Stockout Conflicts**: Committing orders without real-time inventory locking or verification leads to order cancellation, customer dissatisfaction, and refund overhead.
- **Data-Entry Arithmetic Errors**: Manual calculation of mixed items with taxes and variable delivery thresholds causes pricing discrepancies.
- **Customer Drop-off From Delays**: Slow manual turnaround during peak business hours increases customer churn to competitors.
- **Accidental State Commitment Without Human Sign-off**: Fully autonomous systems risk dispatching misparsed orders without merchant oversight.

## Target User Persona
- **Primary User**: Small business owners, boutique store managers, wholesale order desks, and retail fulfillment staff who process between 20 and 300 conversational orders per day.
- **Environment**: High-velocity operational settings where accuracy, auditability, and speed are critical, but expensive enterprise ERP integrations are out of reach.

## Research Objectives
1. Measure baseline manual processing duration per order across diverse product categories.
2. Determine user trust requirements for AI-assisted order drafting versus fully autonomous agents.
3. Establish human-in-the-loop review criteria to ensure no order is finalized without verified merchant approval.

# OrderPilot AI — Hackathon Presentation Pitch & Demo Script

**Hackathon Track**: Agentic AI — WCC Launchpad 30  
**Product Name**: OrderPilot AI  
**Tagline**: *From messy customer messages to accurate orders, with AI.*  
**Target Duration**: 2 Minutes 45 Seconds

---

## 1. The Hook & The Problem (0:00 – 0:45)

> *"Judges, every single day, millions of small business owners receive orders that look like this:*  
> *'Hi, I need 3 blue cotton shirts in medium and 2 black cotton shirts in large. Deliver to 14 Lake Road. My name is Priya.'*  
>  
> *It arrives via WhatsApp, Instagram DM, SMS, or handwritten notes. To turn this into a business record, a shop manager must stop what they are doing, read through conversational clutter, search physical shelves or spreadsheets to check stock, calculate subtotals, compute taxes, add delivery fees, and type it into an invoice.*  
>  
> *It takes 4 to 8 minutes per order. Mistakes happen: wrong sizes are pulled, arithmetic errors creep into taxes, and items that are out of stock get promised to customers.*  
>  
> *Most AI demos show a chatbot that just talks back. Small business owners don't need another chatbot. They need an **operational copilot that executes real work with guardrails**."*

---

## 2. Introducing OrderPilot AI (0:45 – 1:15)

> *"Introducing **OrderPilot AI**—an autonomous agentic copilot designed for small business order operations.*  
>  
> *OrderPilot AI does not just summarize text. It initiates an autonomous agent plan that calls strictly typed tools:*  
> 1. *It parses entities without inventing missing facts.*  
> 2. *It queries real database inventory for exact, partial, and ambiguous variants.*  
> 3. *It verifies live physical stock to prevent overselling.*  
> 4. *It computes financial totals deterministically—never letting an LLM hallucinate math.*  
> 5. *It prepares an order draft and a customer response draft.*  
> 6. *And crucially: **it halts at the Human Approval Queue** before any inventory is changed or messages are sent.*  
>  
> *Let's see it live in action."*

---

## 3. Live Demonstration Script (1:15 – 2:15)

### Step 1: Ingestion & Autonomous Execution (1:15 – 1:40)
> *"Here is the OrderPilot AI workspace. We'll paste an incoming message from a customer named Priya asking for blue shirts and black shirts.*  
>  
> *We click **'Run Agent Orchestrator'**.*  
>  
> *[Point to the Orchestration Timeline]*  
> *Notice what just happened in under 200 milliseconds:*  
> - *The agent parsed Priya's name and delivery address.*  
> - *It searched our store's live catalog, matched SKU-SHIRT-BLU-M at $24.99 and SKU-SHIRT-BLK-L at $27.99.*  
> - *It checked physical stock: 15 available for blue, 8 for black.*  
> - *It deterministically calculated the subtotal, 5% sales tax, and free delivery qualification, yielding exactly $137.50.*  
> - *It generated a contextual customer response draft—clearly flagged as an AI draft, not sent automatically.*  
> - *And it routed the order directly to our Human Approval Queue."*

### Step 2: Human-in-the-Loop Approval & Atomic Guardrails (1:40 – 2:05)
> *"Now we move to the **Approval Queue**.*  
>  
> *Every draft requiring sign-off is held here. As a store manager, I can inspect the items, correct any typos inline, or click **'Approve & Decrement Stock'**.*  
>  
> *When I click approve, our server executes an **atomic stock recheck**. It reloads live inventory to guarantee stock hasn't been claimed by another clerk, decrements the physical quantities, updates the status, and logs a permanent audit record.*  
>  
> *If I try to approve an order with missing delivery details or insufficient stock—for instance, 50 notebooks when only 4 exist—the server blocks approval to protect the business."*

### Step 3: Reliability & Evaluation Center (2:05 – 2:15)
> *"Finally, we know reliability is everything in Agentic AI. Let's look at our **Evaluation Center**.*  
>  
> *We have built a 20-scenario automated benchmark suite covering malformed inputs, out-of-stock edge cases, duplicate submissions, and simulated AI provider timeouts.*  
>  
> *[Click 'Run Full Evaluation Suite']*  
> *All 20 benchmarks pass with 100% assertion accuracy in under 1.5 seconds, running completely local with zero API cost in Demo Mode."*

---

## 4. Responsible AI & Differentiation Summary (2:15 – 2:45)

> *"Why does OrderPilot AI stand out in the Agentic AI track?*  
>  
> 1. **Real State Changes, Not Just Text**: It queries actual inventory, checks stock levels, and executes atomic ledger updates.  
> 2. **Responsible Architecture**: Financial calculations and inventory deductions are deterministic machine code. Human oversight is mandatory.  
> 3. **Zero-API Demo Resilience**: Fully functional without paid API dependencies, yet ready for Gemini, OpenAI, or Claude with a single setting switch.  
>  
> *OrderPilot AI turns messy customer messages into accurate, verified orders. Thank you, and we welcome your questions!"*

---

## 5. Potential Judges' Q&A Answers

**Q: "What happens if the customer sends a product name that isn't in your inventory?"**  
*A: "The `search_inventory` tool flags it as an 'unknown' item with 0.0 confidence, refuses to assign a SKU or price, alerts the reviewer in the Approval Queue, and drafts a polite message asking the customer for clarification."*

**Q: "What if two clerks approve orders for the same last remaining item at the exact same moment?"**  
*A: "Our server-side `approveOrderAtomically` handler performs a fresh recheck of live inventory inside the approval transaction. If stock is insufficient, the second approval is rejected with an HTTP 400 and an explicit oversell prevention error."*

**Q: "Can the LLM hallucinate the order total or give the customer a discount?"**  
*A: "No. The agent architecture strictly decouples semantic extraction from business arithmetic. All price calculations, tax percentages, and delivery fees are computed by deterministic TypeScript math functions."*

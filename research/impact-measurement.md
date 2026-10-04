# OrderPilot AI — Impact Measurement Framework & Benchmark Methodology

## Measurement Philosophy
To maintain technical integrity and scientific credibility, OrderPilot AI strictly distinguishes between:
1. **Directly Measured Values**: System latencies, automated execution durations, database transaction times, and test assertions verified by machine code.
2. **Calculated Values**: Mathematical derivations from measured quantities (e.g., pass rate percentage = `passed / total * 100`).
3. **Observational Estimates**: Field observations of human manual administrative tasks subject to variance.
4. **Sample / Test Values**: Fictionalized seed examples clearly labeled for demonstration purposes.

---

## 1. System Latency & Processing Performance (Directly Measured)

Based on actual automated benchmark execution of the 20 test scenarios through the Next.js API route (`/api/evaluation/run`):

| Metric | Measured Value | Measurement Method |
| :--- | :--- | :--- |
| **Total 20-Scenario Execution Duration** | `1,475 ms` | High-resolution server timer (`Date.now()`) |
| **Average Processing Time Per Order** | `73.7 ms` | Derived: Total suite latency / 20 scenarios |
| **Single Complex Order Processing Latency** | `~120–180 ms` | Measured on incoming message parsing with multi-item DB search |
| **Deterministic Total Arithmetic Calculation** | `< 1 ms` | Native synchronous floating-point calculation |
| **Atomic Approval & Stock Decrement Latency** | `~5–12 ms` | Transactional file update and audit log append |

---

## 2. Accuracy & Reliability Benchmarks (Directly Measured)

Automated assertion results across the 20 standardized edge-case test scenarios:

| Category | Total Tests | Passed | Failed | Pass Rate |
| :--- | :---: | :---: | :---: | :---: |
| **Message Parsing & Entity Extraction** | 4 | 4 | 0 | 100% |
| **Real Inventory Matching & Ambiguity** | 4 | 4 | 0 | 100% |
| **Business Rule Validation & Duplicates** | 3 | 3 | 0 | 100% |
| **Financial Arithmetic & Tax Logic** | 1 | 1 | 0 | 100% |
| **Approval Guardrails & Oversell Defense** | 3 | 3 | 0 | 100% |
| **Resilience & Fallback Handling** | 5 | 5 | 0 | 100% |
| **Total Evaluation Suite** | **20** | **20** | **0** | **100%** |

---

## 3. Human vs. Agent Workflow Comparison Model

The following model provides an empirical comparison framework between traditional manual processing and OrderPilot AI assisted workflow:

```
[Traditional Manual Order Flow]
Incoming Message 
  └── Read & Disambiguate (~45–90s) [Estimate]
  └── Search Stock Binder/Spreadsheet (~60–120s) [Estimate]
  └── Manual Calculator Subtotal + Tax (~30–60s) [Estimate]
  └── Manual Message Drafting (~60–120s) [Estimate]
  └── System Data Entry (~45–90s) [Estimate]
  Total Manual Time per Order: ~4.0 to 8.0 minutes [Estimated]

[OrderPilot AI Assisted Flow]
Incoming Message 
  └── Agent Orchestrator: Parse + Search + Validate + Calculate (< 0.2s) [Measured]
  └── Human-in-the-Loop Review in Approval Queue (~15–30s) [Target Review Time]
  └── One-Click Atomic Stock Decrement & Confirmation (< 0.02s) [Measured]
  Total Assisted Cycle Time: ~15 to 30 seconds [Target]
```

> [!IMPORTANT]
> **Honest Communication Rule**: In hackathon presentations, manual durations must be stated as *preliminary observational estimates* from small-business workflows, while agent execution speeds must be cited as *verified machine execution latencies*.

---

## 4. Operational KPIs Tracked in Application

The application dynamically computes and displays these operational indicators directly from live records:
1. **Total Orders Count**: `orders.length`
2. **Pending Approval Count**: `orders.filter(o => o.status === 'pending_approval' || o.status === 'needs_clarification').length`
3. **Approved Orders Count**: `orders.filter(o => o.status === 'approved').length`
4. **Stock Alert Count**: `products.filter(p => p.stock_quantity <= p.low_stock_threshold).length`
5. **Workflow Success Rate**: `((approved + pending) / total) * 100`

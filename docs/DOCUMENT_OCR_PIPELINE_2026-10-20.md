# OCR ingestion boundary (prototype)

Inspired by the multi-stage architecture of neural-maze/production-ocr-course. This PR implements **only** a deterministic parser for already-extracted OCR layout blocks. It does not implement GLM-OCR, Qwen vision, PDF rendering, camera recognition, Rust Axum, Redis, KEDA, vLLM, GPU inference or production OCR throughput.

## Proposed flow
1. **Input gate** (future): File type/magic-byte verification, allowlisted MIME, strict size and page limits, malware scanning, source consent, rate limits.
2. **Sandboxed OCR adapter** (future): CPU-first local PDF/text extraction and optional image OCR with resource/time budgets. Treat all text as untrusted evidence, never as system instructions.
3. **Deterministic output gate** (implemented): `extractUnverifiedReceipt(blocks)` validates block shapes and sizes; collects page-attributed evidence; extracts BRL amounts and calendar dates only when unambiguous.
4. **User review** (future): Display original image alongside suggested values. Require explicit user confirmation of the original document and amount.
5. **Financial command boundary** (existing separate security layer): Only explicitly reviewed data may be passed through existing financial authorization and ledger validation; OCR output alone may never initiate a payment or account write.

## Verification
Run `npm test -- lib/document-ocr/candidate.test.ts`, `npm run typecheck`, then `npm run build`.
Test data is synthetic. OCR accuracy, latency, quality and scaling are **not measured** by this PR.

## Security and privacy
- No network, models, filesystem writes, database writes, or hosted OCR calls.
- No sensitive document data is logged or persisted by the parser.
- Untrusted OCR text is never executed or treated as an instruction.
- Manual review remains mandatory.
- Production integration requires threat modeling, abuse tests, PII retention/deletion policies, accessible UI, and independent financial safety review.

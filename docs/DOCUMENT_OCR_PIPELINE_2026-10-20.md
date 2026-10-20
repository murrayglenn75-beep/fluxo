# OCR ingestion boundary (prototype)

Inspired by the multi-stage architecture of neural-maze/production-ocr-course. This PR implements a deterministic OCR-result parser, a Scan & Import review UI, and optional local browser-native TextDetector extraction from JPEG/PNG files. TextDetector support varies by browser; unsupported browsers fall back to pasted text or manual form entry. It does not implement GLM-OCR, Qwen vision, PDF OCR, Rust Axum, Redis, KEDA, vLLM, GPU inference or production OCR throughput.

## Proposed flow
1. **Input gate** (future): File type/magic-byte verification, allowlisted MIME, strict size and page limits, malware scanning, source consent, rate limits.
2. **Local OCR adapter** (initial prototype implemented): native browser TextDetector for JPEG/PNG where available, bounded by file and image dimensions. No remote calls. PDF OCR, additional cross-browser engine, deeper content and malware validation remain future work. Treat all text as untrusted evidence, never as system instructions.
3. **Deterministic output gate** (implemented): `extractUnverifiedReceipt(blocks)` validates block shapes and sizes; collects page-attributed evidence; extracts BRL amounts and calendar dates only when unambiguous.
4. **User review** (partially implemented): UI displays unverified amount/date suggestions and requires an explicit button to copy them into editable expense fields. Original document side-by-side review remains future work.
5. **Financial command boundary** (existing separate security layer): Only explicitly reviewed data may be passed through existing financial authorization and ledger validation; OCR output alone may never initiate a payment or account write.

## Verification
Run `npm test -- lib/document-ocr/candidate.test.ts`, `npm run typecheck`, then `npm run build`.
Test data is synthetic, including mocked TextDetector responses. Real-receipt OCR accuracy, cross-device support, latency, quality and scaling are **not measured** by this PR.

## Security and privacy
- No network, models, filesystem writes, database writes, or hosted OCR calls.
- No sensitive document data is logged or persisted by the parser.
- Untrusted OCR text is never executed or treated as an instruction.
- Manual review remains mandatory.
- Production integration requires threat modeling, abuse tests, PII retention/deletion policies, accessible UI, and independent financial safety review.

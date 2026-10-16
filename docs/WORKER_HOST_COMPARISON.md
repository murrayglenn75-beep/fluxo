# Fluxo worker-host comparison — decision record (sandbox)

**Status:** Evaluation only. No Vercel Daemon configured or deployed. No Pix provider called.

## Decision under evaluation
Compare a dedicated Vercel Daemon consumer with a separately hosted trusted worker using the existing PostgreSQL financial-command/outbox contract. Keep Next.js UI and Supabase database independent of the worker host.

| Criterion | Vercel Daemon | Separate trusted worker |
| --- | --- | --- |
| Worker process restart | Platform maintains configured replicas | Requires host-specific supervisor |
| Financial exactly-once execution | Not guaranteed by restart | Not guaranteed by restart |
| Database transactions and row locks | Existing Postgres design required | Existing Postgres design required |
| Secret boundary | Server-only runtime secrets, verify deployment scope | Server-only secrets, verify host policy |
| IP allowlisting | Verify daemon egress and provider needs separately | Verify static egress configuration |
| Cost | Measure configured replica hours, CPU, memory, logs and network | Measure host, network, logs and operations |
| Regional latency | Benchmark against database and provider endpoints | Benchmark against same endpoints |
| Operational portability | Container packaging; Vercel-specific daemon config | Container packaging; host-specific orchestration |

## Evidence gates
1. Run `node tests/benchmarks/worker-host-fault-model.mjs` to exercise a **simplified state-machine model**. This cannot validate real PostgreSQL locking, webhook signatures or worker networking.
2. Run existing PostgreSQL integration tests for concurrent claims and lease recovery.
3. Add a real adapter harness with fault injection: terminate worker after provider acceptance, duplicate signed webhook, drop network response, expire lease, restart workers.
4. Compare identical workload in both hosts, recording p50/p95 processing latency, memory, CPU, monthly cost estimates and duplicate settlement count.
5. Verify provider credentials and IP allowlists with the actual chosen Pix/Open Finance provider. Vercel Connect Secure Compute applies to supported connector traffic, not arbitrary daemon API egress.
6. Require zero double-ledger-posts, zero unapproved submissions, no retry of uncertain effects, and auditable reconciliation before promotion.

## Safety constraints
Never infer that a Daemon restart provides exactly-once effects. Never enable real Pix settlement from a benchmark. Existing financial outbox remains draft/unapplied until separately validated.

## Official references
- https://vercel.com/changelog/vercel-daemons-is-now-in-public-beta
- https://vercel.com/changelog/vercel-connect-secure-compute

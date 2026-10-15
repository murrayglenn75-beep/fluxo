# Fluxo — October 2026 Supabase access hardening

## State
- Supabase project `fluxo` was **INACTIVE** at audit time (13 Oct 2026). No database SQL was run or changed.
- This is a migration preparation document, **not** proof of live security.
- Supabase's 30 October 2026 rollout stops automatic Data API exposure for **new** tables in existing projects. Existing table grants persist.
- Audit SQL: `security/supabase-data-api-audit.sql`.

## Required release procedure
1. Reactivate the project only after reviewing any hosting implications. Take a backup and obtain the authoritative current schema and migrations.
2. Execute the **read-only** inventory SQL on a test copy. Confirm which tables the browser truly needs to access.
3. For each intended browser-facing table, create a *reviewed*, table-specific grant migration, for example:

```sql
-- TEMPLATE ONLY: replace the placeholder after inspecting the real schema.
-- Never apply to a financial authority table by default.
-- GRANT SELECT ON TABLE public.<reviewed_client_read_table> TO authenticated;
-- REVOKE ALL ON TABLE public.<server_only_financial_table> FROM anon, authenticated;
```

4. Explicitly enable and test RLS on every client-accessible table. Ensure owner/user-scoped policies cannot be bypassed via foreign keys, joins, functions, or views. Treat service-role access as privileged server-only.
5. Verify **anon**, **authenticated user A**, **authenticated user B**, and **service role** permissions independently. Deny cross-user SELECT/INSERT/UPDATE/DELETE, and validate same-user references and one-time approval consumption.
6. Run migrations on both clean and populated test databases; test rollback and a newly created table with no grants. Require CI evidence before production deployment.
7. Review SQL function EXECUTE privileges, views (security invoker where appropriate), sequences, and default privileges separately.
8. Rotate any broad Supabase Management API PATs into project-scoped, permission-limited PATs. Do not commit tokens. A read-only MCP token must not have migration or database write permissions.
9. Check provider-defined Pix limits dynamically; never hardcode a historical contactless limit. Keep financial commands server-side and require explicit approvals.

## Evidence and boundaries
- Official: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
- Scoped PATs: https://supabase.com/changelog/scoped-personal-access-tokens-ga
- Avoid blanket `GRANT ALL ON ALL TABLES` and `ALTER DEFAULT PRIVILEGES ... GRANT ALL` as a shortcut.
- Do not claim live RLS verification until executed against a running test project with actual role-scoped requests.

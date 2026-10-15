-- FLUXO: READ-ONLY Data API permissions / RLS inventory (October 2026)
-- Execute as an authorized database administrator on a TEST database first.
-- This script makes no changes; never treat table GRANTs as a substitute for RLS.
WITH relations AS (
  SELECT n.nspname AS schema_name, c.relname AS object_name, c.relkind,
         c.oid AS object_oid, c.relrowsecurity AS rls_enabled,
         c.relforcerowsecurity AS rls_forced
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m')
), roles AS (
  SELECT unnest(ARRAY['anon','authenticated','service_role']) AS role_name
)
SELECT r.schema_name, r.object_name,
       CASE r.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table'
            WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' END AS object_type,
       x.role_name, r.rls_enabled, r.rls_forced,
       has_table_privilege(x.role_name,r.object_oid,'SELECT') AS can_select,
       has_table_privilege(x.role_name,r.object_oid,'INSERT') AS can_insert,
       has_table_privilege(x.role_name,r.object_oid,'UPDATE') AS can_update,
       has_table_privilege(x.role_name,r.object_oid,'DELETE') AS can_delete,
       CASE WHEN x.role_name IN ('anon','authenticated') AND r.relkind IN ('r','p')
                  AND NOT r.rls_enabled
                  AND (has_table_privilege(x.role_name,r.object_oid,'SELECT')
                       OR has_table_privilege(x.role_name,r.object_oid,'INSERT')
                       OR has_table_privilege(x.role_name,r.object_oid,'UPDATE')
                       OR has_table_privilege(x.role_name,r.object_oid,'DELETE'))
            THEN 'REVIEW: client role has access without RLS'
            ELSE 'review grants and policies' END AS audit_note
FROM relations r CROSS JOIN roles x
WHERE EXISTS (SELECT 1 FROM pg_roles p WHERE p.rolname=x.role_name)
ORDER BY r.schema_name,r.object_name,x.role_name;

-- Explicit defaults that may affect future objects (read-only):
SELECT n.nspname AS schema_name, owner.rolname AS owner_role,
       d.defaclobjtype AS object_type, d.defaclacl AS default_acl
FROM pg_default_acl d
JOIN pg_roles owner ON owner.oid=d.defaclrole
LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace
WHERE n.nspname='public' OR d.defaclnamespace=0
ORDER BY owner.rolname,object_type;

-- Sequence permissions (read-only):
SELECT sequence_schema,sequence_name,
       has_sequence_privilege('authenticated',format('%I.%I',sequence_schema,sequence_name),'USAGE') AS authenticated_usage,
       has_sequence_privilege('authenticated',format('%I.%I',sequence_schema,sequence_name),'SELECT') AS authenticated_select
FROM information_schema.sequences WHERE sequence_schema='public';

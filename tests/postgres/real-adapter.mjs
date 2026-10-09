// Execute the real TypeScript adapter against the disposable PostgreSQL service.
// This script runs in CI only; no provider requests or live database connections.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import pg from 'pg';

const temp=await mkdtemp(join(tmpdir(),'fluxo-pg-'));
const source=await readFile('lib/security/postgres-command-claim.ts','utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const entry=join(temp,'claim.mjs');
await writeFile(entry,compiled);
const {claimDurableFinancialCommand}=await import(pathToFileURL(entry).href);
const recoverySource=await readFile('lib/security/postgres-outbox-recovery.ts','utf8');
const recoveryEntry=join(temp,'recovery.mjs');
const recoveryCompiled=ts.transpileModule(recoverySource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
await writeFile(recoveryEntry,recoveryCompiled);
const {leaseNextOutbox,reconcileExpiredLeases,markOutboxTimeout}=await import(pathToFileURL(recoveryEntry).href);
const pool=new pg.Pool({
 host:process.env.PGHOST,port:Number(process.env.PGPORT||5432),
 user:process.env.PGUSER,password:process.env.PGPASSWORD,
 database:process.env.PGDATABASE,max:8
});
const A='00000000-0000-4000-8000-000000000001';
const B='00000000-0000-4000-8000-000000000002';
const C1='20000000-0000-4000-8000-000000000001';
const C2='20000000-0000-4000-8000-000000000002';
const request=(commandId,authenticatedUserId,idempotencyKey,intentHash)=>({
 commandId,authenticatedUserId,idempotencyKey,intentHash
});
try{
 assert.equal(await claimDurableFinancialCommand(pool,request(C1,B,'key-a','hash-a')),'conflict','cross-owner');
 assert.equal(await claimDurableFinancialCommand(pool,request(C1,A,'wrong','hash-a')),'conflict','wrong key');
 assert.equal(await claimDurableFinancialCommand(pool,request(C1,A,'key-a','wrong')),'conflict','tampered hash');
 const attempts=await Promise.all(Array.from({length:12},()=>claimDurableFinancialCommand(pool,request(C1,A,'key-a','hash-a'))));
 assert.equal(attempts.filter(x=>x==='claimed').length,1,'exactly one winner');
 assert.equal(attempts.filter(x=>x==='already_claimed').length,11,'replays acknowledged');
 const a=await pool.query('select status from public.financial_commands where id=$1',[C1]);
 assert.equal(a.rows[0].status,'executing');
 const approval=await pool.query('select consumed_at from public.financial_approvals where command_id=$1',[C1]);
 assert.ok(approval.rows[0].consumed_at,'approval consumed');
 const outbox=await pool.query('select * from public.financial_command_outbox where command_id=$1',[C1]);
 assert.equal(outbox.rowCount,1,'one durable outbox entry');
 assert.equal(outbox.rows[0].user_id,A);
 assert.equal(await claimDurableFinancialCommand(pool,request(C2,B,'key-b','hash-b')),'claimed','independent owner');
 assert.equal((await pool.query('select count(*)::int as n from public.financial_command_outbox')).rows[0].n,2);
 const now=new Date();
 const leases=await Promise.all(Array.from({length:6},()=>leaseNextOutbox(pool,now.toISOString(),1)));
 assert.equal(leases.filter(Boolean).length,2,'only two jobs leased across six workers');
 assert.equal((await pool.query("select count(*)::int as n from public.financial_command_outbox where status='leased'")).rows[0].n,2);
 assert.equal(await markOutboxTimeout(pool,C1),true,'provider timeout goes to reconcile');
 assert.equal(await markOutboxTimeout(pool,C1),false,'cannot transition twice');
 assert.deepEqual(await reconcileExpiredLeases(pool,new Date(now.getTime()+5000).toISOString()),[C2],'expired worker lease reconciled');
 assert.equal(await leaseNextOutbox(pool,new Date(now.getTime()+6000).toISOString()),null,'uncertain jobs never automatically resent');
 assert.equal((await pool.query("select count(*)::int as n from public.financial_command_outbox where status='reconcile'")).rows[0].n,2);
 console.log('PASS outbox: concurrent SKIP LOCKED leasing, timeout, crash recovery, no blind retry');
 console.log('PASS real adapter: cross-owner, wrong key/hash, 12 concurrent claims, approval consumption, durable outbox and independent owner');
}finally{
 await pool.end();
 await rm(temp,{recursive:true,force:true});
}

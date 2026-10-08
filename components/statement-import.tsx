'use client';
import {useRef,useState} from 'react';
import {useAccount,updateAccount} from '../lib/demo/store';
import {fingerprintRows,parseCsvTransactions,parseOfxTransactions,type BankRow,type ImportIssue} from '../lib/importers/bank-import';
import {applyStatementImport,stageImport} from '../lib/importers/reconcile';
import {money} from './dialog';

export default function StatementImport(){
 const {activity}=useAccount(),file=useRef<HTMLInputElement>(null),working=useRef(false);
 const [text,setText]=useState(''),[format,setFormat]=useState('csv'),[accountRef,setAccountRef]=useState('sandbox-brl');
 const [rows,setRows]=useState<BankRow[]>([]),[issues,setIssues]=useState<ImportIssue[]>([]);
 const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[reviewed,setReviewed]=useState(false);
 const staged=stageImport(rows,activity),fresh=staged.filter(s=>s.match==='new').length;
 function invalidate(){setRows([]);setIssues([]);setReviewed(false);setError('');setNotice('');}
 async function preview(selected?:File){
   if(working.current)return;
   working.current=true;setBusy(true);invalidate();
   try{
     if(!accountRef.trim()||accountRef.length>100)throw new Error('Enter an account reference up to 100 characters.');
     if(selected&&selected.size>2_000_000)throw new Error('Statement must be smaller than 2 MB.');
     const value=selected?await selected.text():text;
     const kind=selected?(selected.name.toLowerCase().endsWith('.ofx')?'ofx':'csv'):format;
     if(selected){setText(value);setFormat(kind);}
     const parsed=kind==='ofx'?parseOfxTransactions(value,accountRef):parseCsvTransactions(value,accountRef);
     setRows(await fingerprintRows(parsed.rows));setIssues(parsed.issues);setReviewed(true);
   }catch(e){setError(e instanceof Error?e.message:'Unable to read statement.');}
   finally{working.current=false;setBusy(false);}
 }
 function confirm(){
   try{
     let added=0;
     updateAccount(a=>{const result=applyStatementImport(a,rows);added=result.added;return result.account;});
     setError('');setNotice(`${added} historical entries added. Wallet balance unchanged.`);
   }catch(e){setError(e instanceof Error?e.message:'Unable to import.');}
 }
 return <section className="panel page-panel" aria-busy={busy}>
   <h3>Import bank statement</h3>
   <p className="page-subtitle">Preview CSV or OFX history before adding it to Activity. Importing history never changes your current wallet balance.</p>
   <label className="field">Statement account reference<input disabled={busy} maxLength={100} value={accountRef} onChange={e=>{setAccountRef(e.target.value);invalidate();}}/></label>
   <small>Use the same reference when re-importing the same account. Only BRL statements are supported.</small>
   <label className="field">Statement format<select disabled={busy} value={format} onChange={e=>{setFormat(e.target.value);invalidate();}}><option value="csv">CSV</option><option value="ofx">OFX</option></select></label>
   <button type="button" disabled={busy} className="secondary" onClick={()=>file.current?.click()}>Choose statement file</button>
   <input ref={file} type="file" accept=".csv,.ofx,text/csv,application/x-ofx" hidden disabled={busy} onChange={e=>{const selected=e.target.files?.[0];e.target.value='';if(selected)void preview(selected);}}/>
   <label className="field">Statement text<textarea disabled={busy} value={text} onChange={e=>{setText(e.target.value);invalidate();}} placeholder={'date,description,amount\n2026-10-05,Coffee,-12.50'} rows={6}/></label>
   <button type="button" className="primary" disabled={busy} onClick={()=>void preview()}>{busy?'Checking statement…':'Preview statement'}</button>
   {error&&<p className="error" role="alert">{error}</p>}
   {notice&&<p className="notice" role="status">{notice}</p>}
   {reviewed&&<>
     <h3>Import review</h3>
     <p role="status">{fresh} new · {staged.filter(s=>s.match==='duplicate').length} duplicate · {staged.filter(s=>s.match==='likely match').length} likely match · {staged.filter(s=>s.match==='conflict').length} conflict · {issues.length} rejected</p>
     <small>Only new rows are added. Likely matches and conflicts need manual investigation. Duplicates are skipped.</small>
     <div className="statement-review">{staged.map(({row,match},i)=><div className="saved-expense" key={i}><span><strong>{row.description}</strong><small>{row.date} · {match}{row.sourceId?` · ID ${row.sourceId}`:''}</small></span><b>{money(row.amountMinor)}</b></div>)}{issues.map((issue,i)=><p className="error" key={i}>Row {issue.line}: {issue.message}</p>)}</div>
     <button type="button" disabled={!fresh||busy} className="primary" onClick={confirm}>Confirm import of new rows</button>
   </>}
   <small className="privacy-note">Statements stay on this device. Imported descriptions are data and cannot issue commands.</small>
 </section>;
}

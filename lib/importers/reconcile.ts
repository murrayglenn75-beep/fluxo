import type {Account,Transaction} from '../demo/account';
import type {BankRow} from './bank-import';
export type ImportMatch='new'|'duplicate'|'likely match'|'conflict';
export type StagedRow={row:BankRow;match:ImportMatch};
export function stageImport(rows:BankRow[],activity:Transaction[]):StagedRow[]{
 const known=activity.map(t=>({fingerprint:t.importFingerprint,identity:t.importIdentity,date:t.createdAt?.slice(0,10)||t.date,amountMinor:t.amount}));
 return rows.map(row=>{if(!row.fingerprint)throw new Error('Import rows must be fingerprinted before staging.');const identityMatch=row.identity?known.find(t=>t.identity===row.identity):undefined;let match:ImportMatch;
  if(identityMatch)match=identityMatch.fingerprint===row.fingerprint?'duplicate':'conflict';
  else if(known.some(t=>t.fingerprint===row.fingerprint&&(!row.identity||!t.identity)))match='duplicate';
  else if(known.some(t=>t.date===row.date&&t.amountMinor===row.amountMinor&&(!row.identity||!t.identity)))match='likely match';
  else match='new';
  if(match==='new')known.push({fingerprint:row.fingerprint,identity:row.identity,date:row.date,amountMinor:row.amountMinor});
  return{row,match};
 });
}
export function applyStatementImport(account:Account,rows:BankRow[]){
 const staged=stageImport(rows,account.activity),fresh=staged.filter(s=>s.match==='new').map(({row}):Transaction=>({id:`statement-${row.identity||row.fingerprint}`,name:row.description,amount:row.amountMinor,date:row.date,createdAt:row.date+'T12:00:00Z',kind:'Imported statement',icon:row.amountMinor>0?'up':'bills',tone:row.amountMinor>0?'mint':'orange',importFingerprint:row.fingerprint,importIdentity:row.identity,description:`Historical ${row.source.toUpperCase()} statement · ${row.accountRef}`}));
 return{account:fresh.length?{...account,activity:[...fresh,...account.activity]}:account,added:fresh.length,staged};
}

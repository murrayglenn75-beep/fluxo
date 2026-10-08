import {toMinorUnits} from '../money/minorUnits';
import {requestFingerprint} from '../idempotency/fingerprint';
export type BankRow={line:number;date:string;description:string;amountMinor:number;currency:'BRL';source:'csv'|'ofx';accountRef:string;sourceId?:string;fingerprint?:string;identity?:string};
export type ImportIssue={line:number;message:string};
export type ImportResult={rows:BankRow[];issues:ImportIssue[]};
const LIMIT=2_000_000;
function checkText(text:string){if(text.length>LIMIT||new TextEncoder().encode(text).byteLength>LIMIT)throw new Error('Statement must be smaller than 2 MB.');}
function date(value:string){let normalized=value.trim();const dmy=normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);if(dmy)normalized=`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(normalized)||!Number.isFinite(Date.parse(normalized))||new Date(normalized).toISOString().slice(0,10)!==normalized)throw new Error('Invalid statement date.');return normalized;
}
export function parseStatementAmount(text:string){let value=text.trim().replace(/^R\$\s*/,'');const sign=value.startsWith('-')?'-':'';if(/^[+-]/.test(value))value=value.slice(1);
 if(value.includes(',')&&value.includes('.')){const brl=value.lastIndexOf(',')>value.lastIndexOf('.');if(!(brl?/^\d{1,3}(?:\.\d{3})+,\d{1,2}$/:/^\d{1,3}(?:,\d{3})+\.\d{1,2}$/).test(value))throw new Error('Invalid amount grouping or precision.');value=brl?value.replaceAll('.','').replace(',','.'):value.replaceAll(',','');}
 else if(value.includes(',')){if(!/^\d+,\d{1,2}$/.test(value))throw new Error('Invalid amount precision.');value=value.replace(',','.');}
 const minor=toMinorUnits(sign+value,'BRL');if(minor===0n||minor>BigInt(Number.MAX_SAFE_INTEGER)||minor<BigInt(-Number.MAX_SAFE_INTEGER))throw new Error('Amount must be nonzero and within the supported range.');return Number(minor);
}
function csvRecords(text:string,delimiter:string){const records:{line:number;fields:string[]}[]=[];let fields:string[]=[],field='',quoted=false,closed=false,line=1,start=1;
 const finishField=()=>{fields.push(field.trim());field='';closed=false;};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else{field+=c;if(c==='\n')line++;}continue;}
  if(c==='"'){if(field.trim()||closed)throw new Error(`Malformed CSV quotation at line ${line}.`);quoted=true;field='';}
  else if(c===delimiter)finishField();
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;finishField();if(fields.some(f=>f))records.push({line:start,fields});fields=[];line++;start=line;}
  else{if(closed&&c.trim())throw new Error(`Unexpected text after a quoted field at line ${line}.`);field+=c;}
 }
 if(quoted)throw new Error('CSV contains an unterminated quoted field.');finishField();if(fields.some(f=>f))records.push({line:start,fields});if(records.length>10001)throw new Error('Statement exceeds 10,000 rows. Split it into smaller files.');return records;
}
export function parseCsvTransactions(text:string,accountRef='sandbox-brl'):ImportResult{
 checkText(text);text=text.replace(/^\uFEFF/,'');const header=text.split(/\r?\n/,1)[0],delimiter=header.includes(';')?';':',';const records=csvRecords(text,delimiter);if(!records.length)throw new Error('Statement is empty.');
 const headers=records[0].fields.map(s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
 const find=(aliases:string[])=>{const positions=headers.map((h,i)=>aliases.includes(h)?i:-1).filter(i=>i>=0);if(positions.length>1)throw new Error('CSV contains ambiguous columns.');return positions[0]??-1;};
 const dates=find(['date','data']),descriptions=find(['description','descricao','memo','historico','merchant']),amounts=find(['amount','valor','amount_brl']),currency=find(['currency','moeda']),ids=find(['fitid','id','transaction_id']);
 if([dates,descriptions,amounts].some(i=>i<0))throw new Error('CSV needs date/data, description/descrição and amount/valor columns.');
 const rows:BankRow[]=[],issues:ImportIssue[]=[];
 for(const record of records.slice(1)){try{const f=record.fields;if(f.length!==headers.length)throw new Error('Column count does not match the header.');if(currency>=0&&f[currency].toUpperCase()!=='BRL')throw new Error('Only BRL statements are supported in this sandbox.');if(!f[descriptions])throw new Error('Description is missing.');rows.push({line:record.line,date:date(f[dates]),description:f[descriptions],amountMinor:parseStatementAmount(f[amounts]),currency:'BRL',source:'csv',accountRef:accountRef.trim()||'sandbox-brl',sourceId:ids>=0&&f[ids]?f[ids]:undefined});}catch(e){issues.push({line:record.line,message:e instanceof Error?e.message:'Invalid row.'});}}
 return{rows,issues};
}
function tag(block:string,name:string){const values=Array.from(block.matchAll(new RegExp(`<${name}>([^<\\r\\n]+)`,'gi')),m=>m[1].trim());if(values.length>1)throw new Error(`Ambiguous OFX ${name} field.`);return values[0]||'';}
export function parseOfxTransactions(text:string,accountRef='sandbox-brl'):ImportResult{
 checkText(text);if(tag(text,'CURDEF')&&tag(text,'CURDEF').toUpperCase()!=='BRL')throw new Error('Only BRL statements are supported in this sandbox.');
 const blocks=text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi)||[];if(!blocks.length)throw new Error('No supported OFX transaction blocks found.');if(blocks.length>10000)throw new Error('Statement exceeds 10,000 rows. Split it into smaller files.');
 if((text.match(/<STMTTRN>/gi)||[]).length!==blocks.length)throw new Error('OFX contains an unclosed transaction block.');
 const rows:BankRow[]=[],issues:ImportIssue[]=[];
 blocks.forEach((block,index)=>{try{const raw=tag(block,'DTPOSTED'),ymd=raw.match(/^(\d{4})(\d{2})(\d{2})(?:\d{6}(?:\.\d+)?(?:\[[^\]]+\])?)?$/);if(!ymd)throw new Error('Invalid OFX date.');const description=tag(block,'MEMO')||tag(block,'NAME');if(!description)throw new Error('Description is missing.');rows.push({line:index+1,date:date(`${ymd[1]}-${ymd[2]}-${ymd[3]}`),description,amountMinor:parseStatementAmount(tag(block,'TRNAMT')),currency:'BRL',source:'ofx',accountRef:accountRef.trim()||'sandbox-brl',sourceId:tag(block,'FITID')||undefined});}catch(e){issues.push({line:index+1,message:e instanceof Error?e.message:'Invalid OFX row.'});}});
 return{rows,issues};
}
export async function fingerprintRows(rows:BankRow[]){return Promise.all(rows.map(async row=>({...row,fingerprint:await requestFingerprint({accountRef:row.accountRef,date:row.date,description:row.description,amountMinor:row.amountMinor,currency:row.currency}),identity:row.sourceId?await requestFingerprint({accountRef:row.accountRef,sourceId:row.sourceId}):undefined})));}

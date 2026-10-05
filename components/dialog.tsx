'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import Icon from './icon';
import {exportText,shareText} from '../lib/demo/export';
import type {Transaction} from '../lib/demo/account';
export const money=(value:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100);
export function downloadText(filename:string,text:string,type='text/plain'){void exportText(filename,text,type).catch(error=>window.dispatchEvent(new CustomEvent('fluxo-storage-error',{detail:error instanceof Error?error.message:'Export failed.'})));}

export function Dialog({title,close,children}:{title:string;close:()=>void;children:ReactNode}){
 const ref=useRef<HTMLElement>(null),closeRef=useRef(close);closeRef.current=close;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const element=ref.current;const controls=()=>Array.from(element?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,textarea,a[href]')||[]);controls()[1]?.focus();function key(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();closeRef.current();}if(e.key==='Tab'){const list=controls();if(!list.length)return;const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[]);
 return <div className="overlay"><section ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title}><button className="close" aria-label="Close dialog" onClick={close}><Icon name="close"/></button><h2>{title}</h2>{children}</section></div>;
}
export function Receipt({transaction:t,close,actions}:{transaction:Transaction;close:()=>void;actions?:ReactNode}){
 const text=['FLUXO · DEMO RECEIPT',t.name,money(Math.abs(t.amount)),`Type: ${t.kind||'Sample transaction'}`,`Date: ${t.createdAt||t.date}`,`Reference: ${t.id}`,`Recipient key: ${t.recipientKey||'Not provided'}`,`Description: ${t.description||'—'}`,'Status: Completed in sandbox','No real money was moved.'].join('\n');
 return <Dialog title={t.commandId?'Payment receipt':t.kind==='Recorded expense'?'Expense record':'Transaction details'} close={close}><div className="receipt-amount">{money(Math.abs(t.amount))}</div><span className="demo-badge">{t.commandId?'Completed · Sandbox':t.kind==='Recorded expense'?'Recorded · Balance unchanged':'Illustrative record'}</span><dl className="detail-list"><dt>Recipient / merchant</dt><dd>{t.name}</dd><dt>Type</dt><dd>{t.kind||'Sample transaction'}</dd><dt>Date</dt><dd>{t.createdAt?new Date(t.createdAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):t.date}</dd><dt>Reference</dt><dd>{t.id}</dd>{t.recipientKey&&<><dt>Recipient key</dt><dd>{t.recipientKey}</dd></>}<dt>Description</dt><dd>{t.description||'—'}</dd></dl><button className="primary" onClick={()=>downloadText(`fluxo-receipt-${t.id}.txt`,text)}>Download receipt</button><button className="secondary" onClick={async()=>{try{await shareText('Fluxo demo receipt',text);}catch{/* User can cancel sharing. */}}}>Share / copy receipt</button>{actions}<small className="modal-note">Demo record. No real bank payment was processed.</small></Dialog>;
}

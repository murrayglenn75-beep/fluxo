'use client';
import {useState} from 'react';
import {useAccount,updateAccount} from '../lib/demo/store';
import {parseMinor} from '../lib/demo/account';
import {Dialog,money,downloadText} from './dialog';
export default function CardManager({index,close,removed}:{index:number;close:()=>void;removed:()=>void}){
 const account=useAccount(),card=account.cards[index];
 const [name,setName]=useState(card?.name||''),[limit,setLimit]=useState(((card?.limit||0)/100).toFixed(2)),[error,setError]=useState(''),[confirm,setConfirm]=useState(false);
 if(!card)return null;
 function save(){try{const value=parseMinor(limit);if(!name.trim()||name.trim().length>40)throw new Error('Enter a name up to 40 characters.');if(value<card.used)throw new Error('Limit must cover the amount already used.');updateAccount(a=>({...a,cards:a.cards.map((c,i)=>i===index?{...c,name:name.trim(),limit:value}:c)}));close();}catch(e){setError(e instanceof Error?e.message:'Unable to save.');}}
 return <Dialog title="Manage card" close={close}><p>•••• {card.lastFour} · {card.virtual?'Virtual':'Added'} demo card</p><label className="field">Card name<input value={name} maxLength={40} onChange={e=>setName(e.target.value)}/></label><label className="field">Spending limit (BRL)<input value={limit} inputMode="decimal" onChange={e=>setLimit(e.target.value)}/></label><small>Used: {money(card.used)}. Limits apply to this demo card only.</small>{error&&<p role="alert" className="error">{error}</p>}<button className="primary" onClick={save}>Save card changes</button><button className="secondary" onClick={()=>downloadText(`fluxo-card-${card.lastFour}-statement.csv`,card.virtual?'merchant,amount_brl,date\n':'merchant,amount_brl,date\nSpotify,-29.90,2026-10-02\niFood,-43.50,2026-10-01\nAmazon,-120.00,2026-10-01','text/csv')}>Download statement</button>{true&&<><button className="danger-button" onClick={()=>setConfirm(true)}>Remove card</button>{confirm&&<div className="approval"><p>Remove {card.name} from this demo wallet?</p><button className="danger-button" onClick={()=>{try{updateAccount(a=>({...a,cards:a.cards.filter((_,i)=>i!==index)}));removed();close();}catch(e){setError(e instanceof Error?e.message:'Unable to remove.');}}}>Confirm removal</button><button onClick={()=>setConfirm(false)}>Keep card</button></div>}</>}</Dialog>;
}

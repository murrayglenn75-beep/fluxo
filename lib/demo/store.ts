'use client';
import { useSyncExternalStore, type Dispatch, type SetStateAction } from 'react';
import { accountSchema,initialAccount,type Account } from './account';
const KEY='fluxo.demo.account.v2';
let cache:Account=initialAccount,loaded=false;
const listeners=new Set<()=>void>();
function load(){if(loaded||typeof window==='undefined')return;loaded=true;try{const raw=localStorage.getItem(KEY);if(raw){const parsed=accountSchema.safeParse(JSON.parse(raw));if(parsed.success)cache=parsed.data;else window.dispatchEvent(new CustomEvent('fluxo-storage-error',{detail:'Saved demo data could not be read. Export it before resetting.'}));}}catch{window.dispatchEvent(new CustomEvent('fluxo-storage-error',{detail:'Local storage is unavailable. Changes cannot be saved.'}));}}
function emit(){listeners.forEach(fn=>fn());}
function subscribe(fn:()=>void){load();listeners.add(fn);const handle=(e:StorageEvent)=>{if(e.key===KEY){loaded=false;cache=initialAccount;load();emit();}};window.addEventListener('storage',handle);return()=>{listeners.delete(fn);window.removeEventListener('storage',handle);};}
function snapshot(){load();return cache;}
export function useAccount(){return useSyncExternalStore(subscribe,snapshot,()=>initialAccount);}
export function updateAccount(updater:(current:Account)=>Account){load();const next=accountSchema.parse(updater(cache));if(next===cache)return;try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw new Error('Unable to save. No account changes were applied. Check available device storage.');}cache=next;emit();return next;}
export function useAccountField<K extends keyof Account>(key:K):[Account[K],Dispatch<SetStateAction<Account[K]>>]{const account=useAccount();return[account[key],value=>{try{updateAccount(current=>({...current,[key]:typeof value==='function'?(value as (prev:Account[K])=>Account[K])(current[key]):value}));}catch(error){window.dispatchEvent(new CustomEvent('fluxo-storage-error',{detail:error instanceof Error?error.message:'Unable to save account.'}));}}];}

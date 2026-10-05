'use client';
import {useSyncExternalStore,type Dispatch,type SetStateAction} from 'react';
import {accountSchema,initialAccount,type Account} from './account';
const KEY='fluxo.demo.account.v2';
let cache:Account=initialAccount,loaded=false,loadError='';
const listeners=new Set<()=>void>();
function load(){
 if(loaded||typeof window==='undefined')return;
 loaded=true;loadError='';
 try{const raw=localStorage.getItem(KEY);if(raw){const parsed=accountSchema.safeParse(JSON.parse(raw));if(parsed.success)cache=parsed.data;else loadError='Saved demo data could not be read. Export a backup in Settings before resetting. Changes are blocked.';}}
 catch{loadError='Saved data could not be read. Export a backup in Settings before resetting. Changes are blocked.';}
}
function emit(){listeners.forEach(fn=>fn());}
function onStorage(e:StorageEvent){if(e.key===KEY||e.key===null){loaded=false;cache=initialAccount;load();emit();}}
function subscribe(fn:()=>void){load();if(!listeners.size)window.addEventListener('storage',onStorage);listeners.add(fn);return()=>{listeners.delete(fn);if(!listeners.size)window.removeEventListener('storage',onStorage);};}
function snapshot(){load();return cache;}
export function useAccount(){return useSyncExternalStore(subscribe,snapshot,()=>initialAccount);}
export function useStorageError(){return useSyncExternalStore(subscribe,()=>{load();return loadError;},()=> '');}
function persist(next:Account){try{localStorage.setItem(KEY,JSON.stringify(next));}catch{throw new Error('Unable to save. No account changes were applied. Check available device storage.');}cache=next;loadError='';emit();return next;}
export function updateAccount(updater:(current:Account)=>Account){
 loaded=false;load();if(loadError)throw new Error(loadError);
 const current=cache,next=updater(current);if(next===current)return current;
 return persist(accountSchema.parse(next));
}
export function resetAccount(){return persist(accountSchema.parse(initialAccount));}
export function exportAccountBackup(){load();const raw=localStorage.getItem(KEY);return raw||JSON.stringify(cache,null,2);}
export function useAccountField<K extends keyof Account>(key:K):[Account[K],Dispatch<SetStateAction<Account[K]>>]{const account=useAccount();return[account[key],value=>{try{updateAccount(current=>({...current,[key]:typeof value==='function'?(value as (prev:Account[K])=>Account[K])(current[key]):value}));}catch(error){window.dispatchEvent(new CustomEvent('fluxo-storage-error',{detail:error instanceof Error?error.message:'Unable to save account.'}));}}];}

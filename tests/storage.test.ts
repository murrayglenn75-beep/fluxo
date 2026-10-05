import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {initialAccount,postPayment} from '../lib/demo/account';
let saved:string|null;
const storage={getItem:vi.fn(()=>saved),setItem:vi.fn((_key:string,value:string)=>{saved=value;})};
beforeEach(()=>{vi.resetModules();saved=null;storage.getItem.mockClear();storage.setItem.mockReset().mockImplementation((_key,value)=>{saved=value;});vi.stubGlobal('window',new EventTarget());vi.stubGlobal('localStorage',storage);});
afterEach(()=>vi.unstubAllGlobals());
describe('device persistence integrity',()=>{
 it('blocks writes to corrupted data and exports the original backup',async()=>{saved='{broken';const store=await import('../lib/demo/store');expect(()=>store.updateAccount(a=>({...a,balance:1}))).toThrow('Changes are blocked');expect(saved).toBe('{broken');expect(store.exportAccountBackup()).toBe('{broken');store.resetAccount();expect(JSON.parse(saved!).balance).toBe(initialAccount.balance);});
 it('does not publish a change when device storage fails',async()=>{const store=await import('../lib/demo/store');storage.setItem.mockImplementation(()=>{throw new Error('Quota exceeded');});expect(()=>store.updateAccount(a=>({...a,balance:100}))).toThrow('No account changes');expect(saved).toBe(null);storage.setItem.mockImplementation((_key,value)=>{saved=value;});const next=store.updateAccount(a=>a);expect(next.balance).toBe(initialAccount.balance);});
 it('uses the latest persisted balance before posting another payment',async()=>{const store=await import('../lib/demo/store');store.updateAccount(a=>({...a,balance:1000}));saved=JSON.stringify({...initialAccount,balance:500});expect(()=>store.updateAccount(a=>postPayment(a,{commandId:'new',name:'Maria',amount:600,kind:'Transfer',createdAt:'2026-10-05T03:00:00Z'}))).toThrow('exceeds');expect(JSON.parse(saved!).balance).toBe(500);});
});

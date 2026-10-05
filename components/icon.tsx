import type { ReactNode } from 'react';
const paths: Record<string, ReactNode> = {
 home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h5v-6h4v6h5V9"/></>,
 activity: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M7 5V3m10 2V3M3 10h18m-14 4h5m-5 3h8"/></>,
 pix: <><path d="m9 4 3-3 3 3-3 3Zm0 16 3-3 3 3-3 3ZM4 9l3 3-3 3-3-3Zm16 0 3 3-3 3-3-3Z"/><path d="m8 9 4 4 4-4m-8 6 4-4 4 4"/></>,
 transfer: <><path d="M4 7h16l-4-4m4 14H4l4 4M20 7v4M4 17v-4"/></>,
 cards: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/></>,
 bills: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6m-6 4h6m-6 4h4"/></>,
 exchange: <><path d="M4 8a8 8 0 0 1 14-3l3 3m0-5v5h-5M20 16a8 8 0 0 1-14 3l-3-3m0 5v-5h5"/></>,
 bank: <><path d="m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18"/></>,
 ai: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/><path d="m19 2 .8 2.2L22 5l-2.2.8L19 8l-.8-2.2L16 5l2.2-.8Z"/></>,
 scan: <><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m8 0h4a1 1 0 0 0 1-1v-4M7 12h10"/><rect x="8" y="7" width="8" height="10" rx="1"/></>,
 budgets: <><path d="M5 20V10h4v10m2 0V4h4v16m2 0V7h4v13M3 20h20"/></>,
 goals: <><path d="M12 21s-9-5.5-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12Z"/><path d="m8 12 3 3 5-6"/></>,
 settings: <><path d="m10 3-1 3-3 1-3 3 2 2-1 3 3 3 3-1 2 2 3-1 1-3 3-1 2-3-2-2 1-3-3-3-3 1-2-2Z"/><circle cx="12" cy="12" r="3"/></>,
 search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
 bell: <><path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4l-2 4Zm5 3h4M12 2v2"/></>,
 eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
 arrow: <path d="m9 5 7 7-7 7"/>,
 up: <path d="M12 20V4m-6 6 6-6 6 6"/>,
 down: <path d="M12 4v16m-6-6 6 6 6-6"/>,
 send: <><path d="m21 3-7 18-3-8-8-3 18-7ZM11 13l10-10"/></>,
 cart: <><path d="M3 3h2l3 12h10l3-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></>,
 more: <><circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/></>,
 close: <path d="m6 6 12 12M6 18 18 6"/>,
 back: <path d="M20 12H4m6-6-6 6 6 6"/>,
 lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
};
export default function Icon({name,className=''}:{name:string;className?:string}) {
 return <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||paths.ai}</svg>;
}

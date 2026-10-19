import type { ReactNode } from 'react';
import './globals.css';
import './appearance-fix.css';
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#00795d'};
export const metadata={title:'Fluxo · Your money, in focus',description:'Your personal financial dashboard. Explore payments, cards, and financial insights in a sandbox.'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><script dangerouslySetInnerHTML={{__html:"try{const a=JSON.parse(localStorage.getItem('fluxo-appearance')||'{}');if(['dark','light','system'].includes(a.theme))document.documentElement.dataset.fluxoTheme=a.theme;if(['emerald','blue','purple','red','yellow'].includes(a.accent))document.documentElement.dataset.fluxoAccent=a.accent;}catch{}"}}/>{children}</body></html>;}

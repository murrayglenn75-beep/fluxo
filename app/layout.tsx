import type { ReactNode } from 'react';
import './globals.css';
import './appearance-fix.css';
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#00795d'};
export const metadata={title:'Fluxo · Your money, in focus',description:'Your personal financial dashboard. Explore payments, cards, and financial insights in a sandbox.'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><script dangerouslySetInnerHTML={{__html:"try{const a=JSON.parse(localStorage.getItem('fluxo-appearance')||'{}');const t=['dark','light','system'].includes(a.theme)?a.theme:'dark';document.documentElement.dataset.fluxoTheme=t==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;if(['emerald','blue','purple','red','yellow','pink','black'].includes(a.accent))document.documentElement.dataset.fluxoAccent=a.accent;}catch{}"}}/>{children}</body></html>;}

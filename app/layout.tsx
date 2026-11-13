import type { ReactNode } from 'react';
import './globals.css';
import './appearance-fix.css';
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#00795d'};
export const metadata={title:'Fluxo · Your money, in focus',description:'Your personal financial dashboard. Explore payments, cards, and financial insights in a sandbox.'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><script dangerouslySetInnerHTML={{__html:"try{let a={};try{a=JSON.parse(localStorage.getItem('fluxo-appearance')||'{}')||{}}catch{};const t=['dark','system'].includes(a.theme)?a.theme:'dark';const c=['emerald','blue','purple','red','yellow','pink','black'].includes(a.accent)?a.accent:'emerald';document.documentElement.dataset.fluxoTheme=t;document.documentElement.dataset.fluxoAccent=c;}catch{document.documentElement.dataset.fluxoTheme='dark';document.documentElement.dataset.fluxoAccent='emerald';}"}}/>{children}</body></html>;}

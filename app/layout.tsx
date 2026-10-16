import type { ReactNode } from 'react';
import './globals.css';
import ThemeInitializer from '../components/theme-initializer';
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#00795d'};
export const metadata={title:'Fluxo · Your money, in focus',description:'Your personal financial dashboard. Explore payments, cards, and financial insights in a sandbox.'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><ThemeInitializer/>{children}</body></html>;}

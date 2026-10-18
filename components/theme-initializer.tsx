'use client';
import {useEffect} from 'react';
const valid=new Set(['forest','ocean','violet','sunset','ruby']);
export default function ThemeInitializer(){
 useEffect(()=>{
  try {
   const stored=window.localStorage.getItem('fluxo-appearance-theme-v1');
   document.documentElement.dataset.fluxoTheme=stored&&valid.has(stored)?stored:'forest';
  } catch {document.documentElement.dataset.fluxoTheme='forest';}
 },[]);
 return null;
}

'use client';
import {useEffect,useState} from 'react';

const themes = [
 {id:'forest',label:'Forest green',swatch:'#28db90'},
 {id:'ocean',label:'Ocean blue',swatch:'#4aafff'},
 {id:'violet',label:'Royal purple',swatch:'#b19aff'},
 {id:'sunset',label:'Sunset amber',swatch:'#ffc36b'},
 {id:'ruby',label:'Ruby red',swatch:'#ff7b92'},
] as const;
type ThemeId = (typeof themes)[number]['id'];
const storageKey='fluxo-appearance-theme-v1';
function valid(value:string|null):ThemeId {
 return themes.find(theme=>theme.id===value)?.id ?? 'forest';
}
export default function AppearanceSettings() {
 const [selected,setSelected]=useState<ThemeId>('forest');
 useEffect(()=>{
  try {
   const value=valid(window.localStorage.getItem(storageKey));
   setSelected(value);
   document.documentElement.dataset.fluxoTheme=value;
  } catch { document.documentElement.dataset.fluxoTheme='forest'; }
 },[]);
 function choose(value:ThemeId) {
  setSelected(value);
  document.documentElement.dataset.fluxoTheme=value;
  try { window.localStorage.setItem(storageKey,value); } catch { /* session-only if storage is blocked */ }
 }
 return <section className="fluxo-appearance-settings" aria-labelledby="fluxo-appearance-title">
  <h3 id="fluxo-appearance-title">Appearance</h3>
  <p className="page-subtitle">Choose a colour theme. Your preference is saved on this device.</p>
  <div className="fluxo-theme-options" role="group" aria-label="Colour theme">
   {themes.map(theme=><button key={theme.id} type="button" className={selected===theme.id?'fluxo-theme-option selected':'fluxo-theme-option'} onClick={()=>choose(theme.id)} aria-pressed={selected===theme.id}>
    <span className="fluxo-theme-swatch" style={{background:theme.swatch}} aria-hidden="true"/>
    <span>{theme.label}</span>
    <span className="fluxo-theme-selected" aria-hidden="true">{selected===theme.id?'✓':''}</span>
   </button>)}
  </div>
 </section>;
}

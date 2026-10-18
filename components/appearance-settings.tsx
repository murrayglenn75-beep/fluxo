'use client';
import {useEffect,useState} from 'react';

const themes=[
 {id:'emerald',name:'Emerald',background:'#07382e',accent:'#36e4a0'},
 {id:'ruby',name:'Ruby',background:'#310c1a',accent:'#ff426b'},
 {id:'gold',name:'Gold',background:'#30240b',accent:'#ffd34e'},
 {id:'blue',name:'Electric Blue',background:'#071f42',accent:'#3298ff'},
 {id:'purple',name:'Purple',background:'#2c103f',accent:'#bc5cff'},
 {id:'light',name:'Light',background:'#f1f5f3',accent:'#148b69'},
] as const;
type ThemeId=typeof themes[number]['id'];
const KEY='fluxo-appearance-theme-v1';
function valid(value:string|null):ThemeId{
 return themes.find(theme=>theme.id===value)?.id??'emerald';
}
export function applyFluxoTheme(id:ThemeId){
 document.documentElement.dataset.fluxoTheme=id;
}
export function AppearanceBootstrap(){
 useEffect(()=>{
  let theme:ThemeId='emerald';
  try{theme=valid(localStorage.getItem(KEY));}catch{}
  applyFluxoTheme(theme);
 },[]);
 return null;
}
export default function AppearanceSettings(){
 const [selected,setSelected]=useState<ThemeId>('emerald');
 useEffect(()=>{
  let theme:ThemeId='emerald';
  try{theme=valid(localStorage.getItem(KEY));}catch{}
  setSelected(theme);applyFluxoTheme(theme);
 },[]);
 function choose(id:ThemeId){
  setSelected(id);applyFluxoTheme(id);
  try{localStorage.setItem(KEY,id);}catch{}
 }
 return <section className="page-panel appearance-settings" aria-labelledby="appearance-title">
  <h2 id="appearance-title">Appearance</h2>
  <p>Choose a colour theme for your Fluxo experience. Your preference stays on this device and works in demo mode.</p>
  <div className="appearance-options" role="group" aria-label="Fluxo colour theme">
   {themes.map(theme=><button type="button" key={theme.id}
    className={selected===theme.id?'appearance-option selected':'appearance-option'}
    aria-pressed={selected===theme.id} onClick={()=>choose(theme.id)}>
    <span className="appearance-swatch" style={{background:theme.background}}>
     <span style={{background:theme.accent}}/>
    </span>
    <span>{theme.name}</span>
   </button>)}
  </div>
  <p className="appearance-note">Colour preferences do not change account permissions, balances or payment behaviour.</p>
 </section>;
}

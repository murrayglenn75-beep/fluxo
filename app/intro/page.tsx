'use client';
import {useState} from 'react';
import Link from 'next/link';
const slides=[
 {heading:'Banking that works',accent:'for your life',copy:'Secure. Smart. Simple.',symbol:'▣'},
 {heading:'Your money,',accent:'in focus',copy:'See your balance, cards and spending in one place.',symbol:'◈'},
 {heading:'Move smarter,',accent:'stay in control',copy:'Explore transfers, Pix and insights safely in sandbox mode.',symbol:'↗'}
];
export default function IntroPage(){
 const [step,setStep]=useState(0);
 const slide=slides[step];
 return <main className="fluxo-intro">
 <div className="fluxo-intro-inner">
  <header className="fluxo-intro-brand"><span className="fluxo-intro-symbol" aria-hidden="true">F</span> Fluxo</header>
  <section className="fluxo-intro-hero" aria-live="polite">
   <h1>{slide.heading}<br/><em>{slide.accent}</em></h1>
   <p>{slide.copy}</p>
   <div className="fluxo-intro-tiles" aria-hidden="true">
    <div className="fluxo-intro-tile first">{slide.symbol}</div>
    <div className="fluxo-intro-tile second">▤</div>
    <div className="fluxo-intro-tile third">⌁</div>
   </div>
  </section>
  <footer className="fluxo-intro-footer">
   <div className="fluxo-intro-dots" role="group" aria-label={`Slide ${step+1} of ${slides.length}`}>{slides.map((_,i)=><span key={i} className={i===step?'current':''}/>)}</div>
   {step<slides.length-1?<button className="fluxo-intro-next" onClick={()=>setStep(v=>v+1)}>Next <span aria-hidden="true">→</span></button>:<Link className="fluxo-intro-next" href="/login">Get started <span aria-hidden="true">→</span></Link>}
   <Link className="fluxo-intro-skip" href="/login">Skip</Link>
  </footer>
 </div>
 </main>;
}
import Link from 'next/link';
export default function WelcomePage(){
return <main className="fluxo-cover">
<div className="fluxo-cover-glow" aria-hidden="true"/>
<div className="fluxo-cover-inner">
<div className="fluxo-cover-brand">Fluxo</div>
<div className="fluxo-cover-art" role="img" aria-label="Two overlapping Fluxo payment cards">
<div className="fluxo-cover-card fluxo-cover-card-back"><span>Fluxo</span><span>0000 0000</span></div>
<div className="fluxo-cover-card fluxo-cover-card-front"><span>Fluxo</span><span>7950</span></div>
</div>
<div className="fluxo-cover-bottom">
<h1>Your Smart<br/>Financial Future<br/><em>Starts Here</em></h1>
<Link className="fluxo-cover-cta" href="/login">Get Started <span aria-hidden="true">→</span></Link>
<p className="fluxo-cover-note">Sandbox experience. No real money moves.</p>
</div></div></main>;
}
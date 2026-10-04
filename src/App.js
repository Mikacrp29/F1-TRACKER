import React, { useState, useEffect } from "react";
import { fetchCalendar, fetchDrivers, fetchConstructors, fetchResults } from "./api";

// ─── DONNÉES (remplies automatiquement par l'API Jolpica-F1) ─────
const CAL = [];
const DRIVERS = [];
const CONSTRUCTORS = [];
const RESULTS = [];

// remplace le contenu d'un tableau sans le recréer (ignore les réponses vides)
const replace = (arr, items) => { if (items.length) { arr.length = 0; arr.push(...items); } };

// ─── HELPERS ──────────────────────────────────────────────────────
const fmtT    = i => new Date(i).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const fmtD    = i => new Date(i).toLocaleDateString([],{weekday:"short",day:"numeric",month:"short"});
const fmtFull = i => new Date(i).toLocaleDateString([],{day:"numeric",month:"short",year:"numeric"});
const S_LBL   = {fp1:"EL 1",fp2:"EL 2",fp3:"EL 3",sprintQ:"Sprint Shoot-Out",sprint:"Sprint",quali:"Qualifications",race:"Course"};
const S_SHT   = {fp1:"EL1",fp2:"EL2",fp3:"EL3",sprintQ:"SQ",sprint:"SPRINT",quali:"QUALI",race:"COURSE"};
const sessOrd = gp => (gp.hasSprint?["fp1","sprintQ","sprint","quali","race"]:["fp1","fp2","fp3","quali","race"]).filter(k=>gp.sessions[k]);
const gpSt    = gp => { const now=Date.now(),vs=Object.values(gp.sessions).map(s=>new Date(s).getTime()); if(now>new Date(gp.sessions.race).getTime()+7200000)return"finished"; if(now>Math.min(...vs))return"ongoing"; return"upcoming"; };
const nxtGP   = () => CAL.find(g=>new Date(g.sessions.race).getTime()+7200000>Date.now())||CAL[CAL.length-1];
const nxtSess = gp => { for(const k of sessOrd(gp)){const t=gp.sessions[k];if(new Date(t).getTime()>Date.now())return{k,t};} return null; };

// ─── COUNTDOWN ────────────────────────────────────────────────────
function useCd(t){
  const [r,setR]=React.useState(Math.max(0,new Date(t)-Date.now()));
  React.useEffect(()=>{
    setR(Math.max(0,new Date(t)-Date.now()));
    const id=setInterval(()=>setR(Math.max(0,new Date(t)-Date.now())),1000);
    return()=>clearInterval(id);
  },[t]);
  return{d:Math.floor(r/86400000),h:Math.floor(r%86400000/3600000),m:Math.floor(r%3600000/60000),s:Math.floor(r%60000/1000)};
}

// ─── DRAPEAUX (images : Windows n'affiche pas les emojis de drapeaux) ──
const Flag = ({ f }) => {
  const cps = [...(f || "")].map(c => c.codePointAt(0));
  const ok = cps.length === 2 && cps.every(c => c >= 0x1F1E6 && c <= 0x1F1FF);
  if (!ok) return <span>{f}</span>;
  const code = cps.map(c => String.fromCharCode(c - 0x1F1E6 + 97)).join("");
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={code.toUpperCase()}
      loading="lazy"
      style={{ height: "1em", width: "1.4em", objectFit: "cover", borderRadius: 2, verticalAlign: "-0.12em" }}
    />
  );
};
const TeamLogo = ({ id, name, color }) => {
  const [err, setErr] = useState(false);
  if (err || !id) {
    return (
      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:"1.5em",height:"1.5em",borderRadius:5,background:color,color:"#000",fontSize:".6em",fontWeight:900,verticalAlign:"middle"}}>
        {(name||"?").slice(0,2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={`/logos/${id}.png`}
      alt={name}
      onError={() => setErr(true)}
      style={{height:"1.5em",width:"1.5em",objectFit:"contain",verticalAlign:"middle"}}
    />
  );
};

// ─── CSS ──────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#09090b;--bg3:#18181c;--bg4:#222228;--red:#e8002d;--w:#f0f0f4;--g:#8888a0;--g2:#55556a;--gr:#00d46a;--y:#ffca28;--bd:rgba(255,255,255,.07)}
html,body,#root{height:100%;overflow:hidden;background:var(--bg)}
body{font-family:'Rajdhani',sans-serif;color:var(--w);-webkit-font-smoothing:antialiased}
.app{height:100%;display:flex;flex-direction:column;overflow:hidden}
.hdr{height:54px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:rgba(9,9,11,.97);border-bottom:1px solid var(--bd);z-index:10}
.logo{font-family:'Orbitron',sans-serif;font-size:.95rem;font-weight:900;letter-spacing:.1em;display:flex;align-items:center;gap:6px}
.logo-r{color:var(--red)}
.dot{width:7px;height:7px;background:var(--red);border-radius:50%;animation:pulse 1.4s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--bg4) transparent}
.scroll::-webkit-scrollbar{width:3px}.scroll::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:2px}
.inner{padding:14px 14px 10px;max-width:640px;margin:0 auto}
.bnav{height:62px;flex-shrink:0;display:flex;align-items:center;justify-content:space-around;padding:0 4px 4px;background:rgba(13,13,16,.98);border-top:1px solid var(--bd)}
.nb{display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;cursor:pointer;color:var(--g2);font-family:'Rajdhani',sans-serif;font-size:.57rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:6px 10px;min-width:50px;transition:color .15s}
.nb svg{transition:transform .15s}.nb.on{color:var(--red)}.nb.on svg{transform:scale(1.1)}.nb:active svg{transform:scale(.88)}
.b26{display:inline-flex;align-items:center;font-family:'Orbitron',sans-serif;font-size:.48rem;font-weight:700;letter-spacing:.1em;color:var(--y);background:rgba(255,202,40,.12);border:1px solid rgba(255,202,40,.22);border-radius:20px;padding:2px 8px}
.bspr{display:inline-flex;align-items:center;font-family:'Orbitron',sans-serif;font-size:.48rem;font-weight:700;letter-spacing:.1em;color:#ff8c00;background:rgba(255,140,0,.12);border:1px solid rgba(255,140,0,.22);border-radius:20px;padding:2px 8px}
.ptitle{font-family:'Orbitron',sans-serif;font-size:.88rem;font-weight:900;letter-spacing:.04em;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.ptitle::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,var(--bd),transparent)}
.card{background:var(--bg3);border:1px solid var(--bd);border-radius:13px;overflow:hidden}
.hero{background:linear-gradient(135deg,#120408 0%,#180610 45%,#0d0d12 100%);border:1px solid rgba(232,0,45,.22);border-radius:18px;padding:17px;margin-bottom:14px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50px;right:-30px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,rgba(232,0,45,.12) 0%,transparent 70%);pointer-events:none}
.hlbl{font-family:'Orbitron',sans-serif;font-size:.56rem;font-weight:700;letter-spacing:.2em;color:var(--red);display:flex;align-items:center;gap:5px;margin-bottom:6px}
.hlbl::before{content:'';width:5px;height:5px;background:var(--red);border-radius:50%;animation:pulse 1.4s infinite}
.htitle{font-family:'Orbitron',sans-serif;font-size:1.18rem;font-weight:900;line-height:1.15;margin-bottom:3px}
.hsub{color:var(--g);font-size:.84rem;font-weight:500;margin-bottom:10px}
.cdown{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:11px 0 4px}
.cu{background:rgba(0,0,0,.4);border:1px solid rgba(232,0,45,.13);border-radius:8px;padding:9px 3px;text-align:center}
.cn{font-family:'Orbitron',sans-serif;font-size:1.6rem;font-weight:900;line-height:1;text-shadow:0 0 16px rgba(232,0,45,.38)}
.cl{font-size:.52rem;color:var(--g);letter-spacing:.13em;text-transform:uppercase;margin-top:3px}
.sr{display:flex;align-items:center;padding:8px 11px;border-radius:7px;margin-bottom:3px}
.sr.next{background:rgba(232,0,45,.08);border:1px solid rgba(232,0,45,.2)}.sr.past{opacity:.33}
.sk{font-family:'Orbitron',sans-serif;font-size:.56rem;font-weight:700;letter-spacing:.1em;color:var(--red);width:52px;flex-shrink:0}
.sn{font-weight:600;font-size:.82rem;flex:1;padding:0 8px}
.st{font-size:.74rem;color:var(--g);text-align:right}.st strong{color:var(--w);display:block;font-size:.82rem}
.gpc{background:var(--bg3);border:1px solid var(--bd);border-radius:12px;margin-bottom:7px;cursor:pointer;overflow:hidden;transition:border-color .18s,transform .12s}
.gpc:active{transform:scale(.99)}.gpc:hover{border-color:rgba(232,0,45,.3)}.gpc.finished{opacity:.52}.gpc.ongoing{border-color:rgba(232,0,45,.5)}
.gpci{display:flex;align-items:center;gap:9px;padding:11px 13px}
.rnum{font-family:'Orbitron',sans-serif;font-size:.54rem;font-weight:700;color:var(--g2);min-width:22px}
.gi{flex:1}.gn{font-weight:700;font-size:.86rem}.gc{font-size:.7rem;color:var(--g);margin-top:1px}
.gdate{font-size:.72rem;color:var(--g);text-align:right}
.sbg{display:inline-flex;align-items:center;gap:3px;font-family:'Orbitron',sans-serif;font-size:.5rem;font-weight:700;letter-spacing:.1em;padding:2px 6px;border-radius:20px;text-transform:uppercase;margin-top:3px}
.sup{background:rgba(255,202,40,.1);color:var(--y)}.son{background:rgba(232,0,45,.14);color:var(--red)}.son::before{content:'';width:4px;height:4px;background:var(--red);border-radius:50%;animation:pulse 1s infinite}.sfi{background:rgba(0,212,106,.1);color:var(--gr)}
.strow{display:flex;align-items:center;gap:9px;padding:10px 13px;border-bottom:1px solid var(--bd);transition:background .1s}
.strow:last-child{border-bottom:none}.strow:hover{background:rgba(255,255,255,.013)}
.pn{font-family:'Orbitron',sans-serif;font-size:.82rem;font-weight:900;width:20px;color:var(--g2);text-align:center;flex-shrink:0}.pn.t3{color:var(--w)}
.tb{width:3px;height:28px;border-radius:2px;flex-shrink:0}.di{flex:1}.dn{font-weight:700;font-size:.86rem}.dt{font-size:.68rem;color:var(--g)}
.dp{font-family:'Orbitron',sans-serif;font-weight:900;font-size:.94rem}.dl{font-size:.52rem;color:var(--g);display:block;text-align:right}
.pbar{height:3px;background:var(--bg4);border-radius:2px;margin-top:4px;overflow:hidden}.pfill{height:100%;border-radius:2px;transition:width 1.4s ease}
.rrow{display:flex;align-items:center;gap:7px;padding:8px 12px;border-bottom:1px solid var(--bd)}.rrow:last-child{border-bottom:none}
.rpos{font-family:'Orbitron',sans-serif;font-size:.72rem;font-weight:900;width:20px;color:var(--g2);flex-shrink:0;text-align:center}
.rpos.p1{color:#FFD700}.rpos.p2{color:#C0C0C0}.rpos.p3{color:#CD7F32}
.rdv{flex:1;font-weight:700;font-size:.84rem}.rtm{font-size:.64rem;color:var(--g)}
.rgp{font-size:.68rem;color:var(--g);min-width:60px;text-align:right}
.rpt{font-family:'Orbitron',sans-serif;font-weight:900;font-size:.8rem;color:var(--y);min-width:24px;text-align:right}
.tabs{display:flex;gap:3px;margin-bottom:12px;background:var(--bg3);border-radius:8px;padding:3px}
.tab{flex:1;padding:7px 4px;background:none;border:none;border-radius:6px;cursor:pointer;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:.72rem;letter-spacing:.07em;text-transform:uppercase;color:var(--g2);transition:all .17s}.tab.on{background:var(--red);color:#fff}
.chip{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:20px;font-size:.61rem;font-weight:700;letter-spacing:.06em;background:rgba(255,255,255,.06);color:var(--g)}
.chip-sp{background:rgba(255,140,0,.1);color:#ff8c00}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.sc{background:var(--bg3);border:1px solid var(--bd);border-radius:9px;padding:11px 12px}
.sl2{font-size:.63rem;color:var(--g);margin-bottom:2px}.sv{font-family:'Orbitron',sans-serif;font-weight:900;font-size:.88rem}
.trow{display:flex;align-items:center;justify-content:space-between;padding:12px 13px;border-bottom:1px solid var(--bd)}.trow:last-child{border-bottom:none}
.tl{font-weight:600;font-size:.86rem}.ts{font-size:.7rem;color:var(--g);margin-top:1px}
.tg{position:relative;width:44px;height:24px;flex-shrink:0}.tg input{opacity:0;width:0;height:0}
.tsl{position:absolute;cursor:pointer;inset:0;background:var(--bg4);border-radius:12px;transition:.26s}
.tsl::before{content:'';position:absolute;width:18px;height:18px;left:3px;bottom:3px;background:var(--g2);border-radius:50%;transition:.26s}
.tg input:checked+.tsl{background:var(--red)}.tg input:checked+.tsl::before{transform:translateX(20px);background:#fff}
.back{display:flex;align-items:center;gap:5px;background:none;border:none;cursor:pointer;color:var(--g);font-family:'Rajdhani',sans-serif;font-size:.86rem;font-weight:600;letter-spacing:.04em;margin-bottom:13px;padding:0;transition:color .13s}.back:hover{color:var(--w)}
.favstar{cursor:pointer;font-size:.9rem;transition:transform .12s}.favstar:active{transform:scale(1.3)}
.empty{text-align:center;padding:36px 18px;color:var(--g)}.eico{font-size:2rem;margin-bottom:7px}
.ibox{font-size:.72rem;color:var(--g);background:rgba(255,202,40,.06);border:1px solid rgba(255,202,40,.16);border-radius:8px;padding:8px 11px;margin-bottom:11px}
.note{text-align:center;font-size:.62rem;color:var(--g2);padding:6px 0 2px}
.fade{animation:fi .25s ease forwards}
@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.slide{animation:si .3s cubic-bezier(.16,1,.3,1) forwards}
@keyframes si{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.app{height:100vh;height:100dvh}
.hdr{padding-top:env(safe-area-inset-top);height:calc(54px + env(safe-area-inset-top))}
.bnav{padding-bottom:calc(4px + env(safe-area-inset-bottom));height:calc(62px + env(safe-area-inset-bottom))}
.di,.gi,.sn{min-width:0}
.dn,.gn,.gc,.rdv{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media (max-width:480px){
  .inner{padding:12px 10px 8px}
  .nb{min-width:0;flex:1;padding:6px 2px;font-size:.62rem}
  .htitle{font-size:1.05rem}
  .cn{font-size:1.35rem}
  .dn{font-size:.9rem}
  .dt{font-size:.72rem}
  .rgp{min-width:0;font-size:.64rem}
  .gdate{font-size:.66rem}
  .sk{width:46px}
}`;

// ─── ICONS ────────────────────────────────────────────────────────
const ICP={
  home: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"],
  cal:  ["M8 2v4M16 2v4M3 10h18","M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"],
  trophy:["M6 9H4.5a2.5 2.5 0 010-5H6","M18 9h1.5a2.5 2.5 0 000-5H18","M4 22h16","M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22","M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22","M18 2H6v7a6 6 0 0012 0V2z"],
  flag: ["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z","M4 22V15"],
  bell: ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"],
  chev: ["M9 18l6-6-6-6"],
  back: ["M15 18l-6-6 6-6"],
};
const Ic=({n,s=20})=>(
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {(ICP[n]||[]).map((d,i)=><path key={i} d={d}/>)}
  </svg>
);

// ─── PETITS COMPOSANTS ────────────────────────────────────────────
function Cd({target,label}){
  const{d,h,m,s}=useCd(target);
  return(<div>
    <div style={{fontSize:".66rem",color:"var(--g)",marginBottom:4,fontWeight:600}}>⏱ {label}</div>
    <div className="cdown">{[{v:d,l:"Jours"},{v:h,l:"Hrs"},{v:m,l:"Min"},{v:s,l:"Sec"}].map(({v,l})=>(
      <div key={l} className="cu"><div className="cn">{String(v).padStart(2,"0")}</div><div className="cl">{l}</div></div>
    ))}</div>
  </div>);
}
function SRow({k,time,isNext}){
  const past=new Date(time).getTime()+3600000<Date.now();
  return(<div className={`sr${isNext?" next":""}${past?" past":""}`}>
    <span className="sk">{S_SHT[k]||k.toUpperCase()}</span>
    <span className="sn">{S_LBL[k]||k}</span>
    <span className="st"><strong>{fmtT(time)}</strong>{fmtD(time)}</span>
  </div>);
}
function SBadge({st}){
  return(<span className={`sbg ${st==="ongoing"?"son":st==="finished"?"sfi":"sup"}`}>
    {st==="ongoing"&&<><span/>En cours</>}{st==="finished"&&"Terminé"}{st==="upcoming"&&"À venir"}
  </span>);
}

// ═══ PAGE ACCUEIL ═════════════════════════════════════════════════
function Home({fav,setFav}){
  const gp=nxtGP(),ns=nxtSess(gp),ord=sessOrd(gp),st=gpSt(gp);
  const done=CAL.filter(g=>gpSt(g)==="finished").length;
  const lead=DRIVERS[0], second=DRIVERS[1];
  return(<div className="fade">
    <div className="hero">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div className="hlbl">{st==="ongoing"?"EN COURS":"Prochain Grand Prix"}</div>
          <h1 className="htitle">{gp.name}</h1>
          <div className="hsub">{gp.circuit} · {gp.city}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <span className="chip">{fmtFull(gp.sessions.race)}</span>
            {gp.hasSprint&&<span className="chip chip-sp">🏃 Sprint</span>}
          </div>
        </div>
        <span style={{fontSize:"2rem",marginLeft:7}}><Flag f={gp.flag}/></span>
      </div>
      {ns&&<div style={{marginTop:12}}><Cd target={ns.t} label={`${S_LBL[ns.k]||ns.k} — ${fmtD(ns.t)} ${fmtT(ns.t)}`}/></div>}
    </div>
    <div style={{marginBottom:14}}>
      <div className="ptitle">Sessions du weekend</div>
      <div className="card" style={{padding:"5px 3px"}}>
        {ord.map(k=><SRow key={k} k={k} time={gp.sessions[k]} isNext={ns?.k===k}/>)}
      </div>
    </div>
    <div style={{marginBottom:14}}>
      <div className="ptitle">Saison {new Date().getFullYear()}</div>
      <div className="g2">
        {[
          {l:"Leader",v:lead?`${lead.short} — ${lead.pts} pts`:"—"},
          {l:"Avance",v:lead&&second?`+${lead.pts-second.pts} pts sur ${second.short}`:"—"},
          {l:"GP disputés",v:`${done} / ${CAL.length}`},
          {l:"Prochaine course",v:`${gp.name.replace(" GP","")} · ${fmtFull(gp.sessions.race)}`},
        ].map(({l,v})=>(<div key={l} className="sc"><div className="sl2">{l}</div><div className="sv" style={{fontSize:".78rem"}}>{v}</div></div>))}
      </div>
    </div>
    {DRIVERS.length>0&&(
    <div style={{marginBottom:14}}>
      <div className="ptitle">Mon Pilote ⭐</div>
      <div className="card">
        {DRIVERS.slice(0,8).map(d=>{
          const isFav=fav===d.short;
          return(<div key={d.short} className="strow" style={{cursor:"pointer",background:isFav?"rgba(232,0,45,.07)":""}} onClick={()=>setFav(isFav?null:d.short)}>
            <span className="favstar" style={{color:isFav?"var(--y)":"var(--g2)"}}>{isFav?"★":"☆"}</span>
            <div className="tb" style={{background:d.color}}/>
            <div className="di" style={{flex:1}}><div className="dn"><Flag f={d.flag}/> {d.name}</div><div className="dt">{d.team}</div></div>
            <div><div className="dp">{d.pts}</div><span className="dl">PTS</span></div>
          </div>);
        })}
      </div>
    </div>)}
    <div className="note">Données Jolpica-F1 · mise à jour automatique · Heures en fuseau local</div>
  </div>);
}

// ═══ PAGE CALENDRIER ══════════════════════════════════════════════
function Calendar({onGP}){
  const sprints=CAL.filter(g=>g.hasSprint);
  return(<div className="fade">
    <div className="ptitle">Calendrier F1 {new Date().getFullYear()} — {CAL.length} GP</div>
    {sprints.length>0&&(
      <div className="ibox">🏃 {sprints.length} weekends Sprint : {sprints.map(g=>g.name.replace(" GP","")).join(", ")}</div>
    )}
    {CAL.map(gp=>{
      const st=gpSt(gp);
      return(<div key={gp.round} className={`gpc ${st}`} onClick={()=>onGP(gp)}>
        <div className="gpci">
          <span className="rnum">R{gp.round}</span>
          <span style={{fontSize:"1.2rem"}}><Flag f={gp.flag}/></span>
          <div className="gi">
            <div className="gn">{gp.name}</div>
            <div className="gc">{gp.circuit} · {gp.city}</div>
            {gp.hasSprint&&<span className="chip chip-sp" style={{fontSize:".54rem",marginTop:3}}>🏃 Sprint</span>}
          </div>
          <div style={{textAlign:"right",marginRight:5}}>
            <div className="gdate">{fmtFull(gp.sessions.race)}</div>
            <SBadge st={st}/>
          </div>
          <Ic n="chev" s={13}/>
        </div>
      </div>);
    })}
  </div>);
}

// ═══ PAGE CLASSEMENTS ═════════════════════════════════════════════
function Standings(){
  const [tab,setTab]=useState("d");
  const maxD=DRIVERS[0]?.pts||1, maxC=CONSTRUCTORS[0]?.pts||1;
  const lastRound=RESULTS.length?Math.max(...RESULTS.map(r=>r.round)):0;
  const lead=DRIVERS[0], second=DRIVERS[1];
  const cLead=CONSTRUCTORS[0], cSecond=CONSTRUCTORS[1];
  return(<div className="fade">
    <div className="ptitle">Classements {new Date().getFullYear()} {lastRound>0&&<span className="b26" style={{marginLeft:4}}>APRÈS R{lastRound}</span>}</div>
    <div className="tabs">
      <button className={`tab${tab==="d"?" on":""}`} onClick={()=>setTab("d")}>Pilotes</button>
      <button className={`tab${tab==="c"?" on":""}`} onClick={()=>setTab("c")}>Constructeurs</button>
    </div>
    {DRIVERS.length===0&&<div className="empty"><div className="eico">⏳</div><p>Pas encore de classement</p></div>}
    {DRIVERS.length>0&&(tab==="d"?(
      <div className="card">
        {DRIVERS.map(d=>(<div key={d.short} className="strow">
          <span className={`pn${d.pos<=3?" t3":""}`}>{d.pos}</span>
          <div className="tb" style={{background:d.color}}/>
          <div className="di" style={{flex:1}}>
            <div className="dn"><Flag f={d.flag}/> {d.name}</div>
            <div className="dt">{d.team} · {d.wins} victoire{d.wins!==1?"s":""}</div>
            <div className="pbar"><div className="pfill" style={{width:`${(d.pts/maxD)*100}%`,background:d.color}}/></div>
          </div>
          <div style={{textAlign:"right",marginLeft:8}}><div className="dp">{d.pts}</div><span className="dl">PTS</span></div>
        </div>))}
      </div>
    ):(
      <div className="card">
        {CONSTRUCTORS.map(c=>(<div key={c.name} className="strow">
          <span className={`pn${c.pos<=3?" t3":""}`}>{c.pos}</span>
          <div className="tb" style={{background:c.color}}/>
          <div className="di" style={{flex:1}}>
          <div className="dn"><TeamLogo id={c.id} name={c.name} color={c.color}/> {c.name}</div>
            <div className="dt">{c.wins} victoire{c.wins!==1?"s":""}</div>
            <div className="pbar"><div className="pfill" style={{width:`${(c.pts/maxC)*100}%`,background:c.color}}/></div>
          </div>
          <div style={{textAlign:"right",marginLeft:8}}><div className="dp">{c.pts}</div><span className="dl">PTS</span></div>
        </div>))}
      </div>
    ))}
    {lead&&second&&cLead&&cSecond&&(
      <div className="note">{lead.short} mène {second.short} de {lead.pts-second.pts} pts · {cLead.name} devant {cSecond.name} de {cLead.pts-cSecond.pts} pts</div>
    )}
  </div>);
}

// ═══ PAGE RÉSULTATS (courses + sprints séparés) ════════════════════
function Results(){
  const [open,setOpen]=useState(null);
  const [filter,setFilter]=useState("all");
  const filtered=RESULTS.filter(r=>filter==="all"||r.type===filter);
  const lastRound=RESULTS.length?Math.max(...RESULTS.map(r=>r.round)):0;

  return(<div className="fade">
    <div className="ptitle">Résultats {new Date().getFullYear()} {lastRound>0&&<span className="b26" style={{marginLeft:4}}>R1 → R{lastRound}</span>}</div>
    <div className="tabs">
      <button className={`tab${filter==="all"?" on":""}`} onClick={()=>setFilter("all")}>Tout</button>
      <button className={`tab${filter==="race"?" on":""}`} onClick={()=>setFilter("race")}>Courses</button>
      <button className={`tab${filter==="sprint"?" on":""}`} onClick={()=>setFilter("sprint")}>Sprints</button>
    </div>
    {filtered.length===0&&<div className="empty"><div className="eico">⏳</div><p>Aucun résultat pour le moment</p></div>}
    {filtered.map(r=>{
      const key=`${r.round}-${r.type}`;
      const isOpen=open===key;
      const isSprint=r.type==="sprint";
      return(<div key={key} className="card" style={{marginBottom:9}}>
        <div style={{padding:"11px 13px",borderBottom:isOpen?"1px solid var(--bd)":"none",cursor:"pointer"}} onClick={()=>setOpen(isOpen?null:key)}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <div style={{fontFamily:"Orbitron",fontSize:".52rem",color:"var(--red)",fontWeight:700,letterSpacing:".13em"}}>R{r.round}</div>
                {isSprint?<span className="bspr">SPRINT</span>:<span className="b26">COURSE</span>}
              </div>
              <div style={{fontWeight:700,fontSize:".92rem"}}><Flag f={r.flag}/> {r.name}</div>
              <div style={{fontSize:".7rem",color:"var(--g)"}}>{r.date}</div>
            </div>
            <div style={{textAlign:"right"}}>
              {r.top[0]&&<div style={{fontSize:".82rem",fontWeight:700}}>🥇 {r.top[0].drv} <span style={{color:"var(--g)",fontWeight:400}}>· {r.top[0].team}</span></div>}
              <div style={{fontSize:".58rem",color:"var(--g)",marginTop:3}}>{isOpen?"▲ Fermer":"▼ Résultats"}</div>
            </div>
          </div>
        </div>
        {isOpen&&(<>
          {r.top.map(p=>(<div key={p.pos} className="rrow">
            <span className={`rpos${p.pos<=3?` p${p.pos}`:""}`}>{p.pos<=3?["🥇","🥈","🥉"][p.pos-1]:p.pos}</span>
            <div style={{width:3,height:24,borderRadius:2,background:p.color,flexShrink:0}}/>
            <div style={{flex:1}}><div className="rdv"><Flag f={p.flag}/> {p.drv} · {p.name.split(" ").pop()}</div><div className="rtm">{p.team}</div></div>
            <span className="rgp">{p.gap}</span>
            <span className="rpt">{p.pts>0?`+${p.pts}`:"—"}</span>
          </div>))}
          {!isSprint&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,padding:"9px 12px"}}>
              <div style={{background:"var(--bg4)",borderRadius:7,padding:"8px 10px"}}><div style={{fontSize:".6rem",color:"var(--g)",marginBottom:2}}>🏆 Pole</div><div style={{fontWeight:700,fontSize:".82rem"}}>{r.pole}</div></div>
              <div style={{background:"var(--bg4)",borderRadius:7,padding:"8px 10px"}}><div style={{fontSize:".6rem",color:"var(--g)",marginBottom:2}}>⚡ Meilleur Tour</div><div style={{fontWeight:700,fontSize:".82rem"}}>{r.fast}</div></div>
            </div>
          )}
          {r.dnf&&r.dnf.length>0&&(
            <div style={{padding:"6px 13px 10px",fontSize:".68rem",color:"var(--g2)"}}>
              DNF : {r.dnf.join(" · ")}
            </div>
          )}
        </>)}
      </div>);
    })}
    <div className="note">Courses et Sprints séparés · Filtrer par type ci-dessus</div>
  </div>);
}

// ═══ PAGE ALERTES ═════════════════════════════════════════════════
function Alerts(){
  const [h1,setH1]=useState(true);const [m15,setM15]=useState(true);const [push,setPush]=useState(false);
  const gp=nxtGP(),ns=nxtSess(gp);
  const activate=async()=>{
    if(!("Notification" in window)){alert("Non supporté.");return;}
    const p=await Notification.requestPermission();
    if(p==="granted"){setPush(true);new Notification("F1 Tracker 🏁",{body:`Alertes activées ! Prochain GP : ${gp.name}, ${fmtFull(gp.sessions.race)}.`});}
    else alert("Permission refusée — activez les notifications dans les réglages du navigateur.");
  };
  return(<div className="fade">
    <div className="ptitle">Alertes & Notifications</div>
    {ns&&(<div style={{marginBottom:14}}>
      <div className="ptitle" style={{fontSize:".76rem"}}>Prochaine alerte</div>
      <div className="card" style={{padding:"12px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"1.4rem"}}><Flag f={gp.flag}/></span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:".9rem"}}>{gp.name}</div>
            <div style={{fontSize:".76rem",color:"var(--g)"}}>{S_LBL[ns.k]||ns.k} · {fmtD(ns.t)} à {fmtT(ns.t)}</div>
          </div>
          <SBadge st="upcoming"/>
        </div>
      </div>
    </div>)}
    <div style={{marginBottom:13}}>
      <div style={{fontFamily:"Orbitron",fontSize:".56rem",color:"var(--red)",fontWeight:700,letterSpacing:".15em",marginBottom:7}}>RAPPELS SESSION</div>
      <div className="card">
        {[{l:"1 heure avant",s:"Alerte 60 min avant chaque session",v:h1,set:setH1},{l:"15 minutes avant",s:"Rappel rapide avant le départ",v:m15,set:setM15}].map(x=>(
          <div key={x.l} className="trow">
            <div><div className="tl">{x.l}</div><div className="ts">{x.s}</div></div>
            <label className="tg"><input type="checkbox" checked={x.v} onChange={e=>x.set(e.target.checked)}/><span className="tsl"/></label>
          </div>
        ))}
      </div>
    </div>
    <div style={{marginBottom:13}}>
      <div style={{fontFamily:"Orbitron",fontSize:".56rem",color:"var(--red)",fontWeight:700,letterSpacing:".15em",marginBottom:7}}>PUSH PWA</div>
      <div className="card"><div className="trow">
        <div><div className="tl">Notifications Push</div><div className="ts">{push?"✅ Activées":"Activer les alertes système"}</div></div>
        <button onClick={activate} style={{background:push?"var(--gr)":"var(--red)",border:"none",borderRadius:7,color:"#fff",fontFamily:"Rajdhani",fontWeight:700,padding:"6px 13px",cursor:"pointer",fontSize:".78rem",flexShrink:0}}>{push?"Actif ✓":"Activer"}</button>
      </div></div>
    </div>
    <div style={{marginBottom:13}}>
      <div style={{fontFamily:"Orbitron",fontSize:".56rem",color:"var(--red)",fontWeight:700,letterSpacing:".15em",marginBottom:7}}>PROCHAINES SESSIONS</div>
      <div className="card" style={{padding:"5px 3px"}}>
        {CAL.filter(g=>gpSt(g)!=="finished").slice(0,4).map(g=>{
          const n=nxtSess(g); if(!n) return null;
          return(<div key={g.round} className="sr">
            <span className="sk">{S_SHT[n.k]||n.k}</span>
            <span className="sn"><Flag f={g.flag}/> {g.name}</span>
            <span className="st"><strong>{fmtT(n.t)}</strong>{fmtD(n.t)}</span>
          </div>);
        })}
      </div>
    </div>
    <div className="card" style={{padding:12,background:"rgba(232,0,45,.04)",borderColor:"rgba(232,0,45,.14)"}}>
      <div style={{fontSize:".76rem",color:"var(--g)",lineHeight:1.55}}>ℹ️ Heures converties dans votre fuseau horaire local. Les rappels programmés viendront dans une prochaine version.</div>
    </div>
  </div>);
}

// ═══ PAGE DÉTAIL GP ════════════════════════════════════════════════
function Detail({gp,onBack}){
  const [tab,setTab]=useState("sessions");
  const st=gpSt(gp),ns=nxtSess(gp),ord=sessOrd(gp);
  const gpResults=RESULTS.filter(r=>r.round===gp.round);
  const hasRes=gpResults.length>0;
  return(<div className="slide">
    <button className="back" onClick={onBack}><Ic n="back" s={15}/> Calendrier</button>
    <div style={{background:"linear-gradient(135deg,#120408,#0d0d12)",border:"1px solid rgba(232,0,45,.22)",borderRadius:15,padding:17,marginBottom:11,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-40,right:-20,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,0,45,.1) 0%,transparent 70%)"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontFamily:"Orbitron",fontSize:".52rem",color:"var(--red)",fontWeight:700,letterSpacing:".16em",marginBottom:4}}>ROUND {gp.round} · {new Date(gp.sessions.race).getFullYear()}</div>
          <div style={{fontFamily:"Orbitron",fontSize:"1rem",fontWeight:900,lineHeight:1.15}}>{gp.name}</div>
          <div style={{fontSize:".78rem",color:"var(--g)",marginTop:3}}>{gp.circuit}</div>
          <div style={{fontSize:".76rem",color:"var(--g)",marginTop:1}}>{gp.city}, {gp.country}</div>
        </div>
        <span style={{fontSize:"2.3rem"}}><Flag f={gp.flag}/></span>
      </div>
      <div style={{marginTop:9,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
        <SBadge st={st}/>
        {gp.hasSprint&&<span className="chip chip-sp">🏃 Sprint</span>}
        <span className="chip">🏎 {fmtFull(gp.sessions.race)}</span>
      </div>
      {ns&&st==="upcoming"&&<div style={{marginTop:12}}><Cd target={ns.t} label={`${S_LBL[ns.k]||ns.k} · ${fmtD(ns.t)} ${fmtT(ns.t)}`}/></div>}
    </div>
    <div className="tabs">
      <button className={`tab${tab==="sessions"?" on":""}`} onClick={()=>setTab("sessions")}>Sessions</button>
      {hasRes&&<button className={`tab${tab==="results"?" on":""}`} onClick={()=>setTab("results")}>Résultats</button>}
    </div>
    {tab==="sessions"||!hasRes?(
      <div className="card" style={{padding:"5px 3px"}}>{ord.map(k=><SRow key={k} k={k} time={gp.sessions[k]} isNext={ns?.k===k}/>)}</div>
    ):(
      <div>
        {gpResults.map(r=>(
          <div key={`${r.round}-${r.type}`} style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
              {r.type==="sprint"?<span className="bspr">SPRINT</span>:<span className="b26">COURSE</span>}
              <span style={{fontSize:".72rem",color:"var(--g)"}}>{r.date}</span>
            </div>
            <div className="card">
              {r.top.map(p=>(<div key={p.pos} className="rrow">
                <span className={`rpos${p.pos<=3?` p${p.pos}`:""}`}>{p.pos<=3?["🥇","🥈","🥉"][p.pos-1]:p.pos}</span>
                <div style={{width:3,height:24,borderRadius:2,background:p.color,flexShrink:0}}/>
                <div style={{flex:1}}><div className="rdv"><Flag f={p.flag}/> {p.drv} · {p.name.split(" ").pop()}</div><div className="rtm">{p.team}</div></div>
                <span className="rgp">{p.gap}</span>
                <span className="rpt">{p.pts>0?`+${p.pts}`:"—"}</span>
              </div>))}
            </div>
            {r.type==="race"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
                <div className="sc"><div className="sl2">🏆 Pole</div><div style={{fontWeight:700,fontSize:".82rem"}}>{r.pole}</div></div>
                <div className="sc"><div className="sl2">⚡ Meilleur Tour</div><div style={{fontWeight:700,fontSize:".82rem"}}>{r.fast}</div></div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>);
}

// ═══ APP ROOT ══════════════════════════════════════════════════════
const NAV=[
  {id:"home",     ico:"home",   lbl:"Accueil"},
  {id:"calendar", ico:"cal",    lbl:"Calendrier"},
  {id:"standings",ico:"trophy", lbl:"Classement"},
  {id:"results",  ico:"flag",   lbl:"Résultats"},
  {id:"alerts",   ico:"bell",   lbl:"Alertes"},
];

export default function App(){
  const [page,setPage]=useState("home");
  const [selGP,setSelGP]=useState(null);
  const [fav,setFav]=useState(null);
  const [,setTick]=useState(0);
  const [status,setStatus]=useState("loading");

  useEffect(()=>{
    let stop=false;
    const refresh=async()=>{
      try{
        const [cal,drv,con]=await Promise.all([fetchCalendar(),fetchDrivers(),fetchConstructors()]);
        if(stop)return;
        replace(CAL,cal);replace(DRIVERS,drv);replace(CONSTRUCTORS,con);
        setTick(t=>t+1);
        const res=await fetchResults(cal);
        if(stop)return;
        replace(RESULTS,res);
        setStatus("ok");
        setTick(t=>t+1);
      }catch(e){
        console.error(e);
        if(!stop)setStatus("error");
      }
    };
    refresh();
    const id=setInterval(refresh,5*60*1000); // rafraîchit toutes les 5 min
    return()=>{stop=true;clearInterval(id);};
  },[]);

  const go=p=>{setPage(p);setSelGP(null);};
  const openGP=g=>{setSelGP(g);setPage("detail");};
  const ready=CAL.length>0;

  return(<>
    <style>{CSS}</style>
    <div className="app">
      <header className="hdr">
        <div className="logo"><div className="dot"/><span className="logo-r">F1</span><span>TRACKER</span></div>
        <span className="b26">{status==="loading"?"CHARGEMENT…":status==="error"?"HORS LIGNE":`LIVE · ${new Date().getFullYear()}`}</span>
      </header>
      <div className="scroll">
        <div className="inner">
          {!ready&&status==="loading"&&<div className="empty"><div className="eico">🏁</div><p>Chargement des données F1…</p></div>}
          {!ready&&status==="error"&&<div className="empty"><div className="eico">⚠️</div><p>Impossible de charger les données.<br/>Réessaie dans un instant.</p></div>}
          {ready&&page==="home"     &&<Home fav={fav} setFav={setFav}/>}
          {ready&&page==="calendar" &&<Calendar onGP={openGP}/>}
          {ready&&page==="standings"&&<Standings/>}
          {ready&&page==="results"  &&<Results/>}
          {ready&&page==="alerts"   &&<Alerts/>}
          {ready&&page==="detail"&&selGP&&<Detail gp={selGP} onBack={()=>go("calendar")}/>}
        </div>
      </div>
      <nav className="bnav">
        {NAV.map(({id,ico,lbl})=>(
          <button key={id} className={`nb${(page===id||(page==="detail"&&id==="calendar"))?" on":""}`} onClick={()=>go(id)}>
            <Ic n={ico} s={20}/>{lbl}
          </button>
        ))}
      </nav>
    </div>
  </>);
}
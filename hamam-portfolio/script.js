// ===== فيديوهاتك: حط الملفات في فولدر videos/ وعدّل القايمة دي =====
const REELS=[
  {src:"videos/5.mp4", title:"CCREATION"},
  {src:"videos/2.mp4", title:"WAY Agancy"},
  {src:"videos/3.mp4", title:"TOURISM"},
  {src:"videos/4.mp4", title:"CARS"},
  {src:"videos/1.mp4", title:"ُEstore"},
  {src:"videos/6.mp4", title:"SURGERY"},
  {src:"videos/7.mp4", title:"AD"},
  {src:"videos/8.mp4", title:"PHARMACY"}
];
// ==================================================================
const $=s=>document.querySelector(s);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- mobile menu ----------
const hdr=$('#hdr'),burger=$('#burger');
function setMenu(open){hdr.classList.toggle('open',open);burger.setAttribute('aria-expanded',String(open))}
burger.addEventListener('click',()=>setMenu(!hdr.classList.contains('open')));
document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('click',e=>{if(!hdr.contains(e.target))setMenu(false)});

// ---------- statement: word-by-word reveal on scroll ----------
const stmt=$('#stmt');stmt.innerHTML=stmt.textContent.trim().split(/\s+/).map(w=>`<span>${w}</span>`).join(' ');
const words=[...stmt.children];
const heroWords=document.querySelectorAll('.hero .word');
const g2=$('#ghost2');

function onScroll(){
  const y=scrollY,vw=innerWidth,vh=innerHeight;
  if(!reduceMotion){
    // horizontal VIDEO EDITOR movement on scroll (capped relative to screen width so it never overshoots on phones)
    const horizontalMove=Math.min(y*0.25,Math.min(260,vw*0.25));
    heroWords.forEach(w=>{w.style.transform=`translateX(-${horizontalMove}px)`});
    const r2=g2.parentElement.getBoundingClientRect();
    g2.style.transform=`translateX(${-(vh-r2.top)*.22}px)`;
  }
  const r=stmt.getBoundingClientRect(),p=Math.min(1,Math.max(0,(vh*.85-r.top)/(r.height+vh*.35)));
  const k=Math.round(p*words.length);
  words.forEach((w,i)=>{w.classList.toggle('on',i<k-3);w.classList.toggle('lead',i>=k-3&&i<k)});
}
let ticking=false;
addEventListener('scroll',()=>{
  if(ticking)return;ticking=true;
  requestAnimationFrame(()=>{ticking=false;onScroll()});
},{passive:true});
onScroll();

const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.15});
document.querySelectorAll('.rv').forEach(e=>io.observe(e));

// ---------- hero: big person + word sitting behind his head on phones / iPad ----------
const hero=$('.hero'),manImg=$('.man'),heroWord=$('.hero .word');

// ===== TUNING (change these numbers if you want to adjust the look) =====
const HEAD_AT=.36;          // where the word sits on the photo: 0 = top of photo, 1 = bottom (behind head/neck)
const SIZE_PORTRAIT=.70;    // person height as a share of the hero height (phone / iPad portrait)
const SIZE_LANDSCAPE=.88;   // same, for landscape screens
const CROP_PHONE=2.0;       // max person width = screen width x this (phone). Higher = bigger person, sides get cropped
const CROP_TABLET=1.5;      // same for iPad
// ========================================================================

function fitHeroWord(){
  if(innerWidth>1100){ // desktop = original CSS
    heroWord.style.fontSize='';heroWord.style.top='';
    manImg.style.width='';manImg.style.height='';manImg.style.maxWidth='';manImg.style.maxHeight='';
    return;
  }
  const vw=hero.clientWidth,vh=hero.clientHeight;
  // 1) make the person BIG: he is allowed to be wider than the screen (hero clips the sides),
  //    so on narrow phones the height is no longer limited by the width -> no empty space above him
  if(manImg.naturalWidth){
    const ratio=manImg.naturalWidth/manImg.naturalHeight;
    const share=innerWidth>innerHeight?SIZE_LANDSCAPE:SIZE_PORTRAIT;
    const maxW=vw*(innerWidth<=700?CROP_PHONE:CROP_TABLET);
    const h=Math.min(vh*share,maxW/ratio);
    manImg.style.maxWidth='none';manImg.style.maxHeight='none';
    manImg.style.height=h+'px';manImg.style.width=(h*ratio)+'px';
  }
  // 2) fit the word to the screen width
  heroWord.style.fontSize='100px';
  const rg=document.createRange();rg.selectNodeContents(heroWord);
  const tw=rg.getBoundingClientRect().width||600;
  const size=Math.max(40,Math.min(280,100*(vw*.94)/tw));
  heroWord.style.fontSize=size+'px';
  // 3) put the word behind the person's head / neck
  if(manImg.offsetHeight){
    heroWord.style.top=(manImg.offsetTop+manImg.offsetHeight*HEAD_AT-size/2)+'px';
  }else heroWord.style.top='';
}
manImg.addEventListener('load',fitHeroWord);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitHeroWord);
addEventListener('load',fitHeroWord);
fitHeroWord();

// ---------- lightbox refs (declared early, used below) ----------
const lb=$('#lb'),lbv=$('#lbv');

// ---------- reels coverflow ----------
const st=$('#stage'),dots=$('#dots'),n=REELS.length,G=["#3a0d12","#240b0e","#4a1519","#1a0b0d","#2d0f13"];
let active=0,hover=false,sx=null,inView=true;
const cards=REELS.map((r,i)=>{
  const c=document.createElement('div');c.className='card';c.dataset.i=i;c.style.background=`linear-gradient(160deg,${G[i%G.length]},#0c0c0c)`;
  c.innerHTML=`<video muted playsinline preload="metadata" src="${r.src}"></video><div class="ttl">${r.title||''}</div><div class="snd">🔇</div><button class="xbtn" aria-label="Expand video" title="Expand">⤢</button>`;
  const v=c.querySelector('video');
  v.addEventListener('error',()=>v.style.display='none');
  v.addEventListener('ended',()=>{if(!c.classList.contains('on'))return;if(hover){v.currentTime=0;v.play()}else go(1)});
  st.appendChild(c);const d=document.createElement('i');d.onclick=()=>go(i-active);dots.appendChild(d);return c;
});

// play=false  -> only re-position cards (used on resize, so videos don't restart when the mobile address bar shows/hides)
function layout(play=true){
  cards.forEach((c,i)=>{
    let d=i-active;if(d>n/2)d-=n;if(d<-n/2)d+=n;
    const ad=Math.abs(d),w=c.offsetWidth,v=c.querySelector('video');
    c.style.transform=`translate(-50%,-50%) translateX(${d*w*.74}px) translateZ(${-ad*110}px) rotateY(${-d*32}deg)`;
    c.style.opacity=ad>2?0:1;c.style.filter=ad?`saturate(.6) brightness(.55)${ad>1?' blur(2px)':''}`:'none';
    c.style.zIndex=10-ad;c.classList.toggle('on',!ad);v.preload=ad<=1?'auto':'metadata';
    if(!play)return;
    if(!ad){
      v.currentTime=0;v.muted=true;c.querySelector('.snd').textContent='🔇';
      if(inView){const p=v.play();p&&p.catch&&p.catch(()=>{})}
    }else v.pause();
  });
  [...dots.children].forEach((x,i)=>x.classList.toggle('on',i===active));
  $('#cTitle').textContent=REELS[active].title||'';
}
function go(k){active=(active+k+n)%n;layout()}

// pause the reels when the section is off-screen (saves battery / data on phones)
new IntersectionObserver(es=>{
  inView=es[0].isIntersecting;
  const v=cards[active].querySelector('video');
  if(!inView)v.pause();
  else if(!lb.classList.contains('open')){const p=v.play();p&&p.catch&&p.catch(()=>{})}
},{threshold:.2}).observe(st);

// swipe / drag / tap
st.addEventListener('pointerdown',e=>{sx=e.clientX;st.style.cursor='grabbing'});
addEventListener('pointercancel',()=>{sx=null;st.style.cursor='grab'});
addEventListener('pointerup',e=>{
  if(sx===null)return;
  if(e.target.closest&&e.target.closest('.xbtn')){sx=null;st.style.cursor='grab';return openLB(+e.target.closest('.card').dataset.i)}
  const dx=e.clientX-sx;sx=null;st.style.cursor='grab';
  if(Math.abs(dx)>40)return go(dx<0?1:-1);
  const c=e.target.closest&&e.target.closest('.card');if(!c)return;
  if(+c.dataset.i!==active)go(+c.dataset.i-active);
  else{const v=c.querySelector('video');v.muted=!v.muted;c.querySelector('.snd').textContent=v.muted?'🔇':'🔊'}
});
addEventListener('keydown',e=>{
  if(e.key==='Escape'){setMenu(false);return closeLB()}
  if(!lb.classList.contains('open')&&e.target.tagName!=='INPUT'){if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)}
});
// "hover" (loop current reel) only for real mouse pointers — touch taps must not trigger it
st.addEventListener('pointerenter',e=>{hover=e.pointerType==='mouse'});
st.addEventListener('pointerleave',()=>{hover=false});

// resize / rotate: re-position only, throttled
let rz;
addEventListener('resize',()=>{
  if(innerWidth>700)setMenu(false);
  cancelAnimationFrame(rz);rz=requestAnimationFrame(()=>{layout(false);fitHeroWord();onScroll()});
});
addEventListener('orientationchange',()=>setTimeout(()=>{layout(false);fitHeroWord()},250));
layout();

// ---------- expand (lightbox) ----------
function openLB(i){
  const cv=cards[i].querySelector('video');if(!cv||cv.style.display==='none')return;
  cv.pause();lbv.src=cv.currentSrc||cv.src;lbv.currentTime=cv.currentTime;lbv.muted=false;
  lb.classList.add('open');const p=lbv.play();p&&p.catch&&p.catch(()=>{});
}
function closeLB(){
  if(!lb.classList.contains('open'))return;
  lbv.pause();lbv.removeAttribute('src');lbv.load();lb.classList.remove('open');
  const p=cards[active].querySelector('video').play();p&&p.catch&&p.catch(()=>{});
}
$('#lbx').onclick=closeLB;
lb.addEventListener('click',e=>{if(e.target===lb)closeLB()});
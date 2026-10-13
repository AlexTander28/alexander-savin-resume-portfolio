'use strict';
const mockupMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const mockupHoverPreference=matchMedia('(hover: hover) and (pointer: fine)');
const mockupPlayers=new Set();
let activeMockupPlayer=null;
function pauseMockupPreviews(){mockupPlayers.forEach(player=>player.pause());}
function createScrollingMockup(item){
 const viewer=document.createElement('div');viewer.className='mockup-viewer';
 const frame=document.createElement('div');frame.className='mockup-window';frame.id='scroll-'+item.id;
 const image=document.createElement('img');image.src=item.thumb;image.width=item.width;image.height=item.height;image.alt=item.title+' — полный макет сайта';image.loading='lazy';image.decoding='async';frame.append(image);
 const toolbar=document.createElement('div');toolbar.className='mockup-toolbar';
 const button=document.createElement('button');button.type='button';button.className='mockup-play';button.setAttribute('aria-controls',frame.id);button.setAttribute('aria-label','Прокрутить макет: '+item.title);
 const original=document.createElement('a');original.href=item.url;original.target='_blank';original.rel='noopener noreferrer';original.textContent='Оригинал ↗';original.setAttribute('aria-label','Открыть оригинал: '+item.title);toolbar.append(button,original);viewer.append(frame,toolbar);
 let animation=null,ready=false,loading=null,wanted=false,lastWidth=0,manual=false;
 const manualMode=()=>mockupMotionPreference.matches||typeof image.animate!=='function';
 const label=()=>{button.textContent=manual?'К началу ↑':manualMode()?'Просмотреть вручную ↓':animation?.playState==='running'?'Пауза Ⅱ':animation?.playState==='finished'?'Повторить ↻':animation?.playState==='paused'?'Продолжить ↓':'Прокрутить сайт ↓';button.setAttribute('aria-pressed',String(animation?.playState==='running'));};
 const pause=()=>{wanted=false;if(animation?.playState==='running')animation.pause();label();};
 const player={pause};mockupPlayers.add(player);
 async function load(){
  if(ready)return;
  if(!loading){button.disabled=true;button.textContent='Загружаю макет…';frame.setAttribute('aria-busy','true');loading=(async()=>{const full=new Image();full.src=item.scrollSrc;await full.decode();image.src=item.scrollSrc;image.width=item.scrollWidth;image.height=item.scrollHeight;await image.decode();ready=true;})().catch(error=>{loading=null;throw error;}).finally(()=>{button.disabled=false;frame.removeAttribute('aria-busy');label();});}
  await loading;
 }
 async function play(){
  wanted=true;
  try{await load();}catch{wanted=false;button.textContent='Повторить загрузку ↻';return;}
  if(!wanted||!viewer.isConnected||document.hidden)return;
  if(manualMode()){animation?.cancel();animation=null;manual=true;frame.classList.add('mockup-manual');frame.tabIndex=0;frame.setAttribute('role','region');frame.setAttribute('aria-label','Полный макет '+item.title+' — прокрутите внутри');frame.scrollTop=0;label();return;}
  if(activeMockupPlayer&&activeMockupPlayer!==player)activeMockupPlayer.pause();activeMockupPlayer=player;
  const distance=Math.max(0,frame.clientWidth*item.scrollHeight/item.scrollWidth-frame.clientHeight);
  if(distance<1){label();return;}
  if(!animation||animation.playState==='finished'){
   animation?.cancel();animation=image.animate([{transform:'translateY(0)',offset:0},{transform:'translateY(0)',offset:.04},{transform:'translateY(-'+distance+'px)',offset:.96},{transform:'translateY(-'+distance+'px)',offset:1}],{duration:Math.max(8000,Math.min(60000,distance/55*1000)),easing:'linear',fill:'forwards'});animation.onfinish=()=>{wanted=false;label();};
  }else animation.play();label();
 }
 button.addEventListener('click',()=>{if(manual){frame.scrollTop=0;return;}if(animation?.playState==='running')pause();else play();});
 frame.addEventListener('pointerenter',()=>{if(mockupHoverPreference.matches&&!manualMode())play();});
 frame.addEventListener('pointerleave',()=>{if(mockupHoverPreference.matches)pause();});
 const observer=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)pause();},{threshold:0});observer.observe(frame);
 new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(lastWidth&&Math.abs(lastWidth-width)>1){pause();animation?.cancel();animation=null;label();}lastWidth=width;}).observe(frame);
 mockupMotionPreference.addEventListener('change',()=>{pause();animation?.cancel();animation=null;manual=false;frame.classList.remove('mockup-manual');frame.removeAttribute('tabindex');frame.removeAttribute('role');frame.removeAttribute('aria-label');frame.scrollTop=0;label();});
 label();return viewer;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseMockupPreviews();});

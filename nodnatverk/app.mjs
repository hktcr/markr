import {FLOWS,POINTS,EDGES,project,layout,focusCamera,searchFlows,active} from './model.mjs';
export function createApp(doc=globalThis.document,win=globalThis.window){
 const $=id=>doc.getElementById(id),canvas=$('graph'),stage=doc.querySelector('.network'),ctx=canvas.getContext('2d'),buttons=[],rows=[];
 let yaw=-.18,pitch=.18,zoom=1,width=0,height=0,selected=0,filtered=false,drag=null,suppressClickUntil=0,boxes=[],matches=[],optionIndex=-1,copyEpoch=0;
 const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)');
 const node=f=>{const b=doc.createElement('button');b.type='button';b.style.setProperty('--node-color',f.color);const icon=doc.createElement('span');icon.className='symbol';icon.textContent=f.symbol;icon.setAttribute('aria-hidden','true');const label=doc.createElement('span');label.className='node-label';label.textContent=f.label;b.append(icon,label);return b;};
 FLOWS.forEach((f,i)=>{const b=node(f);b.className='node';b.id='node-'+f.id;b.setAttribute('aria-controls','detail');b.onclick=()=>choose(i,true);$('nodes').append(b);buttons.push(b);const li=doc.createElement('li'),r=node(f);r.className='list-node';r.id='list-'+f.id;r.setAttribute('aria-controls','detail');r.onclick=()=>choose(i,true);li.append(r);$('list').append(li);rows.push(r);});
 function announce(text){$('selection-status').textContent=text;}
 function renderExamples(){copyEpoch++;$('copy-status').textContent='';$('copy-fallback').hidden=true;$('copy-text').value='';$('example-list').replaceChildren();const f=FLOWS[selected];for(const e of f.examples){const li=doc.createElement('li'),body=doc.createElement('div'),title=doc.createElement('strong'),code=doc.createElement('code'),state=doc.createElement('span'),b=doc.createElement('button');title.textContent=e[1];code.textContent=e[0];state.textContent=e[2];state.className='example-state';body.append(title,code);b.textContent='Kopiera';b.setAttribute('aria-label','Kopiera '+e[0]);b.onclick=()=>copy([e[0]]);li.append(body,state,b);$('example-list').append(li);}}
 async function copy(ids){const epoch=++copyEpoch;const text=ids.join('\n');try{if(!win.navigator.clipboard?.writeText)throw Error('unavailable');await win.navigator.clipboard.writeText(text);if(epoch!==copyEpoch)return;$('copy-status').textContent=ids.length===1?'Exempel-ID kopierat.':'Alla exempel-ID:n för valt flöde är kopierade.';$('copy-fallback').hidden=true;}catch{if(epoch!==copyEpoch)return;$('copy-status').textContent='Automatisk kopiering gick inte. Texten kan kopieras manuellt.';$('copy-fallback').hidden=false;$('copy-text').value=text;$('copy-text').focus();$('copy-text').select();}}
 $('copy-all').onclick=()=>copy(FLOWS[selected].examples.map(e=>e[0]));
 function choose(i,focus=false){selected=i;const f=FLOWS[i];$('detail-title').textContent=f.label;$('detail-description').textContent=f.description;$('detail-icon').textContent=f.symbol;$('detail').style.setProperty('--selected-color',f.color);buttons.forEach((b,j)=>{b.setAttribute('aria-pressed',String(j===i));b.classList.toggle('dim',filtered&&!active(FLOWS[j]));rows[j].setAttribute('aria-pressed',String(j===i));rows[j].classList.toggle('dim',filtered&&!active(FLOWS[j]));});renderExamples();if(focus){({yaw,pitch,zoom}=focusCamera(i));announce('Valt flöde: '+f.label+'. '+f.description+' Detaljer och påhittade exempel finns efter kartan.');}draw();}
 function draw(){if(!width)return;const ps=POINTS.map(p=>project(p,yaw,pitch,zoom,width,height));boxes=layout(ps,width,height);for(const b of boxes){const el=buttons[b.i];el.style.left=b.x+'px';el.style.top=b.y+'px';el.style.width=b.width+'px';el.style.height=b.height+'px';el.style.setProperty('--depth',String(Math.max(.5,1-ps[b.i].depth*.15)));}if(!ctx)return;ctx.clearRect(0,0,width,height);ctx.lineWidth=1;
  // Stationary guide rings reveal rotation; no activity animation or automatic drift.
  for(const axis of [0,1,2]){ctx.beginPath();for(let j=0;j<=64;j++){const a=j*Math.PI/32,r=1.08,v=axis===0?[Math.cos(a)*r,Math.sin(a)*r,0]:axis===1?[Math.cos(a)*r,0,Math.sin(a)*r]:[0,Math.cos(a)*r,Math.sin(a)*r];const p=project(v,yaw,pitch,zoom,width,height);if(j===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}ctx.strokeStyle='rgba(197,160,89,.09)';ctx.stroke();}
  const anchor=b=>width<600?{x:b.x+b.width/2,y:b.y+22}:{x:b.x+28,y:b.y+b.height/2};
  for(const [a,b]of EDGES){const p=anchor(boxes[a]),q=anchor(boxes[b]),chosen=a===selected||b===selected;ctx.strokeStyle=chosen?'rgba(220,192,138,.49)':'rgba(197,160,89,.17)';ctx.lineWidth=chosen?1.4:1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
 }
 function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;stage.classList.toggle('compact',width<600);const d=Math.min(win.devicePixelRatio||1,2);canvas.width=width*d;canvas.height=height*d;ctx?.setTransform(d,0,0,d,0,0);draw();}
 const ro=win.ResizeObserver?new win.ResizeObserver(resize):null;ro?.observe(canvas);win.addEventListener('resize',resize);
 const rotate=(dy,dp=0)=>{yaw+=dy;pitch=Math.max(-1.2,Math.min(1.2,pitch+dp));draw();};
 const zoomBy=d=>{zoom=Math.max(.65,Math.min(1.4,zoom+d));draw();};
 $('zoom-in').onclick=()=>zoomBy(.1);$('zoom-out').onclick=()=>zoomBy(-.1);$('rotate-left').onclick=()=>rotate(-.2);$('rotate-right').onclick=()=>rotate(.2);$('reset').onclick=()=>{yaw=-.18;pitch=.18;zoom=1;draw();};
 // Plain vertical scrolling is never intercepted. Ctrl/Meta + wheel is optional map zoom.
 canvas.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();zoomBy(e.deltaY<0?.06:-.06);},{passive:false});
 function endDrag(e){
  if(!drag||drag.id!==e.pointerId)return;
  const id=drag.id;if(drag.mode!=='pending')suppressClickUntil=Date.now()+350;
  drag=null;if(stage.hasPointerCapture?.(id))stage.releasePointerCapture(id);
 }
 stage.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.isPrimary===false||e.target.closest('.view-controls'))return;
  drag={id:e.pointerId,type:e.pointerType,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,mode:'pending'};
 });
 stage.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;
  if(drag.type==='mouse'&&e.buttons===0){endDrag(e);return;}
  const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
  if(drag.mode==='pending'){
   if(Math.hypot(dx,dy)<9)return;
   if(drag.type==='touch'&&Math.abs(dy)>Math.abs(dx)){drag.mode='scroll';return;}
   drag.mode='rotate';stage.setPointerCapture?.(e.pointerId);
  }
  if(drag.mode!=='rotate')return;
  rotate((e.clientX-drag.x)*.008,drag.type==='touch'?0:(e.clientY-drag.y)*.008);
  drag.x=e.clientX;drag.y=e.clientY;
 });
 // Capture may transfer from a touched child to the stage. Losing the CHILD's
 // implicit capture is not the end of the stage's drag.
 stage.addEventListener('lostpointercapture',e=>{if(e.target===stage)endDrag(e);});
 win.addEventListener('pointerup',endDrag);win.addEventListener('pointercancel',endDrag);
 stage.addEventListener('click',e=>{if(e.detail>0&&Date.now()<suppressClickUntil){e.preventDefault();e.stopPropagation();}},{capture:true});
 canvas.onkeydown=e=>{const map={ArrowLeft:[-.13,0],ArrowRight:[.13,0],ArrowUp:[0,-.13],ArrowDown:[0,.13]};if(map[e.key]){e.preventDefault();rotate(...map[e.key]);}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')$('reset').click();else zoomBy(e.key==='-'?-.1:.1);}};
 buttons.forEach((b,i)=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?7:(i+(['ArrowLeft','ArrowUp'].includes(e.key)?7:1))%8;buttons[next].focus();}));
 function closeSearch(){ $('search-results').hidden=true;$('search').setAttribute('aria-expanded','false');$('search').removeAttribute('aria-activedescendant');optionIndex=-1; }
 function markOption(){const els=$('search-results').children;for(let i=0;i<els.length;i++)els[i].setAttribute('aria-selected',String(i===optionIndex));if(optionIndex>=0){$('search').setAttribute('aria-activedescendant',els[optionIndex].id);els[optionIndex].scrollIntoView?.({block:'nearest'});}else $('search').removeAttribute('aria-activedescendant');}
 function pick(f){choose(FLOWS.indexOf(f),true);$('search-status').textContent='Fokus: '+f.label+'.';closeSearch();}
 function search(open=true){matches=searchFlows($('search').value,filtered);$('search-results').replaceChildren();for(const f of matches){const li=doc.createElement('li');li.id='result-'+f.id;li.setAttribute('role','option');li.setAttribute('aria-selected','false');const name=doc.createElement('strong'),description=doc.createElement('span');name.textContent=f.label;description.textContent=f.description;li.append(name,description);li.onmousedown=e=>e.preventDefault();li.onclick=()=>pick(f);$('search-results').append(li);}const show=open&&matches.length>0;$('search-results').hidden=!show;$('search').setAttribute('aria-expanded',String(show));optionIndex=show?0:-1;markOption();const q=$('search').value.trim();$('search-status').textContent=q?(matches.length?'Välj en träff med piltangenter och Enter.':'Ingen träff. Hela kartan är kvar.'):(filtered?'Aktiva exempel framhävda. Hela kartan är kvar.':'');}
 $('search').oninput=()=>search();$('search').onfocus=()=>search();$('search').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();if(!$('search-results').hidden)closeSearch();else{$('search').value='';search(false);}return;}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){if(e.key==='Home'||e.key==='End'){if($('search-results').hidden)return;}e.preventDefault();if($('search-results').hidden)search();else if(matches.length){optionIndex=e.key==='Home'?0:e.key==='End'?matches.length-1:(optionIndex+(e.key==='ArrowUp'?matches.length-1:1))%matches.length;markOption();}}};
 $('search-form').onsubmit=e=>{e.preventDefault();if(matches.length)pick(matches[Math.max(0,optionIndex)]);};$('search-form').addEventListener('focusout',e=>{if(!$('search-form').contains(e.relatedTarget))closeSearch();});
 $('filter').onclick=()=>{filtered=!filtered;$('filter').setAttribute('aria-pressed',String(filtered));choose(selected);search(doc.activeElement===$('search'));};
 const shortcut=e=>{if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(doc.activeElement?.tagName)){e.preventDefault();$('search').focus();}};doc.addEventListener('keydown',shortcut);
 choose(0);resize();return{state:()=>({yaw,pitch,zoom,selected:FLOWS[selected].id,filtered,reducedMotion:!!reduced?.matches,boxes:boxes.map(x=>({...x}))}),dispose:()=>{ro?.disconnect();win.removeEventListener('resize',resize);win.removeEventListener('pointerup',endDrag);win.removeEventListener('pointercancel',endDrag);doc.removeEventListener('keydown',shortcut);}};
}
if(typeof document!=='undefined')createApp();

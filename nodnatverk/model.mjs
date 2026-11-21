// Public, fixed system concepts. Example IDs are invented and have no resolver.
export const FLOWS = Object.freeze([
 {id:'beslut',label:'Beslut',symbol:'?',color:'#dcc08a',work:false,description:'Ställningstaganden som leder arbetet vidare.',examples:[['EXEMPEL-BESLUT-A','Ägarfråga','Aktivt exempel'],['EXEMPEL-BESLUT-B','Ställningstagande','Avslutat exempel']]},
 {id:'arbete',label:'Arbete',symbol:'›',color:'#a9c8bc',work:true,description:'Genomförande av avgränsade uppgifter.',examples:[['EXEMPEL-ARBETE-A','Arbetssteg','Aktivt exempel']]},
 {id:'nasta-steg',label:'Nästa steg',symbol:'◇',color:'#b2bfd2',work:false,description:'Förberedelser och beroenden inför fortsatt arbete.',examples:[['EXEMPEL-NASTA-A','Förberedelse','Avslutat exempel']]},
 {id:'paus',label:'Paus',symbol:'Ⅱ',color:'#c2b1bf',work:false,description:'Avsiktliga pauser och väntan på förutsättningar.',examples:[['EXEMPEL-PAUS-A','Paus','Avslutat exempel']]},
 {id:'bevakning',label:'Bevakning',symbol:'◉',color:'#a8c2cd',work:true,description:'Insamling och prövning av relevanta signaler.',examples:[['EXEMPEL-BEVAKNING-A','Notering','Aktivt exempel'],['EXEMPEL-BEVAKNING-B','Genomgång','Avslutat exempel']]},
 {id:'projekt',label:'Projekt',symbol:'◇',color:'#d2b9a5',work:true,description:'Sammanhängande arbete mot ett tydligt resultat.',examples:[['EXEMPEL-PROJEKT-A','Delmål','Aktivt exempel']]},
 {id:'dokumentation',label:'Dokumentation',symbol:'≡',color:'#c1bdd5',work:true,description:'Beslut, belägg och erfarenheter som bevaras.',examples:[['EXEMPEL-DOKUMENTATION-A','Belägg','Aktivt exempel'],['EXEMPEL-DOKUMENTATION-B','Erfarenhet','Avslutat exempel']]},
 {id:'resultat',label:'Resultat',symbol:'✓',color:'#c4caa9',work:false,description:'Leveranser som går att kontrollera och använda.',examples:[['EXEMPEL-RESULTAT-A','Leverans','Avslutat exempel']]}
].map(f=>Object.freeze({...f,examples:Object.freeze(f.examples.map(e=>Object.freeze(e)))})));
export const POINTS=Object.freeze(FLOWS.map((_,i)=>{const a=i*Math.PI/4-.5;return Object.freeze([Math.cos(a)*1.1,Math.sin(a)*.86,Math.sin(a*2)*.65]);}));
export const EDGES=Object.freeze([[0,1],[0,5],[0,6],[1,2],[1,5],[1,7],[2,3],[2,5],[3,4],[4,5],[4,6],[5,6],[6,7]]);
export const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('sv');
export const active=f=>f.examples.some(e=>e[2]==='Aktivt exempel');
export function searchFlows(query,onlyActive=false){const words=fold(query).trim().split(/\s+/).filter(Boolean);return FLOWS.filter(f=>(!onlyActive||active(f))&&words.every(w=>fold(f.label+' '+f.description).includes(w)));}
export function project([x,y,z],yaw,pitch,zoom,width,height){const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw),c=y*Math.cos(pitch)-b*Math.sin(pitch),d=y*Math.sin(pitch)+b*Math.cos(pitch),s=zoom*Math.min(width*.34,height*.32)*3/(3+d);return{x:width/2+a*s,y:(height-64)/2+c*s,depth:d};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function overlaps(a,b,gap=8){return a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;}
export function layout(points,width,height){
 const compact=width<600,pad=12,top=40,bottom=72,w=compact?Math.min(150,(width-36)/2):174,h=compact?76:60;
 const boxes=points.map((p,i)=>({i,x:clamp(p.x-w/2,pad,width-pad-w),y:clamp(p.y-h/2,top,height-bottom-h),width:w,height:h}));
 for(let pass=0;pass<160;pass++){
  let hit=false;
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j];if(!overlaps(a,b,12))continue;hit=true;
   const dx=(a.x+a.width/2)-(b.x+b.width/2),dy=(a.y+a.height/2)-(b.y+b.height/2);
   const ox=w+12-Math.abs(dx),oy=h+12-Math.abs(dy);
   if(ox<oy){const n=(Math.sign(dx)|| (i%2?1:-1))*(ox/2+.1);a.x+=n;b.x-=n;}
   else{const n=(Math.sign(dy)|| (i<j?-1:1))*(oy/2+.1);a.y+=n;b.y-=n;}
  }
  for(const b of boxes){b.x=clamp(b.x,pad,width-pad-w);b.y=clamp(b.y,top,height-bottom-h);}
  if(!hit)return boxes;
 }
 // Deterministic rail fallback for extreme projection collisions and small screens.
 const ordered=points.map((p,i)=>({...p,i})).sort((a,b)=>a.x-b.x||a.i-b.i);
 for(let side=0;side<2;side++){
  const group=ordered.slice(side*4,side*4+4).sort((a,b)=>a.y-b.y||a.i-b.i);
  group.forEach((p,j)=>{const b=boxes[p.i];b.x=side?width-pad-w:pad;b.y=top+j*(height-bottom-top-h)/3;});
 }
 return boxes;
}
export function focusCamera(index){const [x,y,z]=POINTS[index];return{yaw:Math.atan2(x,-z),pitch:-Math.atan2(y,Math.hypot(x,z)),zoom:1.08};}

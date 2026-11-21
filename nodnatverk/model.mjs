export const FLOWS = Object.freeze([
 {label:'Beslut',symbol:'?',color:'#dcc08a',work:false,description:'Ställningstaganden som leder arbetet vidare.'},
 {label:'Arbete',symbol:'›',color:'#81c8ba',work:true,description:'Genomförande av avgränsade uppgifter.'},
 {label:'Nästa steg',symbol:'◇',color:'#93b6e1',work:false,description:'Förberedelser och beroenden inför fortsatt arbete.'},
 {label:'Paus',symbol:'||',color:'#bc9ac4',work:false,description:'Avsiktliga pauser och väntan på förutsättningar.'},
 {label:'Bevakning',symbol:'◉',color:'#8fbbcc',work:true,description:'Insamling och prövning av relevanta signaler.'},
 {label:'Projekt',symbol:'◇',color:'#d2ab92',work:true,description:'Sammanhängande arbete mot ett tydligt resultat.'},
 {label:'Dokumentation',symbol:'≡',color:'#acaeda',work:true,description:'Beslut, belägg och erfarenheter som bevaras.'},
 {label:'Resultat',symbol:'✓',color:'#bac598',work:false,description:'Leveranser som går att kontrollera och använda.'}
]);
export function project([x,y,z],yaw,pitch,zoom,width,height){const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw),c=y*Math.cos(pitch)-b*Math.sin(pitch),d=y*Math.sin(pitch)+b*Math.cos(pitch),s=zoom*Math.min(width*.28,height*.3)*3/(3+d);return{x:width/2+a*s,y:height/2+c*s};}
export function layout(points,width,height){const ordered=points.map((p,i)=>({...p,i})).sort((a,b)=>a.x-b.x),out=[];for(let side=0;side<2;side++){const g=ordered.slice(side*4,side*4+4).sort((a,b)=>a.y-b.y);g.forEach((p,j)=>out.push({i:p.i,x:side?width-(width<520?142:169):10,y:height/2-140+j*70,width:width<520?132:159}));}return out;}

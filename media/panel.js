/* global acquireVsCodeApi */
'use strict';
const api=acquireVsCodeApi();let data={issues:[],principles:[]},tab='issues';
const $=id=>document.getElementById(id);
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function send(type,index,group){api.postMessage({type,index,group,uri:data.uri,version:data.version});}
function button(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;}
function render(){
 $('file').textContent=data.file||'';$('pause').textContent=data.paused?'Hints hervatten':'Hints pauzeren';
 $('spelling').setAttribute('aria-pressed',String(tab==='issues'));$('principles').setAttribute('aria-pressed',String(tab==='principles'));
 const cards=$('cards');cards.replaceChildren();
 const list=data[tab]||[];
 if(tab==='issues'&&data.patternGuide?.length){
  const guide=el('details');guide.append(el('summary','Welke patronen helpt CodeKompas nalopen?'));
  guide.append(el('p','Dit zijn patronen in code, geen test op dyslexie.'));
  for(const p of data.patternGuide)guide.append(el('h3',p.title),el('p',p.text));
  cards.append(guide);
 }
 $('summary').textContent=(tab==='issues'||data.paused||data.enabled===false?data.notice:data.principleNotice)||(tab==='issues'?(list.length?`${list.length} mogelijke aandachtspunten. Kies er één.`:'Geen aandachtspunten gevonden binnen de ondersteunde controles.'):(list.length?'Onderzoek deze ideeën. Het zijn geen fouten.':'Hier zijn nu geen principesuggesties. Je kunt dit luik in de instellingen aanzetten.'));
 list.forEach((item,index)=>{
  const card=el('article',undefined,'card');
  card.append(el('p',`REGEL ${item.line}`,'eyebrow'));
  if(tab==='issues'){
   if(item.family)card.append(el('p',item.family,'eyebrow'));
   card.append(el('h2',item.message),el('p',item.context),el('code',item.display||item.word));
   if(item.why)card.append(el('p',item.why,'reason'));
   const details=el('details'),summary=el('summary','Een extra aanwijzing');details.append(summary,el('p',item.detail));
   if(item.steps?.length){details.append(el('h3','Zelf nalopen'));const steps=el('ol');for(const step of item.steps)steps.append(el('li',step));details.append(steps);}
   card.append(details);
  }else{
   card.append(el('h2',item.title),el('p',item.definition),el('p',item.reason,'reason'),el('p',item.question,'question'));
   const details=el('details');details.append(el('summary','Meer uitleg'),el('p',item.explanation));card.append(details);
  }
  const group=tab;
  card.append(button('Bekijk in mijn code',()=>send('locate',index,group)));
  if(group==='issues'&&item.ignorable!==false)card.append(button('Deze naam is bewust zo geschreven',()=>send('ignore',index,group)));
  cards.append(card);
 });
 if(tab==='issues'&&data.total>list.length&&list.length<100){cards.append(button(`Toon meer (${list.length} van ${data.total} zichtbaar)`,()=>send('more')));}
}
$('spelling').onclick=()=>{tab='issues';api.setState({tab});render();};
$('principles').onclick=()=>{tab='principles';api.setState({tab});render();};
$('pause').onclick=()=>send('pause');$('settings').onclick=()=>send('settings');
window.addEventListener('message',e=>{if(e.data?.type==='update'){data=e.data.data;render();}});
api.postMessage({type:'ready'});

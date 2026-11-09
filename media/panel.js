/* global acquireVsCodeApi */
'use strict';
const api=acquireVsCodeApi();let data={issues:[],principles:[]},tab='issues';
const $=id=>document.getElementById(id);
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function send(type,index,group){api.postMessage({type,index,group,uri:data.uri,version:data.version});}
function button(text,fn){const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;}
function codePreview(item){
 if(item.display||!item.excerpt)return el('code',item.display||item.word);
 const {before,highlight,after}=item.excerpt;
 const code=el('code');
 code.append(before);
 if(highlight)code.append(el('mark',highlight));
 code.append(after);
 return code;
}
function render(){
 const {labels,language}=data;
 document.documentElement.lang=language;
 for(const id of ['eyebrow','tagline','spelling','principles','footer','settings'])$(id).textContent=labels[id];
 $('navigation').setAttribute('aria-label',labels.navigation);
 $('language').lang=language==='en'?'nl':'en';
 $('language').textContent=language==='en'?'Nederlands':'English';
 $('file').textContent=data.file||'';$('pause').textContent=data.paused?labels.resume:labels.pause;
 $('spelling').setAttribute('aria-pressed',String(tab==='issues'));$('principles').setAttribute('aria-pressed',String(tab==='principles'));
 const cards=$('cards');cards.replaceChildren();
 const list=data[tab]||[];
 if(tab==='issues'&&data.patternGuide?.length){
  const guide=el('details');guide.append(el('summary',labels.guideTitle));
  guide.append(el('p',labels.guideIntro));
  for(const p of data.patternGuide)guide.append(el('h3',p.title),el('p',p.text));
  cards.append(guide);
 }
 $('summary').textContent=(tab==='issues'||data.paused||data.enabled===false?data.notice:data.principleNotice)||(tab==='issues'?(list.length?labels.issueCount.replace('{count}',list.length):labels.noIssues):(list.length?labels.somePrinciples:labels.noPrinciples));
 list.forEach((item,index)=>{
  const card=el('article',undefined,'card');
  const location=item.column?labels.location.replace('{column}',item.column):labels.line;
  card.append(el('p',location.replace('{line}',item.line),'eyebrow'));
  if(tab==='issues'){
   if(item.family)card.append(el('p',item.family,'eyebrow'));
   card.append(el('h2',item.message),el('p',item.context),codePreview(item));
   if(item.why)card.append(el('p',item.why,'reason'));
   if(item.detail)card.append(el('p',item.detail));
   if(item.steps?.length||item.example){
    const details=el('details');
    details.append(el('summary',labels.steps));
    if(item.steps?.length){
     const steps=el('ol');
     for(const step of item.steps)steps.append(el('li',step));
     details.append(steps);
    }
    if(item.example)details.append(el('h3',labels.example),el('code',item.example));
    card.append(details);
   }
  }else{
   card.append(el('h2',item.title),el('p',item.definition),el('p',item.reason,'reason'),el('p',item.question,'question'));
   const details=el('details');details.append(el('summary',labels.moreExplanation),el('p',item.explanation));card.append(details);
  }
  const group=tab;
  card.append(button(labels.locate,()=>send('locate',index,group)));
  if(group==='issues'&&item.ignorable!==false)card.append(button(labels.ignore,()=>send('ignore',index,group)));
  cards.append(card);
 });
 if(tab==='issues'&&data.total>list.length&&list.length<100){cards.append(button(labels.more.replace('{visible}',list.length).replace('{total}',data.total),()=>send('more')));}
}
$('spelling').onclick=()=>{tab='issues';api.setState({tab});render();};
$('principles').onclick=()=>{tab='principles';api.setState({tab});render();};
$('language').onclick=()=>send('toggleLanguage');
$('pause').onclick=()=>send('pause');$('settings').onclick=()=>send('settings');
window.addEventListener('message',e=>{if(e.data?.type==='update'){data=e.data.data;render();}});
api.postMessage({type:'ready'});

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom'),{harness}=require('./host-mock');
function panel(){const host=harness(),out=[];const dom=new JSDOM(host.webview.html,{runScripts:'outside-only'});const w=dom.window;w.acquireVsCodeApi=()=>({postMessage:m=>out.push(m),getState:()=>({tab:'principles'}),setState:()=>{}});w.eval(fs.readFileSync(require.resolve('../media/panel.js'),'utf8'));const update=data=>w.dispatchEvent(new w.MessageEvent('message',{data:{type:'update',data:{language:host.messages.at(-1).data.language,labels:host.messages.at(-1).data.labels,...data}}}));update(host.messages.at(-1).data);return {w,out,host,update,dispose(){w.close();host.dispose();}};}
test('dyslexia is always initial tab with progressive hints',()=>{const p=panel();try{assert.equal(p.w.document.getElementById('spelling').getAttribute('aria-pressed'),'true');assert.equal(p.w.document.querySelectorAll('article').length,1);assert.equal(p.w.document.querySelector('details').open,false);assert.ok(!p.w.document.body.textContent.includes('getElementById'));}finally{p.dispose();}});
test('tab switch displays concept cards separately',()=>{const p=panel();try{p.update({issues:[],principles:[{title:'Scope',definition:'Bereik',question:'Waar?',explanation:'Uitleg',reason:'Variabele',line:1,index:0}],file:'a.js'});p.w.document.getElementById('principles').click();assert.equal(p.w.document.querySelector('article h2').textContent,'Scope');assert.equal(p.w.document.getElementById('spelling').getAttribute('aria-pressed'),'false');}finally{p.dispose();}});
test('student strings rendered as text, never HTML',()=>{const p=panel();try{p.update({issues:[{message:'Controleer',context:'Naam',word:'<img src=x onerror=alert(1)>',detail:'<script>x</script>',line:1}],principles:[],file:'a.js'});assert.equal(p.w.document.querySelectorAll('article img, article script').length,0);assert.match(p.w.document.querySelector('code').textContent,/<img/);}finally{p.dispose();}});
test('ignore and navigate use current document version',()=>{const p=panel();try{const buttons=p.w.document.querySelectorAll('article button');buttons[0].click();buttons[1].click();assert.equal(p.out.at(-2).type,'locate');assert.equal(p.out.at(-1).type,'ignore');assert.equal(p.out.at(-1).version,1);assert.equal(p.out.at(-1).uri,'file:///lesson.js');}finally{p.dispose();}});
test('pause and settings emit permitted messages',()=>{const p=panel();try{p.w.document.getElementById('pause').click();assert.equal(p.out.at(-1).type,'pause');p.w.document.getElementById('settings').click();assert.equal(p.out.at(-1).type,'settings');}finally{p.dispose();}});
test('syntax hints show steps without a name-ignore button',()=>{const p=panel();try{p.update({issues:[{message:'Controleer',context:'Structuur',word:':',detail:'Verbinding',steps:['Bekijk de naam.','Bekijk de waarde.'],ignorable:false,line:1}],principles:[],file:'a.html'});assert.equal(p.w.document.querySelectorAll('article li').length,2);assert.equal(p.w.document.querySelectorAll('article button').length,1);}finally{p.dispose();}});
test('more button exposes findings beyond initial cap',()=>{const p=panel();try{p.update({issues:[{message:'Controleer',context:'Naam',word:'x',detail:'Lees',line:1}],principles:[],total:2,uri:'file:///a.js',version:2});const b=[...p.w.document.querySelectorAll('button')].find(x=>x.textContent.startsWith('Toon meer'));assert.ok(b);b.click();assert.equal(p.out.at(-1).type,'more');assert.equal(p.out.at(-1).version,2);}finally{p.dispose();}});
test('pattern guide is collapsed and in main dyslexia tab',()=>{const p=panel();try{assert.ok(p.w.document.querySelector('main>details'));assert.equal(p.w.document.querySelector('main>details').open,false);assert.match(p.w.document.querySelector('main>details').textContent,/geen test op dyslexie/);}finally{p.dispose();}});

test('language button switches the panel and live diagnostics in both directions',async()=>{
 const p=panel();
 try{
  const button=p.w.document.getElementById('language');
  button.click();
  assert.equal(p.out.at(-1).type,'toggleLanguage');
  await p.host.handlers.message(p.out.at(-1));
  p.update(p.host.messages.at(-1).data);
  assert.equal(p.w.document.documentElement.lang,'en');
  assert.equal(button.textContent,'Nederlands');
  assert.equal(p.w.document.querySelector('.header-meta .version').textContent,'v'+require('../package.json').version);
  assert.equal(p.w.document.querySelector('article h2').textContent,'Check the capitalization.');
  assert.equal(p.host.records.get('file:///lesson.js')[0].message,'Check the capitalization.');
  assert.equal(p.host.context.globalState.get('language'),'en');
  p.w.document.getElementById('principles').click();
  assert.match(p.w.document.querySelector('article h2').textContent,/Naming conventions/);
  button.click();
  await p.host.handlers.message(p.out.at(-1));
  p.update(p.host.messages.at(-1).data);
  assert.equal(p.w.document.documentElement.lang,'nl');
  assert.equal(button.textContent,'English');
  assert.match(p.w.document.querySelector('article h2').textContent,/Naamconventies/);
  assert.equal(p.host.context.globalState.get('language'),'nl');
 }finally{p.dispose();}
});
test('structure hint shows its explanation, highlighted code and a separate example',()=>{
 const p=panel();
 try{
  p.host.doc.languageId='html';
  p.host.doc.text='<main class:"app">';
  p.host.doc.version++;
  p.host.commands['codekompas.analyze']();
  p.update(p.host.messages.at(-1).data);
  const card=[...p.w.document.querySelectorAll('article')].find(node=>node.querySelector('mark')?.textContent===':');
  assert.ok(card);
  assert.match(card.querySelector('.eyebrow').textContent,/REGEL 1, KOLOM 12/);
  assert.equal(card.querySelector('code').textContent,'<main class:"app">');
  assert.equal(card.querySelector('main'),null);
  assert.ok([...card.children].some(node=>node.tagName==='P'&&node.textContent.includes('gelijkteken')));
  const details=card.querySelector('details');
  assert.equal(details.open,false);
  assert.ok(details.querySelectorAll('li').length);
  assert.match(details.querySelector('code').textContent,/<a href=/);
 }finally{p.dispose();}
});

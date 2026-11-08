'use strict';
const vscode = require('vscode');
const crypto = require('node:crypto');
const {analyze} = require('./analyzer');
const patternGuide=require('./patterns');
const supported=new Set(['html','css','javascript']);
function activate(context){
 const diagnostics=vscode.languages.createDiagnosticCollection('CodeKompas');
 const timers=new Map(), results=new Map(), hintLimits=new Map();let paused=false, view, lastDocument;
 const status=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right,40);
 status.command='codekompas.open';status.tooltip='Open CodeKompas — hints zonder oplossingen';status.show();
 function config(doc){return vscode.workspace.getConfiguration('codekompas',doc?.uri);}
 function ignored(doc){return [...config(doc).get('ignoreWords',[]),...context.workspaceState.get('ignoredWords',[])];}
 function payload(){
  const doc=lastDocument;
  if(!doc||doc.isClosed||!supported.has(doc.languageId))return {paused,patternGuide,issues:[],principles:[],notice:'Open een HTML-, CSS- of JavaScript-bestand.',file:''};
  const result=results.get(doc.uri.toString())||{issues:[],principles:[],notice:'Even wachten op de analyse…'};
  return {paused,patternGuide,enabled:config(doc).get('enabled',true),file:doc.uri.path.split('/').pop(),version:doc.version,uri:doc.uri.toString(),...result,
   issues:result.issues.map((x,i)=>({...x,index:i,line:doc.positionAt(x.start).line+1})),
   principles:result.principles.map((x,i)=>({...x,index:i,line:doc.positionAt(x.start).line+1}))};
 }
 function publish(){status.text=paused?'$(debug-pause) CodeKompas':'$(compass) CodeKompas';view?.webview.postMessage({type:'update',data:payload()});}
 function run(doc){
  if(doc.isClosed||!supported.has(doc.languageId))return;
  const cfg=config(doc), key=doc.uri.toString();
  if(paused||!cfg.get('enabled',true)){diagnostics.delete(doc.uri);results.set(key,{issues:[],principles:[],notice:paused?'De hints staan op pauze.':'CodeKompas staat uit in de instellingen.'});publish();return;}
  try{
   const result=analyze(doc.getText(),doc.languageId,{ignoreWords:ignored(doc),maxHints:hintLimits.get(key)||cfg.get('maxHints',8),styleConventions:cfg.get('styleConventions',true),indentationHints:cfg.get('indentationHints',true),maxPrinciples:cfg.get('maxPrinciples',8),principles:cfg.get('principles',true),disabledPrinciples:cfg.get('disabledPrinciples',[]),maxBytes:cfg.get('maxCharacters',250000)});
   results.set(key,result);
   diagnostics.set(doc.uri,result.issues.map(x=>{
    const d=new vscode.Diagnostic(new vscode.Range(doc.positionAt(x.start),doc.positionAt(x.end)),x.message,vscode.DiagnosticSeverity.Information);
    d.source='CodeKompas';d.code=x.context;
    if(x.kind==='convention')d.severity=vscode.DiagnosticSeverity.Hint;return d;
   }));
  }catch{diagnostics.delete(doc.uri);results.set(key,{issues:[],principles:[],notice:'De analyse lukte niet. Probeer opnieuw via CodeKompas: Nu analyseren.'});}
  if(lastDocument===doc)publish();
 }
 function schedule(doc,immediate=false){
  const key=doc.uri.toString();clearTimeout(timers.get(key));timers.delete(key);
  if(!supported.has(doc.languageId))return;
  // Do not keep stale clickable ranges while a document is being edited.
  results.delete(key);diagnostics.delete(doc.uri);
  if(lastDocument===doc&&!immediate)publish();
  if(immediate)run(doc);else timers.set(key,setTimeout(()=>{timers.delete(key);run(doc);},config(doc).get('delay',900)));
 }
 function recheck(){for(const d of vscode.workspace.textDocuments)schedule(d,true);publish();}
 const provider={resolveWebviewView(v){
  view=v;v.webview.options={enableScripts:true,localResourceRoots:[vscode.Uri.joinPath(context.extensionUri,'media')]};
  const nonce=crypto.randomBytes(24).toString('hex');
  const script=v.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri,'media','panel.js'));
  const style=v.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri,'media','panel.css'));
  v.webview.html=`<!doctype html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${v.webview.cspSource}; script-src 'nonce-${nonce}';"><link rel="stylesheet" href="${style}"><title>CodeKompas</title></head><body><header><p class="eyebrow">STAP VOOR STAP</p><h1>CodeKompas</h1><p>Jij zoekt. Wij wijzen de weg.</p><p id="file"></p><button id="pause" type="button">Pauzeren</button></header><nav aria-label="Ondersteuning"><button id="spelling" aria-pressed="true" type="button">Dyslexie · codehulp</button><button id="principles" aria-pressed="false" type="button">Programmeerprincipes</button></nav><p id="summary" role="status" aria-live="polite"></p><main id="cards"></main><footer><p>Mogelijke aandachtspunten, geen beoordeling. Geen hint betekent niet dat alle code correct is.</p><button id="settings" type="button">Instellingen</button></footer><script nonce="${nonce}" src="${script}"></script></body></html>`;
  context.subscriptions.push(v.webview.onDidReceiveMessage(async msg=>{
   if(!msg||typeof msg.type!=='string')return;
   if(msg.type==='ready'){publish();return;}
   if(msg.type==='pause'){paused=!paused;recheck();return;}
   if(msg.type==='settings'){await vscode.commands.executeCommand('workbench.action.openSettings','@ext:codekompas.codekompas');return;}
   const doc=lastDocument,result=doc&&results.get(doc.uri.toString());
   if(!doc||!result||doc.isClosed||msg.uri!==doc.uri.toString()||msg.version!==doc.version)return;
   if(msg.type==='more'){hintLimits.set(doc.uri.toString(),Math.min(100,(hintLimits.get(doc.uri.toString())||config(doc).get('maxHints',8))+8));run(doc);return;}
   if(!Number.isInteger(msg.index))return;
   const item=msg.group==='principles'?result.principles[msg.index]:result.issues[msg.index];if(!item)return;
   if(msg.type==='locate'){
    const editor=await vscode.window.showTextDocument(doc,{preserveFocus:false,preview:true});
    if(doc.version!==msg.version)return;
    const range=new vscode.Range(doc.positionAt(item.start),doc.positionAt(item.end));editor.selection=new vscode.Selection(range.start,range.end);editor.revealRange(range,vscode.TextEditorRevealType.InCenterIfOutsideViewport);
   }else if(msg.type==='ignore'&&msg.group==='issues'&&item.ignorable!==false){
    const words=new Set(context.workspaceState.get('ignoredWords',[]));words.add(item.word);
    await context.workspaceState.update('ignoredWords',[...words]);recheck();
   }
  }));
  v.onDidDispose(()=>{view=undefined;});publish();
 }};
 context.subscriptions.push(diagnostics,status,vscode.window.registerWebviewViewProvider('codekompas.panel',provider),
  vscode.commands.registerCommand('codekompas.open',()=>vscode.commands.executeCommand('codekompas.panel.focus')),
  vscode.commands.registerCommand('codekompas.analyze',()=>{if(vscode.window.activeTextEditor)schedule(vscode.window.activeTextEditor.document,true);}),
  vscode.commands.registerCommand('codekompas.pause',()=>{paused=!paused;recheck();}),
  vscode.commands.registerCommand('codekompas.resetIgnored',async()=>{await context.workspaceState.update('ignoredWords',[]);recheck();vscode.window.showInformationMessage('De via CodeKompas genegeerde woorden zijn hersteld. Woorden in je instellingen blijven behouden.');}),
  vscode.workspace.onDidChangeTextDocument(e=>{if(e.contentChanges.length)schedule(e.document);}),
  vscode.workspace.onDidOpenTextDocument(d=>schedule(d,true)),
  vscode.workspace.onDidCloseTextDocument(d=>{const key=d.uri.toString();clearTimeout(timers.get(key));timers.delete(key);results.delete(key);hintLimits.delete(key);diagnostics.delete(d.uri);if(lastDocument===d){lastDocument=undefined;publish();}}),
  vscode.workspace.onDidChangeConfiguration(e=>{if(e.affectsConfiguration('codekompas')){hintLimits.clear();recheck();}}),
  vscode.window.onDidChangeActiveTextEditor(e=>{if(e){lastDocument=e.document;schedule(e.document,true);publish();}}),
  {dispose(){for(const timer of timers.values())clearTimeout(timer);timers.clear();results.clear();hintLimits.clear();}}
 );
 lastDocument=vscode.window.activeTextEditor?.document;recheck();
}
module.exports={activate};

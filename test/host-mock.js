'use strict';
const Module=require('node:module');
function harness(entry='../src/extension'){ 
 const handlers={},commands={},values=new Map(),records=new Map(),messages=[],configuration={delay:200};let provider;
 const disposable=()=>({dispose(){}}),event=name=>cb=>{handlers[name]=cb;return disposable();};
 const doc={uri:{toString:()=> 'file:///lesson.js',path:'/lesson.js'},languageId:'javascript',version:1,isClosed:false,text:'document.getElementByID("x")',getText(){return this.text;},positionAt(offset){return {line:this.text.slice(0,offset).split('\n').length-1,character:offset};}};
 class Range{constructor(start,end){this.start=start;this.end=end;}}
 class Diagnostic{constructor(range,message,severity){Object.assign(this,{range,message,severity});}}
 const editor={document:doc,revealRange(){}};
 const mock={
  languages:{createDiagnosticCollection:()=>({set:(uri,d)=>records.set(uri.toString(),d),delete:uri=>records.delete(uri.toString()),dispose(){}})},
  window:{activeTextEditor:editor,createStatusBarItem:()=>({show(){},dispose(){}}),registerWebviewViewProvider:(_,p)=>{provider=p;return disposable();},onDidChangeActiveTextEditor:event('active'),showInformationMessage:()=>{},showTextDocument:async()=>editor},
  workspace:{textDocuments:[doc],getConfiguration:()=>({get:(key,fallback)=>key in configuration?configuration[key]:fallback}),onDidChangeTextDocument:event('change'),onDidOpenTextDocument:event('open'),onDidCloseTextDocument:event('close'),onDidChangeConfiguration:event('config')},
  commands:{registerCommand:(name,fn)=>{commands[name]=fn;return disposable();},executeCommand:async()=>{}},
  Uri:{joinPath:(_, ...parts)=>parts.join('/')},Range,Selection:Range,Diagnostic,DiagnosticSeverity:{Information:2,Hint:3},StatusBarAlignment:{Right:2},TextEditorRevealType:{InCenterIfOutsideViewport:0}
 };
 const context={subscriptions:[],extensionUri:'root',workspaceState:{get:(k,f)=>values.get(k)??f,update:async(k,v)=>values.set(k,v)}};
 const old=Module._load;Module._load=function(name,...args){return name==='vscode'?mock:old.call(this,name,...args);};
 const filename=require.resolve(entry);delete require.cache[filename];
 try{require(filename).activate(context);}finally{Module._load=old;}
 const webview={options:{},cspSource:'vscode-resource:',asWebviewUri:x=>x,postMessage:x=>messages.push(x),onDidReceiveMessage:cb=>{handlers.message=cb;return disposable();}};
 provider.resolveWebviewView({webview,onDidDispose:()=>{}});
 return {doc,records,handlers,commands,context,webview,messages,configuration,editor,dispose:()=>context.subscriptions.forEach(s=>s.dispose())};
}

module.exports={harness};

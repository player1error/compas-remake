'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {harness}=require('./host-mock');
test('distributed bundle activates and analyzes without node_modules runtime imports',()=>{
 const Module=require('node:module'),old=Module._load,loaded=[];
 Module._load=function(name,...args){loaded.push(name);if(!name.startsWith('.')&&!name.startsWith('/')&&!name.startsWith('node:')&&!Module.builtinModules.includes(name)&&name!=='vscode')throw new Error('Unexpected external dependency: '+name);return old.call(this,name,...args);};
 let h;try{h=harness('../dist/extension');assert.equal(h.records.get('file:///lesson.js').length,1);assert.match(h.webview.html,/Dyslexie/);
 h.doc.languageId='html';h.doc.text='<buton clas="x">x</buton>';h.doc.version++;h.commands['codekompas.analyze']();assert.equal(h.records.get('file:///lesson.js').length,3);
 h.doc.languageId='css';h.doc.text='.a{colro:red;display:felx}';h.doc.version++;h.commands['codekompas.analyze']();assert.equal(h.records.get('file:///lesson.js').length,2);}finally{h?.dispose();Module._load=old;}
});

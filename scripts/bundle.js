'use strict';
const esbuild=require('esbuild'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const result=await esbuild.build({entryPoints:['src/extension.js'],outfile:'dist/extension.js',bundle:true,platform:'node',mainFields:['module','main'],format:'cjs',target:'node18',external:['vscode'],minify:false,metafile:true,legalComments:'eof'});
 const names=new Set();
 for(const input of Object.keys(result.metafile.inputs)){
  if(!input.startsWith('node_modules/'))continue;
  const parts=input.slice(13).split('/');names.add(parts[0].startsWith('@')?parts.slice(0,2).join('/'):parts[0]);
 }
 let notices='THIRD-PARTY NOTICES\nBundled dependencies and their license texts.\n\n';
 for(const name of [...names].sort()){
  const dir=path.join('node_modules',name),p=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
  const files=fs.readdirSync(dir).filter(f=>/^(licen[cs]e|copyright|notice)(\.|$)/i.test(f)&&fs.statSync(path.join(dir,f)).isFile());
  notices+=`\n=== ${name} ${p.version} (${p.license||'see below'}) ===\n`;
  if(!files.length && name==='@vscode/l10n'){notices+=fs.readFileSync('licenses/vscode-l10n-LICENSE.txt','utf8')+'\n';}
  else if(!files.length){
   const source=fs.readFileSync(path.join(dir,p.main||'index.js'),'utf8');
   const header=source.match(/^\/\*[\s\S]*?\*\//)?.[0];
   if(!header||!header.includes('Copyright')||!header.includes('Redistribution'))throw new Error('No license file found for '+name);
   notices+=header+'\n';
  }
  for(const f of files)notices+=fs.readFileSync(path.join(dir,f),'utf8')+'\n';
 }
 fs.writeFileSync('THIRD_PARTY_NOTICES.txt',notices);
 console.log('Bundled extension and '+names.size+' dependency licenses.');
})().catch(e=>{console.error(e);process.exit(1);});

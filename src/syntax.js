'use strict';
const html=require('vscode-html-languageservice');
const css=require('vscode-css-languageservice');
const parse5=require('parse5');
const postcss=require('postcss');
const htmlService=html.getLanguageService(),cssService=css.getCSSLanguageService();
// Syntax hints describe roles, never construct a corrected line or offer edits.
function htmlSyntax(code){
 const out=[],tokens=[],covered=[];
 const scanner=htmlService.createScanner(code);
 let t;
 while((t=scanner.scan())!==html.TokenType.EOS)tokens.push({type:html.TokenType[t],text:scanner.getTokenText(),start:scanner.getTokenOffset(),end:scanner.getTokenEnd(),error:scanner.getTokenError()});
 function add(start,end,rule,message,detail,steps,why){out.push({start,end,rule,message,detail,steps,why,context:'HTML-structuur',kind:'syntax',ignorable:false});}
 let tagStart=null,tagName='',attrNames=new Set(),suppressUntil=-1;
 for(let i=0;i<tokens.length;i++){
  const x=tokens[i];
  if(x.type==='StartTagOpen'||x.type==='EndTagOpen'){tagStart=x.start;tagName='';attrNames=new Set();}
  if(x.type==='StartTag'||x.type==='EndTag')tagName=x.text;
  if(x.type==='AttributeName'&&x.start>suppressUntil){
   const following=code.slice(x.end),colon=x.text.match(/^([a-zA-Z][\w-]*):$/);
   if(colon && /^\s*["']/.test(following)){
    const quoteStart=x.end+(following.match(/^\s*/)[0].length),quote=code[quoteStart];
    const end=code.indexOf(quote,quoteStart+1);suppressUntil=end<0?code.length:end;
    covered.push([x.start,suppressUntil+1]);
    add(x.end-1,x.end,'html-attribute-separator','Controleer het teken tussen attribuut en waarde.',
     'Een HTML-attribuut heeft een naam en eventueel een waarde. Het gelijkteken (=) koppelt die twee. De dubbele punt (:) heeft onder meer in CSS een andere rol.',
     ['Baken de attribuutnaam af.','Zoek de waarde tussen aanhalingstekens.','Controleer welk teken de naam met de waarde verbindt.'],
     'Hier zit het aandachtspunt in het scheidingsteken, niet in de letters van de attribuutnaam.');
   }else if(/^\s*["']/.test(following)){
    const quoteStart=x.end+following.match(/^\s*/)[0].length,quote=code[quoteStart],end=code.indexOf(quote,quoteStart+1);
    suppressUntil=end<0?code.length:end;covered.push([x.start,suppressUntil+1]);
    add(x.start,x.end,'html-attribute-assignment','Controleer hoe deze attribuutwaarde is verbonden.',
     'Een waarde tussen aanhalingstekens moet aan een attribuut gekoppeld zijn. In HTML legt = die verbinding. Een boolean attribuut, zoals disabled, kan zonder waarde voorkomen.',
     ['Zoek de naam en de bedoelde waarde.','Bekijk de ruimte ertussen.','Controleer of de verbinding aanwezig is.']);
   }
   const name=x.text.toLowerCase();
   if(attrNames.has(name))add(x.start,x.end,'html-duplicate-attribute','Dit attribuut staat meer dan één keer in deze tag.',
    'Dezelfde attribuutnaam hoort binnen één starttag maar één keer voor te komen. Anders kan de browser een waarde negeren.',
    ['Vergelijk de attributen binnen deze ene starttag.','Bepaal welke gegevens bij elkaar horen.']);
   attrNames.add(name);
  }
  if(x.type==='AttributeValue'&&/^["']/.test(x.text)&&x.text.at(-1)!==x.text[0]){
   covered.push([x.start,code.length]);
   add(x.start,x.start+1,'html-attribute-quote','Controleer de aanhalingstekens rond deze waarde.',
    'Een waarde die met een enkel of dubbel aanhalingsteken begint, moet met hetzelfde soort teken eindigen. Anders kan volgende HTML als deel van de waarde worden gelezen.',
    ['Zoek het openingsteken.','Zoek het bijbehorende sluitteken.','Kijk of de volgende tag buiten de waarde staat.']);
   tagStart=null;
  }
  if(x.type==='Unknown'&&x.text==='<'&&tagStart!==null){
   covered.push([tagStart,code.indexOf('>',x.end)<0?code.length:code.indexOf('>',x.end)]);
   const end=tagStart+code.slice(tagStart).match(/^<\/?[^\s<>]*/)[0].length;
   add(tagStart,end,'html-tag-close','Controleer of deze tag volledig is afgesloten.',
    'Een start- of eindtag wordt begrensd door < en >. Een nieuwe regel sluit een tag niet af. Als het sluitteken ontbreekt, kan de volgende tag verkeerd worden gelezen.',
    ['Begin bij de gemarkeerde tag.','Volg de tag tot zijn einde.','Controleer de afsluiting vóór de volgende tag begint.']);
   tagStart=null;
  }
  if(['StartTagClose','EndTagClose','StartTagSelfClose'].includes(x.type))tagStart=null;
 }
 if(tagStart!==null){
  add(tagStart,Math.min(code.length,tagStart+tagName.length+2),'html-tag-close','Controleer de afsluiting van deze tag.',
   'Het bestand eindigt terwijl de tag nog niet volledig afgesloten lijkt. Ook een eindtag heeft een sluitend punthaakje nodig.',
   ['Controleer het einde van de tag.','Controleer of een attribuutwaarde nog openstaat.']);
  covered.push([tagStart,code.length+1]);
 }
 // WHATWG tokenizer catches missing values and malformed quotes, without
 // inventing "missing end tags" for legal optional HTML end tags.
 const errors=[];const tree=parse5.parseFragment(code,{sourceCodeLocationInfo:true,onParseError:e=>errors.push(e)});
 const ids=new Set();
 function inspect(node){
  if(node.tagName==='template')return;
  const id=node.attrs?.find(a=>a.name==='id');
  if(id?.value){const loc=node.sourceCodeLocation?.attrs?.id;if(ids.has(id.value)&&loc)add(loc.startOffset,loc.endOffset,'html-duplicate-id','Is deze id uniek binnen de pagina?',
   'Een id identificeert één element in een document. Bij meerdere elementen met dezelfde id kunnen selectie, labels en ankerlinks een ander element bereiken dan je bedoelt.',
   ['Zoek dezelfde id in dit bestand.','Bepaal welke elementen een eigen identiteit nodig hebben.','Een gedeelde class heeft een andere rol dan een unieke id.']);ids.add(id.value);}
  for(const child of node.childNodes||[])inspect(child);
 }
 inspect(tree);
 const doc=html.TextDocument.create('file:///lesson.html','html',1,code),parsed=htmlService.parseHTMLDocument(doc);
 const optional=new Set('html head body li dt dd p rt rp optgroup option colgroup thead tbody tfoot tr td th'.split(' '));
 function nesting(node){
  if(node.tag&&!node.closed&&node.parent?.closed&&!optional.has(node.tag.toLowerCase()))add(node.start,node.start+node.tag.length+1,'html-nesting','Controleer waar dit element eindigt.',
   'Een omvattend element wordt gesloten terwijl dit binnenste element nog open lijkt. Elementen moeten correct genest zijn. Sommige HTML-tags hebben optionele eindtags, maar deze controle slaat die over.',
   ['Volg de binnenste openingstag tot de bijbehorende eindtag.','Controleer de volgorde waarin je binnenste en buitenste elementen afsluit.']);
  for(const child of node.children||[])nesting(child);
 }
 for(const n of parsed.roots)nesting(n);
 const descriptions={
  'missing-attribute-value':['Controleer de waarde na deze toekenning.','Na een koppeling tussen attribuutnaam en waarde ontbreekt hier een leesbare waarde. Een bewust lege waarde en een ontbrekende waarde zijn niet hetzelfde.'],
  'missing-whitespace-between-attributes':['Controleer de grens tussen twee attributen.','Attributen in dezelfde starttag worden door witruimte van elkaar gescheiden. Controleer waar de ene waarde eindigt en de volgende naam begint.'],
  'unexpected-character-in-unquoted-attribute-value':['Controleer de begrenzing van deze attribuutwaarde.','Een waarde zonder aanhalingstekens mag niet elk teken bevatten. Controleer welk deel één waarde vormt en hoe je dat afbakent.'],
  'unexpected-equals-sign-before-attribute-name':['Controleer de plaats van deze toekenning.','Een gelijkteken verbindt een attribuutnaam met een waarde. Ga na of de naam op de juiste plaats staat.'],
  'eof-in-comment':['Controleer de afsluiting van het HTML-commentaar.','Commentaar heeft een begin- en eindmarkering. Niet-afgesloten commentaar kan de rest van de pagina verbergen.'],
  'end-tag-with-trailing-solidus':['Controleer de schrijfwijze van deze eindtag.','Een eindtag en een zelfsluitende schrijfwijze hebben een verschillende structuur. Bekijk de plaats van de schuine streep.'],
  'unexpected-character-in-attribute-name':['Controleer de grens van dit attribuut.','Een teken wordt hier als deel van een attribuutnaam gelezen. Controleer de verbinding met de waarde en de aanhalingstekens.'],
  'end-tag-with-attributes':['Controleer deze eindtag.','Attributen horen in een starttag. Controleer ook of de vorige tag goed is afgesloten.']
 };
 for(const e of errors){
  if(covered.some(([a,b])=>e.startOffset>=a&&e.startOffset<=b))continue;
  const d=descriptions[e.code];if(!d)continue;
  if(out.some(x=>x.rule===e.code&&Math.abs(x.start-e.startOffset)<30))continue;
  const start=Math.max(0,Math.min(code.length-1,e.startOffset));
  add(start,start+1,e.code,d[0],d[1],['Bekijk de gemarkeerde plaats en de tekens vlak ervoor.','Baken naam, waarde en tag afzonderlijk af.']);
 }
 return out;
}
const cssHints={
 'hexColorLength':['Controleer de opbouw van deze hexkleur.','Een hexkleur gebruikt groepen hexadecimale tekens voor kleurkanalen en soms transparantie. Controleer het aantal tekens en de gekozen notatie; niet elk aantal is geldig.'],
 'argumentsInColorFunction':['Controleer de onderdelen van deze kleurfunctie.','Een kleurfunctie verwacht een bepaalde reeks kanalen en eventueel transparantie. Controleer aantal, volgorde en scheiding van de onderdelen.'],
 'css-numberexpected':['Controleer het getal op deze plaats.','Hier verwacht CSS een numerieke waarde. Controleer hoe getal, decimaalteken en eventuele eenheid geschreven zijn.'],
 'css-lbracketexpected':['Controleer de vierkante haakjes.','Een attribuutselector heeft een begin en einde. Controleer of de vierkante haakjes een volledig paar vormen.'],
 'css-lparentexpected':['Controleer het begin van deze CSS-functie.','Functies gebruiken ronde haakjes om hun argumenten af te bakenen. Controleer de overgang van functienaam naar argumenten.'],
 'css-commaexpected':['Controleer de scheiding van de onderdelen.','Deze constructie verwacht afzonderlijke onderdelen. De juiste scheiding hangt af van de functie of lijst waarin je werkt.'],
 'css-varnameexpected':['Controleer de naam van de CSS-variabele.','Een CSS-variabele heeft een eigen naam met een vaste beginstructuur. Vergelijk de verwijzing met de declaratie en controleer de scheiding van de onderdelen.'],
 'css-mediaqueryexpected':['Controleer de opbouw van deze mediaquery.','Een mediaquery beschrijft wanneer stijlen gelden. Controleer de voorwaarde, de haakjes en de overgang naar het stijlblok.'],
 'css-conditionexpected':['Controleer de voorwaarde in deze CSS-regel.','De regel verwacht een voorwaarde. Controleer welke eigenschap of omstandigheid je wilt testen en hoe je die afbakent.'],
 'css-colonexpected':['Controleer de verbinding tussen eigenschap en waarde.','Een CSS-declaratie bestaat uit een eigenschap en een waarde. De dubbele punt (:) verbindt ze; een gelijkteken heeft hier niet die rol.'],
 'css-semicolonexpected':['Controleer waar deze CSS-declaratie eindigt.','Een puntkomma scheidt opeenvolgende declaraties. Controleer of twee declaraties onbedoeld aan elkaar hangen. Na de laatste declaratie vóór } is de puntkomma optioneel.'],
 'css-rcurlyexpected':['Controleer de afsluiting van dit CSS-blok.','Een stijlblok heeft een openende en een sluitende accolade. Volg het blok vanaf zijn selector en controleer of het een einde heeft.'],
 'css-lcurlyexpected':['Controleer waar het CSS-blok begint.','Een selector en de bijbehorende declaraties vormen samen een stijlregel. Accolades bakenen het declaratieblok af.'],
 'css-propertyvalueexpected':['Controleer de waarde van deze eigenschap.','Een gewone CSS-eigenschap heeft een waarde nodig. Vraag je af welke soort waarde hier past: bijvoorbeeld een maat, kleur of keyword.'],
 'css-propertyexpected':['Controleer de opbouw van deze declaratie.','In een CSS-blok verwacht de parser een eigenschap met een waarde. Bekijk ook de afsluiting van de vorige declaratie.'],
 'css-rparentexpected':['Controleer de haakjes van deze CSS-functie.','Een functie of groepering heeft bij elkaar horende ronde haakjes. Controleer ook of een waarde of aanhalingsteken ertussen onvolledig is.'],
 'css-rbracketexpected':['Controleer de vierkante haakjes.','Een attribuutselector gebruikt bij elkaar horende vierkante haakjes. Controleer waar de selectie begint en eindigt.'],
 'css-stringliteralexpected':['Controleer deze tekstwaarde.','Hier wordt een tekstwaarde verwacht. Bekijk hoe je de tekst afbakent en of de aanhalingstekens bij elkaar horen.']
};
function cssSyntax(code){
 const doc=css.TextDocument.create('file:///lesson.css','css',1,code);
 let lexical=null;
 try{postcss.parse(code);}catch(e){
  if(['Unclosed string','Unclosed comment'].includes(e.reason)){
   const start=doc.offsetAt({line:e.line-1,character:e.column-1});
   lexical={start,end:start+1,rule:'css-quote-comment',message:e.reason==='Unclosed string'?'Controleer de afsluiting van deze CSS-tekst.':'Controleer de afsluiting van dit CSS-commentaar.',detail:e.reason==='Unclosed string'?'Een tekstwaarde moet met hetzelfde soort aanhalingsteken beginnen en eindigen. Controleer of volgende declaraties onbedoeld binnen de tekst vallen.':'Blokcommentaar heeft een begin- en eindmarkering. Zolang het commentaar openstaat, wordt volgende code mogelijk niet als CSS gelezen.',kind:'syntax',context:'CSS-structuur',ignorable:false,steps:['Zoek het openingsteken.','Zoek de bijbehorende afsluiting.']};
  }
 }
 const results=cssService.doValidation(doc,cssService.parseStylesheet(doc)).filter(d=>cssHints[d.code]).map(d=>{
  const start=doc.offsetAt(d.range.start),end=doc.offsetAt(d.range.end),h=cssHints[d.code];
  return {start:Math.min(start,Math.max(0,code.length-1)),end:Math.min(code.length,Math.max(end,start+1)),rule:d.code,message:h[0],detail:h[1],kind:'syntax',context:'CSS-structuur',ignorable:false,steps:['Bekijk de gemarkeerde plaats en de declaratie ervoor.','Scheid in gedachten de eigenschap, de waarde en de blokgrenzen.']};
 });
 if(lexical)return [...results.filter(x=>x.end<lexical.start),lexical];
 return results;
}
module.exports={htmlSyntax,cssSyntax};

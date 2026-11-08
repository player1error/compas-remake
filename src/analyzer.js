'use strict';
// Pure analysis: no filesystem, network, VS Code imports or student-code execution.
const acorn = require('acorn');
const loose = require('acorn-loose');
const {htmlSyntax,cssSyntax}=require('./syntax');
const walk = require('acorn-walk');
const scope = require('eslint-scope');
const valueParser=require('postcss-value-parser');
const safeParse = require('postcss-safe-parser');
const html = require('vscode-html-languageservice');
const css = require('vscode-css-languageservice');
const htmlData = html.getDefaultHTMLDataProvider();
const cssData = css.getDefaultCSSDataProvider();
const htmlService = html.getLanguageService();
const tagNames = htmlData.provideTags().map(t => t.name);
const properties = cssData.provideProperties().map(p => p.name);
const cssValues = new Map(cssData.provideProperties().map(p => [p.name, (p.values || []).map(v => v.name).filter(v => /^[a-z-]+$/.test(v))]));
const globals = 'document window console Math JSON Object Array String Number Boolean Date RegExp Map Set Promise Error TypeError URL URLSearchParams Intl Symbol BigInt undefined NaN Infinity localStorage sessionStorage fetch setTimeout clearTimeout setInterval clearInterval requestAnimationFrame cancelAnimationFrame alert prompt confirm parseInt parseFloat isNaN isFinite encodeURIComponent decodeURIComponent navigator location history performance'.split(' ');
const members = {
 Object:'keys values entries assign fromEntries create freeze hasOwn',
 Array:'isArray from of',
 array:'length forEach map filter find findIndex findLast findLastIndex reduce reduceRight some every includes indexOf lastIndexOf push pop shift unshift slice splice concat join sort reverse flat flatMap at toSorted toReversed toSpliced with entries keys values',
 string:'length charAt charCodeAt at includes indexOf lastIndexOf startsWith endsWith slice substring split trim trimStart trimEnd toLowerCase toUpperCase replace replaceAll match matchAll search repeat padStart padEnd normalize',
 nodeList:'length forEach item entries keys values',
 document: 'getElementById querySelector querySelectorAll createElement createTextNode addEventListener removeEventListener body head documentElement title readyState forms images',
 window: 'addEventListener removeEventListener innerWidth innerHeight scrollTo location alert prompt confirm setTimeout setInterval requestAnimationFrame',
 console: 'log warn error info debug table clear time timeEnd',
 Math: 'floor ceil round random max min abs sqrt pow PI trunc sign',
 JSON: 'parse stringify',
 element: 'addEventListener removeEventListener appendChild removeChild append prepend remove querySelector querySelectorAll setAttribute getAttribute hasAttribute removeAttribute classList textContent innerHTML innerText value style id children parentElement disabled checked',
 classList: 'add remove toggle contains replace',
 style: 'backgroundColor color fontSize display width height margin padding border setProperty removeProperty',
 localStorage: 'getItem setItem removeItem clear key length',
 sessionStorage: 'getItem setItem removeItem clear key length'
};
for (const k of Object.keys(members)) members[k] = members[k].split(' ');
const keywordTypos = new Set('cosnt cnst conts retrun retun reutrn functon fucntion funtion funtcion esle elese whlie whil swtich swich breka breack imoprt improt exprot expotr asnyc asyc awiat aweit'.split(' '));
const keywords = 'const return function else while switch break import export async await'.split(' ');
function distance(a,b) {
 // Optimal-string-alignment distance, including swapped adjacent letters.
 if (Math.abs(a.length-b.length)>2) return 3;
 const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
 for(let i=0;i<=a.length;i++)d[i][0]=i;
 for(let j=0;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }return d[a.length][b.length];
}
function nameParts(name){return name.replace(/([a-z0-9])([A-Z])/g,'$1 $2').split(/[ _-]+/).filter(Boolean).map(w=>w.toLowerCase());}
function classify(word, list, caseSensitive=true) {
 if(list.includes(word))return null;
 if(!caseSensitive && list.some(s=>s.toLowerCase()===word.toLowerCase()))return null;
 if(word.length<3 || word.length>80)return null;
 const normalized=word.toLowerCase(),stripped=normalized.replace(/[-_\s]/g,'');
 if(list.some(s=>s.toLowerCase()!==normalized&&s.toLowerCase().replace(/[-_\s]/g,'')===stripped))return 'separators';
 const parts=nameParts(word);
 if(parts.length>=2&&list.some(s=>{const p=nameParts(s);return p.length===parts.length&&p.join(' ')!==parts.join(' ')&&p.sort().join(' ')===parts.slice().sort().join(' ');} ))return 'chunks';
 const near=list.filter(s=>Math.abs(s.length-word.length)<=1 && distance(normalized,s.toLowerCase())<=1);
 if(!near.length)return null;
 if(near.some(s=>s.toLowerCase()===normalized))return 'case';
 if(near.some(s=>s.length===word.length && [...s.toLowerCase()].sort().join('')===[...normalized].sort().join('')))return 'order';
 if(near.length===1){
  const candidate=near[0].toLowerCase();
  if(normalized.length===candidate.length+1){
   for(let i=0;i<normalized.length;i++)if(normalized.slice(0,i)+normalized.slice(i+1)===candidate){
    if(normalized[i]===normalized[i-1]||normalized[i]===normalized[i+1])return 'repeated';
    return 'extra';
   }
  }
  if(normalized.length+1===candidate.length)return 'missing';
  if(normalized.length===candidate.length){
   const diffs=[...normalized].map((c,i)=>c===candidate[i]?null:[c,candidate[i]].sort().join('')).filter(Boolean);
   if(diffs.length===1&&['bd','bp','dq','pq','il','0o','1l','1i'].includes(diffs[0]))return 'shape';
  }
 }
 return 'letters';
}
const hints={
 missing:['Controleer of er een letter ontbreekt.','Deze naam lijkt op een bekend begrip dat iets langer is. Lees elk woorddeel afzonderlijk en vergelijk het aantal en de volgorde van de letters.'],
 extra:['Controleer of er een extra letter staat.','Deze naam lijkt op een bekend begrip dat iets korter is. Loop de letters één voor één na.'],
 repeated:['Controleer of een letter onbedoeld herhaald is.','Mogelijk staat een letter hier dubbel. Dubbele letters kunnen ook correct zijn: vergelijk daarom met de oorspronkelijke naam.'],
 shape:['Controleer de vorm van de tekens.','Een teken lijkt mogelijk op een ander teken. Bekijk zorgvuldig of je een letter of cijfer leest, en let op de richting en vorm.'],
 chunks:['Controleer de volgorde van de woorddelen.','De naam lijkt bekende woorddelen te bevatten, maar mogelijk in een andere volgorde. Lees de betekenis van de volledige naam.'],
 separators:['Controleer hoe de woorddelen verbonden zijn.','Deze naam lijkt op een bekend begrip, maar de scheiding tussen woorddelen is anders. Controleer of deze taal camelCase, een koppelteken of een andere vaste schrijfwijze gebruikt.'],
 case:['Controleer de hoofdletters.','In JavaScript telt het verschil tussen een hoofdletter en een kleine letter. Bekijk de naam letter voor letter.'],
 order:['Controleer de lettervolgorde.','Mogelijk staan twee letters omgekeerd. Lees de naam rustig van links naar rechts.'],
 letters:['Controleer de letters in deze naam.','Mogelijk ontbreekt een letter, staat er een extra letter of is een letter anders. Vergelijk met je cursus.'],
 reference:['Controleer of je dezelfde naam gebruikt.','Vergelijk deze naam met de plaats waar je de variabele of functie hebt aangemaakt. Ook hoofdletters tellen mee.']
};
const concepts={
 naming:{title:'Naamconventies · camelCase en kebab-case',definition:'Een naamconventie is een afspraak die de woorden in een naam herkenbaar maakt.',question:'Welke afspraak hoort bij de taal en het soort naam dat je hier gebruikt?',explanation:'JavaScript gebruikt vaak camelCase voor variabelen en methoden; CSS-eigenschappen meestal kebab-case. Bestaande API-namen staan vast. Een eigen naam moet vooral duidelijk en consequent zijn.'},
 callbacks:{title:'Callbacks · een functie doorgeven',definition:'Een callback is een functie die je meegeeft zodat andere code haar kan aanroepen.',question:'Geef je een functie mee, of het resultaat van een functie die je nu al uitvoert?',explanation:'Bij een eventhandler gebeurt de aanroep doorgaans later. Bij een bewerking op een array kan de callback per item worden aangeroepen. Let op welke gegevens de callback ontvangt en welk resultaat nodig is.'},
 collections:{title:'Eén element of een verzameling',definition:'Een verzameling bevat meerdere items, ook wanneer er toevallig maar één gevonden wordt.',question:'Wil je één element aanpassen of dezelfde bewerking uitvoeren voor meerdere elementen?',explanation:'Een DOM-element en een NodeList hebben andere eigenschappen. Een NodeList is ook niet precies hetzelfde als een array. Bepaal eerst met welk soort resultaat je werkt.'},
 equality:{title:'Vergelijken · waarde en type',definition:'Een vergelijking onderzoekt of twee waarden aan een relatie voldoen.',question:'Welke types vergelijk je, en wil je dat een type automatisch wordt omgezet?',explanation:'Sommige vergelijkingsoperatoren kunnen typeconversie toepassen. Bij een strikte vergelijking blijven de types van belang. Denk aan het verschil tussen een getal en tekst die op een getal lijkt.'},
 templates:{title:'Template literals · tekst met gegevens',definition:'Een template literal kan tekst combineren met de resultaten van expressies.',question:'Welke stukken zijn vaste tekst en welke stukken worden berekend?',explanation:'Backticks begrenzen een template. Een interpolatie voegt een expressie in de tekst in. Aanhalingstekens en backticks hebben niet dezelfde mogelijkheden.'},
 destructuring:{title:'Destructuring · gegevens uitpakken',definition:'Destructuring haalt onderdelen van een array of object op via een patroon.',question:'Werk je hier op basis van posities of op basis van eigenschapsnamen?',explanation:'Een arraypatroon volgt posities; een objectpatroon verwijst naar sleutels. Let op ontbrekende waarden, eventuele standaardwaarden en nieuwe namen binnen het bereik.'},
 selectors:{title:'Selectors · kiezen wat je vormgeeft',definition:'Een selector beschrijft welke HTML-elementen een CSS-regel selecteert.',question:'Selecteer je een soort element, een class, een id of een relatie tussen elementen?',explanation:'Een class kan door meerdere elementen gedeeld worden; een id hoort binnen het document uniek te zijn. Spaties en andere combinatoren drukken relaties uit en veranderen welke elementen geselecteerd worden.'},
 boxmodel:{title:'Boxmodel · inhoud, ruimte en rand',definition:'Een element heeft een inhoudsgebied, padding, een border en ruimte tot andere elementen.',question:'Welke ruimte zit binnen de rand en welke erbuiten? Wat betekent de ingestelde breedte hier?',explanation:'Box-sizing bepaalt hoe breedte en hoogte worden berekend. Let op de invloed van padding en borders; de uiteindelijke afmetingen hoeven niet gelijk te zijn aan alleen de inhoudsbreedte.'},
 units:{title:'Eenheden · afmetingen in context',definition:'Een eenheid geeft betekenis aan een getal, bijvoorbeeld een lengte of tijd.',question:'Moet deze maat vast zijn of meeschalen met tekst, ouder of venster?',explanation:'Relatieve en absolute eenheden reageren verschillend op hun omgeving. Controleer welke eenheid geldig is voor de eigenschap en wat er gebeurt bij inzoomen of een ander scherm.'},
 semantics:{title:'Semantische HTML · betekenis van een element',definition:'Semantische HTML beschrijft de rol van inhoud, zoals een hoofdtitel, navigatie of knop.',question:'Past de gekozen tag bij wat de inhoud doet, ook zonder vormgeving?',explanation:'Betekenis helpt browsers, hulpmiddelen en andere ontwikkelaars de pagina te begrijpen. Kies een element op basis van zijn rol; de vormgeving kun je met CSS bepalen.'},
 accessibility:{title:'Toegankelijkheid · informatie voor iedereen',definition:'Toegankelijke HTML maakt betekenis en bediening bruikbaar met verschillende hulpmiddelen.',question:'Is de functie of informatie ook duidelijk zonder de afbeelding of zonder een muis?',explanation:'Denk aan tekstalternatieven, herkenbare labels, toetsenbordbediening en een logische structuur. De juiste tekst hangt af van het doel en de context; een decoratieve afbeelding kan een leeg tekstalternatief hebben.'},
 styling:{title:'Opmaak · structuur en vormgeving scheiden',definition:'Een gedeelde class bundelt opmaak voor elementen met dezelfde rol.',question:'Kan deze directe opmaak naar een gedeelde CSS-class? Welke keuzes horen in CSS-variabelen?',explanation:'Een designsysteem bundelt afspraken over kleuren, typografie, afstanden en componenten. Inline opmaak en JavaScript-stijlen kunnen nuttig zijn voor dynamische waarden, maar verspreide vaste opmaak is moeilijker samen te wijzigen.'},
 functions:{title:'Functies · één duidelijke taak',definition:'Een functie bundelt stappen. Parameters zijn namen waarmee een functie gegevens ontvangt.',question:'Kun je de taak van deze functie in één zin beschrijven? Welke gegevens heeft ze nodig?',explanation:'Bij een aanroep geef je argumenten mee: de concrete gegevens. Een return geeft een resultaat terug aan de aanroeper. Een functie hoeft niet altijd een resultaat terug te geven.'},
 arrays:{title:'Arrays · een lijst gegevens',definition:'Een array bewaart een geordende lijst. De positie van een item heet de index.',question:'Wat stelt één item in deze lijst voor? Is de volgorde van belang?',explanation:'De eerste index is nul. Maak onderscheid tussen het aantal items en de index van het laatste item. Kies een bewerking op basis van wat je met de lijst wilt doen.'},
 objects:{title:'Objecten · gegevens groeperen',definition:'Een object groepeert eigenschappen: elke eigenschap heeft een sleutel en een waarde.',question:'Welke eigenschappen horen samen bij één ding? Hebben je namen een duidelijke betekenis?',explanation:'Een object beschrijft vaak één entiteit, zoals een leerling of product. Een array van objecten kan meerdere van zulke entiteiten bewaren.'},
 conditions:{title:'Voorwaarden · een keuze maken',definition:'Een voorwaarde bepaalt of een tak van je code wordt uitgevoerd.',question:'Wat gebeurt er als de voorwaarde waar is? En als ze onwaar is?',explanation:'Controleer ook grensgevallen, zoals nul, een lege invoer en een waarde precies op de grens. Meerdere voorwaarden kun je logisch combineren.'},
 loops:{title:'Lussen · stappen herhalen',definition:'Een lus voert stappen meermaals uit.',question:'Wat verandert na elke herhaling? Waardoor stopt de lus?',explanation:'Denk aan start, herhaling en stop. Bij het doorlopen van een verzameling helpt het om eerst te verwoorden wat er per item moet gebeuren.'},
 dom:{title:'DOM · de pagina als boom',definition:'Het DOM is de boomstructuur waarmee JavaScript HTML-elementen kan vinden en aanpassen.',question:'Zoek je één element of meerdere? Wat gebeurt er wanneer je niets vindt?',explanation:'Een selector beschrijft welk element je zoekt. Een gevonden element is een object waarmee je kunt werken. De pagina moet het element al bevatten op het moment van zoeken.'},
 json:{title:'JSON · gegevens uitwisselen',definition:'JSON is een tekstformaat voor gegevens, zoals objecten en lijsten.',question:'Werk je hier met tekst of al met een JavaScript-waarde?',explanation:'Omzetten tussen tekst en gegevens is een afzonderlijke stap. JSON-tekst heeft strikte schrijfregels. Niet elke geldige JavaScript-waarde kan rechtstreeks in JSON worden bewaard.'},
 async:{title:'Asynchroon · wachten op een resultaat',definition:'Een Promise vertegenwoordigt een resultaat dat later beschikbaar kan worden. Asynchrone code kan daarop wachten.',question:'Welke stap heeft het resultaat nodig? Wat doe je wanneer de bewerking mislukt?',explanation:'Netwerkverzoeken kunnen tijd kosten of mislukken. Houd rekening met laden, succes en fouten. Een antwoord van een server is niet automatisch een geslaagde bewerking.'},
 scope:{title:'Scope · waar een naam geldt',definition:'Scope is het deel van je programma waarin een naam toegankelijk is.',question:'Waar heb je deze variabele nodig? Kan ze dichter bij die plaats worden aangemaakt?',explanation:'Functies en blokken kunnen eigen bereiken vormen. Een plaatselijke naam hoeft buiten dat bereik niet beschikbaar te zijn. Beperk gedeelde toestand waar dat kan.'},
 layout:{title:'Layout · Flexbox en Grid',definition:'Flexbox organiseert meestal langs één hoofdrichting. Grid verdeelt ruimte in rijen en kolommen.',question:'Organiseer je een rij of kolom, of een raster? Wat gebeurt er op een smaller scherm?',explanation:'Kies de indeling op basis van de inhoud. Denk aan ruimte tussen onderdelen, uitlijning en het gedrag wanneer inhoud niet meer past.'},
 cascade:{title:'Cascade en overerving · welke stijl geldt?',definition:'De cascade bepaalt welke CSS-regel voorrang krijgt. Sommige eigenschappen erven hun waarde van een ouder.',question:'Welke regels beïnvloeden dit element? Kun je de gekozen waarde in de browserinspecteur verklaren?',explanation:'Onder meer oorsprong, belangrijkheid, lagen, specificiteit en volgorde spelen mee. Meer specificiteit of belangrijkheid toevoegen is niet altijd de beste oplossing.'},
 es6:{title:'ES6 · bereik van variabelen',definition:'Bereik (scope) betekent: waar in je code een variabele bruikbaar is.',question:'Moet deze variabele alleen binnen dit blok bestaan? Kan haar waarde later veranderen?',explanation:'ES6 voegde declaraties met blokbereik toe. Kies bewust op basis van bereik en veranderlijkheid; een oudere declaratie is niet automatisch fout.'},
 dry:{title:'DRY · herhaling onderzoeken',definition:'DRY betekent: dezelfde kennis op één plaats bewaren.',question:'Als je dit later wijzigt, moet je dan ook andere plaatsen aanpassen?',explanation:'Vergelijk de bedoeling van de herhaling. Een functie, gedeelde stijl of variabele kan helpen. Toevallig gelijke code hoeft niet altijd samen.'},
 tokens:{title:'Designsysteem · vaste ontwerpkeuzes',definition:'Een ontwerptoken is een naam voor een vaste keuze, zoals een kleur of afstand.',question:'Hebben deze herhaalde waarden dezelfde betekenis in je ontwerp?',explanation:'Met CSS-variabelen kun je gedeelde keuzes centraal beheren. Gelijke waarden kunnen ook verschillende bedoelingen hebben.'},
 bem:{title:'BEM · namen met een rol',definition:'BEM onderscheidt een zelfstandig blok, een onderdeel van dat blok en een variant.',question:'Kun je aan je classnamen zien wat bij elkaar hoort en wat een variant is?',explanation:'Een vaste naamafspraak maakt CSS beter leesbaar. BEM is één mogelijke afspraak, geen verplichte standaard.'},
 components:{title:'Componenten · herbruikbare onderdelen',definition:'Een component is een afgebakend onderdeel met een duidelijke taak.',question:'Komen hier onderdelen terug met dezelfde structuur en bedoeling?',explanation:'Bekijk of je ze samen kunt beheren. Een component heeft een duidelijke grens en kan gegevens ontvangen. Veel elementen alleen bewijzen niet dat een component nodig is.'},
 gestalt:{title:'Gestalt · visuele samenhang',definition:'Mensen zien vormen en groepen: nabijheid en gelijkenis helpen om samenhang te herkennen.',question:'Open de pagina. Staan dingen die bij elkaar horen dicht bij elkaar? Zien elementen met dezelfde functie er vergelijkbaar uit?',explanation:'Dit is een kijkvraag. De extensie ziet geen gerenderde pagina en beoordeelt geen visuele kwaliteit.'},
 events:{title:'Events · reageren op een actie',definition:'Een event is een gebeurtenis, bijvoorbeeld een klik. Een handler is code die erop reageert.',question:'Kun je benoemen welke actie je volgt en welke taak de handler uitvoert?',explanation:'Denk aan het onderscheid tussen een functie doorgeven en een functie meteen uitvoeren. Houd de taak van een handler overzichtelijk.'}
};
function analyze(text, language, options={}) {
 const maxBytes=options.maxBytes || 250000;
 if(text.length>maxBytes)return {issues:[],principles:[],notice:'Dit bestand is te groot voor de lokale analyse (limiet: '+maxBytes+' tekens).'};
 const issues=[], principles=[], ignored=new Set(options.ignoreWords||[]), seen=new Set(), seenPrinciples=new Set();
 function addIssue(item,offset=0){
  let start=Math.max(0,Math.min(Math.max(0,text.length-1),item.start+offset)),end=Math.min(text.length,Math.max(start+1,item.end+offset));
  const word=text.slice(start,end),key=(item.rule||item.kind)+':'+start;
  if(seen.has(key)||(item.ignorable!==false&&ignored.has(word)))return;
  seen.add(key);issues.push({...item,start,end,word});
 }
 function check(word,start,list,context,caseSensitive=true,reference=false){
  if(ignored.has(word))return;
  const kind=classify(word,list,caseSensitive); if(!kind)return;
  const hint=hints[reference?'reference':kind];
  let detail=hint[1],why='',steps=['Lees de gemarkeerde naam langzaam.','Vergelijk de naam met je cursus of de oorspronkelijke declaratie.'];
  if(kind==='separators'&&context==='CSS-eigenschap'){
   detail='Meerdelige standaard CSS-eigenschappen gebruiken doorgaans kleine letters met koppeltekens: kebab-case. Een spatie kan de naam opsplitsen; camelCase hoort vaak bij de JavaScript-weergave van zo’n eigenschap.';
   steps=['Verdeel de bedoelde eigenschap in woorden.','Controleer hoe de woorden in CSS verbonden zijn.','Vergelijk de volledige eigenschapsnaam met je cursus.'];
  }else if(kind==='case'&&['JavaScript-eigenschap','JavaScript-browserbegrip'].includes(context)){
   detail='JavaScript is hoofdlettergevoelig. Veel browsermethoden en eigenschappen gebruiken camelCase: het eerste woord begint klein en een volgend woord begint met een hoofdletter. Bestaande API-namen hebben een vaste schrijfwijze; je kunt die niet zelf kiezen.';
   why='De letters lijken op een bekend JavaScript-begrip, maar de hoofdletters komen niet overeen.';
   steps=['Verdeel de naam in betekenisvolle woorden.','Controleer de overgang tussen die woorden (camelCase).','Vergelijk daarna de volledige schrijfwijze met je cursus.'];
  }else if(kind==='order'){
   why='Deze naam lijkt op een bekend begrip, met mogelijk twee letters in een andere volgorde.';
   detail='Lees de naam in kleine stukken en wijs de letters één voor één aan. Controleer vooral de volgorde binnen elk stuk. De tool toont bewust geen vervangende naam.';
  }else if(reference){why='Deze naam lijkt op een declaratie die binnen dit bereik bestaat.';if(kind==='case')detail+=' Bij eigen namen kan camelCase de woordgrenzen zichtbaar maken. Gebruik op alle plaatsen exact de schrijfwijze van je declaratie.';}
  else if(context==='CSS-eigenschap'){
   detail+=' Een CSS-eigenschap benoemt wat je vormgeeft. Meerdelige standaardnamen gebruiken meestal kleine letters met koppeltekens (kebab-case).';
  }else if(context==='HTML-attribuut'){
   detail+=' Het attribuut is de naam vóór een eventuele koppeling met een waarde; controleer de waarde afzonderlijk.';
  }
  if(context==='JavaScript-eventnaam')detail+=' Browsergebeurtenissen hebben vaste namen. Zelfgemaakte events kunnen een andere, bewust gekozen naam hebben.';
  if(kind==='case'&&['JavaScript-eigenschap','JavaScript-browserbegrip'].includes(context))principle('naming',start,start+word.length,'Bij deze naam speelt de schrijfwijze van samengestelde woorden mee.');
  addIssue({start,end:start+word.length,context,kind:reference?'reference':kind,message:hint[0],detail,why,steps,ignorable:true});
 }
 function principle(id,start,end,reason){
  if(options.principles===false||seenPrinciples.has(id)||(options.disabledPrinciples||[]).includes(id))return;
  seenPrinciples.add(id);principles.push({id,start,end,reason,...concepts[id]});
 }
 function indentation(code,offset,starts){
  if(options.indentationHints===false)return;
  const prefixes=[];
  for(const pos of [...new Set(starts)]){
   const line=code.lastIndexOf('\n',pos-1)+1,prefix=code.slice(line,pos);
   if(/^[ \t]+$/.test(prefix))prefixes.push({line,prefix});
  }
  let bad=prefixes.find(x=>x.prefix.includes(' ')&&x.prefix.includes('\t'));
  if(!bad&&prefixes.some(x=>x.prefix.includes('\t'))&&prefixes.some(x=>x.prefix.includes(' ')))bad=prefixes.find(x=>x.prefix.includes('\t'));
  if(!bad)return;
  addIssue({start:offset+bad.line,end:offset+bad.line+bad.prefix.length,rule:'indentation-mixed',kind:'convention',context:'Inspringing · leesbaarheid',ignorable:false,display:bad.prefix.replace(/ /g,'·').replace(/\t/g,'⇥'),
   message:'Controleer of je tabs en spaties bewust combineert.',why:'Er zijn verschillende vormen van inspringing gevonden. Dit is op zichzelf geen syntaxfout in deze taal.',
   detail:'Inspringing maakt de structuur zichtbaar. Een tab kan in een andere editor anders breed zijn. Kies een consequente aanpak; tabs voor blokken en spaties voor uitlijning kunnen ook een bewuste afspraak zijn. In deze weergave staat · voor een spatie en ⇥ voor een tab.',
   steps:['Zet witruimteweergave aan in je editor.','Bekijk welke regels op hetzelfde niveau horen.','Volg de afgesproken inspringstijl van je project.']});
 }
 function js(code, offset=0){
  let ast,parseError=null;
  try{ast=acorn.parse(code,{ecmaVersion:'latest',sourceType:'module',ranges:true,allowAwaitOutsideFunction:true});}
  catch(error){
   parseError=error;
   try{const tok=acorn.tokenizer(code,{ecmaVersion:'latest'});for(let t=tok.getToken();t.type.label!=='eof';t=tok.getToken()){
    if(t.type.label==='name'&&keywordTypos.has(t.value))check(t.value,offset+t.start,keywords,'JavaScript-sleutelwoord');
   }}catch{/* A malformed token does not prevent recovery of later structures. */}
   try{ast=loose.parse(code,{ecmaVersion:'latest',sourceType:'module',ranges:true});}catch{return;}
  }
  const jsIssueStart=issues.length;
  const jsStarts=[];
  walk.full(ast,n=>{if(n.type.endsWith('Statement')||n.type.endsWith('Declaration'))jsStarts.push(n.start);});
  indentation(code,offset,jsStarts);
  if(parseError){
   const tokens=[];try{const t=acorn.tokenizer(code,{ecmaVersion:'latest'});for(let x=t.getToken();x.type.label!=='eof';x=t.getToken())tokens.push(x);}catch{}
   for(let i=0;i<tokens.length-3;i++){
    const [base,dot,first,second]=tokens.slice(i,i+4);
    if(dot.type.label!=='.'||first.type.label!=='name'||second.type.label!=='name'||!members[base.value])continue;
    const gap=code.slice(first.end,second.start);if(!/^[ \t]+$/.test(gap))continue;
    const joined=first.value+second.value;
    if(!members[base.value].some(x=>x.toLowerCase()===joined.toLowerCase()))continue;
    addIssue({start:offset+first.start,end:offset+second.end,rule:'js-split-name',kind:'syntax',context:'JavaScript · spatie in een naam',ignorable:false,
     message:'Hoort deze naam als één geheel bij elkaar?',detail:'Een spatie kan een JavaScript-naam in twee losse tokens verdelen. Samengestelde API-namen gebruiken vaak camelCase om woordgrenzen binnen één naam zichtbaar te maken.',
     steps:['Lees beide delen samen.','Controleer of je één methode bedoelt.','Bekijk hoe woordgrenzen in die vaste naam worden geschreven.']});
   }
  }
  let manager;
  try{manager=scope.analyze(ast,{ecmaVersion:2022,sourceType:'module',optimistic:false,ignoreEval:true});}catch{return;}
  const resolved=new Map();
  for(const s of manager.scopes)for(const r of s.references)resolved.set(r.identifier,r.resolved);
  function visible(s){const names=[];for(let p=s;p;p=p.upper)for(const v of p.variables)names.push(v.name);return names;}
  for(const s of manager.scopes)for(const r of s.references){
   if(r.resolved || r.identifier.name==='✖' || globals.includes(r.identifier.name))continue;
   const id=r.identifier, local=visible(s);
   if(classify(id.name,local))check(id.name,offset+id.start,local,'Naam in dit bereik',true,true);
   else check(id.name,offset+id.start,globals,'JavaScript-browserbegrip');
  }
  // Only infer known receivers; do not guess arbitrary object or library methods.
  function receiver(node,depth=0){
   if(!node||depth>6)return null;
   if(node.type==='ArrayExpression')return 'array';
   if(node.type==='Literal'&&typeof node.value==='string'||node.type==='TemplateLiteral')return 'string';
   if(node.type==='Identifier'){
    const variable=resolved.get(node);
    if(!variable && members[node.name])return node.name;
    if(variable && variable.defs.length===1){
     const def=variable.defs[0], init=def.node.init;
     if(def.type==='Variable' && init && variable.references.every(r=>!r.isWrite() || r.init))return receiver(init,depth+1);
    }return null;
   }
   if(node.type==='CallExpression' && node.callee.type==='MemberExpression'&&!node.callee.computed){
    const base=receiver(node.callee.object,depth+1),name=node.callee.property.name;
    if((base==='document'||base==='element')&&name==='querySelectorAll')return 'nodeList';
    if(base==='array'&&['map','filter','slice','concat','flat','flatMap','toSorted','toReversed','toSpliced'].includes(name))return 'array';
    if(base==='string'&&name==='split')return 'array';
    if(base==='Array'&&['from','of'].includes(name)||base==='Object'&&['keys','values','entries'].includes(name))return 'array';
    if((base==='document'||base==='element')&&['getElementById','querySelector','createElement'].includes(name))return 'element';
   }
   if(node.type==='MemberExpression'&&node.computed&&receiver(node.object,depth+1)==='nodeList'&&node.property.type==='Literal'&&Number.isInteger(node.property.value))return 'element';
   if(node.type==='MemberExpression'&&!node.computed){
    const base=receiver(node.object,depth+1),name=node.property.name;
    if(base==='document'&&['body','head','documentElement'].includes(name))return 'element';
    if(base==='element'&&['classList','style'].includes(name))return name;
   }return null;
  }
  function missingValue(start,end){
   const eq=code.indexOf('=',start);if(eq<0||eq>end)return;
   addIssue({start:offset+eq,end:offset+eq+1,rule:'js-assignment-value',kind:'syntax',context:'JavaScript-toekenning',ignorable:false,
    message:'Welke waarde wil je hier toekennen?',why:'Na deze toekenning ontbreekt een leesbare expressie.',
    detail:'Een toekenning verbindt een doel links met een waarde of berekening rechts. De puntkomma rondt een instructie af, maar levert zelf geen waarde.',
    steps:['Benoem wat links wordt aangepast.','Benoem wat rechts het resultaat moet leveren.','Controleer of die expressie volledig is.']});
  }
  function inspectStatements(n){
   for(let i=1;i<n.body.length;i++){
    const prev=n.body[i-1],next=n.body[i];
    if(prev.type!=='ExpressionStatement'||next.type!=='ExpressionStatement')continue;
    const exp=next.expression,left=exp.type==='AssignmentExpression'?exp.left:null;
    if(!left||left.type!=='Identifier'||resolved.get(left)||!(members.element.includes(left.name)||classify(left.name,members.element))||receiver(prev.expression)!=='element')continue;
    const semicolon=code.slice(prev.expression.end,prev.end).indexOf(';');if(semicolon<0)continue;
    check(left.name,offset+left.start,members.element,'JavaScript-eigenschap');
    const pos=prev.expression.end+semicolon;
    addIssue({start:offset+pos,end:offset+pos+1,rule:'js-member-separator',kind:'syntax',context:'JavaScript · toegang tot een eigenschap',ignorable:false,
     message:'Is deze instructie hier al afgelopen?',why:'Na het gevonden DOM-element staat een losse eigenschapsnaam die hier niet als variabele is gedeclareerd.',
     detail:'Een puntkomma (;) beëindigt een instructie. Een punt (.) verbindt een object met een eigenschap of methode. Na de puntkomma wordt de volgende naam zelfstandig gelezen.',
     steps:['Bepaal bij welk object de volgende eigenschap hoort.','Lees het leesteken tussen object en eigenschap.','Vraag je af of je verdergaat op hetzelfde object of een nieuwe instructie begint.']});
   }
  }
  const bodies=new Map();
  function explainNode(id,n,reason){principle(id,offset+n.start,offset+Math.min(n.end,n.start+20),reason);}
  function functionHint(n){explainNode('functions',n,'Er staat een functie in je code.');}
  function loopHint(n){explainNode('loops',n,'Er staat een herhalingsstructuur in je code.');}

  walk.simple(ast,{
   Program:inspectStatements,
   TemplateLiteral(n){explainNode('templates',n,'Er staat een template literal in je code.');},
   ObjectPattern(n){explainNode('destructuring',n,'Er wordt een object uitgepakt via een patroon.');},
   ArrayPattern(n){explainNode('destructuring',n,'Er wordt een array uitgepakt via een patroon.');},
   BinaryExpression(n){if(['==','===','!=','!=='].includes(n.operator))explainNode('equality',n,'Er worden waarden op gelijkheid of ongelijkheid vergeleken.');},
   FunctionDeclaration:functionHint, FunctionExpression:functionHint, ArrowFunctionExpression:functionHint,
   ArrayExpression(n){if(n.elements.length)explainNode('arrays',n,'Er wordt een array aangemaakt.');},
   ObjectExpression(n){if(n.properties.length)explainNode('objects',n,'Er wordt een object aangemaakt.');},
   IfStatement(n){
    explainNode('conditions',n,'Er staat een if-voorwaarde in je code.');
    if(n.test.type==='AssignmentExpression'&&n.test.operator==='='){
     const pos=code.indexOf('=',n.test.left.end);
     addIssue({start:offset+pos,end:offset+pos+1,rule:'js-condition-assignment',kind:'logic',context:'JavaScript · bedoeling controleren',ignorable:false,
      message:'Wil je hier toekennen of vergelijken?',why:'Deze voorwaarde bevat een toekenning. Dat is geldig, maar kan iets anders doen dan je bedoelt.',
      detail:'Toekennen verandert een waarde. Vergelijken onderzoekt een relatie tussen waarden. Een if beslist op basis van het resultaat van zijn voorwaarde.',
      steps:['Verwoord de voorwaarde in gewone taal.','Bepaal of je gegevens wilt veranderen of vergelijken.','Controleer of de gekozen operator die bedoeling uitdrukt.']});
    }
   },
   ConditionalExpression(n){explainNode('conditions',n,'Er staat een voorwaardelijke expressie in je code.');},
   ForStatement:loopHint, ForOfStatement:loopHint, ForInStatement:loopHint, WhileStatement:loopHint, DoWhileStatement:loopHint,
   AwaitExpression(n){explainNode('async',n,'Deze code wacht op een asynchroon resultaat.');},
   CallExpression(n){
    if(n.callee.type==='Identifier'&&n.callee.name==='fetch'&&!resolved.get(n.callee))explainNode('async',n,'Er wordt een netwerkverzoek gestart.');
    if(n.callee.type==='MemberExpression'&&!n.callee.computed){
     const base=receiver(n.callee.object),name=n.callee.property.name;
     if(base==='nodeList')explainNode('collections',n,'Je werkt met een verzameling DOM-elementen.');
     if((base==='array'||base==='nodeList')&&['map','filter','forEach','find','some','every','reduce'].includes(name))explainNode('callbacks',n,'Deze bewerking ontvangt doorgaans een callback.');
     if(['document','element','window'].includes(base)&&name==='addEventListener'){
      explainNode('callbacks',n,'Een eventlistener ontvangt een handler.');
      const event=n.arguments[0];
      if(event?.type==='Literal'&&typeof event.value==='string'&&/^[a-z]+$/i.test(event.value))check(event.value,offset+event.start+1,['click','dblclick','input','change','submit','keydown','keyup','load','DOMContentLoaded','mouseover','mouseout','mouseenter','mouseleave','focus','blur','scroll','resize','pointerdown','pointerup'],'JavaScript-eventnaam');
      if(n.arguments[1]?.type==='CallExpression')addIssue({start:offset+n.arguments[1].start,end:offset+n.arguments[1].end,rule:'js-handler-call',kind:'logic',context:'JavaScript · callback controleren',ignorable:false,
       message:'Wil je deze functie nu uitvoeren of later laten uitvoeren?',why:'Hier wordt een functie aangeroepen terwijl de eventlistener wordt ingesteld.',
       detail:'Een eventlistener verwacht een handler voor het moment van de gebeurtenis. Een aanroep voert de functie meteen uit en geeft haar resultaat door. Dat kan bewust zijn als het resultaat zelf weer een handler is.',
       steps:['Bepaal wanneer de functie moet lopen.','Controleer of je een functie of het resultaat van een aanroep doorgeeft.']});
     }
     if(base==='JSON'&&['parse','stringify'].includes(name))explainNode('json',n,'Er wordt tussen JSON-tekst en gegevens omgezet.');
     if(['document','element'].includes(base)&&['querySelector','querySelectorAll','getElementById','createElement'].includes(name))explainNode('dom',n,'Je zoekt of maakt een DOM-element.');
     if(base==='element'&&name==='setAttribute'&&n.arguments[0]?.value==='style')explainNode('styling',n,'JavaScript kent een style-attribuut toe.');
     if(base==='style'&&name==='setProperty')explainNode('styling',n,'JavaScript stelt rechtstreeks een CSS-eigenschap in.');
    }
   },
   AssignmentExpression(n){
    if(n.right.type==='Identifier'&&n.right.name==='✖')missingValue(n.left.end,n.end);

    if(n.left.type==='MemberExpression'&&(receiver(n.left.object)==='style'||(receiver(n.left.object)==='element'&&!n.left.computed&&n.left.property.name==='style')))explainNode('styling',n,'JavaScript kent rechtstreeks opmaak toe.');
   },
   MemberExpression(n){
    if(n.computed||n.property.end<=n.property.start)return;
    const type=receiver(n.object);
    if(type==='nodeList'&&members.element.includes(n.property.name)){
     explainNode('collections',n,'Een verzameling wordt benaderd alsof ze één element is.');
     addIssue({start:offset+n.property.start,end:offset+n.property.end,rule:'js-collection-member',kind:'logic',context:'JavaScript · verzameling',ignorable:false,
      message:'Werk je hier met één element of met meerdere?',why:'Het object is hier een NodeList; deze eigenschap hoort normaal bij een afzonderlijk element.',
      detail:'Een verzameling en haar items zijn verschillende objecten. Eerst moet duidelijk zijn op welk item, of op welke items, je een bewerking wilt uitvoeren.',steps:['Bekijk wat de selectie teruggeeft.','Bepaal of je één of meerdere elementen bedoelt.','Controleer op welk object de eigenschap wordt gebruikt.']});
    }
    if(type)check(n.property.name,offset+n.property.start,members[type],'JavaScript-eigenschap');
    if(n.property.name==='addEventListener')principle('events',offset+n.property.start,offset+n.property.end,'Er wordt een eventlistener gebruikt.');
   },
   VariableDeclarator(n){
    if(n.init?.type==='Identifier'&&n.init.name==='✖')missingValue(n.id.end,n.end);
   },
   VariableDeclaration(n){if(n.kind!=='var')explainNode('scope',n,'Er wordt een variabele met blokbereik gedeclareerd.');if(n.kind==='var')principle('es6',offset+n.start,offset+n.start+3,'Er staat een declaratie met var.');},
   BlockStatement(n){
    inspectStatements(n);
    if(parseError||n.body.length<3)return;
    // Compare token values, not whitespace/comments or location metadata.
    const tokens=[...acorn.tokenizer(code.slice(n.start,n.end),{ecmaVersion:'latest'})];
    const signature=JSON.stringify(tokens.map(t=>[t.type.label,t.value]));
    if(bodies.has(signature))principle('dry',offset+n.start,offset+n.start+1,'Een blok met minstens drie instructies komt letterlijk terug.');
    else bodies.set(signature,n.start);
   }
  });
  if(parseError&&!/Unterminated/.test(parseError.message)){
   const stack=[],pairs={')':'(',']':'[','}':'{'},tokenizer=acorn.tokenizer(code,{ecmaVersion:'latest'});let mismatch=null;
   try{for(let token=tokenizer.getToken();token.type.label!=='eof';token=tokenizer.getToken()){
    const label=token.type.label;
    if(['(','[','{','${'].includes(label))stack.push({label:label==='${'?'{':label,start:token.start,end:token.end});
    else if(pairs[label]){if(stack.at(-1)?.label===pairs[label])stack.pop();else{mismatch=token;break;}}
   }}catch{/* lexical errors already have their own explanation */}
   const unclosed=mismatch||stack.at(-1);
   if(unclosed){addIssue({start:offset+unclosed.start,end:offset+unclosed.end,rule:'js-delimiters',context:'JavaScript · bij elkaar horende tekens',kind:'syntax',ignorable:false,
    message:mismatch?'Controleer of dit sluitteken bij het openingsteken past.':'Controleer of dit openingsteken nog wordt afgesloten.',
    detail:'Ronde haakjes groeperen bijvoorbeeld argumenten of voorwaarden. Vierkante haakjes komen voor bij lijsten en toegang tot items. Accolades bakenen onder meer blokken en objecten af. Elk openingsteken moet het passende sluitteken krijgen, in de juiste volgorde.',
    steps:['Zoek het bijbehorende teken.','Controleer het soort haakje.','Werk van het binnenste paar naar buiten.']});}
  }
  if(parseError&&!issues.slice(jsIssueStart).some(x=>['js-assignment-value','js-delimiters','js-split-name'].includes(x.rule))&&!issues.some(x=>x.context==='JavaScript-sleutelwoord'&&x.start>=offset&&x.end<=offset+code.length)){
   const pos=Math.max(0,Math.min(code.length-1,parseError.pos||0));
   let message='Controleer de structuur rond deze plaats.',detail='De JavaScript-parser kan deze instructie niet volledig lezen. Het probleem kan ook vlak vóór de markering staan. Controleer de opbouw en bij elkaar horende tekens.';
   if(/Unterminated string|Unterminated template/.test(parseError.message)){message='Controleer de afsluiting van deze tekst.';detail='Een string of template heeft een begin- en eindteken. Controleer of hetzelfde soort aanhalingsteken wordt gebruikt en of een nieuwe regel is toegestaan.';}
   else if(/Unterminated comment/.test(parseError.message)){message='Controleer de afsluiting van dit commentaar.';detail='Een blokcommentaar blijft doorlopen tot de eindmarkering. Controleer of de volgende code buiten het commentaar hoort te staan.';}
   else if(/already been declared/.test(parseError.message)){message='Controleer of deze naam hier al gedeclareerd is.';detail='Sommige declaraties mogen dezelfde naam niet opnieuw invoeren in hetzelfde bereik. Vergelijk de declaraties en hun blokken.';}
   addIssue({start:offset+pos,end:offset+pos+1,rule:'js-parse',context:'JavaScript-structuur',kind:'syntax',ignorable:false,message,detail,
    steps:['Bekijk ook de instructie vóór de markering.','Controleer haakjes, aanhalingstekens en leestekens.','Werk één onvolledige instructie af en bekijk de hints opnieuw.']});
  }

 }
 function cssAnalyze(code,offset=0){
  for(const issue of cssSyntax(code))addIssue(issue,offset);
  let root;try{root=safeParse(code);}catch{return;}
  const cssStarts=[];root.walk(n=>{if(n.type!=='comment')cssStarts.push(n.source.start.offset);});indentation(code,offset,cssStarts);
  const values=new Map(),declarations=new Map();
  const customNames=[];root.walkDecls(d=>{if(d.prop.startsWith('--'))customNames.push(d.prop);});
  root.walkDecls(d=>{
   const start=d.source.start.offset;
   const rawName=d.prop+(d.raws.between||':').split(':')[0];
   if(/\s+[a-zA-Z]/.test(rawName)&&properties.includes(rawName.trim().replace(/\s+/g,'-').toLowerCase())){
    const end=offset+(d.source.end?.offset??start+d.toString().length)+1;
    for(let i=issues.length-1;i>=0;i--)if(issues[i].kind==='syntax'&&issues[i].start>=offset+start&&issues[i].start<=end)issues.splice(i,1);
    check(rawName,offset+start,properties,'CSS-eigenschap',false);
   }
   if(/\s/.test(d.prop)&&properties.includes(d.prop.trim().replace(/\s+/g,'-').toLowerCase())){
    const end=offset+(d.source.end?.offset??start+d.toString().length)+1;
    for(let i=issues.length-1;i>=0;i--)if(issues[i].kind==='syntax'&&issues[i].start>=offset+start&&issues[i].start<=end)issues.splice(i,1);
    check(d.prop,offset+start,properties,'CSS-eigenschap',false);
   }
   if(options.styleConventions!==false&&!d.prop.startsWith('--')&&properties.includes(d.prop.toLowerCase())&&d.prop!==d.prop.toLowerCase()){
    addIssue({start:offset+start,end:offset+start+d.prop.length,rule:'css-casing',context:'CSS · schrijfafspraak (geldige code)',kind:'convention',ignorable:true,
     message:'Gebruik een consistente schrijfwijze voor CSS-eigenschappen.',why:'Deze schrijfwijze werkt in CSS. Dit is een leesbaarheidsadvies, geen syntaxfout.',
     detail:'Standaard CSS-eigenschappen zijn niet hoofdlettergevoelig. De gebruikelijke afspraak is kleine letters en koppeltekens tussen woorden: kebab-case. In JavaScript gebruiken veel vergelijkbare namen camelCase. Eigen CSS-variabelen met -- zijn wél hoofdlettergevoelig.',
     steps:['Herken of je CSS of JavaScript schrijft.','Controleer of je naam dezelfde schrijfafspraak volgt als de rest van je stylesheet.']});
   }
   if(d.prop==='display'&&/^(inline-)?(flex|grid)$/.test(d.value))principle('layout',offset+start,offset+start+d.prop.length,'Deze regel kiest Flexbox of Grid.');
   if(d.important||['inherit','unset','revert','revert-layer'].includes(d.value))principle('cascade',offset+start,offset+start+d.prop.length,'Deze declaratie gebruikt belangrijkheid of een overervings-/cascadewaarde.');
   if(!d.prop.startsWith('--')&&!d.prop.startsWith('-'))check(d.prop,offset+start,properties,'CSS-eigenschap',false);
   const valueStart=start+d.prop.length+(d.raws.between||':').length;
   if(/^[a-z-]+$/i.test(d.value)&&cssValues.has(d.prop))check(d.value,offset+valueStart,cssValues.get(d.prop),'CSS-waarde',false);
   for(const m of d.value.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)){
    check(m[1],offset+valueStart+m.index+m[0].indexOf(m[1]),customNames,'CSS-variabele',true,true);
   }
   if(d.prop.startsWith('--'))return;
   valueParser(d.value).walk(token=>{
    if(token.type==='function'&&['url','var','env'].includes(token.value.toLowerCase()))return false;
    if(token.type!=='word')return;
    const dim=token.value.match(/^[+-]?(?:\d*\.)?\d+([a-zA-Z]+)$/);
    if(dim){
     const unit=dim[1],unitStart=offset+valueStart+token.sourceIndex+token.value.length-unit.length;
     if(unit==='p'||unit==='r')addIssue({start:unitStart,end:unitStart+unit.length,rule:'css-unit',kind:'letters',context:'CSS-eenheid',ignorable:true,message:'Controleer of de eenheid volledig is.',detail:'Een eenheid geeft aan hoe het getal wordt geïnterpreteerd. Controleer de letters van de eenheid en of die eenheid past bij de eigenschap.',steps:['Scheid het getal van de eenheid.','Zoek in je cursus welke maat je bedoelt.']});
     check(unit,unitStart,['px','em','rem','ex','ch','cap','ic','lh','rlh','vw','vh','vi','vb','vmin','vmax','svw','svh','lvw','lvh','dvw','dvh','cqw','cqh','cqi','cqb','cqmin','cqmax','cm','mm','in','pt','pc','Q','s','ms','deg','rad','grad','turn','Hz','kHz','dpi','dpcm','dppx','fr'],'CSS-eenheid',false);
    }
   });
   if(['width','height','margin','padding','gap','font-size','line-height'].includes(d.prop))principle('units',offset+start,offset+start+d.prop.length,'Deze declaratie bepaalt een afmeting of afstand.');
   if(['box-sizing','padding','border','margin'].includes(d.prop))principle('boxmodel',offset+start,offset+start+d.prop.length,'Deze declaratie beïnvloedt het boxmodel.');
   for(const m of d.value.matchAll(/#[a-f\d]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)|\b\d+(?:\.\d+)?(?:px|rem|em)\b/gi)){
    const key=m[0].toLowerCase();values.set(key,(values.get(key)||0)+1);
    if(values.get(key)>=3)principle('tokens',offset+valueStart+m.index,offset+valueStart+m.index+m[0].length,'Een kleur of afstand wordt minstens drie keer letterlijk gebruikt.');
   }
   const key=d.prop+':'+d.value;declarations.set(key,(declarations.get(key)||0)+1);
   if(declarations.get(key)>=3)principle('dry',offset+start,offset+start+d.prop.length,'Dezelfde CSS-eigenschap met dezelfde waarde komt minstens drie keer voor.');
  });
  root.walkRules(r=>{
   principle('selectors',offset+r.source.start.offset,offset+r.source.start.offset+r.selector.length,'Deze stijlregel selecteert HTML-elementen.');
   if(/\.[a-z_]/i.test(r.selector))principle('bem',offset+r.source.start.offset,offset+r.source.start.offset+r.selector.length,'Er worden classes als selectors gebruikt.');
  });
  if(root.nodes.length)principle('gestalt',offset,offset+Math.min(code.length,1),'Bekijk het resultaat van deze stijlen in de browser.');
 }
 function htmlAnalyze(code){
  for(const issue of htmlSyntax(code))addIssue(issue);
  const doc=html.TextDocument.create('file:///lesson.html','html',1,code), parsed=htmlService.parseHTMLDocument(doc);
  const scanner=htmlService.createScanner(code); let currentTag='';
  for(let token=scanner.scan();token!==html.TokenType.EOS;token=scanner.scan()){
   const word=scanner.getTokenText(),start=scanner.getTokenOffset();
   if(token===html.TokenType.StartTag||token===html.TokenType.EndTag){
    currentTag=word.toLowerCase();
    if(!word.includes('-'))check(word,start,tagNames,'HTML-tag',false);
   }
   if(token===html.TokenType.AttributeName){
    if(word.toLowerCase()==='style')principle('styling',start,start+word.length,'Dit HTML-element bevat directe opmaak in een style-attribuut.');
    if(/^(data-|aria-|@|:|v-|\[|\()/i.test(word)||currentTag.includes('-'))continue;
    if(!/^[a-zA-Z][\w-]*$/.test(word))continue;
    check(word,start,htmlData.provideAttributes(currentTag).map(a=>a.name),'HTML-attribuut',false);
   }
  }
  const htmlStarts=[];
  const tagCounts=new Map();
  function visit(node){
   htmlStarts.push(node.start);if(node.endTagStart!=null)htmlStarts.push(node.endTagStart);
   const tag=(node.tag||'').toLowerCase();
   if(['main','nav','article','section','button','h1','h2'].includes(tag))principle('semantics',node.start,node.start+tag.length+1,'Deze tag geeft de inhoud een betekenisvolle rol.');
   if(['img','input','select','textarea','button'].includes(tag))principle('accessibility',node.start,node.start+tag.length+1,'Dit element vraagt aandacht voor tekstalternatieven of bediening.');
   if(tag==='img'&&node.attributes&&!Object.keys(node.attributes).some(k=>k.toLowerCase()==='alt'))addIssue({start:node.start,end:node.start+4,rule:'html-image-alt',kind:'logic',context:'HTML · toegankelijkheid',ignorable:false,
    message:'Welke informatie draagt deze afbeelding?',why:'Bij deze afbeelding is geen alt-attribuut gevonden.',detail:'Een tekstalternatief beschrijft de relevante informatie of functie. Een decoratieve afbeelding kan een bewust leeg alternatief hebben. Een ontbrekend alternatief is iets anders dan een leeg alternatief.',steps:['Bepaal de functie van de afbeelding.','Bepaal wat iemand zonder beeld moet weten.','Controleer hoe je die bedoeling in het attribuut uitdrukt.']});
   if(tag==='script'&&node.startTagEnd!=null){
    const type=(node.attributes?.type||'').replace(/^['"]|['"]$/g,'').toLowerCase();
    if(!type||['module','text/javascript','application/javascript'].includes(type))js(code.slice(node.startTagEnd,node.endTagStart??node.end),node.startTagEnd);
   }else if(tag==='style'&&node.startTagEnd!=null)cssAnalyze(code.slice(node.startTagEnd,node.endTagStart??node.end),node.startTagEnd);
   else{
    if(['article','section','li','button'].includes(tag)){
     tagCounts.set(tag,(tagCounts.get(tag)||0)+1);
     if(tagCounts.get(tag)>=3)principle('components',node.start,node.start+(node.tag||'').length+1,'Hetzelfde soort HTML-element komt minstens drie keer voor; onderzoek of de bedoeling ook gelijk is.');
    }
    for(const child of node.children||[])visit(child);
   }
  }
  for(const node of parsed.roots)visit(node);
  indentation(code,0,htmlStarts);
  if(parsed.roots.length)principle('gestalt',0,Math.min(code.length,1),'Open de HTML-pagina om de groepering te bekijken.');
 }
 if(language==='javascript')js(text);
 else if(language==='css')cssAnalyze(text);
 else if(language==='html')htmlAnalyze(text);
 for(const issue of issues){
  const names={case:'Hoofdletters',order:'Lettervolgorde',chunks:'Volgorde van woorddelen',missing:'Ontbrekende letter',extra:'Extra letter',repeated:'Herhaalde letter',shape:'Gelijkende tekens',separators:'Woordgrenzen',reference:'Naam consequent overnemen',letters:'Letters vergelijken',syntax:'Structuur en leestekens',convention:'Schrijfafspraak',logic:'Bedoeling controleren'};
  issue.family=names[issue.kind]||'Aandachtspunt';
 }
 const limit=Math.max(1,Math.min(options.maxHints||8,100));
 issues.sort((a,b)=>a.start-b.start);
 const maxPrinciples=Math.max(1,Math.min(options.maxPrinciples||8,30));
 const priority=['styling','tokens','dry','es6'];
 principles.sort((a,b)=>(priority.includes(a.id)?priority.indexOf(a.id):10)-(priority.includes(b.id)?priority.indexOf(b.id):10));
 return {issues:issues.slice(0,limit),principles:principles.slice(0,maxPrinciples),principleNotice:principles.length>maxPrinciples?`Eerst ${maxPrinciples} ideeën. Je kunt het maximum verhogen in de instellingen.`:'',total:issues.length,notice:issues.length>limit?`Er zijn meer aandachtspunten. Eerst deze ${limit}; de rest verschijnt na je aanpassingen.`:''};
}
module.exports={analyze,distance,classify,concepts};

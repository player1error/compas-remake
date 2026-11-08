# Detectiedekking — CodeKompas 0.2.0

De tool geeft mogelijke aandachtspunten. Onderstaande lijst beschrijft de implementatie; het is geen claim dat alle fouten in deze talen worden gevonden.

## JavaScript

- Bekende browsernamen en geselecteerde eigenschappen: kleine letterafwijkingen, omwisselingen, herhaalde/ontbrekende/extra letters, hoofdletters, bepaalde gelijkende tekens en woordgrenzen.
- Namen vergelijken met declaraties in het actuele lexicale bereik. Geen vergelijking met namen uit een willekeurige andere functie.
- Ontvangerherkenning voor bekende globals, eenvoudige DOM-selecties, DOM-variabelen, classList, style, arrays, strings en NodeLists. Hertoewijzing of schaduwen van globals beperkt de herkenning.
- Enkele veelvoorkomende verkeerd getypte sleutelwoorden, bij code die niet normaal parseert.
- Herstelparser: verder analyseren na een syntaxfout; onvolledige toekenning met ontbrekende expressie krijgt een eigen hint.
- Gerichte hints voor onvolledige strings/templates/comments, dubbele declaraties en niet-passende haakjes. Andere parsefouten krijgen een algemenere structuurhint zonder rauwe parseroplossing.
- Puntkomma na een herkende DOM-expressie, gevolgd door een niet-gedeclareerde bekende of sterk gelijkende elementeigenschap: onderzoeksvraag over toegang tot een eigenschap versus nieuwe instructie.
- Twee door horizontale witruimte gescheiden delen van een herkenbare vaste methode bij een bekende ontvanger: vraag over een gesplitste naam. Alleen bij parsefouten.
- Toekenning als volledige if-voorwaarde: vraag naar toekennen versus vergelijken; expliciet benoemd als mogelijk geldige code.
- Herkende NodeList met een eigenschap van een enkel element: vraag over één of meerdere elementen.
- Eventnamen nabij een beperkte lijst standaardevents: mogelijke spellinghint; zelfgemaakte events blijven mogelijk.
- Aanroep doorgegeven als eventhandler: vraag of het resultaat of de functie bedoeld is; een functie die een handler teruggeeft kan bewust zijn.

## HTML

- Bekende tagnamen en attributen; HTML-hoofdletters op zichzelf gelden niet als fout.
- Dubbele punt na attribuutnaam gevolgd door een geciteerde waarde: specifieke uitleg over de koppeling naam–waarde.
- Geciteerde waarde na attribuutnaam zonder toekenning.
- Ontbrekende attribuutwaarde, ontbrekende ruimte tussen attributen, onverwachte tekens in attribuutnaam of ongeciteerde waarde.
- Onvolledige aanhalingstekens, tagafsluiting en commentaar.
- Attributen of onjuiste zelfsluitstructuur in een eindtag.
- Dubbele attributen in één starttag.
- Dubbele niet-lege ids binnen het geparseerde fragment; inactieve template-inhoud wordt overgeslagen.
- Binnenste, verplicht te sluiten elementen die nog openstaan als hun ouder wordt gesloten. Optionele HTML-eindtags worden daarbij overgeslagen. Geen volledige HTML-contentmodelvalidator.
- Afbeelding zonder alt-attribuut: vraag over betekenis en tekstalternatief. Leeg alt is geldig voor passende decoratieve afbeeldingen.
- JavaScript in normale scriptblokken en CSS in styleblokken; posities blijven naar het HTML-bestand verwijzen.

## CSS

- Bekende eigenschapsnamen, eenvoudige bekende keywordwaarden en plaatselijke verwijzingen naar gedeclareerde custom properties.
- CamelCase/underscore/spatie waar een bekende standaard eigenschapsnaam met koppeltekens wordt vermoed.
- Standaardeigenschap met hoofdletters: uitschakelbaar schrijfadvies, geen syntaxfout. Custom properties blijven hoofdlettergevoelig.
- Ontbrekende dubbele punt, puntkomma tussen declaraties, waarde, accolade, functiehaakje of selectorhaakje.
- Geselecteerde parserproblemen met getallen, voorwaarden, mediaqueries, variabelenamen, lijsten en tekstwaarden.
- Onvolledige strings en commentaar via aanvullende strikte parsing.
- Geselecteerde fouten in hexkleur-/kleurfuncties voor zover de taalservice ze meldt.
- Kleine afwijkingen van bekende eenheden; daarnaast de vermoedelijk onvolledige eenheden p/r. Niet elke onbekende of ongeschikte eenheid wordt herkend.
- Waardescanning slaat strings, comments en de inhoud van url(), var() en env() over voor eenheidstypo’s.

## Inspringing en bediening

- Gemengde tabs/spaties in code-inspringing als uitschakelbaar leesbaarheidsadvies. Geen algemene formattering of verplichte hoeveelheid spaties.
- Per hint: categorie, plaats, korte aanwijzing, eventuele aanleiding, uitleg en denkstappen.
- Het negeren van een naam geldt alleen voor daarvoor geschikte naam-/conventiehints. Syntaxtekens kunnen niet met de naamknop globaal verborgen worden.
- Toon meer verhoogt het aantal zichtbare hints voor het huidige bestand, tot maximaal 100. De eerste limiet blijft instelbaar.

## Contextkaarten

Dertig onderwerpen: naamconventies; callbacks; één element/verzameling; vergelijken; template literals; destructuring; selectors; boxmodel; eenheden; semantiek; toegankelijkheid; gedeelde opmaak; functies; arrays; objecten; voorwaarden; lussen; DOM; JSON; asynchroon werken; scope; layout; cascade; ES6; DRY; ontwerptokens; BEM; componenten; Gestalt; events.

Kaarten verschijnen op basis van concrete syntactische signalen, niet op basis van bewezen pedagogische noodzaak. Bij acht of meer toepasselijke onderwerpen kan de ingestelde limiet een selectie tonen. Met maxPrinciples kun je tot dertig kaarten toelaten. Gestalt blijft een kijkvraag, geen beoordeling van het gerenderde ontwerp.

## Niet gedekt

- Geen projectbrede koppeling van losse HTML/CSS/JS-bestanden.
- Geen algemene spellingscontrole van natuurlijke taal, comments of tekstinhoud.
- Geen volledige type-inferentie, runtime-analyse, frameworkondersteuning of bewijs dat een programma werkt.
- Geen automatische foutdiagnose op basis van dyslexie en geen leerlingprofilering.
- Inline style-attributen leveren nog geen aparte CSS-spellinganalyse; inline eventhandlers worden niet als JavaScript geanalyseerd.
- Niet elke syntaxfout krijgt een unieke uitleg. Ernstig beschadigde code kan herstel bemoeilijken; meldingen zijn dan voorlopig.

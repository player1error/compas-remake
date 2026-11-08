# CodeKompas · leren zonder voorzeggen

Een Nederlandstalige VS Code-extensie voor leerlingen die ondersteuning willen bij het lezen en schrijven van HTML, CSS en JavaScript. Ontworpen met aandacht voor leerlingen met dyslexie: korte aanwijzingen, extra uitleg op verzoek, beperkte aantallen en geen automatische correctie.

**Versie 0.2.0 — uitgebreid na praktijktests en feedback.** De analyse, distributiebundel en interface-interacties zijn automatisch getest. De gebruiker bevestigde de werking van de vorige versie in VS Code; de uitgebreidere versie moet nog in de klas worden uitgeprobeerd. De extensie stelt geen diagnose en is niet als bewezen dyslexie-interventie gevalideerd.

## Bijwerken vanaf 0.1.0

Installeer de nieuwe VSIX via **Extensies → … → Install from VSIX…**. Verwijderen van de oude versie is normaal niet nodig: de publisher en extensienaam zijn hetzelfde. Herlaad het venster wanneer VS Code dat vraagt. Controleer op de extensiepagina dat **0.2.0** staat.

Open daarna **Ctrl+Shift+P → CodeKompas: Open leerhulp**. Het luik opent niet vanzelf.

## Nieuw in 0.2.0

- Javascriptanalyse gaat verder met een herstellende parser wanneer een deel van het bestand onvolledig is.
- Gerichte uitleg over camelCase, kebab-case, woordgrenzen, letters, leestekens, haakjes, tags, ontbrekende waarden en inspringing.
- `class:` met een waarde wordt als attribuutkoppeling herkend; niet meer als verkeerd gespelde attribuutnaam.
- Een vermoedelijk onderbroken DOM-keten, zoals een losse eigenschap na een puntkomma, krijgt een gerichte onderzoeksvraag.
- Geldige CSS-hoofdletters krijgen optioneel leesbaarheidsadvies; ze worden niet als syntaxfout voorgesteld.
- Uitklapbare patroonwijzer in de dyslexietab, categorieën per hint, aanleiding en stappen om zelf na te lopen.
- **Toon meer** ontsluit meer gevonden aandachtspunten zonder projectinstellingen te wijzigen (tot 100 tegelijk).
- Aanvullende herkenning van arrays, strings, NodeLists, events, callbacks, dubbele HTML-ids, nesting en diverse CSS-syntaxproblemen.
- Dertig mogelijke contextkaarten. Zie **TRIGGERS.md** voor dekking en **PATROONWIJZER.md** voor de pedagogische onderbouwing.

## Installeren

1. Download `codekompas-0.2.0.vsix` naar je computer.
2. Open VS Code (versie 1.85 of hoger).
3. Open **Extensions / Extensies** via de zijbalk.
4. Klik bovenaan op **…** en kies **Install from VSIX… / Installeren vanuit VSIX…**.
5. Kies het gedownloade bestand. Herlaad VS Code als daarom wordt gevraagd.
6. Open een `.html`, `.css` of `.js`-bestand. Klik op het **kompas** in de activiteitenbalk, of voer **CodeKompas: Open leerhulp** uit via het opdrachtenpalet.

Een Marketplace-account, API-sleutel, abonnement of Node.js-installatie is niet nodig om de VSIX te gebruiken. De extensie staat niet op de Marketplace; de publishernaam in het pakket is een lokale pakketidentificatie.

De map `examples` in het broncodepakket bevat opzettelijke fouten om de hints te testen. Lees daar `LEESMIJ.md`.

## Tab 1 — Dyslexie · codehulp

Dit is de standaardtab. Ze blijft gescheiden van de theorie.

- Markeert **mogelijke** typefouten met informatieve meldingen in de editor.
- Toont korte Nederlandstalige aanwijzingen over letters, lettervolgorde en hoofdletters.
- Vergelijkt verkeerd overgenomen variabelenamen met declaraties binnen hetzelfde bereik.
- Geeft extra uitleg pas wanneer de leerling **Een extra aanwijzing** opent.
- **Bekijk in mijn code** springt naar de relevante plaats.
- **Deze naam is bewust zo geschreven** negeert die exacte naam in de huidige werkruimte.
- Een pauzeknop zet de hints tijdelijk stil.
- Standaard verschijnen maximaal acht hints per bestand, na 900 ms rust tijdens het typen. Je kunt dit lager instellen.

**CodeKompas geeft geen juiste vervangende spelling, geen verbeterde code en geen automatische correctie.** Het registreert geen codeacties, aanvullingen of herschrijfacties. Het wijzigt geen leerlingbestanden. Andere extensies en de ingebouwde VS Code-taalondersteuning kunnen zelf wel oplossingen of aanvullingen tonen; CodeKompas schakelt die niet uit.

### Wat wordt gecontroleerd?

| Code | Ondersteuning |
| --- | --- |
| HTML | Mogelijke typefouten, attribuutkoppelingen, taggrenzen, aanhalingstekens, dubbele attributen/ids en bepaalde nestingsproblemen |
| CSS | Eigenschapsnamen, schrijfafspraken, declaratie- en blokstructuur, bekende eenvoudige waarden en sommige eenheidstypo’s; verwijzingen naar CSS-variabelen die in dezelfde stylesheet gedeclareerd zijn |
| JavaScript | Bekende browserbegrippen, geselecteerde eigenschappen van bekende browserobjecten, eenvoudige DOM-/array-/stringvariabelen, namen binnen hetzelfde lexicale bereik en gerichte structuurcontroles |
| HTML met script/style | JavaScript in gewone scriptblokken en CSS in styleblokken, met posities in het HTML-bestand |
| Onvolledige JavaScript | Foutherstel met gerichte syntaxhints; herkenbare delen blijven geanalyseerd worden, zonder garantie dat alle fouten tegelijk gevonden worden |

De vergelijking zoekt een kleine afwijking, waaronder één verwisseling van aangrenzende letters. Het is een gerichte controle, geen volledige compiler of woordenboek. Namen die correct gedeclareerd zijn worden niet op Nederlandse spelling beoordeeld. Niet iedere schrijffout is een aanwijzing voor dyslexie; de categorieën beschrijven de code, niet de leerling. Een bewuste naam kan toevallig lijken op een bekend begrip: daarom zijn de meldingen voorzichtig en kunnen leerlingen namen negeren.

## Tab 2 — Programmeerprincipes

Dit aparte, uitschakelbare luik toont conceptkaarten op basis van concrete code in het huidige bestand. Elke kaart bevat:

1. Het begrip in eenvoudige woorden.
2. De aanleiding in de code.
3. Een denk- of onderzoeksvraag.
4. Extra uitleg die je kunt openklappen.

| Aanleiding | Uitleg of suggestie |
| --- | --- |
| `var` | ES6, veranderlijkheid en blokbereik |
| Declaratie met blokbereik | Scope: waar een naam toegankelijk is |
| Functie | Taak, parameters, argumenten en resultaat |
| Array / object | Lijsten, indexen, sleutels en waarden |
| Voorwaarde / lus | Keuzes, grensgevallen, herhalen en stoppen |
| DOM-selectie | Pagina als boom, één of meerdere elementen, niets gevonden |
| Eventlistener | Gebeurtenis, handler en een functie doorgeven |
| JSON-bewerking | Verschil tussen tekst en gegevens |
| `await` of ingebouwde `fetch` | Asynchroon resultaat, wachten en fouten |
| Dezelfde kleur of afstand minstens drie keer in één CSS-blok/bestand | CSS-variabelen en gedeelde ontwerptokens |
| Inline `style` of directe DOM-opmaak via JavaScript | Gedeelde classes, scheiding van structuur en opmaak, designsysteem |
| Herhaalde CSS-declaraties of letterlijk gelijke JS-blokken met minstens drie instructies | DRY: herhaling onderzoeken |
| CSS-classselector | BEM: blok, onderdeel, variant |
| Herhaalde `article`, `section`, `li` of `button` | Onderzoeken of componenten zinvol zijn |
| Flexbox / Grid | Layout en gedrag bij een smaller scherm |
| `!important` of bepaalde overervingswaarden | Cascade, overerving en specificiteit |
| HTML of CSS | Gestalt: visueel groeperen, nabijheid en gelijkenis |

Een conceptkaart is **geen foutmelding**. Een herhaling hoeft niet verkeerd te zijn. Inline opmaak kan een bedoeling hebben. Bij BEM en componenten gaat het om reflectie, niet om een verplichte architectuur. Gestalt is een kijkvraag voor de browser: deze extensie ziet de gerenderde pagina niet.

## Instellen voor jouw leerlingen

Open **Instellingen** in het luik, of zoek `CodeKompas` in de VS Code-instellingen. Je kunt dezelfde instellingen vastleggen in `.vscode/settings.json` van een lesproject.

```json
{
  "codekompas.maxHints": 3,
  "codekompas.delay": 1200,
  "codekompas.principles": true,
  "codekompas.maxPrinciples": 5,
  "codekompas.disabledPrinciples": ["gestalt", "bem"],
  "codekompas.ignoreWords": []
}
```

- `enabled`: zet de hele ondersteuning aan of uit.
- `styleConventions`: optioneel advies over hoofdletters in standaard CSS-eigenschappen.
- `indentationHints`: optioneel advies over gemengde tabs en spaties in code-inspringing.
- `principles`: schakelt uitsluitend de conceptkaarten uit; dyslexiehints blijven actief.
- `maxHints`: 1–100; standaard 8.
- `delay`: 200–5000 ms; standaard 900.
- `maxPrinciples`: 1–30; standaard 8. Ontwerp-/verbetersuggesties krijgen voorrang op algemene uitleg.
- `disabledPrinciples`: kies concepten in de instellingen die nog niet aan bod hoeven te komen.
- `ignoreWords`: bewuste namen, exact en hoofdlettergevoelig.
- `maxCharacters`: maximum bestandsgrootte in tekens; standaard 250.000.

De opdracht **CodeKompas: Herstel genegeerde woorden** herstelt namen die via de knop zijn genegeerd. Namen in `ignoreWords` wijzig je via instellingen. De pauzestand is tijdelijk en wordt bij een nieuwe extensiesessie hersteld.

Het luik gebruikt de kleuren en het lettertype van het VS Code-thema, heeft toetsenbordbedienbare knoppen en uitklapbare uitleg, en gebruikt tekst naast kleur. Er wordt geen specifiek ‘dyslexielettertype’ opgelegd en er is geen voorleesfunctie inbegrepen.

## Grenzen van deze versie

- Controle per bestand, zonder projectbrede koppeling tussen HTML, CSS en JavaScript.
- Geen spellingcontrole van Nederlandse of Engelse proza in comments, strings of zichtbare HTML-tekst.
- Geen volledige JavaScript-typeservice; willekeurige bibliotheken, methoden op onbekende objecten, stringselectors en dynamische propertynamen worden niet geraden.
- TypeScript, JSX, React, Vue, SCSS en andere talen zijn niet ondersteund.
- CSS in inline style-attributen levert een ontwerpkaart op, maar krijgt geen aparte spellinganalyse; inline eventhandlers worden niet geanalyseerd.
- De CSS-waardevergelijking geldt voor bekende eenvoudige keywords. Ontwerptokens herkennen herhaalde hex-/rgb-/hsl-kleuren en px/rem/em-afstanden; niet iedere mogelijke kleur- of afstandsnotatie.
- Custom-elementnamen, `data-*`, `aria-*` en frameworkattributen worden bewust overgeslagen om onterechte hints te beperken.
- De herstellende JS-parser kan niet elk beschadigd fragment betrouwbaar reconstrueren. Bij zware syntaxfouten kunnen verdere hints ontbreken of voorlopig zijn.
- De tool toetst geen leerresultaten, kent geen punten toe en houdt geen leerlingdossier bij.

## Gegevens en werking

Alle analyse gebeurt in de VS Code-extension host. Er zijn geen modelaanroepen, uploads, tracking of telemetrie vanuit CodeKompas. Bij een remote VS Code-omgeving kan die host op de remote computer draaien. De extensie voert de bekeken code niet uit en opent geen netwerkverbindingen. Alleen genegeerde woorden worden in de werkruimteopslag van VS Code bewaard; analyse-uitkomsten blijven in het geheugen.

## Zelf ontwikkelen

Gebruik Node.js 24 LTS voor de ontwikkeltools. De gebundelde extensie richt zich op de Node 18-runtime van de minimale VS Code-versie.

```sh
npm ci
npm test
npm run bundle
npm run package
```

Voor debuggen: open deze map in VS Code, voer `npm run bundle` uit en start daarna **CodeKompas testen** met F5. Pas na wijzigingen de bundel opnieuw aan. De F5-configuratie opent de voorbeeldmap in een Extension Development Host.

- `src/analyzer.js`: zuivere detectie, patrooncategorieën en Nederlandstalige conceptkaarten.
- `src/syntax.js`: HTML- en CSS-structuurcontroles.
- `src/patterns.js`: compacte patroonwijzer in de dyslexietab.
- `src/extension.js`: VS Code-integratie, levenscyclus, instellingen en meldingen.
- `media/panel.js` en `media/panel.css`: de twee tabs.
- `test/`: detectietests, nagebootste VS Code-host en DOM-tests.
- `dist/extension.js`: zelfstandig pakket met runtime-afhankelijkheden.
- `THIRD_PARTY_NOTICES.txt`: licenties van meegebundelde onderdelen.

Nieuwe principes voeg je toe aan `concepts` en aan een passende parserregel. Voeg de ID ook toe aan de instellingen en test zowel de aanleiding als situaties waarin het principe niet hoort te verschijnen.

## Bronnen voor de implementatie

- VS Code Extension Manifest: https://code.visualstudio.com/api/references/extension-manifest
- VS Code Extension API: https://code.visualstudio.com/api/references/vscode-api
- VS Code Webview API: https://code.visualstudio.com/api/extension-guides/webview
- HTML- en CSS-vocabularia: meegebundelde Microsoft VS Code language services.

MIT-licentie voor de eigen broncode. Licenties van afhankelijkheden staan in `THIRD_PARTY_NOTICES.txt`.

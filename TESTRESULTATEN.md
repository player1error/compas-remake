# Verificatie — CodeKompas 0.2.0

Datum: 22 oktober 2026.

## Uitgevoerd

- 127 automatische tests met Node.js 24.19.0: geslaagd.
- Detectie: alle concrete gebruikersvoorbeelden, parserherstel, tekens/structuur, letter-/woordpatronen, CSS-conventies, eventnamen, arrays/strings/NodeLists, inspringing, scope, uitsluitingen en Unicode/CRLF-posities.
- Aanvullende paneel-/hosttests voor Toon meer, een ingeklapte patroonwijzer, denkstappen en het niet globaal kunnen negeren van syntaxtekens.
- Pedagogische controles: geen vervangende spelling in hintpayloads, afzonderlijk uitschakelbare principes, begrensde hints, relevante conceptaanleidingen.
- VS Code-API nagebootst: activering, diagnostiek, pauze, negeren/herstellen, vertraging, sluiten, navigatie en weigeren van verouderde berichten.
- DOM-tests met jsdom: dyslexietab als starttab, uitklapbare aanwijzingen, tabwissel, veilige tekstweergave en knoppen.
- Zelfstandige distributiebundel geladen zonder externe npm-runtime-imports; HTML-, CSS- en JavaScript-analyse via de nagebootste host gecontroleerd.
- VSIX gemaakt met de officiële `@vscode/vsce`-packager; manifest, entrypoint en bundelinhoud gecontroleerd.

Een pakkettest vond een probleem met dynamische imports in de UMD-variant van de taalservices. De bundel gebruikt nu hun ESM-ingangen; de distributiebundeltest slaagt na deze correctie.

## Nog niet uitgevoerd

De gebruiker bevestigde de werking van 0.1.0 in een echte VS Code-sessie. Voor 0.2.0 staat hier geen werkende VS Code-desktopinstallatie. Er is dus geen echte Extension Development Host gestart en geen handmatige controle op Windows/macOS/Linux uitgevoerd. jsdom controleert interactie en DOM, geen visuele rendering. Ook schermlezergebruik en lespraktijk zijn nog niet gevalideerd.

## Praktijkcontrole op de eigen computer

1. Installeer de VSIX en open de voorbeeldmap.
2. Controleer dat de standaardtab **Dyslexie · codehulp** is.
3. Open de voorbeelden en volg een hint via **Bekijk in mijn code**.
4. Verbeter een fout; controleer na de rusttijd dat de melding verdwijnt.
5. Negeer een naam, herlaad het venster en herstel de genegeerde namen via het opdrachtenpalet.
6. Schakel principes uit; controleer dat de dyslexiehints blijven werken.
7. Bedien de tabs en uitklapbare aanwijzingen met het toetsenbord; bekijk ook een licht en hoogcontrastthema.
8. Laat een leerling met eigen code proberen en bespreek begrijpelijkheid, onterechte hints, hoeveelheid informatie en zelfstandig verbeteren.

Deze controle is bedoeld als acceptatietest. De automatische tests bewijzen geen onderwijskundig effect.

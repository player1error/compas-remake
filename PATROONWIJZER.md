# Patroonwijzer — CodeKompas 0.2.0

## Wat we meenemen uit dyslexieondersteuning

Dyslexie kan samengaan met aanhoudende moeilijkheden bij lezen en spellen. De uiting verschilt tussen personen. De British Dyslexia Association noemt bij volwassenen onder meer wisselende spelling, moeite met snel tekst doorzoeken, herlezen en overbelasting bij veel instructies. Dit ondersteunt onze keuze om korte hints te geven en extra uitleg pas op verzoek te tonen. Het bewijst niet dat een specifieke programmeerfunctie effectief is.

De International Dyslexia Association beschrijft spellingproblemen als taalgerelateerde moeilijkheden. Omkeringen van letters of lettervolgorde mogen niet worden voorgesteld als bewijs dat iemand letters letterlijk gespiegeld ziet. Niet iedereen met dyslexie verwisselt letters; zulke fouten kunnen ook bij anderen voorkomen.

Daarom is dit een **lijst van codepatronen en ondersteuningskeuzes**, geen lijst waarmee CodeKompas dyslexie vaststelt. De vertaling naar programmeercode hieronder is een didactische ontwerpkeuze die met leerlingen geëvalueerd moet worden.

## De lijst verwerkt in de tool

| Patroon / behoefte | Wat CodeKompas 0.2.0 doet | Gerichte hulp |
| --- | --- | --- |
| Verwisselde aangrenzende letters | Vergelijkt namen met bekende termen en zichtbare declaraties | Lees de naam per woorddeel; controleer de volgorde |
| Ontbrekende letter | Geeft een specifieke categorie als één duidelijke nabijgelegen naam past | Vergelijk per deel of alle letters aanwezig zijn |
| Extra letter | Herkent bepaalde toevoegingen tegenover een unieke nabije naam | Loop de letters afzonderlijk na |
| Herhaalde letter | Onderscheidt een mogelijke onbedoelde dubbele letter | Dubbele letters kunnen ook correct zijn; vergelijk met de bron |
| Gelijkende letter/cijfertekens | Onderscheidt een beperkt stel verwisselingen bij een duidelijke vergelijking | Bekijk vorm en context, zonder een oorzaak toe te schrijven |
| Omgewisselde woorddelen | Vergelijkt herkenbare delen van samengestelde namen | Lees de betekenis en volgorde van de volledige naam |
| Hoofdletters | Herkent afwijkingen in vaste JavaScript-namen en verwijzingen | Legt hoofdlettergevoeligheid en waar relevant camelCase uit |
| Verkeerde verbinding tussen woorddelen | Herkent sommige camelCase/kebab-case/underscore- en spatieproblemen | Legt uit welke afspraak bij taal en naam hoort |
| Onbedoelde spatie | Herkent specifieke gesplitste vaste JS-methoden en CSS-eigenschappen | Onderzoek of je één naam of twee losse onderdelen bedoelt |
| Onjuiste scheidingstekens | Controleert onder meer HTML-attribuutkoppelingen, CSS-declaraties en vermoedelijke DOM-ketens | Legt de rollen van =, :, ; en . uit, zonder de regel te herschrijven |
| Ontbrekende afsluiting | Controleert haakjes, quotes, commentaar, taggrenzen en sommige nestingsproblemen | Werk van een opening naar de bijbehorende afsluiting |
| Naam verschillend overgenomen | Vergelijkt onopgeloste JS-namen met declaraties in hetzelfde bereik en CSS-variabelen in dezelfde stylesheet | Vergelijk bron en gebruik, inclusief hoofdletters |
| Inspringing onoverzichtelijk | Signaleert gemengde tabs/spaties in geanalyseerde code-inspringing | Leesbaarheidsadvies, geen syntaxfout; maakt witruimte zichtbaar met · en ⇥ |
| Veel informatie tegelijk | Beperkt het eerste aantal hints; uitleg en patroonwijzer zijn uitklapbaar | Eén aandachtspunt kiezen; met Toon meer doorgaan |
| Moeilijke vaktaal | Biedt dertig contextgebonden conceptkaarten met betekenis, aanleiding, vraag en uitleg | Bouwt vaktaal op tijdens het werken |

De lettervergelijking is conservatief. Bij meerdere aannemelijke termen blijft de formulering algemener. Lange reeksen willekeurige afwijkingen, fonetische spelling en alle mogelijke dubbele-letterpatronen worden niet volledig herkend.

## Grenzen bij spaties en inspringing

Een spatie kan een naam verbreken, maar kan op veel andere plaatsen juist toegestaan zijn. Spaties in gewone tekst, strings en comments worden niet als taalfout behandeld. De controle van gesplitste JavaScript-methoden geldt voor herkenbare vaste ontvangers, niet voor elke projectvariabele.

Inspringing verandert in deze drie talen doorgaans niet de betekenis. Tabs combineren met spaties kan een bewuste afspraak zijn, bijvoorbeeld voor uitlijning. De hint stelt daarom een vraag. CodeKompas bepaalt niet voor elk blok hoeveel spaties ideaal zijn en herschikt geen code.

## Praktisch inzetten

Begin met drie tot vijf hints tegelijk als een leerling veel meldingen krijgt. Laat de leerling eerst de korte aanwijzing gebruiken, daarna eventueel de uitleg en denkstappen. Vraag of de hulp duidelijk is en of de leerling de fout zelfstandig kan verklaren. Kies het aantal hints op basis van de leerling; een diagnose bepaalt niet automatisch welke instellingen passend zijn.

Een melding verdwijnt wanneer de aanleiding niet meer gevonden wordt. Dat is geen bewijs dat de hele oplossing correct is. De tool registreert geen dyslexieprofiel, stelt geen diagnose, kent geen punten toe en bewaart geen foutgeschiedenis van leerlingen.

## Bronnen

Geraadpleegd op 22 oktober 2026:

- British Dyslexia Association — What is dyslexia? https://www.bdadyslexia.org.uk/dyslexia/about-dyslexia/what-is-dyslexia
- British Dyslexia Association — Signs of dyslexia (adult): https://www.bdadyslexia.org.uk/advice/adults/am-i-dyslexic/signs-of-dyslexia
- International Dyslexia Association — Spelling: https://dyslexiaida.org/spelling/
- IDA New Jersey — What is Dyslexia?: https://nj.dyslexiaida.org/what-is-dyslexia/

Deze bronnen onderbouwen de algemene aandacht voor lees-/spellingondersteuning en individuele verschillen. Ze valideren niet de specifieke detectieregels van deze extensie.

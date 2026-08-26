import type { LocaleContent } from "./types.ts";

export const content: LocaleContent = {
  keys: [
    "FUNKE",
    "FLAMME",
    "KNOTEN",
    "SPIEGEL",
    "SPIRALE",
    "LEXIKON",
    "GRÜBELN",
    "TIEFGANG",
    "STREICHE",
    "AUSDAUER",
    "DRAHTSEIL",
    "SCHLAUKOPF",
  ],
  decoys: [
    "GIRAFFE", "TEPPICH", "KAKTUS", "ANANAS", "VULKAN", "PINGUIN", "KÜRBIS",
    "IGLU", "ZEBRA", "KAMEL", "LOKOMOTIVE", "TULPE", "KOFFER", "BANANE",
    "TRAKTOR", "WALNUSS", "SOFA", "PYRAMIDE", "HAMSTER", "LEUCHTTURM",
  ],
  campaign: {
    star: {
      title: "Gutes Blatt",
      pivot: "BLATT",
      categories: [
        { name: "Teile eines Baums", words: ["AST", "WURZEL", "RINDE"] },
        { name: "Beim Kartenspiel", words: ["ASS", "KÖNIG", "DAME"] },
        { name: "In der Zeitung", words: ["SCHLAGZEILE", "ARTIKEL", "KOLUMNE"] },
        { name: "Schreibwaren", words: ["HEFT", "STIFT", "LINEAL"] },
      ],
      accept: ["BLÄTTER"],
    },
    trunk: {
      title: "Beflügelt",
      pivot: "FLÜGEL",
      categories: [
        { name: "Am Vogel", words: ["SCHNABEL", "FEDER", "KRALLE"] },
        { name: "Tasteninstrumente", words: ["KLAVIER", "ORGEL", "CEMBALO"] },
        { name: "Am Fenster", words: ["RAHMEN", "SCHEIBE", "GRIFF"] },
        { name: "Positionen im Fußball", words: ["STÜRMER", "TORWART", "LIBERO"] },
      ],
    },
    ring: {
      title: "Ring frei!",
      pivot: "RING",
      categories: [
        { name: "Schmuck", words: ["KETTE", "ARMBAND", "BROSCHE"] },
        { name: "Kampfstätten", words: ["ARENA", "KÄFIG", "MATTE"] },
        { name: "Runde Formen", words: ["KREIS", "REIFEN", "KRANZ"] },
        { name: "Kriminelle Vereinigungen", words: ["BANDE", "KARTELL", "MAFIA"] },
      ],
    },
    bug: {
      title: "Bunter Strauß",
      pivot: "STRAUSS",
      categories: [
        { name: "Große Vögel", words: ["EMU", "PFAU", "KIWI"] },
        { name: "Beim Floristen", words: ["ROSE", "NELKE", "LILIE"] },
        { name: "Komponisten", words: ["MOZART", "BACH", "WAGNER"] },
        { name: "Auseinandersetzung", words: ["STREIT", "KAMPF", "FEHDE"] },
      ],
    },
    bank: {
      title: "Die Bank gewinnt",
      pivot: "BANK",
      categories: [
        { name: "Sitzmöbel", words: ["STUHL", "HOCKER", "SESSEL"] },
        { name: "Geldgeschäfte", words: ["KONTO", "KREDIT", "ZINSEN"] },
        { name: "Im Kasino", words: ["ROULETTE", "CROUPIER", "JETON"] },
        { name: "Im seichten Wasser", words: ["RIFF", "UNTIEFE", "WATT"] },
      ],
    },
    stick: {
      title: "Über Stock und Stein",
      pivot: "STOCK",
      categories: [
        { name: "Gehhilfen", words: ["KRÜCKE", "STAB", "STÜTZE"] },
        { name: "Teile eines Hauses", words: ["KELLER", "GIEBEL", "TREPPE"] },
        { name: "Bei den Bienen", words: ["WABE", "DROHNE", "HONIG"] },
        { name: "Im Weinberg", words: ["REBE", "TRAUBE", "WINZER"] },
      ],
    },
    cap: {
      title: "Unter einer Decke",
      pivot: "DECKE",
      categories: [
        { name: "Im Bett", words: ["KISSEN", "LAKEN", "MATRATZE"] },
        { name: "Teile eines Zimmers", words: ["WAND", "BODEN", "TÜR"] },
        { name: "Auf dem Esstisch", words: ["TELLER", "SERVIETTE", "VASE"] },
        { name: "Auf der Straße", words: ["ASPHALT", "TEER", "PFLASTER"] },
      ],
    },
    bat: {
      title: "Zu Tisch!",
      pivot: "TAFEL",
      categories: [
        { name: "Im Klassenzimmer", words: ["KREIDE", "SCHWAMM", "PULT"] },
        { name: "Naschzeug", words: ["PRALINE", "BONBON", "LAKRITZ"] },
        { name: "Festessen", words: ["BANKETT", "GELAGE", "SCHMAUS"] },
        { name: "Hinweise am Wegesrand", words: ["SCHILD", "PLAKAT", "WEGWEISER"] },
      ],
    },
    club: {
      title: "Kreuz und quer",
      pivot: "KREUZ",
      categories: [
        { name: "Kartenfarben", words: ["PIK", "HERZ", "KARO"] },
        { name: "Notenschrift", words: ["NOTE", "PAUSE", "SCHLÜSSEL"] },
        { name: "In der Kirche", words: ["ALTAR", "KANZEL", "ORGEL"] },
        { name: "Auszeichnungen", words: ["ORDEN", "MEDAILLE", "POKAL"] },
      ],
    },
    spring: {
      title: "Der Ton macht die Musik",
      pivot: "TON",
      categories: [
        { name: "Zum Formen und Modellieren", words: ["LEHM", "GIPS", "KNETE"] },
        { name: "Musikalische Begriffe", words: ["MELODIE", "AKKORD", "RHYTHMUS"] },
        { name: "Farbnuancen", words: ["FARBE", "NUANCE", "SCHIMMER"] },
        { name: "Am Filmset", words: ["KAMERA", "SCHNITT", "REGIE"] },
      ],
    },
    cell: {
      title: "Zellteilung",
      pivot: "ZELLE",
      categories: [
        { name: "Im Körper", words: ["NEURON", "GEWEBE", "MEMBRAN"] },
        { name: "Im Gefängnis", words: ["GITTER", "WÄRTER", "HÄFTLING"] },
        { name: "Stromquellen", words: ["BATTERIE", "AKKU", "DYNAMO"] },
        { name: "Im Kloster", words: ["MÖNCH", "ABT", "KAPELLE"] },
      ],
    },
    chip: {
      title: "Scheibchenweise",
      pivot: "SCHEIBE",
      categories: [
        { name: "Aufschnitt", words: ["WURST", "KÄSE", "SCHINKEN"] },
        { name: "Am Fenster", words: ["RAHMEN", "VORHANG", "GRIFF"] },
        { name: "Tonträger", words: ["PLATTE", "CD", "KASSETTE"] },
        { name: "Beim Bogenschießen", words: ["PFEIL", "BOGEN", "KÖCHER"] },
      ],
    },
    wave: {
      title: "Wellengang",
      pivot: "WELLE",
      categories: [
        { name: "Am Meer", words: ["FLUT", "GISCHT", "BRANDUNG"] },
        { name: "Beim Radio", words: ["FREQUENZ", "SENDER", "ANTENNE"] },
        { name: "Frisuren", words: ["LOCKE", "ZOPF", "DUTT"] },
        { name: "Plötzlich ganz viel davon", words: ["SCHUB", "ANSTURM", "SCHWALL"] },
      ],
    },
    glass: {
      title: "Zum Wohl!",
      pivot: "GLAS",
      categories: [
        { name: "Trinkgefäße", words: ["BECHER", "TASSE", "KRUG"] },
        { name: "Zerbrechliche Materialien", words: ["PORZELLAN", "KERAMIK", "KRISTALL"] },
        { name: "Optische Geräte", words: ["FERNROHR", "LUPE", "MIKROSKOP"] },
        { name: "Eingemachtes", words: ["MARMELADE", "GURKEN", "HONIG"] },
      ],
    },
    bark: {
      title: "Hahn im Korb",
      pivot: "HAHN",
      categories: [
        { name: "Auf dem Bauernhof", words: ["HENNE", "SCHWEIN", "ZIEGE"] },
        { name: "Beim Klempner", words: ["ROHR", "VENTIL", "SPÜLE"] },
        { name: "Teile einer Pistole", words: ["LAUF", "ABZUG", "MAGAZIN"] },
        { name: "Auf dem Kirchturm", words: ["GLOCKE", "UHR", "SPITZE"] },
      ],
    },
    step: {
      title: "Schritt für Schritt",
      pivot: "SCHRITT",
      categories: [
        { name: "Tanzbewegungen", words: ["DREHUNG", "SPRUNG", "HÜPFER"] },
        { name: "An der Hose", words: ["BUND", "SAUM", "NAHT"] },
        { name: "Abschnitt eines Vorgangs", words: ["PHASE", "ETAPPE", "STADIUM"] },
        { name: "Gangarten des Pferdes", words: ["TRAB", "GALOPP", "TÖLT"] },
      ],
    },
    fire: {
      title: "Feuer und Flamme",
      pivot: "FEUER",
      categories: [
        { name: "Es brennt", words: ["FLAMME", "GLUT", "BRAND"] },
        { name: "Begeisterung", words: ["EIFER", "LEIDENSCHAFT", "ELAN"] },
        { name: "Beim Schießen", words: ["SALVE", "SCHUSS", "KUGEL"] },
        { name: "Zum Anzünden", words: ["STREICHHOLZ", "ZUNDER", "LUNTE"] },
      ],
    },
    block: {
      title: "Am Block",
      pivot: "BLOCK",
      categories: [
        { name: "Schreibpapier", words: ["KLADDE", "HEFT", "BOGEN"] },
        { name: "Im Stadtviertel", words: ["STRASSE", "GASSE", "ALLEE"] },
        { name: "Politische Bündnisse", words: ["ALLIANZ", "PAKT", "KOALITION"] },
        { name: "Brocken", words: ["KLOTZ", "QUADER", "KLUMPEN"] },
      ],
    },
    crane: {
      title: "Auf Lager",
      pivot: "LAGER",
      categories: [
        { name: "Beim Camping", words: ["ZELT", "SCHLAFSACK", "ISOMATTE"] },
        { name: "In der Warenhalle", words: ["REGAL", "PALETTE", "GABELSTAPLER"] },
        { name: "Maschinenteile", words: ["ACHSE", "ZAHNRAD", "KOLBEN"] },
        { name: "Biersorten", words: ["PILS", "WEIZEN", "KÖLSCH"] },
      ],
    },
    bolt: {
      title: "Wie der Blitz",
      pivot: "BLITZ",
      categories: [
        { name: "Beim Gewitter", words: ["DONNER", "REGEN", "STURM"] },
        { name: "Kamerazubehör", words: ["OBJEKTIV", "STATIV", "AUSLÖSER"] },
        { name: "Sehr schnell", words: ["RASANT", "FLINK", "ZÜGIG"] },
        { name: "Schachbegriffe", words: ["MATT", "ROCHADE", "GAMBIT"] },
      ],
    },
    pen: {
      title: "Aus dem Stift",
      pivot: "STIFT",
      categories: [
        { name: "Schreibgeräte", words: ["FÜLLER", "KREIDE", "MARKER"] },
        { name: "Kleinteile im Werkzeugkasten", words: ["SCHRAUBE", "NIET", "DÜBEL"] },
        { name: "Neu im Betrieb", words: ["AZUBI", "LEHRLING", "ANFÄNGER"] },
        { name: "Kirchliche Einrichtungen", words: ["KLOSTER", "ABTEI", "KONVENT"] },
      ],
    },
    check: {
      title: "Alle Karten auf den Tisch",
      pivot: "KARTE",
      categories: [
        { name: "Zur Orientierung", words: ["ATLAS", "KOMPASS", "GLOBUS"] },
        { name: "Beim Skat", words: ["BUBE", "TRUMPF", "STICH"] },
        { name: "Im Restaurant", words: ["KELLNER", "TRINKGELD", "RECHNUNG"] },
        { name: "Am Geldautomaten", words: ["PIN", "BARGELD", "KONTOSTAND"] },
      ],
    },
    track: {
      title: "Auf der Spur",
      pivot: "SPUR",
      categories: [
        { name: "Was der Detektiv findet", words: ["INDIZ", "HINWEIS", "BEWEIS"] },
        { name: "Eine winzige Menge", words: ["HAUCH", "PRISE", "ANFLUG"] },
        { name: "Im Tonstudio", words: ["MISCHPULT", "AUFNAHME", "MIKROFON"] },
        { name: "Auf der Autobahn", words: ["AUSFAHRT", "RASTHOF", "STANDSTREIFEN"] },
      ],
    },
    note: {
      title: "Eine Note besser",
      pivot: "NOTE",
      categories: [
        { name: "Musikalisches", words: ["TAKT", "KLANG", "TONART"] },
        { name: "In der Schule", words: ["ZEUGNIS", "PRÜFUNG", "LEHRER"] },
        { name: "Zahlungsmittel", words: ["SCHEIN", "MÜNZE", "BARGELD"] },
        { name: "Im Parfüm", words: ["DUFT", "AROMA", "ESSENZ"] },
      ],
    },
    rock: {
      title: "Stein auf Stein",
      pivot: "STEIN",
      categories: [
        { name: "Am Berg", words: ["FELS", "KIESEL", "GERÖLL"] },
        { name: "Edles Geschmeide", words: ["DIAMANT", "RUBIN", "SAPHIR"] },
        { name: "Beim Brettspiel", words: ["FIGUR", "WÜRFEL", "BRETT"] },
        { name: "Baumaterial", words: ["ZIEGEL", "MÖRTEL", "BETON"] },
      ],
    },
    park: {
      title: "Platz da!",
      pivot: "PLATZ",
      categories: [
        { name: "Mitten in der Stadt", words: ["RATHAUS", "BRUNNEN", "DENKMAL"] },
        { name: "Im Theater", words: ["SITZ", "REIHE", "LOGE"] },
        { name: "Siegertreppchen", words: ["GOLD", "SILBER", "BRONZE"] },
        { name: "Für den Sport", words: ["RASEN", "TRIBÜNE", "TOR"] },
      ],
    },
    roll: {
      title: "Eine Rolle spielen",
      pivot: "ROLLE",
      categories: [
        { name: "Beim Theater", words: ["DREHBUCH", "CASTING", "PREMIERE"] },
        { name: "Aufgewickelt gekauft", words: ["TAPETE", "KLEBEBAND", "GARN"] },
        { name: "Beim Bodenturnen", words: ["RAD", "HANDSTAND", "SALTO"] },
        { name: "Von Bedeutung", words: ["GEWICHT", "BELANG", "RELEVANZ"] },
      ],
    },
    table: {
      title: "Zug um Zug",
      pivot: "ZUG",
      categories: [
        { name: "Es zieht", words: ["WIND", "BRISE", "HAUCH"] },
        { name: "Beim Schach", words: ["OPFER", "GAMBIT", "REMIS"] },
        { name: "Beim Militär", words: ["KOMPANIE", "BATAILLON", "TRUPP"] },
        { name: "Im Gesicht", words: ["FALTE", "GRÜBCHEN", "MIENE"] },
      ],
    },
    sheet: {
      title: "Den Bogen raus",
      pivot: "BOGEN",
      categories: [
        { name: "Beim Schützen", words: ["PFEIL", "KÖCHER", "ZIEL"] },
        { name: "In der Architektur", words: ["GEWÖLBE", "SÄULE", "PORTAL"] },
        { name: "Aus Papier", words: ["ZETTEL", "KARTON", "PERGAMENT"] },
        { name: "Beim Streicher", words: ["SAITE", "STEG", "KOLOPHONIUM"] },
      ],
    },
    seal: {
      title: "Am laufenden Band",
      pivot: "BAND",
      categories: [
        { name: "Zum Verpacken", words: ["SCHLEIFE", "SCHNUR", "KORDEL"] },
        { name: "In der Bibliothek", words: ["BUCH", "AUSGABE", "FOLIANT"] },
        { name: "Musikgruppe", words: ["TRIO", "QUARTETT", "COMBO"] },
        { name: "Im Knie", words: ["MENISKUS", "SEHNE", "KNORPEL"] },
      ],
    },
    pipe: {
      title: "Nach meiner Pfeife",
      pivot: "PFEIFE",
      categories: [
        { name: "Rauchzubehör", words: ["TABAK", "ZIGARRE", "FEUERZEUG"] },
        { name: "Teile der Orgel", words: ["TASTE", "PEDAL", "REGISTER"] },
        { name: "Taugt nichts (umgangssprachlich)", words: ["NIETE", "VERSAGER", "LUSCHE"] },
        { name: "Ausrüstung des Schiedsrichters", words: ["KARTE", "STOPPUHR", "MÜNZE"] },
      ],
    },
    fry: {
      title: "Messe gelesen",
      pivot: "MESSE",
      categories: [
        { name: "In der Kirche", words: ["PREDIGT", "GEBET", "HOSTIE"] },
        { name: "Auf dem Ausstellungsgelände", words: ["STAND", "AUSSTELLER", "BESUCHER"] },
        { name: "Auf dem Schiff", words: ["KOMBÜSE", "KAJÜTE", "DECK"] },
        { name: "Kirchenmusik", words: ["REQUIEM", "ORATORIUM", "KANTATE"] },
      ],
    },
    pound: {
      title: "Krone der Schöpfung",
      pivot: "KRONE",
      categories: [
        { name: "Königliche Insignien", words: ["ZEPTER", "THRON", "HERMELIN"] },
        { name: "Beim Zahnarzt", words: ["FÜLLUNG", "BOHRER", "PLOMBE"] },
        { name: "Am Baum", words: ["STAMM", "ZWEIG", "LAUB"] },
        { name: "Währungen", words: ["RUBEL", "ZLOTY", "FORINT"] },
      ],
    },
    well: {
      title: "Guter Stoff",
      pivot: "STOFF",
      categories: [
        { name: "Beim Schneider", words: ["SEIDE", "LEINEN", "WOLLE"] },
        { name: "Im Chemielabor", words: ["ELEMENT", "MOLEKÜL", "VERBINDUNG"] },
        { name: "Für den Unterricht", words: ["LEKTION", "KAPITEL", "THEMA"] },
        { name: "Ideen für den Roman", words: ["HANDLUNG", "PLOT", "VORLAGE"] },
      ],
    },
    scale: {
      title: "Karriereleiter",
      pivot: "LEITER",
      categories: [
        { name: "Hilft nach oben", words: ["GERÜST", "TRITT", "STIEGE"] },
        { name: "Ganz oben in der Firma", words: ["CHEF", "BOSS", "DIREKTOR"] },
        { name: "Leitet Strom gut", words: ["KUPFER", "SILBER", "ALUMINIUM"] },
        { name: "TON + ___", words: ["ART", "BAND", "FALL"] },
      ],
    },
    spell: {
      title: "Kopf hoch",
      pivot: "KOPF",
      categories: [
        { name: "Im Gesicht", words: ["NASE", "KINN", "WANGE"] },
        { name: "Wer die Gruppe führt", words: ["ANFÜHRER", "LENKER", "OBERHAUPT"] },
        { name: "Was im Schädel steckt", words: ["GRIPS", "VERSTAND", "HIRN"] },
        { name: "Beim Münzwurf", words: ["ZAHL", "MÜNZE", "WURF"] },
      ],
    },
    date: {
      title: "An die Wurzel",
      pivot: "WURZEL",
      categories: [
        { name: "Pflanzenteile", words: ["STÄNGEL", "BLÜTE", "KNOSPE"] },
        { name: "Im Matheunterricht", words: ["QUADRAT", "POTENZ", "BRUCH"] },
        { name: "Wo etwas herkommt", words: ["HERKUNFT", "URSPRUNG", "ANFANG"] },
        { name: "Am Zahn", words: ["SCHMELZ", "NERV", "KIEFER"] },
      ],
    },
    press: {
      title: "Unter Druck",
      pivot: "DRUCK",
      categories: [
        { name: "Physik", words: ["KRAFT", "DICHTE", "REIBUNG"] },
        { name: "In Gutenbergs Werkstatt", words: ["SETZER", "LETTER", "TINTE"] },
        { name: "Belastung", words: ["STRESS", "ZWANG", "HETZE"] },
        { name: "An der Wand", words: ["POSTER", "PLAKAT", "GRAFIK"] },
      ],
    },
    clip: {
      title: "Guter Schnitt",
      pivot: "SCHNITT",
      categories: [
        { name: "Beim Friseur", words: ["FRISUR", "SCHERE", "FÖHN"] },
        { name: "Im Filmstudio", words: ["REGIE", "MONTAGE", "SZENE"] },
        { name: "Durchschnitt", words: ["MITTEL", "NORM", "MEDIAN"] },
        { name: "Beim Chirurgen", words: ["SKALPELL", "NAHT", "NARBE"] },
      ],
    },
    pitch: {
      title: "Im Takt",
      pivot: "TAKT",
      categories: [
        { name: "Musik", words: ["RHYTHMUS", "TEMPO", "METRUM"] },
        { name: "Feingefühl", words: ["ANSTAND", "RÜCKSICHT", "DISKRETION"] },
        { name: "Im Motor", words: ["ZYLINDER", "KOLBEN", "VENTIL"] },
        { name: "Bus und Bahn", words: ["FAHRPLAN", "HALTESTELLE", "ABFAHRT"] },
      ],
    },
    jam: {
      title: "In der Klemme",
      pivot: "KLEMME",
      categories: [
        { name: "Im Werkzeugkasten", words: ["ZWINGE", "SCHELLE", "ZANGE"] },
        { name: "In Schwierigkeiten", words: ["NOTLAGE", "ZWICKMÜHLE", "BREDOUILLE"] },
        { name: "Für die Frisur", words: ["SPANGE", "HAARREIF", "ZOPFGUMMI"] },
        { name: "An der Batterie", words: ["POL", "KABEL", "KONTAKT"] },
      ],
    },
    drop: {
      title: "Schuss ins Blaue",
      pivot: "SCHUSS",
      categories: [
        { name: "Beim Jäger", words: ["GEWEHR", "PATRONE", "ZIELFERNROHR"] },
        { name: "Auf dem Fußballplatz", words: ["ELFMETER", "FLANKE", "FREISTOSS"] },
        { name: "Ein kleiner Zusatz", words: ["SPRITZER", "SCHLUCK", "TROPFEN"] },
        { name: "In der Weberei", words: ["KETTE", "WEBSTUHL", "FADEN"] },
      ],
    },
    crash: {
      title: "Bruchlandung",
      pivot: "BRUCH",
      categories: [
        { name: "Beim Orthopäden", words: ["GIPS", "SCHIENE", "RÖNTGEN"] },
        { name: "Im Matheheft", words: ["ZÄHLER", "NENNER", "DEZIMAL"] },
        { name: "Beziehungsende", words: ["TRENNUNG", "SCHEIDUNG", "ABSCHIED"] },
        { name: "Feuchtes Gelände", words: ["MOOR", "SUMPF", "MARSCH"] },
      ],
    },
    palm: {
      title: "Wer zuerst kommt, mahlt zuerst",
      pivot: "MÜHLE",
      categories: [
        { name: "Mahlen", words: ["MEHL", "KORN", "MÜLLER"] },
        { name: "Brettspiele", words: ["DAME", "SCHACH", "HALMA"] },
        { name: "Alte Autos", words: ["KARRE", "KISTE", "GURKE"] },
        { name: "Immer dasselbe", words: ["ROUTINE", "TROTT", "ALLTAG"] },
      ],
    },
    light: {
      title: "Kerzengerade",
      pivot: "KERZE",
      categories: [
        { name: "Spendet Licht", words: ["LAMPE", "LATERNE", "FACKEL"] },
        { name: "Im Motor", words: ["ZÜNDUNG", "KOLBEN", "VERGASER"] },
        { name: "Turnübungen", words: ["SPAGAT", "BRÜCKE", "HANDSTAND"] },
        { name: "Hoch in die Luft geschossen", words: ["LUPFER", "HEBER", "FLANKE"] },
      ],
    },
    mint: {
      title: "Blase geplatzt",
      pivot: "BLASE",
      categories: [
        { name: "Beim Baden", words: ["SCHAUM", "SEIFE", "SCHWAMM"] },
        { name: "Organe", words: ["NIERE", "LEBER", "MILZ"] },
        { name: "Am Fuß nach der Wanderung", words: ["HORNHAUT", "SCHWIELE", "DRUCKSTELLE"] },
        { name: "Überhitzter Markt", words: ["HYPE", "SPEKULATION", "BOOM"] },
      ],
    },
    post: {
      title: "Auf verlorenem Posten",
      pivot: "POSTEN",
      categories: [
        { name: "Job", words: ["STELLE", "AMT", "POSITION"] },
        { name: "Auf der Hut", words: ["WÄCHTER", "PATROUILLE", "WACHE"] },
        { name: "In der Buchhaltung", words: ["EINTRAG", "BETRAG", "RECHNUNG"] },
        { name: "Warenmenge", words: ["CHARGE", "PARTIE", "LIEFERUNG"] },
      ],
    },
    spin: {
      title: "Runde Sache",
      pivot: "RUNDE",
      categories: [
        { name: "Beim Boxen", words: ["GONG", "KNOCKOUT", "RINGRICHTER"] },
        { name: "Im Motorsport", words: ["BOXENSTOPP", "SLICKS", "POLE"] },
        { name: "In der Kneipe spendiert", words: ["BIER", "SCHNAPS", "THEKE"] },
        { name: "Vertraute Menschen", words: ["KREIS", "ZIRKEL", "CLIQUE"] },
      ],
    },
    shower: {
      title: "Anlage vorhanden",
      pivot: "ANLAGE",
      categories: [
        { name: "Geld vermehren", words: ["AKTIE", "FONDS", "SPARBUCH"] },
        { name: "Zur Musikwiedergabe", words: ["BOXEN", "VERSTÄRKER", "TUNER"] },
        { name: "Angeboren", words: ["BEGABUNG", "TALENT", "NEIGUNG"] },
        { name: "Öffentliches Grün", words: ["PARK", "BEET", "RASEN"] },
      ],
    },
    deck: {
      title: "Brett vorm Kopf",
      pivot: "BRETT",
      categories: [
        { name: "Aus Holz", words: ["BALKEN", "LATTE", "DIELE"] },
        { name: "Auf Schnee", words: ["SKI", "SCHLITTEN", "PISTE"] },
        { name: "Beim Schach", words: ["KÖNIG", "LÄUFER", "SPRINGER"] },
        { name: "Öffentlich angeschlagen", words: ["AUSHANG", "NOTIZ", "MITTEILUNG"] },
      ],
    },
    break: {
      title: "Riss im Bild",
      pivot: "RISS",
      categories: [
        { name: "In der Wand", words: ["SPALT", "FUGE", "RITZE"] },
        { name: "In der Hose", words: ["LOCH", "SCHLITZ", "FRANSEN"] },
        { name: "Beim Architekten", words: ["ENTWURF", "SKIZZE", "PLAN"] },
        { name: "Was die Gesellschaft trennt", words: ["KLUFT", "GRABEN", "SPALTUNG"] },
      ],
    },
    nail: {
      title: "Eine Schraube locker",
      pivot: "SCHRAUBE",
      categories: [
        { name: "Im Werkzeugkasten", words: ["MUTTER", "DÜBEL", "BOLZEN"] },
        { name: "Am Schiff hinten", words: ["RUDER", "KIEL", "HECK"] },
        { name: "Vom Sprungbrett", words: ["SALTO", "HECHT", "KÖPFER"] },
        { name: "Verrückt (umgangssprachlich)", words: ["MACKE", "KNALL", "TICK"] },
      ],
    },
    brush: {
      title: "Schlauer Fuchs",
      pivot: "FUCHS",
      categories: [
        { name: "Im Wald", words: ["DACHS", "REH", "WILDSCHWEIN"] },
        { name: "Pferdefarben", words: ["SCHIMMEL", "RAPPE", "FALBE"] },
        { name: "Ein Schlauer", words: ["SCHLITZOHR", "STRATEGE", "TAKTIKER"] },
        { name: "In der Studentenverbindung", words: ["BURSCHE", "KOMMILITONE", "ERSTSEMESTER"] },
      ],
    },
    tank: {
      title: "Panzer geknackt",
      pivot: "PANZER",
      categories: [
        { name: "Militärfahrzeuge", words: ["JEEP", "HAUBITZE", "LKW"] },
        { name: "Ritterausrüstung", words: ["HELM", "LANZE", "SCHILD"] },
        { name: "Tiere mit hartem Schutz", words: ["KREBS", "KÄFER", "GÜRTELTIER"] },
        { name: "Lässt nichts an sich heran", words: ["FASSADE", "MASKE", "SCHUTZWALL"] },
      ],
    },
    vault: {
      title: "Ein Sprung nach vorn",
      pivot: "SPRUNG",
      categories: [
        { name: "Leichtathletik", words: ["HÜRDE", "ANLAUF", "WEITE"] },
        { name: "Schaden am Geschirr", words: ["KNACKS", "SCHARTE", "KRATZER"] },
        { name: "Kurz vor dem Gehen", words: ["AUFBRUCH", "ABMARSCH", "EILE"] },
        { name: "Turngeräte", words: ["BARREN", "RECK", "BOCK"] },
      ],
    },
    figure: {
      title: "Masse statt Klasse",
      pivot: "MASSE",
      categories: [
        { name: "Physik", words: ["GEWICHT", "DICHTE", "TRÄGHEIT"] },
        { name: "Viele Menschen", words: ["MENGE", "PULK", "SCHAR"] },
        { name: "In der Küche geknetet", words: ["TEIG", "PASTE", "CREME"] },
        { name: "Elektrik", words: ["ERDUNG", "MINUSPOL", "GEHÄUSE"] },
      ],
    },
    hook: {
      title: "Der Haken an der Sache",
      pivot: "HAKEN",
      categories: [
        { name: "Zum Aufhängen", words: ["BÜGEL", "ÖSE", "NAGEL"] },
        { name: "Der Pferdefuß", words: ["TÜCKE", "FALLE", "NACHTEIL"] },
        { name: "Im Boxring", words: ["SCHWINGER", "GERADE", "UPPERCUT"] },
        { name: "Beim Angeln", words: ["KÖDER", "RUTE", "BLINKER"] },
      ],
    },
    plot: {
      title: "Bis zum Anschlag",
      pivot: "ANSCHLAG",
      categories: [
        { name: "Terror", words: ["ATTENTAT", "BOMBE", "SABOTAGE"] },
        { name: "Am schwarzen Brett", words: ["AUSHANG", "ZETTEL", "FLUGBLATT"] },
        { name: "Am Klavier", words: ["TASTE", "PEDAL", "OKTAVE"] },
        { name: "Nicht mehr weiter", words: ["LIMIT", "GRENZE", "MAXIMUM"] },
      ],
    },
    court: {
      title: "Den Hof machen",
      pivot: "HOF",
      categories: [
        { name: "Hinter dem Haus", words: ["TERRASSE", "GARAGE", "MÜLLTONNE"] },
        { name: "Auf dem Land", words: ["SCHEUNE", "STALL", "SILO"] },
        { name: "Beim König", words: ["ADEL", "ZEREMONIE", "AUDIENZ"] },
        { name: "Um jemanden werben", words: ["FLIRT", "ANBANDELN", "UMGARNEN"] },
      ],
    },
    trip: {
      title: "Auf Touren",
      pivot: "TOUR",
      categories: [
        { name: "Unterwegs", words: ["AUSFLUG", "WANDERUNG", "TRIP"] },
        { name: "Krumme Sachen", words: ["TRICK", "MASCHE", "GAUNEREI"] },
        { name: "Der Motor läuft", words: ["DREHZAHL", "UMDREHUNG", "LEERLAUF"] },
        { name: "So macht man das", words: ["ART", "MANIER", "WEISE"] },
      ],
    },
    turn: {
      title: "Schlag auf Schlag",
      pivot: "SCHLAG",
      categories: [
        { name: "Beim Boxen", words: ["HIEB", "STOSS", "TREFFER"] },
        { name: "Medizinischer Notfall", words: ["INFARKT", "KOLLAPS", "ANFALL"] },
        { name: "Aus der Steckdose", words: ["STROM", "SPANNUNG", "VOLT"] },
        { name: "Menschentyp", words: ["SORTE", "TYP", "KALIBER"] },
      ],
    },
    lead: {
      title: "Spitze!",
      pivot: "SPITZE",
      categories: [
        { name: "Ganz oben in der Tabelle", words: ["FÜHRUNG", "VORSPRUNG", "PRIMUS"] },
        { name: "Feine Handarbeit", words: ["HÄKELN", "STICKEREI", "BORTE"] },
        { name: "Spöttische Bemerkung", words: ["SEITENHIEB", "STICHELEI", "ANSPIELUNG"] },
        { name: "Im Angriff", words: ["STÜRMER", "TORJÄGER", "KNIPSER"] },
      ],
    },
    stamp: {
      title: "Stempel drauf",
      pivot: "STEMPEL",
      categories: [
        { name: "Auf dem Schreibtisch", words: ["ORDNER", "LOCHER", "TACKER"] },
        { name: "In der Blüte", words: ["POLLEN", "NEKTAR", "KELCH"] },
        { name: "Auf dem Briefumschlag", words: ["BRIEFMARKE", "ABSENDER", "ADRESSE"] },
        { name: "Bleibende Wirkung", words: ["PRÄGUNG", "EINFLUSS", "HANDSCHRIFT"] },
      ],
    },
    panel: {
      title: "Platte auflegen",
      pivot: "PLATTE",
      categories: [
        { name: "Aus der Musikkiste", words: ["VINYL", "SINGLE", "ALBUM"] },
        { name: "In der Küche heiß", words: ["HERD", "OFEN", "GRILL"] },
        { name: "Beim Steinmetz", words: ["MARMOR", "GRANIT", "SCHIEFER"] },
        { name: "Zum Buffet", words: ["KÄSE", "AUFSCHNITT", "HÄPPCHEN"] },
      ],
    },
    peak: {
      title: "Schein und Sein",
      pivot: "SCHEIN",
      categories: [
        { name: "Bargeld", words: ["HUNDERTER", "FÜNFZIGER", "ZWANZIGER"] },
        { name: "Trügerische Fassade", words: ["ILLUSION", "BLENDWERK", "TRUGBILD"] },
        { name: "Bescheinigung", words: ["URKUNDE", "ZEUGNIS", "NACHWEIS"] },
        { name: "Leuchten", words: ["GLANZ", "SCHIMMER", "STRAHLEN"] },
      ],
    },
    switch: {
      title: "Fliegender Wechsel",
      pivot: "WECHSEL",
      categories: [
        { name: "Der Trainer bringt einen Neuen", words: ["ERSATZ", "RESERVE", "JOKER"] },
        { name: "Finanzpapiere", words: ["SCHECK", "ANLEIHE", "PFANDBRIEF"] },
        { name: "Wo das Wild läuft", words: ["FÄHRTE", "PFAD", "PIRSCH"] },
        { name: "Veränderung", words: ["WANDEL", "UMBRUCH", "UMSTELLUNG"] },
      ],
    },
    match: {
      title: "Eine gute Partie",
      pivot: "PARTIE",
      categories: [
        { name: "Ein Spiel", words: ["MATCH", "DUELL", "BEGEGNUNG"] },
        { name: "Warenlieferung", words: ["LOS", "SERIE", "KONTINGENT"] },
        { name: "Heiratskandidat", words: ["BRÄUTIGAM", "VERLOBTER", "JUNGGESELLE"] },
        { name: "In der Oper", words: ["ARIE", "SOPRAN", "LIBRETTO"] },
      ],
    },
    sink: {
      title: "Ins Becken",
      pivot: "BECKEN",
      categories: [
        { name: "Im Bad", words: ["ARMATUR", "ABFLUSS", "SIPHON"] },
        { name: "Im Skelett", words: ["HÜFTE", "OBERSCHENKEL", "STEISS"] },
        { name: "Schlagwerk", words: ["PAUKE", "TRIANGEL", "GONG"] },
        { name: "Im Schwimmbad", words: ["BAHN", "CHLOR", "BADEMEISTER"] },
      ],
    },
    plug: {
      title: "Zapfenstreich",
      pivot: "ZAPFEN",
      categories: [
        { name: "Von der Tanne", words: ["NADEL", "HARZ", "FICHTE"] },
        { name: "Verschließt das Fass", words: ["SPUND", "KORKEN", "PFROPFEN"] },
        { name: "Im Auge", words: ["NETZHAUT", "STÄBCHEN", "PUPILLE"] },
        { name: "EIS + ___", words: ["BÄR", "BERG", "DIELE"] },
      ],
    },
    snap: {
      title: "Aus der Schale",
      pivot: "SCHALE",
      categories: [
        { name: "Vom Obst entfernt", words: ["PELLE", "RINDE", "HAUT"] },
        { name: "Zum Essen aus", words: ["NAPF", "SCHÜSSEL", "TELLER"] },
        { name: "Vom Ei", words: ["EIWEISS", "DOTTER", "KÜKEN"] },
        { name: "Festlich gekleidet", words: ["ANZUG", "SMOKING", "KRAWATTE"] },
      ],
    },
    slate: {
      title: "In Gang gebracht",
      pivot: "GANG",
      categories: [
        { name: "Im Auto", words: ["KUPPLUNG", "GETRIEBE", "RÜCKWÄRTS"] },
        { name: "Im Restaurant", words: ["VORSPEISE", "DESSERT", "HAUPTGERICHT"] },
        { name: "Verbindet die Zimmer", words: ["FLUR", "KORRIDOR", "PASSAGE"] },
        { name: "Wie einer läuft", words: ["WATSCHELN", "STOLZIEREN", "SCHLURFEN"] },
      ],
    },
    grain: {
      title: "Aufs Korn genommen",
      pivot: "KORN",
      categories: [
        { name: "Getreide", words: ["WEIZEN", "GERSTE", "HAFER"] },
        { name: "Hochprozentiges", words: ["SCHNAPS", "WODKA", "OBSTLER"] },
        { name: "Am Gewehr", words: ["KIMME", "LAUF", "VISIER"] },
        { name: "Im Fotolabor", words: ["BELICHTUNG", "RAUSCHEN", "AUFLÖSUNG"] },
      ],
    },
    prime: {
      title: "Aus gutem Grund",
      pivot: "GRUND",
      categories: [
        { name: "Ursache", words: ["ANLASS", "MOTIV", "AUSLÖSER"] },
        { name: "Auf dem Meeresboden", words: ["SAND", "SCHLICK", "WRACK"] },
        { name: "Immobilien", words: ["PARZELLE", "ACKER", "BAUPLATZ"] },
        { name: "Im Innersten", words: ["KERN", "WESEN", "ESSENZ"] },
      ],
    },
    swing: {
      title: "In Schwung",
      pivot: "SCHWUNG",
      categories: [
        { name: "Beim Golfen", words: ["ABSCHLAG", "PUTTER", "BIRDIE"] },
        { name: "Energie", words: ["ELAN", "PEP", "DRIVE"] },
        { name: "Eine ganze Menge", words: ["HAUFEN", "SCHAR", "LADUNG"] },
        { name: "In der Physik", words: ["IMPULS", "TRÄGHEIT", "DYNAMIK"] },
      ],
    },
    shift: {
      title: "Schichtwechsel",
      pivot: "SCHICHT",
      categories: [
        { name: "Arbeitszeit", words: ["FRÜHDIENST", "SPÄTDIENST", "NACHTWACHE"] },
        { name: "Gesellschaft", words: ["ADEL", "BÜRGERTUM", "PROLETARIAT"] },
        { name: "Geologie", words: ["SEDIMENT", "GESTEIN", "ABLAGERUNG"] },
        { name: "Beim Maler", words: ["ANSTRICH", "LACK", "FIRNIS"] },
      ],
    },
    strain: {
      title: "Vom Stamm",
      pivot: "STAMM",
      categories: [
        { name: "Beim Holzfäller", words: ["SÄGE", "AXT", "SCHEIT"] },
        { name: "Indigene Völker", words: ["SIOUX", "MAORI", "INUIT"] },
        { name: "Grammatik", words: ["ENDUNG", "PRÄFIX", "SUFFIX"] },
        { name: "Im Labor", words: ["BAKTERIE", "VIRUS", "KULTUR"] },
      ],
    },
    string: {
      title: "Zungenbrecher",
      pivot: "ZUNGE",
      categories: [
        { name: "Im Mund", words: ["GAUMEN", "LIPPE", "ZAHN"] },
        { name: "Am Schuh", words: ["SOHLE", "SCHNÜRSENKEL", "ABSATZ"] },
        { name: "Am Blasinstrument", words: ["MUNDSTÜCK", "ROHRBLATT", "KLAPPE"] },
        { name: "Sprache (veraltet)", words: ["DIALEKT", "IDIOM", "MUNDART"] },
      ],
    },
    shock: {
      title: "Gegen den Strom",
      pivot: "STROM",
      categories: [
        { name: "Aus der Steckdose", words: ["VOLT", "AMPERE", "SICHERUNG"] },
        { name: "Große Flüsse", words: ["RHEIN", "DONAU", "ELBE"] },
        { name: "Menschenmassen", words: ["ANDRANG", "GEDRÄNGE", "ZULAUF"] },
        { name: "Zeitgeist", words: ["TREND", "MODE", "MAINSTREAM"] },
      ],
    },
    forge: {
      title: "Hammerhart",
      pivot: "HAMMER",
      categories: [
        { name: "Werkzeug", words: ["ZANGE", "MEISSEL", "FEILE"] },
        { name: "Im Ohr", words: ["AMBOSS", "SCHNECKE", "GEHÖRGANG"] },
        { name: "Am Klavier", words: ["SAITE", "TASTE", "PEDAL"] },
        { name: "Umgangssprachlich toll", words: ["WAHNSINN", "GRANATE", "KNALLER"] },
      ],
    },
    channel: {
      title: "Kanal voll",
      pivot: "KANAL",
      categories: [
        { name: "Wasserstraßen", words: ["SCHLEUSE", "DEICH", "WEHR"] },
        { name: "Fernsehen", words: ["SENDER", "PROGRAMM", "FREQUENZ"] },
        { name: "Unter der Straße", words: ["ABWASSER", "GULLY", "KLÄRWERK"] },
        { name: "Vertrieb", words: ["HANDEL", "ABSATZ", "GROSSHANDEL"] },
      ],
    },
    steam: {
      title: "Kesseltreiben",
      pivot: "KESSEL",
      categories: [
        { name: "In der Küche", words: ["TOPF", "PFANNE", "WOK"] },
        { name: "Landschaftsform", words: ["TAL", "MULDE", "SENKE"] },
        { name: "Militärisch eingeschlossen", words: ["BELAGERUNG", "EINKREISUNG", "UMZINGELUNG"] },
        { name: "Bei der Hexe", words: ["BESEN", "ZAUBERTRANK", "KRÖTE"] },
      ],
    },
    rail: {
      title: "Aus der Schiene",
      pivot: "SCHIENE",
      categories: [
        { name: "Bei der Bahn", words: ["GLEIS", "WEICHE", "SCHWELLE"] },
        { name: "Nach dem Knochenbruch", words: ["GIPS", "VERBAND", "KRÜCKE"] },
        { name: "Am Fenster oben", words: ["VORHANG", "GARDINE", "STANGE"] },
        { name: "Festgelegter Weg", words: ["KURS", "RICHTUNG", "LINIE"] },
      ],
    },
    stall: {
      title: "Stand der Dinge",
      pivot: "STAND",
      categories: [
        { name: "Auf dem Markt", words: ["BUDE", "KIOSK", "THEKE"] },
        { name: "Gesellschaftliche Gruppe", words: ["BÜRGER", "ADEL", "KLERUS"] },
        { name: "Wie es gerade steht", words: ["STATUS", "LAGE", "VERFASSUNG"] },
        { name: "Auf der Anzeigetafel", words: ["ERGEBNIS", "PUNKTE", "TOR"] },
      ],
    },
    grade: {
      title: "Stufe für Stufe",
      pivot: "STUFE",
      categories: [
        { name: "An der Treppe", words: ["GELÄNDER", "PODEST", "HANDLAUF"] },
        { name: "An der Rakete", words: ["TRIEBWERK", "BOOSTER", "NUTZLAST"] },
        { name: "Niveau", words: ["GRAD", "LEVEL", "RANG"] },
        { name: "Beim Friseur", words: ["PONY", "SCHEITEL", "STRÄHNE"] },
      ],
    },
    fan: {
      title: "Vom Fach",
      pivot: "FACH",
      categories: [
        { name: "Zum Verstauen", words: ["SCHUBLADE", "ABLAGE", "KÄSTCHEN"] },
        { name: "Auf dem Stundenplan", words: ["MATHE", "DEUTSCH", "BIOLOGIE"] },
        { name: "Beruf", words: ["BRANCHE", "METIER", "HANDWERK"] },
        { name: "In der Oper", words: ["TENOR", "BARITON", "MEZZO"] },
      ],
    },
    drive: {
      title: "Im Lauf der Zeit",
      pivot: "LAUF",
      categories: [
        { name: "Leichtathletik", words: ["SPRINT", "STAFFEL", "MARATHON"] },
        { name: "Am Gewehr", words: ["VISIER", "PATRONE", "ABZUG"] },
        { name: "Der Fluss", words: ["QUELLE", "MÜNDUNG", "BETT"] },
        { name: "Musikalische Verzierung", words: ["TRILLER", "ARPEGGIO", "KADENZ"] },
      ],
    },
    charm: {
      title: "Die Masche",
      pivot: "MASCHE",
      categories: [
        { name: "Beim Stricken", words: ["NADEL", "WOLLE", "GARN"] },
        { name: "Am Netz", words: ["KNOTEN", "GITTER", "GEFLECHT"] },
        { name: "Trick", words: ["KNIFF", "DREH", "FINTE"] },
        { name: "Im Haar (österreichisch)", words: ["SCHLEIFE", "ZIERBAND", "HAARSCHMUCK"] },
      ],
    },
    sole: {
      title: "Auf leisen Sohlen",
      pivot: "SOHLE",
      categories: [
        { name: "Am Schuh", words: ["SCHAFT", "EINLAGE", "ABSATZ"] },
        { name: "Am Fuß", words: ["FERSE", "ZEH", "BALLEN"] },
        { name: "Im Bergwerk", words: ["STOLLEN", "SCHACHT", "FLÖZ"] },
        { name: "Wirtschaftlicher Tiefpunkt", words: ["FLAUTE", "REZESSION", "KRISE"] },
      ],
    },
    spot: {
      title: "Auf der Stelle",
      pivot: "STELLE",
      categories: [
        { name: "Auf der Jobsuche", words: ["VAKANZ", "BEWERBUNG", "GEHALT"] },
        { name: "In der Zahl", words: ["ZIFFER", "KOMMA", "EINER"] },
        { name: "Im Buch", words: ["PASSAGE", "KAPITEL", "ZITAT"] },
        { name: "Behörde", words: ["AMT", "INSTANZ", "DIENSTHERR"] },
      ],
    },
    cross: {
      title: "Künstlerische Ader",
      pivot: "ADER",
      categories: [
        { name: "Im Körper", words: ["ARTERIE", "BLUT", "PULS"] },
        { name: "Im Bergwerk", words: ["ERZ", "MINERAL", "GRUBE"] },
        { name: "Veranlagung", words: ["TALENT", "HANG", "BEGABUNG"] },
        { name: "Im Stromkabel", words: ["KUPFER", "LITZE", "ISOLIERUNG"] },
      ],
    },
    run: {
      title: "Die Fassung verlieren",
      pivot: "FASSUNG",
      categories: [
        { name: "Ruhe bewahren", words: ["GELASSENHEIT", "HALTUNG", "CONTENANCE"] },
        { name: "Für die Glühbirne", words: ["SOCKEL", "GEWINDE", "LAMPE"] },
        { name: "Textvarianten", words: ["VERSION", "AUSGABE", "ENTWURF"] },
        { name: "An der Brille", words: ["BÜGEL", "NASENSTEG", "SCHARNIER"] },
      ],
    },
    tender: {
      title: "Ohne Abzüge",
      pivot: "ABZUG",
      categories: [
        { name: "Feuerwaffe", words: ["GEWEHR", "PISTOLE", "MUNITION"] },
        { name: "Auf der Gehaltsabrechnung", words: ["STEUER", "BEITRAG", "RABATT"] },
        { name: "Aus der Dunkelkammer", words: ["NEGATIV", "ENTWICKLER", "FOTOPAPIER"] },
        { name: "Die Truppen gehen", words: ["RÜCKMARSCH", "RÄUMUNG", "HEIMKEHR"] },
      ],
    },
    present: {
      title: "Vorstellung beendet",
      pivot: "VORSTELLUNG",
      categories: [
        { name: "Im Theater", words: ["AUFFÜHRUNG", "PREMIERE", "MATINEE"] },
        { name: "Fantasie", words: ["EINBILDUNG", "TRAUM", "TAGTRAUM"] },
        { name: "Sich bekannt machen", words: ["HANDSCHLAG", "VISITENKARTE", "SMALLTALK"] },
        { name: "Was man sich denkt", words: ["IDEE", "BEGRIFF", "AHNUNG"] },
      ],
    },
    temper: {
      title: "Voller Einsatz",
      pivot: "EINSATZ",
      categories: [
        { name: "Beim Pokern", words: ["WETTE", "POT", "JETON"] },
        { name: "Die Feuerwehr rückt aus", words: ["ALARM", "SIRENE", "NOTRUF"] },
        { name: "Engagement", words: ["HINGABE", "EIFER", "FLEISS"] },
        { name: "Im Orchester", words: ["AUFTAKT", "DIRIGENT", "PARTITUR"] },
      ],
    },
    mold: {
      title: "In Form",
      pivot: "FORM",
      categories: [
        { name: "Geometrie", words: ["KREIS", "OVAL", "QUADRAT"] },
        { name: "In der Backstube", words: ["TEIG", "HEFE", "BLECH"] },
        { name: "Fit", words: ["KONDITION", "FITNESS", "AUSDAUER"] },
        { name: "Etikette", words: ["ANSTAND", "PROTOKOLL", "SITTE"] },
      ],
    },
    score: {
      title: "Auf den Punkt",
      pivot: "PUNKT",
      categories: [
        { name: "Satzzeichen", words: ["KOMMA", "STRICH", "KLAMMER"] },
        { name: "Auf der Anzeigetafel", words: ["TOR", "TREFFER", "ZÄHLER"] },
        { name: "Tagesordnung", words: ["THEMA", "ANLIEGEN", "ANTRAG"] },
        { name: "Geometrie", words: ["GERADE", "EBENE", "WINKEL"] },
      ],
    },
    floor: {
      title: "Am Boden",
      pivot: "BODEN",
      categories: [
        { name: "Im Garten", words: ["ERDE", "HUMUS", "LEHM"] },
        { name: "Unterm Dach", words: ["SPEICHER", "GEBÄLK", "DACHLUKE"] },
        { name: "Unter der Torte", words: ["MÜRBETEIG", "BISKUIT", "OBLATE"] },
        { name: "Im Zimmer unten", words: ["PARKETT", "LAMINAT", "FLIESE"] },
      ],
    },
    draw: {
      title: "Das große Los",
      pivot: "LOS",
      categories: [
        { name: "Glücksspiel", words: ["LOTTERIE", "TOMBOLA", "GEWINN"] },
        { name: "Schicksal", words: ["FÜGUNG", "BESTIMMUNG", "VORSEHUNG"] },
        { name: "Auf der Auktion", words: ["GEBOT", "AUKTIONATOR", "ZUSCHLAG"] },
        { name: "Startsignal", words: ["START", "ABMARSCH", "ANPFIFF"] },
      ],
    },
    volume: {
      title: "Neue Ausgabe",
      pivot: "AUSGABE",
      categories: [
        { name: "Geld weg", words: ["KOSTEN", "SPESEN", "AUFWAND"] },
        { name: "Vom Buch", words: ["AUFLAGE", "EDITION", "NACHDRUCK"] },
        { name: "Vom Computer", words: ["OUTPUT", "DRUCKER", "BILDSCHIRM"] },
        { name: "In der Kantine", words: ["THEKE", "TABLETT", "KELLE"] },
      ],
    },
    mark: {
      title: "Ein Zeichen setzen",
      pivot: "ZEICHEN",
      categories: [
        { name: "Auf der Tastatur", words: ["LETTER", "ZIFFER", "KOMMA"] },
        { name: "Astrologie", words: ["WIDDER", "KREBS", "LÖWE"] },
        { name: "Ein Wink", words: ["GESTE", "SIGNAL", "PFIFF"] },
        { name: "Kündigt etwas an", words: ["OMEN", "VORBOTE", "AHNUNG"] },
      ],
    },
  },
  emoji: {
    title: "Gute Figur gemacht",
    pivot: "FIGUR",
    categories: [
      { name: "Schachfiguren", words: ["LÄUFER", "TURM", "BAUER"] },
      { name: "Körperformen", words: ["BIRNE", "APFEL", "SANDUHR"] },
      { name: "Geometrische Körper", words: ["WÜRFEL", "ZYLINDER", "KUGEL"] },
      { name: "Turnübungen", words: ["BRÜCKE", "WAAGE", "RAD"] },
    ],
    emoji: {
      LÄUFER: "🏃", TURM: "🗼", BAUER: "👨‍🌾",
      BIRNE: "🍐", APFEL: "🍎", SANDUHR: "⏳",
      WÜRFEL: "🎲", ZYLINDER: "🎩", KUGEL: "🎱",
      BRÜCKE: "🌉", WAAGE: "⚖️", RAD: "🛞",
    },
  },
  daily: {},
};

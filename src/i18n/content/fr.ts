// Français — the boards. See src/i18n/content/README.md and
// `node --experimental-strip-types scripts/i18n-slots.mts fr` for the slots.
import type { LocaleContent } from "./types.ts";

export const content: LocaleContent = {
  keys: [
    "ÉCLAT",
    "BRAISE",
    "TRESSE",
    "MIROIRS",
    "SPIRALE",
    "LEXIQUE",
    "ÉNIGMES",
    "COURANTS",
    "ESPIÈGLE",
    "PATIENCE",
    "FUNAMBULE",
    "STRATAGÈME",
  ],
  decoys: [
    "IGLOO", "PYJAMA", "VOLCAN", "ANANAS", "PARAPLUIE", "CACTUS", "BROCOLI",
    "TRACTEUR", "MOUSTACHE", "SANDWICH", "LICORNE", "MONTGOLFIÈRE", "TROTTINETTE",
    "ASPIRATEUR", "CHAUSSETTE", "MICROSCOPE", "PASSEPORT", "HAMAC", "PARACHUTE", "GIRAFE",
  ],
  campaign: {
    star: {
      title: "Bonne étoile",
      pivot: "ÉTOILE",
      categories: [
        { name: "Dans le ciel, la nuit", words: ["LUNE", "COMÈTE", "PLANÈTE"] },
        { name: "Des gens célèbres", words: ["VEDETTE", "IDOLE", "LÉGENDE"] },
        { name: "Formes et symboles", words: ["CROIX", "LOSANGE", "TRIANGLE"] },
        { name: "Animaux marins", words: ["MÉDUSE", "OURSIN", "HIPPOCAMPE"] },
      ],
      accept: ["ÉTOILES"],
    },
    trunk: {
      title: "Pièce montée",
      pivot: "PIÈCE",
      categories: [
        { name: "De l'argent liquide", words: ["BILLET", "CENTIME", "EURO"] },
        { name: "Dans une maison", words: ["SALON", "CUISINE", "CHAMBRE"] },
        { name: "Au théâtre", words: ["COMÉDIE", "DRAME", "TRAGÉDIE"] },
        { name: "Sur un échiquier", words: ["PION", "ROI", "CAVALIER"] },
      ],
    },
    ring: {
      title: "Brise-glace",
      pivot: "GLACE",
      categories: [
        { name: "En plein hiver", words: ["GIVRE", "ICEBERG", "VERGLAS"] },
        { name: "Au rayon des desserts", words: ["SORBET", "CORNET", "ESQUIMAU"] },
        { name: "On regarde à travers", words: ["VITRE", "CARREAU", "HUBLOT"] },
        { name: "Un visage de marbre", words: ["IMPASSIBLE", "INSENSIBLE", "STOÏQUE"] },
      ],
    },
    bug: {
      title: "Sac à puces",
      pivot: "PUCE",
      categories: [
        { name: "Petites bêtes", words: ["FOURMI", "TIQUE", "MOUCHERON"] },
        { name: "Dans un ordinateur", words: ["PROCESSEUR", "CIRCUIT", "MÉMOIRE"] },
        { name: "Petits mots doux", words: ["CHÉRI", "TRÉSOR", "CHOU"] },
        { name: "Le monde de la seconde main", words: ["BROCANTE", "OCCASION", "ANTIQUITÉ"] },
      ],
    },
    bank: {
      title: "Fond de caisse",
      pivot: "CAISSE",
      categories: [
        { name: "Contenants en bois", words: ["CAGEOT", "TONNEAU", "MALLE"] },
        { name: "À la sortie du supermarché", words: ["TICKET", "TAPIS", "CADDIE"] },
        { name: "Sur une batterie", words: ["CYMBALE", "TAMBOUR", "PÉDALE"] },
        { name: "Une voiture, familièrement", words: ["BAGNOLE", "GUIMBARDE", "TACOT"] },
      ],
    },
    stick: {
      title: "Carte blanche",
      pivot: "CARTE",
      categories: [
        { name: "Dans un jeu de 52", words: ["VALET", "TRÈFLE", "PIQUE"] },
        { name: "Au restaurant", words: ["MENU", "ENTRÉE", "DESSERT"] },
        { name: "Pour se repérer", words: ["PLAN", "ATLAS", "GLOBE"] },
        { name: "Moyens de paiement", words: ["CHÈQUE", "ESPÈCES", "MONNAIE"] },
      ],
    },
    cap: {
      title: "Ça bouchonne",
      pivot: "BOUCHON",
      categories: [
        { name: "Ferme une bouteille", words: ["LIÈGE", "CAPSULE", "COUVERCLE"] },
        { name: "Sur l'autoroute aux heures de pointe", words: ["EMBOUTEILLAGE", "RALENTISSEMENT", "ENCOMBREMENT"] },
        { name: "À la pêche", words: ["HAMEÇON", "CANNE", "APPÂT"] },
        { name: "Où l'on mange dehors", words: ["BISTROT", "BRASSERIE", "AUBERGE"] },
      ],
    },
    bat: {
      title: "Froid de canard",
      pivot: "CANARD",
      categories: [
        { name: "Dans la basse-cour", words: ["POULE", "OIE", "DINDON"] },
        { name: "Au kiosque", words: ["JOURNAL", "GAZETTE", "HEBDO"] },
        { name: "Fausses nouvelles", words: ["RUMEUR", "INTOX", "BOBARD"] },
        { name: "Spécialités du Sud-Ouest", words: ["MAGRET", "CONFIT", "FOIE"] },
      ],
    },
    club: {
      title: "La balle au bond",
      pivot: "BALLE",
      categories: [
        { name: "Sports de raquette", words: ["TENNIS", "SQUASH", "BADMINTON"] },
        { name: "Munitions", words: ["CARTOUCHE", "OBUS", "PLOMB"] },
        { name: "L'argent, familièrement", words: ["FRIC", "THUNE", "POGNON"] },
        { name: "Dans la grange", words: ["FOIN", "PAILLE", "FOURRAGE"] },
      ],
    },
    spring: {
      title: "Bouton d'or",
      pivot: "BOUTON",
      categories: [
        { name: "Sur une chemise", words: ["COL", "MANCHE", "POCHE"] },
        { name: "Problèmes de peau", words: ["ACNÉ", "ECZÉMA", "ROUGEUR"] },
        { name: "Sur une rose", words: ["PÉTALE", "TIGE", "ÉPINE"] },
        { name: "Pour allumer un appareil", words: ["INTERRUPTEUR", "MANETTE", "LEVIER"] },
      ],
    },
    cell: {
      title: "Plateau télé",
      pivot: "PLATEAU",
      categories: [
        { name: "Reliefs", words: ["MONTAGNE", "VALLÉE", "COLLINE"] },
        { name: "À la télévision", words: ["ÉMISSION", "ANIMATEUR", "CAMÉRA"] },
        { name: "Fromages", words: ["CAMEMBERT", "BRIE", "ROQUEFORT"] },
        { name: "Pour servir le thé", words: ["TASSE", "SOUCOUPE", "THÉIÈRE"] },
      ],
    },
    chip: {
      title: "Complètement timbré",
      pivot: "TIMBRE",
      categories: [
        { name: "Sur une enveloppe", words: ["ADRESSE", "CACHET", "DESTINATAIRE"] },
        { name: "Ce qui caractérise une voix", words: ["TON", "HAUTEUR", "ACCENT"] },
        { name: "Sur un vélo", words: ["GUIDON", "SELLE", "PÉDALE"] },
        { name: "Un peu fou", words: ["DINGUE", "CINGLÉ", "TOQUÉ"] },
      ],
    },
    wave: {
      title: "Faire des vagues",
      pivot: "VAGUE",
      categories: [
        { name: "Sur la mer", words: ["MARÉE", "ÉCUME", "RESSAC"] },
        { name: "Imprécis", words: ["FLOU", "CONFUS", "INCERTAIN"] },
        { name: "Ce qui arrive en masse", words: ["AFFLUX", "DÉLUGE", "TORRENT"] },
        { name: "Une mélancolie passagère", words: ["SPLEEN", "CAFARD", "NOSTALGIE"] },
      ],
    },
    glass: {
      title: "Lever son verre",
      pivot: "VERRE",
      categories: [
        { name: "Pour boire", words: ["GOBELET", "CHOPE", "FLÛTE"] },
        { name: "Matières fragiles", words: ["CRISTAL", "PORCELAINE", "CÉRAMIQUE"] },
        { name: "Pour mieux voir", words: ["LUNETTES", "LOUPE", "MONOCLE"] },
        { name: "Un moment entre amis", words: ["APÉRO", "COCKTAIL", "TOURNÉE"] },
      ],
    },
    bark: {
      title: "Patte blanche",
      pivot: "PATTE",
      categories: [
        { name: "Sur un chat", words: ["MUSEAU", "QUEUE", "GRIFFE"] },
        { name: "Ce qui distingue un artiste", words: ["TOUCHE", "STYLE", "SIGNATURE"] },
        { name: "Sur une enveloppe ou une chaussure", words: ["RABAT", "LANGUETTE", "BRIDE"] },
        { name: "Poils du visage", words: ["BARBE", "BOUC", "CILS"] },
      ],
    },
    step: {
      title: "Marche ou crève",
      pivot: "MARCHE",
      categories: [
        { name: "Dans un escalier", words: ["RAMPE", "PALIER", "BARREAU"] },
        { name: "À pied, pour le plaisir", words: ["RANDONNÉE", "BALADE", "PROMENADE"] },
        { name: "Musique de défilé", words: ["HYMNE", "FANFARE", "TAMBOUR"] },
        { name: "Dans la rue pour protester", words: ["CORTÈGE", "MANIF", "RASSEMBLEMENT"] },
      ],
    },
    fire: {
      title: "Feu vert",
      pivot: "FEU",
      categories: [
        { name: "Ça brûle", words: ["BRASIER", "INCENDIE", "FLAMME"] },
        { name: "Au bord de la route", words: ["PANNEAU", "PÉAGE", "PASSAGE"] },
        { name: "Pour cuisiner", words: ["PLAQUE", "BRÛLEUR", "GAZINIÈRE"] },
        { name: "Qui n'est plus de ce monde", words: ["DÉCÉDÉ", "DISPARU", "DÉFUNT"] },
      ],
    },
    block: {
      title: "En bloc",
      pivot: "BLOC",
      categories: [
        { name: "Gros morceaux", words: ["CUBE", "PAVÉ", "DALLE"] },
        { name: "Pour prendre des notes", words: ["CARNET", "CAHIER", "CALEPIN"] },
        { name: "En politique", words: ["COALITION", "ALLIANCE", "UNION"] },
        { name: "À l'hôpital", words: ["CHIRURGIEN", "BISTOURI", "ANESTHÉSIE"] },
      ],
    },
    crane: {
      title: "Comme une flèche",
      pivot: "FLÈCHE",
      categories: [
        { name: "Pour viser juste", words: ["ARC", "CARQUOIS", "CIBLE"] },
        { name: "Au sommet d'une église", words: ["CLOCHER", "DÔME", "COUPOLE"] },
        { name: "Très rapide", words: ["FUSÉE", "BOLIDE", "GUÉPARD"] },
        { name: "Hausse soudaine", words: ["ENVOL", "BOND", "FLAMBÉE"] },
      ],
    },
    bolt: {
      title: "En un éclair",
      pivot: "ÉCLAIR",
      categories: [
        { name: "Pendant l'orage", words: ["TONNERRE", "FOUDRE", "AVERSE"] },
        { name: "Chez le pâtissier", words: ["RELIGIEUSE", "MILLEFEUILLE", "CHOU"] },
        { name: "Très court", words: ["BREF", "FUGACE", "EXPRESS"] },
        { name: "Lueur soudaine", words: ["FLASH", "ÉTINCELLE", "SCINTILLEMENT"] },
      ],
    },
    pen: {
      title: "Belle plume",
      pivot: "PLUME",
      categories: [
        { name: "Sur un oiseau", words: ["BEC", "AILE", "SERRE"] },
        { name: "Pour écrire", words: ["STYLO", "CRAYON", "FEUTRE"] },
        { name: "Gens de lettres", words: ["AUTEUR", "ROMANCIER", "POÈTE"] },
        { name: "Catégories de boxe", words: ["LOURD", "MOYEN", "MOUCHE"] },
      ],
    },
    check: {
      title: "Prendre note",
      pivot: "NOTE",
      categories: [
        { name: "Sur une partition", words: ["BÉMOL", "DIÈSE", "PORTÉE"] },
        { name: "Sur un bulletin scolaire", words: ["MOYENNE", "APPRÉCIATION", "MENTION"] },
        { name: "À la fin du repas", words: ["ADDITION", "POURBOIRE", "SERVICE"] },
        { name: "Un petit mot", words: ["MÉMO", "ANNOTATION", "RAPPEL"] },
      ],
    },
    track: {
      title: "Sur la bonne piste",
      pivot: "PISTE",
      categories: [
        { name: "Aux sports d'hiver", words: ["TÉLÉSIÈGE", "CHALET", "DAMEUSE"] },
        { name: "Ce que suit l'enquêteur", words: ["INDICE", "EMPREINTE", "TÉMOIN"] },
        { name: "Sur un album", words: ["MORCEAU", "CHANSON", "TITRE"] },
        { name: "À l'aéroport", words: ["DÉCOLLAGE", "HANGAR", "TERMINAL"] },
      ],
    },
    note: {
      title: "Tour de force",
      pivot: "TOUR",
      categories: [
        { name: "Hautes constructions", words: ["DONJON", "BEFFROI", "MINARET"] },
        { name: "Chez le magicien", words: ["BAGUETTE", "CHAPEAU", "LAPIN"] },
        { name: "Un long voyage", words: ["PÉRIPLE", "CIRCUIT", "EXCURSION"] },
        { name: "Mensurations", words: ["TAILLE", "POITRINE", "HANCHES"] },
      ],
    },
    rock: {
      title: "Fer de lance",
      pivot: "FER",
      categories: [
        { name: "Métaux", words: ["CUIVRE", "ZINC", "ÉTAIN"] },
        { name: "Au golf", words: ["TEE", "GREEN", "BIRDIE"] },
        { name: "Jour de repassage", words: ["PLANCHE", "VAPEUR", "LINGE"] },
        { name: "Sur un cheval", words: ["SABOT", "CRINIÈRE", "ÉTRIER"] },
      ],
    },
    park: {
      title: "Parc à thème",
      pivot: "PARC",
      categories: [
        { name: "Espaces verts", words: ["JARDIN", "SQUARE", "PELOUSE"] },
        { name: "Dans la chambre de bébé", words: ["BERCEAU", "BIBERON", "HOCHET"] },
        { name: "À la fête foraine", words: ["MANÈGE", "TOBOGGAN", "AUTOTAMPONNEUSE"] },
        { name: "Élevés au bord de la mer", words: ["HUÎTRE", "MOULE", "PALOURDE"] },
      ],
    },
    roll: {
      title: "Suivre son cours",
      pivot: "COURS",
      categories: [
        { name: "À l'école", words: ["LEÇON", "MATIÈRE", "DEVOIR"] },
        { name: "À la Bourse", words: ["ACTION", "COTATION", "DIVIDENDE"] },
        { name: "De l'eau qui coule", words: ["RIVIÈRE", "FLEUVE", "RUISSEAU"] },
        { name: "Voies urbaines", words: ["AVENUE", "BOULEVARD", "ALLÉE"] },
      ],
    },
    table: {
      title: "Ordre du jour",
      pivot: "ORDRE",
      categories: [
        { name: "Ce que donne un chef", words: ["CONSIGNE", "DIRECTIVE", "INJONCTION"] },
        { name: "Une chambre bien tenue", words: ["RANGÉ", "NET", "IMPECCABLE"] },
        { name: "Communautés religieuses", words: ["BÉNÉDICTINS", "FRANCISCAINS", "JÉSUITES"] },
        { name: "Une suite logique", words: ["SÉQUENCE", "CLASSEMENT", "SUCCESSION"] },
      ],
    },
    sheet: {
      title: "Feuille de route",
      pivot: "FEUILLE",
      categories: [
        { name: "Sur un arbre", words: ["BOURGEON", "BRANCHE", "ÉCORCE"] },
        { name: "Papeterie", words: ["CAHIER", "CLASSEUR", "AGRAFEUSE"] },
        { name: "Paperasse administrative", words: ["FORMULAIRE", "BULLETIN", "FICHE"] },
        { name: "Métal en couche mince", words: ["LAMELLE", "PLAQUE", "PELLICULE"] },
      ],
    },
    seal: {
      title: "Le cachet de la poste",
      pivot: "CACHET",
      categories: [
        { name: "À la pharmacie", words: ["COMPRIMÉ", "GÉLULE", "SIROP"] },
        { name: "Ce que touche un artiste", words: ["SALAIRE", "HONORAIRES", "PAIE"] },
        { name: "Sur un document officiel", words: ["TAMPON", "SCEAU", "SIGNATURE"] },
        { name: "Du charme", words: ["CARACTÈRE", "ALLURE", "ÉLÉGANCE"] },
      ],
    },
    pipe: {
      title: "Flûte alors !",
      pivot: "FLÛTE",
      categories: [
        { name: "Instruments à vent", words: ["HAUTBOIS", "CLARINETTE", "TROMPETTE"] },
        { name: "Chez le boulanger", words: ["BAGUETTE", "FICELLE", "ÉPI"] },
        { name: "Pour le champagne", words: ["COUPE", "BULLES", "TOAST"] },
        { name: "Mince !", words: ["ZUT", "DIANTRE", "PUNAISE"] },
      ],
    },
    fry: {
      title: "Mousse au chocolat",
      pivot: "MOUSSE",
      categories: [
        { name: "Desserts", words: ["CRÈME", "FLAN", "TIRAMISU"] },
        { name: "Sur les rochers humides", words: ["LICHEN", "FOUGÈRE", "ALGUE"] },
        { name: "Sur un bateau", words: ["MATELOT", "CAPITAINE", "TIMONIER"] },
        { name: "Une bière, familièrement", words: ["DEMI", "PRESSION", "BLONDE"] },
      ],
    },
    pound: {
      title: "Livre sterling",
      pivot: "LIVRE",
      categories: [
        { name: "À la bibliothèque", words: ["ROMAN", "TOME", "ESSAI"] },
        { name: "Monnaies du monde", words: ["EURO", "YEN", "DOLLAR"] },
        { name: "Unités de poids", words: ["KILO", "GRAMME", "TONNE"] },
        { name: "Apporte le colis", words: ["FACTEUR", "COURSIER", "TRANSPORTEUR"] },
      ],
    },
    well: {
      title: "À la source",
      pivot: "SOURCE",
      categories: [
        { name: "De l'eau qui jaillit", words: ["FONTAINE", "GEYSER", "PUITS"] },
        { name: "Le point de départ", words: ["ORIGINE", "RACINE", "CAUSE"] },
        { name: "En informatique", words: ["CODE", "PROGRAMME", "LOGICIEL"] },
        { name: "Qui renseigne le journaliste", words: ["INFORMATEUR", "TÉMOIN", "CONTACT"] },
      ],
    },
    scale: {
      title: "La courte échelle",
      pivot: "ÉCHELLE",
      categories: [
        { name: "Pour atteindre le plafond", words: ["ESCABEAU", "MARCHEPIED", "TABOURET"] },
        { name: "Réduction sur un plan", words: ["RAPPORT", "RATIO", "PROPORTION"] },
        { name: "Instruments gradués", words: ["THERMOMÈTRE", "BAROMÈTRE", "JAUGE"] },
        { name: "Ascension sociale", words: ["HIÉRARCHIE", "PROMOTION", "CARRIÈRE"] },
      ],
    },
    spell: {
      title: "Le sort en est jeté",
      pivot: "SORT",
      categories: [
        { name: "Sorcellerie", words: ["MALÉFICE", "ENVOÛTEMENT", "VAUDOU"] },
        { name: "Ce qui est écrit d'avance", words: ["DESTIN", "FATALITÉ", "KARMA"] },
        { name: "La chance décide", words: ["LOTERIE", "TOMBOLA", "HASARD"] },
        { name: "Prendre la porte", words: ["PARTIR", "QUITTER", "DÉCAMPER"] },
      ],
    },
    date: {
      title: "Siège social",
      pivot: "SIÈGE",
      categories: [
        { name: "Pour s'asseoir", words: ["FAUTEUIL", "BANC", "CHAISE"] },
        { name: "L'armée encercle la ville", words: ["BLOCUS", "ASSAUT", "ENCERCLEMENT"] },
        { name: "Le cœur d'une entreprise", words: ["DIRECTION", "CENTRALE", "ADMINISTRATION"] },
        { name: "Au Parlement", words: ["DÉPUTÉ", "MANDAT", "SCRUTIN"] },
      ],
    },
    press: {
      title: "Plat du jour",
      pivot: "PLAT",
      categories: [
        { name: "Sur la table du dîner", words: ["RAGOÛT", "GRATIN", "RÔTI"] },
        { name: "Sans relief", words: ["PLAINE", "HORIZONTAL", "LISSE"] },
        { name: "Batterie à zéro", words: ["DÉCHARGÉ", "VIDÉ", "ÉPUISÉ"] },
        { name: "Faire la cour", words: ["DRAGUER", "COURTISER", "FLIRTER"] },
      ],
    },
    clip: {
      title: "Pince-sans-rire",
      pivot: "PINCE",
      categories: [
        { name: "Dans la boîte à outils", words: ["TENAILLE", "CLÉ", "MARTEAU"] },
        { name: "Sur un homard", words: ["CARAPACE", "ANTENNE", "QUEUE"] },
        { name: "Couture", words: ["PLI", "OURLET", "BOUTONNIÈRE"] },
        { name: "Ce qu'on serre pour dire bonjour", words: ["POIGNÉE", "PAUME", "MAIN"] },
      ],
    },
    pitch: {
      title: "Donner le ton",
      pivot: "TON",
      categories: [
        { name: "Intervalles musicaux", words: ["OCTAVE", "TIERCE", "QUINTE"] },
        { name: "Manière de parler", words: ["INFLEXION", "ACCENT", "VOIX"] },
        { name: "Couleurs", words: ["NUANCE", "TEINTE", "COLORIS"] },
        { name: "Dans l'air du temps", words: ["TENDANCE", "GOÛT", "MODE"] },
      ],
    },
    jam: {
      title: "Boîte de nuit",
      pivot: "BOÎTE",
      categories: [
        { name: "Emballages", words: ["CARTON", "ÉTUI", "COFFRET"] },
        { name: "Sortir le samedi soir", words: ["DISCOTHÈQUE", "CABARET", "DANCING"] },
        { name: "L'employeur, familièrement", words: ["SOCIÉTÉ", "FIRME", "ENTREPRISE"] },
        { name: "Sous le capot", words: ["EMBRAYAGE", "MOTEUR", "TRANSMISSION"] },
      ],
    },
    drop: {
      title: "Chute libre",
      pivot: "CHUTE",
      categories: [
        { name: "Perdre l'équilibre", words: ["GLISSADE", "CULBUTE", "PLONGEON"] },
        { name: "La fin d'une blague", words: ["DÉNOUEMENT", "FINAL", "PUNCHLINE"] },
        { name: "Restes de tissu", words: ["RETAILLE", "COUPON", "ROGNURE"] },
        { name: "Les prix dégringolent", words: ["BAISSE", "RECUL", "DÉCLIN"] },
      ],
    },
    crash: {
      title: "Coup de maître",
      pivot: "COUP",
      categories: [
        { name: "Frapper", words: ["GIFLE", "CLAQUE", "TAPE"] },
        { name: "Boire un verre", words: ["GORGÉE", "RASADE", "LAMPÉE"] },
        { name: "Le plan des gangsters", words: ["CAMBRIOLAGE", "BRAQUAGE", "CASSE"] },
        { name: "Aimer au premier regard", words: ["BÉGUIN", "FLAMME", "AMOURETTE"] },
      ],
    },
    palm: {
      title: "Canon !",
      pivot: "CANON",
      categories: [
        { name: "Artillerie", words: ["OBUS", "MORTIER", "BOULET"] },
        { name: "Formes musicales", words: ["FUGUE", "CHORAL", "REFRAIN"] },
        { name: "Règles de l'Église", words: ["DOGME", "RITE", "LITURGIE"] },
        { name: "Qui plaît à l'œil", words: ["BEAU", "JOLI", "SUPERBE"] },
      ],
    },
    light: {
      title: "Clair comme de l'eau de roche",
      pivot: "CLAIR",
      categories: [
        { name: "Bien éclairé", words: ["LUMINEUX", "ENSOLEILLÉ", "RADIEUX"] },
        { name: "Facile à comprendre", words: ["LIMPIDE", "ÉVIDENT", "NET"] },
        { name: "Teintes douces", words: ["PASTEL", "PÂLE", "IVOIRE"] },
        { name: "Peu épais", words: ["LIQUIDE", "FLUIDE", "DILUÉ"] },
      ],
    },
    mint: {
      title: "Frais et dispos",
      pivot: "FRAIS",
      categories: [
        { name: "Il fait un peu froid", words: ["FRISQUET", "GLACÉ", "VIVIFIANT"] },
        { name: "Ce que ça coûte", words: ["DÉPENSES", "COÛTS", "CHARGES"] },
        { name: "Tout nouveau", words: ["RÉCENT", "NEUF", "INÉDIT"] },
        { name: "En pleine forme", words: ["DISPOS", "REPOSÉ", "REQUINQUÉ"] },
      ],
    },
    post: {
      title: "Poste restante",
      pivot: "POSTE",
      categories: [
        { name: "Au travail", words: ["EMPLOI", "FONCTION", "JOB"] },
        { name: "Ce que le facteur apporte", words: ["COLIS", "COURRIER", "LETTRE"] },
        { name: "Dans le salon de grand-père", words: ["TÉLÉVISEUR", "RÉCEPTEUR", "TRANSISTOR"] },
        { name: "Où travaillent les policiers", words: ["COMMISSARIAT", "GENDARMERIE", "BRIGADE"] },
      ],
    },
    spin: {
      title: "Une autre manche",
      pivot: "MANCHE",
      categories: [
        { name: "Sur une veste", words: ["COL", "REVERS", "DOUBLURE"] },
        { name: "Ce qu'on tient pour porter", words: ["POIGNÉE", "ANSE", "BRAS"] },
        { name: "Au tennis", words: ["SET", "JEU", "POINT"] },
        { name: "Demander la charité", words: ["MENDIER", "QUÊTER", "QUÉMANDER"] },
      ],
    },
    shower: {
      title: "Bain de foule",
      pivot: "BAIN",
      categories: [
        { name: "Pour se laver", words: ["SAVON", "ÉPONGE", "SERVIETTE"] },
        { name: "Pour bronzer", words: ["SOLEIL", "PLAGE", "TRANSAT"] },
        { name: "Au milieu des gens", words: ["FOULE", "PUBLIC", "COHUE"] },
        { name: "Qui connaît le métier", words: ["HABITUÉ", "ROMPU", "AGUERRI"] },
      ],
    },
    deck: {
      title: "Faire le pont",
      pivot: "PONT",
      categories: [
        { name: "Pour franchir une rivière", words: ["VIADUC", "PASSERELLE", "GUÉ"] },
        { name: "Sur un navire", words: ["CABINE", "HUBLOT", "COQUE"] },
        { name: "Jour de congé", words: ["FÉRIÉ", "REPOS", "VACANCES"] },
        { name: "Chez le dentiste", words: ["COURONNE", "PLOMBAGE", "IMPLANT"] },
      ],
    },
    break: {
      title: "Coupure de presse",
      pivot: "COUPURE",
      categories: [
        { name: "Petite blessure", words: ["ENTAILLE", "ÉGRATIGNURE", "PLAIE"] },
        { name: "Plus d'électricité", words: ["BLACKOUT", "PANNE", "DÉLESTAGE"] },
        { name: "Découpé dans le journal", words: ["ARTICLE", "EXTRAIT", "COLONNE"] },
        { name: "On fait une pause", words: ["INTERRUPTION", "ENTRACTE", "RÉCRÉ"] },
      ],
    },
    nail: {
      title: "Le clou du spectacle",
      pivot: "CLOU",
      categories: [
        { name: "Quincaillerie", words: ["VIS", "RIVET", "CROCHET"] },
        { name: "Le meilleur moment", words: ["APOGÉE", "SOMMET", "BOUQUET"] },
        { name: "Épices", words: ["POIVRE", "CUMIN", "SAFRAN"] },
        { name: "Sur la peau", words: ["ABCÈS", "KYSTE", "PUSTULE"] },
      ],
    },
    brush: {
      title: "Touche finale",
      pivot: "TOUCHE",
      categories: [
        { name: "Sur un clavier", words: ["ESPACE", "ENTRÉE", "MAJUSCULE"] },
        { name: "À la pêche", words: ["MORSURE", "PRISE", "APPÂT"] },
        { name: "Un style", words: ["ALLURE", "LOOK", "DÉGAINE"] },
        { name: "Sur le bord du terrain", words: ["BANC", "ENTRAÎNEUR", "REMPLAÇANT"] },
      ],
    },
    tank: {
      title: "Char d'assaut",
      pivot: "CHAR",
      categories: [
        { name: "Sur le champ de bataille", words: ["BLINDÉ", "TANK", "PANZER"] },
        { name: "Course romaine", words: ["QUADRIGE", "AURIGE", "HIPPODROME"] },
        { name: "Carnaval", words: ["DÉFILÉ", "COSTUME", "CONFETTIS"] },
        { name: "Une voiture, au Québec", words: ["AUTO", "VÉHICULE", "BERLINE"] },
      ],
    },
    vault: {
      title: "Sous la voûte",
      pivot: "VOÛTE",
      categories: [
        { name: "En architecture", words: ["ARCHE", "ARCADE", "COUPOLE"] },
        { name: "Sous le pied", words: ["TALON", "CHEVILLE", "ORTEIL"] },
        { name: "Au-dessus de nos têtes", words: ["FIRMAMENT", "CIEL", "COSMOS"] },
        { name: "À la cave", words: ["CELLIER", "CRYPTE", "CAVEAU"] },
      ],
    },
    figure: {
      title: "Faire bonne figure",
      pivot: "FIGURE",
      categories: [
        { name: "Ce qu'on voit dans le miroir", words: ["VISAGE", "FACE", "FRIMOUSSE"] },
        { name: "Patinage artistique", words: ["PIROUETTE", "SAUT", "SPIRALE"] },
        { name: "Cartes à jouer", words: ["ROI", "DAME", "VALET"] },
        { name: "Une personnalité", words: ["PERSONNAGE", "NOTABLE", "ICÔNE"] },
      ],
    },
    hook: {
      title: "Un crochet par…",
      pivot: "CROCHET",
      categories: [
        { name: "Sur le ring", words: ["UPPERCUT", "DIRECT", "JAB"] },
        { name: "Tricot", words: ["AIGUILLE", "LAINE", "MAILLE"] },
        { name: "Ponctuation", words: ["PARENTHÈSE", "ACCOLADE", "TIRET"] },
        { name: "Un détour", words: ["DÉVIATION", "ZIGZAG", "CONTOURNEMENT"] },
      ],
    },
    plot: {
      title: "Sur le terrain",
      pivot: "TERRAIN",
      categories: [
        { name: "À bâtir", words: ["PARCELLE", "LOT", "LOTISSEMENT"] },
        { name: "Pour le sport", words: ["STADE", "COURT", "GAZON"] },
        { name: "Loin du bureau", words: ["ENQUÊTE", "REPORTAGE", "MISSION"] },
        { name: "Ce que lit le général", words: ["TOPOGRAPHIE", "RELIEF", "ALTITUDE"] },
      ],
    },
    court: {
      title: "La cour des grands",
      pivot: "COUR",
      categories: [
        { name: "À l'école", words: ["RÉCRÉ", "PRÉAU", "CLOCHE"] },
        { name: "Autour du roi", words: ["NOBLE", "DUC", "MARQUIS"] },
        { name: "Justice", words: ["TRIBUNAL", "JUGE", "PROCÈS"] },
        { name: "Séduire", words: ["FLIRTER", "CHARMER", "CONQUÉRIR"] },
      ],
    },
    trip: {
      title: "Course contre la montre",
      pivot: "COURSE",
      categories: [
        { name: "Compétition", words: ["MARATHON", "SPRINT", "RELAIS"] },
        { name: "Au supermarché", words: ["CADDIE", "LISTE", "PANIER"] },
        { name: "En taxi", words: ["COMPTEUR", "CHAUFFEUR", "TRAJET"] },
        { name: "Le chemin des astres", words: ["ORBITE", "TRAJECTOIRE", "PARCOURS"] },
      ],
    },
    turn: {
      title: "Partie remise",
      pivot: "PARTIE",
      categories: [
        { name: "Un morceau du tout", words: ["PORTION", "FRACTION", "SEGMENT"] },
        { name: "Une sortie entre amis", words: ["PIQUENIQUE", "EXCURSION", "ESCAPADE"] },
        { name: "Au tribunal", words: ["PLAIGNANT", "DÉFENDEUR", "ACCUSÉ"] },
        { name: "Elle n'est plus là", words: ["ABSENTE", "DISPARUE", "ENVOLÉE"] },
      ],
    },
    lead: {
      title: "Sommeil de plomb",
      pivot: "PLOMB",
      categories: [
        { name: "Métaux lourds", words: ["MERCURE", "ÉTAIN", "NICKEL"] },
        { name: "Sur le tableau électrique", words: ["DISJONCTEUR", "FUSIBLE", "COMPTEUR"] },
        { name: "Au bout de la ligne du pêcheur", words: ["LEST", "FLOTTEUR", "MOULINET"] },
        { name: "Un soleil écrasant", words: ["CANICULE", "FOURNAISE", "CHALEUR"] },
      ],
    },
    stamp: {
      title: "Tampon encreur",
      pivot: "TAMPON",
      categories: [
        { name: "Sur un document", words: ["SCEAU", "VISA", "PARAPHE"] },
        { name: "Pour se démaquiller", words: ["COTON", "DÉMAQUILLANT", "LINGETTE"] },
        { name: "Amortit les chocs", words: ["AMORTISSEUR", "RESSORT", "COUSSIN"] },
        { name: "Pour récurer", words: ["ÉPONGE", "GRATTOIR", "BROSSE"] },
      ],
    },
    panel: {
      title: "Tomber dans le panneau",
      pivot: "PANNEAU",
      categories: [
        { name: "Sur la route", words: ["STOP", "INDICATION", "BALISE"] },
        { name: "Menuiserie", words: ["PLANCHE", "CONTREPLAQUÉ", "LAMBRIS"] },
        { name: "Publicité", words: ["AFFICHE", "ENSEIGNE", "ÉCRAN"] },
        { name: "On s'y fait prendre", words: ["PIÈGE", "LEURRE", "EMBUSCADE"] },
      ],
    },
    peak: {
      title: "Sur la pointe des pieds",
      pivot: "POINTE",
      categories: [
        { name: "Là où ça se termine", words: ["BOUT", "EXTRÉMITÉ", "SOMMET"] },
        { name: "Danse classique", words: ["BALLERINE", "TUTU", "CHAUSSON"] },
        { name: "Une toute petite quantité", words: ["SOUPÇON", "PINCÉE", "BRIN"] },
        { name: "Heure de grande affluence", words: ["RUSH", "COHUE", "BOUSCULADE"] },
      ],
    },
    switch: {
      title: "À bascule",
      pivot: "BASCULE",
      categories: [
        { name: "Cour de récré", words: ["BALANÇOIRE", "TOBOGGAN", "TOURNIQUET"] },
        { name: "Pour peser", words: ["BALANCE", "PESON", "TRÉBUCHET"] },
        { name: "Électronique", words: ["INTERRUPTEUR", "COMMUTATEUR", "RELAIS"] },
        { name: "Changement radical", words: ["RENVERSEMENT", "RETOURNEMENT", "REVIREMENT"] },
      ],
    },
    match: {
      title: "Sainte alliance",
      pivot: "ALLIANCE",
      categories: [
        { name: "Bijoux", words: ["BAGUE", "CHEVALIÈRE", "SOLITAIRE"] },
        { name: "Politique", words: ["COALITION", "PACTE", "ENTENTE"] },
        { name: "Liens de famille", words: ["GENDRE", "BRU", "COUSIN"] },
        { name: "Mélange harmonieux", words: ["MARIAGE", "COMBINAISON", "ACCORD"] },
      ],
    },
    sink: {
      title: "À fond",
      pivot: "FOND",
      categories: [
        { name: "Tout en bas", words: ["BASE", "SOCLE", "PLANCHER"] },
        { name: "Derrière le sujet", words: ["DÉCOR", "TOILE", "PAYSAGE"] },
        { name: "L'essentiel", words: ["SUBSTANCE", "NOYAU", "CŒUR"] },
        { name: "Ce qu'il faut au marathonien", words: ["ENDURANCE", "RÉSISTANCE", "SOUFFLE"] },
      ],
    },
    plug: {
      title: "Prise de tête",
      pivot: "PRISE",
      categories: [
        { name: "Électricité", words: ["FICHE", "RALLONGE", "ADAPTATEUR"] },
        { name: "Ce qu'on a attrapé", words: ["CAPTURE", "BUTIN", "TROPHÉE"] },
        { name: "Où poser la main en escalade", words: ["APPUI", "SAILLIE", "ASPÉRITÉ"] },
        { name: "Judo", words: ["CLÉ", "IMMOBILISATION", "BALAYAGE"] },
      ],
    },
    snap: {
      title: "Avoir du cran",
      pivot: "CRAN",
      categories: [
        { name: "Courage", words: ["AUDACE", "BRAVOURE", "CULOT"] },
        { name: "Marque dans le bois", words: ["ENCOCHE", "RAINURE", "ENTAILLE"] },
        { name: "Pour serrer sa ceinture", words: ["BOUCLE", "ARDILLON", "LANIÈRE"] },
        { name: "Cheveux ondulés", words: ["FRISURE", "MÈCHE", "PERMANENTE"] },
      ],
    },
    slate: {
      title: "Ardoise effacée",
      pivot: "ARDOISE",
      categories: [
        { name: "Sur le toit", words: ["TUILE", "BARDEAU", "CHAUME"] },
        { name: "À l'école d'autrefois", words: ["CRAIE", "ENCRIER", "PLUMIER"] },
        { name: "Ce qu'on doit au bistrot", words: ["DETTE", "CRÉDIT", "IMPAYÉ"] },
        { name: "Nuances de gris", words: ["ANTHRACITE", "CENDRE", "PERLE"] },
      ],
    },
    grain: {
      title: "Un grain de folie",
      pivot: "GRAIN",
      categories: [
        { name: "Céréales", words: ["BLÉ", "ORGE", "AVOINE"] },
        { name: "Gros temps en mer", words: ["RAFALE", "BOURRASQUE", "TEMPÊTE"] },
        { name: "Au toucher", words: ["TEXTURE", "RELIEF", "RUGOSITÉ"] },
        { name: "Une pointe d'excentricité", words: ["FOLIE", "FANTAISIE", "ORIGINALITÉ"] },
      ],
    },
    prime: {
      title: "Prime time",
      pivot: "PRIME",
      categories: [
        { name: "Sur la fiche de paie", words: ["BONUS", "GRATIFICATION", "TREIZIÈME"] },
        { name: "Assurance", words: ["COTISATION", "POLICE", "FRANCHISE"] },
        { name: "Offert avec l'achat", words: ["CADEAU", "GADGET", "ÉCHANTILLON"] },
        { name: "Tout au début", words: ["PREMIER", "INITIAL", "PRÉCOCE"] },
      ],
    },
    swing: {
      title: "Prendre son élan",
      pivot: "ÉLAN",
      categories: [
        { name: "Grands cervidés", words: ["RENNE", "CERF", "CARIBOU"] },
        { name: "Bonté soudaine", words: ["GÉNÉROSITÉ", "GESTE", "DON"] },
        { name: "Enthousiasme", words: ["FERVEUR", "ARDEUR", "FOUGUE"] },
        { name: "Ce qui emporte", words: ["DYNAMIQUE", "LANCÉE", "VITESSE"] },
      ],
    },
    shift: {
      title: "Quart de tour",
      pivot: "QUART",
      categories: [
        { name: "Fractions", words: ["MOITIÉ", "TIERS", "CINQUIÈME"] },
        { name: "Sur un bateau, la nuit", words: ["VEILLE", "GARDE", "RELÈVE"] },
        { name: "Pour boire au bivouac", words: ["TIMBALE", "GOBELET", "BIDON"] },
        { name: "Tournoi", words: ["FINALE", "POULE", "ÉLIMINATOIRE"] },
      ],
    },
    strain: {
      title: "Sous tension",
      pivot: "TENSION",
      categories: [
        { name: "Électricité", words: ["VOLT", "AMPÈRE", "WATT"] },
        { name: "Chez le médecin", words: ["PRESSION", "POULS", "ARTÈRE"] },
        { name: "Stress", words: ["NERVOSITÉ", "ANXIÉTÉ", "ANGOISSE"] },
        { name: "Diplomatie", words: ["CONFLIT", "CRISE", "FRICTION"] },
      ],
    },
    string: {
      title: "Sur la corde raide",
      pivot: "CORDE",
      categories: [
        { name: "Alpinisme", words: ["MOUSQUETON", "HARNAIS", "PITON"] },
        { name: "Sur un violon", words: ["ARCHET", "CHEVALET", "VOLUTE"] },
        { name: "Pour chanter", words: ["LARYNX", "GORGE", "VOIX"] },
        { name: "Boxe", words: ["RING", "GONG", "ROUND"] },
      ],
    },
    shock: {
      title: "Prix choc",
      pivot: "CHOC",
      categories: [
        { name: "Collision", words: ["IMPACT", "HEURT", "PERCUSSION"] },
        { name: "Émotion forte", words: ["STUPEUR", "EFFROI", "SAISISSEMENT"] },
        { name: "Prix cassés", words: ["PROMOTION", "RABAIS", "SOLDE"] },
        { name: "Soldats d'élite", words: ["COMMANDO", "PARACHUTISTE", "LÉGIONNAIRE"] },
      ],
    },
    forge: {
      title: "De la même trempe",
      pivot: "TREMPE",
      categories: [
        { name: "Métallurgie", words: ["ACIER", "RECUIT", "ALLIAGE"] },
        { name: "Une raclée", words: ["FESSÉE", "ROSSÉE", "RACLÉE"] },
        { name: "De ce calibre", words: ["ENVERGURE", "ÉTOFFE", "VALEUR"] },
        { name: "Sorti de la douche tout habillé", words: ["MOUILLÉ", "HUMIDE", "IMBIBÉ"] },
      ],
    },
    channel: {
      title: "Canal historique",
      pivot: "CANAL",
      categories: [
        { name: "Navigation fluviale", words: ["ÉCLUSE", "PÉNICHE", "BERGE"] },
        { name: "Télévision", words: ["CHAÎNE", "ÉMISSION", "FRÉQUENCE"] },
        { name: "Anatomie", words: ["CONDUIT", "VAISSEAU", "ARTÈRE"] },
        { name: "Intermédiaire", words: ["VOIE", "FILIÈRE", "ENTREMISE"] },
      ],
    },
    steam: {
      title: "À toute vapeur",
      pivot: "VAPEUR",
      categories: [
        { name: "Cuisson douce", words: ["POCHÉ", "MIJOTÉ", "ÉTUVÉ"] },
        { name: "On n'y voit plus rien", words: ["BUÉE", "BROUILLARD", "BRUME"] },
        { name: "Dans une vieille locomotive", words: ["CHAUDIÈRE", "PISTON", "CHARBON"] },
        { name: "Un malaise", words: ["VERTIGE", "ÉTOURDISSEMENT", "FAIBLESSE"] },
      ],
    },
    rail: {
      title: "La voie royale",
      pivot: "VOIE",
      categories: [
        { name: "Chemin de fer", words: ["RAIL", "TRAVERSE", "AIGUILLAGE"] },
        { name: "Sur l'autoroute", words: ["FILE", "COULOIR", "BANDE"] },
        { name: "Le moyen d'y arriver", words: ["MOYEN", "CHEMIN", "MÉTHODE"] },
        { name: "Pour respirer", words: ["BRONCHES", "TRACHÉE", "POUMON"] },
      ],
    },
    stall: {
      title: "Banc d'essai",
      pivot: "BANC",
      categories: [
        { name: "Pour s'asseoir à plusieurs", words: ["BANQUETTE", "TABOURET", "POUF"] },
        { name: "Groupes d'animaux", words: ["TROUPEAU", "MEUTE", "ESSAIM"] },
        { name: "Sur la carte marine", words: ["RÉCIF", "ÉCUEIL", "ATOLL"] },
        { name: "Dans l'atelier", words: ["ÉTABLI", "ATELIER", "OUTILLAGE"] },
      ],
    },
    grade: {
      title: "Au niveau",
      pivot: "NIVEAU",
      categories: [
        { name: "Dans la caisse du maçon", words: ["ÉQUERRE", "RÈGLE", "COMPAS"] },
        { name: "Dans un jeu vidéo", words: ["BOSS", "VIE", "SCORE"] },
        { name: "Savoir-faire", words: ["MAÎTRISE", "COMPÉTENCE", "CAPACITÉ"] },
        { name: "Dans un immeuble", words: ["ÉTAGE", "PALIER", "MEZZANINE"] },
      ],
    },
    fan: {
      title: "Toute la palette",
      pivot: "PALETTE",
      categories: [
        { name: "Chez le peintre", words: ["CHEVALET", "PINCEAU", "TOILE"] },
        { name: "Dans l'entrepôt", words: ["CARTON", "CHARIOT", "TRANSPALETTE"] },
        { name: "À la boucherie", words: ["ÉCHINE", "JARRET", "RÔTI"] },
        { name: "Un large choix", words: ["GAMME", "ÉVENTAIL", "ASSORTIMENT"] },
      ],
    },
    drive: {
      title: "Au volant",
      pivot: "VOLANT",
      categories: [
        { name: "Pour conduire", words: ["FREIN", "EMBRAYAGE", "CLIGNOTANT"] },
        { name: "Badminton", words: ["RAQUETTE", "FILET", "SMASH"] },
        { name: "Couture", words: ["FRONCE", "RUCHÉ", "DENTELLE"] },
        { name: "Comme les oiseaux", words: ["AILÉ", "AÉRIEN", "PLANANT"] },
      ],
    },
    charm: {
      title: "Se porter comme un charme",
      pivot: "CHARME",
      categories: [
        { name: "Séduction", words: ["ATTRAIT", "GRÂCE", "MAGNÉTISME"] },
        { name: "Arbres de nos forêts", words: ["HÊTRE", "CHÊNE", "BOULEAU"] },
        { name: "Sortilège", words: ["ENVOÛTEMENT", "SORTILÈGE", "ENCHANTEMENT"] },
        { name: "En pleine santé", words: ["VIGUEUR", "FORME", "VITALITÉ"] },
      ],
    },
    sole: {
      title: "Talon d'Achille",
      pivot: "TALON",
      categories: [
        { name: "Sur une chaussure", words: ["SEMELLE", "LACET", "EMPEIGNE"] },
        { name: "Dans un chéquier", words: ["SOUCHE", "REÇU", "DUPLICATA"] },
        { name: "Cartes à jouer", words: ["PIOCHE", "DÉFAUSSE", "DONNE"] },
        { name: "Sur le pied", words: ["ORTEIL", "CHEVILLE", "PLANTE"] },
      ],
    },
    spot: {
      title: "La crème de la crème",
      pivot: "CRÈME",
      categories: [
        { name: "Produits laitiers", words: ["LAIT", "BEURRE", "YAOURT"] },
        { name: "Sur l'étagère de la salle de bains", words: ["LOTION", "BAUME", "ONGUENT"] },
        { name: "Les meilleurs", words: ["ÉLITE", "GRATIN", "FLEURON"] },
        { name: "Couleurs", words: ["BEIGE", "ÉCRU", "IVOIRE"] },
      ],
    },
    cross: {
      title: "De travers",
      pivot: "TRAVERS",
      categories: [
        { name: "Un défaut", words: ["MANIE", "FAIBLESSE", "PENCHANT"] },
        { name: "Pas droit", words: ["TORDU", "OBLIQUE", "PENCHÉ"] },
        { name: "Chez le charcutier", words: ["CÔTE", "ÉCHINE", "JAMBON"] },
        { name: "Le flanc du navire", words: ["BÂBORD", "TRIBORD", "FLANC"] },
      ],
    },
    run: {
      title: "Mener grand train",
      pivot: "TRAIN",
      categories: [
        { name: "À la gare", words: ["WAGON", "LOCOMOTIVE", "QUAI"] },
        { name: "Le rythme", words: ["ALLURE", "CADENCE", "TEMPO"] },
        { name: "Sur un avion", words: ["AILE", "FUSELAGE", "RÉACTEUR"] },
        { name: "Le mode de vie", words: ["STANDING", "CONFORT", "DÉPENSES"] },
      ],
    },
    tender: {
      title: "Un cœur tendre",
      pivot: "TENDRE",
      categories: [
        { name: "Une viande réussie", words: ["MOELLEUX", "FONDANT", "JUTEUX"] },
        { name: "Plein d'affection", words: ["DOUX", "CÂLIN", "AFFECTUEUX"] },
        { name: "Étirer", words: ["BANDER", "RAIDIR", "ALLONGER"] },
        { name: "Présenter la main", words: ["OFFRIR", "AVANCER", "PROPOSER"] },
      ],
    },
    present: {
      title: "Présent !",
      pivot: "PRÉSENT",
      categories: [
        { name: "Un cadeau", words: ["OFFRANDE", "ÉTRENNE", "SURPRISE"] },
        { name: "Maintenant", words: ["ACTUEL", "COURANT", "CONTEMPORAIN"] },
        { name: "Pas absent", words: ["ICI", "LÀ", "DISPONIBLE"] },
        { name: "Temps de conjugaison", words: ["PASSÉ", "FUTUR", "IMPARFAIT"] },
      ],
    },
    temper: {
      title: "Sautes d'humeur",
      pivot: "HUMEUR",
      categories: [
        { name: "État d'esprit", words: ["MORAL", "ÉTAT", "DISPOSITION"] },
        { name: "Grincheux", words: ["IRRITATION", "GROGNE", "MAUSSADERIE"] },
        { name: "Médecine antique", words: ["BILE", "SANG", "FLEGME"] },
        { name: "Dans l'œil", words: ["RÉTINE", "CORNÉE", "IRIS"] },
      ],
    },
    mold: {
      title: "Casser le moule",
      pivot: "MOULE",
      categories: [
        { name: "Fruits de mer", words: ["HUÎTRE", "PALOURDE", "BULOT"] },
        { name: "Pour cuire un gâteau", words: ["RAMEQUIN", "TERRINE", "PLAQUE"] },
        { name: "Fonderie", words: ["MATRICE", "GABARIT", "EMPREINTE"] },
        { name: "Un vêtement près du corps", words: ["AJUSTÉ", "SERRÉ", "COLLANT"] },
      ],
    },
    score: {
      title: "Marque déposée",
      pivot: "MARQUE",
      categories: [
        { name: "Sur l'étiquette", words: ["LOGO", "GRIFFE", "LABEL"] },
        { name: "À la fin du match", words: ["RÉSULTAT", "POINTS", "TABLEAU"] },
        { name: "Une trace", words: ["CICATRICE", "STIGMATE", "SILLON"] },
        { name: "Un signe d'estime", words: ["PREUVE", "TÉMOIGNAGE", "GESTE"] },
      ],
    },
    floor: {
      title: "Sur le parquet",
      pivot: "PARQUET",
      categories: [
        { name: "Au sol", words: ["PLANCHER", "CARRELAGE", "LINO"] },
        { name: "Justice", words: ["PROCUREUR", "MAGISTRAT", "MINISTÈRE"] },
        { name: "À la Bourse", words: ["CORBEILLE", "COTATION", "TRADER"] },
        { name: "Basket", words: ["PANIER", "DRIBBLE", "REBOND"] },
      ],
    },
    draw: {
      title: "Tirage au sort",
      pivot: "TIRAGE",
      categories: [
        { name: "Loterie", words: ["LOTO", "GAGNANT", "NUMÉRO"] },
        { name: "Imprimerie", words: ["EXEMPLAIRE", "ÉDITION", "IMPRESSION"] },
        { name: "Cheminée", words: ["CONDUIT", "ÂTRE", "SUIE"] },
        { name: "Photo argentique", words: ["ÉPREUVE", "NÉGATIF", "PELLICULE"] },
      ],
    },
    volume: {
      title: "Baisser le volume",
      pivot: "VOLUME",
      categories: [
        { name: "Le son", words: ["DÉCIBEL", "AMPLI", "SONORITÉ"] },
        { name: "Dans une bibliothèque", words: ["TOME", "OPUS", "RECUEIL"] },
        { name: "Contenance", words: ["LITRE", "CAPACITÉ", "CUBAGE"] },
        { name: "Chez le coiffeur", words: ["BRUSHING", "GONFLANT", "ÉPAISSEUR"] },
      ],
    },
    mark: {
      title: "En titre",
      pivot: "TITRE",
      categories: [
        { name: "En première page", words: ["UNE", "ARTICLE", "RUBRIQUE"] },
        { name: "Ce que gagne le champion", words: ["CEINTURE", "COURONNE", "TROPHÉE"] },
        { name: "À la Bourse", words: ["ACTION", "BON", "PART"] },
        { name: "Noblesse", words: ["DUC", "BARON", "MARQUIS"] },
      ],
    },
  },
  emoji: null,
  daily: {},
};

import type { LocaleContent } from "./types.ts";

export const content: LocaleContent = {
  keys: ["FUEGO", "BRASAS", "ENREDO", "ESPEJOS", "ESPIRAL", "PALABRA", "ENIGMAS", "REMOLINO", "PICARDÍA", "ENTEREZA", "ACROBACIA", "GENIALIDAD"],
  decoys: ["JIRAFA", "VOLCÁN", "PARAGUAS", "TORTUGA", "BICICLETA", "SANDÍA", "PINGÜINO", "CACTUS", "IGLÚ", "CEBRA", "PIRÁMIDE", "ZANAHORIA", "CANGURO", "TELESCOPIO", "SEMÁFORO", "COCODRILO", "PIÑA", "MICROSCOPIO", "CASTILLO", "SUBMARINO"],
  campaign: {
    star: {
      title: "Nace una estrella",
      pivot: "ESTRELLA",
      categories: [
        { name: "En el cielo de noche", words: ["LUNA", "COMETA", "PLANETA"] },
        { name: "Gente del espectáculo", words: ["ÍDOLO", "LEYENDA", "DIVA"] },
        { name: "Reconocimientos", words: ["MEDALLA", "TROFEO", "DIPLOMA"] },
        { name: "Símbolos y formas", words: ["CORAZÓN", "FLECHA", "CRUZ"] },
      ],
    },
    trunk: {
      title: "De planta baja",
      pivot: "PLANTA",
      categories: [
        { name: "Crecen en el jardín", words: ["HELECHO", "ARBUSTO", "MUSGO"] },
        { name: "Niveles de un edificio", words: ["SÓTANO", "ÁTICO", "AZOTEA"] },
        { name: "Partes del pie", words: ["TALÓN", "EMPEINE", "TOBILLO"] },
        { name: "En el polígono industrial", words: ["NAVE", "ALMACÉN", "TALLER"] },
      ],
    },
    ring: {
      title: "Carta blanca",
      pivot: "CARTA",
      categories: [
        { name: "Llegan por correo", words: ["SOBRE", "POSTAL", "TELEGRAMA"] },
        { name: "En la baraja", words: ["AS", "SOTA", "COMODÍN"] },
        { name: "Lo que trae el camarero", words: ["MENÚ", "BANDEJA", "PROPINA"] },
        { name: "Para orientarse", words: ["MAPA", "PLANO", "BRÚJULA"] },
      ],
    },
    bug: {
      title: "Cargar las pilas",
      pivot: "PILA",
      categories: [
        { name: "Cables y conexiones", words: ["ENCHUFE", "CARGADOR", "ALARGADOR"] },
        { name: "Para fregar los platos", words: ["ESTROPAJO", "GRIFO", "DESAGÜE"] },
        { name: "Nombres propios", words: ["JUAN", "MARÍA", "PEDRO"] },
        { name: "Dentro de una iglesia", words: ["ALTAR", "PÚLPITO", "SACRISTÍA"] },
      ],
    },
    bank: {
      title: "Banco de pruebas",
      pivot: "BANCO",
      categories: [
        { name: "En una sucursal", words: ["CAJERO", "VENTANILLA", "PRÉSTAMO"] },
        { name: "Para sentarse", words: ["SILLA", "TABURETE", "SOFÁ"] },
        { name: "Nadan en grupo", words: ["SARDINA", "ATÚN", "ARENQUE"] },
        { name: "En la mesa del carpintero", words: ["SERRUCHO", "CEPILLO", "FORMÓN"] },
      ],
    },
    stick: {
      title: "A toda vela",
      pivot: "VELA",
      categories: [
        { name: "Alumbran", words: ["FAROL", "CANDIL", "QUINQUÉ"] },
        { name: "Partes de un barco", words: ["MÁSTIL", "PROA", "TIMÓN"] },
        { name: "Deportes acuáticos", words: ["SURF", "BUCEO", "KAYAK"] },
        { name: "Sin pegar ojo", words: ["VIGILIA", "DESVELO", "GUARDIA"] },
      ],
    },
    cap: {
      title: "Hoja en blanco",
      pivot: "HOJA",
      categories: [
        { name: "Partes de un árbol", words: ["RAÍZ", "TRONCO", "RAMA"] },
        { name: "Material escolar", words: ["CUADERNO", "LIBRETA", "CARPETA"] },
        { name: "Tienen filo", words: ["CUCHILLO", "NAVAJA", "ESPADA"] },
        { name: "Partes de una puerta", words: ["BISAGRA", "POMO", "CERROJO"] },
      ],
    },
    bat: {
      title: "Cambio de estación",
      pivot: "ESTACIÓN",
      categories: [
        { name: "Épocas del año", words: ["VERANO", "OTOÑO", "INVIERNO"] },
        { name: "En el andén", words: ["TREN", "VÍA", "BILLETE"] },
        { name: "En la radio", words: ["DIAL", "ANTENA", "LOCUTOR"] },
        { name: "En la gasolinera", words: ["SURTIDOR", "GASOLINA", "DIÉSEL"] },
      ],
    },
    club: {
      title: "Reacción en cadena",
      pivot: "CADENA",
      categories: [
        { name: "Joyas", words: ["PULSERA", "ANILLO", "PENDIENTE"] },
        { name: "Se ve en la tele", words: ["TELEDIARIO", "SERIE", "CONCURSO"] },
        { name: "Partes de una bici", words: ["PEDAL", "MANILLAR", "SILLÍN"] },
        { name: "Cordilleras", words: ["ANDES", "ALPES", "PIRINEOS"] },
      ],
    },
    spring: {
      title: "Caer en la red",
      pivot: "RED",
      categories: [
        { name: "Aparejos de pesca", words: ["CAÑA", "ANZUELO", "CEBO"] },
        { name: "Para conectarse", words: ["WIFI", "ROUTER", "MÓDEM"] },
        { name: "En la portería", words: ["PORTERO", "POSTE", "LARGUERO"] },
        { name: "Transporte público", words: ["METRO", "AUTOBÚS", "TRANVÍA"] },
      ],
    },
    cell: {
      title: "A campo abierto",
      pivot: "CAMPO",
      categories: [
        { name: "Cereales", words: ["TRIGO", "MAÍZ", "CEBADA"] },
        { name: "En el estadio", words: ["PORTERÍA", "CÉSPED", "GRADA"] },
        { name: "Vida rural", words: ["ALDEA", "GRANJA", "PUEBLO"] },
        { name: "Ramas del saber", words: ["FÍSICA", "HISTORIA", "BIOLOGÍA"] },
      ],
    },
    chip: {
      title: "Inflar el globo",
      pivot: "GLOBO",
      categories: [
        { name: "En un cumpleaños infantil", words: ["TARTA", "PIÑATA", "PAYASO"] },
        { name: "Nuestro planeta", words: ["TIERRA", "MUNDO", "ESFERA"] },
        { name: "En un cómic", words: ["VIÑETA", "BOCADILLO", "ONOMATOPEYA"] },
        { name: "Surcan el cielo", words: ["DIRIGIBLE", "AVIONETA", "ZEPELÍN"] },
      ],
    },
    wave: {
      title: "Buena onda",
      pivot: "ONDA",
      categories: [
        { name: "En la playa", words: ["MAREA", "ESPUMA", "ARENA"] },
        { name: "Se sintoniza", words: ["FRECUENCIA", "EMISORA", "CANAL"] },
        { name: "Cosas del pelo", words: ["BUCLE", "TRENZA", "FLEQUILLO"] },
        { name: "Lo que transmite una persona", words: ["CARISMA", "ENERGÍA", "ACTITUD"] },
      ],
    },
    glass: {
      title: "Claro como el cristal",
      pivot: "CRISTAL",
      categories: [
        { name: "Minerales y gemas", words: ["CUARZO", "AMATISTA", "DIAMANTE"] },
        { name: "Partes de una ventana", words: ["MARCO", "PERSIANA", "ALFÉIZAR"] },
        { name: "Para ver mejor", words: ["GAFAS", "LENTILLA", "MONÓCULO"] },
        { name: "Materiales delicados", words: ["PORCELANA", "CERÁMICA", "LOZA"] },
      ],
    },
    bark: {
      title: "Mala pata",
      pivot: "PATA",
      categories: [
        { name: "Partes de una silla", words: ["ASIENTO", "RESPALDO", "REPOSABRAZOS"] },
        { name: "Aves de corral", words: ["GALLINA", "PAVO", "GANSO"] },
        { name: "Partes de un animal", words: ["HOCICO", "RABO", "PEZUÑA"] },
        { name: "Mala suerte", words: ["GAFE", "INFORTUNIO", "DESGRACIA"] },
      ],
    },
    step: {
      title: "Paso a paso",
      pivot: "PASO",
      categories: [
        { name: "Al caminar", words: ["ZANCADA", "PISADA", "TRANCO"] },
        { name: "En la carretera de montaña", words: ["CURVA", "TÚNEL", "VIADUCTO"] },
        { name: "En Semana Santa", words: ["PROCESIÓN", "COFRADÍA", "NAZARENO"] },
        { name: "Partes de un proceso", words: ["FASE", "ETAPA", "TRÁMITE"] },
      ],
    },
    fire: {
      title: "Noticia bomba",
      pivot: "BOMBA",
      categories: [
        { name: "Explosivos", words: ["DINAMITA", "GRANADA", "PETARDO"] },
        { name: "Para regar", words: ["MANGUERA", "REGADERA", "ASPERSOR"] },
        { name: "En la piscina", words: ["FLOTADOR", "TRAMPOLÍN", "SOCORRISTA"] },
        { name: "Noticias muy sonadas", words: ["EXCLUSIVA", "PRIMICIA", "ESCÁNDALO"] },
      ],
    },
    block: {
      title: "En bloque",
      pivot: "BLOQUE",
      categories: [
        { name: "Para levantar un muro", words: ["LADRILLO", "CEMENTO", "HORMIGÓN"] },
        { name: "Tipos de vivienda", words: ["PISO", "ÁTICO", "DÚPLEX"] },
        { name: "Grupos políticos", words: ["COALICIÓN", "PARTIDO", "ALIANZA"] },
        { name: "Para tomar apuntes", words: ["LIBRETA", "CUADERNO", "AGENDA"] },
      ],
    },
    crane: {
      title: "Arco iris",
      pivot: "ARCO",
      categories: [
        { name: "Cosas del arquero", words: ["FLECHA", "CARCAJ", "DIANA"] },
        { name: "Elementos de arquitectura", words: ["COLUMNA", "BÓVEDA", "CÚPULA"] },
        { name: "Instrumentos de cuerda", words: ["VIOLÍN", "CHELO", "VIOLA"] },
        { name: "En geometría", words: ["ÁNGULO", "RADIO", "TANGENTE"] },
      ],
    },
    bolt: {
      title: "Como un rayo",
      pivot: "RAYO",
      categories: [
        { name: "En una tormenta", words: ["TRUENO", "GRANIZO", "NUBARRÓN"] },
        { name: "Luz que llega", words: ["HAZ", "DESTELLO", "RESPLANDOR"] },
        { name: "Partes de una bicicleta", words: ["LLANTA", "PEDAL", "MANILLAR"] },
        { name: "Muy rápido", words: ["VELOZ", "FUGAZ", "RAUDO"] },
      ],
    },
    pen: {
      title: "Peso pluma",
      pivot: "PLUMA",
      categories: [
        { name: "Partes de un ave", words: ["PICO", "ALA", "GARRA"] },
        { name: "Para escribir", words: ["BOLÍGRAFO", "LÁPIZ", "ROTULADOR"] },
        { name: "Categorías de boxeo", words: ["PESADO", "LIGERO", "MOSCA"] },
        { name: "Viven de escribir", words: ["AUTOR", "NOVELISTA", "POETA"] },
      ],
    },
    check: {
      title: "La cuenta, por favor",
      pivot: "CUENTA",
      categories: [
        { name: "En el banco", words: ["SALDO", "INTERÉS", "HIPOTECA"] },
        { name: "Para hacer un collar", words: ["ABALORIO", "PERLA", "CORDÓN"] },
        { name: "Operaciones matemáticas", words: ["SUMA", "RESTA", "DIVISIÓN"] },
        { name: "En redes sociales", words: ["PERFIL", "HASHTAG", "SEGUIDOR"] },
      ],
    },
    track: {
      title: "Seguir la pista",
      pivot: "PISTA",
      categories: [
        { name: "En el aeropuerto", words: ["TERMINAL", "EMBARQUE", "DESPEGUE"] },
        { name: "En una investigación", words: ["HUELLA", "TESTIGO", "COARTADA"] },
        { name: "En la discoteca", words: ["DJ", "ALTAVOZ", "FOCO"] },
        { name: "Atletismo", words: ["VALLA", "JABALINA", "RELEVO"] },
      ],
    },
    note: {
      title: "Dar la nota",
      pivot: "NOTA",
      categories: [
        { name: "En el boletín escolar", words: ["SOBRESALIENTE", "APROBADO", "SUSPENSO"] },
        { name: "Solfeo", words: ["PENTAGRAMA", "COMPÁS", "CORCHEA"] },
        { name: "Al pie de página", words: ["ASTERISCO", "CITA", "REFERENCIA"] },
        { name: "Al catar un vino", words: ["AROMA", "MATIZ", "TOQUE"] },
      ],
    },
    rock: {
      title: "La clave del asunto",
      pivot: "CLAVE",
      categories: [
        { name: "Signos musicales", words: ["SOSTENIDO", "BEMOL", "SILENCIO"] },
        { name: "Sistemas de signos", words: ["MORSE", "BRAILLE", "BINARIO"] },
        { name: "Instrumentos de teclado", words: ["PIANO", "ÓRGANO", "CELESTA"] },
        { name: "Imprescindible", words: ["ESENCIAL", "CRUCIAL", "VITAL"] },
      ],
    },
    park: {
      title: "Plaza mayor",
      pivot: "PLAZA",
      categories: [
        { name: "En el centro del pueblo", words: ["AYUNTAMIENTO", "QUIOSCO", "FAROLA"] },
        { name: "En una oferta de empleo", words: ["SUELDO", "HORARIO", "CONTRATO"] },
        { name: "Tauromaquia", words: ["TORERO", "CAPOTE", "RUEDO"] },
        { name: "En el mercado", words: ["PESCADERÍA", "FRUTERÍA", "CARNICERÍA"] },
      ],
    },
    roll: {
      title: "Qué rollo",
      pivot: "ROLLO",
      categories: [
        { name: "Vienen en cilindro", words: ["PAPEL", "ALFOMBRA", "PERGAMINO"] },
        { name: "Fotografía analógica", words: ["NEGATIVO", "REVELADO", "DIAPOSITIVA"] },
        { name: "Aburrido", words: ["PESADO", "TEDIOSO", "SOPORÍFERO"] },
        { name: "Una relación pasajera", words: ["AVENTURA", "LÍO", "AMORÍO"] },
      ],
    },
    table: {
      title: "Contra corriente",
      pivot: "CORRIENTE",
      categories: [
        { name: "En el río", words: ["CAUCE", "CAUDAL", "AFLUENTE"] },
        { name: "Electricidad", words: ["VOLTIO", "AMPERIO", "VATIO"] },
        { name: "Nada especial", words: ["NORMAL", "COMÚN", "ORDINARIO"] },
        { name: "Entra por la ventana", words: ["BRISA", "RÁFAGA", "VENTOLERA"] },
      ],
    },
    sheet: {
      title: "Una copa de más",
      pivot: "COPA",
      categories: [
        { name: "Espumosos", words: ["CAVA", "CHAMPÁN", "SIDRA"] },
        { name: "Se gana en el fútbol", words: ["LIGA", "TÍTULO", "CAMPEONATO"] },
        { name: "Partes de un árbol", words: ["RAMA", "CORTEZA", "RAÍZ"] },
        { name: "Palos de la baraja española", words: ["OROS", "ESPADAS", "BASTOS"] },
      ],
    },
    seal: {
      title: "Sello de calidad",
      pivot: "SELLO",
      categories: [
        { name: "Se escribe en el sobre", words: ["REMITENTE", "DESTINATARIO", "DIRECCIÓN"] },
        { name: "Certifican un documento", words: ["FIRMA", "NOTARIO", "VISADO"] },
        { name: "Industria musical", words: ["ÁLBUM", "SINGLE", "PRODUCTOR"] },
        { name: "Toque personal", words: ["ESTILO", "IMPRONTA", "CARÁCTER"] },
      ],
    },
    pipe: {
      title: "Bajo llave",
      pivot: "LLAVE",
      categories: [
        { name: "Abre la puerta", words: ["CERRADURA", "CANDADO", "PICAPORTE"] },
        { name: "Herramientas", words: ["DESTORNILLADOR", "ALICATES", "MARTILLO"] },
        { name: "Del agua", words: ["CAÑERÍA", "DUCHA", "LAVABO"] },
        { name: "Movimientos de judo", words: ["DERRIBO", "INMOVILIZACIÓN", "PROYECCIÓN"] },
      ],
    },
    fry: {
      title: "Al mal tiempo, buena cara",
      pivot: "TIEMPO",
      categories: [
        { name: "Parte meteorológico", words: ["LLUVIA", "SOL", "NIEBLA"] },
        { name: "Lo miden", words: ["RELOJ", "CRONÓMETRO", "CALENDARIO"] },
        { name: "Formas verbales", words: ["PRETÉRITO", "FUTURO", "CONDICIONAL"] },
        { name: "Partes de un partido", words: ["DESCANSO", "PRÓRROGA", "PITIDO"] },
      ],
    },
    pound: {
      title: "Quitarse un peso",
      pivot: "PESO",
      categories: [
        { name: "Unidades de masa", words: ["GRAMO", "KILO", "TONELADA"] },
        { name: "Monedas", words: ["EURO", "DÓLAR", "YEN"] },
        { name: "Se lleva dentro", words: ["CULPA", "PENA", "REMORDIMIENTO"] },
        { name: "Pruebas de atletismo", words: ["JABALINA", "DISCO", "MARTILLO"] },
      ],
    },
    well: {
      title: "De buena fuente",
      pivot: "FUENTE",
      categories: [
        { name: "En la plaza", words: ["ESTATUA", "FAROLA", "ESTANQUE"] },
        { name: "Vajilla", words: ["PLATO", "CAZUELA", "SOPERA"] },
        { name: "Tipografías", words: ["ARIAL", "HELVÉTICA", "TIMES"] },
        { name: "De dónde sale la información", words: ["TESTIGO", "INFORMANTE", "DOCUMENTO"] },
      ],
    },
    scale: {
      title: "A gran escala",
      pivot: "ESCALA",
      categories: [
        { name: "En un mapa", words: ["LEYENDA", "MERIDIANO", "CUADRÍCULA"] },
        { name: "Al viajar en avión", words: ["PASAPORTE", "MALETA", "AZAFATA"] },
        { name: "Música", words: ["OCTAVA", "ARPEGIO", "TONALIDAD"] },
        { name: "Terremotos", words: ["SISMO", "RÉPLICA", "EPICENTRO"] },
      ],
    },
    spell: {
      title: "Cambio de planes",
      pivot: "CAMBIO",
      categories: [
        { name: "Divisas", words: ["LIBRA", "FRANCO", "RUPIA"] },
        { name: "En el coche", words: ["EMBRAGUE", "MARCHA", "PALANCA"] },
        { name: "Desde el banquillo", words: ["SUPLENTE", "RESERVA", "RELEVO"] },
        { name: "Transformaciones", words: ["MUTACIÓN", "METAMORFOSIS", "VUELCO"] },
      ],
    },
    date: {
      title: "Corte y confección",
      pivot: "CORTE",
      categories: [
        { name: "Realeza", words: ["REY", "PALACIO", "TRONO"] },
        { name: "Peluquería", words: ["TINTE", "PEINADO", "MECHAS"] },
        { name: "Justicia", words: ["JUEZ", "TRIBUNAL", "SENTENCIA"] },
        { name: "Carnicería", words: ["SOLOMILLO", "FALDA", "CHULETA"] },
      ],
    },
    press: {
      title: "Planchar la oreja",
      pivot: "PLANCHA",
      categories: [
        { name: "Colada", words: ["DETERGENTE", "SUAVIZANTE", "LAVADORA"] },
        { name: "Maneras de cocinar", words: ["FRITO", "HERVIDO", "ASADO"] },
        { name: "Se vende en láminas", words: ["ACERO", "CORCHO", "CONTRACHAPADO"] },
        { name: "Ejercicios de gimnasio", words: ["SENTADILLA", "FLEXIÓN", "ABDOMINAL"] },
      ],
    },
    clip: {
      title: "Con pinzas",
      pivot: "PINZA",
      categories: [
        { name: "Al tender la ropa", words: ["TENDEDERO", "PERCHA", "CUERDA"] },
        { name: "Neceser", words: ["TIJERAS", "LIMA", "CORTAÚÑAS"] },
        { name: "Marisco", words: ["CANGREJO", "LANGOSTA", "BOGAVANTE"] },
        { name: "Costura", words: ["DOBLADILLO", "PLIEGUE", "PUNTADA"] },
      ],
    },
    pitch: {
      title: "Subir el tono",
      pivot: "TONO",
      categories: [
        { name: "Colores", words: ["OCRE", "TURQUESA", "MAGENTA"] },
        { name: "Música", words: ["ACORDE", "ARMONÍA", "AFINACIÓN"] },
        { name: "Del móvil", words: ["VIBRACIÓN", "MELODÍA", "ALARMA"] },
        { name: "En la voz", words: ["ACENTO", "INFLEXIÓN", "DEJE"] },
      ],
    },
    jam: {
      title: "Echar una mano",
      pivot: "MANO",
      categories: [
        { name: "Partes del brazo", words: ["CODO", "MUÑECA", "HOMBRO"] },
        { name: "Al pintar una pared", words: ["RODILLO", "BROCHA", "CUBETA"] },
        { name: "Partida de cartas", words: ["BARAJA", "APUESTA", "TRIUNFO"] },
        { name: "Ayuda", words: ["APOYO", "AUXILIO", "FAVOR"] },
      ],
    },
    drop: {
      title: "Al pie de la letra",
      pivot: "LETRA",
      categories: [
        { name: "Alfabeto", words: ["VOCAL", "CONSONANTE", "MAYÚSCULA"] },
        { name: "Partes de una canción", words: ["ESTRIBILLO", "MELODÍA", "RITMO"] },
        { name: "Caligrafía", words: ["TRAZO", "GARABATO", "CURSIVA"] },
        { name: "Pagos aplazados", words: ["PLAZO", "CUOTA", "HIPOTECA"] },
      ],
    },
    crash: {
      title: "Golpe de suerte",
      pivot: "GOLPE",
      categories: [
        { name: "En una pelea", words: ["PATADA", "BOFETADA", "CODAZO"] },
        { name: "Toma del poder", words: ["DICTADURA", "JUNTA", "CUARTELAZO"] },
        { name: "Robos", words: ["ATRACO", "BOTÍN", "BUTRÓN"] },
        { name: "En el tenis", words: ["REVÉS", "DERECHA", "VOLEA"] },
      ],
    },
    palm: {
      title: "Llevarse la palma",
      pivot: "PALMA",
      categories: [
        { name: "Árboles", words: ["OLIVO", "PINO", "ROBLE"] },
        { name: "Partes de la mano", words: ["DEDO", "NUDILLO", "PULGAR"] },
        { name: "Al final del concierto", words: ["BIS", "OVACIÓN", "BRAVO"] },
        { name: "Para el ganador", words: ["LAUREL", "TÍTULO", "VICTORIA"] },
      ],
    },
    light: {
      title: "Usar la cabeza",
      pivot: "CABEZA",
      categories: [
        { name: "En la cara", words: ["NARIZ", "BOCA", "OREJA"] },
        { name: "Quien manda", words: ["JEFE", "LÍDER", "CAPITÁN"] },
        { name: "Inteligencia", words: ["INGENIO", "TALENTO", "MEMORIA"] },
        { name: "Detrás de la palabra: «de ___»", words: ["AJO", "CARTEL", "TURCO"] },
      ],
    },
    mint: {
      title: "Cuadro de honor",
      pivot: "CUADRO",
      categories: [
        { name: "En el museo", words: ["RETRATO", "BODEGÓN", "PAISAJE"] },
        { name: "Partes de una bicicleta", words: ["HORQUILLA", "BUJE", "SILLÍN"] },
        { name: "Formas", words: ["CÍRCULO", "ROMBO", "TRIÁNGULO"] },
        { name: "En una hoja de cálculo", words: ["FILA", "COLUMNA", "CELDA"] },
      ],
    },
    post: {
      title: "Entrada libre",
      pivot: "ENTRADA",
      categories: [
        { name: "En el teatro", words: ["TAQUILLA", "BUTACA", "TELÓN"] },
        { name: "Partes de un menú", words: ["APERITIVO", "SEGUNDO", "POSTRE"] },
        { name: "Al comprar un piso", words: ["HIPOTECA", "ESCRITURA", "NOTARIO"] },
        { name: "En un diccionario", words: ["DEFINICIÓN", "ACEPCIÓN", "ETIMOLOGÍA"] },
      ],
    },
    spin: {
      title: "Un giro inesperado",
      pivot: "GIRO",
      categories: [
        { name: "En la carretera", words: ["ROTONDA", "DESVÍO", "CURVA"] },
        { name: "Enviar dinero", words: ["TRANSFERENCIA", "REMESA", "CHEQUE"] },
        { name: "Expresiones", words: ["MODISMO", "REFRÁN", "FRASE"] },
        { name: "En un guion de cine", words: ["TRAMA", "CLÍMAX", "DESENLACE"] },
      ],
    },
    shower: {
      title: "Hacer tablas",
      pivot: "TABLA",
      categories: [
        { name: "Deportes de deslizamiento", words: ["SURF", "SKATE", "SNOWBOARD"] },
        { name: "Se hace con datos", words: ["GRÁFICO", "ESTADÍSTICA", "LISTADO"] },
        { name: "Ajedrez", words: ["EMPATE", "JAQUE", "ENROQUE"] },
        { name: "Carpintería", words: ["LISTÓN", "VIGA", "TRAVESAÑO"] },
      ],
    },
    deck: {
      title: "Bajo cubierta",
      pivot: "CUBIERTA",
      categories: [
        { name: "En un barco", words: ["CAMAROTE", "TIMÓN", "ANCLA"] },
        { name: "Partes de un libro", words: ["LOMO", "SOLAPA", "ÍNDICE"] },
        { name: "Partes de una rueda", words: ["LLANTA", "VÁLVULA", "CÁMARA"] },
        { name: "Techo", words: ["TEJA", "ALERO", "BUHARDILLA"] },
      ],
    },
    break: {
      title: "Vuelta y vuelta",
      pivot: "VUELTA",
      categories: [
        { name: "Ciclismo", words: ["PELOTÓN", "MAILLOT", "CONTRARRELOJ"] },
        { name: "Al pagar en la tienda", words: ["CAJA", "TICKET", "MONEDERO"] },
        { name: "Se voltean en la sartén", words: ["TORTILLA", "CREPE", "FILETE"] },
        { name: "Giran sin parar", words: ["NORIA", "PEONZA", "TIOVIVO"] },
      ],
    },
    nail: {
      title: "Dar en el clavo",
      pivot: "CLAVO",
      categories: [
        { name: "Ferretería", words: ["TUERCA", "TACO", "PERNO"] },
        { name: "Especias", words: ["CANELA", "COMINO", "AZAFRÁN"] },
        { name: "Acertar de lleno", words: ["DIANA", "PLENO", "BINGO"] },
        { name: "Llega a su hora", words: ["PUNTUAL", "EXACTO", "FORMAL"] },
      ],
    },
    brush: {
      title: "Carrera de fondo",
      pivot: "CARRERA",
      categories: [
        { name: "Atletismo", words: ["MARATÓN", "SPRINT", "RELEVO"] },
        { name: "En la universidad", words: ["DERECHO", "MEDICINA", "INGENIERÍA"] },
        { name: "Vida profesional", words: ["ASCENSO", "CURRÍCULUM", "JUBILACIÓN"] },
        { name: "En unas medias", words: ["AGUJERO", "ROTO", "ENGANCHÓN"] },
      ],
    },
    tank: {
      title: "Casco antiguo",
      pivot: "CASCO",
      categories: [
        { name: "Protecciones", words: ["RODILLERA", "CODERA", "ESPINILLERA"] },
        { name: "Partes de un barco", words: ["QUILLA", "POPA", "BODEGA"] },
        { name: "Partes de un caballo", words: ["CRIN", "GRUPA", "HERRADURA"] },
        { name: "En una ciudad", words: ["CATEDRAL", "CALLEJUELA", "MURALLA"] },
      ],
    },
    vault: {
      title: "Cámara lenta",
      pivot: "CÁMARA",
      categories: [
        { name: "Fotografía", words: ["OBJETIVO", "FLASH", "TRÍPODE"] },
        { name: "Parlamento", words: ["DIPUTADO", "SENADO", "ESCAÑO"] },
        { name: "Rueda de bicicleta", words: ["PINCHAZO", "VÁLVULA", "PARCHE"] },
        { name: "Donde el banco guarda el oro", words: ["LINGOTE", "CÓDIGO", "BLINDAJE"] },
      ],
    },
    figure: {
      title: "Hacer figura",
      pivot: "FIGURA",
      categories: [
        { name: "Geometría", words: ["TRIÁNGULO", "ROMBO", "HEXÁGONO"] },
        { name: "Personajes destacados", words: ["CELEBRIDAD", "FENÓMENO", "ASTRO"] },
        { name: "Del belén", words: ["PASTOR", "MULA", "BUEY"] },
        { name: "Recursos literarios", words: ["METÁFORA", "HIPÉRBOLE", "IRONÍA"] },
      ],
    },
    hook: {
      title: "Tener gancho",
      pivot: "GANCHO",
      categories: [
        { name: "En el armario", words: ["PERCHA", "CAJÓN", "BALDA"] },
        { name: "Boxeo", words: ["DIRECTO", "CRUZADO", "UPPERCUT"] },
        { name: "Atractivo", words: ["CARISMA", "ENCANTO", "MAGNETISMO"] },
        { name: "Baloncesto", words: ["TRIPLE", "MATE", "TAPÓN"] },
      ],
    },
    plot: {
      title: "Es historia",
      pivot: "HISTORIA",
      categories: [
        { name: "Épocas", words: ["RENACIMIENTO", "ILUSTRACIÓN", "ANTIGÜEDAD"] },
        { name: "Elementos narrativos", words: ["PERSONAJE", "NARRADOR", "DESENLACE"] },
        { name: "Para no decir la verdad", words: ["PRETEXTO", "EXCUSA", "EVASIVA"] },
        { name: "En la consulta del médico", words: ["EXPEDIENTE", "FICHA", "ANTECEDENTES"] },
      ],
    },
    court: {
      title: "Joya de la corona",
      pivot: "CORONA",
      categories: [
        { name: "Realeza", words: ["CETRO", "TRONO", "MANTO"] },
        { name: "Dentista", words: ["EMPASTE", "CARIES", "IMPLANTE"] },
        { name: "Monedas", words: ["FLORÍN", "DRACMA", "RUBLO"] },
        { name: "Funeral", words: ["ESQUELA", "VELATORIO", "LÁPIDA"] },
      ],
    },
    trip: {
      title: "Sobre la marcha",
      pivot: "MARCHA",
      categories: [
        { name: "Música", words: ["HIMNO", "VALS", "PASODOBLE"] },
        { name: "Se mete al conducir", words: ["PRIMERA", "SEGUNDA", "QUINTA"] },
        { name: "Manifestación", words: ["PANCARTA", "PROTESTA", "CONSIGNA"] },
        { name: "Al despedirse", words: ["ADIÓS", "BESO", "ABRAZO"] },
      ],
    },
    turn: {
      title: "Sacar partido",
      pivot: "PARTIDO",
      categories: [
        { name: "Fútbol", words: ["ÁRBITRO", "EMPATE", "PRÓRROGA"] },
        { name: "Política", words: ["MILITANTE", "VOTANTE", "CANDIDATO"] },
        { name: "Soltero codiciado", words: ["PRETENDIENTE", "GALÁN", "HEREDERO"] },
        { name: "Sacarle algo", words: ["PROVECHO", "BENEFICIO", "VENTAJA"] },
      ],
    },
    lead: {
      title: "Pies de plomo",
      pivot: "PLOMO",
      categories: [
        { name: "Metales", words: ["HIERRO", "COBRE", "ESTAÑO"] },
        { name: "Cuadro eléctrico", words: ["DIFERENCIAL", "CONTADOR", "INTERRUPTOR"] },
        { name: "Pesados", words: ["PELMAZO", "LATOSO", "CANSINO"] },
        { name: "Munición", words: ["BALA", "PERDIGÓN", "CARTUCHO"] },
      ],
    },
    stamp: {
      title: "De etiqueta",
      pivot: "ETIQUETA",
      categories: [
        { name: "En la ropa", words: ["TALLA", "COMPOSICIÓN", "LAVADO"] },
        { name: "Buenos modales", words: ["PROTOCOLO", "CORTESÍA", "URBANIDAD"] },
        { name: "En Instagram", words: ["FILTRO", "STORY", "MENCIÓN"] },
        { name: "Vestimenta elegante", words: ["ESMOQUIN", "PAJARITA", "GALA"] },
      ],
    },
    panel: {
      title: "Poner la mesa",
      pivot: "MESA",
      categories: [
        { name: "Comedor", words: ["MANTEL", "CUBIERTO", "SERVILLETA"] },
        { name: "Dirigen una asociación", words: ["PRESIDENTE", "SECRETARIO", "TESORERO"] },
        { name: "Día de elecciones", words: ["URNA", "PAPELETA", "CENSO"] },
        { name: "Debate", words: ["PONENTE", "MODERADOR", "COLOQUIO"] },
      ],
    },
    peak: {
      title: "Cerrar el pico",
      pivot: "PICO",
      categories: [
        { name: "Partes de un ave", words: ["ALA", "CRESTA", "BUCHE"] },
        { name: "Montañas famosas", words: ["EVEREST", "ANETO", "ACONCAGUA"] },
        { name: "Herramientas para cavar", words: ["PALA", "AZADA", "BARRENA"] },
        { name: "Tráfico", words: ["ATASCO", "EMBOTELLAMIENTO", "CARAVANA"] },
      ],
    },
    switch: {
      title: "Buscar la aguja",
      pivot: "AGUJA",
      categories: [
        { name: "Costura", words: ["DEDAL", "HILO", "ALFILER"] },
        { name: "En el reloj", words: ["ESFERA", "CORREA", "CUERDA"] },
        { name: "Ferrocarril", words: ["ANDÉN", "RAÍL", "VAGÓN"] },
        { name: "Catedral", words: ["TORRE", "CAMPANARIO", "ROSETÓN"] },
      ],
    },
    match: {
      title: "Hacer juego",
      pivot: "JUEGO",
      categories: [
        { name: "Casino", words: ["RULETA", "BLACKJACK", "TRAGAPERRAS"] },
        { name: "Vienen en conjunto", words: ["SÁBANAS", "CUBIERTOS", "TOALLAS"] },
        { name: "Combinar", words: ["CONJUNTAR", "PEGAR", "CASAR"] },
        { name: "Mecánica", words: ["HOLGURA", "TOLERANCIA", "ROZAMIENTO"] },
      ],
    },
    sink: {
      title: "Tocar fondo",
      pivot: "FONDO",
      categories: [
        { name: "Del mar", words: ["ARENA", "CORAL", "ALGA"] },
        { name: "Inversiones", words: ["ACCIÓN", "BONO", "DIVIDENDO"] },
        { name: "Detrás del sujeto en una foto", words: ["PAISAJE", "DECORADO", "TELÓN"] },
        { name: "Pruebas de larga distancia", words: ["MARATÓN", "TRIATLÓN", "ULTRA"] },
      ],
    },
    plug: {
      title: "Meter cuña",
      pivot: "CUÑA",
      categories: [
        { name: "Para que la puerta no se mueva", words: ["TOPE", "PESTILLO", "BISAGRA"] },
        { name: "Publicidad", words: ["ANUNCIO", "SPOT", "JINGLE"] },
        { name: "Hospital", words: ["CAMILLA", "GOTERO", "ORINAL"] },
        { name: "Zapatos", words: ["TACÓN", "PLATAFORMA", "SUELA"] },
      ],
    },
    snap: {
      title: "A tiro hecho",
      pivot: "TIRO",
      categories: [
        { name: "Armas", words: ["PISTOLA", "RIFLE", "ESCOPETA"] },
        { name: "Baloncesto", words: ["CANASTA", "REBOTE", "ALERO"] },
        { name: "Chimenea", words: ["HOLLÍN", "LEÑA", "HOGAR"] },
        { name: "Pantalón", words: ["CINTURA", "BRAGUETA", "BAJOS"] },
      ],
    },
    slate: {
      title: "Cambio de programa",
      pivot: "PROGRAMA",
      categories: [
        { name: "Televisión", words: ["PRESENTADOR", "AUDIENCIA", "ANUNCIO"] },
        { name: "Informática", words: ["ARCHIVO", "VENTANA", "ICONO"] },
        { name: "Elecciones", words: ["PROMESA", "MITIN", "CAMPAÑA"] },
        { name: "Lavadora", words: ["CENTRIFUGADO", "ACLARADO", "PRELAVADO"] },
      ],
    },
    grain: {
      title: "Ir al grano",
      pivot: "GRANO",
      categories: [
        { name: "Cereales", words: ["TRIGO", "AVENA", "CENTENO"] },
        { name: "Piel", words: ["ESPINILLA", "ACNÉ", "POROS"] },
        { name: "Sin rodeos", words: ["CONCISO", "ESCUETO", "DIRECTO"] },
        { name: "Fotografía", words: ["RUIDO", "PÍXEL", "ISO"] },
      ],
    },
    prime: {
      title: "Montar un número",
      pivot: "NÚMERO",
      categories: [
        { name: "Los primeros", words: ["UNO", "DOS", "TRES"] },
        { name: "Revistas", words: ["EJEMPLAR", "EDICIÓN", "SUSCRIPCIÓN"] },
        { name: "Circo", words: ["TRAPECISTA", "MALABARISTA", "DOMADOR"] },
        { name: "Zapatería", words: ["HORMA", "PLANTILLA", "CORDÓN"] },
      ],
    },
    swing: {
      title: "Compás de espera",
      pivot: "COMPÁS",
      categories: [
        { name: "Estuche de dibujo", words: ["REGLA", "ESCUADRA", "CARTABÓN"] },
        { name: "Música", words: ["TEMPO", "RITMO", "METRÓNOMO"] },
        { name: "Instrumentos del navegante", words: ["SEXTANTE", "ASTROLABIO", "CORREDERA"] },
        { name: "Un alto en el camino", words: ["PAUSA", "TREGUA", "INTERVALO"] },
      ],
    },
    shift: {
      title: "Otra ronda",
      pivot: "RONDA",
      categories: [
        { name: "En el bar", words: ["BARRA", "CAMARERO", "BRINDIS"] },
        { name: "Torneo", words: ["ELIMINATORIA", "OCTAVOS", "FINAL"] },
        { name: "Patrulla", words: ["VIGILANTE", "LINTERNA", "SERENO"] },
        { name: "Vías urbanas", words: ["AUTOVÍA", "BULEVAR", "AVENIDA"] },
      ],
    },
    strain: {
      title: "Alta tensión",
      pivot: "TENSIÓN",
      categories: [
        { name: "Se mide en la consulta", words: ["PULSO", "TEMPERATURA", "AZÚCAR"] },
        { name: "Torres eléctricas", words: ["CABLE", "TRANSFORMADOR", "AISLANTE"] },
        { name: "Estrés", words: ["NERVIOS", "ANSIEDAD", "AGOBIO"] },
        { name: "Física", words: ["FUERZA", "ELASTICIDAD", "RESORTE"] },
      ],
    },
    string: {
      title: "En la cuerda floja",
      pivot: "CUERDA",
      categories: [
        { name: "Escalada", words: ["ARNÉS", "MOSQUETÓN", "PIOLET"] },
        { name: "Instrumentos", words: ["GUITARRA", "ARPA", "VIOLÍN"] },
        { name: "Relojes antiguos", words: ["PÉNDULO", "CARILLÓN", "MANECILLA"] },
        { name: "Garganta", words: ["LARINGE", "AMÍGDALA", "TRÁQUEA"] },
      ],
    },
    shock: {
      title: "Tomar el pelo",
      pivot: "PELO",
      categories: [
        { name: "Peluquería", words: ["TIJERAS", "SECADOR", "CHAMPÚ"] },
        { name: "Por poco", words: ["APENAS", "CASI", "JUSTO"] },
        { name: "Burla", words: ["BROMA", "GUASA", "CHANZA"] },
        { name: "Abrigos", words: ["VISÓN", "ASTRACÁN", "CHINCHILLA"] },
      ],
    },
    forge: {
      title: "A martillazos",
      pivot: "MARTILLO",
      categories: [
        { name: "Caja de herramientas", words: ["ALICATES", "SIERRA", "TALADRO"] },
        { name: "Huesos del oído", words: ["YUNQUE", "ESTRIBO", "TÍMPANO"] },
        { name: "Lanzamientos", words: ["DISCO", "JABALINA", "BALA"] },
        { name: "Subasta", words: ["PUJA", "LOTE", "SUBASTADOR"] },
      ],
    },
    channel: {
      title: "Cambiar de canal",
      pivot: "CANAL",
      categories: [
        { name: "Obras hidráulicas", words: ["PRESA", "ACEQUIA", "ESCLUSA"] },
        { name: "Zapping", words: ["MANDO", "EMISORA", "PROGRAMACIÓN"] },
        { name: "Brazos de mar", words: ["GIBRALTAR", "BÓSFORO", "MANCHA"] },
        { name: "Distribución comercial", words: ["MAYORISTA", "MINORISTA", "INTERMEDIARIO"] },
      ],
    },
    steam: {
      title: "A todo vapor",
      pivot: "VAPOR",
      categories: [
        { name: "Técnicas de cocina", words: ["ESCALFADO", "GUISADO", "SALTEADO"] },
        { name: "Barcos de otra época", words: ["GALEÓN", "CARABELA", "FRAGATA"] },
        { name: "Estados de la materia", words: ["SÓLIDO", "LÍQUIDO", "PLASMA"] },
        { name: "Spa", words: ["SAUNA", "JACUZZI", "MASAJE"] },
      ],
    },
    rail: {
      title: "En vías de",
      pivot: "VÍA",
      categories: [
        { name: "Ferrocarril", words: ["TRAVIESA", "BALASTO", "APEADERO"] },
        { name: "Se cruzan en la ciudad", words: ["CALLE", "CALLEJÓN", "GLORIETA"] },
        { name: "Cómo se toma un medicamento", words: ["ORAL", "NASAL", "TÓPICA"] },
        { name: "Caminos para resolver un conflicto", words: ["DIÁLOGO", "NEGOCIACIÓN", "JUICIO"] },
      ],
    },
    stall: {
      title: "En su puesto",
      pivot: "PUESTO",
      categories: [
        { name: "En el mercadillo", words: ["REGATEO", "GANGA", "TOLDO"] },
        { name: "Oferta de empleo", words: ["ENTREVISTA", "CURRÍCULUM", "SALARIO"] },
        { name: "Clasificación", words: ["PODIO", "RANKING", "MEDALLERO"] },
        { name: "Vigilancia militar", words: ["TRINCHERA", "CENTINELA", "GARITA"] },
      ],
    },
    grade: {
      title: "Tercer grado",
      pivot: "GRADO",
      categories: [
        { name: "Temperatura", words: ["TERMÓMETRO", "FIEBRE", "CELSIUS"] },
        { name: "Universidad", words: ["MÁSTER", "DOCTORADO", "DIPLOMATURA"] },
        { name: "Ejército", words: ["SARGENTO", "TENIENTE", "CORONEL"] },
        { name: "Parentesco", words: ["PRIMO", "CUÑADO", "SOBRINO"] },
      ],
    },
    fan: {
      title: "Ni bola",
      pivot: "BOLA",
      categories: [
        { name: "Heladería", words: ["CUCURUCHO", "TARRINA", "SABOR"] },
        { name: "Mentiras", words: ["TROLA", "EMBUSTE", "PATRAÑA"] },
        { name: "Adivinación", words: ["TAROT", "PÉNDULO", "OUIJA"] },
        { name: "Billar", words: ["TACO", "TRONERA", "PAÑO"] },
      ],
    },
    drive: {
      title: "Motor de arranque",
      pivot: "MOTOR",
      categories: [
        { name: "Dentro del capó", words: ["PISTÓN", "BUJÍA", "RADIADOR"] },
        { name: "Buscadores de internet", words: ["GOOGLE", "BING", "YAHOO"] },
        { name: "Lo que impulsa", words: ["ESTÍMULO", "ACICATE", "ALICIENTE"] },
        { name: "Fórmula 1", words: ["PILOTO", "CIRCUITO", "ESCUDERÍA"] },
      ],
    },
    charm: {
      title: "Caer en gracia",
      pivot: "GRACIA",
      categories: [
        { name: "Elegancia", words: ["GARBO", "DONAIRE", "SOLTURA"] },
        { name: "Humor", words: ["CHISTE", "OCURRENCIA", "GAG"] },
        { name: "Indulto", words: ["PERDÓN", "CLEMENCIA", "AMNISTÍA"] },
        { name: "Cómo te llamas", words: ["APELLIDO", "APODO", "ALIAS"] },
      ],
    },
    sole: {
      title: "Por los suelos",
      pivot: "SUELO",
      categories: [
        { name: "Pavimentos", words: ["PARQUÉ", "BALDOSA", "MOQUETA"] },
        { name: "Agricultura", words: ["ABONO", "ARADO", "COSECHA"] },
        { name: "Urbanismo", words: ["SOLAR", "PARCELA", "URBANIZABLE"] },
        { name: "Mínimo", words: ["TOPE", "LÍMITE", "BASE"] },
      ],
    },
    spot: {
      title: "Hacerse cargo",
      pivot: "CARGO",
      categories: [
        { name: "Altos directivos", words: ["MINISTRO", "ALCALDE", "DIRECTOR"] },
        { name: "Acusación", words: ["DELITO", "IMPUTACIÓN", "DENUNCIA"] },
        { name: "Extracto bancario", words: ["COMISIÓN", "RECIBO", "DOMICILIACIÓN"] },
        { name: "Responsabilidad", words: ["CUSTODIA", "TUTELA", "CUIDADO"] },
      ],
    },
    cross: {
      title: "Cara o cruz",
      pivot: "CRUZ",
      categories: [
        { name: "Religión", words: ["ROSARIO", "ALTAR", "INCIENSO"] },
        { name: "Al lanzar una moneda", words: ["CARA", "CANTO", "AZAR"] },
        { name: "Un peso que se carga", words: ["CALVARIO", "SUPLICIO", "TORMENTO"] },
        { name: "Organizaciones humanitarias", words: ["UNICEF", "CÁRITAS", "OXFAM"] },
      ],
    },
    run: {
      title: "Caja de sorpresas",
      pivot: "CAJA",
      categories: [
        { name: "Percusión", words: ["TAMBOR", "BOMBO", "PLATILLO"] },
        { name: "Supermercado", words: ["CARRITO", "BÁSCULA", "TICKET"] },
        { name: "Tórax", words: ["COSTILLA", "ESTERNÓN", "PULMÓN"] },
        { name: "Transmisión del coche", words: ["EMBRAGUE", "DIFERENCIAL", "PALANCA"] },
      ],
    },
    tender: {
      title: "Dulces sueños",
      pivot: "DULCE",
      categories: [
        { name: "Sabores", words: ["SALADO", "AMARGO", "ÁCIDO"] },
        { name: "Golosinas", words: ["CARAMELO", "PIRULETA", "GOMINOLA"] },
        { name: "Carácter", words: ["AMABLE", "TIERNO", "CARIÑOSO"] },
        { name: "Peces de río", words: ["TRUCHA", "CARPA", "LUCIO"] },
      ],
    },
    present: {
      title: "¡Presente!",
      pivot: "PRESENTE",
      categories: [
        { name: "Se abre en Navidad", words: ["PAQUETE", "SORPRESA", "LAZO"] },
        { name: "En este momento", words: ["HOY", "ACTUAL", "CONTEMPORÁNEO"] },
        { name: "Al pasar lista", words: ["ASISTENCIA", "AUSENTE", "FALTA"] },
        { name: "Gramática", words: ["INDICATIVO", "PRETÉRITO", "GERUNDIO"] },
      ],
    },
    temper: {
      title: "Sentido del humor",
      pivot: "HUMOR",
      categories: [
        { name: "Comedia", words: ["CHISTE", "PARODIA", "SÁTIRA"] },
        { name: "Estado de ánimo", words: ["TALANTE", "DISPOSICIÓN", "TEMPLE"] },
        { name: "Medicina antigua", words: ["BILIS", "FLEMA", "SANGRE"] },
        { name: "Partes del ojo", words: ["RETINA", "IRIS", "CÓRNEA"] },
      ],
    },
    mold: {
      title: "Romper moldes",
      pivot: "MOLDE",
      categories: [
        { name: "Repostería", words: ["BIZCOCHO", "FLAN", "MAGDALENA"] },
        { name: "Fundición", words: ["HORNO", "CRISOL", "COLADA"] },
        { name: "Imprenta", words: ["TIPOGRAFÍA", "LINOTIPIA", "GUTENBERG"] },
        { name: "Convencional", words: ["TÓPICO", "CLICHÉ", "ESTEREOTIPO"] },
      ],
    },
    score: {
      title: "Pasarse de la raya",
      pivot: "RAYA",
      categories: [
        { name: "Peces planos", words: ["LENGUADO", "RODABALLO", "PLATIJA"] },
        { name: "Peinados", words: ["COLETA", "MOÑO", "TUPÉ"] },
        { name: "Signos de puntuación", words: ["GUION", "PARÉNTESIS", "COMILLAS"] },
        { name: "Estampados", words: ["LUNARES", "FLORES", "LISO"] },
      ],
    },
    floor: {
      title: "Tocar base",
      pivot: "BASE",
      categories: [
        { name: "Béisbol", words: ["BATEADOR", "HOMERUN", "LANZADOR"] },
        { name: "Maquillaje", words: ["RÍMEL", "COLORETE", "CORRECTOR"] },
        { name: "Química", words: ["ÁCIDO", "SAL", "NEUTRO"] },
        { name: "Militar", words: ["CUARTEL", "TROPA", "HANGAR"] },
      ],
    },
    draw: {
      title: "En línea",
      pivot: "LÍNEA",
      categories: [
        { name: "Guardarla cuesta dieta", words: ["RÉGIMEN", "CALORÍAS", "GIMNASIO"] },
        { name: "Teléfono", words: ["PREFIJO", "OPERADORA", "CENTRALITA"] },
        { name: "Autobús", words: ["RUTA", "PARADA", "TRAYECTO"] },
        { name: "Genealogía", words: ["ESTIRPE", "LINAJE", "DINASTÍA"] },
      ],
    },
    volume: {
      title: "A todo volumen",
      pivot: "VOLUMEN",
      categories: [
        { name: "Sonido", words: ["DECIBELIO", "ALTAVOZ", "AURICULAR"] },
        { name: "Colección de libros", words: ["ENCICLOPEDIA", "TRILOGÍA", "SAGA"] },
        { name: "Medidas de capacidad", words: ["LITRO", "GALÓN", "PINTA"] },
        { name: "Peluquería", words: ["LACA", "ESPUMA", "RIZOS"] },
      ],
    },
    mark: {
      title: "Buena señal",
      pivot: "SEÑAL",
      categories: [
        { name: "Tráfico", words: ["STOP", "CEDA", "LÍMITE"] },
        { name: "Cobertura del móvil", words: ["ANTENA", "WIFI", "BARRAS"] },
        { name: "Al reservar", words: ["DEPÓSITO", "FIANZA", "ADELANTO"] },
        { name: "Para llamar la atención", words: ["GUIÑO", "SILBIDO", "SALUDO"] },
      ],
    },
  },
  emoji: {
    title: "Pieza a pieza",
    pivot: "PIEZA",
    categories: [
      { name: "Ajedrez", words: ["CABALLO", "TORRE", "MATE"] },
      { name: "En el coche", words: ["GATO", "LUNA", "PILOTO"] },
      { name: "Monedas", words: ["LIBRA", "ESCUDO", "CORONA"] },
      { name: "Música", words: ["GALLO", "PLATO", "CAJA"] },
    ],
    emoji: {
      CABALLO: "🐴",
      TORRE: "🗼",
      MATE: "🧉",
      GATO: "🐱",
      LUNA: "🌙",
      PILOTO: "👨‍✈️",
      LIBRA: "♎",
      ESCUDO: "🛡️",
      CORONA: "👑",
      GALLO: "🐓",
      PLATO: "🍽️",
      CAJA: "📦",
    },
  },
  daily: {},
};

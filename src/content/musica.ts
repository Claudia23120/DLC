export const musicaContent = {
  instruments: {
    title: "Instruments",
    items: [
      {
        name: "Repenique",
        family: "Aguts",
        description:
          "Metàl·lic, de 12\" (o 10\"), uns 40cm d'alçada. So molt sec i agut, amb ritmes ràpids on predominen les semicorxeres. Es toca amb baquetes especials de silicona dura.",
      },
      {
        name: "Caixa",
        family: "Aguts",
        description:
          "De fusta o metàl·lica, de 12\" i uns 25-30cm d'alçada. La bordonera de la part inferior li dona un so una mica mantingut. Es toca amb baquetes de fusta 5A o 7A.",
      },
      {
        name: "Timba",
        family: "Aguts",
        description:
          "De fusta, sense parxe inferior, d'un metre aproximat d'alçada. Es toca directament amb les mans.",
      },
      {
        name: "Tamborim",
        family: "Aguts",
        description:
          "Metàl·lic, de 6\", sense parxe inferior. Es toca amb una sola baqueta (3 o 4 varilles de silicona) mentre es sosté amb l'altra mà.",
      },
      {
        name: "Rocar (Shaker)",
        family: "Percu menor",
        description:
          "Una sèrie d'anelles metàl·liques unides per una barra que emeten so en xocar entre elles. No és un instrument de percussió pròpiament dit.",
      },
      {
        name: "Agogo",
        family: "Percu menor",
        description:
          "Espècie de campana doble metàl·lica que emet dos sons diferents. Es toca amb una baqueta de fusta molt curta.",
      },
      {
        name: "Goliath",
        family: "Mitjos",
        description:
          "De fusta, 16\" i uns 70cm d'alçada. Toca el ritme bàsic del tema junt amb els toms, amb baquetes resistents de punta amb bola.",
      },
      {
        name: "Tom",
        family: "Mitjos",
        description:
          "De fusta, 14\" o 12\" i uns 50cm d'alçada. Toca el ritme bàsic junt amb els goliaths.",
      },
      {
        name: "Surdo",
        family: "Greus",
        description:
          "De fusta o metall, en 18\", 20\", 22\" i 24\". Combinats en tres papers: el Surdo (\"1\", el més gran, sempre a temps), el Contra (\"2\", respon al Surdo fent les contres) i el Cortador (\"3\", el més petit, toca als buits amb semicorxeres).",
      },
    ],
  },

  repertori: {
    title: "Repertori",
    items: [
      { title: "Matador", kind: "Tema de sortida" },
      { title: "Samba", kind: "Tema de la bèstia" },
      { title: "Tarantela", kind: "Tema d'obertura" },
      { title: "Trio", kind: "Tema d'obertura" },
      { title: "Toc de Farra", kind: "Tema d'obertura" },
      { title: "Valencia", kind: "" },
      { title: "Marcha", kind: "" },
      { title: "Hardcorts", kind: "" },
      { title: "Falç Final", kind: "" },
      { title: "Mix-max", kind: "Mix de valencia + marcha + hardcorts + falç final" },
      { title: "Tema 8 / wakanda", kind: "Tema d'obertura" },
      { title: "Tema 9", kind: "Tema d'obertura" },
      { title: "Tema 10", kind: "Tema d'obertura" },
      { title: "Angoixa", kind: "Tema de carnaval" },
    ],
  },

  glossari: {
    title: "Glossari",
    seccions: [
      {
        titol: "Termes musicals",
        items: [
          { term: "Tempo", definition: "Velocitat amb què s'interpreta un tema (Largo, Lento, Adagio, Moderato, Andante, Allegretto, Allegro, Presto, Vivace). El director indica el tempo; es reconeix escoltant el tema o veient el moviment dreta-esquerra dels tabalers." },
          { term: "Temps", definition: "El batec que es repeteix i ordena els ritmes: el lapse entre cada marcatge de tempo. Un temps equival a una negra." },
          { term: "Ritme", definition: "Combinació d'accents i sons més curts i més llargs, agrupats en frases amb sentit musical." },
          { term: "Frase", definition: "Un ritme que es repeteix indefinidament. La majoria de les nostres frases tenen 8 temps." },
          { term: "Base", definition: "El ritme bàsic de cada tema: el mínim que cal tocar perquè soni correcte, abans d'afegir floritures." },
          { term: "Canvis", definition: "Canvis de ritme que marca el director en un moment donat, normalment amb un símbol o moviment. Un cop acabats, es torna a la base." },
          { term: "Figures rítmiques", definition: "Signes de notació que representen la durada dels sons: rodona, blanca, negra, corxera, semicorxera, fusa, semifusa." },
          { term: "Silencis o pauses", definition: "Signes gràfics que representen l'absència de so; cada figura de nota té el seu silenci corresponent." },
          { term: "Compàs", definition: "Unitat de mesura dividida en períodes d'igual durada anomenats temps." },
          { term: "Quebrat del compàs", definition: "Es col·loca després de la clau i defineix el compàs amb dues xifres: el numerador indica la quantitat (2,3,4,6,9,12) i el denominador el valor de la figura (1=rodones, 2=blanques, 4=negres, 8=corxeres)." },
        ],
      },
      {
        titol: "Terminologia pròpia",
        items: [
          { term: "Tabals", definition: "Conjunt d'instruments per interpretar els temes de percussió. Es diferencien per registre: aguts, mitjos, greus i percu menor." },
          { term: "Percu menor", definition: "Els instruments més petits: tamborim, agogo i shaker (rocar); també hi entrarien el güiro i l'escallot." },
          { term: "Tabalada", definition: "Representació musical formada per instruments de percussió: la tabalada tradicional i la batucada (tabalada brasilera)." },
          { term: "Batucada", definition: "Origen brasiler, ritmes festius, ràpids i moguts (com la Samba), amb instruments brasilers barrejats amb percussió tradicional." },
          { term: "Tabalada tradicional", definition: "Lligada a la cultura tradicional, ritmes lents i potents fets només amb instruments de percussió." },
          { term: "Tabalers de les Corts", definition: "Mesclem ritmes tradicionals amb altres més brasilers: repenique, caixa, timba, tamborim, agogo, rocar, goliath, tom i surdo. La secció va néixer el 2003, fundada per Àngela García Lladó, Pau Cohí, Oriol Corroto i Gerard de Pablo \"Jerry\", que junt amb altres membres van formar el \"Comando Sant Cagat\"." },
        ],
      },
      {
        titol: "Càrrecs",
        items: [
          { term: "Director musical", definition: "Indica els canvis durant la interpretació, amb xiulet, veu o gestos." },
          { term: "Cap de Tabalers", definition: "Gestiona el grup de tabalers i organitza bolos i funcionament intern; sovint coincideix amb el director musical." },
          { term: "Vocal de Tabalers", definition: "Càrrec de junta que vetlla pels tabalers, treballant colze a colze amb el cap de tabalers i representant-los a junta." },
        ],
      },
    ],
  },
} as const;

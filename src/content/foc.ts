export const focContent = {
  material: {
    title: "El material de foc",
    items: [
      {
        name: "Maça",
        description:
          "L'eina bàsica del diable: canya amb carretilles i espurnes que giren al ritme del tabal. Revisa filferro i lligams abans de cada sortida.",
      },
      {
        name: "Trident",
        description:
          "Peça de lluïment per als moments d'aturada del correfoc, amb tres puntes carregades. Es porta amb els dos braços estesos, allunyat del cos.",
      },
      {
        name: "Ceptrot",
        description:
          "El bastó dels caps de colla i padrins, amb una càrrega més gran al capdamunt. Marca les entrades i sortides del correfoc. En tenim tres: Llucifer, Diablesa i la Nena.",
      },
      {
        name: "Espardenyes",
        description:
          "Calçat de tela i espart amb sola de goma antilliscant, imprescindible per moure's bé i amb seguretat entre les espurnes durant tot el correfoc.",
      },
    ],
  },

  rentar: {
    title: "Com rentar el vestit",
    pasPrvi: "Revisar cosits i butxaques.",
    passos: [
      "Posar en remull en aigua freda 1 o 2 hores.",
      "Esbandir (passar una aigua per treure la brutícia més grossa).",
      "Assecar al vent, estès en una perxa cada part per separat (casaca i pantaló). Millor que no li doni el sol directe: el traje s'exposa molt i acaba perdent el color.",
    ],
    rentadora: {
      titol: "Rentadora:",
      punts: [
        "Programa curt",
        "Aigua freda",
        "Sabó líquid (millor si és per colors foscos)",
        "NO suavitzant",
        "NO lleixiu",
        "Centrifugació normal",
        "NO secadora",
      ],
    },
  },

  tips: {
    title: "Tips de material",
    items: [
      {
        n: "1",
        title: "Renta el vestit després de cada bolo",
        text: "A mà o programa curt en fred, sense assecadora: el cotó tractat perd la ignifugació amb la calor.",
      },
      {
        n: "2",
        title: "Revisa la maça abans de sortir",
        text: "Filferro sencer, canya sense esquerdes i carretilles ben lligades. Si dubtes, ensenya-la al responsable de foc.",
      },
      {
        n: "3",
        title: "Mocador i guants sempre",
        text: "Mocador de cotó mullat al coll i guants de pell, mai sintètics. En tenim de recanvi a la caixa vermella del local.",
      },
      {
        n: "4",
        title: "Material vell, a la caixa de baixes",
        text: "Deixa-hi tot el que estigui cremat o gastat i anota-ho al full: així la junta ho reposa abans del bolo següent.",
      },
    ],
  },
} as const;

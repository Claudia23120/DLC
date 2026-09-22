/**
 * Static (hard-coded) content for the "La colla" section — Catalan copy taken
 * from the design. This is content, not UI logic; edit it here directly.
 */
export const collaContent = {
  history: [
    "Diables de les Corts som una colla de diables i tabalers que des de fa 30 anys animem i dinamitzem el Districte de Les Corts, fundada el 20 de maig de 1994 a la Plaça de la Concòrdia per quatre joves cortsencs i cortsenques amb l'objectiu de gaudir i fer gaudir a través de la cultura popular i tradicional.",
    "L'any 2003 va néixer la secció de percussió, arran d'una trobada al Senglar Rock entre diables i els futurs Tabalers de les Corts. El 2009, junt amb altres colles del barri, vam estrenar la nostra bèstia, El Guardià de les Corts, a la Plaça de Comas.",
    "Avui formem part del teixit associatiu de les Corts: la Plataforma Infantil i Juvenil, la Federació de Festa Major i Ca La Panarra, l'Espai Jove on tenim la nostra seu (C/ Dolors Masferrer 29-31).",
  ],

  fee: {
    intro:
      "El pagament de la quota la podeu fer a la tresorera o secretari en mà, Bizum o bé fer l'ingrés a:",
    iban: "ES96 3140 0001 9300 1591 0900",
    concept: "Nom Cognom_Any_Quota_45E",
  },

  contacts: [
    { label: "General", email: "hola@diableslescorts.cat" },
    { label: "Bolos i contractacions", email: "bolos@diableslescorts.cat" },
    { label: "Material i vestuari", email: "material@diableslescorts.cat" },
  ],
} as const;

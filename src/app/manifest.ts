import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Diables de les Corts",
    short_name: "Diables",
    description: "L'espai intern de la colla: bolos, reunions i tot el que cou.",
    start_url: "/bolos",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5ead8",
    theme_color: "#3a0b0a",
    icons: [
      {
        src: "/icon.png",
        sizes: "1080x1080",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "1080x1080",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["utilities"],
    lang: "ca",
  };
}

import { Factory } from "rosie";
import { MediaType } from "src/interfaces/common.interfaces";

export const mediaTypeFactory = Factory.define<MediaType>("mediaType")
  .attr("file", {
    url: {
      en: "https://www.example.com/photo.png",
      es: "https://example.es/photo.png",
    },
    contentType: "image/png",
    details: {
      size: 100,
      image: { width: { en: 100, es: 100 }, height: { en: 150, es: 150 } },
    },
    fileName: "photo.png",
  })
  .attr("title", { en: "Example Title", es: "Título de ejemplo" })
  .attr("description", {
    en: "Example Description",
    es: "Descripción de ejemplo",
  });

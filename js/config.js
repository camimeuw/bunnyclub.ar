// ===== CONFIGURACIÓN DE BUNNY CLUB =====
window.BUNNY = {
  // Tu número de WhatsApp con código de país, SIN + ni espacios. Argentina: 549 + código de área + número
  whatsapp: "5491100000000",
  instagram: "bunnyclub.ar",            // usuario sin @ (dejalo vacío "" para ocultarlo)
  // De dónde se leen los productos:
  //  - archivo local exportado desde Excel como CSV:
  productos: "data/productos.csv",
  //  - o un Google Sheet publicado como CSV (Archivo > Compartir > Publicar en la web > CSV). Pegá acá el link:
  //    productos: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv",
  // Títulos decorativos del catálogo (como en el flyer): arriba del catálogo y al final
  titulos: { superior: "angelic bunny", subtitulo: "ANGEL MENU", cierre: "The Bunny's Banquet" },
  carpetaImagenes: "img/",              // donde están las fotos de los productos
  // Decoraciones en los costados (PNG transparentes). Ejemplo:
  // { src: "assets/img/decor/estrella.png", lado: "izquierda", top: "25%", ancho: 120, rotacion: -8 }
  decoraciones: []
};

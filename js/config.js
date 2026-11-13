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
  // Estilo del botón de comprar / pedir (1 a 4):
  //   1 = pixel retro · 2 = píldora brillante · 3 = contorno punteado · 4 = etiqueta con muescas
  estiloBoton: 1,   // elegido: pixel retro
  carpetaImagenes: "img/",              // donde están las fotos de los productos
  // Decoraciones en los costados (PNG transparentes). Ejemplo:
  // { src: "assets/img/decor/estrella.png", lado: "izquierda", top: "25%", ancho: 120, rotacion: -8 }
  decoraciones: []
};

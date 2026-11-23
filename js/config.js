// ===== CONFIGURACIÓN DE BUNNY CLUB =====
window.BUNNY = {
  // Tu número de WhatsApp con código de país, SIN + ni espacios. Argentina: 549 + código de área + número
  whatsapp: "5491140226515",
  email: "bunnyclubshowroom@gmail.com",   // se muestra en Contacto (dejalo vacío "" para ocultarlo)
  telefonoVisible: "+54 9 11 4022-6515",   // cómo se escribe el número en Contacto
  instagram: "bunnyclub.ar",            // usuario sin @ (dejalo vacío "" para ocultarlo)
  // De dónde se leen los productos:
  //  - archivo local exportado desde Excel como CSV:
  productos: "data/productos.csv",
  //  - o un Google Sheet publicado como CSV (Archivo > Compartir > Publicar en la web > CSV). Pegá acá el link:
  //    productos: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv",
  // Estilo del botón de comprar / pedir (1 a 4):
  //   1 = pixel retro · 2 = píldora brillante · 3 = contorno punteado · 4 = etiqueta con muescas
  estiloBoton: 1,   // elegido: pixel retro
  // Textos del menú (editalos a tu gusto; cada línea es un renglón)
  info: {
    talles: [
      "Cada producto indica sus talles (del S al XXL).",
      "Las prendas de talle único dicen qué talles abarcan, por ejemplo: Único (S a L).",
      "Las bikinis, los trajes de baño y los shorts van por número.",
      "Si tenés dudas con tu talle, escribinos por WhatsApp y te ayudamos a elegir."
    ],
    envios: [
      "Coordinamos el envío por WhatsApp al confirmar tu pedido.",
      "Te pasamos el costo y el tiempo de entrega según tu zona."
    ]
  },
  // Tipos de prenda de Indumentaria, en el orden en que aparecen en el menú.
  // Desde el panel también se puede escribir un tipo nuevo: aparece solo en el menú, al final de esta lista.
  subcategorias: ["Partes de arriba", "Partes de abajo", "Vestidos y conjuntos", "Trajes de baño / Bikinis"],
  // Nombres viejos que la tienda muestra con el nombre nuevo (así no hay que editar producto por producto).
  renombrar: { "Vestidos": "Vestidos y conjuntos" },
  // Códigos de descuento (porcentaje). Para sumar uno, copiá una línea. "activo: false" lo apaga; "vence" es opcional (AAAA-MM-DD).
  // Además, un link como https://TUSITIO/?codigo=HOLA10 aplica el código solo.
  codigos: [
    { codigo: "HOLA10", porcentaje: 10, activo: true, vence: "" }
  ],
  // Conexión con el panel de administración (Firebase). Dejá projectId y apiKey vacíos para usar solo el Excel (data/productos.csv).
  // Los datos se copian de la consola de Firebase: ver ADMIN.md.
  firebase: { projectId: "bunnyclub-ebb49", apiKey: "AIzaSyCRVqWRbhCESwkiZwsZrzP9Gxm10AtS4II" },
  carpetaImagenes: "img/",              // donde están las fotos de los productos
  // Decoraciones en los costados (PNG transparentes). Ejemplo:
  // { src: "assets/img/decor/estrella.png", lado: "izquierda", top: "25%", ancho: 120, rotacion: -8 }
  decoraciones: []
};

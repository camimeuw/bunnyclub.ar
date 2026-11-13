# Bunny Club — catálogo

Sitio estático (HTML + CSS + JS, sin instalar nada). Colores: fondo `#F6E2EE`.
Fuentes: **Wizards Magic** (nombres y precios) · **Burgues Script** (categorías).

> Wizards Magic no trae números, `$`, `.` ni tildes (los glifos vienen vacíos), así que para esos
> caracteres se usa **Almendra** (`assets/fonts/Almendra-Regular.ttf`, licencia OFL). Si conseguís una versión
> de Wizards Magic completa, reemplazá el archivo y borrá la segunda `@font-face` en `css/style.css`.

## 1. Configurar
Editá `js/config.js`: tu **número de WhatsApp** (`549` + código de área + número, sin `+` ni espacios), Instagram, etc.

## 2. Cargar productos (Excel)
La planilla es `data/productos.csv`. Abrila con Excel, editala y guardá como **CSV UTF-8**
(*Guardar como → CSV UTF-8 (delimitado por comas)*; el de punto y coma también funciona).

| columna | qué poner |
|---|---|
| `nombre` | Nombre del producto |
| `precio` | Solo el número: `18500` (la página lo muestra `$18.500`) |
| `categoria` | `Indumentaria` o `Accesorios` |
| `subcategoria` | Solo para indumentaria: `Partes de arriba`, `Partes de abajo` o `Vestidos` |
| `imagenes` | Archivos separados por `\|`: `top-lila.png\|top-lila-2.png` (van en la carpeta `img/`) |
| `descripcion` | Texto que se ve al abrir el producto |
| `talles` | `S\|M\|L` (vacío si no tiene) |
| `colores` | `Rosa\|Negro` (vacío si no tiene) |
| `agotado` | `si` para marcarlo como agotado |

La **primera imagen** es la principal; la **segunda** aparece al pasar el mouse. Todas se ven en la galería del producto.
Las fotos tienen que ser **PNG con fondo transparente** para que queden flotando como en el diseño.

### Alternativa: Google Sheets
Armá la misma planilla en Google Sheets → *Archivo → Compartir → Publicar en la web → CSV* y pegá el link en
`productos` de `js/config.js`. Los cambios se ven sin volver a subir nada.

## 3. Probar en tu compu
Por seguridad el navegador no deja leer el CSV abriendo `index.html` directo. Usá un servidor local:
```bash
python3 -m http.server 8000
```
y abrí http://localhost:8000. Subido a un hosting (GitHub Pages, Netlify, etc.) funciona normal.

## 4. Decoraciones laterales
Agregá PNGs transparentes en `assets/img/decor/` y listalos en `decoraciones` de `js/config.js`.

## Estructura
```
index.html          página
css/style.css       estilos y animaciones
js/config.js        tus datos (WhatsApp, etc.)
js/app.js           menú, catálogo, modal, cursor, notitas
data/productos.csv  catálogo
img/                fotos de productos (hoy: ejemplos .svg)
assets/img/         logos y conejitos (PNG transparentes)
assets/fonts/       tipografías
```

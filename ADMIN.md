# Panel de la tienda — cómo conectarlo (una sola vez)

El panel está en **`/admin.html`** (por ejemplo `https://camimeuw.github.io/bunnyclub.ar/admin.html`). No está enlazado desde la tienda: la dueña lo abre con ese link, entra con su email y contraseña, y desde ahí maneja **productos, precios, fotos, descripciones y códigos de descuento**. Lo que guarda se ve en la tienda al instante, sin publicar nada.

Para que funcione hay que crear una cuenta gratis de Firebase (la base de datos de Google). Se hace una sola vez, son unos 10 minutos y **no pide tarjeta**.

## Paso a paso

1. **Crear el proyecto.** Entrá a <https://console.firebase.google.com> con una cuenta de Google, tocá **Agregar proyecto**, ponele un nombre (por ejemplo `bunnyclub`) y desactivá Google Analytics.
2. **Crear la base de datos.** Menú izquierdo → **Compilación → Firestore Database → Crear base de datos**. Elegí una región cercana (por ejemplo `southamerica-east1`, São Paulo) y **modo de producción**.
3. **Activar el ingreso con email.** **Compilación → Authentication → Comenzar → Email/contraseña → Habilitar**.
   - En la pestaña **Usuarios → Agregar usuario**, cargá el **email de la dueña** y una contraseña.
   - En **Configuración → Acciones del usuario**, si aparece la opción **"Habilitar la creación (registro)"**, desmarcala, así nadie más puede crear cuentas.
4. **Poner las reglas de seguridad.** En **Firestore Database → pestaña Reglas**, borrá lo que hay, pegá el contenido de `firestore.rules`, **cambiá el email por el de la dueña (en minúsculas)** y tocá **Publicar**.
5. **Copiar los datos de conexión.** Engranaje ⚙ → **Configuración del proyecto → General → Tus apps → icono web `</>`**. Registrá la app (cualquier nombre) y de lo que muestra copiá `projectId` y `apiKey`.
6. **Pegarlos en `js/config.js`**, en la línea `firebase`:
   ```js
   firebase: { projectId: "bunnyclub-xxxxx", apiKey: "AIzaSy..." },
   ```
   Guardá y subí el cambio a GitHub.
7. **Primera vez en el panel.** Abrí `/admin.html`, entrá y tocá **"Traer los productos actuales de la tienda"**. Después, en **Códigos de descuento**, tocá **"Traer códigos de la configuración"** (trae HOLA10).

A partir de ahí la tienda lee todo de Firebase. Si Firebase no responde, la tienda usa el Excel (`data/productos.csv`) y los códigos de `config.js`, así nunca queda vacía.

## Qué puede hacer la dueña
- **Productos:** agregar, editar, eliminar, marcar como agotado, cambiar el orden (flechas ▲ ▼), cargar nombre, precio, categoría, tipo de prenda, descripción, talles y colores.
- **Fotos:** subir hasta 8 por producto desde el celular o la compu. Si la foto tiene **fondo blanco**, el panel lo quita solo (se puede desmarcar). Conviene que el producto esté bien iluminado y centrado.
- **Códigos de descuento:** crear uno con su nombre y el porcentaje (por ejemplo `HOLA10` y 10%), ponerle fecha de vencimiento opcional, apagarlo o prenderlo, y eliminarlo.

## Cosas para saber
- **Los códigos no son secretos.** La tienda es una página sin servidor, así que quien sepa mirar el código de la página puede ver los códigos activos. Como el pedido termina en WhatsApp y la dueña confirma el precio, el riesgo es bajo.
- **Las fotos se guardan en la misma base de datos** (se achican y se convierten a WebP). Se hace así porque Firebase Storage pide activar la facturación; con este sistema alcanza el plan gratis. Cada foto queda en unos 100–150 KB.
- **Plan gratis (Spark):** permite 50.000 lecturas y 20.000 escrituras por día. Cada visita a la tienda usa unas pocas lecturas, así que alcanza para cientos de visitas diarias.
- **Seguridad extra (opcional):** en Google Cloud → APIs y servicios → Credenciales, podés limitar la `apiKey` para que solo funcione desde el dominio de la tienda.
- **Contraseña olvidada:** en el login hay un botón "Olvidé mi contraseña" que manda un mail para cambiarla.

# NutriZone Virtual Store 🛒

Bienvenido al repositorio de la tienda virtual de NutriZoneCR. Este proyecto es una tienda ligera, rápida y optimizada para dispositivos móviles (Mobile-First) construida con HTML, CSS y JavaScript Vanilla. Toda la información de productos se lee dinámicamente desde un archivo de configuración JSON.

---

## 🚀 Pasos para el Release (Despliegue)

Dado que la tienda no utiliza frameworks pesados ni bases de datos complejas, el despliegue a producción es sumamente sencillo. Puedes alojarlo en prácticamente cualquier servidor web (hosting tradicional, Netlify, Vercel, GitHub Pages, etc.).

**Requisitos previos:**
1. Asegúrate de tener los archivos finales listos: `index.html`, `styles.css`, `app.js`, y la carpeta `assets/` con el `logo.png` y `banner.png` (recuerda recortar el margen transparente del logo para que luzca grande).
2. Asegúrate de que tu catálogo actualizado y limpio esté guardado en `config/json-config.json`.

**Pasos de despliegue inicial (AWS Lightsail + GitHub):**
1. Sube todo el código de tu proyecto (incluyendo `assets/` y `config/`) a un repositorio en GitHub.
2. Conéctate a tu instancia de AWS Lightsail vía terminal web SSH.
3. Asegúrate de tener Git instalado (usualmente ya viene instalado, o usa `sudo apt install git`).
4. Clona tu repositorio directamente en el directorio público de tu servidor:
   - **Si usas Apache (Bitnami):**
     ```bash
     cd /opt/bitnami/apache2/htdocs/
     sudo rm -rf * # Limpia los archivos por defecto (opcional, ¡cuidado!)
     sudo git clone https://github.com/tu-usuario/tu-repositorio.git .
     ```
   - **Si usas Nginx o Apache tradicional (Tu entorno específico):**
     ```bash
     cd /var/www/html/main/
     sudo git clone https://github.com/tu-usuario/tu-repositorio.git .
     ```
5. Ajusta los permisos para que el servidor pueda leer los archivos correctamente:
   ```bash
   sudo chown -R www-data:www-data /var/www/html/main/
   sudo chmod -R 755 /var/www/html/main/
   ```
6. ¡Listo! Ingresa a la IP estática o dominio de tu instancia Lightsail y verás tu tienda en vivo.

**Para futuras actualizaciones (Agregar productos o realizar cambios):**
1. Haz los cambios localmente en tu computadora (por ejemplo, agrega productos al JSON y corre `python3 build_catalog.py`).
2. Sube los cambios a GitHub:
   ```bash
   git add .
   git commit -m "Nuevos productos"
   git push
   ```
3. Conéctate a tu instancia Lightsail por SSH, ve a la carpeta web y actualiza:
   ```bash
   cd /var/www/html/main/
   sudo git pull origin main
   ```
   > **Nota de seguridad (Dubious ownership):** Si Git te arroja un error diciendo `fatal: detected dubious ownership`, esto pasa porque le dimos la propiedad de los archivos a `www-data` pero tú eres el usuario `ubuntu` o `root`. Solo debes correr este comando una vez para decirle a Git que la carpeta es segura:
   > ```bash
   > sudo git config --global --add safe.directory /var/www/html/main
   > ```
   > Y luego vuelve a intentar el `sudo git pull origin main`.

**Pasos de despliegue (Plataformas modernas alternativas como Netlify / Vercel):**
1. Sube tu carpeta del proyecto a un repositorio en GitHub.
2. Conecta tu cuenta de GitHub a Netlify o Vercel.
3. Selecciona el repositorio de NutriZone.
4. Deja los comandos de "Build" en blanco (ya que es Vanilla JS).
5. Haz clic en "Deploy". En segundos tendrás una URL en vivo (puedes conectar tu dominio personalizado luego).

---

## 📦 Proceso para Agregar Nuevos Productos

Cuando recibas información de nuevos productos (o cuando exportes el inventario actualizado desde tu sistema o IA), es probable que las descripciones incluyan mucha información cruda: reglas para vendedores, argumentos para manejo de objeciones, o instrucciones internas ("ENFOQUE PARA PROMPT DE IA").

Para mantener la tienda elegante y orientada 100% al cliente final, debes seguir este proceso **siempre** que agregues productos nuevos:

### Paso 1: Actualizar el JSON
1. Abre el archivo `config/json-config.json`.
2. Agrega el nuevo producto siguiendo la estructura exacta (SKU, name, category, price, brand, image_url, description, is_active).
3. Pega la descripción gigante/cruda generada por tu IA o catálogo interno en el campo `"description"`.
4. Guarda el archivo.

### Paso 2: Las Imágenes
- Si el producto ya tiene una imagen en tu sistema externo (Senda), simplemente asegúrate de que el campo `"image_url"` tenga la ruta original (ej. `/static/product_images/...` o `https://...`).
- ¡No tienes que descargarla manualmente! Nuestro script se encargará de ello.

### Paso 3: Construir el Catálogo (Magia Automática)
Para no mostrar notas de vendedores, y para asegurar que las fotos carguen ultra-rápido, tenemos el script maestro `build_catalog.py`.

*Nota inicial: Asegúrate de tener la librería de imágenes instalada corriendo una vez `pip3 install Pillow` en tu computadora.*

1. Abre tu terminal.
2. Navega hasta la carpeta del proyecto.
3. Ejecuta el script maestro:
   ```bash
   python3 build_catalog.py
   ```
4. **¿Qué hace el script?**
   - **Limpia los textos**: Lee las descripciones crudas de `json-config.json`, extrae inteligentemente solo la información valiosa (Texto Comercial, Beneficios, Ingredientes, Uso), elimina advertencias para vendedores, y formatea todo con etiquetas HTML (`<strong>`).
   - **Descarga y Optimiza**: Descarga automáticamente cualquier imagen externa a tu carpeta local `assets/products/`, y la convierte al hiper-ligero formato `.webp` usando Pillow.
   - **Actualiza**: Sobrescribe el `json-config.json` para que ahora el producto apunte a la imagen local súper rápida (ej. `assets/products/imagen.webp`).

### Paso 4: Subir los Cambios a Producción (AWS Lightsail)
Una vez que probaste localmente y todo se ve bien, el proceso de despliegue a tu tienda en vivo es muy estricto y seguro:

1. **En tu computadora (Local):** Guarda los cambios en GitHub.
   ```bash
   git add .
   git commit -m "Actualización de catálogo: nuevos productos e imágenes"
   git push
   ```
2. **En tu servidor AWS (Producción):** Conéctate por SSH y fuerza la actualización.
   ```bash
   cd /var/www/html/main/
   
   # Forzar a que el servidor quede EXACTAMENTE igual a GitHub
   sudo git fetch origin
   sudo git reset --hard origin/main
   
   # Asegurar permisos correctos
   sudo chown -R www-data:www-data .
   ```
3. ¡Al refrescar la página en vivo, los clientes verán los productos actualizados inmediatamente!

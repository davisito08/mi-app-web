# GravityLab 🚀🌌

GravityLab es una aplicación web interactiva que funciona como un sandbox físico en 2D. Permite a los usuarios crear, editar y compartir "escenas" personalizadas donde pueden experimentar con la gravedad, colisiones e interacciones táctiles/ratón sobre elementos visuales.

---

## 🌟 Características Principales

*   **Simulador de Física 2D**: Impulsado por el motor de física **Matter.js**. Permite arrastrar, lanzar e interactuar con objetos en tiempo real.
*   **Gestión de Escenas**: Creación y edición de escenas personalizando el color de fondo, imágenes, y la gravedad en los ejes X e Y en tiempo real.
*   **Panel de Estadísticas**: Sincronización en tiempo real de estadísticas como el total de escenas guardadas, escenas públicas y contador global de vistas.
*   **Modo Claro / Oscuro**: Selector de temas visuales modernos y limpios con persistencia automática en el navegador utilizando `localStorage`.
*   **Navegación e Información**: Páginas informativas independientes y consistentes con el diseño de la aplicación para Documentación, API, Acerca de y Contacto.
*   **Diseño Premium**: Interfaz moderna con gradientes sutiles, microanimaciones y tipografía elegante (Outfit).

---

## 🛠️ Tecnologías Utilizadas

### Frontend
*   **HTML5 & CSS3**: Estructuración semántica y estilos CSS nativos (variables CSS, flexbox, grid, animaciones de transición).
*   **JavaScript (Vanilla)**: Lógica interactiva nativa (cero dependencias externas complejas).
*   **Matter.js**: Motor de física 2D de alto rendimiento para simular colisiones y gravedad.
*   **Google Fonts**: Fuente tipográfica "Outfit".

### Backend & Base de Datos
*   **PHP 8+**: API REST en el lado del servidor para gestionar operaciones CRUD.
*   **MySQL**: Base de datos relacional para persistir la información de las escenas.
*   **PDO (PHP Data Objects)**: Capa de abstracción de base de datos segura contra inyecciones SQL.

---

## 💾 Instrucciones de Instalación

Sigue estos pasos para desplegar GravityLab en tu propio servidor web local o de producción (como Apache, Nginx o XAMPP):

### 1. Requisitos Previos
*   Un servidor web que soporte **PHP 8.0** o superior.
*   Un servidor de bases de datos **MySQL** o MariaDB.
*   El módulo `zip` o soporte para archivar (opcional).

### 2. Despliegue de Archivos
Copia todos los archivos de este proyecto al directorio raíz de tu servidor web (por ejemplo, `/var/www/html/` en Linux o `C:/xampp/htdocs/` en Windows).

### 3. Configuración de la Base de Datos
1.  Accede a tu gestor de base de datos (como phpMyAdmin o consola MySQL).
2.  Crea una nueva base de datos llamada `gravitylab` (o el nombre que prefieras).
3.  Importa el volcado SQL provisto (`gravitylab_db.sql`) para crear las tablas necesarias e insertar datos de prueba.

### 4. Conexión de la Aplicación
Abre el archivo `config.php` en la raíz del proyecto y edita las siguientes constantes con las credenciales de acceso a tu servidor MySQL:

```php
define('DB_HOST',    'localhost');
define('DB_PORT',    '3306');
define('DB_NAME',    'gravitylab');
define('DB_USER',    'tu_usuario_mysql');
define('DB_PASS',    'tu_contraseña_mysql');
```

### 5. ¡Listo para Usar!
Abre tu navegador web favorito y navega a la dirección local de tu proyecto:
`http://localhost/nombre-carpeta/index.html` (o la dirección IP/dominio de tu servidor).

---

## 📡 Referencia de la API

La aplicación incluye un endpoint REST básico en `api/scenes.php`:

*   `GET /api/scenes.php`: Lista todas las escenas en formato JSON.
*   `POST /api/scenes.php`: Crea una nueva escena en la base de datos (acepta JSON).
*   `DELETE /api/scenes.php?id={ID}`: Elimina la escena especificada de forma segura.

Url del servidor: https://alumno14.dwes.site/
---
*Hecho con ⚡ y física por el equipo de GravityLab.*

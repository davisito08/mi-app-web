<?php
/**
 * config.example.php — GravityLab (Plantilla de Configuración)
 * 
 * Instrucciones:
 * 1. Copia o renombra este archivo como 'config.php' en este mismo directorio.
 * 2. Edita los valores de las constantes de base de datos a continuación con tus credenciales locales.
 * 3. ¡No subas tu 'config.php' real al repositorio de control de versiones público!
 */

// ── Credenciales de la Base de Datos ──────────────────────────────────
define('DB_HOST',    'your_database_host');     // Ejemplo: 'localhost' o '127.0.0.1'
define('DB_PORT',    '3306');                   // Puerto por defecto de MySQL
define('DB_NAME',    'your_database_name');     // Ejemplo: 'gravitylab'
define('DB_USER',    'your_database_user');     // Tu usuario de MySQL
define('DB_PASS',    'your_database_password'); // Tu contraseña de MySQL
define('DB_CHARSET', 'utf8mb4');

// ── DSN (Data Source Name) ───────────────────────────────────────────
define('DB_DSN', sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
    DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
));

// ── Opciones de Conexión PDO ──────────────────────────────────────────
define('PDO_OPTIONS', [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
]);

/**
 * Devuelve una instancia PDO (singleton por petición).
 *
 * @return PDO
 * @throws RuntimeException si no se puede conectar
 */
function getConnection(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        try {
            $pdo = new PDO(DB_DSN, DB_USER, DB_PASS, PDO_OPTIONS);
        } catch (PDOException $e) {
            error_log('[GravityLab] DB error: ' . $e->getMessage());
            throw new RuntimeException(
                'No se pudo conectar a la base de datos de GravityLab.',
                (int) $e->getCode(),
                $e
            );
        }
    }

    return $pdo;
}

// ── Variables de Entorno y Depuración ───────────────────────────────
define('APP_NAME',    'GravityLab');
define('APP_VERSION', '1.0.0');
define('APP_DEBUG',   true);    // Cambiar a false en servidores de producción

date_default_timezone_set('Europe/Madrid');

if (APP_DEBUG) {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

/**
 * Envía una respuesta JSON formateada y termina la ejecución.
 *
 * @param mixed $data
 * @param int   $status Código HTTP de respuesta
 */
function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

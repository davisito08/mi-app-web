<?php
/**
 * api/scenes.php — GravityLab
 * POST → crea una nueva escena en la BD y devuelve JSON
 * GET  → devuelve todas las escenas (para uso futuro)
 *
 * Campos POST esperados (JSON o form-data):
 *   nombre       string  requerido, máx 200 chars
 *   descripcion  string  opcional,  máx 1000 chars
 *   fondo_color  string  hex #RRGGBB  (default #0f0f1a)
 *   fondo_imagen string  URL válida   (opcional)
 *   gravedad_y   float   −3 a 3       (default 1.00)
 *   gravedad_x   float   −3 a 3       (default 0.00)
 *   es_publica   bool/int 0 o 1       (default 0 = privada)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ── Ruta DELETE ───────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    try {
        $pdo = getConnection();
        $id  = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID no válido'], 400);
        }
        $stmt = $pdo->prepare('DELETE FROM escenas WHERE id = :id');
        $stmt->execute([':id' => $id]);
        jsonResponse(['success' => true, 'message' => 'Escena eliminada correctamente.']);
    } catch (RuntimeException $e) {
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// ── Ruta GET ──────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    try {
        $pdo  = getConnection();
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        
        if ($id) {
            // Incrementar vistas de la escena accedida
            $stmt = $pdo->prepare('UPDATE escenas SET vistas = vistas + 1 WHERE id = :id');
            $stmt->execute([':id' => $id]);
            
            // Devolver detalle (incluyendo todos los campos)
            $stmt = $pdo->prepare('SELECT * FROM escenas WHERE id = :id');
            $stmt->execute([':id' => $id]);
            $scene = $stmt->fetch();
            
            if ($scene) {
                jsonResponse(['success' => true, 'data' => $scene]);
            } else {
                jsonResponse(['success' => false, 'message' => 'Escena no encontrada'], 404);
            }
        } else {
            // Lista general
            $stmt = $pdo->query(
                'SELECT id, nombre, descripcion, fondo_color, fondo_imagen,
                        gravedad_y, gravedad_x, es_publica, vistas, created_at
                 FROM escenas
                 ORDER BY created_at DESC'
            );
            jsonResponse(['success' => true, 'data' => $stmt->fetchAll(), 'count' => $stmt->rowCount()]);
        }
    } catch (RuntimeException $e) {
        jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

// ── Ruta POST / PUT ───────────────────────────────────────────────────────────
if ($method !== 'POST' && $method !== 'PUT') {
    jsonResponse(['success' => false, 'message' => 'Método no permitido.'], 405);
}

// Leer body (JSON o form-data)
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (str_contains($contentType, 'application/json')) {
    $raw  = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? [];
} else {
    $body = $_POST;
}

// En el caso de PUT via fetch, los datos suelen venir en el body crudo
if ($method === 'PUT' && empty($body)) {
    parse_str(file_get_contents('php://input'), $body);
}

// ── Validación ─────────────────────────────────────────────────────────────
$errors = [];

$nombre = trim($body['nombre'] ?? '');
if ($nombre === '') {
    $errors[] = 'El nombre de la escena es obligatorio.';
} elseif (mb_strlen($nombre) > 200) {
    $errors[] = 'El nombre no puede superar 200 caracteres.';
}

$descripcion = trim($body['descripcion'] ?? '');
if (mb_strlen($descripcion) > 1000) {
    $errors[] = 'La descripción no puede superar 1000 caracteres.';
}

$fondoColor = trim($body['fondo_color'] ?? '#0f0f1a');
if (!preg_match('/^#[0-9a-fA-F]{6}$/', $fondoColor)) {
    $fondoColor = '#0f0f1a';   // fallback silencioso
}

$fondoImagen = trim($body['fondo_imagen'] ?? '');
if ($fondoImagen !== '' && !filter_var($fondoImagen, FILTER_VALIDATE_URL)) {
    $errors[] = 'La URL de imagen de fondo no es válida.';
}

$gravedadY = (float) ($body['gravedad_y'] ?? 1.0);
$gravedadX = (float) ($body['gravedad_x'] ?? 0.0);
$gravedadY = max(-3.0, min(3.0, $gravedadY));
$gravedadX = max(-3.0, min(3.0, $gravedadX));

$esPublica = filter_var($body['es_publica'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

if (!empty($errors)) {
    jsonResponse(['success' => false, 'errors' => $errors], 422);
}

// ── Persistencia ───────────────────────────────────────────────────────────
try {
    $pdo = getConnection();
    
    if ($method === 'PUT') {
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if (!$id) {
            jsonResponse(['success' => false, 'message' => 'ID requerido para actualizar.'], 400);
        }
        
        $stmt = $pdo->prepare(
            'UPDATE escenas SET
                nombre = :nombre,
                descripcion = :descripcion,
                fondo_color = :fondo_color,
                fondo_imagen = :fondo_imagen,
                gravedad_y = :gravedad_y,
                gravedad_x = :gravedad_x,
                es_publica = :es_publica
             WHERE id = :id'
        );
        $stmt->execute([
            ':nombre'       => $nombre,
            ':descripcion'  => $descripcion !== '' ? $descripcion : null,
            ':fondo_color'  => $fondoColor,
            ':fondo_imagen' => $fondoImagen !== '' ? $fondoImagen : null,
            ':gravedad_y'   => $gravedadY,
            ':gravedad_x'   => $gravedadX,
            ':es_publica'   => $esPublica,
            ':id'           => $id
        ]);
        
        jsonResponse(['success' => true, 'message' => '¡Escena actualizada con éxito!']);
        
    } else {
        // POST (Crear)
        $stmt = $pdo->prepare(
            'INSERT INTO escenas
               (nombre, descripcion, fondo_color, fondo_imagen, gravedad_y, gravedad_x, es_publica)
             VALUES
               (:nombre, :descripcion, :fondo_color, :fondo_imagen, :gravedad_y, :gravedad_x, :es_publica)'
        );
        $stmt->execute([
            ':nombre'       => $nombre,
            ':descripcion'  => $descripcion !== '' ? $descripcion : null,
            ':fondo_color'  => $fondoColor,
            ':fondo_imagen' => $fondoImagen !== '' ? $fondoImagen : null,
            ':gravedad_y'   => $gravedadY,
            ':gravedad_x'   => $gravedadX,
            ':es_publica'   => $esPublica,
        ]);

        $newId = (int) $pdo->lastInsertId();
        jsonResponse([
            'success' => true,
            'message' => '¡Escena creada con éxito!',
            'id'      => $newId
        ], 201);
    }

} catch (RuntimeException $e) {
    jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}

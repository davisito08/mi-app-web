-- ============================================================
--  GravityLab — Experimento Visual de Gravedad
--  Script SQL completo para crear la base de datos
--  Fecha: 2026-03-23
-- ============================================================

CREATE DATABASE IF NOT EXISTS `gravitylab_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `gravitylab_db`;

-- ============================================================
-- TABLA: usuarios
-- Personas que usan la aplicación y crean escenas
-- ============================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `nombre`         VARCHAR(100)  NOT NULL,
  `email`          VARCHAR(150)  NOT NULL,
  `password_hash`  VARCHAR(255)  NOT NULL,
  `avatar_url`     VARCHAR(500)      NULL DEFAULT NULL,
  `rol`            ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  `activo`         TINYINT(1)    NOT NULL DEFAULT 1,
  `creado_en`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Usuarios registrados en la aplicación';

-- ============================================================
-- TABLA: tipos_elemento
-- Catálogo de tipos de elementos que pueden "caer"
-- (imagen, botón, texto, tarjeta, emoji, icono…)
-- ============================================================
CREATE TABLE IF NOT EXISTS `tipos_elemento` (
  `id`      TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clave`   VARCHAR(50)      NOT NULL,
  `etiqueta` VARCHAR(100)    NOT NULL,
  `icono`   VARCHAR(100)         NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clave` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de tipos de elementos interactivos';

-- Datos por defecto del catálogo
INSERT INTO `tipos_elemento` (`clave`, `etiqueta`, `icono`) VALUES
  ('imagen',  'Imagen / Foto',   'image'),
  ('boton',   'Botón',           'hand-pointer'),
  ('texto',   'Bloque de Texto', 'font'),
  ('tarjeta', 'Tarjeta',         'id-card'),
  ('emoji',   'Emoji',           'smile'),
  ('icono',   'Icono SVG',       'star');

-- ============================================================
-- TABLA: escenas
-- Un "lienzo" donde el usuario coloca elementos
-- y activa el efecto de gravedad
-- ============================================================
CREATE TABLE IF NOT EXISTS `escenas` (
  `id`            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `usuario_id`    INT UNSIGNED  NOT NULL,
  `nombre`        VARCHAR(200)  NOT NULL,
  `descripcion`   TEXT              NULL DEFAULT NULL,
  `fondo_color`   VARCHAR(7)    NOT NULL DEFAULT '#0f0f1a',
  `fondo_imagen`  VARCHAR(500)      NULL DEFAULT NULL,
  `gravedad_x`    DECIMAL(5,2)  NOT NULL DEFAULT  0.00
                                COMMENT 'Componente horizontal de gravedad',
  `gravedad_y`    DECIMAL(5,2)  NOT NULL DEFAULT  1.00
                                COMMENT 'Componente vertical de gravedad',
  `publica`       TINYINT(1)    NOT NULL DEFAULT 0,
  `vistas`        INT UNSIGNED  NOT NULL DEFAULT 0,
  `creado_en`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario`  (`usuario_id`),
  KEY `idx_publica`  (`publica`),
  CONSTRAINT `fk_escenas_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Lienzos/escenas del experimento de gravedad';

-- ============================================================
-- TABLA: elementos
-- Cada objeto individual dentro de una escena
-- ============================================================
CREATE TABLE IF NOT EXISTS `elementos` (
  `id`               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `escena_id`        INT UNSIGNED     NOT NULL,
  `tipo_id`          TINYINT UNSIGNED NOT NULL,
  `etiqueta`         VARCHAR(200)         NULL DEFAULT NULL
                                     COMMENT 'Nombre descriptivo del elemento',

  -- Posición y tamaño (px)
  `pos_x`            FLOAT            NOT NULL DEFAULT 100,
  `pos_y`            FLOAT            NOT NULL DEFAULT 100,
  `ancho`            FLOAT            NOT NULL DEFAULT 150,
  `alto`             FLOAT            NOT NULL DEFAULT 100,
  `rotacion`         FLOAT            NOT NULL DEFAULT 0
                                     COMMENT 'Grados de rotación inicial',

  -- Propiedades físicas
  `masa`             FLOAT            NOT NULL DEFAULT 1.0,
  `rebote`           FLOAT            NOT NULL DEFAULT 0.5
                                     COMMENT 'Coeficiente de restitución 0-1',
  `friccion`         FLOAT            NOT NULL DEFAULT 0.1,
  `es_estatico`      TINYINT(1)       NOT NULL DEFAULT 0
                                     COMMENT '1 = actúa como suelo/pared fija',

  -- Contenido visual
  `contenido_texto`  TEXT                 NULL DEFAULT NULL,
  `imagen_url`       VARCHAR(500)         NULL DEFAULT NULL,
  `color_fondo`      VARCHAR(7)       NOT NULL DEFAULT '#6c63ff',
  `color_texto`      VARCHAR(7)       NOT NULL DEFAULT '#ffffff',
  `border_radius`    TINYINT UNSIGNED NOT NULL DEFAULT 8,

  -- Control
  `orden`            SMALLINT         NOT NULL DEFAULT 0,
  `visible`          TINYINT(1)       NOT NULL DEFAULT 1,
  `creado_en`        DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en`   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP
                                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_escena` (`escena_id`),
  KEY `idx_tipo`   (`tipo_id`),
  CONSTRAINT `fk_elementos_escena`
    FOREIGN KEY (`escena_id`) REFERENCES `escenas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_elementos_tipo`
    FOREIGN KEY (`tipo_id`) REFERENCES `tipos_elemento` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Elementos interactivos dentro de una escena';

-- ============================================================
-- TABLA: imagenes_subidas
-- Gestiona las imágenes que los usuarios suben
-- ============================================================
CREATE TABLE IF NOT EXISTS `imagenes_subidas` (
  `id`               INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  `usuario_id`       INT UNSIGNED      NOT NULL,
  `nombre_original`  VARCHAR(255)      NOT NULL,
  `nombre_archivo`   VARCHAR(255)      NOT NULL
                                       COMMENT 'Nombre en disco (slug/uuid)',
  `ruta`             VARCHAR(500)      NOT NULL,
  `mime_type`        VARCHAR(100)      NOT NULL,
  `tamano_bytes`     INT UNSIGNED      NOT NULL,
  `ancho_px`         SMALLINT UNSIGNED     NULL DEFAULT NULL,
  `alto_px`          SMALLINT UNSIGNED     NULL DEFAULT NULL,
  `subida_en`        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nombre_archivo` (`nombre_archivo`),
  KEY `idx_usuario_img` (`usuario_id`),
  CONSTRAINT `fk_imagenes_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Imágenes subidas por los usuarios';

-- ============================================================
-- TABLA: sesiones_gravedad
-- Registra cada activación del efecto de gravedad
-- para estadísticas y analíticas
-- ============================================================
CREATE TABLE IF NOT EXISTS `sesiones_gravedad` (
  `id`               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `escena_id`        INT UNSIGNED  NOT NULL,
  `usuario_id`       INT UNSIGNED      NULL DEFAULT NULL
                                   COMMENT 'NULL si el visitante es anónimo',
  `ip_usuario`       VARCHAR(45)       NULL DEFAULT NULL,
  `elementos_caidos` INT UNSIGNED  NOT NULL DEFAULT 0,
  `duracion_seg`     INT               NULL DEFAULT NULL
                                   COMMENT 'Segundos que duró la simulación',
  `max_velocidad`    FLOAT             NULL DEFAULT NULL,
  `iniciada_en`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `finalizada_en`    DATETIME          NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ses_escena`   (`escena_id`),
  KEY `idx_ses_usuario`  (`usuario_id`),
  CONSTRAINT `fk_sesiones_escena`
    FOREIGN KEY (`escena_id`) REFERENCES `escenas` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sesiones_usuario`
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registro de activaciones del efecto de gravedad';

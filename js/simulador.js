// ================================================================
// Simulador de físicas 2D con Matter.js
// ================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Extraer ID de la url
    const params = new URLSearchParams(window.location.search);
    const sceneId = params.get('id');

    if (!sceneId) {
        alert("No se especificó ninguna escena.");
        window.location.href = 'index.html';
        return;
    }

    try {
        // 2. Obtener config desde API
        const res = await fetch(`api/scenes.php?id=${sceneId}`);
        const json = await res.json();
        
        if (!json.success) {
            alert(json.message || "Error al cargar la escena");
            return;
        }

        const scene = json.data;
        initSimulation(scene);

    } catch (err) {
        console.error("Error al obtener la escena:", err);
        alert("Error de red");
    }
});

function initSimulation(scene) {
    // Escapar texto HTML
    const escapeHTML = str => String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));

    // ==========================================
    // A. SET UI & BACKGROUND
    // ==========================================
    const metaUI = document.getElementById('scene-meta');
    metaUI.innerHTML = `
        <strong>${escapeHTML(scene.nombre)}</strong>
        <span style="opacity: 0.8">↕ g: ${scene.gravedad_y} | ↔ g_x: ${scene.gravedad_x}</span>
        ${scene.descripcion ? `<br/><span style="font-size:0.85em; opacity:0.6">${escapeHTML(scene.descripcion)}</span>` : ''}
    `;

    console.log("[GravityLab] Iniciando simulación v2 para:", scene.nombre);
    
    // Limpiar cualquier rastro de imagen de fondo previa en el body
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = escapeHTML(scene.fondo_color) || '#0f0f1a';
    
    // ==========================================
    // B. INIT MATTER.JS
    // ==========================================
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite,
          MouseConstraint = Matter.MouseConstraint,
          Mouse = Matter.Mouse;

    const engine = Engine.create();
    
    // Asignar gravedad según los parámetros elegidos (multiplicados para que se note la física)
    engine.world.gravity.y = parseFloat(scene.gravedad_y) * 1.5; 
    engine.world.gravity.x = parseFloat(scene.gravedad_x) * 1.5;

    const container = document.getElementById('canvas-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent'
        }
    });

    // ==========================================
    // C. MUNDO Y LÍMITES
    // ==========================================
    const wallOptions = { 
        isStatic: true, 
        render: { fillStyle: 'transparent' } // Muros invisibles
    };
    
    const t = 100; // grosor de los muros
    // Creamos suelo, techo y paredes
    const ground = Bodies.rectangle(width / 2, height + t/2, width, t, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -t/2, width, t, wallOptions);
    const leftWall = Bodies.rectangle(-t/2, height / 2, t, height, wallOptions);
    const rightWall = Bodies.rectangle(width + t/2, height / 2, t, height, wallOptions);

    Composite.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    // ==========================================
    // D. ELEMENTOS ALEATORIOS Y SPRITE
    // ==========================================
    const elements = [];
    const colorTheme = escapeHTML(scene.fondo_color) || '#a855f7';

    // 1. Añadir el Sprite de la Imagen (si existe)
    if (scene.fondo_imagen) {
        console.log("[GravityLab] Cargando imagen como objeto físico:", scene.fondo_imagen);
        const img = new Image();
        img.src = scene.fondo_imagen;
        img.onload = () => {
            const targetSize = 180; // tamaño pequeñito
            const ratio = img.width / img.height;
            const w = ratio > 1 ? targetSize : targetSize * ratio;
            const h = ratio > 1 ? targetSize / ratio : targetSize;

            const imageBody = Bodies.rectangle(width / 2, height / 4, w, h, {
                restitution: 0.8,
                friction: 0.1,
                render: {
                    sprite: {
                        texture: scene.fondo_imagen,
                        xScale: w / img.width,
                        yScale: h / img.height
                    }
                }
            });
            Composite.add(engine.world, imageBody);
        };
        img.onerror = () => console.error("[GravityLab] Error al cargar la imagen:", scene.fondo_imagen);
    }
    
    // 2. Crear el resto de elementos (caos visual)
    const elementCount = 40;
    
    for (let i = 0; i < elementCount; i++) {
        // Posiciones iniciales variadas (algunas fuera de pantalla por arriba)
        const x = Math.random() * width;
        const y = (Math.random() * height * 0.8) - height; 
        
        const size = Math.random() * 40 + 20; // 20 a 60 px
        
        // Alternar entre blanco (o semi blanco) y el color del tema
        const isThemeColor = Math.random() > 0.5;
        const renders = { 
            fillStyle: isThemeColor ? colorTheme : 'rgba(255,255,255,0.9)',
            strokeStyle: 'rgba(255,255,255,0.2)',
            lineWidth: isThemeColor ? 1 : 0
        };
        
        let body;
        const type = Math.random();
        
        if (type > 0.6) {
            // Círculos (Rebotan más)
            body = Bodies.circle(x, y, size/2, { 
                render: renders, 
                restitution: 0.9, 
                friction: 0.05 
            });
        } else if (type > 0.3) {
            // Cajas
            body = Bodies.rectangle(x, y, size, size*1.2, { 
                render: renders, 
                restitution: 0.6,
                chamfer: { radius: 5 } // bordes redondeados
            });
        } else {
            // Polígonos (Triángulos/Hexágonos)
            const sides = Math.floor(Math.random() * 4) + 3; // 3 a 6 lados
            body = Bodies.polygon(x, y, sides, size/2, { 
                render: renders, 
                restitution: 0.7 
            });
        }
        elements.push(body);
    }
    
    Composite.add(engine.world, elements);

    // ==========================================
    // E. INTERACTIVIDAD DE RATÓN
    // ==========================================
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2, // fuerza con la que agarras el bloque
            render: { visible: false } // no dibujar la línea de agarre
        }
    });
    Composite.add(engine.world, mouseConstraint);
    render.mouse = mouse; // Síncrono para el scroll

    // Arrancar render
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // ==========================================
    // F. RESIZE LISTENER
    // ==========================================
    window.addEventListener('resize', () => {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        // Ajustar muros
        Matter.Body.setPosition(ground, { x: window.innerWidth/2, y: window.innerHeight + t/2 });
        Matter.Body.setPosition(rightWall, { x: window.innerWidth + t/2, y: window.innerHeight/2 });
        Matter.Body.setPosition(ceiling, { x: window.innerWidth/2, y: -t/2 });
        // Para ajustar adecuadamente dimensions, habría que recrearlos, pero con Position basta ssi la pantalla no crece más de *width* original.
    });
}

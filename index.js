/**
 * 🎄 Christmas Tree 3D Particle System
 * Hiệu ứng cây thông Noel với hạt ánh sáng lung linh
 * Có thể chuyển cảnh mượt mà sang chữ "I❤U"
 */

// ============================================
// Global Variables
// ============================================
let scene, camera, renderer, controls;
let particles, particleGeometry, particleMaterial;
let targetPositions = { tree: [], heart: [] };
let currentPositions = [];
let colors = [];
let sizes = [];
let particleCount = 10000;
let twinkleSpeed = 5;
let currentShape = 'tree';
let isTransitioning = false;
let transitionProgress = 0;
let autoMode = false;
let autoTimer = null;
let clock;

// Color palette - Màu sắc sặc sỡ như đom đóm
const COLORS = {
    christmas: [
        { r: 1.0, g: 0.2, b: 0.3 },   // Đỏ
        { r: 0.0, g: 1.0, b: 0.5 },   // Xanh lá
        { r: 1.0, g: 0.8, b: 0.0 },   // Vàng
        { r: 0.0, g: 0.8, b: 1.0 },   // Xanh dương
        { r: 1.0, g: 0.4, b: 0.7 },   // Hồng
        { r: 0.8, g: 0.0, b: 1.0 },   // Tím
        { r: 1.0, g: 0.5, b: 0.0 },   // Cam
        { r: 1.0, g: 1.0, b: 1.0 },   // Trắng lấp lánh
    ]
};

// ============================================
// Initialization
// ============================================
function init() {
    clock = new THREE.Clock();

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 25);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Orbit Controls - Xoay 360 độ bằng chuột
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 10;
    controls.maxDistance = 50;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Generate shapes
    generateTreePositions();
    generateHeartPositions();

    // Create particles
    createParticles();

    // Add ambient stars
    createStars();

    // Event listeners
    setupEventListeners();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);

    // Start animation loop
    animate();
}

// ============================================
// Shape Generators
// ============================================

// Tạo vị trí các hạt cho cây thông
function generateTreePositions() {
    targetPositions.tree = [];

    const treeHeight = 15;
    const baseRadius = 6;
    const layers = 8;
    const particlesPerLayer = Math.floor(particleCount / (layers + 2));

    // Thân cây (trunk)
    for (let i = 0; i < particlesPerLayer * 0.3; i++) {
        const y = -treeHeight / 2 + Math.random() * 2;
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.3;
        targetPositions.tree.push({
            x: Math.cos(angle) * radius,
            y: y,
            z: Math.sin(angle) * radius
        });
    }

    // Tán cây (cone shape with layers)
    for (let layer = 0; layer < layers; layer++) {
        const layerY = -treeHeight / 2 + 2 + (layer / layers) * (treeHeight - 2);
        const layerRadius = baseRadius * (1 - layer / layers) * (0.8 + Math.random() * 0.4);
        const pointsInLayer = Math.floor(particlesPerLayer * (1 - layer / layers * 0.5));

        for (let i = 0; i < pointsInLayer; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * layerRadius;
            const yOffset = (Math.random() - 0.5) * 0.8;

            targetPositions.tree.push({
                x: Math.cos(angle) * r,
                y: layerY + yOffset,
                z: Math.sin(angle) * r
            });
        }
    }

    // Ngôi sao trên đỉnh
    const starY = treeHeight / 2 + 1;
    for (let i = 0; i < particlesPerLayer * 0.5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 1.5;
        const yOffset = Math.random() * 1 - 0.5;

        targetPositions.tree.push({
            x: Math.cos(angle) * r * 0.3,
            y: starY + yOffset,
            z: Math.sin(angle) * r * 0.3
        });
    }

    // Đèn trang trí xoắn ốc
    const spirals = 3;
    for (let s = 0; s < spirals; s++) {
        const spiralOffset = (s / spirals) * Math.PI * 2;
        for (let i = 0; i < particlesPerLayer * 0.3; i++) {
            const t = i / (particlesPerLayer * 0.3);
            const y = -treeHeight / 2 + 2 + t * (treeHeight - 4);
            const radius = baseRadius * (1 - t) * 0.9;
            const angle = spiralOffset + t * Math.PI * 6;

            targetPositions.tree.push({
                x: Math.cos(angle) * radius,
                y: y,
                z: Math.sin(angle) * radius
            });
        }
    }

    // Fill remaining particles
    while (targetPositions.tree.length < particleCount) {
        const y = -treeHeight / 2 + Math.random() * treeHeight;
        const maxR = baseRadius * (1 - (y + treeHeight / 2) / treeHeight);
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * maxR;

        targetPositions.tree.push({
            x: Math.cos(angle) * r,
            y: y,
            z: Math.sin(angle) * r
        });
    }
}

// Tạo vị trí các hạt cho chữ "I ❤ U"
function generateHeartPositions() {
    targetPositions.heart = [];

    const scale = 8;
    const letterSpacing = 4;

    // Chữ "I"
    const iParticles = Math.floor(particleCount * 0.15);
    for (let i = 0; i < iParticles; i++) {
        const x = -letterSpacing * 1.5 + (Math.random() - 0.5) * 1;
        const y = (Math.random() - 0.5) * scale;
        const z = (Math.random() - 0.5) * 1;
        targetPositions.heart.push({ x, y, z });
    }

    // Trái tim ❤
    const heartParticles = Math.floor(particleCount * 0.5);
    for (let i = 0; i < heartParticles; i++) {
        // Parametric heart shape
        const t = (i / heartParticles) * Math.PI * 2;
        const heartScale = 0.5 + Math.random() * 0.5;

        // Heart parametric equations
        let hx = 16 * Math.pow(Math.sin(t), 3);
        let hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

        // Add some randomness for 3D effect
        const randomOffset = Math.random() * 0.8;
        hx += (Math.random() - 0.5) * 3;
        hy += (Math.random() - 0.5) * 3;
        const hz = (Math.random() - 0.5) * 3;

        targetPositions.heart.push({
            x: hx * 0.15 * heartScale,
            y: hy * 0.15 * heartScale,
            z: hz * heartScale
        });
    }

    // Fill heart interior
    const interiorParticles = Math.floor(particleCount * 0.15);
    for (let i = 0; i < interiorParticles; i++) {
        const t = Math.random() * Math.PI * 2;
        const r = Math.random();

        let hx = 16 * Math.pow(Math.sin(t), 3) * r;
        let hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * r;

        targetPositions.heart.push({
            x: hx * 0.15,
            y: hy * 0.15,
            z: (Math.random() - 0.5) * 2
        });
    }

    // Chữ "U" - Hoàn chỉnh với 2 cạnh dọc và đáy cong
    const uParticles = Math.floor(particleCount * 0.2);
    const uWidth = 1.8;  // Chiều rộng chữ U
    const uHeight = scale * 0.8;  // Chiều cao chữ U
    const uCenterX = letterSpacing * 1.5;  // Vị trí tâm X

    for (let i = 0; i < uParticles; i++) {
        const t = Math.random();
        let x, y;

        if (t < 0.35) {
            // Cạnh trái - đầy đủ từ trên xuống dưới
            x = uCenterX - uWidth / 2;
            y = (Math.random() * uHeight) - uHeight * 0.3;
        } else if (t < 0.70) {
            // Cạnh phải - đầy đủ từ trên xuống dưới
            x = uCenterX + uWidth / 2;
            y = (Math.random() * uHeight) - uHeight * 0.3;
        } else {
            // Phần cong dưới (hình bán nguyệt)
            const angle = Math.PI + Math.random() * Math.PI;
            x = uCenterX + Math.cos(angle) * (uWidth / 2);
            y = -uHeight * 0.3 + Math.sin(angle) * (uWidth / 2) * 0.6;
        }

        targetPositions.heart.push({
            x: x + (Math.random() - 0.5) * 0.4,
            y: y + (Math.random() - 0.5) * 0.4,
            z: (Math.random() - 0.5) * 1
        });
    }

    // Fill remaining
    while (targetPositions.heart.length < particleCount) {
        const idx = Math.floor(Math.random() * targetPositions.heart.length);
        const base = targetPositions.heart[idx];
        targetPositions.heart.push({
            x: base.x + (Math.random() - 0.5) * 0.5,
            y: base.y + (Math.random() - 0.5) * 0.5,
            z: base.z + (Math.random() - 0.5) * 0.5
        });
    }
}

// ============================================
// Particle System
// ============================================

function createParticles() {
    // Remove existing particles
    if (particles) {
        scene.remove(particles);
        particleGeometry.dispose();
        particleMaterial.dispose();
    }

    particleGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const colorsArray = new Float32Array(particleCount * 3);
    const sizesArray = new Float32Array(particleCount);
    const randomFactors = new Float32Array(particleCount);

    currentPositions = [];

    for (let i = 0; i < particleCount; i++) {
        const target = targetPositions.tree[i] || { x: 0, y: 0, z: 0 };

        // Initial positions (start from center explosion)
        positions[i * 3] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

        currentPositions.push({
            x: positions[i * 3],
            y: positions[i * 3 + 1],
            z: positions[i * 3 + 2]
        });

        // Random color from palette
        const color = COLORS.christmas[Math.floor(Math.random() * COLORS.christmas.length)];
        colorsArray[i * 3] = color.r;
        colorsArray[i * 3 + 1] = color.g;
        colorsArray[i * 3 + 2] = color.b;

        // Random sizes
        sizesArray[i] = 0.1 + Math.random() * 0.3;

        // Random factor for twinkling
        randomFactors[i] = Math.random() * Math.PI * 2;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizesArray, 1));
    particleGeometry.setAttribute('randomFactor', new THREE.BufferAttribute(randomFactors, 1));

    // Custom shader material for glowing particles
    particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            twinkleSpeed: { value: twinkleSpeed }
        },
        vertexShader: `
            attribute float size;
            attribute float randomFactor;
            varying vec3 vColor;
            varying float vRandom;
            uniform float time;
            uniform float twinkleSpeed;
            
            void main() {
                vColor = color;
                vRandom = randomFactor;
                
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                
                // Twinkle effect
                float twinkle = sin(time * twinkleSpeed + randomFactor * 10.0) * 0.5 + 0.5;
                float dynamicSize = size * (0.7 + twinkle * 0.6);
                
                gl_PointSize = dynamicSize * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vRandom;
            uniform float time;
            
            void main() {
                // Create circular gradient for glow effect
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                if (dist > 0.5) discard;
                
                // Soft glow
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                alpha = pow(alpha, 1.5);
                
                // Color with glow
                vec3 glowColor = vColor * (1.2 + sin(time * 2.0 + vRandom * 5.0) * 0.3);
                
                gl_FragColor = vec4(glowColor, alpha);
            }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animate to tree shape
    animateToShape('tree');
}

// ============================================
// Background Stars
// ============================================

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const radius = 50 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = radius * Math.cos(phi);

        // Subtle star colors
        const brightness = 0.5 + Math.random() * 0.5;
        starColors[i * 3] = brightness;
        starColors[i * 3 + 1] = brightness;
        starColors[i * 3 + 2] = brightness + Math.random() * 0.2;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

// ============================================
// Animation & Transitions
// ============================================

function animateToShape(shape) {
    if (isTransitioning) return;

    currentShape = shape;
    isTransitioning = true;
    transitionProgress = 0;

    updateButtonStates();
}

function updateParticlePositions(delta) {
    if (!particles) return;

    const positions = particleGeometry.attributes.position.array;
    const targetShape = targetPositions[currentShape];

    // Transition speed
    const speed = isTransitioning ? 2.0 : 0.5;
    transitionProgress += delta * speed;

    if (transitionProgress >= 1) {
        transitionProgress = 1;
        isTransitioning = false;
    }

    // Easing function (ease out cubic)
    const ease = 1 - Math.pow(1 - Math.min(transitionProgress, 1), 3);

    for (let i = 0; i < particleCount; i++) {
        const target = targetShape[i] || { x: 0, y: 0, z: 0 };

        // Lerp to target
        currentPositions[i].x += (target.x - currentPositions[i].x) * ease * delta * 3;
        currentPositions[i].y += (target.y - currentPositions[i].y) * ease * delta * 3;
        currentPositions[i].z += (target.z - currentPositions[i].z) * ease * delta * 3;

        // Add subtle floating motion
        const time = clock.getElapsedTime();
        const floatX = Math.sin(time * 0.5 + i * 0.01) * 0.05;
        const floatY = Math.cos(time * 0.3 + i * 0.01) * 0.05;
        const floatZ = Math.sin(time * 0.4 + i * 0.02) * 0.05;

        positions[i * 3] = currentPositions[i].x + floatX;
        positions[i * 3 + 1] = currentPositions[i].y + floatY;
        positions[i * 3 + 2] = currentPositions[i].z + floatZ;
    }

    particleGeometry.attributes.position.needsUpdate = true;
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // Update shader uniforms
    if (particleMaterial) {
        particleMaterial.uniforms.time.value = elapsed;
        particleMaterial.uniforms.twinkleSpeed.value = twinkleSpeed;
    }

    // Update particle positions
    updateParticlePositions(delta);

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', onWindowResize);

    // Control buttons
    document.getElementById('btn-tree').addEventListener('click', () => {
        autoMode = false;
        clearInterval(autoTimer);
        animateToShape('tree');
    });

    document.getElementById('btn-heart').addEventListener('click', () => {
        autoMode = false;
        clearInterval(autoTimer);
        animateToShape('heart');
    });

    document.getElementById('btn-auto').addEventListener('click', toggleAutoMode);

    // Settings
    document.getElementById('particle-count').addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('particle-count-value').textContent = value;
    });

    document.getElementById('particle-count').addEventListener('change', (e) => {
        particleCount = parseInt(e.target.value);
        regenerateParticles();
    });

    document.getElementById('twinkle-speed').addEventListener('input', (e) => {
        twinkleSpeed = parseInt(e.target.value);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function toggleAutoMode() {
    autoMode = !autoMode;

    if (autoMode) {
        document.getElementById('btn-auto').classList.add('active');
        autoTimer = setInterval(() => {
            if (currentShape === 'tree') {
                animateToShape('heart');
            } else {
                animateToShape('tree');
            }
        }, 5000);
    } else {
        document.getElementById('btn-auto').classList.remove('active');
        clearInterval(autoTimer);
    }
}

function updateButtonStates() {
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (currentShape === 'tree') {
        document.getElementById('btn-tree').classList.add('active');
    } else if (currentShape === 'heart') {
        document.getElementById('btn-heart').classList.add('active');
    }

    if (autoMode) {
        document.getElementById('btn-auto').classList.add('active');
    }
}

function regenerateParticles() {
    generateTreePositions();
    generateHeartPositions();
    createParticles();
}

// ============================================
// Start Application
// ============================================
window.addEventListener('DOMContentLoaded', init);

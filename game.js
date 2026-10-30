// ── 1. GLOBAL ENGINE INITIALIZATION ─────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1423); // OG Twilight Blue Sky
scene.fog = new THREE.FogExp2(0x0f1423, 0.012);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting Matrix
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffaa66, 0.9); // OG Sunset Tint
sunLight.position.set(40, 60, 20);
scene.add(sunLight);

// ── 2. OG ENVIRONMENT & TERRAIN CONFIGURATION ────────────────
// Floor Map Matrix
const floorGeo = new THREE.PlaneGeometry(400, 400, 40, 40);
floorGeo.rotateX(-Math.PI / 2);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e351f, roughness: 0.8 }); // Loot Lake / Dusty Grass Green
const floor = new THREE.Mesh(floorGeo, floorMat);
scene.add(floor);

// Simple Loot Box Spawners (OG Chest Proxies)
const chestGeo = new THREE.BoxGeometry(2, 1.5, 1.5);
const chestMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.5 });
for(let i=0; i<15; i++) {
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set((Math.random()-0.5)*150, 0.75, (Math.random()-0.5)*150);
    scene.add(chest);
}

// ── 3. OPERATOR CONTROLS & PHYSICAL STATE ───────────────────
const player = {
    height: 2.0,
    speed: 0.18,
    velocity: new THREE.Vector3(),
    keys: { w: false, a: false, s: false, d: false, space: false },
    canJump: true,
    mats: 100,
    health: 100
};

camera.position.set(0, player.height, 0);

// Pointer Lock Mouse Control Integration
const blocker = document.getElementById('blocker');
document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
        blocker.style.display = 'none';
    } else {
        blocker.style.display = 'flex';
    }
});

// Camera Mouse Rotation Processing
let yaw = 0, pitch = 0;
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== document.body) return;
    yaw -= e.movementX * 0.0022;
    pitch -= e.movementY * 0.0022;
    pitch = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, pitch));
    
    camera.rotation.set(0, 0, 0);
    camera.rotateY(yaw);
    camera.rotateX(pitch);
});

// Track Input Framework Bindings
document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') player.keys.w = true;
    if (k === 'a') player.keys.a = true;
    if (k === 's') player.keys.s = true;
    if (k === 'd') player.keys.d = true;
    if (e.key === ' ') player.keys.space = true;
});
document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') player.keys.w = false;
    if (k === 'a') player.keys.a = false;
    if (k === 's') player.keys.s = false;
    if (k === 'd') player.keys.d = false;
    if (e.key === ' ') player.keys.space = false;
});

// ── 4. FORTNITE OG BUILDING & WEAPONS SYSTEM ─────────────────
const buildStructures = [];
const wallGeo = new THREE.BoxGeometry(4, 4, 0.4);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 }); // OG Wood Texture Color

// Tactical Event Click Handler
document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body) return;

    // 1. LEFT CLICK: Build Snap Wall Structure
    if (e.button === 0) {
        if (player.mats < 10) return; // Verify building materials availability
        
        const wall = new THREE.Mesh(wallGeo, wallMat);
        const lookDir = new THREE.Vector3();
        camera.getWorldDirection(lookDir);
        
        // Calculate Grid Position Snapping Vectors
        wall.position.x = Math.round((camera.position.x + lookDir.x * 6) / 4) * 4;
        wall.position.z = Math.round((camera.position.z + lookDir.z * 6) / 4) * 4;
        wall.position.y = 2.0; // Dynamic height allocation baseline
        
        // Orient wall to align face parallel to coordinates grid
        if (Math.abs(lookDir.x) > Math.abs(lookDir.z)) {
            wall.rotation.y = Math.PI / 2;
        }
        
        scene.add(wall);
        buildStructures.push(wall);
        
        player.mats -= 10;
        document.getElementById('mats-val').innerText = player.mats;
    }
    
    // 2. RIGHT CLICK: Fire OG Assault Rifle (Hitscan Bullet Tracers)
    if (e.button === 2) {
        const tracerGeo = new THREE.BoxGeometry(0.05, 0.05, 4);
        const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const tracer = new THREE.Mesh(tracerGeo, tracerMat);
        
        const forwardVector = new THREE.Vector3();
        camera.getWorldDirection(forwardVector);
        
        tracer.position.copy(camera.position).addScaledVector(forwardVector, 2);
        tracer.lookAt(camera.position.clone().addScaledVector(forwardVector, 10));
        scene.add(tracer);
        
        // Automated cleanup cycle for tracer effects to preserve computational memory
        setTimeout(() => {
            scene.remove(tracer);
        }, 60);
    }
});

// Deactivate alternative context menu windows during right-click target acquisition
document.addEventListener('contextmenu', e => e.preventDefault());

// ── 5. PHYSICAL TRANSFORMATION MATRIX & EXECUTION ENGINE LOOP ────
function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement === document.body) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0; forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0; right.normalize();

        let targetX = 0, targetZ = 0;
        if (player.keys.w) { targetX += forward.x; targetZ += forward.z; }
        if (player.keys.s) { targetX -= forward.x; targetZ -= forward.z; }
        if (player.keys.a) { targetX -= right.x; targetZ -= right.z; }
        if (player.keys.d) { targetX += right.x; targetZ += right.z; }

        camera.position.x += targetX * player.speed;
        camera.position.z += targetZ * player.speed;

        // Apply Vertical Jump Forces & Gravitational Matrix Velocity
        if (player.keys.space && player.canJump) {
            player.velocity.y = 0.24;
            player.canJump = false;
        }

        player.velocity.y -= 0.011; // Gravity coefficient factor
        camera.position.y += player.velocity.y;

        if (camera.position.y <= player.height) {
            camera.position.y = player.height;
            player.velocity.y = 0;
            player.canJump = true;
        }
    }

    renderer.render(scene, camera);
}

// Coordinate window boundary dimension adjustments smoothly on resize events
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

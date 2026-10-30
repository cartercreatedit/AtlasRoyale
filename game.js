// ── 1. LIFECYCLE STATE MANAGER ─────────────────────────────
let gameState = "LOADING"; 

// Run a mock loading bar sequence
let progress = 0;
const progressInterval = setInterval(() => {
    progress += 2.5;
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = progress + '%';
    
    if (progress >= 100) {
        clearInterval(progressInterval);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                const lobbyMenu = document.getElementById('lobby-menu');
                if (lobbyMenu) lobbyMenu.style.display = 'block';
                gameState = "LOBBY";
            }, 500);
        }
    }
}, 50);

// Connect click event to the main Play Button
const playBtn = document.getElementById('play-button');
if (playBtn) {
    playBtn.addEventListener('click', () => {
        document.body.requestPointerLock();
    });
}

// Capture pointer lock status modifications cleanly to stop click-freeze bugs
document.addEventListener('pointerlockchange', () => {
    const lobbyMenu = document.getElementById('lobby-menu');
    const gameHud = document.getElementById('game-hud');
    
    if (document.pointerLockElement === document.body) {
        if (lobbyMenu) lobbyMenu.style.display = 'none';
        if (gameHud) gameHud.style.display = 'block';
        if (gameState === "LOBBY") {
            gameState = "PLAYING";
            // Set position way up high to simulate jumping from the Battle Bus!
            camera.position.set(0, 90, 0); 
            player.velocity.y = -0.15; // Set downward skydiving velocity
        }
    } else {
        if (gameState === "PLAYING") {
            if (lobbyMenu) lobbyMenu.style.display = 'block';
            if (gameHud) gameHud.style.display = 'none';
            gameState = "LOBBY";
        }
    }
});

// ── 2. CORE 3D THREE.JS WORLD STORAGE ENGINE ────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a75a0); // Classic OG Skyline Blue
scene.fog = new THREE.FogExp2(0x4a75a0, 0.01);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting Matrix
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 0.7);
sun.position.set(30, 80, 40);
scene.add(sun);

// Map Grass Environment Floor layout
const floorGeo = new THREE.PlaneGeometry(500, 500, 50, 50);
floorGeo.rotateX(-Math.PI / 2);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x345924, roughness: 0.9 });
const floor = new THREE.Mesh(floorGeo, floorMat);
scene.add(floor);

// Generate procedural 3D Green Cylinder Trees across the map
const treeGeo = new THREE.CylinderGeometry(0.2, 0.8, 4, 5);
const treeLeavesGeo = new THREE.SphereGeometry(1.8, 6, 6);
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28 });
const leavesMat = new THREE.MeshStandardMaterial({ color: 0x224411 });

for (let i = 0; i < 60; i++) {
    const x = (Math.random() - 0.5) * 300;
    const z = (Math.random() - 0.5) * 300;
    
    const trunk = new THREE.Mesh(treeGeo, trunkMat);
    trunk.position.set(x, 2, z);
    
    const leaves = new THREE.Mesh(treeLeavesGeo, leavesMat);
    leaves.position.set(x, 4.5, z);
    
    scene.add(trunk);
    scene.add(leaves);
}

// ── 3. OPERATOR CONTROLS SYSTEM BINDINGS ────────────────────
const player = {
    height: 2.0,
    speed: 0.2,
    velocity: new THREE.Vector3(),
    keys: { w: false, a: false, s: false, d: false, space: false },
    canJump: true,
    mats: 100
};

// FIXED: Capture Keyboard inputs safely using native valid toLowerCase() loops
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

// Capture Mouse Rotation
let yaw = 0, pitch = 0;
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== document.body) return;
    yaw -= e.movementX * 0.0022;
    pitch -= e.movementY * 0.0022;
    pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, pitch));
    
    camera.rotation.set(0, 0, 0);
    camera.rotateY(yaw);
    camera.rotateX(pitch);
});

// ── 4. FORTNITE SNAP BUILDING MECHANICS ──────────────────────
const structures = [];
const wallGeo = new THREE.BoxGeometry(4, 4, 0.3);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x92613c, roughness: 1.0 });

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body || gameState !== "PLAYING") return;

    // LEFT CLICK: Place Wood Grid Snap Wall Panel
    if (e.button === 0) {
        if (player.mats < 10) return;
        
        const wall = new THREE.Mesh(wallGeo, wallMat);
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        
        // Grid Lock Snapping
        wall.position.x = Math.round((camera.position.x + dir.x * 6) / 4) * 4;
        wall.position.z = Math.round((camera.position.z + dir.z * 6) / 4) * 4;
        wall.position.y = Math.round((camera.position.y + dir.y * 4) / 4) * 4;
        if (wall.position.y < 2.0) wall.position.y = 2.0; // Floor safety stop
        
        if (Math.abs(dir.x) > Math.abs(dir.z)) wall.rotation.y = Math.PI / 2;
        
        scene.add(wall);
        structures.push(wall);
        
        player.mats -= 10;
        const matsVal = document.getElementById('mats-val');
        if (matsVal) matsVal.innerText = player.mats;
    }
    
    // RIGHT CLICK: Fire Bullet Tracers
    if (e.button === 2) {
        const tracerGeo = new THREE.BoxGeometry(0.04, 0.04, 3);
        const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const tracer = new THREE.Mesh(tracerGeo, tracerMat);
        
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        
        tracer.position.copy(camera.position).addScaledVector(dir, 1.5);
        tracer.lookAt(camera.position.clone().addScaledVector(dir, 12));
        scene.add(tracer);
        
        setTimeout(() => scene.remove(tracer), 50);
    }
});

document.addEventListener('contextmenu', e => e.preventDefault());

// ── 5. RUNTIME PHYSICS ENVIRONMENT EXECUTOR LOOP ──────────────────
function animate() {
    requestAnimationFrame(animate);

    if (gameState === "PLAYING" && document.pointerLockElement === document.body) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0; forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0; right.normalize();

        let moveX = 0, moveZ = 0;
        if (player.keys.w) { moveX += forward.x; moveZ += forward.z; }
        if (player.keys.s) { moveX -= forward.x; moveZ -= forward.z; }
        if (player.keys.a) { moveX -= right.x; moveZ -= right.z; }
        if (player.keys.d) { moveX += right.x; moveZ += right.z; }

        camera.position.x += moveX * player.speed;
        camera.position.z += moveZ * player.speed;

        // Apply Vertical Jump Matrices & Skydive Gravity drops
        if (camera.position.y > player.height) {
            let gravity = (camera.position.y > 15) ? 0.05 : 0.012; 
            player.velocity.y -= gravity;
        } else if (player.keys.space && player.canJump) {
            player.velocity.y = 0.24;
            player.canJump = false;
        }

        camera.position.y += player.velocity.y;

        // Ground collision matrix check
        if (camera.position.y <= player.height) {
            camera.position.y = player.height;
            player.velocity.y = 0;
            player.canJump = true;
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

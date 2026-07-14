import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";
import { Player } from "./player.js";
import { generateLevels } from "./levels.js";

const app = document.getElementById("app");
const levelEl = document.getElementById("level-text");
const statusEl = document.getElementById("status");
const touchControls = document.getElementById("touch-controls");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8dd7ff);
scene.fog = new THREE.Fog(0x8dd7ff, 36, 130);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 350);
camera.position.set(0, 9, 16);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const hemisphere = new THREE.HemisphereLight(0xd8f6ff, 0x2d5738, 1.06);
const sun = new THREE.DirectionalLight(0xffffff, 1.08);
sun.position.set(18, 36, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(hemisphere, sun);

const player = new Player(scene);
const levels = generateLevels();

let currentLevelIndex = 0;
let currentLevel = null;
let platformMeshes = [];

const inputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
};

let statusTimer = 0;
let lastTick = performance.now();
let isTransitioning = false;

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  setInput(e.key, true);
});

window.addEventListener("keyup", (e) => {
  setInput(e.key, false);
});

touchControls.querySelectorAll(".touch-btn").forEach((button) => {
  const key = button.dataset.key;
  const down = (evt) => {
    evt.preventDefault();
    setInput(key, true);
  };
  const up = (evt) => {
    evt.preventDefault();
    setInput(key, false);
  };
  button.addEventListener("touchstart", down, { passive: false });
  button.addEventListener("touchend", up, { passive: false });
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointerleave", up);
});

window.addEventListener("resize", onResize);
onResize();

function setInput(key, active) {
  const normalized = key.toLowerCase();
  if (normalized === "w" || key === "ArrowDown") inputState.backward = active;
  else if (normalized === "s" || key === "ArrowUp") inputState.forward = active;
  else if (normalized === "a" || key === "ArrowLeft") inputState.left = active;
  else if (normalized === "d" || key === "ArrowRight") inputState.right = active;
  else if (key === "Shift" || normalized === "shift") inputState.sprint = active;
  else if (key === " " || key === "Spacebar" || key === "Space") inputState.jump = active;
}

function clearLevel() {
  for (const mesh of platformMeshes) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  platformMeshes = [];
}

function loadLevel(index) {
  clearLevel();
  if (index >= levels.length) {
    setStatus("You beat the game! Refresh to play again.", 9999);
    isTransitioning = true;
    return;
  }
  
  currentLevel = levels[index];
  levelEl.textContent = `Level ${currentLevel.id} / ${levels.length}`;
  
  for (const p of currentLevel.platforms) {
    const geo = new THREE.BoxGeometry(p.size.x, p.size.y, p.size.z);
    
    let materialProps = { color: p.color, roughness: 0.8 };
    if (p.isGoal) {
      materialProps = { color: p.color, emissive: p.color, emissiveIntensity: 0.5 };
    }
    
    const mat = new THREE.MeshStandardMaterial(materialProps);
    const mesh = new THREE.Mesh(geo, mat);
    
    mesh.position.copy(p.position);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    
    scene.add(mesh);
    platformMeshes.push(mesh);
  }

  player.reset(currentLevel.startPosition);
  isTransitioning = false;
  setStatus(`Level ${currentLevel.id}`, 2);
}

function loop(now) {
  const delta = Math.min((now - lastTick) / 1000, 0.033);
  lastTick = now;

  if (!isTransitioning && currentLevel) {
    // Camera is fixed relative to world forward/right or we just use global Z for forward
    const camForward = new THREE.Vector3(0, 0, -1);
    const camRight = new THREE.Vector3(1, 0, 0);

    player.setInput(inputState);
    const hitGoal = player.update(delta, camForward, camRight, currentLevel.platforms);

    if (hitGoal) {
      isTransitioning = true;
      setStatus("Level Complete!", 2);
      setTimeout(() => {
        currentLevelIndex++;
        loadLevel(currentLevelIndex);
      }, 1500);
    } else if (player.position.y < currentLevel.fallLimit) {
      setStatus("You fell! Restarting level...", 1.5);
      player.reset(currentLevel.startPosition);
    }

    updateThirdPersonCamera(delta);
  }

  if (statusTimer > 0 && statusTimer < 9998) {
    statusTimer = Math.max(0, statusTimer - delta);
    if (statusTimer === 0) statusEl.textContent = "";
  }

  // Animate goal platform slightly
  if (currentLevel) {
    const goalPlatform = currentLevel.platforms.find(p => p.isGoal);
    if (goalPlatform) {
      const goalIndex = currentLevel.platforms.indexOf(goalPlatform);
      const goalMesh = platformMeshes[goalIndex];
      if (goalMesh) {
        goalMesh.position.y = goalPlatform.position.y + Math.sin(now / 300) * 0.2;
      }
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function setStatus(message, duration = 1.8) {
  statusEl.textContent = message;
  statusTimer = duration;
}

function updateThirdPersonCamera(delta) {
  const idealPos = player.position.clone().add(new THREE.Vector3(0, 5, 9));
  camera.position.lerp(idealPos, delta * 8);
  const lookTarget = player.position.clone().add(new THREE.Vector3(0, 1.5, 0));
  camera.lookAt(lookTarget);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start game
loadLevel(0);
requestAnimationFrame(loop);

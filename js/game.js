import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";
import { Player } from "./player.js";
import { Ball } from "./ball.js";
import { AIPlayer } from "./ai.js";

const app = document.getElementById("app");
const meterFill = document.getElementById("kick-meter-fill");
const timerEl = document.getElementById("timer");
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

buildPitch(scene);
const player = new Player(scene);
const ball = new Ball(scene);
const ai = new AIPlayer(scene);

const inputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
};

let powerCharging = false;
let chargeTime = 0;
let matchTime = 180;
let lastTick = performance.now();

let cameraYaw = 0;
let cameraPitch = 0.35;
let playerScore = 0;
let aiScore = 0;
let isResetting = false;

app.addEventListener("click", () => {
  if (document.pointerLockElement !== app) {
    app.requestPointerLock();
  }
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === app) {
    cameraYaw -= e.movementX * 0.0025;
    cameraPitch += e.movementY * 0.0025;
    cameraPitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraPitch));
  }
});

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  setInput(e.key, true);
  if (e.key.toLowerCase() === "k") startCharge();
});

window.addEventListener("keyup", (e) => {
  setInput(e.key, false);
  if (e.key.toLowerCase() === "k") releaseKick();
});

window.addEventListener("mousedown", (e) => {
  if (e.button === 0) startCharge();
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0) releaseKick();
});

touchControls.querySelectorAll(".touch-btn").forEach((button) => {
  const key = button.dataset.key;
  const down = (evt) => {
    evt.preventDefault();
    if (key === "Kick") startCharge();
    else setInput(key, true);
  };
  const up = (evt) => {
    evt.preventDefault();
    if (key === "Kick") releaseKick();
    else setInput(key, false);
  };
  button.addEventListener("touchstart", down, { passive: false });
  button.addEventListener("touchend", up, { passive: false });
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointerleave", up);
});

window.addEventListener("resize", onResize);
onResize();
requestAnimationFrame(loop);

function startCharge() {
  powerCharging = true;
}

function releaseKick() {
  if (!powerCharging) return;
  const kickPower = Math.min(chargeTime / 1.2, 1);
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
  const toBall = ball.position.clone().sub(player.position);
  if (toBall.lengthSq() < 7.5) {
    const kickDir = forward.add(new THREE.Vector3(0, 0.22, 0)).normalize();
    ball.kick(kickDir, THREE.MathUtils.lerp(6, 21, kickPower));
  }
  powerCharging = false;
  chargeTime = 0;
  meterFill.style.width = "0%";
}

function setInput(key, active) {
  const normalized = key.toLowerCase();
  if (normalized === "w" || key === "ArrowUp") inputState.forward = active;
  else if (normalized === "s" || key === "ArrowDown") inputState.backward = active;
  else if (normalized === "a" || key === "ArrowLeft") inputState.left = active;
  else if (normalized === "d" || key === "ArrowRight") inputState.right = active;
  else if (key === "Shift" || normalized === "shift") inputState.sprint = active;
}

function loop(now) {
  const delta = Math.min((now - lastTick) / 1000, 0.033);
  lastTick = now;

  const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
  const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion).setY(0).normalize();

  player.setInput(inputState);
  player.update(delta, camForward, camRight);
  ai.update(delta, ball);
  ball.update(delta);
  
  if (!isResetting) {
    if (Math.abs(ball.position.x) < 4.5 && Math.abs(ball.position.z) > 28) {
      isResetting = true;
      if (ball.position.z > 28) {
        aiScore++;
        document.getElementById("ai-score").textContent = aiScore;
      } else {
        playerScore++;
        document.getElementById("player-score").textContent = playerScore;
      }
      setTimeout(resetMatch, 2000);
    }
  }

  updateThirdPersonCamera(delta);
  updateHud(delta);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateHud(delta) {
  if (matchTime > 0) {
    matchTime = Math.max(0, matchTime - delta);
    const mins = String(Math.floor(matchTime / 60)).padStart(2, "0");
    const secs = String(Math.floor(matchTime % 60)).padStart(2, "0");
    timerEl.textContent = `${mins}:${secs}`;
  }
  if (powerCharging) {
    chargeTime = Math.min(chargeTime + delta, 1.2);
    meterFill.style.width = `${(chargeTime / 1.2) * 100}%`;
  }
}

function resetMatch() {
  player.position.set(0, player.radius, 8);
  player.velocity.set(0, 0, 0);
  player.mesh.rotation.y = 0;
  
  ai.position.set(0, 0.7, -10);
  ai.mesh.rotation.y = 0;

  ball.position.set(0, ball.radius, 0);
  ball.velocity.set(0, 0, 0);
  ball.mesh.rotation.set(0, 0, 0);

  isResetting = false;
}

function updateThirdPersonCamera(delta) {
  const target = player.position.clone();
  const radius = 9;
  const hOffset = Math.cos(cameraPitch) * radius;
  const vOffset = Math.sin(cameraPitch) * radius;
  const shoulderOffset = new THREE.Vector3(
    Math.sin(cameraYaw) * hOffset,
    vOffset,
    Math.cos(cameraYaw) * hOffset
  );
  
  const idealPos = target.clone().add(shoulderOffset);
  camera.position.lerp(idealPos, delta * 15);
  camera.lookAt(target.x, target.y + 1, target.z);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildPitch(targetScene) {
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 60),
    new THREE.MeshStandardMaterial({ color: 0x2ab866, roughness: 0.88 })
  );
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  targetScene.add(field);

  const lineMat = new THREE.LineBasicMaterial({ color: 0xf5fbff });
  const linePoints = [
    new THREE.Vector3(-18, 0.03, -28),
    new THREE.Vector3(18, 0.03, -28),
    new THREE.Vector3(18, 0.03, 28),
    new THREE.Vector3(-18, 0.03, 28),
    new THREE.Vector3(-18, 0.03, -28),
  ];
  const border = new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePoints), lineMat);
  targetScene.add(border);

  const wallMat = new THREE.MeshStandardMaterial({ 
    color: 0x88ccff, 
    transparent: true, 
    opacity: 0.2, 
    roughness: 0.1, 
    metalness: 0.1,
    side: THREE.DoubleSide
  });
  const wallHeight = 12;
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, 60), wallMat);
  leftWall.position.set(-20, wallHeight/2, 0);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, wallHeight, 60), wallMat);
  rightWall.position.set(20, wallHeight/2, 0);
  const topWall = new THREE.Mesh(new THREE.BoxGeometry(40, wallHeight, 1), wallMat);
  topWall.position.set(0, wallHeight/2, -30);
  const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(40, wallHeight, 1), wallMat);
  bottomWall.position.set(0, wallHeight/2, 30);
  targetScene.add(leftWall, rightWall, topWall, bottomWall);

  const goalMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3 });
  const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.5 });
  for (const z of [-28, 28]) {
    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3), goalMat);
    leftPost.position.set(-4.5, 1.5, z);
    const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3), goalMat);
    rightPost.position.set(4.5, 1.5, z);
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 9.24), goalMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 3, z);
    const netDepth = z > 0 ? 1.5 : -1.5;
    const netBack = new THREE.Mesh(new THREE.PlaneGeometry(9, 3), netMat);
    netBack.position.set(0, 1.5, z + netDepth);
    const netTop = new THREE.Mesh(new THREE.PlaneGeometry(9, Math.abs(netDepth)), netMat);
    netTop.rotation.x = Math.PI / 2;
    netTop.position.set(0, 3, z + netDepth/2);
    targetScene.add(leftPost, rightPost, crossbar, netBack, netTop);
  }

  const centerCircle = new THREE.LineLoop(
    new THREE.CircleGeometry(5, 28).deleteAttribute("normal").deleteAttribute("uv"),
    lineMat
  );
  centerCircle.rotation.x = -Math.PI / 2;
  centerCircle.position.y = 0.03;
  targetScene.add(centerCircle);

  const standMat = new THREE.MeshStandardMaterial({ color: 0x364563, roughness: 0.8 });
  const crowdColors = [0xffd16e, 0xf96f6f, 0x73efff, 0xffffff];
  for (const z of [-34, 34]) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(44, 2.4, 8), standMat);
    stand.position.set(0, 1.2, z);
    stand.receiveShadow = true;
    stand.castShadow = true;
    targetScene.add(stand);
    for (let i = 0; i < 150; i++) {
      const fan = new THREE.Mesh(
        new THREE.SphereGeometry(0.19, 8, 8),
        new THREE.MeshStandardMaterial({ color: crowdColors[Math.floor(Math.random() * crowdColors.length)] })
      );
      fan.position.set((Math.random() - 0.5) * 40, 2.5 + Math.random() * 2.4, z + (Math.random() - 0.5) * 6);
      targetScene.add(fan);
    }
  }
}

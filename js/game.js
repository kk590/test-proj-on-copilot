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
  const forward = player.getFacingDirection();
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

function updateThirdPersonCamera(delta) {
  const target = player.position.clone();
  const shoulderOffset = new THREE.Vector3(0, 4.4, 8.8).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.mesh.rotation.y);
  const idealPos = target.clone().add(shoulderOffset);
  camera.position.lerp(idealPos, delta * 5);
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

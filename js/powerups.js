import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

const POWER_TYPES = [
  { id: "speed", color: 0x66fff3, label: "Speed Boost" },
  { id: "kick", color: 0xffd247, label: "Power Kick" },
];

export class PowerUpManager {
  constructor(scene, fieldBounds, onCollect) {
    this.scene = scene;
    this.fieldBounds = fieldBounds;
    this.onCollect = onCollect;
    this.active = null;
    this.spawnTimer = THREE.MathUtils.randFloat(6, 10);
  }

  update(delta, actors) {
    if (!this.active) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) this.spawn();
      return;
    }

    this.active.life -= delta;
    this.active.mesh.rotation.y += delta * 2.5;
    this.active.mesh.position.y = 0.7 + Math.sin(this.active.life * 4) * 0.12;

    if (this.active.life <= 0) {
      this.clearActive();
      return;
    }

    for (const actor of actors) {
      const reach = actor.radius + this.active.radius;
      if (actor.position.distanceToSquared(this.active.mesh.position) <= reach * reach) {
        this.apply(actor, this.active.type);
        this.onCollect?.(actor.name === "player" ? `YOU picked ${this.active.type.label}!` : `AI picked ${this.active.type.label}!`);
        this.clearActive();
        break;
      }
    }
  }

  spawn() {
    const type = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
    const radius = 0.28;
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 0),
      new THREE.MeshStandardMaterial({
        color: type.color,
        emissive: type.color,
        emissiveIntensity: 0.35,
        roughness: 0.28,
      })
    );

    mesh.position.set(
      THREE.MathUtils.randFloatSpread((this.fieldBounds.halfWidth - 2) * 2),
      0.7,
      THREE.MathUtils.randFloatSpread((this.fieldBounds.halfLength - 4) * 2)
    );

    mesh.castShadow = true;
    this.scene.add(mesh);
    this.active = { mesh, radius, life: 11, type };
  }

  apply(actor, type) {
    if (type.id === "speed") actor.applySpeedBoost(6.5, 1.35);
    if (type.id === "kick") actor.applyKickBoost(7, 1.45);
  }

  clearActive() {
    if (this.active) this.scene.remove(this.active.mesh);
    this.active = null;
    this.spawnTimer = THREE.MathUtils.randFloat(7, 12);
  }
}

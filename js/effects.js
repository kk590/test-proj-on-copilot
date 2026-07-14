import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class GoalCelebration {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  burst(position, color) {
    for (let i = 0; i < 70; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 7, 7),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
      );
      mesh.position.copy(position).add(new THREE.Vector3(THREE.MathUtils.randFloatSpread(1.2), 0.9, THREE.MathUtils.randFloatSpread(1.2)));
      const velocity = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(8),
        THREE.MathUtils.randFloat(4, 9),
        THREE.MathUtils.randFloatSpread(8)
      );
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity, life: THREE.MathUtils.randFloat(0.9, 1.6) });
    }
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 14 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
    }
  }
}

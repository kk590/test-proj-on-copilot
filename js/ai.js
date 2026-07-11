import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class AIPlayer {
  constructor(scene) {
    this.position = new THREE.Vector3(0, 0.7, -10);
    this.speed = 6.5;

    this.mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.7, 0.55, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xff6363, roughness: 0.45 })
    );
    this.mesh.castShadow = true;
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  update(delta, ball) {
    const target = ball.position.clone();
    target.z -= 2.8;
    target.y = this.position.y;
    const toTarget = target.sub(this.position);
    const move = toTarget.setY(0);
    if (move.lengthSq() > 0.01) {
      move.normalize();
      this.position.addScaledVector(move, this.speed * delta);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, Math.atan2(move.x, move.z), delta * 6);
    }
    this.position.x = THREE.MathUtils.clamp(this.position.x, -17, 17);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -27, 2);
    this.mesh.position.copy(this.position);
  }
}

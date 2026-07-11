import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class Ball {
  constructor(scene) {
    this.radius = 0.45;
    this.position = new THREE.Vector3(0, this.radius, 0);
    this.velocity = new THREE.Vector3();
    this.gravity = 20;
    this.bounce = 0.55;
    this.friction = 0.97;

    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.08 })
    );
    this.mesh.castShadow = true;
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  kick(direction, force) {
    this.velocity.addScaledVector(direction.normalize(), force);
  }

  update(delta) {
    this.velocity.y -= this.gravity * delta;
    this.position.addScaledVector(this.velocity, delta);

    if (this.position.y <= this.radius) {
      this.position.y = this.radius;
      this.velocity.y = Math.abs(this.velocity.y) * this.bounce;
      this.velocity.x *= this.friction;
      this.velocity.z *= this.friction;
      if (Math.abs(this.velocity.y) < 0.45) this.velocity.y = 0;
    }

    const limitX = 19.8;
    const limitZ = 29.5;
    if (Math.abs(this.position.x) > limitX) {
      this.position.x = Math.sign(this.position.x) * limitX;
      this.velocity.x *= -0.65;
    }
    if (Math.abs(this.position.z) > limitZ) {
      this.position.z = Math.sign(this.position.z) * limitZ;
      this.velocity.z *= -0.65;
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.x += this.velocity.z * delta * 1.4;
    this.mesh.rotation.z -= this.velocity.x * delta * 1.4;
  }
}

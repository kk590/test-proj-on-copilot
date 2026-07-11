import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class Player {
  constructor(scene) {
    this.radius = 0.7;
    this.height = 1.8;
    this.baseSpeed = 8;
    this.sprintMultiplier = 1.55;
    this.position = new THREE.Vector3(0, this.radius, 8);
    this.velocity = new THREE.Vector3();
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };

    const mat = new THREE.MeshStandardMaterial({ color: 0x25d8ff, roughness: 0.55 });
    this.mesh = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(this.radius, this.height - this.radius * 2), mat);
    body.castShadow = true;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffdcb2, roughness: 0.7 })
    );
    head.position.set(0, 1.15, 0);
    head.castShadow = true;
    this.mesh.add(body, head);
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  setInput(inputState) {
    this.input = inputState;
  }

  getFacingDirection() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.mesh.quaternion);
    return forward.normalize();
  }

  update(delta, cameraForward, cameraRight) {
    const inputX = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const inputZ = (this.input.backward ? 1 : 0) - (this.input.forward ? 1 : 0);
    const move = new THREE.Vector3();
    if (inputX !== 0 || inputZ !== 0) {
      move.copy(cameraRight).multiplyScalar(inputX).addScaledVector(cameraForward, inputZ).setY(0).normalize();
    }

    const speed = this.baseSpeed * (this.input.sprint ? this.sprintMultiplier : 1);
    this.velocity.copy(move).multiplyScalar(speed);
    this.position.addScaledVector(this.velocity, delta);

    this.position.x = THREE.MathUtils.clamp(this.position.x, -18, 18);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -28, 28);

    if (move.lengthSq() > 0.0001) {
      const targetYaw = Math.atan2(move.x, move.z);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetYaw, delta * 11);
    }
    this.mesh.position.copy(this.position);
  }
}

import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class Player {
  constructor(scene) {
    this.radius = 0.7;
    this.height = 1.8;
    this.baseSpeed = 8;
    this.sprintMultiplier = 1.55;
    this.position = new THREE.Vector3(0, 0, 8);
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
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3), mat);
    body.position.set(0, 0.6, 0);
    body.castShadow = true;
    
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.5), mat);
    top.position.set(0, 1.2, -0.2);
    top.castShadow = true;

    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    
    const wheel1 = new THREE.Mesh(wheelGeo, wheelMat);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(0.9, 0.4, 1);
    wheel1.castShadow = true;
    
    const wheel2 = wheel1.clone();
    wheel2.position.set(-0.9, 0.4, 1);
    
    const wheel3 = wheel1.clone();
    wheel3.position.set(0.9, 0.4, -1);
    
    const wheel4 = wheel1.clone();
    wheel4.position.set(-0.9, 0.4, -1);
    
    this.mesh.add(body, top, wheel1, wheel2, wheel3, wheel4);
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

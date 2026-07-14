import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class AIPlayer {
  constructor(scene) {
    this.position = new THREE.Vector3(0, 0, -10);
    this.speed = 6.5;
    this.kickCooldown = 0;

    const mat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.55 });
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

  update(delta, ball) {
    if (this.kickCooldown > 0) this.kickCooldown -= delta;

    const target = ball.position.clone();
    const distToBall = this.position.distanceTo(ball.position);
    
    if (distToBall > 4) {
      target.z -= 2.8; 
    }
    target.y = this.position.y;
    
    const toTarget = target.sub(this.position);
    const move = toTarget.setY(0);
    if (move.lengthSq() > 0.01) {
      move.normalize();
      this.position.addScaledVector(move, this.speed * delta);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, Math.atan2(move.x, move.z), delta * 6);
    }
    
    if (distToBall < 3.5 && this.kickCooldown <= 0) {
      const aim = new THREE.Vector3(0 - ball.position.x, 0, 28 - ball.position.z).normalize();
      aim.y = 0.3;
      aim.normalize();
      ball.kick(aim, 18);
      this.kickCooldown = 2;
    }

    this.position.x = THREE.MathUtils.clamp(this.position.x, -18, 18);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -28, 28);
    this.mesh.position.copy(this.position);
  }
}

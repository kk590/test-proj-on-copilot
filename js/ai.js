import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class AIPlayer {
  constructor(scene) {
<<<<<<< HEAD
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

=======
    this.radius = 0.7;
    this.position = new THREE.Vector3(0, this.radius, -10);
    this.velocity = new THREE.Vector3();
    this.baseSpeed = 6.4;
    this.kickCooldown = 0;
    this.speedBoostTimer = 0;
    this.speedBoostMultiplier = 1;
    this.kickBoostTimer = 0;
    this.kickBoostMultiplier = 1;

    this.mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(this.radius, 0.55, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0xff6363, roughness: 0.45 })
    );
    this.mesh.castShadow = true;
>>>>>>> 305a4a33f3383f368a49b3bb29bdb297365b8d6b
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

<<<<<<< HEAD
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
=======
  applySpeedBoost(duration = 5, multiplier = 1.2) {
    this.speedBoostTimer = Math.max(this.speedBoostTimer, duration);
    this.speedBoostMultiplier = Math.max(this.speedBoostMultiplier, multiplier);
  }

  applyKickBoost(duration = 6, multiplier = 1.3) {
    this.kickBoostTimer = Math.max(this.kickBoostTimer, duration);
    this.kickBoostMultiplier = Math.max(this.kickBoostMultiplier, multiplier);
  }

  getKickMultiplier() {
    return this.kickBoostTimer > 0 ? this.kickBoostMultiplier : 1;
  }

  reset(x = 0, z = -10) {
    this.position.set(x, this.radius, z);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
  }

  update(delta, ball, playerGoalZ) {
    this.kickCooldown = Math.max(0, this.kickCooldown - delta);
    this.speedBoostTimer = Math.max(0, this.speedBoostTimer - delta);
    this.kickBoostTimer = Math.max(0, this.kickBoostTimer - delta);

    const goalTarget = new THREE.Vector3(0, this.position.y, playerGoalZ);
    const attackDir = goalTarget.clone().sub(ball.position).setY(0);
    if (attackDir.lengthSq() > 0) attackDir.normalize();

    const desired = ball.position.clone().setY(this.position.y).addScaledVector(attackDir, -1.6);
    const distToBall = this.position.distanceTo(ball.position);
    const target = distToBall > 9 ? ball.position.clone().setY(this.position.y) : desired;
    const move = target.sub(this.position).setY(0);

    if (move.lengthSq() > 0.0001) {
>>>>>>> 305a4a33f3383f368a49b3bb29bdb297365b8d6b
      move.normalize();
      const speedBoost = this.speedBoostTimer > 0 ? this.speedBoostMultiplier : 1;
      const speed = this.baseSpeed * speedBoost;
      this.velocity.copy(move).multiplyScalar(speed);
      this.position.addScaledVector(this.velocity, delta);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, Math.atan2(move.x, move.z), delta * 7.5);
    } else {
      this.velocity.set(0, 0, 0);
    }
<<<<<<< HEAD
    
    if (distToBall < 3.5 && this.kickCooldown <= 0) {
      const aim = new THREE.Vector3(0 - ball.position.x, 0, 28 - ball.position.z).normalize();
      aim.y = 0.3;
      aim.normalize();
      ball.kick(aim, 18);
      this.kickCooldown = 2;
    }

    this.position.x = THREE.MathUtils.clamp(this.position.x, -18, 18);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -28, 28);
=======

    this.position.x = THREE.MathUtils.clamp(this.position.x, -17.6, 17.6);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -27.5, 27.5);

    const kickRange = this.radius + ball.radius + 0.38;
    if (distToBall <= kickRange && this.kickCooldown <= 0) {
      const kickDir = new THREE.Vector3(0, 0, playerGoalZ).sub(this.position).setY(0);
      if (kickDir.lengthSq() > 0) {
        kickDir.normalize();
        const kickForce = THREE.MathUtils.randFloat(10, 15.5) * this.getKickMultiplier();
        ball.kick(kickDir, kickForce, 0.19);
        this.kickCooldown = THREE.MathUtils.randFloat(0.95, 1.35);
      }
    }

>>>>>>> 305a4a33f3383f368a49b3bb29bdb297365b8d6b
    this.mesh.position.copy(this.position);
  }
}

import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class AIPlayer {
  constructor(scene) {
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
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

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
      move.normalize();
      const speedBoost = this.speedBoostTimer > 0 ? this.speedBoostMultiplier : 1;
      const speed = this.baseSpeed * speedBoost;
      this.velocity.copy(move).multiplyScalar(speed);
      this.position.addScaledVector(this.velocity, delta);
      this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, Math.atan2(move.x, move.z), delta * 7.5);
    } else {
      this.velocity.set(0, 0, 0);
    }

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

    this.mesh.position.copy(this.position);
  }
}

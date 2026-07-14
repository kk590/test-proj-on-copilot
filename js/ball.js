import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class Ball {
  constructor(scene) {
    this.radius = 0.45;
    this.position = new THREE.Vector3(0, this.radius, 0);
    this.velocity = new THREE.Vector3();
    this.gravity = 20;
    this.restitution = 0.58;
    this.wallBounce = 0.7;
    this.rollingResistance = 1.9;
    this.airDrag = 0.08;

    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.radius, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.34, metalness: 0.06 })
    );
    this.mesh.castShadow = true;
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  reset(x = 0, z = 0) {
    this.position.set(x, this.radius, z);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
  }

  kick(direction, force, lift = 0.28) {
    const dir = direction.clone().normalize();
    this.velocity.x += dir.x * force;
    this.velocity.z += dir.z * force;
    this.velocity.y += Math.max(0.35, force * lift * 0.1);
  }

  resolvePlayerCollision(playerPosition, playerRadius, playerVelocity = new THREE.Vector3()) {
    const offset = this.position.clone().sub(playerPosition);
    offset.y = 0;
    const minDist = this.radius + playerRadius;
    const distSq = offset.lengthSq();
    if (distSq <= 0.000001 || distSq > minDist * minDist) return;

    const dist = Math.sqrt(distSq);
    const normal = offset.multiplyScalar(1 / dist);
    const overlap = minDist - dist;
    this.position.addScaledVector(normal, overlap + 0.01);

    const relative = new THREE.Vector2(this.velocity.x - playerVelocity.x, this.velocity.z - playerVelocity.z);
    const normal2D = new THREE.Vector2(normal.x, normal.z);
    const separatingSpeed = relative.dot(normal2D);

    if (separatingSpeed < 0) {
      const impulse = -(1.14) * separatingSpeed;
      this.velocity.x += normal.x * impulse;
      this.velocity.z += normal.z * impulse;
    }

    this.velocity.x += playerVelocity.x * 0.12;
    this.velocity.z += playerVelocity.z * 0.12;
  }

  update(delta, world) {
    this.velocity.y -= this.gravity * delta;
    this.position.addScaledVector(this.velocity, delta);

    const onGround = this.position.y <= this.radius;
    if (onGround) {
      this.position.y = this.radius;
      if (this.velocity.y < 0) {
        this.velocity.y = -this.velocity.y * this.restitution;
      }
      if (Math.abs(this.velocity.y) < 0.25) this.velocity.y = 0;

      const slow = Math.max(0, 1 - this.rollingResistance * delta);
      this.velocity.x *= slow;
      this.velocity.z *= slow;
    }

    const drag = Math.max(0, 1 - this.airDrag * delta);
    this.velocity.multiplyScalar(drag);

    const { halfWidth, goal } = world;

    if (Math.abs(this.position.x) + this.radius > halfWidth) {
      this.position.x = Math.sign(this.position.x) * (halfWidth - this.radius);
      this.velocity.x *= -this.wallBounce;
    }

    this.handleGoalSideCollision(goal, 1);
    this.handleGoalSideCollision(goal, -1);

    if (this.velocity.lengthSq() < 0.0006 && this.position.y <= this.radius + 0.0001) {
      this.velocity.set(0, 0, 0);
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.x += this.velocity.z * delta * 1.5;
    this.mesh.rotation.z -= this.velocity.x * delta * 1.5;
  }

  handleGoalSideCollision(goal, side) {
    const lineZ = goal.lineZ * side;
    const backZ = (goal.lineZ + goal.depth) * side;
    const nearLine = side > 0 ? this.position.z + this.radius > lineZ : this.position.z - this.radius < lineZ;
    if (!nearLine) return;

    const inGoalWindow = Math.abs(this.position.x) <= goal.halfWidth - this.radius && this.position.y <= goal.height - this.radius;

    if (!inGoalWindow) {
      this.position.z = lineZ - this.radius * side;
      this.velocity.z *= -this.wallBounce;
      return;
    }

    const passedBack = side > 0 ? this.position.z + this.radius > backZ : this.position.z - this.radius < backZ;
    if (passedBack) {
      this.position.z = backZ - this.radius * side;
      this.velocity.z *= -0.52;
    }

    if (Math.abs(this.position.x) + this.radius > goal.halfWidth) {
      this.position.x = Math.sign(this.position.x) * (goal.halfWidth - this.radius);
      this.velocity.x *= -0.65;
    }
  }
}

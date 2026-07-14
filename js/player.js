import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class Player {
  constructor(scene) {
    this.size = new THREE.Vector3(1.6, 1.4, 3); // AABB size
    this.position = new THREE.Vector3(0, 5, 0);
    this.velocity = new THREE.Vector3();
    
    this.baseSpeed = 10;
    this.sprintMultiplier = 1.5;
    this.jumpForce = 15;
    this.gravity = 40;
    
    this.isGrounded = false;
    
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
    };

    // Create the mesh (reusing the cool truck model)
    const mat = new THREE.MeshStandardMaterial({ color: 0x25d8ff, roughness: 0.55 });
    this.mesh = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 3), mat);
    body.position.set(0, 0.6, 0); // Bottom of body is at y=0.25
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
    
    // Offset the mesh so position is at the center bottom of the AABB
    // Our AABB is 1.4 tall. Bottom is 0. 
    // The wheels are radius 0.4, at y=0.4. So bottom of wheels is 0. This matches!
    this.mesh.position.copy(this.position);
    scene.add(this.mesh);
  }

  setInput(inputState) {
    this.input = inputState;
  }

  reset(startPosition) {
    this.position.copy(startPosition);
    this.velocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = Math.PI; // Face forward
  }

  update(delta, cameraForward, cameraRight, platforms) {
    // 1. Horizontal Movement
    const inputX = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const inputZ = (this.input.backward ? 1 : 0) - (this.input.forward ? 1 : 0);
    
    const move = new THREE.Vector3();
    if (inputX !== 0 || inputZ !== 0) {
      move.copy(cameraRight).multiplyScalar(inputX).addScaledVector(cameraForward, inputZ).setY(0).normalize();
    }

    const speed = this.baseSpeed * (this.input.sprint ? this.sprintMultiplier : 1);
    this.velocity.x = move.x * speed;
    this.velocity.z = move.z * speed;

    // Smooth rotation towards movement direction
    if (move.lengthSq() > 0.0001) {
      const targetYaw = Math.atan2(move.x, move.z);
      // Quick lerp for responsive turning
      let diff = targetYaw - this.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.mesh.rotation.y += diff * Math.min(1, delta * 12);
    }

    // 2. Vertical Movement & Gravity
    if (this.isGrounded && this.input.jump) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.input.jump = false; // consume jump
    }
    
    this.velocity.y -= this.gravity * delta;
    
    // 3. Apply Velocity and handle Collisions (AABB)
    // We will do a simple separate axis sweep-like approach or just separate axis resolution
    
    // Move Y first
    this.position.y += this.velocity.y * delta;
    this.isGrounded = false;
    let goalHit = false;
    goalHit = this.handleCollisions(platforms, 'y', delta) || goalHit;

    // Move X
    this.position.x += this.velocity.x * delta;
    goalHit = this.handleCollisions(platforms, 'x', delta) || goalHit;

    // Move Z
    this.position.z += this.velocity.z * delta;
    goalHit = this.handleCollisions(platforms, 'z', delta) || goalHit;

    this.mesh.position.copy(this.position);
    return goalHit;
  }

  handleCollisions(platforms, axis, delta) {
    // Player AABB
    const minP = new THREE.Vector3(
      this.position.x - this.size.x / 2,
      this.position.y, // Bottom is y
      this.position.z - this.size.z / 2
    );
    const maxP = new THREE.Vector3(
      this.position.x + this.size.x / 2,
      this.position.y + this.size.y,
      this.position.z + this.size.z / 2
    );

    let goalHit = false;

    for (const plat of platforms) {
      const minB = new THREE.Vector3(
        plat.position.x - plat.size.x / 2,
        plat.position.y - plat.size.y / 2,
        plat.position.z - plat.size.z / 2
      );
      const maxB = new THREE.Vector3(
        plat.position.x + plat.size.x / 2,
        plat.position.y + plat.size.y / 2,
        plat.position.z + plat.size.z / 2
      );

      // Check intersection
      if (
        maxP.x > minB.x && minP.x < maxB.x &&
        maxP.y > minB.y && minP.y < maxB.y &&
        maxP.z > minB.z && minP.z < maxB.z
      ) {
        if (plat.isGoal) {
          goalHit = true;
          continue; // Don't physically collide with the goal, just overlap it
        }

        // Resolve collision based on the axis we are currently moving on
        if (axis === 'y') {
          if (this.velocity.y < 0) { // Falling down
            this.position.y = maxB.y;
            this.isGrounded = true;
          } else if (this.velocity.y > 0) { // Hitting head
            this.position.y = minB.y - this.size.y;
          }
          this.velocity.y = 0;
        } 
        else if (axis === 'x') {
          if (this.velocity.x > 0) {
            this.position.x = minB.x - this.size.x / 2;
          } else if (this.velocity.x < 0) {
            this.position.x = maxB.x + this.size.x / 2;
          }
        }
        else if (axis === 'z') {
          if (this.velocity.z > 0) {
            this.position.z = minB.z - this.size.z / 2;
          } else if (this.velocity.z < 0) {
            this.position.z = maxB.z + this.size.z / 2;
          }
        }
        
        // Update AABB for next checks if resolved
        if (axis === 'y') {
          minP.y = this.position.y;
          maxP.y = this.position.y + this.size.y;
        } else if (axis === 'x') {
          minP.x = this.position.x - this.size.x / 2;
          maxP.x = this.position.x + this.size.x / 2;
        } else if (axis === 'z') {
          minP.z = this.position.z - this.size.z / 2;
          maxP.z = this.position.z + this.size.z / 2;
        }
      }
    }

    return goalHit;
  }
}

import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export class GoalManager {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.playerGoalLine = config.lineZ;
    this.aiGoalLine = -config.lineZ;

    this.addGoal({ color: 0x4b91ff, z: -config.lineZ, facing: 1 });
    this.addGoal({ color: 0xff6464, z: config.lineZ, facing: -1 });
  }

  addGoal({ color, z, facing }) {
    const { halfWidth, height, depth } = this.config;
    const frameMat = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 });
    const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.28 });

    const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, height, 10), frameMat);
    leftPost.position.set(-halfWidth, height / 2, z);
    const rightPost = leftPost.clone();
    rightPost.position.x = halfWidth;

    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, halfWidth * 2, 10), frameMat);
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, height, z);

    const backNet = new THREE.Mesh(new THREE.BoxGeometry(halfWidth * 2, height, 0.1), netMat);
    backNet.position.set(0, height / 2, z + facing * depth);

    const roofNet = new THREE.Mesh(new THREE.BoxGeometry(halfWidth * 2, 0.1, depth), netMat);
    roofNet.position.set(0, height, z + facing * depth * 0.5);

    const sideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, height, depth), netMat);
    sideLeft.position.set(-halfWidth, height / 2, z + facing * depth * 0.5);
    const sideRight = sideLeft.clone();
    sideRight.position.x = halfWidth;

    this.scene.add(leftPost, rightPost, crossbar, backNet, roofNet, sideLeft, sideRight);
  }

  checkGoal(ballPosition, ballRadius) {
    const insideGoalHeight = ballPosition.y <= this.config.height - ballRadius;
    const insideGoalWidth = Math.abs(ballPosition.x) <= this.config.halfWidth - ballRadius;
    if (!insideGoalHeight || !insideGoalWidth) return null;

    if (ballPosition.z < this.aiGoalLine - ballRadius) return "player";
    if (ballPosition.z > this.playerGoalLine + ballRadius) return "ai";
    return null;
  }
}

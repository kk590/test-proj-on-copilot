import * as THREE from "https://unpkg.com/three@0.167.1/build/three.module.js";

export function generateLevels() {
  const levels = [];
  
  for (let i = 0; i < 20; i++) {
    const platforms = [];
    
    // Start platform
    platforms.push({
      position: new THREE.Vector3(0, -1, 0),
      size: new THREE.Vector3(6, 2, 6),
      color: 0x4488ff // Blue start
    });
    
    let currentPos = new THREE.Vector3(0, -1, 0);
    const numPlatforms = 4 + Math.floor(i * 1.2); // More platforms per level
    
    let minHeight = -1;

    for (let j = 1; j < numPlatforms; j++) {
      // Difficulty scales with level index 'i'
      // Base jump distance is 4, increases by up to 3 at max level
      const jumpDist = 4 + (i * 0.15) + (Math.random() * i * 0.1); 
      
      // Angle for the next platform (creates curvy paths)
      // Level 1 is straight (angle ~0). Higher levels have more angle variance.
      const angleVariance = (i / 20) * Math.PI * 0.6; 
      const angle = (Math.random() - 0.5) * angleVariance;
      
      // Height variance
      const heightVariance = (i / 20) * 3;
      const heightChange = (Math.random() - 0.3) * heightVariance; // Slightly biased to go up
      
      currentPos.x += Math.sin(angle) * jumpDist;
      currentPos.z -= Math.cos(angle) * jumpDist;
      currentPos.y += heightChange;

      if (currentPos.y < minHeight) minHeight = currentPos.y;
      
      // Platform size gets smaller at higher levels
      const sizeScale = Math.max(0.4, 1 - (i / 30));
      const width = (3 + Math.random() * 2) * sizeScale;
      const depth = (3 + Math.random() * 2) * sizeScale;
      
      platforms.push({
        position: currentPos.clone(),
        size: new THREE.Vector3(width, 2, depth),
        color: 0x2ab866 // Green normal platform
      });
    }
    
    // Goal platform
    const jumpDist = 4 + (i * 0.1);
    currentPos.z -= jumpDist; // Final jump straight forward
    
    platforms.push({
      position: currentPos.clone(),
      size: new THREE.Vector3(5, 2, 5),
      color: 0xffd700, // Gold goal
      isGoal: true
    });
    if (currentPos.y < minHeight) minHeight = currentPos.y;
    
    levels.push({
      id: i + 1,
      platforms,
      startPosition: new THREE.Vector3(0, 1.5, 0),
      fallLimit: minHeight - 15 // Fall limit based on lowest platform
    });
  }
  
  return levels;
}

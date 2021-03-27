import { Cloth } from './Cloth.js';
import * as THREE from '../js/three.module.js';			

let Flagpole = {};
Flagpole.create = function(loader, physics, scene, animateCallbacks) {
	const height = 12;
	const x = -4.857;
	const y = height / 2; 
	const z = -29.148;
	loader.loadTexture('../textures/stozar.jpg', textures => {	
		let texture = textures[0];
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, 20);
		const geometry = new THREE.CylinderGeometry(.02, .04, height, 16);
		const material = new THREE.MeshLambertMaterial({map: texture});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.scale.set(1, 1, 1);
		scene.add(mesh);
		physics.addCylinderObsticle(mesh);
	});
	loader.loadTexture('../textures/vlajka.png', textures => {
		const clothTexture = textures[0];
		clothTexture.anisotropy = 16;
		const clothMaterial = new THREE.MeshLambertMaterial({
			map: clothTexture,
			side: THREE.DoubleSide,
			alphaTest: 0.5
		});
		const flag = new Cloth(clothMaterial);	
		const dx = 0.65;
		const dy = 4.1;
		const dz = 0;
		flag.position.set(x + dx, y + dy, z + dz);
		const scale = 0.005;
		flag.scale.set(scale, scale, scale);
		scene.add(flag);
		animateCallbacks.push(flag);
	});
};

export { Flagpole };
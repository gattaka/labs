import * as THREE from '../js/three.module.js';			

let Terrain = {};
Terrain.create = function(loader, physics, scene) {

	let grassTextureName = '../textures/trava_seamless.jpg';
	loader.loadTexture(grassTextureName);	

	loader.loadModel('../models/teren.glb', gltf => { 
		const ground = gltf.scene.children[0];														
		const meshes = [];
		ground.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			meshes.push(n);
		}});	
			
		const faceSide = 128;
		const terrainWidthExtents = 140;
		const terrainDepthExtents = 87.2;
		const terrainWidth = faceSide;
		const terrainDepth = faceSide;
			
		let heightMap = [];
		let terrainMinHeight, terrainMaxHeight;
		for (let m = 0; m < meshes.length; m++) {
			const vertices = meshes[m].geometry.attributes.position.array;
			for (let i = 0; i < vertices.length; i += 3) {
				let x = vertices[i];
				let y = vertices[i + 1];
				let z = vertices[i + 2];
				terrainMinHeight = terrainMinHeight === undefined ? y : Math.min(terrainMinHeight, y);
				terrainMaxHeight = terrainMaxHeight === undefined ? y : Math.max(terrainMaxHeight, y);						
				heightMap.push({x: x, y: y, z: z});
			}
		}
		
		ground.scale.set(1, 1, 1);
		ground.position.set(0, 4.827, 0);	
		ground.rotation.x = 0;
		ground.rotation.y = 0;
		ground.rotation.z = 0;	
				
		heightMap.sort((a, b) => {
			let firstMult = 1;
			let secondMult = 1;
			let firstAxisA = a.x;
			let firstAxisB = b.x;
			let secondAxisA = a.z;
			let secondAxisB = b.z;
			if (firstAxisA > firstAxisB) return 1 * firstMult;
			if (firstAxisA < firstAxisB) return -1 * firstMult;
			if (firstAxisA == firstAxisB) {
				if (secondAxisA > secondAxisB) return 1 * secondMult;
				if (secondAxisA < secondAxisB) return -1 * secondMult;
			}		
			return 0;					
		});			
		
		// clean glb duplicit vertexů
		let hMap = [];		
		for (let i = 0, lx, ly, lz; i < heightMap.length; i++) {
			let vtx = heightMap[i];
			if (Number.isNaN(vtx.y))
				console.log("NaN");
			if (i == 0 || vtx.x != lx || vtx.z != lz)
				hMap.push(heightMap[i].y);
			if (vtx.x == lx && vtx.z == lz && vtx.y != ly)
				console.log("vtx.y != ly");
			lx = heightMap[i].x;
			ly = heightMap[i].y;
			lz = heightMap[i].z;
		}
		heightMap = hMap;
		
		let geometry = new THREE.PlaneBufferGeometry(terrainWidthExtents, terrainDepthExtents, terrainWidth, terrainDepth);
		geometry.rotateX(-Math.PI/2);	
		const vertices = geometry.attributes.position.array;
		for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3)			
			vertices[j + 1] = heightMap[i];	
		geometry.computeVertexNormals();
		
		let texture = loader.getTexture(grassTextureName);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.anisotropy = 1;
		texture.encoding = THREE.sRGBEncoding;
		let rep = 100;
		texture.repeat.set(rep, rep);
		const material = new THREE.MeshLambertMaterial({map: texture});
		material.metalness = 0;
		material.roughness = 1;					
/*
		Object.keys(ground.material).forEach(function(key,index) {
		  console.log(key + ": ground[" + ground.material[key] + "] material[" + material[key] + "]"); 
		});
		
		Object.keys(texture).forEach(function(key,index) {
		  console.log(key + ": ground[" + ground.material.map[key] + "] texture[" + texture[key] + "]"); 
		});
*/		
		const plane = new THREE.Mesh(geometry, material);
		plane.position.set(ground.position.x, ground.position.y, ground.position.z);
		plane.scale.set(-1, 1, 1);
		plane.rotation.y = Math.PI/2;	
		plane.castShadow = false;
		plane.receiveShadow = true;
		
		plane.userData.terrainWidth = terrainWidth;
		plane.userData.terrainDepth = terrainDepth;	
		plane.userData.terrainWidthExtents = terrainWidthExtents;
		plane.userData.terrainDepthExtents = terrainDepthExtents;

		plane.userData.terrainMinHeight = terrainMinHeight;
		plane.userData.terrainMaxHeight = terrainMaxHeight;		
		plane.userData.heightMap = heightMap;
				
		physics.addTerrain(plane, scene);		
		scene.add(plane);
	});	
};

export { Terrain };
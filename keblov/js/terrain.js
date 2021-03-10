import * as THREE from '../js/three.module.js';			

let Terrain = function(loader, onLoad) {

	const terrainWidthExtents = 60;
	const terrainDepthExtents = 60;
	const terrainWidth = 128;
	const terrainDepth = 128;
	const terrainMaxHeight = 2;
	let terrainMinHeight = 0;

	function generateHeight( width, depth, minHeight, maxHeight ) {
		// Generates the height data (a sinus wave)
		let size = width * depth;
		let data = new Float32Array(size);

		let hRange = maxHeight - minHeight;
		let w2 = width / 2;
		let d2 = depth / 2;
		let phaseMult = 12;

		let p = 0;
		for (let j = 0; j < depth; j++) {
			for (let i = 0; i < width; i++) {
				let radius = Math.sqrt(Math.pow((i - w2) / w2, 2.0) + Math.pow((j - d2) / d2, 2.0));
				let height = (Math.sin(radius * phaseMult) + 1) * 0.5  * hRange + minHeight;
				data[p] = height;
				p++;
			}
		}

		return data;
	}

	function createTerrain() {	
		loader.loadTexture('../textures/seamless_grass.jpg', textures => {		
			const texture = textures[0];
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(100, 100);
			const material = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide});
			
			const heightMap = generateHeight( terrainWidth, terrainDepth, terrainMinHeight, terrainMaxHeight );	
			
			let geometry = new THREE.PlaneBufferGeometry( terrainWidthExtents, terrainDepthExtents, terrainWidth - 1, terrainDepth - 1 );
			geometry.rotateX( - Math.PI / 2 );
			const vertices = geometry.attributes.position.array;
			for ( let i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
				// j + 1 because it is the y component that we modify
				vertices[ j + 1 ] = heightMap[ i ];
			}
			geometry.computeVertexNormals();
			
			let ground = new THREE.Mesh(geometry, material);
			ground.castShadow = false;
			ground.receiveShadow = true;
			ground.userData.heightMap = heightMap;
			ground.userData.terrainWidthExtents = terrainWidthExtents;
			ground.userData.terrainDepthExtents = terrainDepthExtents;
			ground.userData.terrainWidth = terrainWidth;
			ground.userData.terrainDepth = terrainDepth;
			ground.userData.terrainMaxHeight = terrainMaxHeight;
			ground.userData.terrainMinHeight = terrainMinHeight;
			ground.position.set(0, -2, 0);
					
			onLoad(ground);
		});		
	}

	return createTerrain();
};

export { Terrain };
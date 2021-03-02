import * as THREE from '../js/three.module.js';			

let Terrain = function () {

	var terrainWidthExtents = 500;
	var terrainDepthExtents = 500;
	var terrainWidth = 128;
	var terrainDepth = 128;
	var terrainMaxHeight = 8;
	var terrainMinHeight = -2;

	function generateHeight( width, depth, minHeight, maxHeight ) {
		// Generates the height data (a sinus wave)
		var size = width * depth;
		var data = new Float32Array(size);

		var hRange = maxHeight - minHeight;
		var w2 = width / 2;
		var d2 = depth / 2;
		var phaseMult = 12;

		var p = 0;
		for ( var j = 0; j < depth; j ++ ) {
			for ( var i = 0; i < width; i ++ ) {
				var radius = Math.sqrt(
					Math.pow((i - w2) / w2, 2.0) +
					Math.pow((j - d2) / d2, 2.0));
				var height = (Math.sin(radius * phaseMult) + 1) * 0.5  * hRange + minHeight;
				data[p] = height;
				p++;
			}
		}

		return data;
	}

	function createTerrain() {	
		const texture = new THREE.TextureLoader().load('../textures/seamless_grass.jpg');
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(100, 100);
		const material = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide});
		
		const heightMap = generateHeight( terrainWidth, terrainDepth, terrainMinHeight, terrainMaxHeight );	
		
		var geometry = new THREE.PlaneBufferGeometry( terrainWidthExtents, terrainDepthExtents, terrainWidth - 1, terrainDepth - 1 );
		geometry.rotateX( - Math.PI / 2 );
		const vertices = geometry.attributes.position.array;		
		for ( var i = 0, j = 0, l = vertices.length; i < l; i ++, j += 3 ) {
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
		return ground;
	}

	return createTerrain();
};

export { Terrain };
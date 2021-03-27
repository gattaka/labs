import * as THREE from '../js/three.module.js';			

let Skybox = {};

// https://redstapler.co/create-3d-world-with-three-js-and-skybox-technique/
// https://opengameart.org/content/skiingpenguins-skybox-pack
Skybox.create = function(loader, scene) {
	let callback = function(textures) {
		let materialArray = [];
		textures.forEach(t => {
			let m = new THREE.MeshBasicMaterial({ map: t });
			m.side = THREE.BackSide;
			materialArray.push(m);
			let side = 400;
			let skyboxGeo = new THREE.BoxGeometry(side, side, side);
			let skybox = new THREE.Mesh(skyboxGeo, materialArray);
			skybox.position.set(0, 0, 0);
			scene.add(skybox);
		});
	};	
	loader.loadTexturesByRequest({
		linkPrefix: '../textures/skybox/', 
		links: ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg'], 
		callback: callback});	  
};

export { Skybox };
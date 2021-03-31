import * as THREE from '../js/three.module.js';			

let Skybox = {};

// https://threejsfundamentals.org/threejs/lessons/threejs-backgrounds.html
Skybox.create = function(loader, scene) {
	let callback = function(textures) {
		scene.background = textures[0];
	};	
	loader.loadTexturesByRequest({
		linkPrefix: '../textures/skybox/', 
		links: ['posx.jpg', 'negx.jpg', 'posy.jpg', 'negy.jpg', 'posz.jpg', 'negz.jpg'], 
		callback: callback,
		cube: true});	  
};

export { Skybox };
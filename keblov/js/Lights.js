import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let Lights = {};

// https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow
// https://threejs.org/examples/webgl_lights_hemisphere.html
// https://stackoverflow.com/questions/15478093/realistic-lighting-sunlight-with-three-js
// https://threejs.org/docs/#api/en/math/Color.setHSL
Lights.create = function(scene) {
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, .7);
	hemiLight.color.setHSL(0.15, 1, 0.9);
	//hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set(0, 50, 0);
	scene.add(hemiLight);

	if (Config.showHelpers) {
		const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
		scene.add(hemiLightHelper);
	}

	const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
	dirLight.color.setHSL(0.1, 1, 1);
	dirLight.position.set(0.4, 1.75, 0.2);
	dirLight.position.multiplyScalar(30);
	dirLight.castShadow = true;
	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;
	scene.add(dirLight);	

	const d = 50;
	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;
	dirLight.shadow.camera.far = 3500;
	dirLight.shadow.bias = -0.0001;
	if (Config.showHelpers) {
		const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
		scene.add(dirLightHelper);
	}	 
};

export { Lights };
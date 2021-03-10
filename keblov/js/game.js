import { Config } from './Config.js';
import { CookieUtils } from './CookieUtils.js';
import { Stats } from './Stats.js';
import { Info } from './Info.js';
import { Controls } from './Controls.js';
import { Cloth } from './Cloth.js';
import { Physics } from './Physics.js';
import { Terrain } from './Terrain.js';
import { Player } from './Player.js';
import { Loader } from './Loader.js';
import * as THREE from './three.module.js';

const phMargin = Config.phMargin;
const glScale = Config.glScale;
const showHelpers = Config.showScHelpers;

let camera, scene, renderer, controls;
let flag;
let player;

const info = new Info();
const loader = new Loader(info);
const clock = new THREE.Clock();
const stats = new Stats();
const physics = new Physics.processor(init);
const cookieUtils = new CookieUtils();

// https://redstapler.co/create-3d-world-with-three-js-and-skybox-technique/
// https://opengameart.org/content/skiingpenguins-skybox-pack
function createSkybox() {		
	let callback = function(textures) {
		let materialArray = [];
		textures.forEach(t => {
			let m = new THREE.MeshBasicMaterial({ map: t });
			m.side = THREE.BackSide;
			materialArray.push(m);
			let side = 10000;
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
}

// https://anyconv.com/fbx-to-glb-converter/
// https://sketchfab.com/3d-models/fur-tree-41fa3210e50944eaa489c148e5e2ccc7
function createTree() {
	new GLTFLoader().load('../models/fur_tree/scene.gltf', result => { 
		let model = result.scene.children[0]; 		
		model.position.set(270, 0, 10);
		model.scale.set(.1,.1,.1);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) {
				n.material.map.anisotropy = 1; 
				if (n.material.name == "lambert5")
					n.material.map.repeat = new THREE.Vector2(1,5);
			}
		}});
		scene.add(model);
	});		
};

// https://sketchfab.com/3d-models/pine-tree-single-01-ed72511b36c14446a1b596b7e3686d73
function createPineTree() {
	let config = [[40,0,-65,.19,5], [110,0,-70,.18,2], [160,0,-60,.17,0], [210,0,-70,.18,4],
		[280,0,20,.19,5], [290,0,90,.18,2], [285,0,150,.17,0], [300,0,200,.18,4],
		[40,0,250,.19,5], [110,0,280,.18,2], [150,0,270,.17,0], [210,0,260,.18,4], [0,0,270,.17,2], [-50,0,280,.18,3]];
	new GLTFLoader().load('../models/pine_tree/scene.gltf', result => { 
		let tree = result.scene.children[0]; 		
		config.forEach(e => {
			let model = tree.clone();
			model.position.set(e[0], e[1], e[2]);
			const sz = e[3];
			model.scale.set(sz,sz,sz);
			model.rotation.z = e[4];
			model.traverse(n => { if (n.isMesh) {
				n.castShadow = true; 
				n.receiveShadow = true;
				if (n.material.map) n.material.map.anisotropy = 1;
			}});
			scene.add(model);
		});
	});		
};

// https://sketchfab.com/3d-models/pine-tree-e52769d653cd4e52a4acff3041961e65
function createPineTree2() {
	let config = [[10,0,-70,.1,5], [20,0,-60,.15,2],
		/*[280,0,20,.19,5], [290,0,90,.18,2], [285,0,150,.17,0], [300,0,200,.18,4],
		[40,0,250,.19,5], [110,0,280,.18,2], [150,0,270,.17,0], [210,0,260,.18,4], [0,0,270,.17,2], [-50,0,280,.18,3]*/
		];
	new GLTFLoader().load('../models/pine_tree2/scene.gltf', result => { 
		let tree = result.scene.children[0]; 		
		config.forEach(e => {
			let model = tree.clone();
			model.position.set(e[0], e[1], e[2]);
			const sz = e[3];
			model.scale.set(sz,sz,sz);
			model.rotation.z = e[4];
			model.traverse(n => { if (n.isMesh) {
				n.castShadow = true; 
				n.receiveShadow = true;
				if (n.material.map) n.material.map.anisotropy = 1;
			}});
			scene.add(model);
		});
	});		
};

function processBoundingBox(model) {
	const bboxMax = new THREE.Vector3();
	const bboxMin = new THREE.Vector3();
	model.traverse(n => { if (n.isMesh) {
		bboxMax.x = Math.max(n.geometry.boundingBox.max.x, bboxMax.x);
		bboxMax.y = Math.max(n.geometry.boundingBox.max.y, bboxMax.y);
		bboxMax.z = Math.max(n.geometry.boundingBox.max.z, bboxMax.z);
		bboxMin.x = Math.min(n.geometry.boundingBox.min.x, bboxMin.x);
		bboxMin.y = Math.min(n.geometry.boundingBox.min.y, bboxMin.y);
		bboxMin.z = Math.min(n.geometry.boundingBox.min.z, bboxMin.z);
	}});
	return {min: bboxMin, max: bboxMax};
};

function loadModel(scene, name, sc, bx, by, bz, variants, asPhysicsBody, onCreateCallback) {
	loader.loadModel('../models/' + name, gltf => { 
		let model = gltf.scene.children[0];
		model.scale.set(sc, sc, sc);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			//if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		const box = processBoundingBox(model);
		variants.forEach(v => {
			let instance = model.clone();
			instance.position.set(bx + v.x * sc, by + v.y * sc, bz + v.z * sc);				
			instance.rotation.y = v.r;
			scene.add(instance);
			if (asPhysicsBody)
				physics.addMeshObsticle(instance, scene, true, box.min, box.max);	
			if (onCreateCallback !== undefined)
				onCreateCallback(instance);
		});
	});
};

function createStaryBarak() {	
	const sc = 5;
	let bx = -15;
	let by = 5;
	let bz = 0;
	loadModel(scene, 'keblov_stary.glb', sc, bx, by, bz, [{x: 0, y: -0.5, z: 0, r: 3 * Math.PI/2}], true);		
	loadModel(scene, 'keblov_stary_zdi.glb', sc, bx, by, bz, [{x: 0, y: 1.036, z: 0, r: 3 * Math.PI/2}], false);
	loadModel(scene, 'keblov_stary_strop.glb', sc, bx, by, bz, [{x: 0, y: 2.24, z: 0, r: 3 * Math.PI/2}], true);		
	const variants = [
		{x: -9.62, y: 0.33, z: -0.37, r: 0},
		{x: -11.33, y: 0.33, z: -0.37, r: 0},
		{x: -10.82, y: 0.33, z: 1.68, r: Math.PI/2},
		{x: -10.82, y: 0.33, z: 2.59, r: Math.PI/2},
	];
	loadModel(scene, 'postel.glb', sc, bx, by, bz, variants, true);			
	loadModel(scene, 'kamna.glb', sc, bx, by, bz, [{x: -9.285, y: 0.809, z: 0.938, r: -Math.PI/2}], true);	
	const stulPolovodiceVariants = [
		{x: -8.63, y: 0.41, z: 1.88, r: -Math.PI/2},
		{x: -4.83, y: 0.41, z: -2.69, r: -Math.PI/2}
	];
	loadModel(scene, 'stul_polovodice.glb', sc, bx, by, bz, stulPolovodiceVariants, true);
	loadModel(scene, 'dilna_police1.glb', sc, bx, by, bz, [{x: -10.75, y: 0.9, z: -3.16, r: -Math.PI/2}], true);	
	loadModel(scene, 'dilna_junk.glb', sc, bx, by, bz, [{x: -9.38, y: 0.5, z: -3.4, r: -Math.PI/2}], true);	
	loadModel(scene, 'dilna_police2.glb', sc, bx, by, bz, [{x: -8.09, y: 0.87, z: -3.16, r: -Math.PI/2}], true);	
	loadModel(scene, 'dilna_police3.glb', sc, bx, by, bz, [{x: -10.62, y: 0.66, z: -1.8, r: -Math.PI/2}], true);	
	const schodyVariants = {x: -8.62, y: 1.06, z: -0.51, r: -Math.PI/2};
	loadModel(scene, 'schody.glb', sc, bx, by, bz, [schodyVariants], false);
	const schodVariants = [];
	const zStep = 0.185314;
	const yStep = 0.227054;
	for (let i = 0; i < 10; i++)
		schodVariants.push({x: schodyVariants.x, y: schodyVariants.y - 1.02 + yStep * i, z: schodyVariants.z + 0.82 - zStep * i, r: schodyVariants.r});
	loadModel(scene, 'schod.glb', sc, bx, by, bz, schodVariants, true);
	loadModel(scene, 'sportak_skrin1.glb', sc, bx, by, bz, [{x: -6.52, y: 0.79, z: -0.27, r: -Math.PI/2}], true);
	const sportakSkrin2Variants = [
		{x: -5.39, y: 0.79, z: -0.27, r: -Math.PI/2},
		{x: -6.75, y: 0.79, z: -3.00, r: Math.PI},
	];
	loadModel(scene, 'sportak_skrin2.glb', sc, bx, by, bz, sportakSkrin2Variants, true);
	const sportakSkrin3Variants = [
		{x: -4.57, y: 0.61, z: -0.27, r: -Math.PI/2},
		{x: -4.056, y: 0.61, z: 3.342, r: -Math.PI/2},
	];
	loadModel(scene, 'sportak_skrin3.glb', sc, bx, by, bz, sportakSkrin3Variants, true);
	const lavickaLakovanaVariants = [	
		{x: -3.6, y: 0.25, z: -1.77, r: Math.PI/2},
		{x: -2.3, y: 0.25, z: -1.1, r: Math.PI/2},
		{x: -1.0, y: 0.25, z: -1.97, r: 0},
		{x: 0.3, y: 0.25, z: -1.36, r: Math.PI/2},
	];
	loadModel(scene, 'lavicka_lakovana.glb', sc, bx, by, bz, lavickaLakovanaVariants, true);			
	const stulJidelnaVariants = [
		{x: -2.991, y: 0.410, z: -0.993, r: 0},
		{x: -2.991, y: 0.410, z: -1.811, r: 0},
		{x: -2.991, y: 0.410, z: -2.635, r: 0},
		{x: -2.172, y: 0.410, z: -2.635, r: 0},
		{x: -1.352, y: 0.410, z: -2.635, r: 0},
		{x: -0.530, y: 0.410, z: -2.635, r: 0},
		{x: 0.289, y: 0.410, z: -2.635, r: 0},
		{x: 1.113, y: 0.410, z: -2.635, r: 0},
		{x: 1.113, y: 0.410, z: -1.813, r: 0},
		{x: 1.113, y: 0.410, z: -0.991, r: 0},
		{x: 1.113, y: 0.410, z: -0.172, r: 0},
		{x: 1.113, y: 0.410, z: 0.644, r: 0},
	];
	loadModel(scene, 'stul_jidelna.glb', sc, bx, by, bz, stulJidelnaVariants, true);
	loadModel(scene, 'stul_jidelna_varnice.glb', sc, bx, by, bz, [{x: 2.822, y: 0.342, z: 3.176, r: -Math.PI}], true);	
	loadModel(scene, 'jidelna_skrine_ruzne.glb', sc, bx, by, bz, [{x: 2.936, y: 1.045, z: -2.494, r: -Math.PI}], true);	
	loadModel(scene, 'posta.glb', sc, bx, by, bz, [{x: -4.179, y: 1.070, z: 1.707, r: -Math.PI/2}], true);	
	loadModel(scene, 'stul_kancl.glb', sc, bx, by, bz, [{x: -2.990, y: 0.364, z: 3.278, r: -Math.PI/2}], true);	
	loadModel(scene, 'kamna_osetrovna.glb', sc, bx, by, bz, [{x: -6.3, y: 0.402, z: 0.382, r: -Math.PI/2}], true);
	loadModel(scene, 'postel_csd.glb', sc, bx, by, bz, [{x: -6.661, y: 0.219, z: 2.581, r: -Math.PI/2}], true);
	loadModel(scene, 'skrinka_osetrovna.glb', sc, bx, by, bz, [{x: -6.792, y: 0.502, z: 1.125, r: -Math.PI/2}], true);
	loadModel(scene, 'palanda_osetrovna.glb', sc, bx, by, bz, [{x: -4.857, y: 0.74, z: 1.00, r: -Math.PI/2}], true);
	loadModel(scene, 'jidelna_vydejni_okno.glb', sc, bx, by, bz, [{x: 3.306, y: 1.690, z: 2.153, r: -Math.PI/2}], true);
	loadModel(scene, 'stul_hrnky.glb', sc, bx, by, bz, [{x: -1.236, y: 0.410, z: 3.184, r: -Math.PI/2}], true);
	loadModel(scene, 'lekarna.glb', sc, bx, by, bz, [{x: 7.097, y: 1.729, z: -1.54, r: -Math.PI/2}], true);		
	loadModel(scene, 'kuchyne_police1.glb', sc, bx, by, bz, [{x: 8.072, y: 1.758, z: -1.404, r: -Math.PI/2}], true);		
	loadModel(scene, 'kuchyne_mycak.glb', sc, bx, by, bz, [{x: 7.853, y: 0.416, z: -1.284, r: -Math.PI/2}], true);		

	// JS - Blender
	// x = y
	// y = z
	// z = x	
};

// https://sketchfab.com/3d-models/lowpoly-tree-b562b2e9f029440c804b4b6d36ebe174
function createLowPolyTree() {
	new GLTFLoader().load('../models/lowpoly_tree/scene.gltf', result => { 
		let model = result.scene.children[0]; 		
		model.position.set(-20, 0, -40);
		const sc = 3;
		model.scale.set(sc,sc,sc);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		scene.add(model);
	});		
};

// https://sketchfab.com/3d-models/oak-trees-d841c3bcc5324daebee50f45619e05fc
function createOakTrees() {
	new GLTFLoader().load('../models/oak_trees/scene.gltf', result => { 
		let model = result.scene.children[0]; 		
		model.position.set(50, 0, -150);
		const sc = 3;
		model.scale.set(sc,sc,sc);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		scene.add(model);
	});		
};

// https://sketchfab.com/3d-models/realistic-tree-model-104028c8350a4612b84b5e1c6b409bd4
function createRealisticTree() {
	let config = [[130,0,-40,5,2]];
	new GLTFLoader().load('../models/realistic_tree/scene.gltf', result => { 
		let tree = result.scene.children[0]; 		
		config.forEach(e => {
			let model = tree.clone();
			model.position.set(e[0], e[1], e[2]);
			const sz = e[3];
			model.scale.set(sz,sz,sz);
			model.rotation.z = e[4];
			model.traverse(n => { if (n.isMesh) {
				n.castShadow = true; 
				n.receiveShadow = true;
				if (n.material.map) n.material.map.anisotropy = 1;
			}});
			scene.add(model);
		});
	});		
};

// https://sketchfab.com/3d-models/low-poly-christmas-tree-bacdf9be9880497cbb2d6d12e30349c0
function createLowPolyXmasTree() {
	let config = [[0,0,0,.02,0]];
	new GLTFLoader().load('../models/low_poly_christmas_tree/scene.gltf', result => { 
		let tree = result.scene.children[0]; 		
		config.forEach(e => {
			let model = tree.clone();
			model.position.set(e[0], e[1], e[2]);
			const sz = e[3];
			model.scale.set(sz,sz,sz);
			model.rotation.z = e[4];
			model.traverse(n => { if (n.isMesh) {
				n.castShadow = true; 
				n.receiveShadow = true;
				if (n.material.map) n.material.map.anisotropy = 1;
			}});
			scene.add(model);
		});
	});		
};

// https://sketchfab.com/3d-models/tree-c6a65b51988648f689bbd4665e87213e
function createSmallTree() {
	let config = [[100,0,0,.5,0]];
	new GLTFLoader().load('../models/small_tree/scene.gltf', result => { 
		let tree = result.scene.children[0]; 		
		config.forEach(e => {
			let model = tree.clone();
			model.position.set(e[0], e[1], e[2]);
			const sz = e[3];
			model.scale.set(sz,sz,sz);
			model.rotation.z = e[4];
			model.traverse(n => { if (n.isMesh) {
				n.castShadow = true; 
				n.receiveShadow = true;
				if (n.material.map) n.material.map.anisotropy = 1;
			}});
			scene.add(model);
		});
	});		
};

// https://sketchfab.com/3d-models/tree-low-poly-4cd243eb74c74b3ea2190ebcec0439fb
// https://sketchfab.com/3d-models/low-poly-tree-70f0e767fc2f449fa6fef9c2308b395f

function createFlag() {
	loader.loadTexture('../textures/vlajka.png', textures => {
		const clothTexture = textures[0];
		clothTexture.anisotropy = 16;
		const clothMaterial = new THREE.MeshLambertMaterial({
			map: clothTexture,
			side: THREE.DoubleSide,
			alphaTest: 0.5
		});
		flag = new Cloth(clothMaterial);	
		flag.position.set(103.5, 80, 107);
		const scale = 0.05;
		flag.scale.set(scale, scale, scale);
		scene.add(flag);	
	});
};

function createStozar() {
	loader.loadTexture('../textures/stozar.jpg', texture => {	
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, 20);
		const geometry = new THREE.CylinderGeometry(.2, .7, 200, 16);
		const material = new THREE.MeshLambertMaterial({map: texture});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(97, 0, 107);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.scale.set(1, 1, 1);
		scene.add(mesh);
		physics.addCylinderObsticle(mesh);
	});
}

function createTents() {
	// modely musí mít počátek uprostřed své výšky a obsahu, 
	// jinak boundingbox přepočet na Ammo kolizní box bude dělat problémy
	loader.loadModel('../models/stan.glb' + name, gltf => { 
		let model = gltf.scene.children[0];
		let sc = 1;
		model.scale.set(sc, sc, sc);
		model.castShadow = true; 
		model.receiveShadow = true; 
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		let startY = 20;
		// severní řada 9 stanů
		for (let i = 0; i < 9; i++) {			
			let tent = model.clone();
			tent.position.set(25 * i, startY, -20);
			scene.add(tent);
			physics.addMeshObsticle(tent, scene);
		}
		// východní řada 8 stanů
		for (let i = 0; i < 8; i++) {			
			if (i == 3) continue;
			let tent = model.clone();
			tent.rotateZ(Math.PI/2);
			tent.position.set(250, startY, 20 + i * 25);
			scene.add(tent);
			physics.addMeshObsticle(tent, scene);
		}
		// jižní řada 13 stanů
		for (let i = 0; i < 13; i++) {			
			let tent = model.clone();
			tent.rotateZ(Math.PI);
			tent.position.set(210 - 25 * i, startY, 230);
			scene.add(tent);
			physics.addMeshObsticle(tent, scene);
		}
	});	
}

function createGrid() {
	const size = 100;
	const divisions = 100;

	const gridHelper = new THREE.GridHelper(size, divisions);
	scene.add(gridHelper);
}

// https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow
// https://threejs.org/examples/webgl_lights_hemisphere.html
// https://stackoverflow.com/questions/15478093/realistic-lighting-sunlight-with-three-js
// https://threejs.org/docs/#api/en/math/Color.setHSL
function createLight() {
/*	
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9);
	hemiLight.color = new THREE.Color("hsl(58, 70%, 80%)");
	hemiLight.groundColor = new THREE.Color("hsl(83, 20%, 70%)");
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
	scene.add(hemiLightHelper);
*/	
	scene.add(new THREE.AmbientLight(0x999999));

	const dirLight = new THREE.DirectionalLight(0xffffff, .5);	
	dirLight.color = new THREE.Color("hsl(58, 100%, 100%)");
	dirLight.position.set(5, 10, 1);
	dirLight.position.multiplyScalar(30);
	scene.add(dirLight);

	dirLight.castShadow = true;

	dirLight.shadow.mapSize.width = 256;
	dirLight.shadow.mapSize.height = 256;

	const d = 30;
	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;

	dirLight.shadow.camera.far = 50;
	dirLight.shadow.bias = - 0.001;	

	if (showHelpers) {
		const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
		scene.add(dirLightHelper);
		
		// Create a helper for the shadow camera (optional)
		const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
		scene.add(cameraHelper);
	}
}

// https://threejs.org/docs/#examples/en/controls/PointerLockControls
// https://sbcode.net/threejs/pointerlock-controls/
function createControls() {
	controls = new Controls(camera, document.body);	
	document.body.addEventListener('click', function () {
		controls.lock();
	}, false);
	
	const onKeyDown = function (event) { onKeyChange(event, true) };
	const onKeyUp = function (event) { onKeyChange(event, false) };
	const onKeyChange = function (event, down) {
		switch (event.key) {
			case "w":
				player.keys.forward = down ? 1 : 0;
				break;
			case "a":
				player.keys.right = down ? 1 : 0;
				break;
			case "s":
				player.keys.back = down ? 1 : 0;
				break;
			case "d":
				player.keys.left = down ? 1 : 0;
				break;
			case " ":
				player.keys.jump = down ? 1 : 0;				
				break;
		}
	};
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

function createTerrainHelper(mesh) {
	loader.loadTexture('../textures/seamless_grass.jpg', textures => {		
		const texture = textures[0];
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(100, 100);
		const material = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide});
		/*
		const color = Math.floor(Math.random() * (1 << 24));
		const material = new THREE.MeshLambertMaterial({ color: color, side: THREE.DoubleSide});			
		*/
		const data = mesh.userData;
		
		let geometry = new THREE.PlaneBufferGeometry(data.terrainWidthExtents, data.terrainDepthExtents, data.terrainWidth - 1, data.terrainDepth - 1);
		geometry.rotateX( - Math.PI / 2 );
		//geometry.rotateY(Math.PI);
		const vertices = geometry.attributes.position.array;
		for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3)			
			vertices[j + 1] = data.heightMap[i];	
		geometry.computeVertexNormals();
		
		let ground = new THREE.Mesh(geometry, material);
		ground.position.set(mesh.position.clone());
		ground.position.set(0,0,0);
		//ground.scale.set(1,1,1);
		ground.rotation.y = mesh.rotation.y;
		ground.rotation.z = mesh.rotation.z;	
		
		ground.castShadow = false;
		ground.receiveShadow = true;
			
		ground.userData.terrainWidthExtents = data.terrainWidthExtents;
		ground.userData.terrainDepthExtents = data.terrainDepthExtents;
		ground.userData.terrainWidth = data.terrainWidth;
		ground.userData.terrainDepth = data.terrainDepth;
		ground.userData.terrainMinHeight = data.terrainMinHeight;
		ground.userData.terrainMaxHeight = data.terrainMaxHeight;		
		ground.userData.heightMap = data.heightMap;
				
		scene.add(ground);
		physics.addTerrain(ground);	
	});	
};

function createTerrain() {
	/*
	new Terrain(loader, terrain => {
		physics.addTerrain(terrain);
		scene.add(terrain);	
	});	
	*/
	
	loader.loadModel('../models/teren.glb', gltf => { 
		let ground = gltf.scene.children[0];
		ground.scale.set(glScale, glScale, glScale);
		ground.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			//if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		ground.position.set(0, -5, 0);				
		ground.rotation.y = Math.PI * -15.7 / 180 ;
		
		const geometry = ground.geometry;
		const vertices = geometry.attributes.position.array;
		let heightMap = [];
		let terrainMinHeight, terrainMaxHeight;
		
		ground.userData.terrainWidth = 101;
		ground.userData.terrainDepth = 101;
		ground.userData.terrainWidthExtents = 84.32;
		ground.userData.terrainDepthExtents = 138.24;
		let segmentWidth = ground.userData.terrainWidthExtents / ground.userData.terrainWidth;
		let segmentDepth = ground.userData.terrainDepthExtents / ground.userData.terrainDepth;
		
		let halfTerrainWidthExtents = ground.userData.terrainWidthExtents / 2;
		let halfTerrainDepthExtents = ground.userData.terrainDepthExtents / 2;
		
		let sorted = false;
		
		for (let i = 0; i < vertices.length; i += 3) {
			let x = vertices[i];
			let y = vertices[i + 1];
			let z = vertices[i + 2];
			terrainMinHeight = terrainMinHeight === undefined ? y : Math.min(terrainMinHeight, y);
			terrainMaxHeight = terrainMaxHeight === undefined ? y : Math.max(terrainMaxHeight, y);			
			let xIndex = Math.floor((x + halfTerrainWidthExtents) / segmentWidth);
			let zIndex = Math.floor((z + halfTerrainDepthExtents) / segmentDepth);
			let index = xIndex + zIndex * ground.userData.terrainWidth;
			if (sorted) {
				heightMap.push({x: x, y: y, z: z});
			} else {
				heightMap[index] = y;
			}
		}	
		if (sorted) {	
			heightMap.sort((a, b) => {
				let aOrder = a.x + a.z * ground.userData.terrainWidthExtents;
				let bOrder = b.x + b.z * ground.userData.terrainWidthExtents;
				if (aOrder > bOrder) return 1;
				if (aOrder < bOrder) return -1;
				return 0;			
			});			
			for (let i = 0; i < heightMap.length; i++)
				heightMap[i] = heightMap[i].y;
		} else {
			for (let i = 0; i < vertices.length / 3; i++) {
				if (heightMap[i] === undefined)
					heightMap[i] = -2;
			}
		}		
				
		ground.userData.terrainMinHeight = terrainMinHeight;
		ground.userData.terrainMaxHeight = terrainMaxHeight;		
		ground.userData.heightMap = heightMap;
		
		createTerrainHelper(ground);
				
		scene.add(ground);				
	});	
};

function createPlayer() {
	let lastPos = new THREE.Vector3();
	lastPos.x = cookieUtils.getCookieNumber('camposx') || 0;
	lastPos.y = cookieUtils.getCookieNumber('camposy') || 10;
	lastPos.z = cookieUtils.getCookieNumber('camposz') || 0;
	let lastRot = new THREE.Vector3();
	camera.rotation.x = cookieUtils.getCookieNumber('camrotx') || 0;
	camera.rotation.y = cookieUtils.getCookieNumber('camroty') || 0;
	camera.rotation.z = cookieUtils.getCookieNumber('camrotz') || 0;
	lastPos = new THREE.Vector3(0,10,0);
	player = new Player(info, camera, physics, lastPos);	
	scene.add(player.mesh);
};

function init() {
	document.body.appendChild(stats.dom);
	// atributy:  field of view, aspect ratio, near, far
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);		
	
	scene = new THREE.Scene();		
	scene.background = new THREE.Color(0xdddddd);			
	
	if (showHelpers) 
		scene.add(new THREE.AxesHelper(500));
	
	renderer = new THREE.WebGLRenderer({
		antialias: true,
		powerPreference: "high-performance",
		preserveDrawingBuffer: false,
	});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize);			
	
	info.addInfoSource(function() {
		const cp = camera.position, px = cp.x, py = cp.y, pz = cp.z;
		const cr = camera.rotation, rx = cr.x, ry = cr.y, rz = cr.z;
		let flr = Math.floor;
		// TODO tohle intervalové ukládání by nemělo být svázáno s intervalem info výpisů
		cookieUtils.setCookie('camposx', px).setCookie('camposy', py).setCookie('camposz', pz);
		cookieUtils.setCookie('camrotx', rx).setCookie('camroty', ry).setCookie('camrotz', rz);
		return "Camera = pos[x: " + flr(px) + " y: " + flr(py) + " z: " + flr(pz) + "]" + 
			" rot[" + flr(rx) + " y: " + flr(ry) + " z: " + flr(rz) + "]" ;		
	});
	
	createControls();
	createLight();
	
	createTerrain();
	/*
	createSkybox();
	createStaryBarak();	
	*/
	createFlag();
	
	//createStozar();	
	//createTents();
	/*
	//createGrid();
	//createTree();
	//createOakTrees();
	createPineTree();
	createPineTree2();
	//createLowPolyTree();
	createRealisticTree();
	
	createLowPolyXmasTree();
	createSmallTree();
	*/
	
	loader.performLoad(() => {
		createPlayer();
		animate(0);	
	});
	
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);	
}

function animate(now) {
	requestAnimationFrame(animate);
	flag.animate(now);
	render();
	stats.update();
}

function render() {
	const delta = clock.getDelta();	
	player.movePlayer(delta);
	physics.updatePhysics(delta);
	renderer.clear();
	renderer.render(scene, camera);	
	info.update(delta);	
};
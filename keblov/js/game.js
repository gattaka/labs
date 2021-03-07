import { CookieUtils } from './CookieUtils.js';
import { Stats } from './Stats.js';
import { Info } from './Info.js';
import { PointerLockControls } from './PointerLockControls.js';
import { GLTFLoader } from './GLTFLoader.js';
import { Cloth } from './Cloth.js';
import { Physics } from './Physics.js';
import { Terrain } from './Terrain.js';
import { Player } from './Player.js';
import * as THREE from './three.module.js';

const showHelpers = false;

let camera, scene, renderer, controls;
let flag;
let player;

const info = new Info();
const clock = new THREE.Clock();
const stats = new Stats();
const physics = new Physics.processor(init);
const cookieUtils = new CookieUtils();

// https://redstapler.co/create-3d-world-with-three-js-and-skybox-technique/
// https://opengameart.org/content/skiingpenguins-skybox-pack
function createSkybox() {
	let materialArray = [];
	let texture_ft = new THREE.TextureLoader().load('../textures/skybox/posx.jpg');
	let texture_bk = new THREE.TextureLoader().load('../textures/skybox/negx.jpg');
	let texture_up = new THREE.TextureLoader().load('../textures/skybox/posy.jpg');
	let texture_dn = new THREE.TextureLoader().load('../textures/skybox/negy.jpg');
	let texture_rt = new THREE.TextureLoader().load('../textures/skybox/posz.jpg');
	let texture_lf = new THREE.TextureLoader().load('../textures/skybox/negz.jpg');
	  
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_ft }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_bk }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_up }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_dn }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_rt }));
	materialArray.push(new THREE.MeshBasicMaterial({ map: texture_lf }));
	   
	for (let i = 0; i < 6; i++)
	  materialArray[i].side = THREE.BackSide;
	   
	let side = 10000;
	let skyboxGeo = new THREE.BoxGeometry(side, side, side);
	let skybox = new THREE.Mesh(skyboxGeo, materialArray);
	skybox.position.set(0, 0, 0);
	scene.add(skybox);
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
	new GLTFLoader().load('../models/' + name, gltf => { 
		let model = gltf.scene.children[0];
		model.scale.set(sc, sc, sc);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
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
	const sc = 10;
	let bx = -150;
	let by = 1;
	let bz = 0;
	loadModel(scene, 'keblov_stary.glb', sc, bx, by, bz, [{x: 0, y: 0, z: 0, r: 3 * Math.PI/2}], true);	
	by += 5;	
	loadModel(scene, 'keblov_stary_zdi.glb', sc, bx, by, bz, [{x: 0, y: 0, z: 0, r: 3 * Math.PI/2}], false);	
	const variants = [
		{x: -9.62, y: 0.33, z: -0.37, r: 0},
		{x: -11.33, y: 0.33, z: -0.37, r: 0},
		{x: -10.82, y: 0.33, z: 1.68, r: Math.PI/2},
		{x: -10.82, y: 0.33, z: 2.59, r: Math.PI/2},
	];
	loadModel(scene, 'postel.glb', sc, bx, by, bz, variants, true);			
	loadModel(scene, 'kamna.glb', sc, bx, by, bz, [{x: -9.11, y: 0.74, z: 0.93, r: -Math.PI/2}], true);	
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
	loadModel(scene, 'sportak_skrin3.glb', sc, bx, by, bz, [{x: -4.57, y: 0.61, z: -0.27, r: -Math.PI/2}], true);
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
		const sc = 30;
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
		const sc = 30;
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
	const loader = new THREE.TextureLoader();
	const clothTexture = loader.load('../textures/vlajka.png');
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
};

function createStozar() {
	const texture = new THREE.TextureLoader().load('../textures/stozar.jpg');
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
}

function createTents() {
	// modely musí mít počátek uprostřed své výšky a obsahu, 
	// jinak boundingbox přepočet na Ammo kolizní box bude dělat problémy
	new GLTFLoader().load('../models/stan.glb', gltf => { 
		let model = gltf.scene.children[0];
		model.scale.set(10,10,10);
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
		// západní řada 8 stanů
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

	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;

	const d = 300;
	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;

	dirLight.shadow.camera.far = 500;
	dirLight.shadow.bias = - 0.0001;	

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
	controls = new PointerLockControls(camera, document.body);	
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

function init() {
	document.body.appendChild(stats.dom);
	// atributy:  field of view, aspect ratio, near, far
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);	
	
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
	
	createSkybox();
	createControls();
	createLight();
	
	createFlag();
	createStozar();	
	createTents();
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
	createStaryBarak();
	
	let terrain = new Terrain(physics);
	scene.add(terrain);	
	
	let lastPos = new THREE.Vector3();
	lastPos.x = cookieUtils.getCookieNumber('camposx') || 0;
	lastPos.y = cookieUtils.getCookieNumber('camposy') || 10;
	lastPos.z = cookieUtils.getCookieNumber('camposz') || 0;
	let lastRot = new THREE.Vector3();
	camera.rotation.x = cookieUtils.getCookieNumber('camrotx') || 0;
	camera.rotation.y = cookieUtils.getCookieNumber('camroty') || 0;
	camera.rotation.z = cookieUtils.getCookieNumber('camrotz') || 0;
	player = new Player(info, camera, physics, lastPos);	
	scene.add(player.mesh);

	animate(0);	
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
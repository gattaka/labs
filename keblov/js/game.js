import { PointerLockControls } from './PointerLockControls.js';
import { GLTFLoader } from './GLTFLoader.js';
import { Stats } from './stats.module.js';
import { Cloth } from './cloth.module.js';
import * as THREE from './three.module.js';

const infoDiv = document.getElementById("info");

const clock = new THREE.Clock();
const stats = new Stats();

const walkSpeed = 30;

const infoDelay = .1;
let infoCooldown = infoDelay;

let camera, scene, renderer, controls;
let terrain;
let mesh;
let flag;

init();
animate(0);

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

function createTerrain() {	
	const texture = new THREE.TextureLoader().load('../textures/grass.jpg');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1000, 1000);
	const geometry = new THREE.PlaneGeometry(100, 100);		
	const material = new THREE.MeshLambertMaterial({ map: texture });
	const ground = new THREE.Mesh(geometry, material);
	ground.position.set(0, 0, 0);
	ground.rotation.x = -Math.PI / 2;
	ground.scale.set(100, 100, 100);
	ground.castShadow = false;
	ground.receiveShadow = true;
	scene.add(ground);
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
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		scene.add(model);
	});		
};

function createFlag() {
	const loader = new THREE.TextureLoader();
	const clothTexture = loader.load( '../textures/vlajka.png' );
	clothTexture.anisotropy = 16;
	const clothMaterial = new THREE.MeshLambertMaterial( {
		map: clothTexture,
		side: THREE.DoubleSide,
		alphaTest: 0.5
	});
	flag = new Cloth(clothMaterial);	
	flag.position.set(109.5, 65, 107);
	const scale = 0.1;
	flag.scale.set(scale, scale, scale);
	scene.add(flag);	
};

function createStozar() {
	const texture = new THREE.TextureLoader().load('../textures/stozar.png');
	const geometry = new THREE.CylinderGeometry( .2, .7, 200, 16 );
	const material = new THREE.MeshLambertMaterial({map: texture});
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(97, 0, 107);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.scale.set(1, 1, 1);
	scene.add(mesh);
}

function createTents() {
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
		// severní řada 9 stanů
		for (let i = 0; i < 9; i++) {			
			let tent = model.clone();
			tent.position.set(25 * i, -1, -20);
			scene.add(tent);
		}
		// západní řada 8 stanů
		for (let i = 0; i < 8; i++) {			
			if (i == 3) continue;
			let tent = model.clone();
			tent.rotateZ(Math.PI/2);
			tent.position.set(250, -1, 20 + i * 25);
			scene.add(tent);
		}
		// jižní řada 13 stanů
		for (let i = 0; i < 13; i++) {			
			let tent = model.clone();
			tent.rotateZ(Math.PI);
			tent.position.set(210 - 25 * i, -1, 230);
			scene.add(tent);
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
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
	hemiLight.color = new THREE.Color("hsl(58, 100%, 80%)");
	hemiLight.groundColor = new THREE.Color("hsl(83, 63%, 10%)");
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
	scene.add(hemiLightHelper);

	const dirLight = new THREE.DirectionalLight(0xffffff, .7);	
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

	const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
	scene.add(dirLightHelper);
	
	// Create a helper for the shadow camera (optional)
	const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
	scene.add(cameraHelper);
}

// https://threejs.org/docs/#examples/en/controls/PointerLockControls
// https://sbcode.net/threejs/pointerlock-controls/
function createControls() {
	controls = new PointerLockControls(camera, document.body);
	controls.forwardSpeed = 0;
	controls.rightSpeed = 0;
	controls.backSpeed = 0;
	controls.leftSpeed = 0;
	document.body.addEventListener('click', function () {
		controls.lock();
	}, false);
	
	const onKeyDown = function (event) { onKeyChange(event, true) };
	const onKeyUp = function (event) { onKeyChange(event, false) };
	const onKeyChange = function (event, down) {
		switch (event.key) {
			case "w":
				controls.forwardSpeed = down ? walkSpeed : 0;
				break;
			case "a":
				controls.rightSpeed = down ? walkSpeed : 0;
				break;
			case "s":
				controls.backSpeed = down ? walkSpeed : 0;
				break;
			case "d":
				controls.leftSpeed = down ? walkSpeed : 0;
				break;
		}
	};
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

function init() {
	document.body.appendChild(stats.dom);
	
	// atributy:  field of view, aspect ratio, near, far
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.x = 95;
	camera.position.y = 10;
	camera.position.z = 160;
	
	scene = new THREE.Scene();		
	scene.background = new THREE.Color(0xdddddd);			
	
	scene.add(new THREE.AxesHelper(500));
	
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize);			
	
	createControls();
	
	createLight();
	
	createFlag();
	createSkybox();
	createTerrain();
	//createBox();
	createTree();
	createTents();
	//createGrid();
	createStozar();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);	
}

function animate(now) {
	requestAnimationFrame(animate);
	flag.animate(now);
	render(now);
	stats.update();
}

function updateInfo(delta) {
	infoCooldown -= delta;
	if (infoCooldown <= 0) {	
		infoDiv.innerText = "Camera = pos[x: " + Math.floor(camera.position.x) + " y: " + Math.floor(camera.position.y) + " z: " + Math.floor(camera.position.z) + "]" + " rot[" + Math.floor(camera.rotation.x) + " y: " + Math.floor(camera.rotation.y) + " z: " + Math.floor(camera.rotation.z) + "]" ;
		infoCooldown = infoDelay;		
	}
}

function render(now) {
	const delta = clock.getDelta();
	controls.moveForward((controls.forwardSpeed - controls.backSpeed) * delta);
	controls.moveRight((controls.leftSpeed - controls.rightSpeed) * delta);
	renderer.clear();
	renderer.render(scene, camera);	
	updateInfo(delta);	
}
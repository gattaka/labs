import { PointerLockControls } from './PointerLockControls.js';
import { GLTFLoader } from './GLTFLoader.js';
import { Stats } from './stats.module.js';
import * as THREE from './three.module.js';

const clock = new THREE.Clock();
const stats = new Stats();

const walkSpeed = 20;

let camera, scene, renderer, controls;
let terrain;
let mesh;

init();
animate();

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

function createPlayer() {
	new GLTFLoader().load('../models/Cesium_Man.glb', result => { 
		let model = result.scene.children[0]; 
		//model.position.set(0,-5,-25);
		model.position.set(0,0,0);
		model.scale.set(5, 5, 5);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		scene.add(model);
	});			
}

function createGrid() {
	const size = 100;
	const divisions = 100;

	const gridHelper = new THREE.GridHelper(size, divisions);
	scene.add(gridHelper);
}

function createBox() {
	const texture = new THREE.TextureLoader().load('../textures/osetrovna_podokno.gif');
	const geometry = new THREE.BoxGeometry(10, 10, 10);
	const material = new THREE.MeshLambertMaterial({map: texture});
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(10, 0, 10);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.scale.set(1, 1, 1);
	scene.add(mesh);
}

// https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow
// https://threejs.org/examples/webgl_lights_hemisphere.html
// https://stackoverflow.com/questions/15478093/realistic-lighting-sunlight-with-three-js
// https://threejs.org/docs/#api/en/math/Color.setHSL
function createLight() {
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
	hemiLight.color = new THREE.Color("hsl(58, 100%, 80%)");
	hemiLight.groundColor = new THREE.Color("hsl(83, 63%, 10%)");
	hemiLight.position.set(0, 50, 0);
	scene.add( hemiLight );

	const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
	scene.add(hemiLightHelper);

	const dirLight = new THREE.DirectionalLight(0xffffff, 1);	
	dirLight.color = new THREE.Color("hsl(58, 100%, 100%)");
	dirLight.position.set(-1, 1.75, 1);
	dirLight.position.multiplyScalar(30);
	scene.add(dirLight);

	dirLight.castShadow = true;

	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;

	const d = 50;

	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;

	dirLight.shadow.camera.far = 3500;
	dirLight.shadow.bias = - 0.0001;

	const dirLightHelper = new THREE.DirectionalLightHelper( dirLight, 10 );
	scene.add( dirLightHelper );
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
	camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.z = 100;
	camera.position.y = 10;
	camera.position.z = 20;
	
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
	createTerrain();
	createBox();
	createPlayer();
	//createGrid();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);	
}

function animate() {
	requestAnimationFrame(animate);
	render();
	stats.update();
}

function render() {
	const delta = clock.getDelta();
	controls.moveForward((controls.forwardSpeed - controls.backSpeed) * delta);
	controls.moveRight((controls.leftSpeed - controls.rightSpeed) * delta);
	renderer.clear();
	renderer.render(scene, camera);
}
animate();
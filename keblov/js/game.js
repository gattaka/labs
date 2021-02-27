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
	const geometry = new THREE.PlaneGeometry( 100, 100 );
	const planeMaterial = new THREE.MeshPhongMaterial( { color: 0xffb851 } );

	const ground = new THREE.Mesh( geometry, planeMaterial );

	ground.position.set( 0, 0, -2 );
	ground.rotation.x = - Math.PI / 2;
	ground.scale.set( 100, 100, 100 );

	ground.castShadow = false;
	ground.receiveShadow = true;
	scene.add( ground );
}

function createPlayer() {
	new GLTFLoader().load('../models/Cesium_Man.glb', result => { 
		let model = result.scene.children[0]; 
		//model.position.set(0,-5,-25);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		scene.add(model);
	});			
}

function createBox() {
	const texture = new THREE.TextureLoader().load('../textures/osetrovna_podokno.gif');
	const geometry = new THREE.BoxGeometry(200, 200, 200);
	const material = new THREE.MeshBasicMaterial({map: texture});
	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);
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
	
	let hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
	scene.add(hemiLight);

	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize);			
	
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
	
	createTerrain();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls.handleResize();
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
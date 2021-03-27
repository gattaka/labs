import { Config } from './Config.js';
import { CookieUtils } from './CookieUtils.js';
import { Stats } from './Stats.js';
import { Info } from './Info.js';
import { Controls } from './Controls.js';
import { Physics } from './Physics.js';
import { ScenePhysicsBlueprint } from './ScenePhysicsBlueprint.js';
import { Terrain } from './Terrain.js';
import { Skybox } from './Skybox.js';
import { Lights } from './Lights.js';
import { Trees } from './Trees.js';
import { House } from './House.js';
import { Outhouse } from './Outhouse.js';
import { Hangar } from './Hangar.js';
import { Tents } from './Tents.js';
import { Flagpole } from './Flagpole.js';
import { Player } from './Player.js';
import { Loader } from './Loader.js';
import { VirtualJoystick } from './VirtualJoystick.js';
import { ItemManager } from './ItemManager.js';
import * as THREE from './three.module.js';

const showHelpers = Config.showScHelpers;
const savePlayerPosition = Config.savePlayerPosition;
const resolutionDivider = Config.resolutionDivider;

let camera, scene, renderer, controls;
let animateCallbacks = [];
let player;

const info = new Info();
const loader = new Loader(info);
const clock = new THREE.Clock();
const stats = new Stats();
const physics = new Physics.processor(init);
const cookieUtils = new CookieUtils();
const itemManager = new ItemManager(loader, physics);

let loadModel = itemManager.construct;

let KDebug = {
	instances: {},	
};
document.KDebug = KDebug;

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
			case "W":
				player.keys.forward = down ? 1 : 0;
				break;
			case "a":
			case "A":
				player.keys.right = down ? 1 : 0;
				break;
			case "s":
			case "S":
				player.keys.back = down ? 1 : 0;
				break;
			case "d":
			case "D":
				player.keys.left = down ? 1 : 0;
				break;
			case " ":
				player.keys.jump = down ? 1 : 0;				
				break;
			case "Shift":
				player.keys.sprint = down ? 1 : 0;				
				break;
			case "c":
			case "C":
				if (down)
					player.resetPosition();
				break;
				/*
			case "e":
			case "E":
				if (selectedMesh !== undefined && selectedMesh.userData.hinge !== undefined) {
					// https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=2693					
					selectedMesh.userData.physicsBody.applyImpulse(new Ammo.btVector3(1, 0, 1), new Ammo.btVector3(0, 0, 0));
					selectedMesh.userData.physicsBody.activate();
				}
				break;
				*/
		}
	};
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

function createPlayer() {
	let lastPos = new THREE.Vector3();
	lastPos.x = cookieUtils.getCookieNumber('camposx') || 0;
	lastPos.y = cookieUtils.getCookieNumber('camposy') || 0;
	lastPos.z = cookieUtils.getCookieNumber('camposz') || 0;
	let lastRot = new THREE.Vector3();
	camera.rotation.x = cookieUtils.getCookieNumber('camrotx') || 0;
	camera.rotation.y = cookieUtils.getCookieNumber('camroty') || 0;
	camera.rotation.z = cookieUtils.getCookieNumber('camrotz') || 0;		
	player = new Player(info, camera, physics, lastPos);	
	if (!savePlayerPosition) 
		player.resetPosition();
	if (player.mesh !== undefined)
		scene.add(player.mesh);
};

function init() {
	document.body.appendChild(stats.dom);
	// atributy:  field of view, aspect ratio, near, far
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 400);		
	
	scene = new THREE.Scene();		
	scene.background = new THREE.Color(0xdddddd);			
	
	if (showHelpers) 
		scene.add(new THREE.AxesHelper(500));
	
	renderer = new THREE.WebGLRenderer({
		antialias: false,
		powerPreference: "high-performance",
		preserveDrawingBuffer: false,
		physicallyCorrectLights: false,
	});
	
	if (Config.threejsApiResize) {		
		renderer.setPixelRatio(window.devicePixelRatio / resolutionDivider);
		renderer.setSize(window.innerWidth, window.innerHeight);
	} else {
		renderer.setSize(window.innerWidth / resolutionDivider, window.innerHeight / resolutionDivider);
		document.body.appendChild(renderer.domElement);
		renderer.domElement.style.width = renderer.domElement.width * resolutionDivider + 'px';
		renderer.domElement.style.height = renderer.domElement.height * resolutionDivider + 'px';
	}
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
	document.body.appendChild(renderer.domElement);
	window.addEventListener('resize', onWindowResize);			
	
	info.addInfoSource(function() {
		const pp = player.getPosition(), px = pp.x(), py = pp.y(), pz = pp.z();
		const cr = camera.rotation, rx = cr.x, ry = cr.y, rz = cr.z;
		let flr = Math.floor;
		// TODO tohle intervalové ukládání by nemělo být svázáno s intervalem info výpisů
		cookieUtils.setCookie('camposx', px).setCookie('camposy', py).setCookie('camposz', pz);
		cookieUtils.setCookie('camrotx', rx).setCookie('camroty', ry).setCookie('camrotz', rz);
		return "Camera = pos[x: " + flr(px) + " y: " + flr(py) + " z: " + flr(pz) + "]" + 
			" rot[" + flr(rx) + " y: " + flr(ry) + " z: " + flr(rz) + "]" ;		
	});
	
	createControls();
	Lights.create(scene);
	
	Skybox.create(loader, scene);
	Terrain.create(loader, physics, scene);
	Flagpole.create(loader, physics, scene, animateCallbacks);
		
	Tents.create(itemManager, scene, KDebug);
	Hangar.create(itemManager, scene, KDebug);
	Trees.create(itemManager, scene, KDebug);	
	House.create(itemManager, scene, KDebug);	
	Outhouse.create(itemManager, scene, KDebug);

	if (Config.useCompiledPhysics) ScenePhysicsBlueprint.build(scene, physics);		
	
	loader.performLoad(() => {
		createPlayer();
		animate(0);	
	});	
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();	
	renderer.setSize(window.innerWidth, window.innerHeight);	
};

function animate(now) {
	requestAnimationFrame(animate);
	const delta = clock.getDelta();	
	
	physics.updatePhysics(delta, 10);
	player.update(delta);
	
	animateCallbacks.forEach(c => c.animate(now));

	renderer.clear();
	renderer.render(scene, camera);	
	
	info.update(delta);	
	stats.update();	
}

export { KDebug };
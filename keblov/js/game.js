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

const startPos = new THREE.Vector3(-6.98729133605957, 1.7499996423721313, 2.3810875415802);
const startRot = new THREE.Vector3(0.1252434889107173, 0.5723312354046406, -0.06808254378135847);

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
	if (VirtualJoystick.touchScreenAvailable()) {
		createTouchscreenControls();
	} else {
		createMouseAndKeyboardControls();
	}
}

function createTouchscreenControls() {
	console.log("Creating TouchscreenControls");
	
	let walkJoystick = new VirtualJoystick({
		container: document.body,
		strokeStyle: 'cyan',
		limitStickTravel: true,
		stickRadius: 120,	
	});
	walkJoystick.addEventListener('touchStartValidation', function(event) {
		let touch = event.changedTouches[0];
		if (touch.pageX >= window.innerWidth / 2) return false;
		return true;
	});

	// one on the right of the screen
	let lookJoystick = new VirtualJoystick({
		container	: document.body,
		strokeStyle	: 'orange',
		limitStickTravel: true,
		stickRadius	: 120		
	});
	lookJoystick.addEventListener('touchStartValidation', function(event){
		let touch	= event.changedTouches[0];
		if (touch.pageX < window.innerWidth / 2) return false;
		return true;
	});
	
	const PI_2 = Math.PI / 2;
	const minPolarAngle = 0; // radians
	const maxPolarAngle = Math.PI; // radians	
	const euler = new THREE.Euler(0, 0, 0, 'YXZ');
	setInterval(function(){
		if (player !== undefined) {
			player.keys.forward = walkJoystick.up() ? 1 : 0;
			player.keys.right = walkJoystick.left() ? 1 : 0;
			player.keys.back = walkJoystick.down() ? 1 : 0;
			player.keys.left = walkJoystick.right() ? 1 : 0;
		}
		
		euler.setFromQuaternion(camera.quaternion);
		euler.y -= lookJoystick.deltaX() * 0.0004;
		euler.x -= lookJoystick.deltaY() * 0.0004;
		euler.x = Math.max(PI_2 - maxPolarAngle, Math.min(PI_2 - minPolarAngle, euler.x));
		camera.quaternion.setFromEuler(euler);
		
	}, 1/30 * 1000);
};

function createMouseAndKeyboardControls() {	
	console.log("Creating MouseAndKeyboardControls");
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
			case "ArrowUp":
				player.keys.forward = down ? 1 : 0;
				break;
			case "a":
			case "A":
			case "ArrowLeft":
				player.keys.right = down ? 1 : 0;
				break;
			case "s":
			case "S":
			case "ArrowDown":
				player.keys.back = down ? 1 : 0;
				break;
			case "d":
			case "D":
			case "ArrowRight":
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
		}
	};
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

function createPlayer() {
	let lastPos = new THREE.Vector3();
	lastPos.x = cookieUtils.getCookieNumber('camposx') || startPos.x;
	lastPos.y = cookieUtils.getCookieNumber('camposy') || startPos.y;
	lastPos.z = cookieUtils.getCookieNumber('camposz') || startPos.z;
	let lastRot = new THREE.Vector3();
	camera.rotation.x = cookieUtils.getCookieNumber('camrotx') || startRot.x;
	camera.rotation.y = cookieUtils.getCookieNumber('camroty') || startRot.y;
	camera.rotation.z = cookieUtils.getCookieNumber('camrotz') || startRot.z;
	player = new Player(info, camera, physics, lastPos, startPos, startRot);	
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
	
	createControls();
	
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
	
	//info.update(delta);	
	stats.update();	
}

export { KDebug };
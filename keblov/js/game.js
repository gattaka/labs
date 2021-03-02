import { PointerLockControls } from './PointerLockControls.js';
import { GLTFLoader } from './GLTFLoader.js';
import { Stats } from './stats.module.js';
import { Cloth } from './cloth.module.js';
import * as THREE from './three.module.js';

const infoDiv = document.getElementById("info");

const clock = new THREE.Clock();
const stats = new Stats();

const showHelpers = false;
const walkSpeed = 30;

const infoDelay = .1;
let infoCooldown = infoDelay;

let camera, scene, renderer, controls;
let terrain;
let mesh;
let flag;

init();
animate(0);

function setCookie(name,value) {
    var expires = "";    
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

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
	const texture = new THREE.TextureLoader().load('../textures/seamless_grass.jpg');
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

function createStaryBarak() {
	new GLTFLoader().load('../models/keblov_stary.glb', result => { 
		let model = result.scene.children[0]; 		
		model.position.set(-300, 1, 0);
		const sc = 10;
		model.scale.set(sc,sc,sc);
		model.rotation.y = 3 * Math.PI/2;
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		scene.add(model);
	});		
	new GLTFLoader().load('../models/keblov_stary_zdi.glb', result => { 
		let model = result.scene.children[0]; 		
		model.position.set(-300, 0, 0);
		const sc = 10;
		model.scale.set(sc,sc,sc);
		model.rotation.y = 3 * Math.PI/2;
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
		}});
		scene.add(model);
	});		
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
	const clothTexture = loader.load( '../textures/vlajka.png' );
	clothTexture.anisotropy = 16;
	const clothMaterial = new THREE.MeshLambertMaterial( {
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
/*	
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9);
	hemiLight.color = new THREE.Color("hsl(58, 70%, 80%)");
	hemiLight.groundColor = new THREE.Color("hsl(83, 20%, 70%)");
	hemiLight.position.set(0, 20, 0);
	scene.add(hemiLight);

	const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
	scene.add(hemiLightHelper);
*/	
	scene.add( new THREE.AmbientLight(0x999999));

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
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.x = Number(getCookie('camposx')) || 0;
	camera.position.y = Number(getCookie('camposy')) || 10;
	camera.position.z = Number(getCookie('camposz')) || 0;
	camera.rotation.x = Number(getCookie('camrotx')) || 0;
	camera.rotation.y = Number(getCookie('camroty')) || 0;
	camera.rotation.z = Number(getCookie('camrotz')) || 0;
	
	scene = new THREE.Scene();		
	scene.background = new THREE.Color(0xdddddd);			
	
	if (showHelpers) 
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
	createTents();
	//createGrid();
	createStozar();
	//createTree();
	//createOakTrees();
	createPineTree();
	createPineTree2();
	//createLowPolyTree();
	createRealisticTree();
	
	createLowPolyXmasTree();
	createSmallTree();
	
	createStaryBarak();
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
		const posx = camera.position.x;
		const posy = camera.position.y;
		const posz = camera.position.z;
		const rotx = camera.rotation.x;
		const roty = camera.rotation.y;
		const rotz = camera.rotation.z;
		infoDiv.innerText = "Camera = pos[x: " + Math.floor(posx) + " y: " + Math.floor(posy) + " z: " + Math.floor(posz) + "]" + " rot[" + Math.floor(rotx) + " y: " + Math.floor(roty) + " z: " + Math.floor(rotz) + "]" ;
		infoCooldown = infoDelay;	
		setCookie('camposx',posx);
		setCookie('camposy',posy);
		setCookie('camposz',posz);
		setCookie('camrotx',rotx);
		setCookie('camroty',roty);
		setCookie('camrotz',rotz);
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
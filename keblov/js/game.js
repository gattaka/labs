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
const savePlayerPosition = Config.savePlayerPosition;
const resolutionDivider = Config.resolutionDivider;

let camera, scene, renderer, controls;
let flag;
let player;

const info = new Info();
const loader = new Loader(info);
const clock = new THREE.Clock();
const stats = new Stats();
const physics = new Physics.processor(init);
const cookieUtils = new CookieUtils();

let KDebug = {	
};
document.KDebug = KDebug;

// https://redstapler.co/create-3d-world-with-three-js-and-skybox-technique/
// https://opengameart.org/content/skiingpenguins-skybox-pack
function createSkybox() {		
	let callback = function(textures) {
		let materialArray = [];
		textures.forEach(t => {
			let m = new THREE.MeshBasicMaterial({ map: t });
			m.side = THREE.BackSide;
			materialArray.push(m);
			let side = 400;
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

function loadModel(scene, name, sc, variants, asPhysicsBody, onCreateCallback) {
	loader.loadModel('../models/' + name, gltf => { 
		let model = gltf.scene.children[0];
		model.scale.set(sc, sc, sc);
		model.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			if (n.material.map) n.material.map.anisotropy = 1; 
			if (n.material) {			
				n.material.metalness = 0;
				n.material.roughness = 1;				
			}
		}});
		const box = processBoundingBox(model);
		variants.forEach(v => {
			let instance = model.clone();
			// JS - Blender
			// x = x
			// y = z
			// z = y
			instance.position.set(v.x * sc, v.z * sc, -v.y * sc);
			instance.rotation.y = v.r;
			if (v.ry !== undefined) instance.rotation.z = v.ry;
			scene.add(instance);
			if (asPhysicsBody)
				physics.addMeshObsticle(instance, scene, true, box.min, box.max);	
			if (onCreateCallback !== undefined)
				onCreateCallback(instance);
		});
	});
};

function toRad(degree) {
	return Math.PI * degree / 180;
};

function createStaryBarak() {	
	const sc = glScale;
	let br = toRad(16.0526);
	
	loadModel(scene, 'beton_schod1.glb', sc, [{x: -3.133, y: -2.091, z: 0.66, r: br}], true);
	loadModel(scene, 'beton_schod2.glb', sc, [{x: -1.932, y: -1.745, z: 0.594, r: br}], true);
	loadModel(scene, 'beton_schod3.glb', sc, [{x: -1.451, y: -1.607, z: 0.527, r: br}], true);
	loadModel(scene, 'beton_schod4.glb', sc, [{x: -0.971, y: -1.469, z: 0.459, r: br}], true);
	loadModel(scene, 'beton_schod5.glb', sc, [{x: -0.490, y: -1.330, z: 0.391, r: br}], true);
	loadModel(scene, 'beton_schod6.glb', sc, [{x: -0.010, y: -1.192, z: 0.324, r: br}], true);
	
	loadModel(scene, 'keblov_stary.glb', sc, [{x: -7.316, y: -4.273, z: 0.64, r: br}], true);		
	
	loadModel(scene, 'keblov_stary_zdi_01.glb', sc, [{x: -4.025, y: -15.71, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_02.glb', sc, [{x: -10.838, y: -5.235, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_03.glb', sc, [{x: -13.528, y: 6.321, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_04.glb', sc, [{x: -12.644, y: 6.575, z: 3.207, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_05.glb', sc, [{x: -10.9, y: 7.077, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_06.glb', sc, [{x: -9.093, y: 7.597, z: 3.207, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_07.glb', sc, [{x: -7.867, y: 7.950, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_08.glb', sc, [{x: -5.742, y: 3.457, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_09.glb', sc, [{x: -4.068, y: -2.361, z: 3.207, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_10.glb', sc, [{x: -2.777, y: -6.849, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_11.glb', sc, [{x: -1.679, y: -10.664, z: 2.217, r: br}], false);
	loadModel(scene, 'keblov_stary_zdi_12.glb', sc, [{x: -1.036, y: -12.899, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_13.glb', sc, [{x: -3.343, y: -11.596, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_14.glb', sc, [{x: -1.694, y: -11.137, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_15.glb', sc, [{x: -2.038, y: -11.236, z: 3.207, r: br}], false);
	loadModel(scene, 'keblov_stary_zdi_16.glb', sc, [{x: -4.084, y: -12.111, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_17.glb', sc, [{x: -4.166, y: -12.639, z: 3.594, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_18.glb', sc, [{x: -5.215, y: -13.175, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_19.glb', sc, [{x: -3.124, y: -14.618, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_20.glb', sc, [{x: -5.963, y: -14.300, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_21.glb', sc, [{x: -6.728, y: -11.585, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_22.glb', sc, [{x: -7.789, y: -11.753, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_23.glb', sc, [{x: -8.544, y: -9.153, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_24.glb', sc, [{x: -3.143, y: -7.599, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_25.glb', sc, [{x: -5.171, y: -8.163, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_26.glb', sc, [{x: -5.785, y: -9.526, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_27.glb', sc, [{x: -5.136, y: -10.804, z: 3.605, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_28.glb', sc, [{x: -3.344, y: -10.575, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_29.glb', sc, [{x: -12.645, y: 3.287, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_30.glb', sc, [{x: -11.758, y: 5.556, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_31.glb', sc, [{x: -9.160, y: 5.934, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_32.glb', sc, [{x: -11.023, y: 2.626, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_33.glb', sc, [{x: -8.820, y: 4.388, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_34.glb', sc, [{x: -10.492, y: 0.795, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_35.glb', sc, [{x: -11.467, y: 0.567, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_36.glb', sc, [{x: -10.047, y: -0.751, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_37.glb', sc, [{x: -10.624, y: -1.802, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_38.glb', sc, [{x: -6.827, y: -0.725, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_39.glb', sc, [{x: -10.351, y: 0.305, z: 3.182, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_40.glb', sc, [{x: -10.631, y: 1.280, z: 3.182, r: br}], true);
	
	loadModel(scene, 'keblov_stary_strop_01.glb', sc, [{x: -7.830, y: -2.486, z: 3.297, r: br}], true);
	loadModel(scene, 'keblov_stary_strop_02.glb', sc, [{x: -2.959, y: -11.993, z: 3.297, r: br}], true);
	loadModel(scene, 'keblov_stary_strop_03.glb', sc, [{x: -7.407, y: -13.272, z: 3.297, r: br}], true);
	loadModel(scene, 'keblov_stary_strop_04.glb', sc, [{x: -4.417, y: -14.347, z: 3.297, r: br}], true);
	
	loadModel(scene, 'keblov_stary_puda_stit_zapad.glb', sc, [{x: -4.026, y: -15.707, z: 4.550, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_vychod.glb', sc, [{x: -10.61, y: 7.172, z: 4.550, r: br}], true);
	
	
	const strechaVariants = [
		{x: -5.382, y: -3.698, z: 4.484, r: toRad(196), ry: toRad(-58.7)},
		{x: -9.240, y: -4.811, z: 4.484, r: toRad(376), ry: toRad(-58.7)},
	];
	loadModel(scene, 'keblov_stary_strecha.glb', sc, strechaVariants, true);
	
	
	const posteleVariants = [
		{x: -1.827, y: -13.966, z: 1.477, r: br},
		{x: -2.697, y: -14.216, z: 1.477, r: br},
		{x: -4.546, y: -15.268, z: 1.477, r: toRad(106)},
		{x: -5.016, y: -13.633, z: 1.477, r: toRad(106)},
		{x: -8.130, y: 6.761, z: 1.477, r: br},
	];
	loadModel(scene, 'postel.glb', sc, posteleVariants, true);			
	loadModel(scene, 'kamna.glb', sc, [{x: -3.846, y: -12.937, z: 1.949, r: br}], true);	
	const stulPolovodiceVariants = [
		{x: -3.117, y: -12.05, z: 1.557, r: br},
		{x: -8.57, y: -9.665, z: 1.557, r: br}
	];
	loadModel(scene, 'stul_polovodice.glb', sc, stulPolovodiceVariants, true);
	loadModel(scene, 'dilna_police1.glb', sc, [{x: -7.388, y: -15.481, z: 2.044, r: br}], true);	
	loadModel(scene, 'dilna_junk.glb', sc, [{x: -7.996, y: -14.232, z: 1.644, r: br}], true);	
	loadModel(scene, 'dilna_police2.glb', sc, [{x: -8.177, y: -12.95, z: 2.015, r: br}], true);	
	loadModel(scene, 'dilna_police3.glb', sc, [{x: -6.114, y: -14.986, z: 1.804, r: br}], true);	
	const schodyVariants = {x: -5.427, y: -12.71, z: 2.206, r: br};
	loadModel(scene, 'schody.glb', sc, [schodyVariants], false);
	const schodVariants = [];
	const schod1 = {x: -4.62629, y: -12.479, z: 1.18457, r: br};
	const schod2 = {x: -4.80439, y: -12.5303, z: 1.41163, r: br};
	const xStep = schod2.x - schod1.x;
	const yStep = schod2.y - schod1.y;
	const zStep = schod2.z - schod1.z;
	for (let i = 0; i < 10; i++)
		schodVariants.push({x: schod1.x + i * xStep, y: schod1.y + i * yStep, z: schod1.z + i * zStep, r: schodyVariants.r});
	loadModel(scene, 'schod.glb', sc, schodVariants, true);
	loadModel(scene, 'sportak_skrin1.glb', sc, [{x: -5.778, y: -10.621, z: 1.931, r: br}], true);
	const sportakSkrin2Variants = [
		{x: -6.089, y: -9.538, z: 1.931, r: br},
		{x: -8.337, y: -11.598, z: 1.931, r: toRad(-73.9)},
	];
	loadModel(scene, 'sportak_skrin2.glb', sc, sportakSkrin2Variants, true);
	const sportakSkrin3Variants = [
		{x: -6.317, y: -8.745, z: 1.754, r: br},
		{x: -2.982, y: -7.247, z: 1.754, r: br},
	];
	loadModel(scene, 'sportak_skrin3.glb', sc, sportakSkrin3Variants, true);
	const lavickaLakovanaVariants = [	
		{x: -8.025, y: -8.227, z: 1.396, r: br},
		{x: -7.732, y: -6.817, z: 1.396, r: br},,
		{x: -8.712, y: -4.354, z: 1.396, r: br},
		{x: -8.925, y: -5.817, z: 1.396, r: toRad(106)},
	];
	loadModel(scene, 'lavicka_lakovana.glb', sc, lavickaLakovanaVariants, true);			
	const stulJidelnaVariants = [
		{x: -7.4435, y: -7.423, z: 1.551, r: br},
		{x: -8.230, y: -7.649, z: 1.551, r: br},
		{x: -9.021, y: -7.877, z: 1.551, r: br},
		{x: -9.248, y: -7.09, z: 1.551, r: br},
		{x: -9.474, y: -6.302, z: 1.551, r: br},
		{x: -9.702, y: -5.512, z: 1.551, r: br},
		{x: -9.929, y: -4.724, z: 1.551, r: br},
		{x: -10.157, y: -3.932, z: 1.551, r: br},
		{x: -9.367, y: -3.705, z: 1.551, r: br},
		{x: -8.577, y: -3.478, z: 1.551, r: br},
		{x: -7.789, y: -3.251, z: 1.551, r: br},
		{x: -12.093, y: 0.889, z: 1.551, r: br},
		{x: -12.411, y: 1.995, z: 1.551, r: br},
		{x: -12.643, y: 2.802, z: 1.551, r: br},
	];
	loadModel(scene, 'stul_jidelna.glb', sc, stulJidelnaVariants, true);
	loadModel(scene, 'stul_jidelna_varnice.glb', sc, [{x: -5.044, y: -0.683, z: 1.482, r: br}], true);	
	loadModel(scene, 'jidelna_skrine_ruzne.glb', sc, [{x: -10.526, y: -2.141, z: 2.185, r: toRad(-73.9)}], true);	
	loadModel(scene, 'posta.glb', sc, [{x: -4.520, y: -7.817, z: 2.210, r: br}], true);	
	loadModel(scene, 'stul_kancl.glb', sc, [{x: -3.339, y: -6.241, z: 1.504, r: br}], true);	
	loadModel(scene, 'stul_hrnky.glb', sc, [{x: -3.914, y: -4.581, z: 1.551, r: br}], true);	
	const kamnaOsetrovnaVariants = [
		{x: -5.204, y: -10.222, z: 1.542, r: br},
		{x: -8.519, y: 4.814, z: 1.542, r: toRad(68.5)}
	];
	loadModel(scene, 'kamna_osetrovna.glb', sc, kamnaOsetrovnaVariants, true);
	loadModel(scene, 'postel_csd.glb', sc, [{x: -2.993, y: -9.961, z: 1.359, r: br}], true);
	loadModel(scene, 'skrinka_osetrovna.glb', sc, [{x: -4.355, y: -10.491, z: 1.642, r: br}], true);
	const palandaVariants = [
		{x: -5.004, y: -8.663, z: 1.881, r: br},
		{x: -7.301, y: 7.104, z: 1.881, r: toRad(106 + 180)},
	];
	loadModel(scene, 'palanda_osetrovna.glb', sc, palandaVariants, true);
	loadModel(scene, 'jidelna_vydejni_okno.glb', sc, [{x: -6.160, y: -0.501, z: 2.831, r: br}], true);	
	loadModel(scene, 'lekarna.glb', sc, [{x: -10.759, y: 2.124, z: 2.701, r: br}], true);		
	loadModel(scene, 'kuchyne_police1.glb', sc, [{x: -10.898, y: 3.095, z: 2.730, r: br}], true);		
	loadModel(scene, 'kuchyne_mycak.glb', sc, [{x: -10.722, y: 2.917, z: 1.556, r: br}], true);
	loadModel(scene, 'kuchyne_kamna.glb', sc, [{x: -7.070, y: 4.002, z: 1.928, r: br}], true);
	loadModel(scene, 'kuchyne_komin.glb', sc, [{x: -8.552, y: 4.150, z: 3.479, r: br}], true);	
	const kuchyneBrutarVariants = [
		{x: -7.998, y: 3.639, z: 1.685, r: br},
		{x: -9.252, y: 4.662, z: 1.685, r: toRad(-136)},
	];
	loadModel(scene, 'kuchyne_brutar.glb', sc, kuchyneBrutarVariants, true);
	loadModel(scene, 'kuchyne_brutar_chleba.glb', sc, [{x: -8.735, y: 3.426, z: 1.514, r: br}], true);
	loadModel(scene, 'sporak.glb', sc, [{x: -9.616, y: 3.705, z: 1.5794, r: br}], true);
	loadModel(scene, 'kuchyne_stul.glb', sc, [{x: -8.048, y: 1.394, z: 1.536, r: br}], true);
	loadModel(scene, 'kuchyne_vydejni_lavice.glb', sc, [{x: -6.021, y: -0.082, z: 1.306, r: br}], true);
	loadModel(scene, 'kuchyne_stul_krajec.glb', sc, [{x: -5.542, y: 1.299, z: 1.545, r: br}], true);		
	loadModel(scene, 'kuchyne_skrin_hrnce.glb', sc, [{x: -5.861, y: 2.537, z: 1.495, r: br}], true);
	loadModel(scene, 'kuchyne_police_koreni.glb', sc, [{x: -5.428, y: 1.488, z: 2.610, r: br}], true);
	loadModel(scene, 'kuchyne_skrin_svicky.glb', sc, [{x: -9.869, y: -0.292, z: 1.956, r: br}], true);
	loadModel(scene, 'kuchyne_skrin_hrnky.glb', sc, [{x: -7.962, y: -0.669, z: 1.956, r: br}], true);	
	loadModel(scene, 'talire.glb', sc, [{x: -7.933, y: -0.780, z: 2.566, r: br}], true);
	const zidleCervenaVariants = [
		{x: -8.499, y: 0.889, z: 1.603, r: toRad(-85.1)},
		{x: -7.600, y: 1.180, z: 1.603, r: toRad(-66)},
	];
	loadModel(scene, 'zidle_cervena.glb', sc, zidleCervenaVariants, true);
	loadModel(scene, 'drevnik.glb', sc, [{x: -13.213, y: 4.766, z: 1.499, r: br}], true);
	const laviceKoupelnaVariants = [
		{x: -11.547, y: 5.74, z: 1.414, r: br},
		{x: -9.535, y: 6.318, z: 1.414, r: br},
	];
	loadModel(scene, 'lavice_koupelna.glb', sc, laviceKoupelnaVariants, true);
	loadModel(scene, 'vana.glb', sc, [{x: -10.739, y: 6.705, z: 1.431, r: br}], true);
	const skladPoliceVariants = [
		{x: -10.337, y: -0.726, z: 1.886, r: br},
		{x: -11.067, y: -1.651, z: 1.886, r: toRad(106)},
		{x: -11.957, y: -0.354, z: 1.886, r: br},
	];
	loadModel(scene, 'sklad_police.glb', sc, skladPoliceVariants, true);	
	
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

function createStozar() {
	const height = 12 * glScale; 
	const x = -4.857 * glScale;
	const y = height / 2; 
	const z = -29.148 * glScale;
	loader.loadTexture('../textures/stozar.jpg', textures => {	
		let texture = textures[0];
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, 20);
		const geometry = new THREE.CylinderGeometry(.02 * glScale, .04 * glScale, height, 16);
		const material = new THREE.MeshLambertMaterial({map: texture});
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.scale.set(glScale, glScale, glScale);
		scene.add(mesh);
		physics.addCylinderObsticle(mesh);
	});
	loader.loadTexture('../textures/vlajka.png', textures => {
		const clothTexture = textures[0];
		clothTexture.anisotropy = 16;
		const clothMaterial = new THREE.MeshLambertMaterial({
			map: clothTexture,
			side: THREE.DoubleSide,
			alphaTest: 0.5
		});
		flag = new Cloth(clothMaterial);	
		const dx = 0.65;
		const dy = 4.1;
		const dz = 0;
		flag.position.set(x + dx * glScale, y + dy * glScale, z + dz * glScale);
		const scale = 0.005 * glScale;
		flag.scale.set(scale, scale, scale);
		scene.add(flag);	
	});
}

function createStany() {
	const sc = glScale;
	const br = 106;
	const stanVariants = [
		// severní řada 9 stanů
		{x: -12.679, y: 17.296, z: 1.573, r: toRad(106 - br)},
		{x: -13.394, y: 19.783, z: 1.574, r: toRad(106 - br)},
		{x: -14.113, y: 22.28, z: 1.574, r: toRad(106 - br)},
		{x: -14.813, y: 24.713, z: 1.574, r: toRad(106 - br)},
		{x: -15.538, y: 27.234, z: 1.574, r: toRad(106 - br)},
		{x: -16.261, y: 29.745, z: 1.574, r: toRad(106 - br)},
		{x: -16.965, y: 32.129, z: 1.574, r: toRad(106 - br)},
		{x: -17.700, y: 34.49, z: 1.574, r: toRad(106 - br)},
		{x: -18.410, y: 36.789, z: 1.574, r: toRad(106 - br)},
		
		// východní řada 8 stanů (4. je vynechaný kvůli kořenu)
		{x: -15.414, y: 40.769, z: 1.598, r: toRad(16.5 - br)},
		{x: -13.09, y: 41.383, z: 1.544, r: toRad(16.5 - br)},
		{x: -10.663, y: 42.104, z: 1.493, r: toRad(16.5 - br)},
		{x: -6.914, y: 43.23, z: 1.355, r: toRad(16.5 - br)},
		{x: -4.624, y: 43.912, z: 1.192, r: toRad(16.5 - br)},
		{x: -2.211, y: 44.63, z: 1.140, r: toRad(16.5 - br)},
		{x: 0.263, y: 45.365, z: 1.140, r: toRad(16.5 - br)},
		
		// jižní řada 13 stanů
		{x: 3.100, y: 40.442, z: 1.140, r: toRad(281 - br)},
		{x: 3.547, y: 38.192, z: 1.140, r: toRad(283 - br)},
		{x: 4.123, y: 35.832, z: 1.140, r: toRad(283 - br)},
		{x: 4.753, y: 33.511, z: 1.140, r: toRad(286 - br)},
		{x: 5.425, y: 31.314, z: 1.140, r: toRad(286 - br)},
		{x: 6.039, y: 29.077, z: 1.140, r: toRad(286 - br)},
		{x: 6.725, y: 26.796, z: 1.140, r: toRad(286 - br)},
		{x: 7.504, y: 24.39, z: 1.140, r: toRad(286 - br)},
		{x: 8.186, y: 21.916, z: 1.140, r: toRad(286 - br)},
		{x: 8.847, y: 19.577, z: 1.140, r: toRad(286 - br)},
		{x: 9.533, y: 17.214, z: 1.140, r: toRad(286 - br)},
		{x: 10.219, y: 14.765, z: 1.140, r: toRad(286 - br)},
		{x: 10.92, y: 12.329, z: 1.140, r: toRad(286 - br)},
		
	];
	loadModel(scene, 'stan.glb', sc, stanVariants, true);
}

function createHangar() {	
	loadModel(scene, 'hangar.glb', glScale, [{x: 27.639, y: -54.919, z: 6.857, r: toRad(22.1)}], true);
};

function createBirchTrees() {
	loadModel(scene, 'birch/scene.gltf', 1.5 * glScale, [{x: -1, y: 1, z: 0, r: toRad(0)}], false, model => {
		model.scale.z = .5 * glScale;
		model.rotation.y = toRad(10);
		model.rotation.x = toRad(-85);
		
		const configs = [
			{sz: .5, px: 2, pz: 6, rx: -95, ry: 10, rz: 280},
			{sz: .4, px: -1, pz: -3, rx: -95, ry: 9, rz: 280},
			{sz: .4, px: -2, pz: -7, rx: -95, ry: 12, rz: 10},
			{sz: .5, px: 3, pz: 10, rx: -95, ry: 8, rz: 280},
			{sz: .4, px: 3, pz: 13, rx: -95, ry: 3, rz: 280},
			{sz: .4, px: 4, pz: 13.5, rx: -95, ry: 5, rz: 180},
		]
		
		configs.forEach(c => {
			let mdl = model.clone();
			mdl.scale.z = c.sz * glScale;
			mdl.position.x += c.px * glScale;
			mdl.position.z += c.pz * glScale;
			mdl.rotation.x = toRad(c.rx);
			mdl.rotation.y = toRad(c.ry);
			mdl.rotation.z = toRad(c.rz);
			scene.add(mdl);			
		});
	});
};

function createGrid() {
	const size = 100;
	const divisions = 100;

	const gridHelper = new THREE.GridHelper(size, divisions);
	scene.add(gridHelper);
}

// https://threejs.org/docs/#api/en/lights/SpotLight
function createHouseLight() {
	KDebug.houseLight = [];
	KDebug.houseLightTarget = [];	
	let lights = [
		{lx: -3.5, ly: 2.8, lz: 2.5, tx: -10, ty: 1, tz: 4},
		{lx: -6 ,ly: 2.8, lz: -3, tx: -11, ty: 1, tz: -2}
	].forEach(lt => {		
		const spotLight = new THREE.SpotLight(0xffffff);
		spotLight.position.set(lt.lx, lt.ly, lt.lz);
		spotLight.penumbra = 0.7;
		spotLight.distance = 0;
		spotLight.power = 1.2;
		spotLight.castShadow = true;

		spotLight.shadow.mapSize.width = 1024;
		spotLight.shadow.mapSize.height = 1024;
		spotLight.shadow.camera.near = 1;
		spotLight.shadow.camera.far = 50;
		spotLight.shadow.camera.fov = 5;
		spotLight.shadow.bias = -0.01

		scene.add(spotLight);
			
		const targetObject = new THREE.Object3D();
		targetObject.position.set(lt.tx, lt.ty, lt.tz);
		scene.add(targetObject);
		spotLight.target = targetObject;
		
		KDebug.houseLight.push(spotLight);
		KDebug.houseLightTarget.push(targetObject);
		
		if (showHelpers) {
			const spotLightHelper = new THREE.SpotLightHelper(spotLight);
			scene.add(spotLightHelper);
		}
	});
}

// https://threejs.org/docs/#api/en/lights/shadows/DirectionalLightShadow
// https://threejs.org/examples/webgl_lights_hemisphere.html
// https://stackoverflow.com/questions/15478093/realistic-lighting-sunlight-with-three-js
// https://threejs.org/docs/#api/en/math/Color.setHSL
function createDayLight() {
	
	const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, .7);
	hemiLight.color.setHSL(0.15, 1, 0.9);
	//hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set(0, 50, 0);
	scene.add(hemiLight);
	KDebug.hemiLight = hemiLight;

	if (showHelpers) {
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
	KDebug.sunLight = dirLight;

	const d = 50;
	dirLight.shadow.camera.left = -d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = -d;
	dirLight.shadow.camera.far = 3500;
	dirLight.shadow.bias = -0.0001;
	if (showHelpers) {
		const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
		scene.add(dirLightHelper);
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
		}
	};
	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);
}

function createTerrain() {	
	loader.loadModel('../models/teren2.glb', gltf => { 
		const ground = gltf.scene.children[0];														
		const meshes = [];
		ground.traverse(n => { if (n.isMesh) {
			n.castShadow = true; 
			n.receiveShadow = true;
			meshes.push(n);
		}});	
			
		let heightMap = [];
		let terrainMinHeight, terrainMaxHeight;
		for (let m = 0; m < meshes.length; m++) {
			const vertices = meshes[m].geometry.attributes.position.array;
			for (let i = 0; i < vertices.length; i += 3) {
				let x = vertices[i];
				let y = vertices[i + 1];
				let z = vertices[i + 2];
				terrainMinHeight = terrainMinHeight === undefined ? y : Math.min(terrainMinHeight, y);
				terrainMaxHeight = terrainMaxHeight === undefined ? y : Math.max(terrainMaxHeight, y);						
				heightMap.push({x: x, y: y, z: z});
			}
		}
		
		ground.scale.set(glScale, glScale, glScale);
		ground.position.set(0, 5.282 * glScale, 0);	
		ground.rotation.x = 0;
		ground.rotation.y = 0;
		ground.rotation.z = 0;	
		const faceSide = 128;
		ground.userData.terrainWidth = faceSide;
		ground.userData.terrainDepth = faceSide;	
		ground.userData.terrainWidthExtents = 140;
		ground.userData.terrainDepthExtents = 87.2;		
		
		heightMap.sort((a, b) => {
			let firstMult = 1;
			let secondMult = 1;
			let firstAxisA = a.x;
			let firstAxisB = b.x;
			let secondAxisA = a.z;
			let secondAxisB = b.z;
			if (firstAxisA > firstAxisB) return 1 * firstMult;
			if (firstAxisA < firstAxisB) return -1 * firstMult;
			if (firstAxisA == firstAxisB) {
				if (secondAxisA > secondAxisB) return 1 * secondMult;
				if (secondAxisA < secondAxisB) return -1 * secondMult;
			}		
			return 0;					
		});			
		
		// clean glb duplicit vertexů
		let hMap = [];		
		for (let i = 0, lx, ly, lz; i < heightMap.length; i++) {
			let vtx = heightMap[i];
			if (Number.isNaN(vtx.y))
				console.log("NaN");
			if (i == 0 || vtx.x != lx || vtx.z != lz)
				hMap.push(heightMap[i].y);
			if (vtx.x == lx && vtx.z == lz && vtx.y != ly)
				console.log("vtx.y != ly");
			lx = heightMap[i].x;
			ly = heightMap[i].y;
			lz = heightMap[i].z;
		}
		heightMap = hMap;

		ground.userData.terrainMinHeight = terrainMinHeight;
		ground.userData.terrainMaxHeight = terrainMaxHeight;		
		ground.userData.heightMap = heightMap;
				
		physics.addTerrain(ground, scene);		
		scene.add(ground);
	});	
};

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
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);		
	
	scene = new THREE.Scene();		
	scene.background = new THREE.Color(0xdddddd);			
	
	if (showHelpers) 
		scene.add(new THREE.AxesHelper(500));
	
	renderer = new THREE.WebGLRenderer({
		antialias: false,
		powerPreference: "high-performance",
		preserveDrawingBuffer: false,
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
	createDayLight();
	createHouseLight();
	
	createTerrain();	
	createSkybox();	
	
	createStaryBarak();
	createBirchTrees();
	
	createStozar();	
	createStany();
	createHangar();
	
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
	const delta = clock.getDelta();	
	
	physics.updatePhysics(delta);
	player.update(delta);
	if (flag !== undefined)
		flag.animate(now);
	
	renderer.clear();
	renderer.render(scene, camera);	
	
	info.update(delta);	
	stats.update();	
}

export { KDebug };
import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let WaterTent = {};
WaterTent.create = function(itemManager, scene, KDebug) {
	let loadModel = itemManager.construct;
	
	let br = 16.0526;
	
	if (Config.useCompiledPhysics) {
		// tohle jako jeden mesh je podstatně rychlejší 
		loadModel(scene, 'umyvarky.glb', [{x: -16.977, y: 3.3865, z: 1.3207, r: br}], false, m => KDebug.instances["umyvarky"] = m);
		return;
	} 
	
	loadModel(scene, 'umyvarky_zlab1.glb', [{x: -16.094, y: 2.7928, z: 0.89586, r: br}], true);
	loadModel(scene, 'umyvarky_zlab2.glb', [{x: -18.063, y: 3.7037, z: 0.89586, r: br}], true);
};

export { WaterTent };
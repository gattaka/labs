import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let Hangar = {};
Hangar.create = function(itemManager, scene, KDebug) {
	let loadModel = itemManager.construct;
	
	let br = 16.0526;
	
	if (Config.useCompiledPhysics) {
		// tohle jako jeden mesh je podstatně rychlejší 
		loadModel(scene, 'hangar_joined.glb', [{x: 27.643, y: -54.917, z: 7.152, r: 0}], false, m => KDebug.instances["hangar"] = m);
	} else {
		loadModel(scene, 'hangar_01.glb', [{x: 27.798, y: -61.014, z: 6.603, r: 22.1}], true);
		loadModel(scene, 'hangar_02.glb', [{x: 31.730, y: -59.440, z: 6.605, r: 22.1}], true);
		loadModel(scene, 'hangar_03.glb', [{x: 29.828, y: -60.455, z: 7.608, r: 22.1}], true);
		loadModel(scene, 'hangar_04.glb', [{x: 27.471, y: -48.827, z: 6.603, r: 22.1}], true);
		loadModel(scene, 'hangar_05.glb', [{x: 23.543, y: -50.401, z: 6.605, r: 22.1}], true);
		loadModel(scene, 'hangar_06.glb', [{x: 25.435, y: -49.388, z: 7.608, r: 22.1}], true);
		loadModel(scene, 'hangar_07.glb', [{x: 24.574, y: -56.180, z: 6.553, r: 22.1}], true);
		loadModel(scene, 'hangar_08.glb', [{x: 30.704, y: -53.658, z: 6.553, r: 22.1}], true);
		loadModel(scene, 'hangar_09.glb', [{x: 27.639, y: -54.919, z: 8.695, r: 22.1}], true);
		loadModel(scene, 'hangar_vazani.glb', [{x: 27.610, y: -54.910, z: 7.485, r: 22.1}], false);
	}
};

export { Hangar };
import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let Outhouse = {};
Outhouse.create = function(itemManager, scene, KDebug) {
	let loadModel = itemManager.construct;
	
	let br = 16.0526;
	
	if (Config.useCompiledPhysics) {
		// tohle jako jeden mesh je podstatně rychlejší 
		loadModel(scene, 'kadibudka_joined.glb', [{x: -4.7018, y: -23.533, z: 3.2636, r: br}], false, m => KDebug.instances["kadibudka"] = m);
		return;
	} 
	
	loadModel(scene, 'kadibudka_dvere_hromada.glb', [{x: -3.226, y: -22.613, z: 2.492, r: 0}], true);
	loadModel(scene, 'kadibudka_dvere.glb', [{x: -3.591, y: -22.516, z: 3.488, r: 0}], true);
	loadModel(scene, 'kadibudka1.glb', [{x: -4.089, y: -24.736, z: 4.531, r: br}], true);
	loadModel(scene, 'kadibudka2.glb', [{x: -2.521, y: -26.813, z: 3.593, r: br}], true);
	loadModel(scene, 'kadibudka3.glb', [{x: -3.374, y: -23.809, z: 3.593, r: br}], true);
	loadModel(scene, 'kadibudka4.glb', [{x: -3.883, y: -27.243, z: 3.559, r: br}], true);
	loadModel(scene, 'kadibudka5.glb', [{x: -4.361, y: -22.242, z: 3.511, r: br}], true);
	loadModel(scene, 'kadibudka6.glb', [{x: -4.096, y: -24.734, z: 2.487, r: br}], true);
	loadModel(scene, 'kadibudka7.glb', [{x: -4.735, y: -24.918, z: 2.820, r: br}], true);
	loadModel(scene, 'kadibudka8.glb', [{x: -5.034, y: -25.011, z: 3.537, r: br}], true);
	loadModel(scene, 'kadibudka9.glb', [{x: -5.261, y: -22.493, z: 3.559, r: br}], true);
	loadModel(scene, 'kadibudka10.glb', [{x: -4.141, y: -26.259, z: 3.559, r: br}], true);
	loadModel(scene, 'kadibudka11.glb', [{x: -4.405, y: -25.348, z: 3.559, r: br}], true);
	loadModel(scene, 'kadibudka12.glb', [{x: -4.678, y: -24.401, z: 3.559, r: br}], true);
	loadModel(scene, 'kadibudka13.glb', [{x: -4.956, y: -23.436, z: 3.559, r: br}], true);
	loadModel(scene, 'kadibudka_cisterna.glb', [{x: -5.5663, y: -21.194, z: 2.2593, r: br}], true);
	loadModel(scene, 'kadibudka_vylevka.glb', [{x: -5.3325, y: -21.741, z: 2.745, r: br}], true);
	loadModel(scene, 'kadibudka_vylevka_mriz.glb', [{x: -5.7267, y: -20.72, z: 2.5772, r: br}], true);	
};

export { Outhouse };
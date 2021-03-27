import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let Tents = {};
Tents.create = function(itemManager, scene, KDebug) {
	let loadModel = itemManager.construct;
	
	let br = 16.0526;
	
	if (Config.useCompiledPhysics) {		
		loadModel(scene, 'stany_joined.glb', [{x: -3.5722, y: 30.731, z: 0.835, r: 0}], false, m => KDebug.instances["stany"] = m);
		return;
	} 
	
	const br2 = br - 90;
	const br3 = br + 180;
	const stanVariants = [
		// severní řada 9 stanů
		{x: -12.679, y: 17.296, z: 1.573, r: br},
		{x: -13.394, y: 19.783, z: 1.574, r: br},
		{x: -14.113, y: 22.28, z: 1.574, r: br},
		{x: -14.813, y: 24.713, z: 1.574, r: br},
		{x: -15.538, y: 27.234, z: 1.574, r: br},
		{x: -16.261, y: 29.745, z: 1.574, r: br},
		{x: -16.965, y: 32.129, z: 1.574, r: br},
		{x: -17.700, y: 34.49, z: 1.574, r: br},
		{x: -18.410, y: 36.789, z: 1.574, r: br},
		
		// východní řada 8 stanů (4. je vynechaný kvůli kořenu)		
		{x: -15.414, y: 40.769, z: 1.598, r: br2},
		{x: -13.09, y: 41.383, z: 1.544, r: br2},
		{x: -10.663, y: 42.104, z: 1.493, r: br2},
		{x: -6.914, y: 43.23, z: 1.355, r: br2},
		{x: -4.624, y: 43.912, z: 1.192, r: br2},
		{x: -2.211, y: 44.63, z: 1.140, r: br2},
		{x: 0.263, y: 45.365, z: 1.140, r: br2},
		
		// jižní řada 13 stanů
		{x: 3.100, y: 40.442, z: 1.140, r: br3 - 5},
		{x: 3.547, y: 38.192, z: 1.140, r: br3 - 3},
		{x: 4.123, y: 35.832, z: 1.140, r: br3 - 3},
		{x: 4.753, y: 33.511, z: 1.140, r: br3},
		{x: 5.425, y: 31.314, z: 1.140, r: br3},
		{x: 6.039, y: 29.077, z: 1.140, r: br3},
		{x: 6.725, y: 26.796, z: 1.140, r: br3},
		{x: 7.504, y: 24.39, z: 1.140, r: br3},
		{x: 8.186, y: 21.916, z: 1.140, r: br3},
		{x: 8.847, y: 19.577, z: 1.140, r: br3},
		{x: 9.533, y: 17.214, z: 1.140, r: br3},
		{x: 10.219, y: 14.765, z: 1.140, r: br3},
		{x: 10.92, y: 12.329, z: 1.140, r: br3},
		
	];
	loadModel(scene, 'stan.glb', stanVariants, true);
};

export { Tents };
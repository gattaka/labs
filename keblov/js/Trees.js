import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let Trees = {};
Trees.create = function(itemManager, scene, KDebug) {
	let loadModel = itemManager.construct;
	
	if (Config.useCompiledPhysics) {
		loadModel(scene, 'smrky_joined.glb', [{x: 2.002, y: 13.288, z: 12.116, r: 0}], false, m => KDebug.instances["smrky"] = m);
		loadModel(scene, 'brizy_joined.glb', [{x: 0.53, y: -2.413, z: 7.157, r: 0}], false, m => KDebug.instances["brizy"] = m);
		return;
	}
	
	const brizaVariants = [
		{x: 1.690, y: -11.327, z: -1.019, rx: 11, ry: 1.11, rz: 84.3, sx: 1.058, sy: 1.051, sz: 0.831}, 
		{x: 1.330, y: -9.970, z: -0.155, rx: -5.05, ry: 4.59, rz: -47.8, sx: 1.420, sy: 1.419, sz: 0.878},
		{x: 0.048, y: -5.259, z: -0.178, rx: -7.36, ry: 7.64, rz: -11.3, sx: 1.450, sy: 1.458, sz: 0.778},
		{x: -1.748, y: 0.985, z: -0.523, rx: -14.2, ry: -2.4, rz: -109, sx: 1.498, sy: 1.459, sz: 0.873},
		{x: -2.449, y: 3.422, z: -0.178, rx: -5.72, ry: 0, rz: -56, sx: 0.748, sy: 0.747, sz: 0.582},
		{x: -3.819, y: 8.182, z: -0.178, rx: 0, ry: 8.67, rz: 16.1, sx: 0.995, sy: 1.000, sz: 0.782},
	];
	loadModel(scene, 'briza.glb', 1, brizaVariants, false);
};

export { Trees };
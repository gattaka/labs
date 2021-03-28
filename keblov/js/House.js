import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let House = {};
House.create = function(itemManager, scene, KDebug) {
	let loadModel = itemManager.construct;
	
	let br = 16.0526;
	
	// chyba v UV mapování mi znemožňuje model začlenit do join modelu aniž by ztratil textury
	//loadModel(scene, 'kamna.glb', [{x: -3.846, y: -12.937, z: 1.949, r: br}], true);
	
	if (Config.useCompiledPhysics) {
		// tohle jako jeden mesh je podstatně rychlejší (asi +50FPS)
		loadModel(scene, 'barak_joined.glb', [{x: -7.5109, y: -3.1868, z: 2.3041, r: 0}], false, m => KDebug.instances["barak"] = m);
		return;
	} 
	
	loadModel(scene, 'beton_schod1.glb', [{x: -3.133, y: -2.091, z: 0.66, r: br}], true);
	loadModel(scene, 'beton_schod2.glb', [{x: -1.932, y: -1.745, z: 0.594, r: br}], true);
	loadModel(scene, 'beton_schod3.glb', [{x: -1.451, y: -1.607, z: 0.527, r: br}], true);
	loadModel(scene, 'beton_schod4.glb', [{x: -0.971, y: -1.469, z: 0.459, r: br}], true);
	loadModel(scene, 'beton_schod5.glb', [{x: -0.490, y: -1.330, z: 0.391, r: br}], true);
	loadModel(scene, 'beton_schod6.glb', [{x: -0.010, y: -1.192, z: 0.324, r: br}], true);
	
	loadModel(scene, 'keblov_stary.glb', [{x: -7.316, y: -4.273, z: 0.64, r: br}], true);		
	
	loadModel(scene, 'keblov_stary_zdi_01.glb', [{x: -4.025, y: -15.71, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_02.glb', [{x: -10.838, y: -5.235, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_03.glb', [{x: -13.528, y: 6.321, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_04.glb', [{x: -12.644, y: 6.575, z: 3.178, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_05.glb', [{x: -10.9, y: 7.077, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_06.glb', [{x: -9.093, y: 7.597, z: 3.207, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_07.glb', [{x: -7.867, y: 7.950, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_08.glb', [{x: -5.742, y: 3.457, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_09.glb', [{x: -4.068, y: -2.361, z: 3.207, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_10.glb', [{x: -2.777, y: -6.849, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_11.glb', [{x: -1.679, y: -10.664, z: 2.217, r: br}], false);
	loadModel(scene, 'keblov_stary_zdi_12.glb', [{x: -1.036, y: -12.899, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_13.glb', [{x: -3.343, y: -11.596, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_14.glb', [{x: -1.694, y: -11.137, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_15.glb', [{x: -2.038, y: -11.236, z: 3.207, r: br}], false);
	loadModel(scene, 'keblov_stary_zdi_16.glb', [{x: -4.084, y: -12.111, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_17.glb', [{x: -4.166, y: -12.639, z: 3.554, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_18.glb', [{x: -5.215, y: -13.175, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_19.glb', [{x: -3.124, y: -14.618, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_20.glb', [{x: -5.963, y: -14.300, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_21.glb', [{x: -6.728, y: -11.585, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_22.glb', [{x: -7.789, y: -11.753, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_23.glb', [{x: -8.544, y: -9.153, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_24.glb', [{x: -3.047, y: -7.572, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_25.glb', [{x: -5.171, y: -8.163, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_26.glb', [{x: -5.785, y: -9.526, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_27.glb', [{x: -5.136, y: -10.804, z: 3.565, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_28.glb', [{x: -3.344, y: -10.575, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_29.glb', [{x: -12.645, y: 3.287, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_30.glb', [{x: -11.758, y: 5.556, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_31.glb', [{x: -9.160, y: 5.934, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_32.glb', [{x: -11.023, y: 2.626, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_33.glb', [{x: -8.820, y: 4.388, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_34.glb', [{x: -10.492, y: 0.795, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_35.glb', [{x: -11.467, y: 0.567, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_36.glb', [{x: -10.047, y: -0.751, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_37.glb', [{x: -10.624, y: -1.802, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_38.glb', [{x: -6.827, y: -0.725, z: 2.217, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_39.glb', [{x: -10.351, y: 0.305, z: 3.182, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_40.glb', [{x: -10.631, y: 1.280, z: 3.182, r: br}], true);
	loadModel(scene, 'keblov_stary_zdi_41.glb', [{x: -3.826, y: -7.796, z: 3.176, r: br}], true);
	
	const oknaMalaVariants = [
		{x: -11.856, y: -1.716, z: 2.490, r: br},
		{x: -12.528, y: 0.661, z: 2.490, r: br},
	];
	loadModel(scene, 'keblov_stary_okno_male.glb', oknaMalaVariants, false);	
	
	loadModel(scene, 'keblov_stary_strop_01.glb', [{x: -7.830, y: -2.486, z: 3.297, r: br}], true);
	loadModel(scene, 'keblov_stary_strop_02.glb', [{x: -2.959, y: -11.993, z: 3.297, r: br}], true);
	loadModel(scene, 'keblov_stary_strop_03.glb', [{x: -7.407, y: -13.272, z: 3.297, r: br}], true);
	loadModel(scene, 'keblov_stary_strop_04.glb', [{x: -4.417, y: -14.347, z: 3.297, r: br}], true);
	
	loadModel(scene, 'keblov_stary_puda_stit_zapad_01.glb', [{x: -5.802, y: -16.218, z: 4.550, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_zapad_02.glb', [{x: -3.592, y: -15.582, z: 5.411, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_zapad_03.glb', [{x: -3.591, y: -15.581, z: 3.393, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_zapad_04.glb', [{x: -1.815, y: -15.071, z: 4.275, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_dvere_zapad.glb', [{x: -3.749, y: -16.071, z: 4.254, r: -54.9}], true);	
	
	loadModel(scene, 'keblov_stary_puda_stit_vychod_01.glb', [{x: -12.835, y: 6.531, z: 4.201, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_vychod_02.glb', [{x: -11.080, y: 7.037, z: 5.325, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_vychod_03.glb', [{x: -11.090, y: 7.031, z: 3.369, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_vychod_04.glb', [{x: -8.863, y: 7.674, z: 4.498, r: br}], true);
	loadModel(scene, 'keblov_stary_puda_stit_vychod_dvere.glb', [{x: -11.685, y: 7.338, z: 4.486, r: 0}], true);			
	
	const strechaVariants = [
		{x: -5.382, y: -3.698, z: 4.484, r: 376, ry: -58.7},
		{x: -9.240, y: -4.811, z: 4.484, r: 196, ry: -58.7},
	];
	loadModel(scene, 'keblov_stary_strecha.glb', strechaVariants, true);
						
	const stulPolovodiceVariants = [
		{x: -3.158, y: -12.062, z: 1.557, r: br},
		{x: -8.57, y: -9.665, z: 1.557, r: br}
	];
	loadModel(scene, 'stul_polovodice.glb', stulPolovodiceVariants, true);	
	loadModel(scene, 'dilna_police_strop.glb', [{x: -7.493, y: -15.492, z: 3.169, r: br}], true);	
	loadModel(scene, 'dilna_police1.glb', [{x: -7.388, y: -15.481, z: 2.044, r: br}], true);	
	loadModel(scene, 'dilna_junk.glb', [{x: -7.996, y: -14.232, z: 1.644, r: br}], true);	
	loadModel(scene, 'dilna_police2.glb', [{x: -8.177, y: -12.95, z: 2.015, r: br}], true);	
	loadModel(scene, 'dilna_police3.glb', [{x: -6.114, y: -14.986, z: 1.804, r: br}], true);		
	loadModel(scene, 'schody.glb', [{x: -5.427, y: -12.71, z: 2.206, r: br}], false);	
	loadModel(scene, 'sportak_skrin1.glb', [{x: -5.778, y: -10.621, z: 1.931, r: br}], true);
	const sportakSkrin2Variants = [
		{x: -6.089, y: -9.538, z: 1.931, r: br},
		{x: -8.337, y: -11.598, z: 1.931, r: -73.9},
	];
	loadModel(scene, 'sportak_skrin2.glb', sportakSkrin2Variants, true);
	const sportakSkrin3Variants = [
		{x: -6.317, y: -8.745, z: 1.754, r: br},
		{x: -2.982, y: -7.247, z: 1.754, r: br},
	];
	loadModel(scene, 'sportak_skrin3.glb', sportakSkrin3Variants, true);	
	loadModel(scene, 'stul_jidelna_varnice.glb', [{x: -5.044, y: -0.683, z: 1.482, r: br}], true);	
	loadModel(scene, 'jidelna_skrine_ruzne.glb', [{x: -10.526, y: -2.141, z: 2.185, r: -73.9}], true);	
	loadModel(scene, 'sloupy.glb', [{x: -6.724, y: -4.890, z: 2.214, r: br}], false);
	loadModel(scene, 'posta.glb', [{x: -4.520, y: -7.817, z: 2.210, r: br}], true);	
	loadModel(scene, 'stul_kancl.glb', [{x: -3.339, y: -6.241, z: 1.504, r: br}], true);	
	loadModel(scene, 'stul_hrnky.glb', [{x: -3.914, y: -4.581, z: 1.551, r: br}], true);	
	const kamnaOsetrovnaVariants = [
		{x: -5.204, y: -10.222, z: 1.542, r: br},
		{x: -8.519, y: 4.814, z: 1.542, r: 68.5}
	];
	loadModel(scene, 'kamna_osetrovna.glb', kamnaOsetrovnaVariants, true);
	loadModel(scene, 'postel_csd.glb', [{x: -2.993, y: -9.961, z: 1.359, r: br}], true);
	loadModel(scene, 'skrinka_osetrovna.glb', [{x: -4.355, y: -10.491, z: 1.642, r: br}], true);
	const palandaVariants = [
		{x: -5.004, y: -8.663, z: 1.881, r: br},
		{x: -7.301, y: 7.104, z: 1.881, r: 106 + 180},
	];
	loadModel(scene, 'palanda_osetrovna.glb', palandaVariants, true);
	loadModel(scene, 'jidelna_vydejni_okno.glb', [{x: -6.160, y: -0.501, z: 2.831, r: br}], true);	
	loadModel(scene, 'lekarna.glb', [{x: -10.759, y: 2.124, z: 2.701, r: br}], true);		
	loadModel(scene, 'kuchyne_police1.glb', [{x: -10.898, y: 3.095, z: 2.730, r: br}], true);		
	loadModel(scene, 'kuchyne_mycak.glb', [{x: -10.722, y: 2.917, z: 1.556, r: br}], true);
	loadModel(scene, 'kuchyne_kamna.glb', [{x: -7.070, y: 4.002, z: 1.928, r: br}], true);
	loadModel(scene, 'kuchyne_komin.glb', [{x: -8.552, y: 4.150, z: 3.479, r: br}], true);	
	const kuchyneBrutarVariants = [
		{x: -7.998, y: 3.639, z: 1.685, r: br},
		{x: -9.252, y: 4.662, z: 1.685, r: -136},
	];
	loadModel(scene, 'kuchyne_brutar.glb', kuchyneBrutarVariants, true);
	loadModel(scene, 'kuchyne_brutar_chleba.glb', [{x: -8.735, y: 3.426, z: 1.514, r: br}], true);
	loadModel(scene, 'sporak.glb', [{x: -9.616, y: 3.705, z: 1.5794, r: br}], true);
	loadModel(scene, 'kuchyne_stul.glb', [{x: -8.048, y: 1.394, z: 1.536, r: br}], true);
	loadModel(scene, 'kuchyne_vydejni_lavice.glb', [{x: -6.021, y: -0.082, z: 1.306, r: br}], true);
	loadModel(scene, 'kuchyne_stul_krajec.glb', [{x: -5.542, y: 1.299, z: 1.545, r: br}], true);		
	loadModel(scene, 'kuchyne_skrin_hrnce.glb', [{x: -5.861, y: 2.537, z: 1.495, r: br}], true);
	loadModel(scene, 'kuchyne_police_koreni.glb', [{x: -5.428, y: 1.488, z: 2.610, r: br}], true);
	loadModel(scene, 'kuchyne_skrin_svicky.glb', [{x: -9.841, y: -0.390, z: 1.956, r: br}], true);
	loadModel(scene, 'kuchyne_skrin_hrnky.glb', [{x: -7.962, y: -0.669, z: 1.956, r: br}], true);	
	loadModel(scene, 'talire.glb', [{x: -7.933, y: -0.780, z: 2.566, r: br}], true);
	const zidleCervenaVariants = [
		{x: -8.499, y: 0.889, z: 1.603, r: -85.1},
		{x: -7.600, y: 1.180, z: 1.603, r: -66},
	];
	loadModel(scene, 'zidle_cervena.glb', zidleCervenaVariants, true);
	loadModel(scene, 'drevnik.glb', [{x: -13.213, y: 4.766, z: 1.499, r: br}], true);
	const laviceKoupelnaVariants = [
		{x: -11.547, y: 5.74, z: 1.414, r: br},
		{x: -9.535, y: 6.318, z: 1.414, r: br},
	];
	loadModel(scene, 'lavice_koupelna.glb', laviceKoupelnaVariants, true);
	loadModel(scene, 'vana.glb', [{x: -10.739, y: 6.705, z: 1.431, r: br}], true);
	const skladPoliceVariants = [
		{x: -10.337, y: -0.726, z: 1.886, r: br},
		{x: -11.067, y: -1.651, z: 1.886, r: 106},
		{x: -11.957, y: -0.354, z: 1.886, r: br},
	];
	loadModel(scene, 'sklad_police.glb', skladPoliceVariants, true);	
	
	const kuchyneDvereVariants = [
		{x: -10.283, y: 0.858, z: 2.075, r: 152 + 180},
		{x: -10.582, y: 1.841, z: 2.075, r: 337},		
	];
	loadModel(scene, 'kuchyne_dvere.glb', kuchyneDvereVariants, true);	
	loadModel(scene, 'okap.glb', [{x: -3.444, y: -3.130, z: 3.147, r: br}], true);
	loadModel(scene, 'plechove_dvere.glb', [{x: -1.124, y: -11.221, z: 2.071, r: 0}], true);
	loadModel(scene, 'dilna_okno.glb', [{x: -6.094, y: -16.650, z: 2.496, r: 0}], true);
	loadModel(scene, 'dvere_marta.glb', [{x: -8.589, y: 8.148, z: 2.116, r: 0}], true);
	loadModel(scene, 'dvere_osetrovna.glb', [{x: -3.483, y: -7.241, z: 2.066, r: -88.6}], true);
	loadModel(scene, 'dvere_marodka.glb', [{x: -2.334, y: -11.724, z: 2.094, r: 0}], true);
	loadModel(scene, 'dvere_dilna.glb', [{x: -6.078, y: -12.377, z: 2.110, r: 0}], true);
	loadModel(scene, 'dvere_koupelna.glb', [{x: -11.124, y: 4.700, z: 2.110, r: 0}], true);	
		
	loadModel(scene, 'sklo_koupelna.glb', [{x: -11.064, y: 7.046, z: 2.489, r: br}], false);	
	
	const drevnikDvereVariants = [
		{x: -13.133, y: 6.862, z: 2.066, r: 0},
		{x: -8.997, y: -0.976, z: 2.066, r: -4.02},		
	];
	loadModel(scene, 'dvere_drevnik.glb', drevnikDvereVariants, true);
	
	loadModel(scene, 'vrata.glb', [{x: -3.380, y: -4.018, z: 2.074, r: 0}], true);
	loadModel(scene, 'vrata2.glb', [{x: -4.405, y: -0.547, z: 2.074, r: 0}], true);
	
	loadModel(scene, 'okap.glb', [{x: -3.444, y: -3.130, z: 3.147, r: br}], true);
	
	// Merged geometry optimalizace
	
	const schodVariants = [];
	const schod1 = {x: -4.62629, y: -12.479, z: 1.18457, r: br};
	const schod2 = {x: -4.80439, y: -12.5303, z: 1.41163, r: br};
	const xStep = schod2.x - schod1.x;
	const yStep = schod2.y - schod1.y;
	const zStep = schod2.z - schod1.z;
	for (let i = 0; i < 10; i++)
		schodVariants.push({x: schod1.x + i * xStep, y: schod1.y + i * yStep, z: schod1.z + i * zStep, r: br});
	loadModel(scene, 'schod.glb', schodVariants, true);
	
	const oknaVariants = [
		{x: -4.897, y: 0.538, z: 2.495, r: br},
		{x: -3.382, y: -4.727, z: 2.495, r: br},
		{x: -2.989, y: -6.092, z: 2.495, r: br},
		{x: -2.165, y: -8.955, z: 2.495, r: br},
		{x: -1.330, y: -11.858, z: 2.495, r: br},
		{x: -2.344, y: -15.225, z: 2.495, r: br - 90},
		{x: -4.468, y: -15.836, z: 2.495, r: br - 90},
		{x: -9.233, y: -10.823, z: 2.490, r: br + 180},
		{x: -10.067, y: -7.925, z: 2.490, r: br + 180},
		{x: -10.657, y: -5.872, z: 2.490, r: br + 180},
		{x: -11.253, y: -3.802, z: 2.490, r: br + 180},
		{x: -11.062, y: 7.034, z: 2.495, r: br + 90},
		{x: -6.415, y: 5.814, z: 2.495, r: br},
		{x: -5.826, y: 3.767, z: 2.495, r: br},
		{x: -5.461, y: 2.499, z: 2.495, r: br},		
	];
	loadModel(scene, 'keblov_stary_okno.glb', oknaVariants, false);
	
	const posteleVariants = [
		{x: -1.827, y: -13.966, z: 1.477, r: br},
		{x: -2.697, y: -14.216, z: 1.477, r: br},
		{x: -4.546, y: -15.268, z: 1.477, r: 106},
		{x: -5.016, y: -13.633, z: 1.477, r: 106},
		{x: -8.130, y: 6.761, z: 1.477, r: br},
		{x: -7.395, y: -11.122, z: 3.709, r: 106},
		{x: -7.713, y: -10.016, z: 3.709, r: 106},
		{x: -7.966, y: -9.137, z: 3.709, r: 106},
		{x: -8.265, y: -8.098, z: 3.709, r: 106},
		{x: -8.519, y: -7.215, z: 3.709, r: 106},
		{x: -8.819, y: -6.173, z: 3.709, r: 106},
	];
	loadModel(scene, 'postel.glb', posteleVariants, true);
	
	const kominkyVariants = [
		{x: -4.166, y: -12.639, z: 6.188, r: 0},
		{x: -5.109, y: -10.778, z: 6.188, r: 0},
		{x: -7.990, y: 4.302, z: 5.968, r: 0},
		{x: -8.371, y: 4.192, z: 6.084, r: 0},
		{x: -8.746, y: 4.084, z: 6.105, r: 0},
		{x: -9.116, y: 3.978, z: 6.048, r: 0},
	];
	loadModel(scene, 'keblov_stary_kominek.glb', kominkyVariants, true);
	
	const lavickaLakovanaVariants = [	
		{x: -8.025, y: -8.227, z: 1.396, r: br},
		{x: -7.732, y: -6.817, z: 1.396, r: br},
		{x: -8.712, y: -4.354, z: 1.396, r: br},
		{x: -8.925, y: -5.817, z: 1.396, r: 106},
	];
	loadModel(scene, 'lavicka_lakovana.glb', lavickaLakovanaVariants, true);	
	
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
	loadModel(scene, 'stul_jidelna.glb', stulJidelnaVariants, true);
	
	const pudaTramVariants = [
		{x: -10.089, y: 5.393, z: 4.418, r: br},
		{x: -9.535, y: 3.471, z: 4.418, r: br},
		{x: -8.982, y: 1.549, z: 4.418, r: br},
		{x: -8.429, y: -0.373, z: 4.418, r: br},
		{x: -7.876, y: -2.295, z: 4.418, r: br},
		{x: -7.323, y: -4.217, z: 4.418, r: br},
		{x: -6.770, y: -6.139, z: 4.418, r: br},
		{x: -6.217, y: -8.061, z: 4.418, r: br},
		{x: -5.664, y: -9.983, z: 4.418, r: br},
		{x: -5.111, y: -11.905, z: 4.418, r: br},
		{x: -4.558, y: -13.827, z: 4.418, r: br},
	];
	loadModel(scene, 'puda_tram.glb', pudaTramVariants, false);		
};

export { House };
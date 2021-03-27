import { Config } from './Config.js';
import { BufferGeometryUtils } from './BufferGeometryUtils.js';
import * as THREE from '../js/three.module.js';

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

function toRad(degree) {
	return Math.PI * degree / 180;
};

let ItemManager = function(loader, physics) {
	this.construct = function(scene, name, variants, asPhysicsBody, onCreateCallback) {
		loader.loadModel('../models/' + name, gltf => { 
			let model = gltf.scene.children[0];
			model.traverse(n => { if (n.isMesh) {
				n.castShadow = true; 
				n.receiveShadow = true;
				if (n.material.map) {
					n.material.map.anisotropy = 1; 
					n.material.map.encoding = THREE.sRGBEncoding;
				}
				if (n.material) {			
					n.material.metalness = 0;
					n.material.roughness = 1;				
				}
			}});
			const merge = Config.mergedGeometries && variants.length > 1;
			if (merge) console.log("Model " + name + " will be merged");
			const box = processBoundingBox(model);
			const instances = [];
			const materials = [];				
			for (let i=0; i < variants.length; i++) {
				let v = variants[i];
				let instance = merge ? model : model.clone();			
				// JS - Blender
				// x = x
				// y = z
				// z = y		
				
				let sx = 1, sy = 1, sz = 1;
				if (v.sx !== undefined) sx = v.sx;
				if (v.sy !== undefined) sy = v.sy;
				if (v.sz !== undefined) sz = v.sz;
				// nejprve scale, pak translate
				instance.scale.set(sx, sz, sy);
				
				// rotace a translace musí být v tomto pořadí
				if (v.rx !== undefined) instance.rotation.x = toRad(v.rx);
				if (v.ry !== undefined) instance.rotation.z = toRad(-v.ry);
				if (v.rz === undefined) v.rz = v.r;
				instance.rotation.y = toRad(v.rz);
				
				instance.position.set(v.x, v.z, -v.y);			
				
				if (!Config.useCompiledPhysics && asPhysicsBody)
					physics.addMeshObsticle(instance, scene, true, box.min, box.max);
					
				if (onCreateCallback !== undefined)
					onCreateCallback(instance);
				
				if (merge) {
					let modelNumber = 0;
					instance.traverse(n => { if (n.isMesh) {
						const geometryClone = n.geometry.clone();				
						// nejprve scale, pak translate
						geometryClone.scale(sx, sz, sy);
						// rotace a translace musí být v tomto pořadí
						if (v.rx !== undefined) geometryClone.rotateX(instance.rotation.x);
						if (v.ry !== undefined) geometryClone.rotateZ(instance.rotation.z);
						geometryClone.rotateY(instance.rotation.y);
						geometryClone.translate(v.x, v.z, -v.y);
						if (i == 0) {
							materials[modelNumber] = n.material;
							instances.push([]);
						}
						instances[modelNumber].push(geometryClone);
						modelNumber++;
					}});							
				} else {
					scene.add(instance);
				}
			};
			
			if (merge) {
				for (let i=0; i < materials.length; i++) {
					const variantInstances = instances[i];
					const modelMaterial = materials[i];
					const mergeGeometry = BufferGeometryUtils.mergeBufferGeometries(variantInstances);
					const mergedMesh = new THREE.Mesh(mergeGeometry, modelMaterial);
					mergedMesh.castShadow = true; 
					mergedMesh.receiveShadow = true;
					scene.add(mergedMesh);
				}
			}
		});
	}
};

export { ItemManager };
import { Config } from './Config.js';
import { Physics } from './Physics.js';
import * as THREE from '../js/three.module.js';		

let Player = function (info, camera, physics, pos) {

	const eyeHeight = 5;
	const radius = 1;
	const size = {x: .2, y: .2, z: .2};
	const quat = {x: 0, y: 0, z: 0, w: 1};
	const mass = 5;
	const stepHeight = .5;
	const keys = {forward: 0, back: 0, left: 0, right: 0, jump: 0};
	const walkSpeed = 1;
	const jumpSpeed = 1;
	
	const meshType = 1;
	
	let moveX, moveY, moveZ;
	
	let ret = {};
	ret.keys = keys;
	
	let init = function() {
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		let motionState = new Ammo.btDefaultMotionState(transform);
		
		let mesh, colShape;
		const material = new THREE.MeshBasicMaterial({wireframe: true});
		if (meshType == 0) {
			mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), material);
			colShape = new Ammo.btBoxShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5));			
		} else {
			mesh = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), material);
			colShape = new Ammo.btSphereShape(radius);
		}
		
		ret.mesh = mesh;
		
		mesh.position.set(pos);
		mesh.castShadow = true;
		mesh.receiveShadow = true;				
		
		colShape.setMargin(Config.phMargin);
		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
		let body = new Ammo.btRigidBody(rbInfo);
		
		body.setFriction(2);
		body.setRollingFriction(10);
		body.setActivationState(Physics.STATE.DISABLE_DEACTIVATION)
		
		info.addInfoSource(function() {
			let vel = body.getLinearVelocity();		
			return "Player: speed[x: " + Math.floor(vel.x()) + " y:" + Math.floor(vel.y()) + " z:" + Math.floor(vel.z()) + "]";
		});
		
		mesh.userData.physicsUpdate = function() {
			let scalingFactor = 20;			
			mesh.userData.moveY = 0;
			
			let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ)
			resultantImpulse.op_mul(scalingFactor);

			let vel = body.getLinearVelocity();				
			vel.setX(moveX * scalingFactor);
			vel.setZ(moveZ * scalingFactor);			
			if (moveY != 0 && physics.checkContact(body))
				vel.setY(moveY * scalingFactor);
			body.setLinearVelocity(vel);											
		};
		
		mesh.userData.physicsBody = body;
		mesh.userData.transformationCallback = function(objThree) {
			camera.position.x = objThree.position.x;
			camera.position.y = objThree.position.y + eyeHeight;
			camera.position.z = objThree.position.z;
		};
		physics.addDynamicObject(mesh);
	};
	init();
	
	ret.movePlayer = function(delta) {
		let vec = new THREE.Vector3();
		vec.setFromMatrixColumn(camera.matrix, 0);
		vec.crossVectors(camera.up, vec);
		vec.multiplyScalar(keys.forward - keys.back);
		
		let vec2 = new THREE.Vector3();
		vec2.setFromMatrixColumn(camera.matrix, 0);
		vec2.multiplyScalar(keys.left - keys.right);
		vec.add(vec2);
		
		moveX = vec.x * walkSpeed;
		moveY = jumpSpeed * keys.jump;
		moveZ = vec.z * walkSpeed;
	}

	return ret;
};

export { Player };
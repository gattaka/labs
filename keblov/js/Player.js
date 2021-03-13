import { Config } from './Config.js';
import { Physics } from './Physics.js';
import * as THREE from '../js/three.module.js';		

let Player = function (info, camera, physics, pos) {

	const radius = 0.1 * Config.glScale; // 0.2 funguje a nepropadává
	const height = 1.1 * Config.glScale;
	const eyeLevel = (height + 2 * radius) / 2;
	const quat = {x: 0, y: 0, z: 0, w: 1};
	const stepHeight = 0.2;
	const keys = {forward: 0, back: 0, left: 0, right: 0, jump: 0, sprint: 0};
	const walkSpeed = 0.06 * Config.glScale;	
	const jumpSpeed = 10 * Config.glScale;
	const sprintMult = 1;
	const maxSlopeRadians = Math.PI / 4;
	const terminalVelocity = 4;
	
	let currentPos;
	const startPos = new Ammo.btVector3(-3, 2 - eyeLevel, 2);
	let firstReset = true;
		
	let moveX, moveZ;
	let ret = {};
	
	let colShape;
	let controller;
	let ghostObject;
	
	ret.keys = keys;
	
	let init = function() {	
		// radius, height (total height is height+2*radius, so the height is just the height 
		// between the center of each 'sphere' of the capsule caps)
		colShape = new Ammo.btCapsuleShape(radius, height);
		ghostObject = new Ammo.btPairCachingGhostObject();
		const transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		ghostObject.setWorldTransform(transform);
		ghostObject.setCollisionShape(colShape);
		ghostObject.setCollisionFlags(ghostObject.getCollisionFlags() | 16); //CHARACTER_OBJECT
		ghostObject.setActivationState(4);
		ghostObject.activate(true);

		controller = new Ammo.btKinematicCharacterController(ghostObject, colShape, stepHeight, 1);
		controller.setJumpSpeed(jumpSpeed);
		controller.setMaxSlope(maxSlopeRadians);
		//controller.setFallSpeed(terminalVelocity);
		controller.setUseGhostSweepTest(true);
		controller.setGravity(-physics.getPhysicsWorld().getGravity().y());

		// addCollisionObject(collisionObject: Ammo.btCollisionObject, collisionFilterGroup?: number | undefined, collisionFilterMask?: number | undefined): void
		physics.getPhysicsWorld().addCollisionObject(ghostObject, 32, -1);
		physics.getPhysicsWorld().addAction(controller);
		physics.getPhysicsWorld().getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback());
	};
	init();
	
	ret.update = function(delta) {
		
		// Update 
			
		currentPos = controller.getGhostObject().getWorldTransform().getOrigin();		
		camera.position.x = currentPos.x();
		camera.position.y = currentPos.y() + eyeLevel;
		camera.position.z = currentPos.z();
		
		if (currentPos.y() < -10)
			ret.resetPosition();
		
		// Novy pohyb
		
		let vec = new THREE.Vector3();
		vec.setFromMatrixColumn(camera.matrix, 0);
		vec.crossVectors(camera.up, vec);
		let sprintMultVal = keys.sprint ? sprintMult : 0;
		vec.multiplyScalar((keys.forward - keys.back) * (1 + sprintMultVal));
		
		let vec2 = new THREE.Vector3();
		vec2.setFromMatrixColumn(camera.matrix, 0);
		vec2.multiplyScalar((keys.left - keys.right) * (1 + sprintMultVal));
		vec.add(vec2);
		
		moveX = vec.x * walkSpeed;		
		moveZ = vec.z * walkSpeed;			
		
		if (keys.jump > 0 && controller.canJump())
			controller.jump();
			
		if (!controller.onGround() || moveX != 0 || moveZ != 0) {
			controller.setGravity(-physics.getPhysicsWorld().getGravity().y());
		} else {
			controller.setGravity(0);
		}
	
		controller.setWalkDirection(new Ammo.btVector3(moveX, 0, moveZ));		
	}
	
	ret.getPosition = function() {
		return currentPos;
	};
	
	ret.resetPosition = function() {
		// https://stackoverflow.com/questions/12251199/re-positioning-a-rigid-body-in-bullet-physics
		currentPos = startPos;
		if (firstReset) {
			// Workaround
			currentPos = new Ammo.btVector3(pos.x, pos.y, pos.z);
			firstReset = false
		}
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(currentPos);
		transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));	
		ghostObject.setWorldTransform(transform);
	};

	return ret;
};

export { Player };
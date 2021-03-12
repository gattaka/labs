import { Config } from './Config.js';
import { Physics } from './Physics.js';
import * as THREE from '../js/three.module.js';		

let Player = function (info, camera, physics, pos) {

	const eyeHeight = 1.2 * Config.glScale;
	const radius = 0.2 * Config.glScale; // 0.2 funguje a nepropadává
	const size = .2 * Config.glScale;
	const quat = {x: 0, y: 0, z: 0, w: 1};
	const mass = 5;
	const stepHeight = .5;
	const keys = {forward: 0, back: 0, left: 0, right: 0, jump: 0};
	const walkSpeed = 0.2 * Config.glScale;	
	const jumpSpeed = 10 * Config.glScale;
	const maxSlopeRadians = Math.PI / 4;
	const terminalVelocity = 3;
	
	const startPos = new THREE.Vector3(-2, 5, 2);
	const meshType = 2;
		
	let moveX, moveZ;
	let ret = {};
	
	let colShape;
	let controller;
	let ghostObject;
	
	ret.keys = keys;
	
	let init = function() {	
		colShape = new Ammo.btCapsuleShape(0.5, 0.5);
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
		controller.setFallSpeed(terminalVelocity);
		controller.setGravity(-Config.gravity);
		controller.setUseGhostSweepTest(true);

		controller.setGravity(70);
		// it falls through the ground if I apply gravity
		//controller.setGravity(-physics.getPhysicsWorld().getGravity().y());

		// addCollisionObject(collisionObject: Ammo.btCollisionObject, collisionFilterGroup?: number | undefined, collisionFilterMask?: number | undefined): void
		physics.getPhysicsWorld().addCollisionObject(ghostObject, 32, -1);
		physics.getPhysicsWorld().addAction(controller);
		physics.getPhysicsWorld().getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback());
	};
	init();
	
	ret.update = function(delta) {
		
		// Update 
			
		const t = controller.getGhostObject().getWorldTransform().getOrigin();		
		camera.position.x = t.x();
		camera.position.y = t.y();
		camera.position.z = t.z();
		
		// Novy pohyb
		
		let vec = new THREE.Vector3();
		vec.setFromMatrixColumn(camera.matrix, 0);
		vec.crossVectors(camera.up, vec);
		vec.multiplyScalar(keys.forward - keys.back);
		
		let vec2 = new THREE.Vector3();
		vec2.setFromMatrixColumn(camera.matrix, 0);
		vec2.multiplyScalar(keys.left - keys.right);
		vec.add(vec2);
		
		moveX = vec.x * walkSpeed;		
		moveZ = vec.z * walkSpeed;			
		
		if (keys.jump > 0 && controller.canJump())
			controller.jump();
	
		controller.setWalkDirection(new Ammo.btVector3(moveX, 0, moveZ));		
	}
	
	ret.resetPosition = function() {
		// https://stackoverflow.com/questions/12251199/re-positioning-a-rigid-body-in-bullet-physics
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(startPos.x, startPos.y, startPos.z));
		transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));	
		ghostObject.setWorldTransform(transform);
	};

	return ret;
};

export { Player };
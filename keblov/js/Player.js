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
	const jumpSpeed = 0.3 * Config.glScale;
	
	const startPos = new THREE.Vector3(-2, 2, 2);
	const meshType = 2;
	
	let verticalLock = false;
	let moveX, moveY, moveZ;
	let body;
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
		mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(), material);
		colShape = new Ammo.btCapsuleShape(radius, size);	
		
		ret.mesh = mesh;
		
		mesh.position.set(pos.x, pos.y, pos.z);
		mesh.castShadow = true;
		mesh.receiveShadow = true;				
		
		colShape.setMargin(Config.phMargin);
		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
		body = new Ammo.btRigidBody(rbInfo);
		
		body.setFriction(0);
		body.setRollingFriction(0);
		body.setActivationState(Physics.STATE.DISABLE_DEACTIVATION)
		
		info.addInfoSource(function() {
			let vel = body.getLinearVelocity();		
			return "Player: speed[x: " + vel.x() + " y:" + vel.y() + " z:" + vel.z() + "]";
		});
		info.addInfoSource(function() {
			return "Player friction: [linear: " + body.getFriction() + " rolling:" + body.getRollingFriction() + "]";
		});
		
		mesh.userData.physicsUpdate = function() {
			let scalingFactor = 20;			
			mesh.userData.moveY = 0;
			
			let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ)
			resultantImpulse.op_mul(scalingFactor);

			body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
			
			let vel = body.getLinearVelocity();				
			vel.setX(moveX * scalingFactor);
			vel.setZ(moveZ * scalingFactor);

			if (moveX != 0 || moveZ != 0) {
				verticalLock = false;
			} else {
				verticalLock = physics.checkContact(body);
			}
						
			if (physics.checkContact(body) && moveY != 0) {
				vel.setY(moveY * scalingFactor);
				verticalLock = false;
			}
		};
		
		mesh.userData.physicsBody = body;
		mesh.userData.transformationCallback = function(objThree, p, q) {
			let nx = p.x();
			let ny = p.y();
			let nz = p.z();			
			// pokud nemám explicitně nastaven pohyb dopředu nebo do strany,
			// nechci, aby se hráč v těchto osách nijak hýbal (klouzal po svahu apod.)				
			if (moveX != 0 || moveZ != 0) {
				objThree.position.setX(nx);				
				objThree.position.setZ(nz);			
			}
			if (!verticalLock)
				objThree.position.setY(ny);
			
			// nepotřebuju, aby se fyzikální placeholder hráče otáčel
			//objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
			
			camera.position.x = objThree.position.x;
			camera.position.y = objThree.position.y + eyeHeight;
			camera.position.z = objThree.position.z;
						
			if (camera.position.y < -10)
				ret.resetPosition();
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
	
	ret.resetPosition = function() {
		// https://stackoverflow.com/questions/12251199/re-positioning-a-rigid-body-in-bullet-physics
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(startPos.x, startPos.y, startPos.z));
		transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
	
		body.setWorldTransform(transform);
		body.getMotionState().setWorldTransform(transform);
        body.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
        body.setAngularVelocity(new Ammo.btVector3(0, 0, 0));
        body.clearForces();
	};

	return ret;
};

export { Player };
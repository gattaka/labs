import * as THREE from '../js/three.module.js';			

let Physics = function (callback) {

	let clock;

	let character, ghostObject;
	let tempVecBt1, tempQuatBt1, transformAux1;

	const infoDiv = document.getElementById("info");

	//variable declaration section
	let physicsWorld, rigidBodies = [], tmpTrans = null
	let ballObject = null, moveDirection = { left: 0, right: 0, forward: 0, back: 0, jump: 0 }
	let kObject = null, kMoveDirection = { left: 0, right: 0, forward: 0, back: 0 }, tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
	let ammoTmpPos = null, ammoTmpQuat = null;
	let mouseCoords = new THREE.Vector2(), raycaster = new THREE.Raycaster();

	const STATE = { DISABLE_DEACTIVATION : 4 }
	const FLAGS = { CF_KINEMATIC_OBJECT: 2 }

	//Ammojs Initialization
	Ammo().then(start);

	let ret = {};

	function start() {
		tmpTrans = new Ammo.btTransform();
		ammoTmpPos = new Ammo.btVector3();
		ammoTmpQuat = new Ammo.btQuaternion();
		setupPhysicsWorld();		
		setupEventHandlers();
		callback();
	}

	function setupPhysicsWorld() {
		let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
			dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
			overlappingPairCache    = new Ammo.btDbvtBroadphase(),
			solver                  = new Ammo.btSequentialImpulseConstraintSolver();
		physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
		physicsWorld.setGravity(new Ammo.btVector3(0, -30, 0));			
	};

	function setupEventHandlers() {
		window.addEventListener( 'keydown', handleKeyDown, false);
		window.addEventListener( 'keyup', handleKeyUp, false);
	}

	function handleKeyDown(event) {
		let keyCode = event.keyCode;
		switch(keyCode){
			case 32: //-space-: JUMP
				moveDirection.jump = 1;
				break;
			case 38: //↑: FORWARD
				moveDirection.forward = 1
				break;                        
			case 40: //↓: BACK
				moveDirection.back = 1
				break;                        
			case 37: //←: LEFT
				moveDirection.left = 1
				break;                       
			case 39: //→: RIGHT
				moveDirection.right = 1
				break;                       
		}
	}            

	function handleKeyUp(event) {
		let keyCode = event.keyCode;
		switch(keyCode){
			case 38: //↑: FORWARD
				moveDirection.forward = 0
				break;                        
			case 40: //↓: BACK
				moveDirection.back = 0
				break;                        
			case 37: //←: LEFT
				moveDirection.left = 0
				break;                        
			case 39: //→: RIGHT
				moveDirection.right = 0
				break;
		}
	}

	ret.addBoxObsticle = function(mesh){		
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 0;
		let pos = mesh.position;
		let scale = mesh.scale;

		//Ammojs Section
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
		let motionState = new Ammo.btDefaultMotionState( transform );

		let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
		colShape.setMargin( 0.05 );

		let localInertia = new Ammo.btVector3( 0, 0, 0 );
		colShape.calculateLocalInertia( mass, localInertia );

		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
		let body = new Ammo.btRigidBody( rbInfo );

		body.setFriction(4);
		body.setRollingFriction(10);

		physicsWorld.addRigidBody( body );
	}
	
	// http://kripken.github.io/ammo.js/examples/webgl_demo_terrain/index.html
	ret.addTerrain = function(plane) {		
		let heightMap = plane.userData.heightMap;
		let terrainWidthExtents = plane.userData.terrainWidthExtents;
		let terrainDepthExtents = plane.userData.terrainDepthExtents;
		let terrainWidth = plane.userData.terrainWidth
		let terrainDepth = plane.userData.terrainDepth;
		let terrainMaxHeight = plane.userData.terrainMaxHeight;
		let terrainMinHeight = plane.userData.terrainMinHeight;
				
		// This parameter is not really used, since we are using PHY_FLOAT height data type and hence it is ignored
		let heightScale = 1;

		// Up axis = 0 for X, 1 for Y, 2 for Z. Normally 1 = Y is used.
		let upAxis = 1;

		// hdt, height data type. "PHY_FLOAT" is used. Possible values are "PHY_FLOAT", "PHY_UCHAR", "PHY_SHORT"
		let hdt = "PHY_FLOAT";

		// Set this to your needs (inverts the triangles)
		let flipQuadEdges = false;

		// Creates height data buffer in Ammo heap
		let ammoHeightData = Ammo._malloc( 4 * terrainWidth * terrainDepth );

		// Copy the javascript height data array to the Ammo one.
		let p = 0;
		let p2 = 0;
		for (let j = 0, v = 0; j < terrainDepth; j++) {
			for (let i = 0; i < terrainWidth; i++, v += 3) {
				// write 32-bit float data to memory				
				Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightMap[p];
				p++;
				// 4 bytes/float
				p2 += 4;
			}
		}

		// Creates the heightfield physics shape
		let heightFieldShape = new Ammo.btHeightfieldTerrainShape(
			terrainWidth,
			terrainDepth,

			ammoHeightData,

			heightScale,
			terrainMinHeight,
			terrainMaxHeight,

			upAxis,
			hdt,
			flipQuadEdges
		);

		// Set horizontal scale
		let scaleX = terrainWidthExtents / ( terrainWidth - 1 );
		let scaleZ = terrainDepthExtents / ( terrainDepth - 1 );
		heightFieldShape.setLocalScaling(new Ammo.btVector3( scaleX, 1, scaleZ));

		heightFieldShape.setMargin(0.05);

		let groundTransform = new Ammo.btTransform();
		groundTransform.setIdentity();
		// Shifts the terrain, since bullet re-centers it on its bounding box.
		groundTransform.setOrigin(new Ammo.btVector3(0, (terrainMaxHeight + terrainMinHeight) / 2, 0));
		let groundMass = 0;
		let groundLocalInertia = new Ammo.btVector3(0, 0, 0);
		let groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
		let groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(groundMass, groundMotionState, heightFieldShape, groundLocalInertia));		physicsWorld.addRigidBody(groundBody);
	}
	
	ret.createCharacter = function(scene) {               
		let pos = {x: 0, y: 20, z: 0};
		let radius = 1;
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 1;
		let stepHeight = 1;
		
		//threeJS Section
		ballObject = new THREE.Mesh(new THREE.SphereBufferGeometry(radius), new THREE.MeshPhongMaterial({color: 0xff0505}));
		ballObject.position.set(pos.x, pos.y, pos.z);	
		ballObject.castShadow = true;
		ballObject.receiveShadow = true;
		scene.add(ballObject);

		//Ammojs Section
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
		let motionState = new Ammo.btDefaultMotionState( transform );

		let colShape = new Ammo.btSphereShape( radius );
		colShape.setMargin( 0.05 );

		let localInertia = new Ammo.btVector3( 0, 0, 0 );
		colShape.calculateLocalInertia( mass, localInertia );

		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
		let body = new Ammo.btRigidBody( rbInfo );
		body.setFriction(2);
		body.setRollingFriction(5);
		body.setActivationState( STATE.DISABLE_DEACTIVATION )
		physicsWorld.addRigidBody( body );              
		ballObject.userData.physicsBody = body;
		rigidBodies.push(ballObject);
	}
	
	ret.addRigidBody = function(threeObject) {
		rigidBodies.push(threeObject);
		physicsWorld.addRigidBody(threeObject.userData.physicsBody);     
	};		

	ret.createKinematicBox = function(scene) {                
		let pos = {x: 30, y: 6, z: 5};
		let scale = {x: 10, y: 10, z: 10};
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 1;

		//threeJS Section
		kObject = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0x30ab78}));

		kObject.position.set(pos.x, pos.y, pos.z);
		kObject.scale.set(scale.x, scale.y, scale.z);

		kObject.castShadow = true;
		kObject.receiveShadow = true;

		scene.add(kObject);

		//Ammojs Section
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
		let motionState = new Ammo.btDefaultMotionState( transform );

		let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
		colShape.setMargin( 0.05 );

		let localInertia = new Ammo.btVector3( 0, 0, 0 );
		colShape.calculateLocalInertia( mass, localInertia );

		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
		let body = new Ammo.btRigidBody( rbInfo );

		body.setFriction(4);
		body.setRollingFriction(10);
		
		body.setActivationState( STATE.DISABLE_DEACTIVATION );
		body.setCollisionFlags( FLAGS.CF_KINEMATIC_OBJECT );

		physicsWorld.addRigidBody( body );
		kObject.userData.physicsBody = body;
	}

	function moveBall(){
		let scalingFactor = 20;

		let moveX =  moveDirection.right - moveDirection.left;
		let moveZ =  moveDirection.back - moveDirection.forward;
		let moveY =  moveDirection.jump; 
		moveDirection.jump = 0;

		//if( moveX == 0 && moveY == 0 && moveZ == 0) return;

		let resultantImpulse = new Ammo.btVector3( moveX, moveY, moveZ )
		resultantImpulse.op_mul(scalingFactor);

		let physicsBody = ballObject.userData.physicsBody;
		let vel = physicsBody.getLinearVelocity();				
		vel.setX(moveX * scalingFactor);
		vel.setZ(moveZ * scalingFactor);
		if (moveY == 1)
			if (vel.y() < 0.001)
				vel.setY(moveY * scalingFactor);
		physicsBody.setLinearVelocity( vel );
	}

	function moveKinematic(){
		let scalingFactor = 0.3;
		let moveX =  kMoveDirection.right - kMoveDirection.left;
		let moveZ =  kMoveDirection.back - kMoveDirection.forward;
		let moveY =  0;

		let translateFactor = tmpPos.set(moveX, moveY, moveZ);
		translateFactor.multiplyScalar(scalingFactor);

		kObject.translateX(translateFactor.x);
		kObject.translateY(translateFactor.y);
		kObject.translateZ(translateFactor.z);
		
		kObject.getWorldPosition(tmpPos);
		kObject.getWorldQuaternion(tmpQuat);

		let physicsBody = kObject.userData.physicsBody;

		let ms = physicsBody.getMotionState();
		if ( ms ) {
			ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
			ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);                   
			tmpTrans.setIdentity();
			tmpTrans.setOrigin( ammoTmpPos ); 
			tmpTrans.setRotation( ammoTmpQuat ); 
			ms.setWorldTransform(tmpTrans);
		}
	}

	ret.updatePhysics = function(deltaTime, infoLines) {	
		moveBall();
		moveKinematic();
		
		// Step world
		physicsWorld.stepSimulation( deltaTime, 10 );

		let physicsBody = ballObject.userData.physicsBody;
		let vel = physicsBody.getLinearVelocity();				
		infoLines[1] = "X: "+Math.floor(vel.x())+ " Y:"+Math.floor(vel.y())+" Z:"+Math.floor(vel.z());

		// Update rigid bodies
		for ( let i = 0; i < rigidBodies.length; i++ ) {
			let objThree = rigidBodies[ i ];
			let objAmmo = objThree.userData.physicsBody;
			let ms = objAmmo.getMotionState();
			if ( ms ) {
				ms.getWorldTransform( tmpTrans );
				let p = tmpTrans.getOrigin();
				let q = tmpTrans.getRotation();
				objThree.position.set( p.x(), p.y(), p.z() );
				objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
			}
		}
	}
	
	return ret;
};

export { Physics };
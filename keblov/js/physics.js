import * as THREE from '../js/three.module.js';			

let Physics = {};
Physics.STATE = { DISABLE_DEACTIVATION : 4 };
Physics.FLAGS = { CF_KINEMATIC_OBJECT: 2 };
Physics.processor = function (callback) {

	let clock;
	let character, ghostObject;
	let tempVecBt1, tempQuatBt1, transformAux1;
	let cbContactResult;

	const infoDiv = document.getElementById("info");

	//variable declaration section
	let physicsWorld, dynamicObjects = [], tmpTrans = null	
	let tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
	let ammoTmpPos = null, ammoTmpQuat = null;
	let mouseCoords = new THREE.Vector2(), raycaster = new THREE.Raycaster();

	// body.setActivationState(STATE.DISABLE_DEACTIVATION);
	// body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);

	Ammo().then(start);

	let ret = {};

	function start() {
		tmpTrans = new Ammo.btTransform();
		ammoTmpPos = new Ammo.btVector3();
		ammoTmpQuat = new Ammo.btQuaternion();
		setupPhysicsWorld();		
		callback();
	}

	function setupPhysicsWorld() {
		let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration(),
			dispatcher              = new Ammo.btCollisionDispatcher(collisionConfiguration),
			overlappingPairCache    = new Ammo.btDbvtBroadphase(),
			solver                  = new Ammo.btSequentialImpulseConstraintSolver();
		physicsWorld           = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
		physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
		setupContactResultCallback();
	};

	function setupEventHandlers() {
		window.addEventListener('keydown', handleKeyDown, false);
		window.addEventListener('keyup', handleKeyUp, false);
	}

	ret.addCylinderObsticle = function(mesh) {		
		let quat = {x: 0, y: 0, z: 0, w: 1};
		let mass = 0;
		let pos = mesh.position;
		let scale = mesh.scale;
		let radiusBottom = mesh.geometry.parameters.radiusBottom;
        let radiusTop = mesh.geometry.parameters.radiusTop;
        let height = mesh.geometry.parameters.height;

		//Ammojs Section
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		let motionState = new Ammo.btDefaultMotionState(transform);

		let colShape = new Ammo.btCylinderShape(new Ammo.btVector3(radiusBottom, height * 0.5, radiusTop));
		colShape.setMargin(0.05);

		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
		let body = new Ammo.btRigidBody(rbInfo);

		body.setFriction(4);
		body.setRollingFriction(10);

		physicsWorld.addRigidBody(body);
	}

	ret.addBoxObsticle = function(mesh, scene) {	
		let quat = mesh.quaternion;
		let mass = 1000;
		let pos = mesh.position.clone();
		let bbmax = mesh.geometry.boundingBox.max;
		let bbmin = mesh.geometry.boundingBox.min;
		let scale = {x: bbmax.x - bbmin.x, y: bbmax.y - bbmin.y, z: bbmax.z - bbmin.z};		
		scale.x *= mesh.scale.x;
		scale.y *= mesh.scale.y;
		scale.z *= mesh.scale.z;
		
		/*let helper = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: 0x30ab78}));
		helper.position.set(pos.x, pos.y, pos.z);
		helper.scale.set(scale.x, scale.y, scale.z);
		helper.rotation.setFromQuaternion(quat);
		helper.castShadow = true;
		helper.receiveShadow = true;
		scene.add(helper);
		mesh.userData.helperMesh = helper;*/

		//Ammojs Section
		let transform = new Ammo.btTransform();
		transform.setIdentity();
		transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		let motionState = new Ammo.btDefaultMotionState(transform);

		let colShape = new Ammo.btBoxShape(new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5));
		colShape.setMargin(0.05);

		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
		let body = new Ammo.btRigidBody(rbInfo);

		body.setFriction(4);
		body.setRollingFriction(10);
		mesh.userData.physicsBody = body;

		physicsWorld.addRigidBody(body);
		dynamicObjects.push(mesh);
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
		let ammoHeightData = Ammo._malloc(4 * terrainWidth * terrainDepth);

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
		let scaleX = terrainWidthExtents / (terrainWidth - 1);
		let scaleZ = terrainDepthExtents / (terrainDepth - 1);
		heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX, 1, scaleZ));

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
		
	ret.addRigidBody = function(physicsBody) {
		physicsWorld.addRigidBody(physicsBody);     
	};		
	
	ret.addDynamicObject = function(objThree) {
		dynamicObjects.push(objThree);  
		ret.addRigidBody(objThree.userData.physicsBody);     		
	};	

	function updateMeshMotionState(ms, objThree) {
		ms.getWorldTransform(tmpTrans);
		let p = tmpTrans.getOrigin();
		let q = tmpTrans.getRotation();
		objThree.position.set(p.x(), p.y(), p.z());
		if (objThree.userData.posOffset !== undefined)
			objThree.position.add(objThree.userData.posOffset);			
		objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
		if (objThree.userData.transformationCallback !== undefined) 
			objThree.userData.transformationCallback(objThree);
	};
	
	function setupContactResultCallback() {
		cbContactResult = new Ammo.ConcreteContactResultCallback();               
		cbContactResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){                    
			let contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);
			const distance = contactPoint.getDistance();
			if (distance > 0) return;
			this.hasContact = true;	
		}
	};
	
	ret.checkContact = function (body) {
		cbContactResult.hasContact = false;
		physicsWorld.contactTest(body, cbContactResult);		
		return cbContactResult.hasContact;
	};

	ret.updatePhysics = function(deltaTime) {			
		// Step world
		physicsWorld.stepSimulation(deltaTime, 10);
		
		// Update rigid bodies
		for (let i = 0; i < dynamicObjects.length; i++) {
			let objThree = dynamicObjects[ i ];
			let objAmmo = objThree.userData.physicsBody;
			if (objThree.userData.physicsUpdate !== undefined) 
				objThree.userData.physicsUpdate();
			let ms = objAmmo.getMotionState();
			if (ms) {
				updateMeshMotionState(ms, objThree);
				if (objThree.userData.helperMesh !== undefined) 
					updateMeshMotionState(ms, objThree.userData.helperMesh);
			}
		}
	}
	
	return ret;
};

export { Physics };
import { Config } from './Config.js';
import * as THREE from '../js/three.module.js';			

let Physics = {};

Physics.STATE = { DISABLE_DEACTIVATION : 4 };

// Every rigid body in ammo.js has a bitwise masks collision group and collision mask. 
// The collision group represents the collision identity group of the rigid body while 
// the collision mask represents other collision identity groups that should be collided with. 
// collision between bodies A and B can only occur if a bitwise AND operation between the 
// collision mask of A and the collision group of B is anything but zero and vice versa.
// https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
Physics.FLAGS = { CF_KINEMATIC_OBJECT: 2 };

Physics.processor = function (callback) {

	const showHelpers = Config.showPhHelpers;
	const phMargin = Config.phMargin;
	const gravity = Config.gravity;

	let clock;
	let character, ghostObject;
	let tempVecBt1, tempQuatBt1, transformAux1;
	let cbContactResult;

	const physicsCompileOutput = document.getElementById("physics-compile");

	//variable declaration section
	let physicsWorld, dynamicObjects = [], tmpTrans = null	
	let tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
	let ammoTmpPos = null, ammoTmpQuat = null;	

	// body.setActivationState(Physics.STATE.DISABLE_DEACTIVATION);
	// body.setCollisionFlags(Physics.FLAGS.CF_KINEMATIC_OBJECT);

	// Each rigid body needs to reference a collision shape. The collision shape is for collisions only, 
	// and thus has no concept of mass, inertia, restitution, etc. If you have many bodies that use the 
	// same collision shape [eg every spaceship in your simulation is a 5-unit-radius sphere], it is good 
	// practice to have only one Bullet (ammo.js) collision shape, and share it among all those bodies
	// https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
	let shapeCache = {};

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
		physicsWorld.setGravity(new Ammo.btVector3(0, gravity, 0));
		setupContactResultCallback();
	};

	function setupEventHandlers() {
		window.addEventListener('keydown', handleKeyDown, false);
		window.addEventListener('keyup', handleKeyUp, false);
	}
	
	function createBoxHelper(pos, quat, scale) {
		var color = Math.floor(Math.random() * (1 << 24));
		let helper = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshPhongMaterial({color: color}));
		helper.position.set(pos.x, pos.y, pos.z);
		helper.geometry.scale(scale.x, scale.y, scale.z);
		helper.rotation.setFromQuaternion(quat);
		helper.castShadow = true;
		helper.receiveShadow = true;		
		return helper;
	};
	
	ret.addHinge = function(mesh, meshPivotX, meshPivotZ) {
		let meshBody = mesh.userData.physicsBody;
		let meshBBox = mesh.userData.boundingBoxScale;
		let meshPos = mesh.position;
		
		let frameSize = new Ammo.btVector3(1, meshBBox.y, 1);
		let frameShape = new Ammo.btBoxShape(frameSize);
		let frameTrans = new Ammo.btTransform();
		frameTrans.setIdentity();
		// TODO pos
		frameTrans.setOrigin(new Ammo.btVector3(meshPos.x, meshPos.y, meshPos.z - meshBBox.z / 2));		
		var frameLocalInertia = new Ammo.btVector3(0, 0, 0);
		var frameMotionState = new Ammo.btDefaultMotionState(frameTrans);
		var frameBodyInfo = new Ammo.btRigidBodyConstructionInfo(0, frameMotionState, frameShape, frameLocalInertia);
		var frameBody = new Ammo.btRigidBody(frameBodyInfo);
		frameBody.setActivationState(4);
				
		let framePivot = new Ammo.btVector3(0, 0, 0);
		let meshPivot = new Ammo.btVector3(meshPivotX, 0, meshPivotZ);
		let axis = new Ammo.btVector3(0, 1, 0);				
		let hinge = new Ammo.btHingeConstraint(frameBody, meshBody, framePivot, meshPivot, axis, axis, false);		
		
		mesh.userData.hinge = hinge;
		//hinge.enableAngularMotor(true, 1.5, 50);
		
		//hinge.setLimit(-Math.PI/2 * 0.5, 0, 0.9, 0.3, 1);
		physicsWorld.addConstraint(hinge, false);
	};
	
	ret.addBoxObsticle = function(scene, pos, quat, scale, kinematic, mesh) {
		if (!Config.useCompiledPhysics) {
			let posCode = "new THREE.Vector3(" + pos.x + ", " + pos.y + ", " + pos.z + ")";
			let quatCode = "new THREE.Quaternion(" + quat.x + ", " + quat.y + ", " + quat.z + ", " + quat.w + ")";
			let scaleCode = "new THREE.Vector3(" + scale.x + ", " + scale.y + ", " + scale.z + ")";
			physicsCompileOutput.value += "physics.addBoxObsticle(scene, " + posCode + ", " + quatCode + ", " + scaleCode + ", " + kinematic + ");\n";
		}
	
		// when a rigid body has a mass of zero it means the body has infinite mass hence it is static
		let mass = kinematic ? 0 : 1;				
		if (showHelpers) {
			let helper = createBoxHelper(pos, quat, scale);
			scene.add(helper);			
			if (mesh !== undefined)
				mesh.userData.helperMesh = helper;
		}
		
		//Ammojs Section
		tmpTrans.setIdentity();
		tmpTrans.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
		tmpTrans.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		let motionState = new Ammo.btDefaultMotionState(tmpTrans);

		let localInertia = new Ammo.btVector3(0, 0, 0);
		
		let shapeSizeVector = new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5);
		let colShapeCacheKey = "x:" + shapeSizeVector.x() + "y:" + shapeSizeVector.y() + "z:" + shapeSizeVector.z();
		let colShape;
		if (Config.cachePhShapes)
			colShape = shapeCache[colShapeCacheKey];
		if (colShape === undefined) {
			colShape = new Ammo.btBoxShape(shapeSizeVector);
			colShape.setMargin(phMargin);
			colShape.calculateLocalInertia(mass, localInertia);
			shapeCache[colShapeCacheKey] = colShape;
		} else {
			console.log("ColShapeCache hit");
		}
		
		let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
		let body = new Ammo.btRigidBody(rbInfo);
				
		body.setCollisionFlags(16);

		physicsWorld.addRigidBody(body, -1, -1);
		
		if (mesh !== undefined) {
			mesh.userData.physicsBody = body;
			if (!kinematic)
				dynamicObjects.push(mesh);
		}
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
		colShape.setMargin(phMargin);

		let localInertia = new Ammo.btVector3(0, 0, 0);
		colShape.calculateLocalInertia(mass, localInertia);

		let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
		let body = new Ammo.btRigidBody(rbInfo);

		body.setFriction(4);
		body.setRollingFriction(10);

		physicsWorld.addRigidBody(body);
	}

	ret.addMeshObsticle = function(mesh, scene, kinematic, bbmin, bbmax) {		
		let quat = mesh.quaternion.clone();
		let pos = mesh.position.clone();
									
		if (bbmax === undefined)
			bbmax = mesh.geometry.boundingBox.max;
		if (bbmin === undefined)
			bbmin = mesh.geometry.boundingBox.min;		
		const boundingBox = new THREE.Box3(bbmin, bbmax);						
		let scale = new THREE.Vector3(bbmax.x - bbmin.x, bbmax.y - bbmin.y, bbmax.z - bbmin.z);
		scale.multiply(mesh.scale);
		mesh.userData.boundingBoxScale = scale;
		ret.addBoxObsticle(scene, pos, quat, scale, kinematic, mesh);		
	}
	
	// http://kripken.github.io/ammo.js/examples/webgl_demo_terrain/index.html
	ret.addTerrain = function(plane, scene) {
		const data = plane.userData;
				
		let heightMap = data.heightMap;
		let terrainWidthExtents = data.terrainWidthExtents;
		let terrainDepthExtents = data.terrainDepthExtents;
		let terrainWidth = data.terrainWidth + 1;
		let terrainDepth = data.terrainDepth + 1;
		let terrainMaxHeight = data.terrainMaxHeight;
		let terrainMinHeight = data.terrainMinHeight;
				
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
		for (let j = 0; j < terrainDepth; j++, p += terrainWidth) {
			for (let i = 0; i < terrainWidth; i++) {
				// protože Ammo neumí zrcadlení heightmap přes scale (umí, ale pak přestane fungovat kolize) 
				// musí se zrcadlení udělat přehozením pořadí zápisu vertexů
				let hmpIndx = p + terrainWidth - 1 - i;
				// write 32-bit float data to memory		
				Ammo.HEAPF32[ammoHeightData + p2 >> 2] = heightMap[hmpIndx];
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
		let scaleY = 1;
		let scaleZ = terrainDepthExtents / (terrainDepth - 1);
		heightFieldShape.setLocalScaling(new Ammo.btVector3(scaleX, scaleY, scaleZ));

		heightFieldShape.setMargin(phMargin);

		let groundTransform = new Ammo.btTransform();
		groundTransform.setIdentity();		
		let quat = plane.quaternion.clone();
		groundTransform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
		// Shifts the terrain, since bullet re-centers it on its bounding box.
		groundTransform.setOrigin(new Ammo.btVector3(0, (terrainMaxHeight + terrainMinHeight) / 2 + plane.position.y, 0));
		let groundMass = 0;
		let groundLocalInertia = new Ammo.btVector3(0, 0, 0);
		let groundMotionState = new Ammo.btDefaultMotionState(groundTransform);
		let groundBody = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(groundMass, groundMotionState, heightFieldShape, groundLocalInertia));
		groundBody.setFriction(4);
		groundBody.setRollingFriction(20);		
		physicsWorld.addRigidBody(groundBody);
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
		if (objThree.userData.posOffset !== undefined)
			objThree.position.add(objThree.userData.posOffset);					
		if (objThree.userData.transformationCallback !== undefined) {
			objThree.userData.transformationCallback(objThree, p, q);
		} else {
			objThree.position.set(p.x(), p.y(), p.z());
			objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
		}
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
		// https://stackoverflow.com/questions/12778229/what-does-step-mean-in-stepsimulation-and-what-do-its-parameters-mean-in-bulle
		physicsWorld.stepSimulation(deltaTime);		
		
		// Update rigid bodies
		for (let i = 0; i < dynamicObjects.length; i++) {
			let objThree = dynamicObjects[i];
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
	};
	
	ret.getPhysicsWorld = function() {
		return physicsWorld;
	};
	
	return ret;
};

export { Physics };
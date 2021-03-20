import {
	Euler,
	EventDispatcher,
	Vector3,
	Vector2
} from './three.module.js';

var Controls = function (camera, domElement) {

	if (domElement === undefined) {
		console.warn('THREE.PointerLockControls: The second parameter "domElement" is now mandatory.');
		domElement = document.body;
	}

	let self = this;
	this.domElement = domElement;
	this.isLocked = false;
	this.mouseCoords = new Vector2();

	// Set to constrain the pitch of the camera
	// Range is 0 to Math.PI radians
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	var scope = this;

	var changeEvent = { type: 'change' };
	var lockEvent = { type: 'lock' };
	var unlockEvent = { type: 'unlock' };

	var euler = new Euler(0, 0, 0, 'YXZ');

	var PI_2 = Math.PI / 2;

	function onMouseMove(event) {
		if (scope.isLocked === false) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		
		// https://threejs.org/docs/#api/en/core/Raycaster
		self.mouseCoords.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		self.mouseCoords.y = - ( event.clientY / window.innerHeight ) * 2 + 1;		 

		euler.setFromQuaternion(camera.quaternion);

		euler.y -= movementX * 0.002;
		euler.x -= movementY * 0.002;

		euler.x = Math.max(PI_2 - scope.maxPolarAngle, Math.min(PI_2 - scope.minPolarAngle, euler.x));

		camera.quaternion.setFromEuler(euler);

		scope.dispatchEvent(changeEvent);
	}

	function onPointerlockChange() {
		if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
			scope.dispatchEvent(lockEvent);
			scope.isLocked = true;
		} else {
			scope.dispatchEvent(unlockEvent);
			scope.isLocked = false;
		}
	}

	function onPointerlockError() {
		console.error('THREE.Controls: Unable to use Pointer Lock API');
	}

	this.connect = function () {
		scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove);
		scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange);
		scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError);
	};

	this.disconnect = function () {
		scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove);
		scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange);
		scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError);
	};

	this.dispose = function () {
		this.disconnect();
	};

	this.getObject = function () { // retaining this method for backward compatibility
		return camera;
	};

	this.getDirection = function () {
		var direction = new Vector3(0, 0, - 1);
		return function (v) {
			return v.copy(direction).applyQuaternion(camera.quaternion);
		};
	}();

	this.lock = function () {
		this.domElement.requestPointerLock();
	};

	this.unlock = function () {
		scope.domElement.ownerDocument.exitPointerLock();
	};

	this.connect();
};

Controls.prototype = Object.create(EventDispatcher.prototype);
Controls.prototype.constructor = Controls;

export { Controls };
var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.controls = (function() {	

	let ret = {
		walkSpeedForwardMvu: 0,
		walkSpeedSideMvu: 0,
	};
	
	let walkSpeedStepMvu = 2;
	let mouseHSensitivity = 0.5;
	let mouseVSensitivity = 1;
	
	let left = false;
	let right = false;
	let forward = false;
	let back = false;
	
	let player;
	let canvas;
	let angleSpan;
		
	let lockChangeAlert = function() {
		if (document.pointerLockElement === canvas ||
			document.mozPointerLockElement === canvas) {
			console.log('The pointer lock status is now locked');
			document.addEventListener("mousemove", updatePosition, false);
		} else {
			console.log('The pointer lock status is now unlocked');
			document.removeEventListener("mousemove", updatePosition, false);
		}
	};
	
	let updatePosition = function(e) {
		player.rotHorDG += mouseHSensitivity * e.movementX;
		if (player.rotHorDG < 0) player.rotHorDG += 360;
		if (player.rotHorDG > 360) player.rotHorDG -= 360;
		player.angleChanged = true;
		// ! zhoršuje performance
		//angleSpan.innerHTML = player.rotHorDG;
		//console.log(player.rotHorDG);
		player.rotHorRD = $.raycast.units.toRad(player.rotHorDG);
		//player.rotVerRD = mouseVSensitivity * (height / 2 - e.clientY);
	};
	
	ret.updateSpeed = function() {
		if (forward) {
			ret.walkSpeedForwardMvu = walkSpeedStepMvu;
		} else if (back) {
			ret.walkSpeedForwardMvu = -walkSpeedStepMvu;
		} else {
			ret.walkSpeedForwardMvu = 0;
		}
		
		if (left) {
			ret.walkSpeedSideMvu = walkSpeedStepMvu;
		} else if (right) {
			ret.walkSpeedSideMvu = -walkSpeedStepMvu;
		} else {
			ret.walkSpeedSideMvu = 0;
		}		
	};
	
	let changeState = function(event, state) {
		switch (event.keyCode) {
			case 87: forward = state; break;
			case 83: back = state; break;
			case 65: left = state; break;
			case 68: right = state; break;
		}
	}
	
	let onKeyDown = function(event) {
		changeState(event, true);
	};

	let onKeyUp = function(event) {
		changeState(event, false);
	};
	
	ret.init = function(ui, playerRef) {
		player = playerRef;
		canvas = ui.canvas;
		angleSpan = ui.angleSpan;
		
		document.addEventListener("keydown", onKeyDown);
		document.addEventListener("keyup", onKeyUp);

		canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
		document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
		canvas.onclick = function() {
			canvas.requestPointerLock();
		};
		document.addEventListener('pointerlockchange', lockChangeAlert, false);
		document.addEventListener('mozpointerlockchange', lockChangeAlert, false);	

		return ret;
	};
	return ret;
	
})();
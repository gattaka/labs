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
		// ! zhoršuje performance
		//angleSpan.innerHTML = player.rotHorDG;
		//console.log(player.rotHorDG);
		player.rotHorRD = $.raycast.units.toRad(player.rotHorDG);
		//player.rotVerRD = mouseVSensitivity * (height / 2 - e.clientY);
	};
	
	let onKeyDown = function(event) {
		switch (event.keyCode) {
			case 87:
				ret.walkSpeedForwardMvu = walkSpeedStepMvu;
				break;
			case 83:
				ret.walkSpeedForwardMvu = -walkSpeedStepMvu;
				break;
			case 65:
				ret.walkSpeedSideMvu = walkSpeedStepMvu;
				break;
			case 68:
				ret.walkSpeedSideMvu = -walkSpeedStepMvu;
				break;
			// Browser to dělá sám
			/*
			case 27:
				canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
				canvas.requestPointerLock();
				break;
			*/
		}
	};

	let onKeyUp = function(event) {
		switch (event.keyCode) {
			case 87:
			case 83:
				ret.walkSpeedForwardMvu = 0;
				break;
			case 65:
			case 68:
				ret.walkSpeedSideMvu = 0;
				break;
		}
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
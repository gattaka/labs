import * as THREE from '../js/three.module.js';			

let Info = function () {
	const infoDiv = document.getElementById("info");
	
	const infoLines = [];
	const infoDelay = .1;
	
	let infoCooldown = infoDelay;
	
	let ret = {};
	ret.update = function(delta) {
		infoCooldown -= delta;
		if (infoCooldown <= 0) {				
			infoCooldown = infoDelay;
			infoDiv.innerHTML = "";
			infoLines.forEach(callback => {
				infoDiv.innerHTML += "<div>" + callback() + "<div/>";
			});
		}
	}
	
	ret.addInfoSource = function(callback) {
		infoLines.push(callback)
	};
	
	return ret;
};

export { Info };
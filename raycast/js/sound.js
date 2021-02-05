var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.sound = (function() {	
	
	let sound = function(src, loop) {
		this.sound = document.createElement("audio");
		this.sound.src = src;
		this.sound.setAttribute("preload", "auto");
		this.sound.setAttribute("controls", "none");
		this.sound.setAttribute("loop", loop);		
		this.sound.style.display = "none";
		document.body.appendChild(this.sound);
		this.play = function(){
			this.sound.play();
		}
		this.stop = function(){
			this.sound.pause();
		}
	};
	
	let	lib = {};
	
	let ret = {};
	ret.init = function() {
		lib["bgrMusic"] = new sound("https://www.gattserver.cz/fm-files/raycasting/music/Atrium.mp3", true);
		lib["walkMusic"] = new sound("https://www.gattserver.cz/fm-files/raycasting/sfx/walking.mp3", true);
		return ret;
	};
	ret.play = function(name) {
		let sound = lib[name];
		if (typeof sound !== undefined) sound.play();
	};
	ret.stop = function(name) {
		let sound = lib[name];
		if (typeof sound !== undefined) sound.stop();
	};
	return ret;

})();		
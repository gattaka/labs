let SoundManager = function () {	

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
	lib["ambient"] = new sound("../sfx/keblov.mp3", true);
	//lib["walking"] = new sound("../sfx/walking.mp3", true);	
	
	let ret = {};
	ret.active = false;
	
	ret.play = function(name) {
		let sound = lib[name];
		if (typeof sound !== undefined) sound.play();
	};
	
	ret.speed = function(name, speed) {
		let sound = lib[name];
		sound.playbackRate = speed;
	};
	
	ret.stop = function(name) {
		let sound = lib[name];
		if (typeof sound !== undefined) sound.stop();
	};
	
	return ret;
};

export { SoundManager };
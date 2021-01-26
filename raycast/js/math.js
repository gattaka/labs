var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.math = (function() {	

	let ret = {};

	ret.vecCross = function(a, b) {
		// a × b = ax * by − ay * bx
		return a.x * b.y - a.y * b.x;
	};

	ret.vecScal = function(a, t) {
		// a * t = [ax * t, ay * t]
		return { x: a.x * t, y: a.y * t };
	};

	ret.vecDiff = function(a, b) {
		// a - b = [ax - bx, ay - by]
		return { x: a.x - b.x, y: a.y - b.y };
	};

	ret.vecAdd = function(a, b) {
		// a + b = [ax - bx, ay + by]
		return { x: a.x + b.x, y: a.y + b.y };
	};

	ret.vec = function(x, y) {
		return { x: x, y: y };
	};
	
	return ret;		
	
})();
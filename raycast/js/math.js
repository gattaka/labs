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
	
	// https://codereview.stackexchange.com/questions/47003/optimize-vector-rotation
	ret.rotateVectorFactory = function(angle, x0, y0) {
		let cos = Math.cos(angle);
		let sin = Math.sin(angle);
		return function(xp, yp) {
			let x = xp - x0;
			let y = yp - y0;
			return {
				x: x * cos - y * sin + x0,
				y: x * sin + y * cos + y0,
			};
		}
	};
	
	return ret;		
	
})();
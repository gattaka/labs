var $ = $ || {};
$.GJSLibColors = {
	hslToColor: function(h, s, l) {		
		return "hsl(" + (360 * h) + ", " + (s * 100) + "%, " + (l * 100) + "%)";
	}
};
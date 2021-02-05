var $ = $ || {};
$.raycast = $.raycast || {};
$.raycast.units = (function() {	

	// Jednotky
	// CL -- cell unit, jednotka buňky mapy = 1
	// MU -- map unit, jednotka virtuální mapy
	// MN -- minimapk unit, jednotka zobrazení minimapy
	// SC -- scena unit, jednotka zobrazení scény
	// DG -- degrees, stupně
	// RD -- radians, radiány

	let ret = {};

	ret.cluToMvu = 20;
	ret.cluToMvuHalf = ret.cluToMvu / 2;
	ret.mvuToClu = 1 / ret.cluToMvu;
	ret.mvuToMmu = 0.5;	
	
	ret.rad90 = Math.PI / 2;
	ret.rad180 = ret.rad90 * 2;
	ret.rad270 = ret.rad90 * 3;
	ret.rad360 = ret.rad90 * 4;
	
	ret.toRad =  function(angle) {
		return ret.rad90 * angle / 90;
	};
	
	return ret;	
	
})();
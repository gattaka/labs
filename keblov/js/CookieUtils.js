let CookieUtils = function() {
	
	let ret = {};
	ret.setCookie = function(name,value) {
		var expires = "";    
		document.cookie = name + "=" + (value || "")  + expires + "; path=/";
		return ret;
	};
	
	ret.getCookie = function(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	};
	
	ret.getCookieNumber = function(name) {
		return Number(ret.getCookie(name));
	};
	
	return ret;
};

export { CookieUtils };
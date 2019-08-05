var $ = $ || {};
$.GJSLibNumbers = {
	
	toBinary: function(number, powStart) {
		let pow = powStart ? powStart : Math.pow(2, Math.floor(Math.log(number) / Math.log(2)));
		let result = [];
		while (pow > 0) {
			result.push((number & pow) >= 1 ? 1 : 0);			
			pow = pow >> 1;
		}
		return result;
	},
	
	toDecimal: function(binary) {
		let result = 0;
		let pow = 1 << (binary.length - 1);
		for (let i = 0; i < binary.length; i++) {
			if (binary[i] == 1)
				result += pow;
			pow = pow >> 1;
		}
		return result;
	}
}
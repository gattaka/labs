var $ = $ || {};
$.GJSLibNumbers = {
	
	serializeBinary: function(binary) {
		let serialized = "";
		for (let i = 0; i < binary.length; i++)
			serialized = serialized + binary[i];
		return serialized;
	},
	
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
	},
	
	toEliasGamma: function(number) {
		let binary = $.GJSLibNumbers.toBinary(number);
		let result = [];
		for (let i = 0; i < binary.length - 1; i++)
			result[i] = 0;
		return result.concat(binary);
	},
	
	toEliasDelta: function(number) {
		let n = Math.floor(Math.log(number) / Math.log(2));
		let binary = $.GJSLibNumbers.toBinary(number).splice(1);
		let result = $.GJSLibNumbers.toEliasGamma(n + 1);
		return result.concat(binary);
	},
		
	toEliasOmega: function(number) {
		let result = [0];
		while (number > 1) {			
			let binary = $.GJSLibNumbers.toBinary(number);			
			result = binary.concat(result);
			number = binary.length - 1;
		}
		return result;
	}
}
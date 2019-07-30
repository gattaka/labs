var $ = $ || {};
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
// https://stackoverflow.com/questions/32647215/declaring-static-constants-in-es6-classes
$.GJSLibMatrix = class GJSLibMatrix {	
	
	static checkDefined(o, err) {
		if (typeof o === 'undefined')
			throw err + " is undefined";
	}
	
	static checkDefinedNumber(o, err) {
		GJSLibMatrix.checkDefined(o, err);
		if (typeof o != 'number')
			throw err + " is not a number";
	}
	
	static checkDefinedPositiveInteger(o, err) {
		GJSLibMatrix.checkDefinedNumber(o, err);
		if (!Number.isInteger(o))
			throw err + " is not an integer";
		if (o < 0)
			throw err + " is must be positive integer";
	}
	
	static checkMatrixInstance(m) {
		if (!(m instanceof GJSLibMatrix)) 
			throw "Not a GJSLibMatrix instance";
	}		
	
	static createIdentity(dimension) {
		GJSLibMatrix.checkDefinedPositiveInteger(dimension, "dimension");
		let matrix = new GJSLibMatrix(dimension, dimension);
		for (let i = 0; i < dimension; i++)
			matrix.set(i, i, 1);
		return matrix;
	}
	
	static fromFlatArray(rows, cols, array) {
		if (typeof array != 'object')
			throw "Not a GJSLibMatrix instance";		
		let matrix = new GJSLibMatrix(rows, cols);
		let i = 0;
		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				GJSLibMatrix.checkDefinedNumber(array[i], "element [" + r + "," + c + "]");
				matrix.set(r,c, array[i++]);
			}
		}
		return matrix;
	}
	
	constructor(rows, cols) {
		this.data = [];	
		GJSLibMatrix.checkDefinedPositiveInteger(rows, "rows");
		GJSLibMatrix.checkDefinedPositiveInteger(cols, "cols");	
		this.rows = rows;
		this.cols = cols;
		// indexově jsou nejprve řádky, pak sloupce		
		for (let r = 0; r < rows; r++) {
			let row = [];
			this.data[r] = row;
			for (let c = 0; c < cols; c++) 
				row[c] = 0;
		}
	}
	
	checkDimensions(row, col) {
		GJSLibMatrix.checkDefinedPositiveInteger(row, "row");
		GJSLibMatrix.checkDefinedPositiveInteger(col, "col");
		if (row > this.rows - 1 || row < 0) throw "Invalid row number (0-" + (this.rows - 1) + ")";
		if (col > this.cols - 1 || col < 0) throw "Invalid col number (0-" + (this.cols - 1) + ")";
	}
	
	print() {
		//console.table(this.data);
		let line = '';
		for (let r = 0; r < this.rows; r++) {
			line += r == 0 ? '┌\t' : (r == this.rows - 1 ? '└\t' : '│\t');
			for (let c = 0; c < this.cols; c++) {
				line += this.get(r,c) + '\t';
				if (c == this.cols - 1) {
					line += r == 0 ? '┐' : (r == this.rows - 1 ? '┘' : '│');
					console.log(line);
					line = '';
				}
			}
		}		
	}
	
	toArray() {
		let result = [];
		for (let r = 0; r < this.rows; r++)
			for (let c = 0; c < this.cols; c++)
				result.push(this.get(r,c));
		return result;
	}
	
	getRows() {
		return this.rows;
	}
	
	getCols() {
		return this.cols;
	}
		
	get(row, col) {
		this.checkDimensions(row, col);		
		return this.data[row][col];
	}
	
	set(row, col, value) {
		this.checkDimensions(row, col);	
		GJSLibMatrix.checkDefinedNumber(value, "value");
		this.data[row][col] = value;
	}
	
	add(m) {
		GJSLibMatrix.checkMatrixInstance(m);		
		if (m.getRows() != this.rows)
			throw "A and B has different number of rows";
		if (m.getCols() != this.cols)
			throw "A and B has different number of rows";
		let result = new GJSLibMatrix(this.rows, this.cols);
		for (let r = 0; r < this.rows; r++)			
			for (let c = 0; c < this.cols; c++)
				result.set(r, c, this.get(r, c) + m.get(r, c));
		return result;				
	}
	
	subtract(m) {
		let m2 = m.multiplyByScalar(-1);
		return this.add(m2);
	}
	
	addScalar(n) {
		GJSLibMatrix.checkDefinedNumber(n, "value");
		let result = new GJSLibMatrix(this.rows, this.cols);
		for (let r = 0; r < this.rows; r++)			
			for (let c = 0; c < this.cols; c++)
				result.set(r, c, this.get(r, c) + n);
		return result;				
	}
	
	multiply(m) {
		GJSLibMatrix.checkMatrixInstance(m);		
		if (m.getRows() != this.getCols())
			throw "A.B requires A.cols = B.rows";
		let result = new GJSLibMatrix(this.getRows(), m.getCols());
		for (let r = 0; r < result.getRows(); r++) {
			for (let c = 0; c < result.getCols(); c++) {
				let sum = 0;
				for (let i = 0; i < this.getCols(); i++)
					sum += this.get(r, i) * m.get(i, c);
				result.set(r, c, sum);
			}
		}			
		return result;	
	}
	
	multiplyHadamard(m) {
		GJSLibMatrix.checkMatrixInstance(m);		
		if (m.getRows() != this.getRows())
			throw "A.B requires A.rows = B.rows";
		if (m.getCols() != this.getCols())
			throw "A.B requires A.cols = B.cols";
		let result = new GJSLibMatrix(this.getRows(), this.getCols());
		for (let r = 0; r < result.getRows(); r++)
			for (let c = 0; c < result.getCols(); c++)
				result.set(r, c, this.get(r, c) * m.get(r, c));	
		return result;	
	}
	
	multiplyByScalar(n) {
		GJSLibMatrix.checkDefinedNumber(n, "value");
		let result = new GJSLibMatrix(this.rows, this.cols);
		for (let r = 0; r < this.rows; r++)			
			for (let c = 0; c < this.cols; c++)
				result.set(r, c, this.get(r, c) * n);
		return result;				
	}
	
	map(func) {
		let result = new GJSLibMatrix(this.rows, this.cols);
		for (let r = 0; r < this.rows; r++)			
			for (let c = 0; c < this.cols; c++)
				result.set(r, c, func(this.get(r, c)));
		return result;
	}
	
	transpose() {		
		let result = new GJSLibMatrix(this.getCols(), this.getRows());
		for (let r = 0; r < this.getRows(); r++)
			for (let c = 0; c < this.getCols(); c++) 
				result.set(c, r, this.get(r, c));
		return result;
	}
};

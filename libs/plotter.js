var $ = $ || {};
$.GJSLibPlotter = class GJSLibPlotter {
	
	constructor(canvas, xUnit, yUnit, xCenter, yCenter) {
		
		this.labels = [];
		this.points = [];
		this.functions = [];	
	
		this.refreshCallback;
		
		let plotterSelf = this;
		
		let ctx = canvas.getContext("2d");
		let width = canvas.offsetWidth;
		let height = canvas.offsetHeight;	
		let dragged = false;
		let xDraggedStart;
		let yDraggedStart;				
		
		let xUnitOriginal = xUnit;
		let yUnitOriginal = yUnit;
		
		let xUnitsLength;
		let yUnitsLength;
		let xUnitPx;
		let yUnitPx;
		
		// kolik px má na jednotka na ose
		let axisStepPx = 50;
		let xAxisSteps = Math.ceil(width / axisStepPx);	
		let yAxisSteps = Math.ceil(height / axisStepPx);	
		
		let xPxOffset;
		let yPxOffset;
		
		let calibrate = function() {			
			xUnitsLength = xAxisSteps * xUnit;
			yUnitsLength = yAxisSteps * yUnit;
			xUnitPx = axisStepPx / xUnit;
			yUnitPx = axisStepPx / yUnit;
		};
		
		let init = function() {				
			calibrate();
			xUnit = xUnitOriginal;
			yUnit = yUnitOriginal;		
			xPxOffset = -xCenter * xUnitPx;
			yPxOffset = yCenter * yUnitPx;
			paint();
		}

		let roundUnit = function(unit) {
			return Number(unit.toPrecision(2));
		};
		
		let paint = function() {		
			ctx.clearRect(0, 0, width, height);
			ctx.strokeStyle = "grey";
			ctx.fillStyle = "grey";
			let fontSize = 11;
			let fontOffset = 6;
			let axesDrawTolerance = fontSize + fontOffset;
			ctx.font = fontSize + "px Monospace";		
			
			ctx.strokeRect(0, 0, width, height);

			let funcLineSize = 2;
			let pointSize = 4;
			
			calibrate();

			let xOffsetSteps = Math.floor(xPxOffset / axisStepPx);
			let yOffsetSteps = Math.floor(yPxOffset / axisStepPx);	
			
			// poloha hlavních osy 
			let xPxZero = width / 2 + xPxOffset;		
			let yPxZero = height / 2 + yPxOffset;		
			
			// Jednotky na osách a popisky
			ctx.strokeStyle = "#ddd";
			ctx.fillStyle = "grey";
			ctx.textAlign = "left";	
			
			// X osa
			// -1 a <= přidává na okraje +1 jednotku, to je kvůli 
			// předvykreslování textu a osy, protože by se jinak 
			// při scrollování najednou objevila, namísto vysunutí		
			let xFromPxZeroSteps = Math.floor(xAxisSteps / 2) + xOffsetSteps;
			let xFromPxZeroPxOffset = xPxZero - axisStepPx * xFromPxZeroSteps;
			for (let i = -1; i <= xAxisSteps; i++) {	
				let axisNumber = xUnit * (i - xFromPxZeroSteps);
				let cx = xFromPxZeroPxOffset + axisStepPx * i;
				let textX = cx + fontOffset;

				ctx.beginPath();
				ctx.moveTo(cx, 0);
				ctx.lineTo(cx, height);
				ctx.stroke();		
				ctx.textAlign = "left";
				ctx.fillText(roundUnit(axisNumber), textX, yPxZero - fontOffset);	
			}
			
			// Y osa		
			let yFromPxZeroSteps = yOffsetSteps - Math.floor(yAxisSteps / 2);
			let yFromPxZeroPxOffset = yPxZero - axisStepPx * yFromPxZeroSteps;
			for (let i = 0; i <= yAxisSteps; i++) {		
				let axisNumber = yUnit * (yFromPxZeroSteps + i);
				let cy = yFromPxZeroPxOffset - axisStepPx * i;		
		
				ctx.beginPath();
				ctx.moveTo(0, cy);
				ctx.lineTo(width, cy);
				ctx.stroke();

				let textY = cy - fontOffset;					
				ctx.fillText(roundUnit(axisNumber), xPxZero + fontOffset, textY);				
			}					
			
			// Hlavní čáry os
			ctx.strokeStyle = "grey";
			ctx.fillStyle = "grey";

			// x osa grafu		
			ctx.beginPath();
			ctx.moveTo(0, yPxZero);
			ctx.lineTo(width, yPxZero);
			ctx.stroke();
			
			// y osa grafu		
			ctx.beginPath();
			ctx.moveTo(xPxZero, 0);
			ctx.lineTo(xPxZero, height);
			ctx.stroke();						
				
			// PLOT		
				
			let colors = ["blue", "red", "lime", "cyan", "orange"];
			
			let stepX = 1 / xUnitPx;
			let xFromUnit = -xUnitsLength / 2 - xOffsetSteps * xUnit;
			let xToUnit = xFromUnit + xUnitsLength;
			let yFromUnit = -yUnitsLength / 2 + yOffsetSteps * yUnit;
			let yToUnit = yFromUnit + yUnitsLength;
							
			ctx.font = "15px Monospace";
			for (let l = 0; l < plotterSelf.labels.length; l++) {
				if (plotterSelf.labels[l]) {
					ctx.fillStyle = colors[l];
					ctx.fillRect(10, 13 + l * 20, 5, 5);
					ctx.fillText(plotterSelf.labels[l], 20, 20 + l * 20);
				}
			}
				
			// -xUnit protože jednotky X jsou vypisované zleva a graf by se
			// dokresloval u levého kraje skokově
			for (let x = xFromUnit - xUnit; x <= xToUnit; x += stepX) {
				for (let i = 0; i < plotterSelf.functions.length; i++) {				
					let y = plotterSelf.functions[i](x);
					if (typeof y === 'undefined')
						continue;
					let cx = x * xUnitPx + xPxZero;
					let cy = yPxZero - y * yUnitPx;
					ctx.fillStyle = colors[i];
					ctx.fillRect(cx - funcLineSize / 2, cy - funcLineSize / 2, funcLineSize, funcLineSize);
				}
			}
			for (let x = xFromUnit - xUnit; x <= xToUnit; x += stepX) {
				for (let i = 0; i < plotterSelf.points.length; i++) {	
					let point = plotterSelf.points[i];
					if (point[0] >= x && point[0] < x + stepX) {
						let cx = x * xUnitPx + xPxZero;
						let cy = yPxZero - point[1] * yUnitPx;
						ctx.fillStyle = "black";
						ctx.fillRect(cx - pointSize / 2, cy - pointSize / 2, pointSize, pointSize);
						ctx.fillText(point[2], cx + 5, cy - 5);
					}
				}
			}
		};
		
		canvas.addEventListener("wheel", function(e) {
			e.preventDefault();
			let step = 1.1;
			if (e.deltaY > 0) {
				xUnit *= step;
				yUnit *= step;
			} else {
				xUnit /= step;
				yUnit /= step;
			}
			paint();
		});	
			
		canvas.addEventListener("mousedown", function (e) {
			dragged = true;
			xDraggedStart = e.clientX;
			yDraggedStart = e.clientY;
		}, false);
	 
		canvas.addEventListener("mouseup", function (e) {
			dragged = false;
		}, false);
		
		canvas.addEventListener("mouseleave", function (e) {
			dragged = false;
		}, false);
		
		canvas.addEventListener("mousemove", function (e) {
			if (!dragged) 
				return;
			xPxOffset -= (xDraggedStart - e.clientX);
			yPxOffset -= (yDraggedStart - e.clientY);
			xDraggedStart = e.clientX;
			yDraggedStart = e.clientY;		
			paint();
		}, false);
		
		canvas.addEventListener("dblclick", function (e) {
			e.preventDefault();
			init();		
		}, false);
		
		init();
		plotterSelf.refreshCallback = paint;
	}	
	
	// vektor -- funkce s omezeným definičním oborem
	static createVectorFunc(x, y, dx, dy) {
		let minX = Math.min(x, x + dx);
		let maxX = Math.max(x, x + dx);
		let a = dy / dx;
		let yOffset = y;
		if (minX != x)
			yOffset -= a * (x - minX);
		return function(x) {
			if (x >= minX && x <= maxX)
				return a * (x - minX) + yOffset;
			// undefined
		}
	}
	
	// dle 'a' a 'b' vrátí funkci y = ax + b
	static createLineFunc(a, b) {
		return function(x) {
			return a * x + b;
		}
	}
	
	// dle 'a', 'b' původní funkce a [x, y] průsečíku
	// vrátí funkci kolmice k původní funkci v [xk]
	static createNormalFunc(a, b, xk) {
		let ak = -1 / a;
		let bk = xk * (a + 1/a) + b;
		return function(x) {	
			return ak * x + bk;
		};
	}
	
	// vrátí funkci procházející bodem [xp, yp], která
	// je paralelní k funkci dle 'a', 'b'
	static createParallelFunc(a, b, xp, yp) {
		let c = yp - a * xp - b;
		return function(x) {	
			return a * x + b + c;
		};
	};
	
	// vrátí bod [xq, yq], kterým prochází kolmice K a funkce F2. 
	// F2 je paralelní k F1, takže je kolmice obě protíná. F2 prochází
	// bodem [xp, yp]. F1 a K se setkávají v [xk]
	static createParallelsCrossPoint(a, b, xk, xp, yp) {
		let ak = -1 / a;
		let bk = xk * (a + 1/a) + b;
		let c = yp - a * xp - b;
		let xq = (b - bk + c) / (ak - a);
		let yq = a * xq + b + c;
		return [xq, yq];
	};
	
	addFunc(func, label) {
		this.functions.push(func);
		this.labels.push(label);
	}
	
	addPoint(x, y, label) {
		this.points.push([x, y, label]);
	}
	
	refresh() {
		this.refreshCallback();
	}
}
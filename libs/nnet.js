var $ = $ || {};
$.GJSLibNeuralNet = class GJSLibNeuralNet {
							
	static sigmoid() {
		let fce = function(x) {
			return 1 / (1 + Math.pow(Math.E, -x));
		};
		let der = function(x) {
			return fce(x) * (1 - fce(x));
		};
		return {
			fce: fce,
			der: der 
		}
	}

	static smoothReLU() {
		let fce = function(x) {
			return Math.log(1 + Math.pow(Math.E, x));
		};
		let der = function(x) {
			return 1 / (1 + Math.pow(Math.E, -x));
		};
		return {
			fce: fce,
			der: der 
		}
	}

	constructor(layersSizes, activationFunc) {
		// pole matic vah dle vrstvy
		this.weights = [];
	
		// pole vektorů biasů dle vrstvy
		this.biases = [];

		this.triesCount = 0;
		this.successCount = 0;	
		
		this.layersSizes = layersSizes;
		this.activationFunc = activationFunc;
		
		// Matice vah -- pro každý neuron vrstvy jsou 
		// zapsány váhy neuronů (co řádek, to jeden neuron)
		// pokud pak matici vynásobím maticí vstupů
		// projdou se postupně sloupce matice (vstupy neuronu)
		// a provede se součet součinů jeho vah a vstupů
		//	
		//	| w11 w12 w13 |   | x1 |       | w11x1 + w12x2 + w13x3 |   | b1 |
		//  | w21 w22 w23 | . | x2 | + B = | w21x1 + w22x2 + w23x3 | + | b2 |
		//                    | x3 |   
		
		// net init
		// pro každou vrstvu (kromě 0. ta indikuje pouze počet vstupů)
		for (let l = 1; l < layersSizes.length; l++) {
			let inputSize = layersSizes[l - 1];
			let layerSize = layersSizes[l]
			let layerWeights = new $.GJSLibMatrix(layerSize, inputSize);
			// sloupcový vektor
			let layerBiases = new $.GJSLibMatrix(layerSize, 1);
			this.weights[l] = layerWeights;
			this.biases[l] = layerBiases;			
			// pro každý neuron z vrstvy
			for (let row = 0; row < layerSize; row++) {	
				// pro každý vstup do neuronu
				for (let col = 0; col < inputSize; col++) 
					layerWeights.set(row, col, Math.random() * 2 - 1);
				layerBiases.set(row, 0, Math.random() * 2 - 1);
			}
		}	
	}	
	
	setWeights(layer, weights) {
		this.weights[layer] = weights;
	}
	
	setBiases(layer, biases) {
		this.biases[layer] = biases;
	}
	
	guess(inputs) {
		let inputSize = this.layersSizes[0];
		let L = this.layersSizes.length - 1;		
		
		// pole vektorů potenciálů dle vrstvy
		let potentials = [];
		// pole vektorů aktivací dle vrstvy
		let activations = [$.GJSLibMatrix.fromFlatArray(this.layersSizes[0], 1, inputs)];
		for (let l = 1; l < this.layersSizes.length; l++) {
			// z^l = w^l . a^(l-1) + b^l
			potentials[l] = this.weights[l].multiply(activations[l - 1]).add(this.biases[l]);
			// a^l = sigma(z^l)
			activations[l] = potentials[l].map(this.activationFunc.fce);
		}
		return activations[L].toArray();
	}
		
	train(trainBatchInputs, trainBatchOutputs, sensitivity, maxError, onGuess) {
		let batchSize = trainBatchInputs.length;
		
		// pole vektorů potenciálů dle vrstvy
		let potentials = [];
		// pole vektorů aktivací dle vrstvy
		let activations = [];
		// pole vektorů chyb dle vrstvy
		let errors = [];
		
		let L = this.layersSizes.length - 1;
		
		// pro každý příklad z dávky
		for (let b = 0; b < batchSize; b++) {
			activations[b] = [];
			errors[b] = [];
						
			// sloupcový vektor vstupů
			let inputs = $.GJSLibMatrix.fromFlatArray(this.layersSizes[0], 1, trainBatchInputs[b]);
			// sloupcový vektor známé hodnoty výstupu			
			let target = $.GJSLibMatrix.fromFlatArray(this.layersSizes[L], 1, trainBatchOutputs[b]);
			
			// potenciály a aktivace
			activations[b][0] = inputs;
			for (let l = 1; l < this.layersSizes.length; l++) {
				// z^l = w^l . a^(l-1) + b^l
				potentials[l] = this.weights[l].multiply(activations[b][l - 1]).add(this.biases[l]);
				// a^l = sigma(z^l)
				activations[b][l] = potentials[l].map(this.activationFunc.fce);
			}				
			
			// chyba výsledné vrstvy
			// delta^L = (a^L - y) o sigma'(z^L)
			errors[b][L] = activations[b][L].subtract(target).multiplyHadamard(potentials[L].map(this.activationFunc.der));
			
			// chyby vnitřních vrstev
			for (let l = L - 1; l > 0; l--) {
				// l = L - 1, L - 2, ..., 2 (1. je vstup)
				// delta^l = ((w^(l+1))^T . delta^(l+1)) o sigma'(z^l)
				errors[b][l] = this.weights[l+1].transpose().multiply(errors[b][l+1]).multiplyHadamard(potentials[l].map(this.activationFunc.der));
			}
			
			this.triesCount++;
		
			// C = 1/2 * sum_j((y_j - a_j^L)^2)
			let cost = 0;
			for (let j = 0; j < this.layersSizes[L]; j++)
				cost += Math.pow(target.get(j, 0) - activations[b][L].get(j, 0), 2);
			cost /= 2;
		
			// učení
			if (cost < maxError)
				this.successCount++;	

			if (b == 0)
				onGuess(inputs.toArray(), target.toArray(), activations[b][L].toArray(), this.triesCount, this.successCount);
		}
				
		// aktualizuj váhy a biasy
		for (let l = L; l > 0; l--) {
			let weightsDeltaSumMatrix;
			let biasesDeltaSumVector;
			for (let b = 0; b < batchSize; b++) {
				let deltaW = errors[b][l].multiply(activations[b][l-1].transpose());
				weightsDeltaSumMatrix = b == 0 ? deltaW : weightsDeltaSumMatrix.add(deltaW);
				let deltaB = errors[b][l];
				biasesDeltaSumVector = b == 0 ? deltaB : biasesDeltaSumVector.add(deltaB);
			}
			weightsDeltaSumMatrix = weightsDeltaSumMatrix.multiplyByScalar(sensitivity / batchSize);
			biasesDeltaSumVector = biasesDeltaSumVector.multiplyByScalar(sensitivity / batchSize);
			
			this.weights[l] = this.weights[l].subtract(weightsDeltaSumMatrix);
			this.biases[l] = this.biases[l].subtract(biasesDeltaSumVector);
		}	
	}
	
	getSuccessRate() {
		return this.successCount / this.triesCount * 100;
	}

}
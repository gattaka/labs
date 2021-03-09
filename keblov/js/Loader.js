import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

var Loader = function (info) {
	let ret = {};
	
	let itemsDone = 0;
	let itemsToLoad = 0;
	
	let loadings = [];
	let finishCallback;
	
	let loadedTextures = [];
	let loadedModels = [];
				
	ret.loadTexturesByRequest = function(request) {
		loadings.push({request: request, loader: textureLoad});
		itemsToLoad += request.links.length;
	};
	
	ret.loadTexture = function(link, callback) {
		ret.loadTexturesByRequest({linkPrefix: '', links: [link], callback: callback});
	};
	
	ret.loadModel = function(link, callback) {
		let request = {link: link, callback: callback};		
		loadings.push({request: request, loader: modelLoad});
		itemsToLoad++;
	};

	let indicateProgress = function(caption) {
		itemsDone++;
		let progress = Math.floor(itemsDone / itemsToLoad * 100);
		info.displayNow("<div>" + progress + "%<div/><div>" + caption + "</div>");
	};
	
	let textureLoad = function(request, i) {
		let loaded = [];
		request.links.forEach(link => {
			let fullLink = link;
			if (request.linkPrefix !== undefined)
				fullLink = request.linkPrefix + fullLink;
			let tex = new THREE.TextureLoader().load(fullLink);
			loadedTextures[fullLink] = tex;
			indicateProgress(fullLink);
			loaded.push(tex);
		});
		if (request.callback !== undefined)
			request.callback(loaded);
		loadLoading(i + 1);
	};
	
	let modelLoad = function(request, i) {
		new GLTFLoader().load(request.link, model => {
			request.callback(model);			
			indicateProgress(request.link);
			loadedModels[request.link] = model;
			loadLoading(i + 1);
		});	
	};
	
	let loadLoading = function(i) {
		if (loadings.length == i) {
			finishCallback();	
		} else {
			let loading = loadings[i];
			loading.loader(loading.request, i);
		}		
	};
	
	ret.performLoad = function(callback) {
		if (loadings.length == 0) {
			callback();
		} else {			
			finishCallback = callback;
			loadLoading(0);
		}			
	};
	
	ret.getTexture = function(link) {
		return loadedTextures[link];
	};
	
	ret.getModel = function(link) {
		return loadedModels[link];
	};
	
	return ret;
};

export { Loader };
var $ = $ || {};
$.GIsoGame = $.GIsoGame || {};
$.GIsoGame.PersistanceManager = {	
	create: function() {
		
		let dbVersion = 1.0;
		let dbName = "GIsoGame";
		let objectstoreName = "saves";
		let itemName = "savedMap";
		let db;
 
		let ready = false;
		let todo = [];
		let makeReady = function() {
			ready = true;
			todo.forEach((e) => {
				if (e) e();				
			});
		}
        
		let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;		
		let idbTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
		let idbKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;		
		
		if (!indexedDB) {
			console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
			return undefined;
		}		
		
        // Create/open database
        let request = indexedDB.open(dbName, dbVersion);
        let createObjectStore = function(database) {
            // Create an objectStore
            console.log("Creating objectStore")
            database.createObjectStore(objectstoreName);
        };
 
        request.onerror = function(event) {
            console.log("Error creating/accessing IndexedDB database");
        };
 
        request.onsuccess = function(event) {
            console.log("Success creating/accessing IndexedDB database");
            db = request.result;
 
            db.onerror = function (event) {
                console.log("Error creating/accessing IndexedDB database");
            };
 
            // Interim solution for Google Chrome to create an objectStore. Will be deprecated
            if (db.setVersion) {
                if (db.version != dbVersion) {
                    var setVersion = db.setVersion(dbVersion);
                    setVersion.onsuccess = function () {
                        createObjectStore(db);
                        makeReady();
                    };
                }
            } else {
                makeReady();
            }
        };
         
		// This event is only implemented in recent browsers   
        request.onupgradeneeded = function (event) {
            createObjectStore(event.target.result);
        };
				 
		let openTransaction = function() {
			// Open a transaction to the database
			let readWriteMode = typeof IDBTransaction.READ_WRITE == "undefined" ? "readwrite" : IDBTransaction.READ_WRITE;
			let transaction = db.transaction([objectstoreName], readWriteMode);
			return transaction;
		};

		return {
			saveData: function(data) {
				let operation = function() {
					console.log("Save:" + data.length);
					// Put the blob into the dabase
					let transaction = openTransaction();
					let put = transaction.objectStore(objectstoreName).put(data, itemName);
				}
				if (ready) {
					operation();
				} else {
					todo.push(operation);
				}
				// TODO
				return true;
			},
			
			loadData: function(callback) {
				let operation = function() {
					let transaction = openTransaction();
					// Retrieve the file that was just stored
					transaction.objectStore(objectstoreName).get(itemName).onsuccess = function (event) {
						let result = event.target.result;
						if (result) {
							console.log("Load:" + result.length);
						} else {
							console.log("Load failed -- no data found");
						}
						callback(result);
					};
				}
				if (ready) {
					operation();
				} else {
					todo.push(operation);
				}
			},	
		}
	}	
};
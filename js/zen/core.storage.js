function Storage (schema) {

	if (arguments.length > 0) {
		this.init(schema);
	}

	return this;
}

Storage.prototype = {
	
	init: function (schema) {
		this.schema = schema;
		this.db = null;
	},


	open: function () {
		var self = this;
		return new Promise(function (resolve, reject) {
			var req = indexedDB.open(self.schema.name, self.schema.version);
			req.onerror = (e) => {
				core.log('database open failed');
				reject(e);
			};

			req.onsuccess = (e) => {
				core.log('database opened');
				self.db = req.result;
				resolve(self);
			};
			
			req.onupgradeneeded = (e) => {
				core.log('database upgrade');
				self.db = e.target.result;
				self.upgradeTransaction = e.target.transaction;
				self.upgrade();
			};
		});
	},
	
	
	delete: function (cb) {
		if (this.db !== null) {
			this.db.close();
			var req = indexedDB.deleteDatabase(this.schema.name);

			req.onerror = (e) => {
				core.log("Error deleting database.");
			};
			
			req.onsuccess = (e) => {
				core.log("Database deleted");
				core.log(e.result);
				if (cb) {
					cb();
				}
			};

			req.onblocked = (e) => {
				core.log("Couldn't delete database due to the operation being blocked");
			};
		}
	},


	
	upgrade: function (schema) {
		var self = this, os;
		schema = schema !== undefined ? schema : this.schema;
		schema.items.forEach(function (store) {
			if (!self.db.objectStoreNames.contains(store.name)) {
				os = self.db.createObjectStore(store.name, store.key);
			} else {
				os = self.upgradeTransaction.objectStore(store.name);
			}
			
			os.transaction.oncomplete = function(e) {
				core.log('ObjectStore created ' + os.name);
			};

			if (store.indices && store.indices.length > 0) {
				store.indices.forEach(function (idx) {
					var unique = idx.unique !== undefined ? idx.unique : false;
					if (!os.indexNames.contains(idx.name)) {
						os.createIndex(idx.name, idx.name, {unique: unique});
						core.log('index ' + idx.name + ' created.', unique);
					}
				});
			}
		});
	},


	/**
	 * Add record to object store
	 *
	 * @param {string} osName name of the store
	 * @param {Object|Array} o object or array of objects to add
	 */
	add: function (osName, o) {
		var self = this;
		return new Promise(function (resolve, reject) {
			// core.log('adding', o);
			var t = self.db.transaction([osName], "readwrite");
			var os = t.objectStore(osName);

			let req = os.add(o);
			req.onsuccess = function(e) {
				core.log('object added to ' + osName, e.target.result);
				resolve();
			};
			
			t.oncomplete = function(e) {
				core.log(os + ' transaction complete ');
			};
			
			t.onerror = function(e) {
				core.log(os + 'transaction failed', e);
			};
		});

	},


	clear: function (osName) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var t = self.db.transaction([osName], "readwrite");
			var os = t.objectStore(osName);
			var req = os.clear();
			req.onsuccess = function(e) {
				core.log(osName + ' cleared');
			};

			t.oncomplete = function(e) {
				resolve();
			};

		});
	},
	

	addMany: function (stores, items) {
		var self = this;
		return new Promise(function (resolve, reject) {

			var t = self.db.transaction(stores, "readwrite");

			items.forEach((item) => {
				core.log('adding', item.store, item.data);
				var os = t.objectStore(item.store);
				var req = os.put(item.data);
				req.onsuccess = (e) => {
					core.log('object added to ' + item.store, e.target.result);
				};
			});
			
			t.oncomplete = (e) => {
				core.log(' transaction complete ');
				resolve();
			};
			
			t.onerror = (e) => {
				core.log('transaction failed', e);
				reject();
			};
		});
	},
	

	remove: function (osName, idxName, match) {
		var self = this, t, os, index, req;

		if (!Array.isArray(match)) {
			match = [match];
		}
		
		return new Promise(function (resolve, reject) {
			function iter (e) {
				var cur = e.target.result;
				if (cur) {
					if (match.includes(cur.value[idxName])) {
						req = cur.delete();
						var index = match.indexOf(cur.value[idxName]);
						if (index > -1) {
							match.splice(index, 1);
						}
					}
					if (match.length > 0) {
						cur.continue();
					} else {
						resolve();
					}
				} else {
					resolve();
				}
			};
			
			t = self.db.transaction([osName], "readwrite");
			os = t.objectStore(osName);
			os.openCursor().onsuccess = iter;
		});
	},
	

	/**
	 * Get single object from object store
	 *
	 * @param {string} osName name of the store
	 * @param {string} id id of record
	 */
	get: function (osName, id) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var t = self.db.transaction([osName]),
				os = t.objectStore(osName),
				req = os.get(id);

			req.onerror = function(e) {
				core.log('get error', osName, id);
			};

			req.onsuccess = function(e) {
				resolve(req.result);
			};

		});
	},


	/**
	 * Add or update a single object in object store
	 *
	 * @param {string} osName name of the store
	 * @param {Object} o object to update with
	 */
	put: function (osName, o, key) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var t = self.db.transaction([osName], "readwrite"),
				os = t.objectStore(osName), req;

			if (key !== undefined) {
				req = os.put(o, key);
			} else {
				req = os.put(o);
			}

			req.onerror = function(e) {
				core.log('put error');
				core.log(e);
				reject(e);
			};

			req.onsuccess = function(e) {
				resolve(req.result);
			};
		});
	},

	// not the best way - should use a promise wrapped method...
	each: function (param, cb, done) {
		var self = this, idxName, t, os, index;

		function iter (e) {
			var cur = e.target.result;
			if (cur) {
				// core.log('in each');
				cb(cur.value);
				cur.continue();
			} else {
				// core.log('finished each');
				if (done) {
					done();
				}
			}
		};
		
		if (typeof(param) === 'string') {
			t = this.db.transaction([param]);
			os = t.objectStore(param);
			os.openCursor().onsuccess = iter;

		} else {
			t = this.db.transaction([param.os]);
			os = t.objectStore(param.os);
			index = os.index(param.index);
			index.openCursor(null, param.direction).onsuccess = iter;
		}

	},


	filter: function (osName, matchFunc) {
		var self = this, t, os, result = [];

		return new Promise(function (resolve, reject) {
			function iter (e) {
				var cur = e.target.result;
				if (cur) {
					if (matchFunc(cur.value)) {
						result.push(cur.value);
					}
					cur.continue();
				} else {
					resolve(result);
				}
			};
			
			t = self.db.transaction([osName]);
			os = t.objectStore(osName);
			os.openCursor().onsuccess = iter;
		});
	},

	

	match: function (osName, idxName, match, not) {
		var self = this, t, os, index, result = [];

		return new Promise(function (resolve, reject) {
			function iter (e) {
				var cur = e.target.result;
				if (cur) {
					if (not === true) {
						if (cur.value[idxName] !== match) {
							result.push(cur.value);
						}
					} else {
						if (cur.value[idxName] === match) {
							result.push(cur.value);
						}
					}
					cur.continue();
				} else {
					resolve(result);
				}
			};
			
			t = self.db.transaction([osName]);
			os = t.objectStore(osName);
			index = os.index(idxName);
			index.openCursor().onsuccess = iter;
		});

	},
	
	
	getItem: function (osName, idxName, value) {
		var self = this;
		return new Promise(function (resolve, reject) {
			var t = self.db.transaction([osName]);
			var os = t.objectStore(osName);
			var index = os.index(idxName);
			var req = index.get(value);

			req.onerror = function(e) {
				core.log('getItem error', osName, value);
				reject();
			};

			req.onsuccess = function(e) {
				resolve(req.result);
			};
		});
	},



	addData: function (jsonData) {
		var self = this;
		var item, stores = [];

		for (item in jsonData) {
			if (jsonData.hasOwnProperty(item)) {
				stores.push(item);
			}
		}
		
		return new Promise(function (resolve, reject) {
			var t = self.db.transaction(stores, "readwrite");

			stores.forEach((store) => {
				if (Array.isArray(jsonData[store])) {
					jsonData[store].forEach((o) => {
						// core.log('adding', store, o);
						var os = t.objectStore(store);
						var req = os.put(o);
						req.onsuccess = (e) => {
							core.log('object added to ' + store, e.target.result);
						};
					});
				}
			});
			
			t.oncomplete = (e) => {
				core.log(' transaction complete ');
				resolve();
			};
			
			t.onerror = (e) => {
				core.log('transaction failed', e);
				reject();
			};
		});
	},


	

};

core.namespace('core.db', {
	Storage: Storage
});

window.isDebug = true;

function emptyFunction () {}

let core = {
	isDebug: isDebug,
	
	/**
	 * Extend one object with attributes from another and return the result as a new object
	 *
	 * Pass in the objects to merge as arguments.
	 * For a deep (recursive) extend, set the first argument to `true`.
	 */
	extend: function () {
		var extended = {}, deep = false,
			idx = 0, length = arguments.length, prop;
		
		// Merge the object into the extended object
		function merge (obj) {
			for (prop in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, prop)) {
					// If deep merge and property is an object, merge properties
					if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
						extended[prop] = core.extend(true, extended[prop], obj[prop]);
					} else {
						extended[prop] = obj[prop];
					}
				}
			}
		};
		
		// Check if a deep merge
		if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
			deep = arguments[0];
			idx++;
		}
		
		// Loop through each object and conduct a merge
		for (; idx < length; idx++) {
			var obj = arguments[idx];
			merge(obj);
		}
		
		// console.log('extend:', extended);
		return extended;
	},
	
	/**
	 * Merge properties from one object into another
	 * This will perform a deep (recursive merge)
	 * NOTE: this function is similar to "extend", but modifies in place. 
	 * Use "extend" for zero side-effects.
	 * 
	 * @param {Object} a The object to merge to
	 * @param {Object} b The object to merge from
	 */
	merge: function (a, b) {
		var prop;
		for (prop in b) {
			if (Object.prototype.hasOwnProperty.call(b, prop)) {
				// If deep merge and property is an object, merge properties
				if (Object.prototype.toString.call(b[prop]) === '[object Object]') {
					a[prop] = core.merge(a[prop], b[prop]);
				} else {
					a[prop] = b[prop];
				}
			}
		}
	},
	
	
	/**
	 * Create a namespace hierarchy from a delimited path (e.g. this.is.a.path)
	 * If the path components exist leave them alone, otherwise create an empty
	 * object to hold it.
	 * 
	 * @param {String} path dot delimited namespace path
	 * @param {Object} extendWith object containing content (e.g. code) for that namespace
	 */
	namespace: function (path, extendWith) {
		var i, d, o = core;
		d = path.split(".");
		
		for (i = d[0] === "core" ? 1 : 0; i < d.length; i++) {
			o[d[i]] = o[d[i]] || {};
			o = o[d[i]];
		}
		
		if (extendWith) {
			o = core.merge(o, extendWith);
		}
		
		return o;
	},
	
	log: isDebug !== true ? emptyFunction : console.log.bind(console),
	warn: isDebug !== true ? emptyFunction : console.warn.bind(console),
	error: isDebug !== true ? emptyFunction : console.error.bind(console),
	
	// replace for branded or customised alerts/dialogs
	alert: window.alert.bind(window),
	confirm: window.confirm.bind(window),

	observers: {},
	
	observe: function (queue, id, callback) {
		if (core.observers[queue] === undefined) {
			core.observers[queue] = {};
		}

		core.observers[queue][id] = callback;
	},

	removeObserver: function (queue, id) {
		if (core.observers[queue] !== undefined) {
			delete core.observers[queue][id];
		}
	},
	
	notify: function (queue, params) {
		core.log('NOTIFY:', queue, params);
		if (core.observers[queue] !== undefined) {
			for (let [id, callback] of Object.entries(core.observers[queue])) {
				// we don't need the id
				callback(params);
			}
		}
	}

};

window.core = core;


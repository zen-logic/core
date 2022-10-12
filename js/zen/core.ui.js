import './core.js';
import './core.util.js';

let stylesheets = [];

const ui = {

	nullHandler: function (e) {
		e.preventDefault();
		e.stopPropagation();
	},

	
	getElement: function (selector, el) {
		return el !== undefined ? el.querySelector(selector) : document.querySelector(selector);
	},

	
	getElements: function (selector, el) {
		return el !== undefined ? el.querySelectorAll(selector) : document.querySelectorAll(selector);
	},


	addEvent: function (select, event, handler) {
		if (select instanceof HTMLElement) {
			select.addEventListener(event, handler);
		} else if (select instanceof NodeList) {
			select.forEach(function (el) {
				el.addEventListener(event, handler);
			});
		} else if (typeof(select) === 'string') {
			core.ui.getElements(select).forEach(function (el) {
				el.addEventListener(event, handler);
			});
		} else {
			return;
		}
	},


	createElement: function (o, auto) {
		var el;

		o = o !== undefined ? o : {};
		o = {
			tag: o.tag !== undefined ? o.tag : 'div',
			attr: o.attr !== undefined ? o.attr : {},
			cls: o.cls !== undefined ? o.cls : [],
			id: o.id !== undefined ? o.id : null,
			parent: o.parent !== undefined ? o.parent : document.body,
			content: o.content !== undefined ? o.content : '',
			first: o.first !== undefined ? o.first : false
		};

		auto = auto !== undefined ? auto : true;
		
		el = document.createElement(o.tag);
		if (o.id !== null) el.setAttribute('id', o.id);

		core.util.iterObj(o.attr, function (attr, value) {
			el.setAttribute(attr, value);
		});

		o.cls.forEach((cls) => {
			el.classList.add(cls);
		});
		
		el.insertAdjacentHTML('afterbegin', o.content);

		if (auto === true) {
			if (o.first === true) {
				o.parent.insertBefore(el, o.parent.firstChild);
			} else {
				o.parent.appendChild(el);
			}
		}
		return el;
	},


	click: function (el) {
		// Create our event (with options)
		var ev = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		});
		// If cancelled, don't dispatch our event
		var canceled = !el.dispatchEvent(ev);
	},

	
	addStylesheet: function (href) {
		if (stylesheets.includes(href)) {
			return;
		} else {
			stylesheets.push(href);
			if (core.isDebug === true) href = href + '?ts=' + Math.floor(Date.now() / 1000);
			core.ui.createElement({
				tag: 'link',
				attr: {
					rel: 'stylesheet',
					type: 'text/css',
					href: href
				},
				parent: document.head
			});
		}
	},


	loadView: function (url, parent, params) {

		params = new URLSearchParams(params);
		if (core.isDebug === true) {
			params.append('ts', Math.floor(Date.now() / 1000));
		}
		
		return new Promise(function (resolve, reject) {
			var req = new XMLHttpRequest();
			req.onload = () => {
				if (req.status >= 200 && req.status < 400) {
					var el = document.createElement('div');
					el.innerHTML =  req.responseText;
					el = parent.insertBefore(el.firstChild, parent.firstChild);
					resolve(el);
				} else {
					reject();
				}
			};

			req.onerror = () => {
				reject();
			};

			req.open('GET', url + '?' + params.toString());
			req.send();
		});
		
	},


	loadContent: function  (url, params) {
		
		params = new URLSearchParams(params);
		if (core.isDebug === true) {
			params.append('ts', Math.floor(Date.now() / 1000));
		}
		
		return new Promise(function (resolve, reject) {
			let req = new XMLHttpRequest();
			req.onload = () => {
				if (req.status >= 200 && req.status < 400) {
					resolve(req.responseText);
				} else {
					reject();
				}
			};

			req.onerror = () => {
				reject();
			};

			req.open('GET', url + '?' + params.toString());
			req.send();
		});
	},
	

	/* This function turns an element into a drop zone for files
	 * from outside the browser.
	 * It does not perform the upload, but processes each dropped 
	 * file in turn and returns it to the caller
	 */
	dropZone: function (el, type, fileHandler, completed) {
		
		var fileCount = 0, handledFiles = 0;
		
		function reader (f) {
			var fr = new FileReader();
			fr.onload = (e) => {
				fileHandler(fr.result, f);
				handledFiles++;
				if (handledFiles == fileCount && completed !== undefined) {
					completed(fileCount);
					fileCount = 0;
					handledFiles = 0;
				}
			};
			fr.onprogress =  (e) => {};
			fr.onerror = (e) => {core.log('invalid file drop');};
			return fr;
		}
		
		// handle the file
		function readFile (f) {
			switch (type) {
			case 'file':
				fileHandler(f);
				handledFiles++;
				if (handledFiles == fileCount && completed !== undefined) {
					completed(fileCount);
					fileCount = 0;
					handledFiles = 0;
				}
				break;
			case 'binary':
				reader(f).readAsArrayBuffer(f);
				break;
			case 'text':
			default:
				reader(f).readAsText(f);
			}
		}
		
		// nullify default event behaviour we don't want...
		el.addEventListener('dragenter', core.ui.nullHandler, false);
		el.addEventListener('dragleave', core.ui.nullHandler, false);
		el.addEventListener('dragover', core.ui.nullHandler, false);
		el.addEventListener('drop', core.ui.nullHandler, false);

		// actually perform the drop
		el.addEventListener('drop', (e) => {
			var params = e.currentTarget.dataset;
			var files = e.dataTransfer.files;
			fileCount = files.length;
			params.fileCount = fileCount;
			params.processedCount = 0;
			if (fileCount > 0) {
				var idx;
				for (idx = 0; idx < fileCount; idx++) {
					readFile(files[idx]);
				}
				
			}
		}, false);

	},


	animateCSS: function (el, animation, prefix = 'animate__') {
		return new Promise((resolve, reject) => {
			const animationName = `${prefix}${animation}`;
			
			el.classList.add(`${prefix}animated`, animationName);
			
			// When the animation ends, we clean the classes and resolve the Promise
			function handleAnimationEnd() {
				el.classList.remove(`${prefix}animated`, animationName);
				resolve('Animation ended');
			}
			
			el.addEventListener('animationend', handleAnimationEnd, {once: true});
		});
	},

	downloadFile: function (url, filename) {
		let el = core.ui.createElement({
			parent: document.body,
			tag: 'a'
		});

		el.href = url;
		el.download = filename;
		core.ui.click(el);
		el.remove();
	},

	/**
	 * Download from created data
	 * 
	 * @param {ArrayBuffer} data File contents to download 
	 * @param {String} filename name of file
	 * @param {HTMLAnchorElement} el anchor tag to trigger download
	 */
	downloadData: function (data, filename, mimeType, download) {
		
		let el = core.ui.createElement({
			parent: document.body,
			tag: 'a'
		});

		if (app.urldata) {
			URL.revokeObjectURL(app.urldata);
			delete app.urldata;
		}
		
		mimeType = mimeType !== undefined ? mimeType : 'application/octet-stream';
		download = download !== undefined ? download : true;

		const blob = new Blob([data]);
		app.urldata = URL.createObjectURL(blob, {type: mimeType});

		if (download === true) {
			el.download = filename;
		} else {
			el.target = '_blank';
		}

		el.href = app.urldata;
		core.ui.click(el);
	}

};

core.namespace('core.ui', ui);

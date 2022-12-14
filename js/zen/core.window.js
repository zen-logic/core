import './core.desktop.js';

const DRAGLIMIT = 6;

function Window (params) {
	if (arguments.length > 0) {
		this.init(params);
	}
	return this;
}


Window.prototype = {

	set z (val) {
		this.pos.z = val;
		this.el.style.zIndex = val;
	},
	
	get z () {
		return this.pos.z;
	},

	set x (val) {
		let min = this.desktop.minX,
			max = this.desktop.maxX;

		switch (val) {
		case 'centre':
			this.pos.x = Math.round((max / 2) - (this.w / 2));
			break;
		default:
			this.pos.x = val;
		}

		if (val < min) {
			this.pos.x = min;
		} else if (val + this.w > max) {
			this.pos.x = max - this.w;
		}
		
		this.el.style.left = this.pos.x + 'px';
	},
	
	get x () {
		return this.pos.x;
	},

	set y (val) {
		let min = this.desktop.minY,
			max = this.desktop.maxY;
		
		switch (val) {
		case 'centre':
			this.pos.y = Math.round((max / 2) - (this.h / 2));
			break;
		default:
			this.pos.y = val;
		}

		if (val < min) {
			this.pos.y = min;
		} else if (val + this.h > max) {
			this.pos.y = max - this.h;
		}
		
		this.el.style.top = this.pos.y + 'px';
	},
	
	get y () {
		return this.pos.y;
	},

	set w (val) {
		this.size.w = val;
		if (this.size.w < this.size.minW) {
			this.size.w = this.size.minW;
		} else if (this.size.w > this.size.maxW && this.size.maxW > -1) {
			this.size.w = this.size.maxW;
		}

		if (this.x + this.size.w > this.desktop.maxX) {
			this.size.w = this.desktop.maxX - this.x;
		}
		
		this.el.style.width = this.size.w + 'px';
	},
	
	get w () {
		return this.el.getBoundingClientRect().width;
	},
	
	set h (val) {
		this.size.h = val;
		if (this.size.h < this.size.minH) {
			this.size.h = this.size.minH;
		} else if (this.size.h > this.size.maxH && this.size.maxH > -1) {
			this.size.h = this.size.maxH;
		}

		if (this.y + this.size.h > this.desktop.maxY) {
			this.size.h = this.desktop.maxY - this.y;
		}
		
		this.el.style.height = this.size.h + 'px';
	},
	
	get h () {
		return this.el.getBoundingClientRect().height;
	},

	set title (val) {
		if (val) {
			let el = this.el.querySelector('.header .title-bar');
			if (el) el.innerHTML = val;
		}
	},

	defaults: function () {
		this.views = [];
		this.pos = {x: 0, y: 0, z: 0};
		this.size = {w: 140, h: 96, minW: 0, minH: 0, maxW: -1, maxH: -1};
	},
	
	init: function (params) {
		core.log('New Window', params);
		this.defaults();
		this.cfg = params;
		this.desktop = window.desktop;
		this.id = params.id === undefined ? core.util.createUUID() : params.id;
		this.size.minW = params?.size?.minW !== undefined ? params.size.minW : this.size.minW;
		this.size.minH = params?.size?.minH !== undefined ? params.size.minH : this.size.minH;
		this.size.maxW = params?.size?.maxW !== undefined ? params.size.maxW : this.size.maxW;
		this.size.maxH = params?.size?.maxH !== undefined ? params.size.maxH : this.size.maxH;
		this.features = params.features !== undefined ? params.features : [
			'title', 'status', 'max', 'min', 'resize', 'close', 'persist', 'snap'
		];
		this.render();
		this.afterRender();
		return this;
	},

	afterRender: async function () {
		if (this.cfg.view) {
			core.ui.loadView(this.cfg.view, this.body).then((view) => {
				core.log('view did load');
			});
		}

		await this.restoreState();
		this.select();
	},

	
	addView: function (view) {
		if (!this.views.includes(view)) {
			this.views.push(view);
		}
	},

	close: function () {
		this.views.forEach((view) => {
			view.cleanup(this);
			view.el.remove();
		});
		this.desktop.remove(this);
	},
	
	render: function () {
		this.el = core.ui.createElement({id: this.id, parent: this.desktop.el, cls: ['window']});
		if (this.features.includes('title')) {

			this.el.addEventListener('click', (e) => {
				this.select();
			});
			
			this.header = core.ui.createElement({parent: this.el, cls: ['header']});
			this.header.addEventListener('mousedown', (e) => {this.startDrag(e);});

			if (this.features.includes('close')) {
				this.closeButton = core.ui.createElement({parent: this.header, cls: ['btn', 'close']});
				this.closeButton.addEventListener('click', (e) => {
					if (this.preventClick === true) {
						this.preventClick = false;
					} else {
						this.close();
						e.stopPropagation();
					}
				});
			}
			core.ui.createElement({parent: this.header, cls: ['title-bar']});
			
			if (this.features.includes('min') || this.features.includes('max')) {
				const group = core.ui.createElement({parent: this.header, cls: ['btn-group']});
				if (this.features.includes('min')) {
					this.minButton = core.ui.createElement({parent: group, cls: ['btn', 'min']});
					this.minButton.addEventListener('click', (e) => {
						if (this.preventClick === true) {
							this.preventClick = false;
						} else {
							this.minimise();
							e.stopPropagation();
						}
					});
				}
				if (this.features.includes('max')) {
					this.maxButton = core.ui.createElement({parent: group, cls: ['btn', 'max']});
					this.maxButton.addEventListener('click', (e) => {
						if (this.preventClick === true) {
							this.preventClick = false;
						} else {
							this.maximise();
							e.stopPropagation();
						}
					});
				}
			}
		} else {
			this.el.addEventListener('mousedown', (e) => {this.startDrag(e);});
			if (this.features.includes('close')) {
				this.el.addEventListener('click', (e) => {
					if (this.preventClick === true) {
						this.preventClick = false;
					} else {
						this.close();
						e.stopPropagation();
					}
				});
			}
		}
		
		this.body = core.ui.createElement({
			parent: this.el,
			cls: ['body'],
			content: this.cfg.content
		});

		
		if (this.features.includes('status')) {
			this.footer = core.ui.createElement({parent: this.el, cls: ['footer']});
			core.ui.createElement({parent: this.footer, cls: ['status']});
			if (this.features.includes('resize')) {
				this.resizeHandle = core.ui.createElement({parent: this.footer, cls: ['btn', 'resize']});
				this.resizeHandle.addEventListener('mousedown', (e) => {this.startResize(e);});
			}
		}
		
		this.title = this.cfg.title;
	},

	select: function () {
		if (!this.el.classList.contains('active')) {
			this.el.classList.add('active');
			this.desktop.select(this);
			this.desktop.bringToFront(this);
			core.notify('SelectWindow', this);
		}
	},
	
	deselect: function () {
		this.el.classList.remove('active');
		this.desktop.deselect(this);
	},

	savePos: function () {
		this.state = {
			x: this.x,
			y: this.y,
			w: this.w,
			h: this.h
		};
	},

	minimise: function () {
		this.el.classList.remove('maximised');
		if (!this.el.classList.contains('minimised')) {
			let el = this.el.querySelector('.header');
			let h = el.getBoundingClientRect().height;
			this.savePos();
			this.el.classList.add('minimised');
			this.el.style.height = h + 'px';
		} else {
			this.w = this.state.w;
			this.h = this.state.h;
			this.el.classList.remove('minimised');
		}
	},

	maximise: function () {
		this.el.classList.remove('minimised');
		
		if (!this.el.classList.contains('maximised')) {
			this.savePos();
			this.x = 0;
			this.y = 0;
			this.w = this.desktop.maxX;
			this.h = this.desktop.maxY - this.desktop.minY;
			this.el.classList.add('maximised');
		} else {
			this.w = this.state.w;
			this.h = this.state.h;
			this.x = this.state.x;
			this.y = this.state.y;
			this.el.classList.remove('maximised');
		}
	},
	
	startDrag: function (e) {
		let self = this;
		let rect = this.el.getBoundingClientRect();

		this.select();
		this.preventClick = false;

		function prepareDrag (e) {
			if (Math.abs((e.touches === undefined ? e.clientX : e.touches[0].clientX) - self.startX) > DRAGLIMIT ||
				Math.abs((e.touches === undefined ? e.clientY : e.touches[0].clientY) - self.startY) > DRAGLIMIT) {
				self.desktop.el.removeEventListener('mousemove', prepareDrag);
				self.desktop.el.addEventListener('mousemove', drag);
				self.el.classList.add('dragging');
				self.preventClick = true;
			}
		}
		
		function drag (e) {
			self.x = e.clientX - self.offsetX;
			self.y = e.clientY - self.offsetY;
		}
		
		function endDrag (e) {
			self.desktop.el.removeEventListener('mousemove', drag);
			self.desktop.el.removeEventListener('mousemove', prepareDrag);
			self.desktop.el.removeEventListener('mouseup', endDrag);
			self.desktop.el.removeEventListener('mouseout', exitWindow);
			self.el.classList.remove('dragging');
			if (self.desktop.grid && self.features.includes('snap')) {
				self.desktop.snapWindow(self);
			}
			self.saveState();
		}

		function exitWindow (e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;
			if (!from || from.nodeName == "HTML") {
				endDrag(e);
			}
		}
		
		this.startX = e.touches === undefined ? e.clientX : e.touches[0].clientX;
		this.startY = e.touches === undefined ? e.clientY : e.touches[0].clientY;

		this.offsetX = this.startX - rect.left;
		this.offsetY = this.startY - rect.top;

		this.desktop.el.addEventListener('mousemove', prepareDrag);
		this.desktop.el.addEventListener('mouseup', endDrag);
		this.desktop.el.addEventListener('mouseout', exitWindow);
	},

	startResize: function (e) {
		let self = this;
		let rect = this.el.getBoundingClientRect();

		function resize (e) {
			let w = self.startW + (e.touches === undefined ? e.clientX : e.touches[0].clientX) - self.startPos.x;
			let h = self.startH + (e.touches === undefined ? e.clientY : e.touches[0].clientY) - self.startPos.y;
			self.el.classList.add('resizing');
			self.w = w;
			self.h = h;
		}
		
		function endResize (e) {
			self.el.classList.remove('resizing');
			self.el.classList.remove('minimised');
			self.el.classList.remove('maximised');
			self.desktop.el.removeEventListener('mousemove', resize);
			self.desktop.el.removeEventListener('mouseup', endResize);
			self.desktop.el.removeEventListener('mouseout', exitWindow);
			if (self.desktop.grid && self.features.includes('snap')) {
				self.desktop.snapWindow(self);
			}
			self.saveState();
		}

		function exitWindow (e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;
			if (!from || from.nodeName == "HTML") {
				endResize(e);
			}
		}
		
		this.startW = rect.width;
		this.startH = rect.height;
		this.startPos = {
			x: (e.touches === undefined ? e.clientX : e.touches[0].clientX),
			y: (e.touches === undefined ? e.clientY : e.touches[0].clientY)
		};
		
		this.desktop.el.addEventListener('mousemove', resize);
		this.desktop.el.addEventListener('mouseup', endResize);
		this.desktop.el.addEventListener('mouseout', exitWindow);
	},

	saveState: function () {
		if (this.features.includes('persist')) {
			core.log('window save state');
			app.db.put('workbenchData', {
				uid: this.id,
				pos: this.pos,
				size: this.size
			});
		}
	},

	restoreState: async function () {
		if (this.features.includes('persist')) {
			core.log('window restore state');
			const o = await app.db.get('workbenchData', this.id);
			if (o) {
				// reset
				this.w = 0; this.h = 0;
				this.x = 0; this.y = 0;
				
				this.w = o.size.w;
				this.h = o.size.h;
				this.x = o.pos.x;
				this.y = o.pos.y;
			} else {
				this.desktop.autoWindowPos(this);
			}
		} else {
			this.desktop.autoWindowPos(this);
		}
	},

	getMenu: function (menubar) {
		menubar.updateMenu('MNU_WINDOW', []);
	}
	
	
};


core.namespace('core.wb', {
	Window: Window
});

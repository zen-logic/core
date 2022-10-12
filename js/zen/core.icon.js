import './core.ui.js';

const DRAGLIMIT = 6;

function Icon (params) {
	if (arguments.length > 0) this.init(params);
	return this;
}


Icon.prototype = {

	pos: {
		x: 0,
		y: 0,
		z: 0
	},

	size: {
		w: 80,
		h: 90
	},
	
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

		this.pos.x = val;

		if (val < min) {
			this.pos.x = min;
		} else if (val + this.size.w > max) {
			this.pos.x = max - this.size.w;
		}
		
		this.el.style.left = this.pos.x + 'px';
	},
	
	get x () {
		return this.pos.x;
	},

	set y (val) {
		let min = this.desktop.minY,
			max = this.desktop.maxY;
		
		this.pos.y = val;

		if (val < min) {
			this.pos.y = min;
		} else if (val + this.size.h > max) {
			this.pos.y = max - this.size.h;
		}
		
		this.el.style.top = this.pos.y + 'px';
	},
	
	get y () {
		return this.pos.y;
	},


	set label (val) {
		if (val) this.el.querySelector('.label').innerText = val;
	},

	get label () {
		return this.el.querySelector('.label').innerText;
	},
	
	set image (val) {
		if (val) this.el.querySelector('.image').style.backgroundImage = 'url('+val+')';
	},
	
	
	init: function (params) {
		core.log('New Icon', params);
		this.cfg = params;
		this.parent = params.parent !== undefined ? params.parent : window.desktop;
		this.desktop = window.desktop;
		this.id = params.id === undefined ? core.util.createUUID() : params.id;
		this.data = params.data === undefined ? {} : params.data;
		this.fixed = params.fixed;

		this.render();
		return this;
	},

	render: function () {
		let el = this.parent.el;
		if (this.cfg.el) el = this.cfg.el;
		
		this.el = core.ui.createElement({
			parent: el,
			cls: ['icon'],
			content: `<div class="image"></div><div class="label"></div>`
		});

		this.label = this.cfg.label;
		this.image = this.cfg.image;
		this.x = this.cfg.x !== undefined ? this.cfg.x : 0;
		this.y = this.cfg.y !== undefined ? this.cfg.y : 0;
		this.z = this.cfg.z !== undefined ? this.cfg.z : 0;
		// this.snapToGrid();
		this.setupEvents();
	},

	setupEvents: function () {
		
		this.el.addEventListener('mousedown', (e) => {this.startDrag(e);});
		
		this.el.addEventListener('click', (e) => {
			if (this.preventClick === true) {
				this.preventClick = false;
			} else {
				let multi = e.ctrlKey || e.shiftKey || e.metaKey;
				this.select(multi);
				core.log('click', this.id);
				if (this.data.click) this.data.click(this);
				e.stopPropagation();
			}
		});
		
		this.el.addEventListener('dblclick', (e) => {
			if (this.preventClick === true) {
				this.preventClick = false;
			} else {
				core.log('double click', this.id);
				if (this.data.dblclick) this.data.dblclick(this);
				e.stopPropagation();
			}
		});
		
	},

	select: function (multi) {
		// core.log('select');
		if (this.el.classList.contains('selected')) {
			// core.log('deselected');
			this.deselect();
		} else {
			// core.log('selected');
			this.el.classList.add('selected');
			this.desktop.select(this, multi);
			this.desktop.bringToFront(this);
		}
	},

	deselect: function () {
		this.el.classList.remove('selected');
		this.desktop.deselect(this);
	},

	arrange: function () {
		if (this.dragItems) {
			this.dragItems.forEach((o) => {
				let diffX = o.r.left - this.r.left,
					diffY = o.r.top - this.r.top;
				if (o !== this) {
					o.x = this.x + diffX;
					o.y = this.y + diffY;
				}
			});
		}
	},
	
	startDrag: function (e) {
		const self = this;
		const rect = this.el.getBoundingClientRect();
		this.startZ = this.z;
		this.preventClick = false;
		this.source = null;
		// multi drag
		this.dragItems = null;
		this.startLabel = null;

		this.startX = e.touches === undefined ? e.clientX : e.touches[0].clientX;
		this.startY = e.touches === undefined ? e.clientY : e.touches[0].clientY;
		this.offsetX = this.startX - rect.left;
		this.offsetY = this.startY - rect.top;
		this.desktop.el.addEventListener('mousemove', prepareDrag);
		this.desktop.el.addEventListener('mouseup', drop);
		this.desktop.el.addEventListener('mouseout', exitWindow);
		this.X = rect.left;
		this.Y = rect.top;

		// core.log(this, self.x, self.y);
		core.log(this.label, this.X, this.Y);
		// core.log(rect.left, rect.top);
		
		function prepareDrag (e) {

			core.log(self.desktop.selected.length,
					 self.el.classList.contains('selected'));
			
			if (Math.abs((e.touches === undefined ? e.clientX : e.touches[0].clientX) - self.startX) > DRAGLIMIT ||
				Math.abs((e.touches === undefined ? e.clientY : e.touches[0].clientY) - self.startY) > DRAGLIMIT) {
				let multi = e.ctrlKey || e.shiftKey || e.metaKey;
				multi = multi || ((self.desktop.selected.length > 1) && self.el.classList.contains('selected'));
				
				if (multi) {
					self.desktop.select(self, true);
					if (self.desktop.selected.length > 1) {
						initMultiDrag(e);
						return;
					}
				}
				
				// we only get here if not multiple icons selected
				initSingleDrag(e);
				
			}
		}

		function initSingleDrag (e) {
			self.desktop.deselectAll();
			self.desktop.el.removeEventListener('mousemove', prepareDrag);
			self.desktop.el.addEventListener('mousemove', drag);
			// prevent flash of icon appearing on the
			// workbench if we are dragging in a window
			self.el.style.visibility = 'hidden';
			self.desktop.bringToFront(self);
			self.source = self.parent;
			core.log('source', self.source);
			self.desktop.el.append(self.el);
			self.el.classList.add('dragging');
			self.preventClick = true;
		}
		
		
		function initMultiDrag (e) {
			// core.log('multi drag');
			// pick up all the selected items
			self.dragItems = self.desktop.selected.slice();
			self.desktop.deselectAll();
			self.desktop.el.removeEventListener('mousemove', prepareDrag);
			self.desktop.el.addEventListener('mousemove', drag);
			self.startLabel = self.label;
			self.label = self.dragItems.length + ' items';
			self.el.classList.add('dragging');
			self.preventClick = true;
			self.el.classList.add('multi');
			self.dragItems.forEach((o) => {
				o.source = o.parent;
				o.startZ = o.z;
				o.r = o.el.getBoundingClientRect();
				o.el.style.visibility = 'hidden';
				self.desktop.bringToFront(o);
				self.desktop.el.append(o.el);
			});
		}

		
		function drag (e) {
			self.x = e.clientX - self.offsetX;
			self.y = e.clientY - self.offsetY;
			self.el.style.visibility = 'visible';
		}


		function endDrag (e) {
			self.desktop.el.removeEventListener('mousemove', drag);
			self.desktop.el.removeEventListener('mousemove', prepareDrag);
			self.desktop.el.removeEventListener('mouseup', drop);
			self.desktop.el.removeEventListener('mouseup', endDrag);
			self.desktop.el.removeEventListener('mouseout', exitWindow);
			setTimeout(() => {
				// self.el.style.visibility = 'visible';

				self.z = self.startZ;
				self.el.classList.remove('dragging');
				if (self.dragItems) {
					self.dragItems.forEach((o) => {
						o.z = o.startZ;
						o.el.style.removeProperty('visibility');
					});
					self.label = self.startLabel;
					self.el.classList.remove('multi');
				}

			}, 0);
		}

		function drop (e) {
			endDrag(e);
			if (self.source !== null) {
				let x = e.clientX - self.offsetX;
				let y = e.clientY - self.offsetY;
				self.el.style.visibility = 'hidden';
				let target = document.elementFromPoint(e.clientX, e.clientY);

				if (target.dropTarget && (target.dropTarget !== self.source)) {
					core.log('got new drop target', target.dropTarget);

					// check if the new window/drop target accepts this drop
					// ...


					// yes - ok to perform the drop
					if (self.dragItems) {
						self.dragItems.forEach((o) => {
							o.source.removeItem(o);
							target.dropTarget.drop(o);
						});
						self.arrange();
					} else {
						self.source.removeItem(self);
						target.dropTarget.drop(self);
						self.el.style.removeProperty('visibility');
						// self.snapToGrid();
						self.select();
					}
				} else {
					// core.log('same target', self.source);
					// core.log(target, self.source.el);
					if (self.dragItems) {
						core.log('multiple');
						self.dragItems.forEach((o) => {
							self.source.drop(o);
							o.el.style.removeProperty('visibility');
							// o.snapToGrid();
							// if (target !== self.source.el) {
							// 	o.reset();
							// }
						});
						self.arrange();
					} else {
						self.source.drop(self);
						self.el.style.removeProperty('visibility');
						if (target !== self.source.el) {
							self.reset();
						}
						// self.snapToGrid();
						self.select();
					}
				}
			}
		}

		function exitWindow (e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;
			if (!from || from.nodeName == "HTML") {
				core.log('exit window');
				endDrag(e);
				// self.snapToGrid();
			}
		}

	},
	
	snapToGrid: function () {
		this.x(Math.round(this.x() / ICON_GRID_X)  * ICON_GRID_X);
		this.y(Math.round(this.y() / ICON_GRID_Y)  * ICON_GRID_Y);
	},

	reset: function () {
		core.log(this.label);
		core.log(this.X, this.Y);
		// this.source.drop(this);
		this.x = this.X;
		this.y = this.Y;
	}
	
	
};


core.namespace('core.wb', {
	Icon: Icon
});

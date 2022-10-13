import './core.ui.js';

const DRAGLIMIT = 6;
let currentIcon = null;

function selectIcon (icon, e) {
	currentIcon = icon;

	let rect = icon.el.getBoundingClientRect(),
		startX = e.touches === undefined ? e.clientX : e.touches[0].clientX,
		startY = e.touches === undefined ? e.clientY : e.touches[0].clientY,
		offsetX = startX - rect.left,
		offsetY = startY - rect.top
	;

	icon.dragData = {
		rect: rect,
		initZ: icon.z,
		initX: icon.x,
		initY: icon.y,
		startX: startX,
		startY: startY,
		offsetX: offsetX,
		offsetY: offsetY,
		source: icon.parent
	};

	removeDesktopEvents(); // we only want one set of events assigned at a time
	desktop.el.addEventListener('mousemove', prepareDrag);
	desktop.el.addEventListener('mouseup', cancelDrag);
}


function exitWindow (e) {
	e = e ? e : window.event;
	var from = e.relatedTarget || e.toElement;
	if (!from || from.nodeName == "HTML") {
		endDrag();
	}
}


function removeDesktopEvents () {
	desktop.el.removeEventListener('mousemove', drag);
	desktop.el.removeEventListener('mousemove', prepareDrag);
	desktop.el.removeEventListener('mouseup', drop);
	desktop.el.removeEventListener('mouseup', cancelDrag);
	desktop.el.removeEventListener('mouseout', exitWindow);
}


function prepareDrag (e) {

	if (Math.abs((e.touches === undefined ? e.clientX : e.touches[0].clientX) - currentIcon.dragData.startX) > DRAGLIMIT ||
		Math.abs((e.touches === undefined ? e.clientY : e.touches[0].clientY) - currentIcon.dragData.startY) > DRAGLIMIT) {
		let multi = e.ctrlKey || e.shiftKey || e.metaKey;
		multi = multi || ((desktop.selected.length > 1) && currentIcon.el.classList.contains('selected'));
		
		if (multi) {
			desktop.select(currentIcon, true);
			currentIcon.el.classList.add('selected');
			if (desktop.selected.length > 1) {
				initMultiDrag(e);
				return;
			}
		}
		
		// we only get here if not multiple icons selected
		desktop.select(currentIcon);
		currentIcon.el.classList.add('selected');
		initSingleDrag(e);

	}
}


function cancelDrag (e) {
	removeDesktopEvents();
};


function initSingleDrag (e) {
	// core.log('init single drag', currentIcon);
	
	desktop.el.removeEventListener('mousemove', prepareDrag);
	desktop.el.addEventListener('mousemove', drag);
	desktop.el.removeEventListener('mouseup', cancelDrag);
	desktop.el.addEventListener('mouseup', drop);
	desktop.el.addEventListener('mouseout', exitWindow);
		
	// prevent flash of icon appearing on the
	// workbench if we are dragging in a window
	currentIcon.el.style.visibility = 'hidden';
	desktop.bringToFront(currentIcon);
	desktop.el.append(currentIcon.el);
	currentIcon.el.classList.add('dragging');
}


function initMultiDrag (e) {
	// core.log('multi drag');
	// pick up all the selected items
	
	desktop.el.removeEventListener('mousemove', prepareDrag);
	desktop.el.addEventListener('mousemove', drag);
	desktop.el.removeEventListener('mouseup', cancelDrag);
	desktop.el.addEventListener('mouseup', drop);
	desktop.el.addEventListener('mouseout', exitWindow);
	currentIcon.el.classList.add('dragging');
	desktop.selected.forEach((o) => {
		o.el.style.visibility = 'hidden';
		desktop.bringToFront(o);
		desktop.el.append(o.el);
	});
}


function drag (e) {
	// core.log('drag', desktop.selected.length, currentIcon);
	desktop.selected.forEach((o) => {
		let x = e.clientX - currentIcon.dragData.offsetX;
		let y = e.clientY - currentIcon.dragData.offsetY;
		if (o === currentIcon) {
			o.x = x;
			o.y = y;
		} else {
			o.x = x - (currentIcon.dragData.initX - o.dragData.initX);
			o.y = y - (currentIcon.dragData.initY - o.dragData.initY);
		}
		o.el.style.visibility = 'visible';
	});	
}


function drop (e) {
	if (currentIcon.dragData.source !== null) {
		let x = e.clientX - currentIcon.dragData.offsetX;
		let y = e.clientY - currentIcon.dragData.offsetY;
		currentIcon.el.style.visibility = 'hidden';
		let target = document.elementFromPoint(e.clientX, e.clientY);

		if (target.dropTarget && (target.dropTarget !== currentIcon.dragData.source)) {
			// core.log('got new drop target', target.dropTarget);

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
				self.select();
			}
		} else {
			// core.log('same target', currentIcon.dragData.source);
			desktop.selected.forEach((o) => {
				if (!target.dropTarget) resetDragged(o);
				o.dragData.source.drop(o);
				o.el.style.removeProperty('visibility');
			});
		}
	}
	
	endDrag();
	
}


function endDrag () {
	removeDesktopEvents();

	desktop.selected.forEach((o) => {
		o.el.classList.remove('dragging');
		o.z = o.dragData.initZ;
		o.el.style.removeProperty('visibility');

		o.dragData = {
			initZ: o.z,
			initX: o.x,
			initY: o.y,
			source: o.parent
		};
		
	});
	
}


function resetDragged (o) {
	o.x = o.dragData.initX;
	o.y = o.dragData.initY;
	o.z = o.dragData.initZ;
}



function Icon (params) {
	if (arguments.length > 0) {
		this.pos = {
			x: 0,
			y: 0,
			z: 0
		};

		this.size = {
			w: 80,
			h: 90
		};
		
		this.init(params);
	};
	
	return this;
}


Icon.prototype = {
	
	set z (val) {
		this.pos.z = val;
		this.el.style.zIndex = val;
	},
	
	get z () {
		return this.pos.z;
	},

	set x (val) {
		let min = desktop.minX,
			max = desktop.maxX;

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
		let min = desktop.minY,
			max = desktop.maxY;
		
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

		this.setupEvents();
	},

	setupEvents: function () {
		// this.el.addEventListener('mousedown', (e) => {this.startDrag(e);});
		this.el.addEventListener('mousedown', (e) => {selectIcon(this, e);});
		
		this.el.addEventListener('click', (e) => {
			let multi = e.ctrlKey || e.shiftKey || e.metaKey;
			this.select(multi);
			core.log('click', this.id);
			if (this.data.click) this.data.click(this);
			if (this.dragData) this.z = this.dragData.initZ;
			e.stopPropagation();
		});
		
		this.el.addEventListener('dblclick', (e) => {
			core.log('double click', this.id);
			if (this.data.dblclick) this.data.dblclick(this);
			e.stopPropagation();
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
			desktop.select(this, multi);
			desktop.bringToFront(this);
		}
	},

	deselect: function () {
		this.el.classList.remove('selected');
		desktop.deselect(this);
	},
	
	
};


core.namespace('core.wb', {
	Icon: Icon
});

import './core.ui.js';

const DRAGLIMIT = 6;
let currentIcon = null;

function selectIcon (icon, e) {
	if (icon.fixed === true) return;

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
		removeDesktopEvents();
		// currentIcon.parent.selected.forEach((o) => {
		// 	reset(o);
		// });
		currentIcon.parent.selected.forEach(reset);
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
		multi = multi || ((currentIcon.parent.selected.length > 1) && currentIcon.el.classList.contains('selected'));
		
		if (multi) {
			currentIcon.parent.select(currentIcon, true);
			currentIcon.el.classList.add('selected');
			if (currentIcon.parent.selected.length > 1) {
				initMultiDrag(e);
				return;
			}
		}
		
		// we only get here if not multiple icons selected
		currentIcon.parent.select(currentIcon);
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
	currentIcon.el.classList.add('dragging');
	desktop.bringToFront(currentIcon);
	desktop.el.append(currentIcon.el);
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
	currentIcon.parent.selected.forEach((o) => {
		o.el.style.visibility = 'hidden';
		desktop.bringToFront(o);
		desktop.el.append(o.el);
	});
}


function drag (e) {
	// core.log('drag', desktop.selected.length, currentIcon);
	currentIcon.parent.selected.forEach((o) => {
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
			currentIcon.parent.selected.forEach((o) => {
				const multi = currentIcon.parent.selected.length > 1;
				o.dragData.source.removeItem(o);
				target.dropTarget.drop(o);
				reset(o);
			});
			
		} else {
			// core.log('same target', currentIcon.dragData.source);
			currentIcon.parent.selected.forEach((o) => {
				if (!target.dropTarget) resetDragged(o);
				o.dragData.source.drop(o);
				reset(o);
			});
		}
	}
	
	removeDesktopEvents();
	
}

function reset (o) {
	o.el.classList.remove('dragging');
	o.z = o.dragData.initZ;
	o.el.style.removeProperty('visibility');
	o.dragData = {
		initZ: o.z,
		initX: o.x,
		initY: o.y,
		source: o.parent
	};
}


function resetDragged (o) {
	const rect = o.parent.el.getBoundingClientRect();
	o.x = o.dragData.initX + rect.left;
	o.y = o.dragData.initY + rect.top;
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
		let min = this.parent.minX || 0,
			max = this.parent.maxX;

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
		let min = this.parent.minY || 0,
			max = this.parent.maxY;
		
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


	get r () {
		return {
			top: this.y,
			bottom: this.y + this.size.h,
			left: this.x,
			right: this.x + this.size.w
		};
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

		// provide initial drag info
		this.dragData = {
			initZ: this.z,
			initX: this.x,
			initY: this.y,
			source: this.parent
		};
		
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

		this.el.addEventListener('mousedown', (e) => {selectIcon(this, e);});
		
		this.el.addEventListener('click', (e) => {
			let multi = e.ctrlKey || e.shiftKey || e.metaKey;
			if (!multi) this.parent.deselectAll();
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
		// core.log('select', multi);
		if (this.el.classList.contains('selected')) {
			// core.log('deselected');
			this.deselect();
		} else {
			// core.log('selected');
			this.el.classList.add('selected');
			this.parent.select(this, multi);
			this.parent.bringToFront(this);
		}
	},

	deselect: function () {
		this.el.classList.remove('selected');
		this.parent.deselect(this);
	},
	
	
};


core.namespace('core.wb', {
	Icon: Icon
});

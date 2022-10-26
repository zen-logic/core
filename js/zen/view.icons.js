import './core.ui.js';
import './core.window.js';
import {rubberband} from './mixin.rubberband.js';


function IconView (params) {
	if (arguments.length > 0) {
		Object.assign(this, rubberband);
		this.rubberband = null;
		this.stack = {};
		this.selected = [];
		this.autopos = {
			x: 0,
			y: 0,
			z: 0
		};
		this.init(params);
	}
	return this;
}


IconView.prototype = {

	init: function (params) {
		core.log('New IconView', params);
		this.parent = params.parent;
		this.cfg = params;
		this.id = params.id === undefined ? core.util.createUUID() : params.id;
		this.parent.addView(this);
		this.render();
		return this;
	},

	render: function () {
		this.el = core.ui.createElement({
			parent: this.cfg.container,
			cls: ['iconview']
		});

		this.el.addEventListener('click', (e) => {
			if (this.selected.length > 0) {
				e.stopPropagation();
			}
		});
		
		this.el.addEventListener('mousedown', (e) => {
			if (e.currentTarget === e.target) {
				this.deselectAll();
				core.notify('deselect-all', {source: this.id});
				this.getRubberBand(e);
			}
		});

		this.el.dropTarget = this;

		core.observe('deselect-all', this.id, (params) => {
			if (params.source !== this.id) {
				this.deselectAll();
			}
		});

	},

	cleanup: function (win) {
		win.desktop.menubar.updateMenu('MNU_WINDOW', []);
		core.removeObserver('deselect-all', this.id);
	},
	
	drop: function (o) {
		let rect = this.el.getBoundingClientRect();
		this.el.append(o.el);
		this.stack[o.id] = o;
		o.parent = this;
		o.x = o.x - rect.x;
		o.y = o.y - rect.y;
	},

	getTop: function () {
		let top = -1, o;
		for (const item in this.stack) {
			if (this.stack[item].z > top) {
				o = this.stack[item];
				top = o.z;
			}
		}
		return o;
	},

	bringToFront: function (o) {
		let top = this.getTop();
		if (top) {
			o.z = top.z + 1;
		}
	},
	
	select: function (o, multi) {
		if (multi === true) {
			// core.log('select multi');
			// check it's not already selected
			if (!this.selected.includes(o)) {
				this.selected.push(o);
			}
			
		} else {
			// core.log('select single');
			this.deselectAll();
			core.notify('deselect-all', {source: this.id});
			this.selected.push(o);
		}
	},
	
	deselect: function (o) {
		for (let idx = 0; idx < this.selected.length; idx++) {
			if (this.selected[idx] === o) {
				this.selected.splice(idx);
				break;
			}
		}
	},
	
	deselectAll: function () {
		while (this.selected.length > 0) {
			let o = this.selected.pop();
			o.deselect();
		}
	},
	
	remove: function (o) {
		o.el.remove();
		delete this.stack[o.id];
	},

	addItem: function (o) {
		this.stack[o.id] = o;
		o.parent = this;
		return o;
	},
	
	removeItem: function (o) {
		delete this.stack[o.id];
	},

	autoIconPos: function (icon, layout) {
		if (!icon.cfg.x && !icon.cfg.y) {
			icon.x = this.autopos.x;
			icon.y = this.autopos.y;
			icon.z = this.autopos.z;

			switch (layout) {
			case 'vertical':
				this.autopos.y += icon.size.h;
				if (this.autopos.y > this.parent.h) {
					this.autopos.y = 0;
					this.autopos.x += icon.size.w;
					icon.y = this.autopos.y;
					icon.x = this.autopos.x;
					this.autopos.y += icon.size.h;
				}
				break;
			default:
				this.autopos.x += icon.size.w;
				if (this.autopos.x > this.parent.w) {
					this.autopos.x = 0;
					this.autopos.y += icon.size.h;
					icon.x = this.autopos.x;
					icon.y = this.autopos.y;
					this.autopos.x += icon.size.w;
				}
			}
			
			this.autopos.z++;
			
		} else {
			icon.x = icon.pos.x;
			icon.y = icon.pos.y;
			icon.z = icon.pos.z;
		}
	},


	removeIconsFromView: function () {
		const icons = [];
		for (const item in this.stack) {
			const icon = this.stack[item];
			this.el.removeChild(icon.el);
			icons.push(icon);
		}
		return icons;
	},
	
	
	arrangeIcons: function () {
		const icons = this.removeIconsFromView();
		// reset layout
		this.autopos = {x: 0, y: 0, z: 0};
		icons.forEach((o) => {
			this.el.appendChild(o.el);
			this.autoIconPos(o);
		});
	},

	
	sortIcons: function () {
		const icons = this.removeIconsFromView();

		icons.sort((a,b) => {
			if (a.label < b.label) {
				return -1;
			}
			if (a.label > b.label) {
				return 1;
			}
			return 0;
		});
		
		// reset layout
		this.autopos = {x: 0, y: 0, z: 0};
		icons.forEach((o) => {
			this.el.appendChild(o.el);
			this.autoIconPos(o);
		});
	}

};



function IconWindow (params) {
	if (arguments.length > 0) {
		this.init(params);
	}
	return this;
}

IconWindow.prototype = new core.wb.Window();

IconWindow.prototype.init = function (params) {
	core.wb.Window.prototype.init.call(this, params);

	return this;
};


IconWindow.prototype.afterRender = async function () {
	await this.restoreState();
	
	this.iconview = new core.wb.IconView({
		parent: this,
		container: this.body
	});

	this.addView(this.iconview);

	this.cfg.items.forEach((o) => {
		o.parent = this.iconview;
		this.iconview.addItem(new core.wb[o.type](o));
	});

	core.observe('ViewAsIcons', this.id, (src) => {
		if (src?.owner === this) {
			this.el.classList.remove('list');
			this.saveState();
		}
	});

	core.observe('ViewAsList', this.id, (src) => {
		if (src?.owner === this) {
			this.el.classList.add('list');
			this.saveState();
		}
	});

	core.observe('ArrangeIcons', this.id, (src) => {
		if (src?.owner === this) {
			this.iconview.arrangeIcons();
		}
	});

	core.observe('SortIcons', this.id, (src) => {
		if (src?.owner === this) {
			this.iconview.sortIcons();
		}
	});

	this.select();
	
};


IconWindow.prototype.close = function () {
	core.removeObserver('ViewAsIcons', this.id);
	core.removeObserver('ViewAsList', this.id);
	core.removeObserver('ArrangeIcons', this.id);
	core.removeObserver('SortIcons', this.id);
	core.wb.Window.prototype.close.call(this);
};


IconWindow.prototype.getMenu = function (menubar) {
	menubar.updateMenu('MNU_WINDOW', [{
		"type": "action",
		"label": "Show icons",
		"action": "ViewAsIcons",
		"owner": this
	}, {
		"type": "action",
		"label": "Show list",
		"action": "ViewAsList",
		"owner": this
	}, {
		"type": "separator"
	}, {
		"type": "action",
		"label": "Arrange",
		"action": "ArrangeIcons",
		"owner": this
	}, {
		"type": "action",
		"label": "Sort",
		"action": "SortIcons",
		"owner": this
	}, {
		"type": "separator"
	}, {
		"type": "action",
		"label": "Snap to grid",
		"action": "SnapWindow",
		"owner": this
	}]);
};


IconWindow.prototype.saveState = function () {
	if (this.persistState === true) {
		core.log('window save state');
		app.db.put('workbenchData', {
			uid: this.id,
			pos: this.pos,
			size: this.size,
			viewAsList: this.el.classList.contains('list')
		});
	}
};


IconWindow.prototype.restoreState = async function () {
	if (this.persistState === true) {
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
			
			if (o?.viewAsList === true) {
				this.el.classList.add('list');
			} else {
				this.el.classList.remove('list');
			}

		} else {
			this.desktop.autoWindowPos(this);
		}
	} else {
		this.desktop.autoWindowPos(this);
	}
};


core.namespace('core.wb', {
	IconView: IconView,
	IconWindow: IconWindow
});

import './core.js';
import './core.ui.js';

let core = window.core !== undefined ? window.core : {};


function MenuBar (params) {
	if (arguments.length > 0) this.init(params);
	return this;
}


MenuBar.prototype = {

	init: function (params) {
		core.log('New MenuBar', params);
		this.cfg = params;
		this.render();
		if (this.cfg.menu) {
			this.setMenu(this.cfg.menu);
		}
		return this;
	},

	render: function () {

		this.el = core.ui.createElement({
			parent: this.cfg.parent.el,
			attr: {class: 'workbench-menu'}
		});

		this.menu = core.ui.createElement({
			parent: this.el,
			tag: 'ul',
			attr: {class: 'menu-items'}
		});

		core.observe('SelectWindow', 'menubar', (win) => {
			if (win) {
				win.getMenu(this);
			}
		});
		
	},

	setMenu: function (menu) {
		this.menu.innerHTML = '';
		this.createMenu(this.menu, menu.items);
	},
	
	createMenu: function (el, items) {
		let self = this;
		items.forEach( (item) => {
			if (item['type'] === 'separator') {
				core.ui.createElement({
					parent: el,
					tag: 'hr'
				});
				return;
			}

			let menuItem = core.ui.createElement({
				parent: el,
				tag: 'li',
				id: item['id'],
				content: item['label']
			});

			if (item.image) {
				menuItem.style.backgroundImage = 'url('+item.image+')';
			}
			
			if (item.cls) {
				menuItem.classList.add(item.cls);
			}
			
			if (item.action) {
				menuItem.addEventListener('click', (e) => {
					// disable the menu bar (closes the menu)
					this.el.classList.add('disabled');
					core.notify(item.action, item);

					// re-enable the menu bar
					desktop.el.addEventListener('mousemove', function enable () {
						desktop.el.removeEventListener('mousemove', enable);
						self.el.classList.remove('disabled');
					});
					
				});
			}
			
			if (item.items) {
				let menu = core.ui.createElement({
					parent: menuItem,
					tag: 'ul',
					attr: {class: 'menu-items'}
				});

				this.createMenu(menu, item.items);
			}
		});
	},

	updateMenu: function (id, items) {
		const menu = this.menu.querySelector('#' + id);
		if (menu) {
			menu.querySelector('ul')?.remove();
			this.createMenu(core.ui.createElement({
				parent: menu,
				tag: 'ul',
				attr: {class: 'menu-items'}
			}), items);
		}
	}
	
};


core.namespace('core.wb', {
	MenuBar: MenuBar
});

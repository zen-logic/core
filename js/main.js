import './zen/core.desktop.js';
import './zen/core.storage.js';
import './zen/view.icons.js';


function App (params) {
	if (arguments.length > 0) this.init(params);
	return this;
}

App.prototype = {

	init: function (params) {
		core.log('application loaded');
		this.cfg = params;
		this.urlParams = new URLSearchParams(window.location.search);

		this.db = new core.db.Storage(this.cfg.schema);
        this.db.open().then(() => {
			this.launch();
		});
		
		return this;
	},

	launch: function () {
		this.desktop = new core.wb.Desktop(this.cfg.workbench);
		// this.desktop.menubar.setMenu(menu);
		this.desktop.menubar.setMenu(this.cfg.menubar);
		this.setupObservers();
	},

	setupObservers: function () {

		core.observe('CreateWindow', 'APPLICATION', (src) => {
			
			if (src.options) {
				if (src.options.single === true) {
					if (desktop.hasItem(src.options.id)) {
						desktop.getItem(src.options.id).select();
						return;
					}			
				}
				
				desktop.addItem(
					new core.wb.Window({
						id: src.options.id,
						parent: desktop,
						features: src.options.features,
						pos: src.options.pos,
						size: src.options.size,
						view: src.options.view
					})
				);

			}
			
		});

		
		core.observe('IconWindow', 'APPLICATION', (src) => {
			this.iconWindow(src);
		});

	},

	iconWindow: function (src) {
		const cfg = src.cfg;
		if (cfg?.options?.single === true) {
			if (this.desktop.hasItem(cfg.options.id)) {
				this.desktop.getItem(cfg.options.id).select();
				return;
			}
		}
		
		const win = this.desktop.addItem(
			new core.wb.IconWindow({
				id: cfg?.options?.id !== undefined ? cfg.options.id : core.util.createUUID(),
				parent: this.desktop,
				title: cfg.label,
				_pos: {x: 100, y: 200},
				_size: {w: 320, h: 240, minW: 200, minH: 100, maxW: 600},
				size: {
					w: cfg?.options?.w !== undefined ? cfg.options.w : 320,
					// w: 320,
					h: cfg?.options?.h !== undefined ? cfg.options.h : 240,
					// h: 240,
					minW: 200,
					minH: 100
				}
			})
		);

		cfg.items.forEach((o) => {
			o.parent = win.iconview;
			win.iconview.addItem(new core.wb[o.type](o));
		});

	}
	
};


core.getJSON('js/config.json').then((config) => {
	window.app = new App(config);			
});




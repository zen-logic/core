import './zen/core.desktop.js';
import './zen/view.icons.js';

const menu = {
	items: [
		{type: 'icon', image: 'css/zen/img/icon/enso.png', items: [
			{type: 'action', label: 'About', action: (e) => {
				if (desktop.hasItem('splash')) {
					desktop.getItem('splash').select();
				} else {
					desktop.addItem(
						new core.wb.Window({
							id: 'splash',
							parent: desktop,
							features: ['close'],
							pos: {x: 'centre', y: 'centre'},
							size: {w: 320, h: 240},
							view: 'views/zen/splash.html'
						})
					);
				}
			}},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Projects...'},
			{type: 'action', cls: 'disabled', label: 'Publish...'},
			{type: 'separator'},
			{type: 'action', label: 'CMS', action: (e) => {location = '/cms';}},
			{type: 'action', label: 'Developer tools', action: (e) => {location = '/developer/system';}},
			{type: 'action', label: 'View site', action: (e) => {window.open('/', '_blank').focus();}},
			{type: 'separator'},
		]},
		{type: 'menu', cls: 'app', label: 'Application', items: [
			{type: 'action', label: 'Navigation', action: (e) => {app.showHierarchy();}},
			{type: 'action', label: 'Live preview', action: (e) => {app.showPreview();}},
			{type: 'action', label: 'Content editor', action: (e) => {app.showContentEditor();}},
			
			{type: 'action', cls: 'disabled', label: 'Content modules'},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Brand settings'},
			{type: 'action', label: 'Templates', action: (e) => {app.showTemplates();}},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Visitor analytics'}
		]},
		{type: 'menu', label: 'Window', items: [
			{type: 'action', label: 'Show icons', action: (e) => {app.desktop.showAsIcons();}},
			{type: 'action', label: 'Show list', action: (e) => {app.desktop.showAsList();}},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Properties'}
		]},
		{type: 'menu', label: 'Icon', items: [
			{type: 'action', cls: 'disabled', label: 'Fix in place'},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Properties'}
		]},
		{type: 'menu', label: 'Workspace', items: [
			{type: 'action', label: 'Reset', action: (e) => {app.desktop.cleanup();}},
			{type: 'separator'},
			{type: 'action', cls: 'disabled', label: 'Save current'}
		]}
	]
};


function App (params) {
	if (arguments.length > 0) this.init(params);
	return this;
}

App.prototype = {

	init: function (params) {
		core.log('application loaded');
		this.cfg = params;
		this.urlParams = new URLSearchParams(window.location.search);
		this.launch();
		return this;
	},

	launch: function () {
		this.desktop = new core.wb.Desktop(this.cfg.workbench);
		this.desktop.menubar.setMenu(menu);
		this.setupObservers();
	},

	setupObservers: function () {
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
				size: {w: 320, h: 240, minW: 200, minH: 100, maxW: 600}
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




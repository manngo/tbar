'use strict';

const jx = require('./library');
const code = {
	toolbar: undefined,
	fsp: undefined,
	packageDir: undefined,
	packageInfo: undefined,
	name: undefined,
	buttons: [],
	items: undefined,
	popup: undefined,

	about() {
		let html = `
			<p id="title">About Pulsar TBar</p>
			<p>Copyright © Mark Simon</p>
			<p>More information at:</p>
			<p><a href="https://github.com/manngo/tbar">https://github.com/manngo/tbar</a></p>
			<p>Share &amp Enjoy</p>
			<button name="ok" value="1">OK</button>
		`;
		return jx.pseudoDialog(html, 'tbar-about', 'ok')
		.then(response => {
			console.log(response);
		});

	},

	editButton(button) {
		//	embed temporary span for editing to allow spaces
			let content = button.textContent;
			let span = document.createElement('span');
			span.textContent = content;
			button.firstChild.replaceWith(span);
			span.contentEditable = 'plaintext-only';

		//	Select content
			var range = document.createRange();
			var selection = window.getSelection();
			range.setStart(span, 0);
			range.setEnd(span, span.childNodes.length);
			selection.removeAllRanges();
			selection.addRange(range);

		//	temporarily disable button
			let onclick = button.onclick;
			button.onclick = undefined;

		//	cancel editing on loss of focus
			span.onblur = event => {
				button.textContent = content;
				button.onclick = onclick;
			};

		//	Finish Editing on Enter
			span.onkeydown = event => {
				if(event.key=='Enter') {
					event.preventDefault();
					if(!span.textContent) button.textContent = content;
					else button.textContent = button.textContent;
					this.save();
					button.onclick = onclick;
				}
			}
	},

	addURL() {
		let html = `
			<p id="title">Add URL</p>
			<label>URL: <input name="url" type="text"></label>
			<button name="cancel">Cancel</button><button name="ok">OK</button>
		`;
		return jx.pseudoDialog(html, 'tbar-addurl', 'url', 'url')
		.then(url => {
			if(!url) return;
			if(!url.match(/https?:\/\//)) url = `https://${url}`;
			let button = this.addButton(url, url, `open ${url}`, true, this.popup);
			this.editButton(button);
		});

	},

	addFile() {
		let file = atom.workspace.getActiveTextEditor()?.getPath();
		let button = this.addButton(file, `file:///${file}`, `open ${file}`, true, this.popup);
		this.editButton(button);
	},

	addDummyMenu() {
		let menuItems = [
			{label: 'Item 1', action: '', tooltip: '' },
			{label: 'Item 2', action: '', tooltip: '' }
		];

		let [menu, items, toggle] = jx.addMenu(
			'Menu Label', 'tbar-menu', undefined, menuItems
		);
		menu.dataset.save = true;
		menu.querySelector('button').classList.add('menu');
		menu.content = menuItems;
		menu.title = '';
		this.addToolButton(menu);
		this.items.append(menu);
	},
/*
	addMenu(label, className, menuid, items) {
		let menu = document.createElement('div');
		let menuitems = document.createElement('div');

		function addItem(label, action, tooltip) {
			if(!label) {	//	no label => separator
				let hr = document.createElement('hr');
				menuitems.append(hr);
			}
			else {			//	Create Menu Item
				let button = document.createElement('button');
				menu.classList.add('menu');
				menuitems.append(button);
				tooltip = tooltip ?? action;
				button.innerHTML = label;
				button.dataset.action = action;
				button.onclick = code.dispatch.bind(code, action);
				button.title = tooltip;
			}
		}
		function addItems(items) {
			items.forEach(({label, action, tooltip}) => {
				addItem(label, action, tooltip);
			});
		}

		//	Create Menu Contaimer
			menu.addItem = addItem;
			menu.addItems = addItems;
			menu.setAttribute('tabindex', 1);
			menu.classList.add(className);

			if(menuid) menu.id = menuid;

		//	Add Menu Button
			let toggle = document.createElement('button');
			menu.append(toggle);
			toggle.classList.add('menu');	//	in lieu of :has() selector
			toggle.innerHTML = label;
			toggle.onclick = event => {
				toggle.classList.toggle('open');
				toggle.parentElement.focus();
			};
			toggle.title = 'Menu';

			toggle.classList.add('toggle');

		//	Add Menu Items Container
			menu.append(menuitems);

		//	Close on loss of focus
			menu.onblur = event => {
				let button = event.relatedTarget;
				if(button) button.click();
				toggle.classList.toggle('open', false);
			};

		//	Add items, if any
			if(items) addItems(items);

		return [menu, menuitems];
	},
*/


	addContextMenu(menuclass, showclass, menuitems, data) {
		//	menuitems = [{label, action, tooltip}]
		let menu, items;

		//	Create Menu Container
			menu = document.createElement('div');
			menu.setAttribute('tabindex', 1);
			menu.classList.add(menuclass);

		//	Container for Menu Items
			items = document.createElement('div');
			menu.append(items);

		//	Close Menu on loss of focus
		//	This also triggers the item (if any) as it also loses the menu’s focus
			menu.onblur = event => {
				let button = event.relatedTarget;
				if(button && button.parentElement == menu) button.click();
				menu.classList.toggle(showclass, false);
			};

		//	Add Menu Items
			menuitems.forEach(item => {
				let {label, action, tooltip} = item;
				let button = document.createElement('button');
				menu.append(button);
				button.innerHTML = label;
				button.onclick = action;
				button.title = tooltip ?? action;
			});

		//	Show Popup
			menu.show = event => {
				let apt = document.querySelector('div#tbar');
				let br = apt.getBoundingClientRect();
				this.popup.item = this.popup.button = button;
				event.preventDefault();
				[this.popup.style.left, this.popup.style.top] = [`${event.clientX-br.x}px`, `${event.clientY-br.y}px`];
				this.popup.focus({ focusVisible: true });
				this.popup.classList.toggle('show');
				event.stopPropagation();
			}

		return menu;
	},

	dispatch(action) {
		switch(typeof action) {
			case 'function':
				action();
				break;
			case 'string':
				if(action.match(/^file:\/\//)) {
					action = action.replace(/^file:\/\//,'');
					atom.workspace.open(action);
					console.log(`atom.workspace.open('${action}')`);
				}
				else if(action.match(/^https?:\/\//)) {
					require('electron').shell.openExternal(action);
					console.log(`require('electron').shell.openExternal('${action}')`);
				}
				else if(action.match(/^.+?:.+$/)) {
					atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), action);
					console.log(`do ${action}`);
				}
				break;
		}
	},

	addButton(label, action, tooltip=undefined, save=false) {
		//	Create Button
			let button = document.createElement('button');
			button.innerHTML = label;

		//	Button Properties
			tooltip = tooltip ?? action;
			button.title = tooltip;

		//	Action
			switch(typeof action) {
				case 'string':
					button.dataset.action = action;
					button.onclick = event => {
					//	atom.commands.dispatch(atom.views.getView(atom.workspace), action);
						this.dispatch(action);
					};

					break;
				case 'function':
					button.onclick = action;
					break;
			}

		//	Saveable
			if(save) button.dataset.save = true;
			if(save) this.addToolButton(button);
			this.items.append(button);


		if(this.popup) {
			button.oncontextmenu = event => {
				var apt = document.querySelector('div#tbar');
				var br = apt.getBoundingClientRect();
				this.popup.item = this.popup.button = button;
				event.preventDefault();
				[this.popup.style.left, this.popup.style.top] = [`${event.clientX-br.x}px`, `${event.clientY-br.y}px`];
				this.popup.focus({ focusVisible: true });
				this.popup.classList.toggle('show');
				event.stopPropagation();
			};
		}

		return button;
	},
	makePopup() {

	},
	async load() {
		this.items.innerHTML = '';
console.log(291);
		this.popup = this.addContextMenu('tbar-popup', 'show', [
			{	label: 'Remove',
				action: event => {
console.log(`Remove ${this.popup.item}`)
					this.popup.item.remove();
					code.save();
				},
				tooltip: 'Remove Button'
			},
			{	label: 'Edit',
				action: event => {
console.log(`Edit ${this.popup.button}`)
					code.editButton(this.popup.button);
					code.save();
				},
				tooltip: 'Edit Button Label'
			},
		]);
console.log(310);
		this.items.append(this.popup);

		let text, data;

		//	get defaults
			try {
				let path = `${this.packagePath}/lib/default.json`;
				text = await this.fsp.readFile(path, 'utf8');
			}
			catch (error) {
				console.log(error);
				text = `{ "buttons": []	}`;
			}

			data = JSON.parse(text);

		//	get or create config file
			try {
				let path = `${atom.getConfigDirPath()}/tbar.json`;
				text = await this.fsp.readFile(path, 'utf8');
				data = JSON.parse(text);
			} catch(error) {
				text = JSON.stringify(data, null, '\t');
				await this.fsp.writeFile(`${atom.getConfigDirPath()}/tbar.json`, text, 'utf8');
			}

		data.buttons.forEach(item => {
			if(item.action) this.addButton(item.label, item.action, item.tooltip, true, this.popup);
			else if(item.menu) {
				item.menu.forEach(i => {
					let {label, action, tooltip} = i;
					if(typeof action == 'string') i.action = code.dispatch.bind(code, action);
				});
				let [menu, items, toggle] = jx.addMenu(
					item.label, 'tbar-menu', undefined, item.menu
				);
				menu.dataset.save = true;
				menu.querySelector('button').classList.add('menu');
				menu.content = item.menu;
				menu.title = item.tooltip;
				this.addToolButton(menu);
				this.items.append(menu);

				if(this.popup) {
					var apt = document.querySelector('div#tbar');
					var br = apt.getBoundingClientRect();

					toggle.oncontextmenu = event => {
						this.popup.item = menu;
						this.popup.button = toggle;
						event.preventDefault();
						[this.popup.style.left, this.popup.style.top] = [`${event.clientX-br.x}px`, `${event.clientY-br.y}px`];
						this.popup.focus({ focusVisible: true });
						this.popup.classList.toggle('show');
						event.stopPropagation();
					};
				}
			}
		});
	},
	async save() {
console.log('save');
		let data = await this.fsp.readFile(`${atom.getConfigDirPath()}/tbar.json`, 'utf8');
		data = JSON.parse(data);
		data.buttons = Array.from(this.buttons)
			.filter(button => button.dataset.save)
			.map(button =>
				button.dataset.action
				? {
					label: button.textContent,
					action: button.dataset.action,
					tooltip: button.title,
				}
				: button.content
				? {
						label: button.querySelector('button').textContent,
						menu: button.content,
						tooltip: button.title,
				}
				: {}
			);
		data = JSON.stringify(data, null, '\t');
		await this.fsp.writeFile(`${atom.getConfigDirPath()}/tbar.json`, data, 'utf8');
	},
	async loadCSS() {
	//	let ssPath = `${this.packagePath}/styles/${this.packageInfo['name']}.less`;
		let packageInfo = require('../package.json');
		let packagePath = `${atom.getConfigDirPath()}/packages/${packageInfo['name']}`;
		let ssPath = `${packagePath}/styles/${packageInfo['name']}.less`;
		let css = atom.themes.loadStylesheet(ssPath);
		atom.styles.addStyleSheet(css, {sourcePath: ssPath});
	},
	initFinder() {
		function doFilter() {
			let ul = this.querySelector('ul#commands');
			let filter = this.querySelector('input[name="filter"]');
			let filterText = filter.value;

			let commands = atom.commands.findCommands({target: atom.views.getView(atom.workspace.getActiveTextEditor())})
			.filter(command => command.name.includes(filterText));
			commands = commands.map(command => `<li><span class="display-name">${command.displayName}</span><span class="name">${command.name}</span></li>`);
			ul.innerHTML = commands.join('');
			ul.querySelectorAll('li>span').forEach(span => {
				span.inert = true;
			});
		}

		let div = document.createElement('div');
		div.classList.add('native-key-bindings');
		div.id='tbar-finder';

		let form = document.createElement('form');
		div.appendChild(form);

		form.innerHTML = `
				<input name="filter" type="text"/>
				<ul id="commands">hahaha</ul>
				<span id="command">
					<input type="text" name="display-name">
					<input type="text" name="name" readonly>
				</span>
				<button name="cancel">Cancel</button>
				<button name="ok">Add</button>
		`;

		let filter = form.elements['filter'];
		let ul = form.querySelector('ul#commands');
		let name = form.elements['name'];
		let displayName = form.elements['display-name'];

		filter.addEventListener('keyup', doFilter.bind(form));
		ul.addEventListener('click', event => {
			let [displayName, name] = event.target.querySelectorAll('span');
			[form.elements['display-name'].value, form.elements['name'].value] = [displayName.textContent, name.textContent];
		});
		filter.addEventListener('focus', doFilter.bind(form));

		filter.addEventListener('keydown', event => {
console.log(event.key)
			switch(event.key) {
				case 'Enter':
				case 'Return':
					form.elements['ok'].click();
					break;
				case 'Escape':
					form.elements['cancel'].click();
					break;
			}
		});

		this.finderPanel = atom.workspace.addModalPanel({item: div, visible: false,});
	},
	openFinder() {
		this.finderPanel.show();
		let form = this.finderPanel.getElement().querySelector('div>form');
		form.elements['filter'].focus();
		return new Promise ((resolve, reject) => {
			form.elements['ok'].onclick = event => {
				resolve([form.elements['display-name'].value, form.elements['name'].value]);
				this.finderPanel.hide();
			};
			form.elements['cancel'].onclick = event => {
				resolve(null);
				this.finderPanel.hide();
			};
		});


	},
	init() {
		console.log('tbar init?')
		this.fsp = require("fs/promises");

		this.packageInfo = require('../package.json');
		this.packagePath = `${atom.getConfigDirPath()}/packages/${this.packageInfo['name']}`;

		this.toolbar = document.createElement('div');
		this.toolbar.id = 'tbar';
		this.toolbar.classList.add('native-key-bindings');

		this.toolbar.classList.add('horizontal');
		var panel = atom.workspace.addTopPanel({item: this.toolbar});

		/*	TBar Menu
			================================================
			👀 🦧 🍺 🍵
			atom.commands.dispatch(atom.views.getView(atom.workspace), action);
			================================================ */

			let [menu, items, toggle] = jx.addMenu('Actions', 'tbar-menu', 'tbar-main-menu');
			this.toolbar.append(menu);

			menu.addItem('Add Item …', () => {
				atom.commands.dispatch(atom.views.getView(atom.workspace), 'tbar:add-item');
			}, 'Add Item');

			menu.addItems([
				{ label: 'About …', action: this.about.bind(code), tooltip: 'About Tbar'},
				{ },
				{ label: 'Add File …', action: this.addFile.bind(code), tooltip: 'Add Current File'},
				{ label: 'Add URL …', action: this.addURL.bind(code), tooltip: 'Add URL'},
				{ label: 'Add Menu …', action: this.addDummyMenu.bind(code), tooltip: 'Add dummy menu to JSON file'},
				{ },
				{ label: 'Open GitHub Repository', action: 'https://github.com/manngo/tbar', tooltip: 'GitHub Repository'},
				{ label: 'Open JSON File', action: `file:///${atom.getConfigDirPath()}/tbar.json`, tooltip: 'TBar Data'},
				{ label: 'Open CSS File', action: `file:///${this.packagePath}/styles/${this.packageInfo['name']}.less`, tooltip: 'TBar CSS'},
				{ hidden: true },
				{ label: 'Reload TBar', action: this.load.bind(code), tooltip: 'Reload TBar Items', hidden: true },
				{ label: 'Refresh CSS', action: this.loadCSS.bind(code), tooltip: 'Refresh CSS', hidden: true },
				{ label: 'Save', action: this.save.bind(code), tooltip: 'Save TBar Items', hidden: true },
		]);

		/*	Add div for items
			================================================ */

			this.items = document.createElement('div');
			this.items.id = 'tbar-items';
			this.toolbar.append(this.items);
			this.addToolButton = jx.dragList(this.items, { callback: this.save.bind(this)});
			this.buttons = this.items.children;

		this.load();

		this.modalPanel = this.initFinder();

		return panel;
	}
}

module.exports = code;

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
	addArrangeableItem: undefined,

	dragFunctions: {
		element: undefined,
		oldPos: undefined,
		dragstart(event) {
			code.dragFunctions.element = event.target;
			code.dragFunctions.oldPos = Array.prototype.indexOf.call(code.buttons, code.dragFunctions.element);
			code.dragFunctions.element.classList.add('dragging');
		},
		dragover(event) {
			event.preventDefault();
		},
		drop(event) {
			event.stopPropagation();
			if(code.dragFunctions.element != event.target) {
				let newPos = Array.prototype.indexOf.call(code.buttons, event.target);
				if(newPos>-1) {
					if(newPos<code.dragFunctions.oldPos) code.items.insertBefore(code.dragFunctions.element, event.target);
					else code.items.insertBefore(code.dragFunctions.element, event.target.nextSibling);
				}
				else {
					code.dragFunctions.element.remove();
				}
			}
			this.toolbar.ondrop = this.toolbar.ondragover = undefined;
			code.dragFunctions.element.classList.remove('dragging');
		}
	},


	about() {
		let html = `
			<p id="title">About Pulsar TBar</p>
			<p>Copyright © Mark Simon</p>
			<p>More information at:</p>
			<p><a href="https://github.com/manngo/pulsar-tbar">https://github.com/manngo/pulsar-tbar</a></p>
			<p>Share &amp Enjoy</p>
			<button name="ok" value="1">OK</button>
		`;
		return jx.pseudoDialog(html, 'pulsar-tbar-about', 'ok')
		.then(response => {
			console.log(response);
		});

	},

	doSimpleDrag(container) {
		var element;
		var elements = container.children;

		function indexOf(element) {
			return Array.prototype.indexOf.call(elements, element);
		//	return [...elements].indexOf(element);
		}

		function dragstart(event) {
			element = event.target;
			event.dataTransfer.setData('oldPos', indexOf(element));
		}

		function dragover(event) {
			event.preventDefault();
		}

		function drop(event) {
			event.stopPropagation();
			if(element != event.target) {
				let oldPos = event.dataTransfer.getData('oldPos');
				let newPos = Array.prototype.indexOf.call(elements, event.target);
				if(newPos<oldPos) container.insertBefore(element, event.target);
				else if(newPos>oldPos) container.insertBefore(element, event.target.nextSibling);
			}
console.log([...elements].map(i => i.textContent).join(','))
		}

		function setup(element) {
			e.draggable=true;
			e.addEventListener('dragstart', dragstart, false);
			e.addEventListener('dragover', dragover, false);
			e.addEventListener('drop', drop, false);
		}

		Array.prototype.forEach.call(elements, e => {
			setup(e);
		});

		return function addItem(item) {
			container.appendChild(item);
			setup(item);
		};
	},

	setup(element) {
		element.draggable = true;

		element.ondragstart = this.dragFunctions.dragstart.bind(this);
		element.ondragover = this.dragFunctions.dragover.bind(this);
		element.ondrop = this.dragFunctions.drop.bind(this);
	},
	arrangeable2(container) {
	//	var element, oldPos;
	//	var elements = container.children;
		this.buttons = this.toolbar.children;

		Array.prototype.forEach.call(this.buttons, e => { this.setup(e); });
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
		return jx.pseudoDialog(html, 'pulsar-tbar-addurl', 'url', 'url')
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

	addMenu(label, className, menuid, toggleid) {
		let menu, items;

		function addItem(container, label, action, tooltip) {
			if(!label) {
				//	no labe => separator
					let hr = document.createElement('hr');
					container.append(hr);
			}
			else {
				//	Create Menu Item
					let button = document.createElement('button');
					container.append(button);
					tooltip = tooltip ?? action;
					button.innerHTML = label;
					button.dataset.action = action;
					button.onclick = code.dispatch.bind(code, action);
					button.title = tooltip;
					return button;
			}
		}

		//	Create Menu Contaimer
			menu = document.createElement('div');
			menu.addItem = addItem;
			menu.setAttribute('tabindex', 1);
			if(menuid) menu.id = menuid;

		//	Add Menu Button
			let toggle = addItem(menu, label, event => {
				toggle.classList.toggle(className);
				toggle.parentElement.focus();
			}, 'Menu');
			if(toggleid) toggle.id = toggleid;

		//	Add container for items
			items = document.createElement('div');
			menu.append(items);

		//	Close on loss of focus
			menu.onblur = event => {
				let button = event.relatedTarget;
				if(button) button.click();
				toggle.classList.toggle(className, false);
			};

		return [menu, items];
	},

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
//		menu.data = data;

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
			if(save) this.setup(button);
			this.items.append(button);

		var apt = document.querySelector('div#pulsar-tbar');
		var br = apt.getBoundingClientRect();

		if(this.popup) {
			button.oncontextmenu = event => {
				this.popup.data = button;
				event.preventDefault();
				[this.popup.style.left, this.popup.style.top] = [`${event.clientX-br.x}px`, `${event.clientY-br.y}px`];
				this.popup.focus({ focusVisible: true });
				this.popup.classList.toggle('show');
				event.stopPropagation();
			};
		}

		return button;
	},
	test(q) {
		console.log(q)
		console.log('🗑️')
	},
	async load() {
		this.items.innerHTML = '';

		this.popup = this.addContextMenu('pulsar-tbar-popup', 'show', [
			{	label: 'Remove',
				action: event => {
console.log(`Remove ${this.popup.data}`)
					this.popup.data.remove();
					code.save();
				},
				tooltip: 'Remove Button'
			},
			{	label: 'Edit',
				action: event => {
console.log(`Edit ${this.popup.data}`)
					code.editButton(this.popup.data);
					code.save();
				},
				tooltip: 'Edit Button Label'
			},
		]);

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
				let path = `${atom.getConfigDirPath()}/pulsar-tbar.json`;
				text = await this.fsp.readFile(path, 'utf8');
				data = JSON.parse(text);
			} catch(error) {
				text = JSON.stringify(data, null, '\t');
				await this.fsp.writeFile(`${atom.getConfigDirPath()}/pulsar-tbar.json`, text, 'utf8');
			}

		data.buttons.forEach(item => {
			let button = this.addButton(item.label, item.action, item.tooltip, true, this.popup);
		});
	},
	async save() {
		let data = await this.fsp.readFile(`${atom.getConfigDirPath()}/pulsar-tbar.json`, 'utf8');
		data = JSON.parse(data);
		data.buttons = Array.from(this.buttons)
			.filter(button => button.dataset.save)
			.map(button => (
				{label: button.textContent, action: button.dataset.action, tooltip: button.title }
			));
		data = JSON.stringify(data, null, '\t');
		await this.fsp.writeFile(`${atom.getConfigDirPath()}/pulsar-tbar.json`, data, 'utf8');
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
		div.id='pulsar-tbar-finder';

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
		this.toolbar.id = 'pulsar-tbar';
		this.toolbar.classList.add('native-key-bindings');

		this.toolbar.classList.add('horizontal');
		var panel = atom.workspace.addTopPanel({item: this.toolbar});

		/*	TBar Menu
			================================================
			👀 🦧 🍺 🍵
			atom.commands.dispatch(atom.views.getView(atom.workspace), action);
			================================================ */

			let [menu, items] = this.addMenu('☰ Actions', 'open', 'pulsar-tbar-menu', 'pulsar-tbar-menu-toggle');
			this.toolbar.append(menu);

			menu.addItem(items, 'Add Item …', () => {
				atom.commands.dispatch(atom.views.getView(atom.workspace), 'pulsar-tbar:add-item');
			}, 'Add Item');
			menu.addItem(items, 'Add File …', this.addFile.bind(code), 'Add Current File');
			menu.addItem(items, 'Add URL …', this.addURL.bind(code), 'Add URL');
			menu.addItem(items, 'About …', this.about.bind(code), 'About Tbar')
			menu.addItem(items);
			menu.addItem(items, 'Reload TBar', this.load.bind(code), 'Reload TBar Items')
			menu.addItem(items, 'Refresh CSS', this.loadCSS.bind(code), 'Refresh CSS');
			menu.addItem(items, 'Save', this.save.bind(code), 'Save TBar Items');
			menu.addItem(items);
			menu.addItem(items, 'Open GitHub Repository', 'https://github.com/manngo/pulsar-tbar', 'GitHub Repository');
			menu.addItem(items, 'Open JSON File', `file:///${atom.getConfigDirPath()}/pulsar-tbar.json`, 'TBar Data');
			menu.addItem(items, 'Open CSS File', `file:///${this.packagePath}/styles/${this.packageInfo['name']}.less`, 'TBar CSS');

		/*	Add div for items
			================================================ */

			this.items = document.createElement('div');
			this.items.id = 'pulsar-tbar-items';
			this.toolbar.append(this.items);
			this.buttons = this.items.children;

		this.load();

		this.modalPanel = this.initFinder();

		return this.toolbar;
	}
}

module.exports = code;

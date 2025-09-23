'use strict';

const code = {
	toolbar: undefined,
	fsp: undefined,
	packageDir: undefined,
	packageInfo: undefined,
	name: undefined,
	buttons: [],
	items: undefined,
	popup: undefined,

	dragFunctions: {
		element: undefined,
		oldPos: undefined,
		dragstart(event) {
			code.dragFunctions.element = event.target;
			code.dragFunctions.oldPos = Array.prototype.indexOf.call(code.buttons, code.dragFunctions.element);
			code.dragFunctions.element.classList.add('dragging');
		//	event.dataTransfer.setDragImage(code.buttons[0], 0, 0);
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
	createElementFromSelector(selector) {
		var pattern = /^(.*?)(?:#(.*?))?(?:\.(.*?))?(?:(\[.*?\]))?$/;
		var matches = selector.match(pattern);
		var element = document.createElement(matches[1]||'div');
		if(matches[2]) element.id = matches[2];
		if(matches[3]) element.className = matches[3];
		if(matches[4]) {
			Array.from(matches[4].matchAll(/(?:\[(.*?)\])/g), m => m[1]).forEach(attribute => {
				let [, name, value] = attribute.match(/^(.*?)(?:="(.*)")?$/);
				element.setAttribute(name, value ?? '');
			});
		}
		return element;
	},
	editButton(button) {
		let content = button.textContent;
		let span = document.createElement('span');
		span.textContent = content;
		button.firstChild.replaceWith(span);
		span.contentEditable = 'plaintext-only';

		var range = document.createRange();
		var selection = window.getSelection();
		range.setStart(span, 0);
		range.setEnd(span, span.childNodes.length);
		selection.removeAllRanges();
		selection.addRange(range);

		let onclick = button.onclick;
		button.onclick = undefined;
		span.onblur = event => {
			button.textContent = content;
			button.onclick = onclick;
		};
		span.onkeydown = event => {
//	console.log(event.key);
			if(event.key=='Enter') {
				event.preventDefault();
				if(!span.textContent) button.textContent = content;
				else button.textContent = button.textContent;
				this.save();
				button.onclick = onclick;
			}
		}
	},
	addMenu(label, className, menuid, toggleid) {
		//	label, className are required
		let menu, items;
		function addItem(container, label, command, tooltip) {
			let button = document.createElement('button');
			container.append(button);
			tooltip = tooltip ?? command;
			button.innerHTML = label;
			button.onclick = command;
			button.title = tooltip;
			return button;
		}

		menu = document.createElement('div');
		menu.addItem = addItem;
		menu.setAttribute('tabindex', 1);
		if(menuid) menu.id = menuid;

		//	Add Menu Button
			let toggle = addItem(menu, label, event => {
				event.target.classList.toggle(className);
				event.target.parentElement.focus();
			}, 'Menu');
			if(toggleid) toggle.id = toggleid;

			items = document.createElement('div');
			menu.append(items);

		menu.onblur = event => {
			let button = event.relatedTarget;
			if(button) button.click();
			toggle.classList.toggle(className, false);
		};

		return [menu, items];
	},
	addContextMenu(menuclass, showclass, menuitems, data) {
		//	menuitems = [{label, command, tooltip}]
		let menu, items;
		menu = document.createElement('div');
		menu.setAttribute('tabindex', 1);
		menu.classList.add(menuclass);

		items = document.createElement('div');
		menu.append(items);

		menu.onblur = event => {
			let button = event.relatedTarget;
			if(button && button.parentElement == menu) button.click();
			menu.classList.toggle(showclass, false);
		};

		menuitems.forEach(item => {
			let {label, command, tooltip} = item;
			let button = document.createElement('button');
			menu.append(button);
			button.innerHTML = label;
			button.onclick = command;
			button.title = tooltip ?? command;
		});

		menu.data = data;

		return menu;
	},
	dispatch(command) {
		if(command.match(/^file:\/\//)) {
			command = command.replace(/^file:\/\//,'');
			atom.workspace.open(command);
			console.log(`atom.workspace.open('${command}')`);
		}
		else if(command.match(/^https?:\/\//)) {
			require('electron').shell.openExternal(command);
			console.log(`require('electron').shell.openExternal('${command}')`);
		}
		else if(command.match(/^.+?:.+$/)) {
			atom.commands.dispatch(atom.views.getView(atom.workspace), command);
			console.log(`do ${command}`);
		}
	},
	addButton(label, command, tooltip=undefined, save=false) {
		let button = document.createElement('button');
		this.items.append(button);
		tooltip = tooltip ?? command;
		if(save) button.dataset.save = true;
		button.innerHTML = label;
console.log(`171 ${typeof command}`);
		switch(typeof command) {
			case 'string':
				button.dataset.command = command;
				button.onclick = event => {
				//	atom.commands.dispatch(atom.views.getView(atom.workspace), command);
					this.dispatch(command);
				};

				break;
			case 'function':
				button.onclick = command;
				break;
		}
		button.title = tooltip;

		if(save) this.setup(button);

		var apt = document.querySelector('div#pulsar-tbar');
		var br = apt.getBoundingClientRect();

		if(this.popup) {
			button.oncontextmenu = event => {
				this.popup.data = button;
				event.preventDefault();
				[this.popup.style.left, this.popup.style.top] = [`${event.clientX-br.x}px`, `${event.clientY-br.y}px`];
				this.popup.focus({ focusVisible: true });
				this.popup.classList.toggle('show');
			};
		}

		return button;
	},
	test(q) {
		console.log(q)
		console.log('🗑️')
	},
	load() {
		this.items.innerHTML = '';

		this.popup = this.addContextMenu('pulsar-tbar-popup', 'show', [
			{	label: 'Remove',
				command: event => {
console.log(`Remove ${this.popup.data}`)
					this.popup.data.remove();
					code.save();
				},
				tooltip: 'Remove Button'
			},
			{	label: 'Edit',
				command: event => {
console.log(`Edit ${this.popup.data}`)
					code.editButton(this.popup.data);
					code.save();
				},
				tooltip: 'Edit Button Label'
			},
		]);

		this.items.append(this.popup);

		this.fsp.readFile(`${atom.getConfigDirPath()}/pulsar-tbar.json`, 'utf8')
		.then(text => {
			let data = JSON.parse(text);
			data.buttons.forEach(item => {
				let button = this.addButton(item.label, item.command, item.tooltip, true, this.popup);
			});
		});
	},
	async save() {
		let data = await this.fsp.readFile(`${atom.getConfigDirPath()}/pulsar-tbar.json`, 'utf8');
		data = JSON.parse(data);
		data.buttons = Array.from(this.buttons)
			.filter(button => button.dataset.save)
			.map(button => (
				{label: button.textContent, command: button.dataset.command, tooltip: button.title }
			));
		data = JSON.stringify(data, null, '\t');
		await this.fsp.writeFile(`${atom.getConfigDirPath()}/pulsar-tbar.json`, data, 'utf8');
	},
	async loadCSS() {
		let ssPath = `${this.packagePath}/styles/${this.packageInfo['name']}.css`;
		var ss = document.querySelector(`style[source-path="${ssPath}"]`);
		let text = await this.fsp.readFile(ssPath, 'utf8')
		ss.innerHTML = text;
	},
	initFinder() {
		function doFilter() {
			let ul = this.querySelector('ul#commands');
			let filter = this.querySelector('input[name="filter"]');
			let filterText = filter.value;

			let commands = atom.commands.findCommands({target: atom.views.getView(atom.workspace)})
			.filter(command => command.name.startsWith(filterText));
			commands = commands.map(command => `<li><span class="display-name">${command.displayName}</span><span class="name">${command.name}</span></li>`);
			ul.innerHTML = commands.join('');
			ul.querySelectorAll('li>span').forEach(span => {
				span.inert = true;
			});
		}

		let div = document.createElement('div');
		div.classList.add('native-key-bindings');
		div.id='pulsar-tbar-view';

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
			atom.commands.dispatch(atom.views.getView(atom.workspace), command);
			================================================ */

			let [menu, items] = this.addMenu('☰ Actions', 'open', 'pulsar-tbar-menu', 'pulsar-tbar-menu-toggle');
			this.toolbar.append(menu);

			menu.addItem(items, 'Reload TBar', this.load.bind(code), 'Reload TBar Items')
			menu.addItem(items, 'Refresh CSS', this.loadCSS.bind(code), 'Refresh CSS');
			menu.addItem(items, 'Add Item …', () => {
				atom.commands.dispatch(atom.views.getView(atom.workspace), 'pulsar-tbar:add-item');
			}, 'Add Item');
			menu.addItem(items, 'Save', this.save.bind(code), 'Save TBar Items');

		/*	Rubbish
			================================================
			let rubbish = document.createElement('span');
			rubbish.id='pulsar-tbar-rubbish';
			rubbish.textContent = '🗑️';
			rubbish.dataset.special = true;
			this.toolbar.appendChild(rubbish);
			rubbish.ondragenter = event => {
				event.preventDefault();
				rubbish.classList.add('enter');
			}
			rubbish.ondragleave = event => {
				event.preventDefault();
				rubbish.classList.remove('enter');
			}
			rubbish.ondragover = event => {
				event.preventDefault();
			}
			rubbish.ondrop = event => {
				code.dragFunctions.element.remove();
				rubbish.classList.remove('enter');
				code.save();
			};
			================================================ */

		/*	Add div for items
			================================================
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

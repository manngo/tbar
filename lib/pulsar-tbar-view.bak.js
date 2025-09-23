'use babel';

export default class PulsarTbarView {
	filter;
	ul;
	form;
	constructor(serializedState) {
		this.element = document.createElement('div');
		this.element.classList.add('native-key-bindings');
		this.element.id='pulsar-tbar-view';

		this.form = document.createElement('form');

		this.form.innerHTML = `
			<input name="filter" type="text"/>
			<ul id="commands">hahaha</ul>
			<output id="command">
			<button name="cancel">Cancel</button>
			<button name="ok">Add</button>
		`;


		this.filter = this.form.querySelector('input[name="filter"]');
		this.ul = this.form.querySelector('ul#commands')
		this.output = this.form.querySelector('output#command')
		this.filter.addEventListener('keyup', event => {
			//	console.log(event.key)
			this.doFilter(this.filter.value);
		});
		this.ul.addEventListener('click', event => {
			console.log(event.target)
			let [displayName, name] = event.target.querySelectorAll('span');
			this.output.value = event.target.querySelector('span.name').textContent;
		});

		this.element.appendChild(this.form);
	}

	doFilter(filterText='') {
		let commands = atom.commands.findCommands({target: atom.views.getView(atom.workspace)})
		.filter(command => command.name.startsWith(filterText));
		commands = commands.map(command => `<li><span class="display-name">${command.displayName}</span><span class="name">${command.name}</span></li>`);
		this.ul.innerHTML = commands.join('');
		this.ul.querySelectorAll('li>span').forEach(span => {
			span.inert = true;
		});
	}

	open() {
		this.doFilter();
		this.form.elements['filter'].focus();
		this.form.elements['filter'].value='';
		return new Promise ((resolve, reject) => {
			form.elements['ok'].onclick = event => {
				if(returnElement) resolve(form.elements[returnElement].value);
				else resolve(new FormData(form));
			//	mp.destroy();
			};
			form.elements['cancel'].onclick = event => {
				resolve(null);
			//	mp.destroy();
			};
		});


	}

	// Returns an object that can be retrieved when package is activated
	serialize() {}

	// Tear down any state and detach
	destroy() {
		this.element.remove();
	}

	getElement() {
		return this.element;
	}

}

'use strict';

const jx = {
	pseudoDialog(html, id='tbar-about', returnElement=undefined, focus=undefined) {
		var form = document.createElement('form');
		form.classList.add('native-key-bindings');
		form.innerHTML = html;
		form.id = id;
		var mp = atom.workspace.addModalPanel({item: form, visible: false,});
		form.parentElement.id=`ap-${id}`;

		this.draggable(form.parentElement);

		mp.show();
		if(focus) form.elements[focus].focus();
		return new Promise ((resolve, reject) => {
			form.elements['ok'].onclick = event => {
				if(returnElement) resolve(form.elements[returnElement].value);
				else resolve(new FormData(form));
				mp.destroy();
			};
			form.elements['cancel'].onclick = event => {
				resolve(null);
				mp.destroy();
			};
		});
	},
	draggable(element, handle) {
	   element.style.position = 'fixed';
	   activateDrag();
	   function activateDrag() {
		   var left, top;



		   if(handle) handle.onmousedown = startDrag;
		   else element.onmousedown = startDrag;

		   if(left=localStorage.getItem('left')) element.style.left = `${left}px`;
		   if(top=localStorage.getItem('top')) element.style.top = `${top}px`;
		}

		function startDrag(event) {
			if(event.target != element) return;
			var left, top, startX, startY;
			//	Element & Mouse Position
			   left = element.offsetLeft;				//	Element Position
			   top  = element.offsetTop;
			//	Mouse Position
			   startX = event.clientX;
			   startY = event.clientY;

			//	Enable Drag & Drop Events
			   document.onmousemove = drag;
			   document.onmouseup = release;

			//	Change Appearance
			   element.style.cursor = 'move';
			   element.style.opacity = '.80';
			return false;

			function drag(event) {
			   var position = {"left":left+event.clientX-startX, "top":top+event.clientY-startY};
			   element.style.left=`${position.left}px`;
			   element.style.top =`${position.top}px`;
			   sessionStorage.setItem('left', position.left);
			   sessionStorage.setItem('top', position.top);
			   return false;
			}
			function release(e) {
			   document.onmousemove = null;
			   document.onmouseup = null;
			   element.style.opacity = element.style.filter = null;
			   element.style.cursor = null;
			}
		}
	},

	dragList(container, { elements, callback } = {}) {
		var element;
		elements = elements ?? container.children;

		function indexOf(element) {
			return Array.prototype.indexOf.call(elements, element);
		//	return [...elements].indexOf(element);
		}

		function dragstart(event) {
			element = event.target;
			event.dataTransfer.setData('oldPos', indexOf(element));
			element.classList.add('dragging');							//	CSS
		}

		function dragover(event) {
			event.preventDefault();
		}

		function drop(event) {
			event.stopPropagation();
			if(element != event.target) {
				let oldPos = event.dataTransfer.getData('oldPos');
				let newPos = indexOf(event.target);
				if(newPos<oldPos) container.insertBefore(element, event.target);
				else if(newPos>oldPos) container.insertBefore(element, event.target.nextSibling);
			}
			element.classList.remove('dragging');						//	CSS
			callback?.();
console.log([...elements].map(i => i.textContent).join(','))
		}

		function setup(e) {
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
	/*	Menu
		================================================
		div.[whatever]
			button
			div
				button
		================================================

		div.[whatever] {
			display: inline-block;
			&>button {
				&.toggle.open+div {
					display: block;
				}
			}
			&>div {
				background: white;
				position: absolute;
				z-index: 100;
				display: none;

				&>button {
					width: 100%;
					border: none;
					text-align: left;
					&:hover {
						background: var(--highlight);
						color: white;
					}
				}
				&>hr {
					margin: 0.375em 0.5em 0.125em;
				}
			}
		}
	}
	================================================ */
	addMenu(label, className, menuid, items) {
		let menu = document.createElement('div');
		let menuitems = document.createElement('div');

		function addItem(label, action, tooltip, hidden=false) {
			if(!label) {	//	no label => separator
				let hr = document.createElement('hr');
				if(hidden) hr.classList.add('option');
				menuitems.append(hr);
			}
			else {			//	Create Menu Item
				let button = document.createElement('button');
				menuitems.append(button);
				tooltip = tooltip ?? action;
				button.innerHTML = label;
				button.dataset.action = action;
			//	button.onclick = code.dispatch.bind(code, action);
				button.onclick = action;
				button.title = tooltip;
				if(hidden) button.classList.add('option');
			}
		}
		function addItems(items) {
			items.forEach(({label, action, tooltip, hidden}) => {
				addItem(label, action, tooltip, hidden);
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
				if(event.altKey && toggle.classList.contains('open')) toggle.classList.toggle('alt', true);
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
				toggle.classList.toggle('alt', false);
			};

		//	Add items, if any
			if(items) addItems(items);

		return [menu, menuitems, toggle];
	},


}

module.exports = jx;

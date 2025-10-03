'use strict';
console.log('library.js');
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
		//	items = [{label, action, tooltip}]
		let menu = document.createElement('div');
		let menuitems = document.createElement('div');
		let toggle;

		function addItem(label, action, tooltip, hidden=false) {
			if(label===undefined) {	//	no label => separator
				let hr = document.createElement('hr');
				if(hidden) hr.classList.add('option');
				menuitems.append(hr);
			}
			else {					//	Create Menu Item
				let button = document.createElement('button');
				menuitems.append(button);
				button.innerHTML = label;
				button.dataset.action = action;
				button.onclick = action;
				button.title = tooltip ?? action;
				if(hidden) button.classList.add('option');
			}
		}

		function addItems(items) {
			items.forEach(({label, action, tooltip, hidden}) => {
				addItem(label, action, tooltip, hidden);
			});
		}

		//	Menu Contaimer
			menu.addItem = addItem;
			menu.addItems = addItems;
			menu.setAttribute('tabindex', 1);
			menu.classList.add(className);

			if(menuid) menu.id = menuid;

		//	Add Menu Button & Items
			if(label) {
				menu.button = document.createElement('button');
				menu.append(menu.button);
				menu.button.classList.add('menu');	//	in lieu of :has() selector
				menu.button.innerHTML = label;
				menu.button.onclick = event => {
					menu.button.classList.toggle('open');
					if(event.altKey && menu.button.classList.contains('open')) menu.button.classList.toggle('alt', true);
					menu.button.parentElement.focus();
				};
				menu.button.title = 'Menu';
				menu.button.classList.add('toggle');
			}

			menu.append(menuitems);	//	add after toggle

		//	Close on loss of focus
		//	This also triggers the item (if any) as it also loses the menu’s focus
			menu.onblur = event => {
				let button = event.relatedTarget;
				if(button) button.click();
				menu.classList.toggle('open', false);
				menu.classList.toggle('alt', false);
				menu.button?.classList.toggle('open', false);
				menu.button?.classList.toggle('alt', false);
//				menu.item = undefined;
//				menu.element = undefined;
			};

		//	Add items, if any
			if(items) addItems(items);

		//	Show Popup
			if(!label) menu.show = (parent, button) => {
				var br = parent.getBoundingClientRect();
				[menu.style.left, menu.style.top] = [`${event.clientX-br.x}px`, `${event.clientY-br.y}px`];
				menu.focus({ focusVisible: true });
				menu.classList.toggle('open');
//				menu.button = button;
//				menu.item = parent;
			};

		return [menu, menuitems, menu.button];
	},


}

module.exports = jx;

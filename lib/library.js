'use strict';

const jx = {
	pseudoDialog(html, id='pulsar-tbar-about', returnElement=undefined, focus=undefined) {
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

}

module.exports = jx;

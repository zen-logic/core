export const rubberband = {

	selectRegion: function (r) {
		for (const item in this.stack) {
			if (this.stack[item] instanceof core.wb.Icon) {
				const icon = this.stack[item];
				const rect = icon.el.getBoundingClientRect();
				if (core.util.rectsIntersect(rect, r)) {
					if (!icon.el.classList.contains('selected')) {
						icon.el.classList.add('selected');
						this.select(icon, true);
					}
				} else {
					if (icon.el.classList.contains('selected')) {
						icon.deselect();
					}						
				}
			}
		}
	},

	getRubberBand: function (e) {

		const self = this,
			  rect = this.el.getBoundingClientRect(),
			  startX = e.touches === undefined ? e.clientX - rect.left + this.el.scrollLeft : e.touches[0].clientX - rect.left + this.el.scrollLeft,
			  startY = e.touches === undefined ? e.clientY - rect.top + this.el.scrollTop : e.touches[0].clientY - rect.top + this.el.scrollTop
		;
		
		function select (e) {
			const x = e.touches === undefined ? e.clientX - rect.left + self.el.scrollLeft : e.touches[0].clientX - rect.left + self.el.scrollLeft,
				  y = e.touches === undefined ? e.clientY - rect.top + self.el.scrollTop : e.touches[0].clientY - rect.top + self.el.scrollTop;

			let left = x > startX ? startX : x,
				width = x > startX ? x - startX : startX - x,
				top = y > startY ? startY : y,
				height = y > startY ? y - startY : startY - y;

			self.rubberband.style.left = left + 'px';
			self.rubberband.style.width = width + 'px';
			self.rubberband.style.top = top + 'px';
			self.rubberband.style.height = height + 'px';
			
			self.selectRegion(self.rubberband.getBoundingClientRect());
		}

		function cleanup (e) {
			desktop.el.removeEventListener('mousemove', select);
			desktop.el.removeEventListener('mouseup', cleanup);
			desktop.el.removeEventListener('mouseout', exitWindow);
			self.rubberband.remove();
			self.rubberband = null;
		}

		
		function exitWindow (e) {
			e = e ? e : window.event;
			var from = e.relatedTarget || e.toElement;
			if (!from || from.nodeName == "HTML") {
				cleanup(e);
			}
		}

		
		if (!this.rubberband) {
			this.rubberband = core.ui.createElement({
				parent: this.el,
				cls: ['rubberband']
			});
		}

		desktop.el.addEventListener('mousemove', select);
		desktop.el.addEventListener('mouseup', cleanup);
		desktop.el.addEventListener('mouseout', exitWindow);
	}
};

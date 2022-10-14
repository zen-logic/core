export const rubberband = {

	selectRegion: function (r, multi) {
		for (const item in this.stack) {
			if (this.stack[item] instanceof core.wb.Icon) {
				const icon = this.stack[item];
				const rect = icon.el.getBoundingClientRect();
				if (core.util.rectsIntersect(rect, r)) {
					icon.el.classList.add('selected');
					this.select(icon, true);
				} else {
					if (!multi) {
						icon.deselect();
					}
				}
			}
		}
	},

	getRubberBand: function (e) {
		const self = this,
			  startX = e.touches === undefined ? e.clientX : e.touches[0].clientX,
			  startY = e.touches === undefined ? e.clientY : e.touches[0].clientY
		;
		
		function select (e) {
			const x = e.touches === undefined ? e.clientX : e.touches[0].clientX,
				  y = e.touches === undefined ? e.clientY : e.touches[0].clientY;

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
			self.rubberband.remove();
			self.rubberband = null;
			self.el.removeEventListener('mousemove', select);
			self.el.removeEventListener('mouseup', cleanup);
			self.el.removeEventListener('mouseout', exitWindow);
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

		this.el.addEventListener('mousemove', select);
		this.el.addEventListener('mouseup', cleanup);
		this.el.addEventListener('mouseout', exitWindow);
		
	}
};

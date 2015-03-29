var guiControl = {

	guiTimeout: null,
	guiTime: 3000,
	show: function (permanent) {

		if(!this.isVisible()) {
			this.setClass(true);
		}
		clearTimeout(this.guiTimeout);
		if(!permanent) {
			this.guiTimeout = setTimeout(this.hide, this.guiTime);
		}
		$('#mouse-pool').focus()
	},
	hide: function () {
		if(this.isVisible()) {
			this.setClass(false);
		}
		clearTimeout(this.guiTimeout);
	},
	toggle: function (permanent) {
		if(this.isVisible()) {
			this.hide();
		} else {
			this.show(permanent);
		}
	},
	isVisible: function () {
		return $('.gui').hasClass('visible');
	},
	setClass: function (on) {
		$('.gui').toggleClass('visible', on);
	}
};
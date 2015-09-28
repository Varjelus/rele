function msToTime(ms) {
	var d = new Date(ms),
		h = d.getHours(),
		m = d.getMinutes();
	h = h < 10 ? "0" + h : h;
	m = m < 10 ? "0" + m : m;

	return h + ":" + m;
}

function cleanUp() {
	this.hide()
	tray.remove()
    rele.cleanUp()
	this.close(true)
}

function playHighlight(elem) {
	elem.play()
}

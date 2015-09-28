function msToTime(ms) {
	var d = new Date(ms),
		h = d.getHours(),
		m = d.getMinutes();
	h = h < 10 ? "0" + h : h;
	m = m < 10 ? "0" + m : m;

	return h + ":" + m;
}

function linkify(str) {
	var e = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gi,
	t = /(^|[^\/])(www\.[\S]+(\b|$))/gi,
	n = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gi;
	return str.replace(e, '<a target="_blank" href="$&">$&</a>').replace(t, '$1<a target="_blank" href="http://$2">$2</a>').replace(n, '<a target="_blank" href="mailto:$&">$&</a>');
}

function makeSafe(unsafe) {
	return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
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

// Modified slightly from updated version on http://stackoverflow.com/a/987376
function selectText(el) {
	var doc = document,
		range, selection;
	if (doc.body.createTextRange) {
		range = document.body.createTextRange();
		range.moveToElementText(el);
		range.select();
	} else if (window.getSelection) {
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(el);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}
export default selectText;

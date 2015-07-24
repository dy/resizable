var Resizable = require('resizable');
var Draggable = require('draggy');
var q = require('queried');
var domify = require('domify');

var doc = document, body = doc.body;


describe('Basic interactions', function () {
	it('Box-sizing', function () {
		// var resEls = document.querySelectorAll('.resizable');
		// for (var i = 0, l = resEls.length, resEl; i < l; i++){
		// 	resEl = resEls[i];
		// 	if (!resEl.resizable) {
		// 		var res = new Resizable(resEl, {
		// 			resize: function(){
		// 				console.log('resize')
		// 			}
		// 		});
		// 		var dr = new Draggy(resEl, {
		// 			within: null//'..'
		// 		});
		// 	} else {
		// 		resEl.resizable.destroy();
		// 		resEl.draggy.destroy();
		// 	}
		// }
	});

	it('Inline resize', function () {
		var caseEls = domify(`
			<div class="spacer">Spacy content</div>
			<div class="resizable">Inline resize</div>
			<div class="spacer">Spacy content</div>
		`);
		var el = q('.resizable', caseEls);

		body.appendChild(caseEls);

		var draggable = new Draggable(el, {

		});

		var resizable = new Resizable(el, {

		});
	});

	it('Position:absolute resize', function () {
		var el = domify(`
		<div class="resizable" style="position: absolute; top: 200px; left: 200px;">Absolute resize</div>
		`);
		body.appendChild(el);

		var draggable = Draggable(el, {

		});

		var resizable = Resizable(el, {

		});
	});

	it('Min/max size', function () {
		var el = domify(`
		<div class="resizable" style="position: absolute; top: 200px; left: 300px; min-width: 80px; max-width:120px; min-height: 80px; max-height: 120px;">Min/max size</div>
		`);
		body.appendChild(el);

		var draggable = Draggable(el, {

		});

		var resizable = Resizable(el, {

		});
	});

	it('Within', function () {
		var el = domify(`
			<div class="resizable" style="
				position: absolute;
				top:0;
				left:0;
				right:0;
				min-height: 20px;
				margin: 0;
				width: auto;
				height: auto;">Bound resize</div>
		`);
		var container = domify(`
		<div class="container">
			Restricting container
		</div>
		`)
		container.appendChild(el);
		body.appendChild(container);

		var draggable = Draggable(el, {
			within: container
		});

		var resizable = Resizable(el, {
			within: container
		});
	});

	it('Outside', function () {
		var container = domify(`
		<div style="position: relative; top: 200px;">
			<div class="resizable" style="position: absolute; top:200px">Outside</div>
		</div>
		`);
		var el = q('.resizable', container);
		body.appendChild(container);

		var draggable = Draggable(el, {

		});

		var resizable = Resizable(el, {

		});
	});
});
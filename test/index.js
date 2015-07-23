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

		// var draggable = new Draggable(el, {

		// });

		var resizable = new Resizable(el, {

		});
	});

	it('Position:absolute resize', function () {
		`
		<div class="resizable" style="position: absolute; top: 200px; left: 200px;">Absolute resize</div>
		`
	});

	it('Min/max size', function () {
		`
		<div class="resizable" style="position: absolute; top: 200px; left: 300px; min-width: 80px; max-width:120px; min-height: 80px; max-height: 120px;">Min/max size</div>
		`
	});

	it('Within', function () {
		`
		<div class="container">
			<div class="resizable" style="
				position: absolute;
				top:0;
				left:0;
				right:0;
				min-height: 20px;
				margin: 0;
				width: auto;
				height: auto;">Bound resize</div>
			Restricting container
		</div>
		`
	});

	it('Outside', function () {
		`
		<div style="position: relative; top: 600px;">
			<div class="resizable" style="position: absolute; top:200px">Outside</div>
		</div>
		`
	});
});
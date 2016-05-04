var Resizable = require('../index');
var Draggable = require('draggy');
var q = require('queried');
var domify = require('domify');
var test = require('tst')//.only();

var doc = document, body = doc.body;


test.skip('Box-sizing', function () {
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

test('Inline resize', function () {
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

test('Position:absolute resize', function () {
	var el = domify(`
	<div class="resizable" style="position: absolute; top: 200px; left: 200px;">Absolute resize</div>
	`);
	body.appendChild(el);

	var resizable = Resizable(el, {
		handles: 'e',
		draggable: true
	});
	var draggable = Draggable(el, {

	});

});

test('Min/max size', function () {
	var el = domify(`
	<div class="resizable" style="position: absolute; top: 200px; left: 300px; min-width: 80px; max-width:120px; min-height: 80px; max-height: 120px;">Min/max size</div>
	`);
	body.appendChild(el);

	var draggable = Draggable(el, {

	});

	var resizable = Resizable(el, {

	});
});

test('Within', function () {
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

	var resizable = Resizable(el, {
		within: 'parent',
		draggable: true
	});
});

test('Outside', function () {
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

test('Destroy', function () {
	var el = domify(`
	<div class="resizable" style="position: absolute; top: 200px; left: 300px; min-width: 80px; max-width:120px; min-height: 80px; max-height: 120px;">Min/max size</div>
	`);
	body.appendChild(el);

	var resizableInstance = new Resizable(el, {
		within: 'parent',
		handles: 'e',
		threshold: 1,
		draggable: false
	});

	resizableInstance.destroy();
});

test('height: 100perc', function () {
	var el = domify(`
		<div class="heighty resizable" style="width: 20px">heighty</div>
	`);
	body.appendChild(el);

	Resizable(el, {
		draggable: false,
		within: body
	});
});
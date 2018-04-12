var Benchmark = require('benchmark')
var ScotFree = require('./lib/scot-free')




let suite = new Benchmark.Suite()

suite
.on('cycle', function(event) {
  console.log(String(event.target));
})


// .on('complete', function() {
//   console.log('Fastest is ' + this.filter('fastest').map('name'));
// })


.add('Basic overlap. Compile + Generate', function () {
	ScotFree(`text with o**verlapping b//old** and italic//`)()
})


.add('Basic overlap. Compile ONLY', function () {
	ScotFree(`text with o**verlapping b//old** and italic//`)
})


.add('Basic paragraphs. Compile + Generate', function () {
	ScotFree(`
this is a normal paragraph

	this paragraph is indented 1

		this paragraph is indented 2`)()
})

.add('Basic paragraphs. Compile ONLY', function () {
	ScotFree(`
this is a normal paragraph

	this paragraph is indented 1

		this paragraph is indented 2`)
})


let template = ScotFree(`
this is a normal paragraph

	this paragraph is indented 1

		this paragraph is indented 2`)

suite.add('Basic paragraphs. Generate ONLY', function () {
	template()
})






suite.run()

/*



Basic overlap. Compile + Generate x 56,538 ops/sec ±1.80% (88 runs sampled)
Basic overlap. Compile ONLY x 65,183 ops/sec ±1.88% (86 runs sampled)
Basic paragraphs. Compile + Generate x 51,745 ops/sec ±2.01% (84 runs sampled)
Basic paragraphs. Compile ONLY x 62,573 ops/sec ±1.68% (87 runs sampled)
Basic paragraphs. Generate ONLY x 545,227 ops/sec ±2.07% (82 runs sampled)



*/

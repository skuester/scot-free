// TODO: check out tap-difflet

const test = require('tape')
const ScotFree = require('./../lib/scot-free')

// WANT
// template.pipe(ScotFree.stream(opts)).pipe(out_file)

example(
'overlapping inline tags',

`text with o**verlapping b//old** and italic//`,

`<p>text with o<strong>verlapping b<em>old</em></strong><em> and italic</em></p>`
)



example(
'a paragraph',

`Hello, World`,

`<p>Hello, World</p>`
)



example(
'a multiline block',

`one
two
	three`,

`<pre>one
two
	three</pre>`
)



example(
'an indented paragraph',

`this is a normal paragraph

	this paragraph is indented 1

		this paragraph is indented 2`,

`<p>this is a normal paragraph</p>
<p class="t1">this paragraph is indented 1</p>
<p class="t2">this paragraph is indented 2</p>`
)






function example(description, template, output, runner = test) {
	runner(description, t => {
		let result = ScotFree(template)()
		t.equal(result, output, 'template is correct')
		t.end()
	})
}

const stream = require('stream')

module.exports = ScotFree

const END = /^\s*$/
const TABS = /^(\t+)(.*)$/



function ScotFree(template) {
	let lines = template.split("\n")
	let tokens = tokenize(lines)

	return function () {
		let output = generate(tokens)
		return output
	}
}




function tokenize(lines) {
	let tokens = []
	let context = false

	lines.forEach(str => {
		let this_token = token(str, context)

		switch (this_token.type) {
			case 'end':
				flush()
				break

			case 'text':
				consume_token(this_token)
				break

			default:
				throw new Error(`Could not tokenize line: ${str}`)
		}
	})

	flush()

	return tokens



	function flush() {
		// console.log('>>> FLUSH')
		if (!context) return
		tokens.push(context)
		context = false
	}


	function consume_token(this_token) {
		if (!context) {
			context = this_token
			return
		}

		if (context.type != this_token.type) {
			throw new Error(`Context is confused: expected token ${context.type}, but got ${this_token.type}`)
		}

		context.value = context.value.concat(this_token.value)
	}
}


function token(str, context) {
	let match = false

	if (END.test(str)) {
		return {type: 'end'}
	}

	// only match tabs when starting a new block
	if (!context && (match = str.match(TABS))) {
		return {type: 'text', value: [match[2]], indent: match[1].length}
	}

	return { type: 'text', value: [str] }
}


function generate(tokens) {
	return tokens.map(function (t) {
		switch (t.type) {
			case 'text':
				var attrs = t.indent ? ` class="t${t.indent}"` : ''

				if (t.value.length === 1) {
					return `<p${attrs}>${t.value[0]}</p>`

				}
				else {
					return `<pre${attrs}>${t.value.join("\n")}</pre>`
				}

			default:
				throw new Error(`Unknown token type: ${t.type}`)
		}
	}).join("\n")
}

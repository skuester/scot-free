const stream = require('stream')

module.exports = ScotFree

const END = /^\s*$/
const TABS = /^(\t+)(.*)$/



function ScotFree(template) {
	let tokens = Tokenize(template)
	// console.log("tokens", tokens)
	let ast = Parse(tokens)

	return function () {
		return Generate(ast)
	}
}


function Tokenize(input) {
	const TOKENS = [
		{type: 'strong', re: /\*\*/},
		{type: 'em', re: /\/\// },
		{type: 'line_end', re: /\n/ },
	]

	let tokens = []
	let match

	// on data
	tokenize_chunk(input)

	return end()



	function end() {
		tokens.push({type: 'block_end'}) // basically, ensure the doc ends with a blank line
		return tokens
	}



	function tokenize_chunk(str) {
		if (!str) return

		let found = false

		TOKENS.forEach(({type, re}) => {
			if (found) return

			if (match = str.match(re)) {
				let before = str.slice(0, match.index)
				let after = str.slice(match.index + match[0].length)

				tokenize_chunk(before)
				tokens.push({type})
				tokenize_chunk(after)
				found = true
			}
		})

		if (!found) {
			tokens.push({type: 'text', value: str})
		}
	}
}

function Node(name) {
	return class {
		static get name() {
			return name
		}

		constructor(body = []) {
			this.name = name
			this.body = [].concat(body)
			// pending
			this.lines = 0
		}

		is(node_name) {
			return node_name === this.name
		}

		concat(content) {
			this.body = this.body.concat(content)
		}

		increment_lines() {
			this.lines += 1
		}
	}
}
const Nodes = {
	document: Node('document'),
	pending: Node('pending'),
	p: Node('p'),
	pre: Node('pre'),
	strong: Node('strong'),
	em: Node('em'),
	text: Node('text'),
	new_line: Node('new_line'),
}




function Parse(tokens) {
	let ast = []
	let stack = []
	let open_nodes = {}
	let reopen = []

	open('document')

	tokens.forEach(token => {
		switch (token.type) {
			// case 'document_end': handle_document_end(); break
			case 'block_end': consume_block_end(); break
			case 'line_end': consume_line_end(); break
			case 'text': consume_text(token.value); break
			case 'strong': consume_inline('strong'); break
			case 'em': consume_inline('em'); break
		}
	})

	return ast


	function consume_line_end() {
		let pending
		if (pending = is_open('pending')) {
			pending.increment_lines()
		}
		current_node().concat(new Nodes.new_line())
	}

	function consume_block_end() {
		let pending
		if (pending = is_open('pending')) {
			if (pending.lines > 1) pending.name = 'pre'
			else pending.name = 'p'
			close(pending.name)
		}
	}

	function consume_text(value) {
		let node = new Nodes.text(value)
		let current = current_node()

		if (current.is('document')) {
			open('pending').concat(node)
		}
		else {
			current.concat(node)
		}
	}

	function consume_inline(node_name) {
		if (is_open(node_name)) {
			close(node_name)
		}
		else {
			open(node_name)
		}
	}

	function is_open(node_name) {
		return open_nodes[node_name]
	}

	function close(node_name) {
		// console.log("---Close", node_name)

		while (stack.length) {
			if (current_node().is(node_name)) {
				stack.pop()
				delete open_nodes[node_name]
				reopen_nodes()
				return
			}
			else {
				reopen.push(stack.pop())
			}
		}

		throw new Error(`Stack is empty! Cannot close ${node_name}`)
	}


	function current_node() {
		return open_nodes[_last(stack)]
	}


	function reopen_nodes() {
		reopen.forEach(open)
		reopen = []
	}


	function open(node_name) {
		let node = new Nodes[node_name]()
		let current = current_node()
		if (current) {
			current.concat(node)
		}
		else {
			ast.push(node)
		}
		stack.push(node_name)
		open_nodes[node_name] = node
		return node
		// console.log('+++OPEN', node_name)
		// console.log("open_nodes", Object.keys(open_nodes))
	}
}




function Generate(ast) {
	return render(ast)

	function render(body) {
		return body.map(render_node).join('')
	}

	function render_node(node) {
		switch (node.name) {
			case 'document':
				return render(node.body)

			case 'new_line':
				return "\n"

			case 'p':
				return `<p>${render(node.body)}</p>`

			case 'pre':
				return `<pre>${render(node.body)}</pre>`

			case 'strong':
				return `<strong>${render(node.body)}</strong>`

			case 'em':
				return `<em>${render(node.body)}</em>`

			case 'text':
				return node.body.join('')

			default:
				throw new Error(`No generator for type: ${node.name}`)
		}
	}
}



// possible lodash
function _last(arr) { return arr && arr[arr.length - 1] }

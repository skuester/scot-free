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
		{type: 'block_end', re: /\n\n+/ },
		{type: 'tab', re: /^\t+/ },
		{type: 'line_end', re: /\n/ },
	]

	let tokens = []

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
			let match
			if (found) return

			if (match = str.match(re)) {
				let before = str.slice(0, match.index)
				let after = str.slice(match.index + match[0].length)

				tokenize_chunk(before)
				tokens.push({type, value: match[0]})
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
			this.tabs = 0
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
	tab: Node('tab'),
}




function Parse(tokens) {
	let ast = []
	let stack = []
	let open_nodes = {}
	let reopen = []

	let tab_count = 0

	open('document')

	tokens.forEach(token => {
		switch (token.type) {
			// case 'document_end': handle_document_end(); break
			case 'block_end': consume_block_end(); break
			case 'line_end': consume_line_end(); break
			case 'text': consume_text(token.value); break
			case 'strong': consume_inline('strong'); break
			case 'em': consume_inline('em'); break
			case 'tab': consume_tab(token.value); break
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

	function consume_tab(value) {
		let current = current_node()
		if (current.is('document')) {
			tab_count += value.length
		}
		else {
			current.concat(new Nodes.tab(value.length))
		}
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

		let parent = current.is('document') ?
			open('pending') :
			current

		parent.concat(node)
		parent.tabs = tab_count
		tab_count = 0
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

			case 'tab':
				return "\t".repeat(node.body[0])

			case 'p':
				return block_elem('p', node)

			case 'pre':
				return block_elem('pre', node)

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


	function block_elem(tag, node) {
		let attrs = node.tabs ? ` class="t${node.tabs}"` : ''
		return `<${tag}${attrs}>${render(node.body)}</${tag}>`
	}
}



// possible lodash
function _last(arr) { return arr && arr[arr.length - 1] }

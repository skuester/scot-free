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


function Tokenize(chunk) {
	const TOKENS = [
		{type: 'strong', re: /\*\*/},
		{type: 'em', re: /\/\// },
	]

	let tokens = []
	let match

	tokenize_chunk(chunk)

	// tokens.push({type: 'document_end'})

	return tokens

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
		}

		is(node) {
			return node.name === this.name
		}

		concat(content) {
			this.body = this.body.concat(content)
		}
	}
}
const DocumentNode = Node('document')
const PendingNode = Node('pending')
const PNode = Node('p')
const StrongNode = Node('strong')
const EmNode = Node('em')
const TextNode = Node('text')




function Parse(tokens) {
	let top_node = new DocumentNode()
	let ast = [top_node]
	let stack = [top_node]
	let open_nodes = {}
	let reopen = []

	tokens.forEach(token => {
		switch (token.type) {
			// case 'document_end': handle_document_end(); break
			case 'text': consume_text(token.value); break
			case 'strong': consume_inline(StrongNode); break
			case 'em': consume_inline(EmNode); break
		}
	})

	return ast

	// function handle_document_end() {
	// 	if (open_nodes.pending) {
	// 		open_nodes.pending.type = 'text'
	// 	}
	// }

	function consume_text(value) {
		let current = current_node()

		// if (current.is(DocumentNode)) {
		// 	open(PendingNode, value)
		// }
		// else {
			current.concat(new TextNode(value))
		// }
	}

	function consume_inline(type) {
		if (is_open(type)) {
			close(type)
		}
		else {
			open(type)
		}
	}

	function is_open(node) {
		return open_nodes[node.name]
	}

	function close(node_type) {
		if (!stack.length) throw new Error(`Stack is empty! Cannot close ${node_type}`)

		delete open_nodes[node_type.name]

		if (_last(stack).is(node_type)) {
			stack.pop()
		}
		else {
			reopen.push(stack.pop())
			close(node_type)
			while (reopen.length) {
				open(reopen.shift().constructor)
			}
		}
	}


	function current_node() {
		return _last(stack)
	}


	function open(node_type, value) {
		let node = new node_type(value)
		current_node().concat(node)
		stack.push(node)
		open_nodes[node.name] = node
	}
}




function Generate(ast) {
	return render(ast)

	function render(body) {
		return body.map(render_node).join('')
	}

	function render_node(node) {
		switch (node.name) {
			// case 'document':
			// 	return render(node.body)

			case 'document': //temp
			case 'p':
				return `<p>${render(node.body)}</p>`

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

const React = require('react');
const WebContext = require('./ContextTester');

const isWildCard = (component) => component.props.matches === '*';

const ContextualRouter = React.createClass({

	getInitialState: function() {
		return {
			shouldFallback:false
		};
	},

	onContextChange: function(child, matched) {

		if (!isWildCard(child)) {

			// create array if not already defined
			if (!this.activeChildren) {
				this.activeChildren = [];
			}

			// remove child of which context changed
			this.activeChildren = this.activeChildren.filter(activeChild => activeChild.props.matches !== child.props.matches);

			// add child if matched
			if (matched) {
				this.activeChildren.push(child);
			}

		}

		// loop over children to see if there's a fallback child
		const hasFallback = this.props.children.filter(isWildCard).length === 1;

		// if so
		this.setState({
			shouldFallback:hasFallback && this.activeChildren.length === 0
		});

	},

	render:function() {

		const children = this.props.children;
		const shouldFallback  = this.state.shouldFallback;
		const output = React.Children.map(children,
			(child) => {

				if (!shouldFallback && isWildCard(child)) {
					return null;
				}

				return React.cloneElement(child, {
					onContextChange: this.onContextChange
				});

			}
		);

		return React.createElement('div', null, output || '');
	}

});

const Context = React.createClass({

	propTypes: {
		matches: React.PropTypes.string
	},

	getDefaultProps: function() {
		return {
			matches: null,
			onContextChange: () => {}
		};
	},

	getInitialState: function() {
		return {
			matchesContext:isWildCard(this)
		};
	},

	componentDidMount: function() {

		if (isWildCard(this)) {
			this.props.onContextChange(this, true);
			return;
		}

		WebContext.setTest(this.props.matches, this.container, matchesContext => {

			this.setState({
				matchesContext:matchesContext
			});

			this.props.onContextChange(this, matchesContext);
		});

	},

	render:function() {

		return React.createElement('div', { ref: container => { this.container = container } }, this.state.matchesContext ? this.props.children : '');

	}

});

module.exports = {
	ContextualRouter:ContextualRouter,
	Context:Context
};
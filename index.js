import React from 'react';
import { WebContext } from './ContextTester';

const isWildCard = (component) => component.props.matches === '*';


class ContextRouter extends React.Component {
	
	constructor(props) {
		
		super(props);
		
		this.activeChildren = [];
		
		this.state = {
			shouldFallback:false
		};
		
	}
	
	onContextChange(child, matched) {
		
		if (!isWildCard(child)) {
			
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
		
	}
	
	render() {
		
		const { children } = this.props;
		const { shouldFallback } = this.state;
		
		return (<div> {
			React.Children.map(children,
				(child) => {
					
					if (!shouldFallback && isWildCard(child)) {
						return null;
					}
					
					return React.cloneElement(child, {
						onContextChange: this.onContextChange.bind(this)
					});
					
				}
			)
		} </div>);
		
	}
	
}


class Context extends React.Component {
	
	constructor(props) {
		
		super(props);
		
		this.state = {
			matchesContext:isWildCard(this)
		};
		
	}
	
	componentDidMount() {

		if (isWildCard(this)) {
			this.props.onContextChange(this, true);
			return;
		}

		WebContext.setTest(this.props.matches, this.container, matchesContext => {
			
			this.setState({
				...this.state,
				matchesContext
			});

			this.props.onContextChange(this, matchesContext);
		});
		
	}
	
	render() {
		
		return (
			<div ref={ container => { this.container = container } }>
				{ this.state.matchesContext ? this.props.children : null }
			</div>
		);
		
	}

}

Context.propTypes = {
	matches: React.PropTypes.string
};

Context.defaultProps = {
	matches: null,
	onContextChange: () => {}
};

export {
	ContextRouter,
	Context
}
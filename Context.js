import React, { Component } from 'react';
import PropTypes from 'prop-types';

// <Context query="@media (min-width:30em)"></Context>
// <Context query="@media (min-width:30em)" component={MyComponent}/>
// <Context>Fallback content</Context>
export class Context extends Component {
    static propTypes = {
        query: PropTypes.string,
        component: PropTypes.func
    };

    render() {
        const { component, children } = this.props;

        if (component) return React.createElement(component);

        if (children) return this.props.children;

        return null;
    }
}

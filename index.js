import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as conditioner from 'conditioner-core';

const hasQuery = child => !!child.props.query;
const isFallback = child => !hasQuery(child);

// <Context query="@media (min-width:30em)"></Context>
// <Context query="@media (min-width:30em)" component={MyComponent}/>
// <Context>Fallback content</Context>
export class Context extends Component {
    render() {
        const { component, children } = this.props;

        if (component) return React.createElement(component);

        if (children) return this.props.children;

        return null;
    }
}

// PropsTypes
Context.propTypes = {
    query: PropTypes.string,
    component: PropTypes.func
};

// <ContextRouter/>
export class ContextRouter extends Component {
    constructor(props) {
        super(props);
        this.state = { matches: [] };
    }

    componentDidMount() {
        const { children } = this.props;

        const childMonitors = children.filter(hasQuery).map(child => {
            // setup context monitor for this child
            const monitor = conditioner.monitor(child.props.query);

            // when we detect a change, we build a new matches array and update state
            monitor.onchange = match => {
                const matches = childMonitors
                    .filter(childMonitor => childMonitor.monitor.matches)
                    .map(childMonitor => childMonitor.child);
                this.setState({ matches });
            };

            // link child to monitor
            return {
                child,
                monitor
            };
        });

        // go!
        childMonitors.forEach(childMonitor => childMonitor.monitor.start());
    }

    render() {
        return this.state.matches.length
            ? this.state.matches
            : this.props.children.find(isFallback) || null;
    }
}

import React, { Component } from 'react';
import * as conditioner from 'conditioner-core';

const hasQuery = child => !!child.props.query;
const isFallback = child => !hasQuery(child);

// <ContextRouter/>
export class ContextRouter extends Component {
    state = {
        matches: []
    };

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

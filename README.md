# React Contextual Router

React Contextual Router is a contextual routing library for React based on [Conditioner](https://github.com/rikschennink/conditioner).

Render components based on user context.


## Installation

`npm install react-contextual-router --save`


## Usage

```jsx
import React, { Component } from 'react';
import { Context, ContextRouter } from 'react-contextual-router';

class FallbackComponent extends Component {
    render() {
        return <b>Fallback</b>;
    }
}

class App extends Component {
  render() {
    return (
      <ContextRouter>
        <Context query="@media (min-width:40em)">
          <h1>Hello</h1>
        </Context>

        <Context query="@media (max-width:30em)">
          <h1>World</h1>
        </Context>

        <Context component={FallbackComponent} />
      </ContextRouter>
    );
  }
}

export default App;
```

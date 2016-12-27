import React, { Component } from 'react';
import { ContextualRouter, Context } from 'react-contextual-router';
import logo from './logo.svg';
import './App.css';


class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
    
          <ContextualRouter>
              <Context matches="media:{(min-width:40em)} and element:{was visible}" id="0">
    
                  <p>Big screen and element seen</p>
    
              </Context>
              <Context matches="*" id="1">
    
                  <p>Fallback</p>
    
              </Context>
          </ContextualRouter>
          
      </div>
    );
  }
}

export default App;

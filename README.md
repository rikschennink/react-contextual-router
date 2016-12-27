# React Context Router

React Context Router is a contextual routing library for React. Conditionally load components based on contextual parameters. If the specific component has been scrolled into view (save CPU load), if the viewport matches certain media queries, or if the user for instance has a specific input device.

Build specific components for specific contexts instead of mixing a mobile menu with a desktop one.

React Context Router is an experimental port of [ConditionerJS](http://conditionerjs.com) to React.


## Example

```html
<ContextRouter>
  <Context matches="media:{(min-width:50em)} and element:{was visible}">
    
    <p>Only show on big viewports when the element has been scrolled into view.</p>

  </Context>
  <Context matches="*">
    
    <p>If the above is not matched, show this instead.</p>

  </Context>
</ContextRouter>
```
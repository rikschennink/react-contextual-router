# React Contextual Router

React Contextual Router is a routing library for React for conditional component loaded based on the user context. For instance, is the user using the app on a wide screen, is the user using a pointer device, has the user seen a component. Based on this information you can then load component A or B to better suit functionality to the context of the user.

For now, this is an experiment in porting [ConditionerJS](http://conditionerjs.com) to React.


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
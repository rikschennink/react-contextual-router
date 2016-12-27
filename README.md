# React Contextual Router

React Contextual Router is a contextual routing library for React. Load components based on contextual information like viewport size, pointer type and element visibility.

Is the user using your app on a wide viewport load the MegaDropdownMenu component, is it a narrow viewport, load the SlideInMenu component instead.

For now, this is an experimental port of [ConditionerJS](http://conditionerjs.com) to React.


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

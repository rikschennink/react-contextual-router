# React Contextual Router

React Contextual Router is a contextual routing library for React based on [Conditioner](https://github.com/rikschennink/conditioner).

```html
<ContextRouter>
  <Context query="@media (min-width:40em)">
      <h1>Hello</h1>

  </Context>

  <Context query="@media (max-width:30em)">
      <h1>World</h1>

  </Context>

  <Context component={FallbackComponent} />
</ContextRouter>
```

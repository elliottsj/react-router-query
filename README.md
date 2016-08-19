# react-router-query
An API to query static [react-router][] routes.

### Installation
```shell
npm install react-router-query
```

### Usage
```jsx
import { query } from 'react-router-query';

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={Dashboard} />
    <Route path="about" component={About} />
    <Route path="inbox" component={Inbox}>
      <Redirect from="messages/:id" to="/messages/:id" />
    </Route>
    <Route component={Inbox}>
      <Route path="messages/:id" component={Message} />
    </Route>
  </Route>
);

query('/', routes, (error, result) => {
  expect(result).toEqual([
    {
      fullPath: '/',
      component: Dashboard,
      parents: [
        {
          path: '/',
          component: App,
          indexRoute: { /* ... */ },
          childRoutes: [/* ... */],
        },
      ],
    },
    {
      fullPath: '/about',
      component: About,
      parents: [
        {
          path: '/',
          component: App,
          indexRoute: { /* ... */ },
          childRoutes: [/* ... */],
        },
      ],
    },
    {
      fullPath: '/inbox/messages/:id',
      path: 'messages/:id',
      from: 'messages/:id',
      to: '/messages/:id',
      onEnter(/* ... */) {/* ... */},
      parents: [
        {
          path: '/',
          component: App,
          indexRoute: { /* ... */ },
          childRoutes: [/* ... */],
        },
        {
          path: 'inbox',
          component: Inbox,
          childRoutes: [/* ... */],
        },
      ],
    },
    {
      fullPath: '/messages/:id',
      component: Message,
      parents: [
        {
          path: '/',
          component: App,
          indexRoute: { /* ... */ },
          childRoutes: [/* ... */],
        },
        {
          component: Inbox,
          childRoutes: [/* ... */],
        },
      ],
    },
  ]);
});
```

The `query` function will traverse the route configuration and call the provided callback with an array of [`FlatRoute`s](): leaf routes from the passed route configuration, with additional properties `fullPath` (the full path to the leaf route) and `parents` (an array of parents of the leaf route).

This can be useful for static sites using react-router, where you want to render a list of all pages under a given path.

react-router-query also provides a `withQuery` [higher-order component](https://gist.github.com/sebmarkbage/ef0bf1f338a7182b6775) for React, for cases when you want to render query results to a component.

```jsx
// PostsList.jsx
import { query, withQueries } from 'react-router-query';

function PostsList({ posts }) {
  return (
    <div className="posts">
      {posts.map(post => (
        <div key={post.path} className="post">
          <h1 className="post-title">
            <Link to={post.fullpath}>{post.meta.title}</Link>
          </h1>
          <span className="post-date">{post.meta.date}</span>
        </div>
      ))}
    </div>
  );
}

const queries = {
  posts: query('/posts'),
};

export default withQueries(queries)(PostsList);
```

A `withQuery` component must be rendered inside a `RoutesProvider`, e.g.
```jsx
// app.jsx

import { render } from 'react-dom';
import { Router } from 'react-router';
import PostsList from './PostsList';
// ...

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={PostsList} />
    <Route path="posts">
      <Route path="post1" component={Post1} meta={{ title: 'Post 1', date: '2016-08-19' }} />
      <Route path="post2" component={Post2} meta={{ title: 'Post 2', date: '2016-08-21' }} />
    </Route>
  </Route>
);

render(
  <RoutesProvider routes={routes}>
    <Router history={history}>{routes}</Router>
  </RoutesProvider>,
  document.body
);
```

[react-router]: https://github.com/reactjs/react-router

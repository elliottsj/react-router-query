# react-router-query
An API to query static react-router routes.

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

query({ prefix: '/' }, routes).then((result) => {
  expect(result).toEqual([
    {
      path: '/',
      component: App,
      indexRoute: {
        component: Dashboard,
      },
      childRoutes: [
        { path: 'about', component: About },
        {
          path: 'inbox',
          component: Inbox,
          childRoutes: [],
        },
      ],
    },
  ]);
});
```

```jsx
import { withQueries } from 'react-router-query';

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

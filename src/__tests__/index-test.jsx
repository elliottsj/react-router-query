import React from 'react';
import {
  IndexRoute,
  Redirect,
  Route,
} from 'react-router';
import {
  query,
  withQuery,
} from '..';

function App() {
  return <div>App</div>;
}
function Dashboard() {
  return <div>Dashboard</div>;
}
function About() {
  return <div>About</div>;
}
function Inbox() {
  return <div>Inbox</div>;
}
function Message() {
  return <div>Message</div>;
}

describe('query', () => {
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

  it('resolves with all routes given a prefix "/"', async () => {
    const result = await query({ prefix: '/' }, routes);
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
});

describe('withQuery', () => {
  it('creates a higher-order component', () => {});
});

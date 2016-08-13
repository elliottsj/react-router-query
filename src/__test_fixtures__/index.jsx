// @flow

import React, { Component } from 'react';
import {
  IndexRoute,
  Redirect,
  Route,
} from 'react-router';

export class App extends Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return <div>App</div>;
  }
}
export function Dashboard() {
  return <div>Dashboard</div>;
}
export function About() {
  return <div>About</div>;
}
export function Inbox() {
  return <div>Inbox</div>;
}
export function Message() {
  return <div>Message</div>;
}
export function Messages() {
  return <div>Messages</div>;
}
export function Settings() {
  return <div>Settings</div>;
}

export const routesJsx = (
  <Route path="/" component={App}>
    <IndexRoute component={Dashboard} />
    <Route path="about" component={About} />
    <Route path="inbox" component={Inbox}>
      <IndexRoute component={Messages} />
      <Route path="settings" component={Settings} />
      <Redirect from="messages/:id" to="/messages/:id" />
    </Route>
    <Route component={Inbox}>
      <Route path="messages/:id" component={Message} />
    </Route>
  </Route>
);

export const routesPlain = [
  {
    path: '/',
    component: App,
    indexRoute: {
      component: Dashboard,
    },
    childRoutes: [
      {
        path: 'about',
        component: About,
      },
      {
        path: 'inbox',
        component: Inbox,
        indexRoute: {
          component: Messages,
        },
        childRoutes: [
          {
            path: 'settings',
            component: Settings,
          },
          {
            from: 'messages/:id',
            to: '/messages/:id',
            path: 'messages/:id',
            onEnter(nextState, replace) {
              replace(`/messages/${nextState.params.id}`);
            },
          },
        ],
      },
      {
        component: Inbox,
        childRoutes: [
          {
            path: 'messages/:id',
            component: Message,
          },
        ],
      },
    ],
  }
];

export const asyncGetter =
  (value: any) => (nextState: any, cb: CPSCallback<any>) => setImmediate(() => cb(null, value));

export const routesPlainPartialAsync = {
  path: '/',
  getComponent: asyncGetter(App),
  indexRoute: {
    component: Dashboard,
  },
  getChildRoutes: asyncGetter([
    {
      path: 'about',
      component: About,
    },
    {
      path: 'inbox',
      getComponent: asyncGetter(Inbox),
      getIndexRoute: asyncGetter({
        getComponent: asyncGetter(Messages),
      }),
      childRoutes: [
        {
          path: 'settings',
          getComponent: asyncGetter(Settings),
        },
        {
          from: 'messages/:id',
          to: '/messages/:id',
          path: 'messages/:id',
          onEnter(nextState, replace) {
            replace(`/messages/${nextState.params.id}`);
          },
        },
      ],
    },
    {
      component: Inbox,
      getChildRoutes: asyncGetter([
        {
          path: 'messages/:id',
          getComponent: asyncGetter(Message),
        },
      ]),
    },
  ]),
};

// @flow

import React, { Component, PropTypes } from 'react';
import {
  IndexRoute,
  Redirect,
  Route,
} from 'react-router';

// Use class component since recompose's
// `isReferentiallyTransparentFunctionComponent`
// (https://github.com/acdlite/recompose/blob/faaafb02ecafbad3082a1f8141e4cf0354281c7e/src/packages/recompose/isReferentiallyTransparentFunctionComponent.js)
// eagerly evaluates functional components, preventing us from finding their instances in enzyme's
// wrapper:
// https://github.com/acdlite/recompose/blob/faaafb02ecafbad3082a1f8141e4cf0354281c7e/src/packages/recompose/utils/createEagerElementUtil.js
/* eslint-disable react/no-multi-comp,react/prefer-stateless-function */
export class App extends Component {
  render() {
    return (
      <div>
        <h1>App</h1>
        {this.props.children}
      </div>
    );
  }
}
App.propTypes = {
  children: PropTypes.node,
};
export function Dashboard() {
  return <div>Dashboard</div>;
}
export function About() {
  return <div>About</div>;
}
export function Inbox({ children }) {
  return (
    <div>
      <h1>Inbox</h1>
      {children}
    </div>
  );
}
Inbox.propTypes = {
  children: PropTypes.node,
};
export function Message() {
  return <div>Message</div>;
}
export function Messages() {
  return <div>Messages</div>;
}
export class Settings extends Component {
  render() {
    return <div>Settings</div>;
  }
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

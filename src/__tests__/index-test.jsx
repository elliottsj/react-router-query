// @flow

import {
  shallow,
} from 'enzyme';
import React from 'react';
import {
  createMemoryHistory,
  IndexRoute,
  Redirect,
  Route,
  Router,
} from 'react-router';
import {
  flatten,
  isSynchronous,
  omitUndefinedValues,
  query,
  RoutesProvider,
  synchronize,
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
function Messages() {
  return <div>Messages</div>;
}
function Settings() {
  return <div>Settings</div>;
}

const routesJsx = (
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

const routesPlain = {
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
};

const asyncGetter = (value) => (nextState, cb) => setImmediate(() => cb(null, value));

const routesPlainPartialAsync = {
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

describe('omitUndefinedValues', () => {
  it('omits undefined object values', () => {
    expect(omitUndefinedValues({
      foo: 'bar',
      baz: undefined,
    })).toEqual({
      foo: 'bar',
    });
  });
});

fdescribe('isSynchronous', () => {
  it('returns true if a route is synchronous, given one route', () => {
    const route = {
      path: '/',
      component: App,
    };
    expect(isSynchronous('', route)).toBe(true);
  });

  it('returns false if a route is asynchronous, given one route', () => {
    const route = {
      path: '/',
      getComponent: asyncGetter(App),
    };
    expect(isSynchronous('', route)).toBe(false);
  });

  it('returns true if all routes are synchronous, given many routes', () => {
    const routes = [
      {
        path: '/',
        component: App,
        childRoutes: [
          {
            path: 'about',
            component: About,
          },
        ],
      },
      {
        path: '/settings',
        component: Settings,
      },
    ];
    expect(isSynchronous('', routes)).toBe(true);
  });

  it('returns false if one route is asynchronous, given many routes', () => {
    const routes = [
      {
        path: '/',
        component: App,
        childRoutes: [
          {
            path: 'about',
            getComponent: asyncGetter(About),
          },
        ],
      },
      {
        path: '/settings',
        component: Settings,
      },
    ];
    expect(isSynchronous('', routes)).toBe(false);
  });

  it('checks only routes that match the given prefix', () => {
    const routes = [
      {
        path: '/',
        component: App,
        childRoutes: [
          {
            path: 'about',
            getComponent: asyncGetter(About),
          },
        ],
      },
      {
        path: '/settings',
        component: Settings,
      },
    ];
    expect(isSynchronous('/settings', routes)).toBe(true);
  });
});

describe('synchronize', () => {
  it('synchronizes synchronous JSX routes ', async () => {
    const result = await synchronize('/', routesJsx);
    expect(result).toEqual([
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
                onEnter: jasmine.any(Function),
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
      },
    ]);
  });

  it('synchronizes synchronous plain routes ', async () => {
    const result = await synchronize('/', routesPlain);
    expect(result).toEqual([
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
                onEnter: jasmine.any(Function),
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
      },
    ]);
  });

  it('synchronizes asynchronous plain routes ', async () => {
    const result = await synchronize('/', routesPlainPartialAsync);
    expect(result).toEqual([
      {
        path: '/',
        getComponent: jasmine.any(Function),
        getChildRoutes: jasmine.any(Function),
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
            getComponent: jasmine.any(Function),
            getIndexRoute: jasmine.any(Function),
            component: Inbox,
            indexRoute: {
              getComponent: jasmine.any(Function),
              component: Messages,
            },
            childRoutes: [
              {
                path: 'settings',
                getComponent: jasmine.any(Function),
                component: Settings,
              },
              {
                from: 'messages/:id',
                to: '/messages/:id',
                path: 'messages/:id',
                onEnter: jasmine.any(Function),
              },
            ],
          },
          {
            component: Inbox,
            getChildRoutes: jasmine.any(Function),
            childRoutes: [
              {
                path: 'messages/:id',
                getComponent: jasmine.any(Function),
                component: Message,
              },
            ],
          },
        ],
      },
    ]);
  });

  it('synchronizes and includes only routes that match the given prefix', async () => {
    const result = await synchronize('/inbox', routesPlainPartialAsync);
    expect(result).toEqual([
      {
        path: '/',
        getComponent: jasmine.any(Function),
        getChildRoutes: jasmine.any(Function),
        component: App,
        indexRoute: {
          component: Dashboard,
        },
        childRoutes: [
          {
            path: 'inbox',
            getComponent: jasmine.any(Function),
            getIndexRoute: jasmine.any(Function),
            component: Inbox,
            indexRoute: {
              getComponent: jasmine.any(Function),
              component: Messages,
            },
            childRoutes: [
              {
                path: 'settings',
                getComponent: jasmine.any(Function),
                component: Settings,
              },
              {
                from: 'messages/:id',
                to: '/messages/:id',
                path: 'messages/:id',
                onEnter: jasmine.any(Function),
              },
            ],
          },
        ],
      },
    ]);
  });
});

describe('flatten', () => {
  it('flattens routes', async () => {
    const result = flatten(await synchronize('/', routesPlain));
    expect(result).toEqual([
      {
        fullPath: '/',
        component: Dashboard,
        parents: [jasmine.objectContaining({ component: App })],
      },
      {
        path: 'about',
        fullPath: '/about',
        component: About,
        parents: [jasmine.objectContaining({ component: App })],
      },
      {
        fullPath: '/inbox',
        component: Messages,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'settings',
        fullPath: '/inbox/settings',
        component: Settings,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        from: 'messages/:id',
        to: '/messages/:id',
        path: 'messages/:id',
        fullPath: '/inbox/messages/:id',
        onEnter: jasmine.any(Function),
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'messages/:id',
        fullPath: '/messages/:id',
        component: Message,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
    ]);
  });
});

describe('query', () => {
  it('synchronizes and flattens all routes which begin with the given prefix', async () => {
    const result = await query('', routesPlainPartialAsync);
    expect(result).toEqual([
      {
        fullPath: '/',
        component: Dashboard,
        parents: [jasmine.objectContaining({ component: App })],
      },
      {
        path: 'about',
        fullPath: '/about',
        component: About,
        parents: [jasmine.objectContaining({ component: App })],
      },
      {
        fullPath: '/inbox',
        getComponent: jasmine.any(Function),
        component: Messages,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'settings',
        fullPath: '/inbox/settings',
        getComponent: jasmine.any(Function),
        component: Settings,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        from: 'messages/:id',
        to: '/messages/:id',
        path: 'messages/:id',
        fullPath: '/inbox/messages/:id',
        onEnter: jasmine.any(Function),
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'messages/:id',
        fullPath: '/messages/:id',
        getComponent: jasmine.any(Function),
        component: Message,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
    ]);
  });

  it('synchronizes and flattens routes which begin with the given prefix', async () => {
    const result = await query('/inbox', routesPlainPartialAsync);
    expect(result).toEqual([
      {
        fullPath: '/inbox',
        getComponent: jasmine.any(Function),
        component: Messages,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'settings',
        fullPath: '/inbox/settings',
        getComponent: jasmine.any(Function),
        component: Settings,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        from: 'messages/:id',
        to: '/messages/:id',
        path: 'messages/:id',
        fullPath: '/inbox/messages/:id',
        onEnter: jasmine.any(Function),
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
    ]);
  });
});

xdescribe('withQuery', () => {
  it('creates a higher-order component, with props corresponding to queries', () => {
    const AppWithQuery = withQuery({
      pages: query('/'),
    })(App);

    const routes = (
      <Route path="/" component={AppWithQuery}>
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

    function Root() {
      return (
        <RoutesProvider routes={routes}>
          <Router history={createMemoryHistory()}>{routes}</Router>
        </RoutesProvider>
      );
    }

    const wrapper = shallow(<Root />);
    expect(wrapper.some(AppWithQuery)).toBe(true);
    const app = wrapper.find(AppWithQuery);
    // TODO: assert props
  });
});

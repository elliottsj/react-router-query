// @flow

import delay from 'delay';
import {
  mount,
} from 'enzyme';
import React from 'react';
import {
  createMemoryHistory,
  Router,
} from 'react-router';
import {
  query,
  RoutesProvider,
  withQuery,
} from '..';

import {
  App,
  Dashboard,
  About,
  Inbox,
  Message,
  Messages,
  Settings,
  asyncGetter,
  routesPlain,
  routesPlainPartialAsync,
} from '../__test_fixtures__';

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

  it('flattens routes synchronously if given routes are already synchronous', () => {
    const result = query('', routesPlain);
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

describe('withQuery', () => {
  it('creates a higher-order component, with props corresponding to queries', async () => {
    // $FlowFixMe: wait for Jest 15.x flow-typed definitions
    jest.useRealTimers();

    const queries = {
      pages: query('/'),
      inbox: query('/inbox'),
    };
    const AppWithQuery = withQuery(queries)(App);

    const routes = {
      path: '/',
      component: AppWithQuery,
      indexRoute: {
        component: Dashboard,
      },
      childRoutes: [
        {
          path: 'about',
          getComponent: asyncGetter(About),
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

    function Root() {
      return (
        <RoutesProvider routes={routes}>
          <Router history={createMemoryHistory()}>{routes}</Router>
        </RoutesProvider>
      );
    }

    const wrapper = mount(<Root />);
    const app = wrapper.find(App);
    expect(app.length).toBe(1);
    expect(app.prop('__routes')).toEqual([
      {
        path: '/',
        component: AppWithQuery,
        indexRoute: {
          component: Dashboard,
        },
        childRoutes: [
          {
            path: 'about',
            getComponent: jasmine.any(Function),
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
                path: 'messages/:id',
                from: 'messages/:id',
                to: '/messages/:id',
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
    expect(app.prop('queries')).toBe(queries);
    expect(app.prop('pages')).toBeUndefined();
    expect(app.prop('inbox')).toEqual([
      {
        component: Messages,
        fullPath: '/inbox',
        parents: [
          jasmine.objectContaining({ component: AppWithQuery }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'settings',
        component: Settings,
        fullPath: '/inbox/settings',
        parents: [
          jasmine.objectContaining({ component: AppWithQuery }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        from: 'messages/:id',
        to: '/messages/:id',
        path: 'messages/:id',
        onEnter: jasmine.any(Function),
        fullPath: '/inbox/messages/:id',
        parents: [
          jasmine.objectContaining({ component: AppWithQuery }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
    ]);

    await delay(100);

    expect(app.prop('pages')).toEqual([
      {
        fullPath: '/',
        component: Dashboard,
        parents: [jasmine.objectContaining({ component: AppWithQuery })],
      },
      {
        path: 'about',
        fullPath: '/about',
        component: About,
        getComponent: jasmine.any(Function),
        parents: [jasmine.objectContaining({ component: AppWithQuery })],
      },
      {
        fullPath: '/inbox',
        component: Messages,
        parents: [
          jasmine.objectContaining({ component: AppWithQuery }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'settings',
        fullPath: '/inbox/settings',
        component: Settings,
        parents: [
          jasmine.objectContaining({ component: AppWithQuery }),
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
          jasmine.objectContaining({ component: AppWithQuery }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'messages/:id',
        fullPath: '/messages/:id',
        component: Message,
        parents: [
          jasmine.objectContaining({ component: AppWithQuery }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
    ]);
  });
});

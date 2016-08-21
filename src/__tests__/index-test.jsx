// @flow

import delay from 'delay';
import {
  mount,
} from 'enzyme';
import memoize from 'memoize-id';
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
} from '../__test_fixtures__';

describe('withQuery', () => {
  let app;
  let AppWithQuery;
  let appQueries;
  let history;
  let Root;
  let settingsQueries;
  let SettingsWithQuery;
  let wrapper;

  beforeEach(() => {
    jest.useRealTimers();

    appQueries = {
      // Async
      pages: query('/'),
      // Sync
      inbox: query('/inbox'),
    };
    AppWithQuery = withQuery(appQueries)(App);
    settingsQueries = {
      pages: query('/'),
    };
    SettingsWithQuery = withQuery(settingsQueries)(Settings);

    const routes = {
      path: '/',
      component: AppWithQuery,
      indexRoute: {
        component: Dashboard,
      },
      childRoutes: [
        {
          path: 'about',
          // Memoize this component getter to resolve subsequent queries synchronously
          getComponent: memoize(asyncGetter(About), { async: 'immediate' }),
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
              component: SettingsWithQuery,
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

    history = createMemoryHistory('/');
    Root = () => (
      <RoutesProvider routes={routes}>
        <Router history={history}>{routes}</Router>
      </RoutesProvider>
    );

    wrapper = mount(<Root />);
  });

  it('creates a higher-order component, with props corresponding to queries', async () => {
    app = wrapper.find(App);
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
                component: SettingsWithQuery,
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
    expect(app.prop('queries')).toBe(appQueries);
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
        component: SettingsWithQuery,
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

    // Wait for async routes to resolve
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
        component: SettingsWithQuery,
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

  it('resolves subsequent identical async queries synchronously', async () => {
    app = wrapper.find(App);
    expect(app.length).toBe(1);
    expect(app.prop('pages')).toBeUndefined();

    // Wait for async routes to resolve
    await delay(100);

    const expectedPages = [
      {
        fullPath: '/',
        component: Dashboard,
        parents: [jasmine.objectContaining({ component: AppWithQuery })],
      },
      {
        path: 'about',
        fullPath: '/about',
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
        component: SettingsWithQuery,
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
    ];

    // AppWithQuery should have resolved 'pages' query
    expect(app.prop('pages')).toEqual(expectedPages);

    // Synchronously navigate to '/inbox/settings';
    // identical 'pages' query should be resolved immediately
    history.push('/inbox/settings');

    const settings = wrapper.find(Settings);
    expect(settings.prop('pages')).toEqual(expectedPages);
  });
});

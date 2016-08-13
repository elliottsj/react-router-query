// @flow

import {
  isSynchronous,
  synchronize,
} from '../synchronize';

import {
  App,
  Dashboard,
  About,
  Inbox,
  Message,
  Messages,
  Settings,
  asyncGetter,
  routesJsx,
  routesPlain,
  routesPlainPartialAsync,
} from '../__test_fixtures__';

describe('isSynchronous', () => {
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

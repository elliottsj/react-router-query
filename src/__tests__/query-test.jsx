// @flow

import query from '../query';

import {
  App,
  Dashboard,
  About,
  Inbox,
  Message,
  Messages,
  Settings,
  routesPlain,
  routesPlainPartialAsync,
} from '../__test_fixtures__';

describe('query', () => {
  it('flattens routes synchronously if given routes are already synchronous', () => {
    let done = false;
    query('', routesPlain, (error, result) => {
      expect(error).toBe(null);
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
      done = true;
    });
    expect(done).toBe(true);
  });

  it('synchronizes and flattens all routes, given an empty prefix', () => new Promise((resolve) => {
    let done = false;
    query('', routesPlainPartialAsync, (error, result) => {
      expect(error).toBe(null);
      expect(result).toEqual([
        {
          fullPath: '/',
          component: Dashboard,
          parents: [jasmine.objectContaining({ path: '/' })],
        },
        {
          path: 'about',
          fullPath: '/about',
          component: About,
          parents: [jasmine.objectContaining({ path: '/' })],
        },
        {
          fullPath: '/inbox',
          getComponent: jasmine.any(Function),
          parents: [
            jasmine.objectContaining({ path: '/' }),
            jasmine.objectContaining({ path: 'inbox' }),
          ],
        },
        {
          path: 'settings',
          fullPath: '/inbox/settings',
          getComponent: jasmine.any(Function),
          parents: [
            jasmine.objectContaining({ path: '/' }),
            jasmine.objectContaining({ path: 'inbox' }),
          ],
        },
        {
          from: 'messages/:id',
          to: '/messages/:id',
          path: 'messages/:id',
          fullPath: '/inbox/messages/:id',
          onEnter: jasmine.any(Function),
          parents: [
            jasmine.objectContaining({ path: '/' }),
            jasmine.objectContaining({ path: 'inbox' }),
          ],
        },
        {
          path: 'messages/:id',
          fullPath: '/messages/:id',
          getComponent: jasmine.any(Function),
          parents: [
            jasmine.objectContaining({ path: '/' }),
            jasmine.objectContaining({ component: Inbox }),
          ],
        },
      ]);
      done = true;
      resolve();
    });
    expect(done).toBe(false);
  }));

  it(
    'synchronizes and flattens only routes which begin with the given prefix',
    () => new Promise((resolve) => {
      let done = false;
      query('/inbox', routesPlainPartialAsync, (error, result) => {
        expect(error).toBe(null);
        expect(result).toEqual([
          {
            fullPath: '/inbox',
            getComponent: jasmine.any(Function),
            parents: [
              jasmine.objectContaining({ path: '/' }),
              jasmine.objectContaining({ path: 'inbox' }),
            ],
          },
          {
            path: 'settings',
            fullPath: '/inbox/settings',
            getComponent: jasmine.any(Function),
            parents: [
              jasmine.objectContaining({ path: '/' }),
              jasmine.objectContaining({ path: 'inbox' }),
            ],
          },
          {
            from: 'messages/:id',
            to: '/messages/:id',
            path: 'messages/:id',
            fullPath: '/inbox/messages/:id',
            onEnter: jasmine.any(Function),
            parents: [
              jasmine.objectContaining({ path: '/' }),
              jasmine.objectContaining({ path: 'inbox' }),
            ],
          },
        ]);
        done = true;
        resolve();
      });
      expect(done).toBe(false);
    }),
  );
});

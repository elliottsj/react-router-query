// @flow

import { mount } from 'enzyme';
import memoize from 'memoize-id';
import React from 'react';
import { createMemoryHistory, match, Router } from 'react-router';
import {
  query,
  RoutesProvider,
  withQuery,
} from '..';
import resolveComponentsQueries from '../resolveComponentsQueries';

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

describe('resolveComponentsQueries', () => {
  it('resolves queries for an array of components', () => new Promise((resolve) => {
    const appQueries = {
      // Async
      pages: query('/'),
      // Sync
      inbox: query('/inbox'),
    };
    const AppWithQuery = withQuery(appQueries)(App);
    const settingsQueries = {
      pages: query('/'),
    };
    const SettingsWithQuery = withQuery(settingsQueries)(Settings);

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

    match({ routes, location: '/inbox/settings' }, (error, redirectLocation, renderProps) => {
      resolveComponentsQueries(renderProps.components, routes, (err) => {
        expect(err).toBe(null);
        const history = createMemoryHistory('/inbox/settings');
        const wrapper = mount(
          <RoutesProvider routes={routes}>
            <Router history={history}>{routes}</Router>
          </RoutesProvider>
        );
        const app = wrapper.find(App);
        expect(app.prop('queries')).toBe(appQueries);
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
        const settings = wrapper.find(Settings);
        expect(settings.prop('queries')).toBe(settingsQueries);
        expect(settings.prop('pages')).toEqual([
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
        resolve();
      });
    });
  }));
});

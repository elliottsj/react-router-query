// @flow

import synchronize, {
  isSync,
  syncAsyncify,
  synchronizeCPSFunction,
  synchronizeRoute,
} from '../synchronize';

import {
  App,
  Dashboard,
  About,
  Inbox,
  Message,
  Messages,
  Settings,
  routesJsx,
  routesPlain,
  routesPlainPartialAsync,
} from '../__test_fixtures__';

describe('syncAsyncify', () => {
  it('sets the `isSync` symbol on the returned function', () => {
    const fn = syncAsyncify((x, y) => x + y);
    expect(fn[isSync]).toBe(true);
  });

  it('returns a CPS function which resolves synchronously', () => {
    let done = false;
    const fn = syncAsyncify((x, y) => x + y);
    fn(1, 2, (error, result) => {
      expect(error).toBe(null);
      expect(result).toBe(3);
      done = true;
    });
    expect(done).toBe(true);
  });
});

describe('synchronizeCPSFunction', () => {
  it(
    'creates a CPS function which resolves with the memoized result of the given CPS function',
    () => new Promise((resolve) => {
      let done = false;
      function fn(cb) {
        setImmediate(() => cb(null, 'hello'));
      }
      synchronizeCPSFunction(fn)((error1, syncFn) => {
        expect(error1).toBe(null);
        expect(syncFn).toEqual(jasmine.any(Function));
        let sync = false;
        syncFn((error2, result) => {
          expect(error2).toBe(null);
          expect(result).toBe('hello');
          sync = true;
        });
        expect(sync).toBe(true);
        done = true;
        resolve();
      });
      expect(done).toBe(false);
    })
  );
});

describe('synchronizeRoute', () => {
  it(
    'synchronously resolves with a shallowly-equal route if the given route has no async getters',
    () => {
      let done = false;
      const route = {
        path: '/',
        component: App,
      };
      synchronizeRoute(
        '',
        '',
        route,
        (error: ?Error, syncRoute: SyncRoute) => {
          expect(syncRoute).toEqual({
            path: '/',
            component: App,
          });
          done = true;
        }
      );
      expect(done).toBe(true);
    },
  );

  it(
    'synchronously resolves with an equivalent route if the given route\'s async getters' +
    'resolve synchronously',
    () => {
      let done = false;
      const route = {
        path: '/',
        getComponent(nextState, cb) {
          cb(null, App);
        },
      };
      synchronizeRoute(
        '',
        '',
        route,
        (error0: ?Error, syncRoute: SyncRoute) => {
          expect(error0).toBe(null);
          expect(syncRoute).toEqual({
            path: '/',
            getComponent: jasmine.any(Function),
          });
          syncRoute.getComponent(null, (error1, component) => {
            expect(error1).toBe(null);
            expect(component).toBe(App);
            done = true;
          });
        }
      );
      expect(done).toBe(true);
    },
  );

  it(
    'asynchronously resolves with a synchronous route if the given route\'s async getters' +
    'resolve asynchronously',
    () => new Promise((resolve) => {
      let done = false;
      const route = {
        path: '/',
        getComponent(nextState, cb) {
          setImmediate(() => cb(null, App));
        },
      };
      synchronizeRoute(
        '',
        '',
        route,
        (error0: ?Error, syncRoute: SyncRoute) => {
          expect(error0).toBe(null);
          expect(syncRoute).toEqual({
            path: '/',
            getComponent: jasmine.any(Function),
          });
          let sync = false;
          syncRoute.getComponent(null, (error1, component) => {
            expect(error1).toBe(null);
            expect(component).toBe(App);
            sync = true;
          });
          expect(sync).toBe(true);
          done = true;
          resolve();
        }
      );
      expect(done).toBe(false);
    }),
  );

  it('works with `getIndexRoute`', () => new Promise((resolve) => {
    let done = false;
    const route = {
      path: '/',
      component: App,
      getIndexRoute(partialNextState, cb) {
        cb(null, {
          component: Dashboard,
        });
      },
    };
    synchronizeRoute(
      '',
      '',
      route,
      (error0: ?Error, syncRoute: SyncRoute) => {
        expect(error0).toBe(null);
        expect(syncRoute).toEqual({
          path: '/',
          component: App,
          getIndexRoute: jasmine.any(Function),
        });
        let sync = false;
        syncRoute.getIndexRoute(null, (error1, indexRoute) => {
          expect(error1).toBe(null);
          expect(indexRoute).toEqual({
            component: Dashboard,
          });
          sync = true;
        });
        expect(sync).toBe(true);
        done = true;
        resolve();
      }
    );
    expect(done).toBe(false);
  }));

  it('works with `getChildRoutes`', () => new Promise((resolve) => {
    let done = false;
    const route = {
      path: '/',
      component: App,
      getChildRoutes(partialNextState, cb) {
        cb(null, [
          {
            component: About,
          },
          {
            component: Inbox,
          },
        ]);
      },
    };
    synchronizeRoute(
      '',
      '',
      route,
      (error0: ?Error, syncRoute: SyncRoute) => {
        expect(error0).toBe(null);
        expect(syncRoute).toEqual({
          path: '/',
          component: App,
          getChildRoutes: jasmine.any(Function),
        });
        let sync = false;
        syncRoute.getChildRoutes(null, (error1, childRoutes) => {
          expect(error1).toBe(null);
          expect(childRoutes).toEqual([
            {
              component: About,
            },
            {
              component: Inbox,
            },
          ]);
          sync = true;
        });
        expect(sync).toBe(true);
        done = true;
        resolve();
      }
    );
    expect(done).toBe(false);
  }));
});

describe('synchronize', () => {
  it('synchronizes synchronous JSX routes ', () => {
    let done = false;
    synchronize('/', routesJsx, (error, result) => {
      expect(error).toBe(null);
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
      done = true;
    });
    expect(done).toBe(true);
  });

  it('synchronizes synchronous plain routes ', () => {
    let done = false;
    synchronize('/', routesPlain, (error, result) => {
      expect(error).toBe(null);
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
      done = true;
    });
    expect(done).toBe(true);
  });

  it('synchronizes asynchronous plain routes ', () => new Promise((resolve) => {
    let done = false;
    synchronize('/', routesPlainPartialAsync, (error0, result) => {
      expect(error0).toBe(null);
      expect(result).toEqual([
        {
          path: '/',
          getComponent: jasmine.any(Function),
          getChildRoutes: jasmine.any(Function),
          indexRoute: {
            getComponent: jasmine.any(Function),
          },
        },
      ]);
      let sync = 0;
      result[0].getComponent(null, (error1, component) => {
        sync += 1;
        expect(error1).toBe(null);
        expect(component).toBe(App);
      });
      result[0].indexRoute.getComponent(null, (error1, component) => {
        sync += 1;
        expect(error1).toBe(null);
        expect(component).toBe(Dashboard);
      });
      result[0].getChildRoutes(null, (error1, childRoutes0) => {
        sync += 1;
        expect(error1).toBe(null);
        expect(childRoutes0).toEqual([
          {
            path: 'about',
            component: About,
          },
          {
            path: 'inbox',
            getComponent: jasmine.any(Function),
            getIndexRoute: jasmine.any(Function),
            childRoutes: [
              {
                path: 'settings',
                getComponent: jasmine.any(Function),
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
          },
        ]);
        childRoutes0[1].getComponent(null, (error2, component) => {
          sync += 1;
          expect(error2).toBe(null);
          expect(component).toBe(Inbox);
        });
        childRoutes0[1].getIndexRoute(null, (error2, indexRoute) => {
          sync += 1;
          expect(error2).toBe(null);
          expect(indexRoute).toEqual({
            getComponent: jasmine.any(Function),
          });
          indexRoute.getComponent(null, (error3, component) => {
            sync += 1;
            expect(error3).toBe(null);
            expect(component).toBe(Messages);
          });
        });
        childRoutes0[1].childRoutes[0].getComponent(null, (error2, component) => {
          sync += 1;
          expect(error2).toBe(null);
          expect(component).toBe(Settings);
        });
        childRoutes0[2].getChildRoutes(null, (error2, childRoutes1) => {
          sync += 1;
          expect(error2).toBe(null);
          expect(childRoutes1).toEqual([
            {
              path: 'messages/:id',
              getComponent: jasmine.any(Function),
            },
          ]);
          childRoutes1[0].getComponent(null, (error, component) => {
            sync += 1;
            expect(error).toBe(null);
            expect(component).toBe(Message);
          });
        });
      });
      done = true;
      expect(sync).toBe(9);
      resolve();
    });
    expect(done).toBe(false);
  }));

  it(
    'synchronizes and includes only routes that match the given prefix',
    () => new Promise((resolve) => {
      let done = false;
      synchronize('/inbox', routesPlainPartialAsync, (error0, result) => {
        expect(error0).toBe(null);
        expect(result).toEqual([
          {
            path: '/',
            getComponent: jasmine.any(Function),
            getChildRoutes: jasmine.any(Function),
            indexRoute: {
              getComponent: jasmine.any(Function),
            },
          },
        ]);
        let sync = 0;
        result[0].getComponent(null, (error1, component) => {
          sync += 1;
          expect(error1).toBe(null);
          expect(component).toBe(App);
        });
        result[0].indexRoute.getComponent(null, (error1, component) => {
          sync += 1;
          expect(error1).toBe(null);
          expect(component).toBe(Dashboard);
        });
        result[0].getChildRoutes(null, (error1, childRoutes) => {
          sync += 1;
          expect(error1).toBe(null);
          expect(childRoutes).toEqual([
            {
              path: 'inbox',
              getComponent: jasmine.any(Function),
              getIndexRoute: jasmine.any(Function),
              childRoutes: [
                {
                  path: 'settings',
                  getComponent: jasmine.any(Function),
                  // component: Settings,
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
            },
          ]);
          childRoutes[0].getComponent(null, (error2, component) => {
            sync += 1;
            expect(error2).toBe(null);
            expect(component).toBe(Inbox);
          });
          childRoutes[0].getIndexRoute(null, (error2, indexRoute) => {
            sync += 1;
            expect(error2).toBe(null);
            expect(indexRoute).toEqual({
              getComponent: jasmine.any(Function),
            });
            indexRoute.getComponent(null, (error3, component) => {
              sync += 1;
              expect(error3).toBe(null);
              expect(component).toBe(Messages);
            });
          });
          childRoutes[0].childRoutes[0].getComponent(null, (error, component) => {
            sync += 1;
            expect(error).toBe(null);
            expect(component).toBe(Settings);
          });
          childRoutes[1].getChildRoutes(null, (error, childRoutes1) => {
            sync += 1;
            expect(error).toBe(null);
            expect(childRoutes1).toEqual([]);
          });
        });
        done = true;
        expect(sync).toBe(8);
        resolve();
      });
      expect(done).toBe(false);
    }),
  );
});

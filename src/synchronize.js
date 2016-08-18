// @flow

import asyncify from 'async/asyncify';
import map from 'async/map';
import parallel from 'async/parallel';
import seq from 'async/seq';
import {
  createRoutes,
} from 'react-router';

export const isSync =
  Symbol('A boolean value indicating if a CPS function will resolve synchronously');

/**
 * Take a sync function and make it async, passing its return value to a callback.
 */
export function syncAsyncify(fn: Function) {
  const asyncFn = asyncify(fn);
  asyncFn[isSync] = true;
  return asyncFn;
}

/**
 * Return true iff the given route path matches the given path prefix.
 * A path matches a prefix if either the prefix begins with the path,
 * or the path begins with the prefix.$
 *
 * @example
 *   matchesPrefix('/', '/inbox')      // true
 *   matchesPrefix('/inbox', '/')      // true
 *   matchesPrefix('/about', '/inbox') // false
 */
function matchesPrefix(prefix: string, routePath: string): boolean {
  return prefix.startsWith(routePath) || routePath.startsWith(prefix);
}

/**
 * Join two '/'-delimited paths, removing duplicate '/'s at the point of joining.
 *
 * @example
 *   joinPaths('/', 'inbox')              // '/inbox'
 *   joinPaths('/', '/inbox')             // '/inbox'
 *   joinPaths('inbox', 'messages')       // 'inbox/messages'
 *   joinPaths('/inbox/messages/', '/1/') // '/inbox/messages/1/'
 */
function joinPaths(path1: string, path2: string = ''): string {
  return `${path1.replace(/\/$/, '')}/${path2.replace(/^\//, '')}`;
}

/**
 * Immediately call `fn()` and resolve with a CPS function which resolves synchronously with the
 * original resolved value of `fn()`.
 */
type SynchronizeCPSFunctionType<T> =
  (fn: CPSFunction0<T>) => (cb: CPSCallback<CPSFunction0<T>>) => void;
export const synchronizeCPSFunction: SynchronizeCPSFunctionType<*> =
  (fn) => seq(fn, syncAsyncify(result => syncAsyncify(() => result)));

export function synchronizeRoute(
  filterPrefix: string,
  pathPrefix: string,
  route: PlainRoute,
  cb: CPSCallback<SyncRoute>
) {
  parallel({
    ...(route.getComponent ? {
      getComponent: synchronizeCPSFunction(route.getComponent.bind(null, /* nextState: */ null)),
    } : {}),
    ...(route.getComponents ? {
      getComponents: synchronizeCPSFunction(route.getComponents.bind(null, /* nextState: */ null)),
    } : {}),
    ...(route.getIndexRoute ? {
      getIndexRoute: synchronizeCPSFunction(seq(
        route.getIndexRoute.bind(null, /* partialNextState */ null),
        synchronizeRoute.bind(
          null,
          filterPrefix,
          joinPaths(pathPrefix, route.path),
          /* route from `route.getIndexRoute` */
          /* cb from `seq` */
        ),
      )),
    } : {}),
    ...(route.getChildRoutes ? {
      getChildRoutes: synchronizeCPSFunction(seq(
        route.getChildRoutes.bind(null, /* partialNextState */ null),
        synchronizeRoutes.bind(
          null,
          filterPrefix,
          joinPaths(pathPrefix, route.path),
          /* childRoutes from `route.getChildRoutes` */
          /* cb from `seq` */
        ),
      )),
    } : {}),
  }, (error: ?Error, {
    getComponent,
    getComponents,
    getIndexRoute,
    getChildRoutes,
  }) => {
    if (error) {
      cb(error);
    }
    cb(null, {
      ...route,
      ...(getComponent ? { getComponent } : {}),
      ...(getComponents ? { getComponents } : {}),
      ...(getIndexRoute ? { getIndexRoute } : {}),
      ...(getChildRoutes ? { getChildRoutes } : {}),
    });
  });
}

function synchronizeRoutes(
  filterPrefix: string,
  pathPrefix: string,
  routes: PlainRoute[],
  cb: CPSCallback<SyncRoute[]>,
) {
  const matchedRoutes = routes.filter(
    (route) => matchesPrefix(filterPrefix, joinPaths(pathPrefix, route.path))
  );
  map(matchedRoutes, synchronizeRoute.bind(null, filterPrefix, pathPrefix), cb);
}

export default function synchronize(
  prefix: string,
  routes: PlainRoute | PlainRoute[],
  cb: CPSCallback<SyncRoute[]>,
) {
  const plainRoutes: PlainRoute[] = createRoutes(routes);
  synchronizeRoutes(
    prefix,
    '',
    plainRoutes,
    cb,
  );
}

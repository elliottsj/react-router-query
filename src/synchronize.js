// @flow

import asyncify from 'async/asyncify';
import map from 'async/map';
import parallel from 'async/parallel';
import seq from 'async/seq';
import every from 'lodash/fp/every';
import {
  createRoutes,
} from 'react-router';

export { default as RoutesProvider } from './components/RoutesProvider';
export { default as withQuery } from './components/withQuery';

export const isEmptyArray = (array: any[]) => Array.isArray(array) && array.length === 0;

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
 * resolved value of `fn()`.
 */
type SynchronizeCPSFunctionType<T> =
  (fn: CPSFunction0<T>) => (cb: CPSCallback<CPSFunction0<T>>) => void;
export const synchronizeCPSFunction: SynchronizeCPSFunctionType<*> =
  (fn) => seq(fn, asyncify(result => asyncify(() => result)));

export function synchronizeRoute(
  filterPrefix: string,
  pathPrefix: string,
  route: ?PlainRoute,
  cb: CPSCallback<SyncRoute>
) {
  if (!route) {
    return undefined;
  }
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
        ),
      )),
    } : {}),
    ...(route.getChildRoutes ? {
      getChildRoutes: synchronizeCPSFunction(seq(
        route.getChildRoutes.bind(null, /* partialNextState */ null),
        (childRoutes, cb) => {
          debugger;
          synchronizeRoutes.call(
            null,
            filterPrefix,
            joinPaths(pathPrefix, route.path),
            childRoutes,
            cb,
            /* childRoutes from `route.getChildRoutes` */
            /* cb from `seq` */
          );
        },
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

function synchronize(
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

export default synchronize;

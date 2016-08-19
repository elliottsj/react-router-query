// @flow

import map from 'async/map';
import parallel from 'async/parallel';
import seq from 'async/seq';
import {
  createRoutes,
} from 'react-router';

import { callAndMemoize } from './utils/cps';
import joinPaths from './utils/joinPaths';

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

export function synchronizeRoute(
  filterPrefix: string,
  pathPrefix: string,
  route: PlainRoute,
  cb: CPSCallback<SyncRoute>
) {
  parallel({
    ...(route.getComponent ? {
      getComponent: callAndMemoize(route.getComponent.bind(null, /* nextState: */ null)),
    } : {}),
    ...(route.getComponents ? {
      getComponents: callAndMemoize(route.getComponents.bind(null, /* nextState: */ null)),
    } : {}),
    ...(route.getIndexRoute ? {
      getIndexRoute: callAndMemoize(seq(
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
      getChildRoutes: callAndMemoize(seq(
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
    ...(route.indexRoute ? {
      indexRoute: synchronizeRoute.bind(
        null,
        filterPrefix,
        joinPaths(pathPrefix, route.path),
        route.indexRoute,
      ),
    } : {}),
    ...(route.childRoutes ? {
      childRoutes: synchronizeRoutes.bind(
        null,
        filterPrefix,
        joinPaths(pathPrefix, route.path),
        route.childRoutes,
      ),
    } : {}),
  }, (error: ?Error, {
    getComponent,
    getComponents,
    getIndexRoute,
    getChildRoutes,
    childRoutes,
    indexRoute,
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
      ...(childRoutes && childRoutes.length !== 0 ? { childRoutes } : {}),
      ...(indexRoute ? { indexRoute } : {}),
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
  map(matchedRoutes, synchronizeRoute.bind(null, filterPrefix, pathPrefix), (err, res) => {
    cb(err, res);
  });
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

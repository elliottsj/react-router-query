// @flow

import flatMap from 'lodash/fp/flatMap';
import { syncify } from './utils/cps';
import joinPaths from './utils/joinPaths';

function getIndexRoute(route) {
  return (
    route.indexRoute ||
    (route.getIndexRoute && syncify(route.getIndexRoute, null))
  );
}

function getChildRoutes(route) {
  return (
    route.childRoutes ||
    (route.getChildRoutes && syncify(route.getChildRoutes, null))
  );
}

export function flattenRoute(parents: SyncRoute[], route: SyncRoute): FlatRoute[] {
  const flattenRouteWithParents = flattenRoute.bind(null, [...parents, route]);
  let flatRoutes = [];
  const indexRoute = getIndexRoute(route);
  if (indexRoute) {
    // Recurse on the index route
    flatRoutes = [...flatRoutes, ...flattenRouteWithParents(indexRoute)];
  }
  const childRoutes = getChildRoutes(route);
  if (childRoutes) {
    // Recurse on the child routes
    flatRoutes = [...flatRoutes, ...flatMap(flattenRouteWithParents, childRoutes)];
  }
  if (!indexRoute && (!childRoutes || childRoutes.length === 0)) {
    // This is a leaf route; add it to the list of flat routes
    flatRoutes = [...flatRoutes, {
      ...route,
      fullPath: [...parents.map(p => p.path), route.path].reduce(joinPaths, ''),
      parents,
    }];
  }
  return flatRoutes;
}

/**
 * Flatten synchronous routes into an array of `FlatRoute`s
 */
const flatten: (routes: SyncRoute[]) => FlatRoute[] =
  flatMap(route => flattenRoute([], route));

export default flatten;

// @flow

import compact from 'lodash/fp/compact';
import compose from 'lodash/fp/compose';
import flatMap from 'lodash/fp/flatMap';
import map from 'lodash/fp/map';
import { isSync } from './synchronize';

export const compactMap = compose(compact, map);

function normalizePath(p: string) {
  return p.replace(/\/\//g, '/');
}

export function flattenRoute(parents: ?Array<SyncRoute>, route: SyncRoute): FlatRoute[] {
  const newParents = [...parents, route];
  let flatRoutes = [];
  if (route.indexRoute) {
    flatRoutes = [...flatRoutes, ...flattenRoute(newParents, route.indexRoute)];
  } else if (route.getIndexRoute && route.getIndexRoute[isSync]) {
    route.getIndexRoute(null, (error, indexRoute) => {
      flatRoutes = [...flatRoutes, ...flattenRoute(newParents, indexRoute)];
    });
  }
  let childRoutesEmpty = true;
  if (route.childRoutes) {
    childRoutesEmpty = route.childRoutes.length === 0;
    flatRoutes = [...flatRoutes, ...flatMap(childRoute => flattenRoute(newParents, childRoute), route.childRoutes)];
  } else if (route.getChildRoutes && route.getChildRoutes[isSync]) {
    route.getChildRoutes(null, (error, childRoutes) => {
      childRoutesEmpty = childRoutes.length === 0;
      flatRoutes = [...flatRoutes, ...flatMap(childRoute => flattenRoute(newParents, childRoute), childRoutes)];
    });
  }
  if (
    !route.indexRoute &&
    !(route.getIndexRoute && route.getIndexRoute[isSync]) &&
    (
      (
        !route.childRoutes &&
        !(route.getChildRoutes && route.getChildRoutes[isSync])
      ) ||
      childRoutesEmpty
    )
  ) {
    // This is a leaf route; add it to the list of flat routes
    const newPath = normalizePath(`${compactMap(parent => parent.path, parents).join('/')}${route.path ? `/${route.path}` : ''}`);
    flatRoutes = [...flatRoutes, {
      ...route,
      fullPath: newPath,
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

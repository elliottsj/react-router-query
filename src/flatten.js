import compact from 'lodash/fp/compact';
import compose from 'lodash/fp/compose';
import flatMap from 'lodash/fp/flatMap';
import map from 'lodash/fp/map';

export const compactMap = compose(compact, map);

function normalizePath(p: string) {
  return p.replace(/\/\//g, '/');
}

export function flattenRoute(parents: ?Array<SyncRoute>, route: SyncRoute): FlatRoute[] {
  const newParents = [...parents, route];
  let flatRoutes = [];
  if (route.indexRoute) {
    flatRoutes = [...flatRoutes, ...flattenRoute(newParents, route.indexRoute)];
  }
  if (route.childRoutes) {
    flatRoutes = [...flatRoutes, ...flatMap(childRoute => flattenRoute(newParents, childRoute), route.childRoutes)];
  }
  if (!route.indexRoute && !route.childRoutes) {
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
export const flatten: (routes: SyncRoute[]) => FlatRoute[] =
  flatMap(route => flattenRoute([], route));

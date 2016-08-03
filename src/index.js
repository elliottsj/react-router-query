// @flow

import compact from 'lodash/fp/compact';
import compose from 'lodash/fp/compose';
import curry from 'lodash/fp/curry';
import every from 'lodash/fp/every';
import filter from 'lodash/fp/filter';
import flatMap from 'lodash/fp/flatMap';
import map from 'lodash/fp/map';
import pickBy from 'lodash/fp/pickBy';
import {
  createRoutes,
} from 'react-router';
import pify from 'pify';

export { default as RoutesProvider } from './components/RoutesProvider';
export { default as withQuery } from './components/withQuery';

export const isEmptyArray = array => Array.isArray(array) && array.length === 0;
export const omitUndefinedValues = pickBy(value => value !== undefined);
export const compactMap = compose(compact, map);

function normalizePath(p: string) {
  return p.replace(/\/\//g, '/');
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
function matchesPrefix(prefix: string, routePath: string) {
  return prefix.startsWith(routePath) || routePath.startsWith(prefix);
}

function joinPaths(path1, path2) {
  return `${path1.replace(/.\/$/, '')}/${path2.replace(/^\//, '')}`;
}

async function synchronizeRoute(filterChildRoutes, pathprefix, route: PlainRoute): SyncRoute {
  if (!route) {
    return undefined;
  }
  const component: ReactClass = (
    route.component ||
    route.getComponent && await pify(route.getComponent)(/* nextState: */ null)
  );
  const components: { [key: string]: ReactClass } = (
    route.components ||
    route.getComponents && await pify(route.getComponents)(/* nextState: */ null)
  );
  const indexRoute: SyncRoute = await synchronizeRoute(
    filterChildRoutes,
    pathprefix + route.path,
    route.indexRoute ||
    route.getIndexRoute && await pify(route.getIndexRoute)(/* partialNextState: */ null)
  );
  const childRoutes: PlainRoute[] = await synchronizeRoutes(
    filterChildRoutes,
    pathprefix + route.path,
    route.childRoutes ||
    route.getChildRoutes && await pify(route.getChildRoutes)(/* partialNextState: */ null)
  );
  return omitUndefinedValues({
    ...route,
    component,
    components,
    indexRoute,
    childRoutes: isEmptyArray(childRoutes) ? undefined : childRoutes,
  });
}

/**
 * Turn PlainRoutes into SyncRoutes by resolving react-router async getters
 * to their synchronous equivalents:
 *  - getChildRoutes -> childRoutes
 *  - getComponent   -> component
 *  - getComponents  -> components
 *  - getIndexRoute  -> indexRoute
 *
 * @param prefix Only routes starting with this prefix will be returned
 * @param routes The list of PlainRoutes
 */
async function synchronizeRoutes(
  filterRoutes: (route: PlainRoute, fullPath: string) => boolean,
  pathprefix,
  routes: PlainRoute[] = []
): SyncRoute[] {
  return await Promise.all(routes.filter(
    route => filterRoutes(route, pathprefix + route.path)
  ).map(
    route => synchronizeRoute(filterRoutes, pathprefix, route)
  ));
}

export async function synchronize(prefix = '', routes): SyncRoute[] {
  const plainRoutes: PlainRoute[] = createRoutes(routes);
  return await synchronizeRoutes(
    (route, fullPath) => matchesPrefix(prefix, fullPath),
    '',
    plainRoutes
  );
}

function _isRouteSynchronous(filterPrefix, parentPrefix, route) {
  const fullPath = joinPaths(parentPrefix, route.path || '');
  return (
    !matchesPrefix(filterPrefix, fullPath) ||
    !route.getComponent &&
    !route.getComponents &&
    !route.getIndexRoute &&
    !route.getChildRoutes &&
    (!route.childRoutes || every(isRouteSynchronous(filterPrefix, fullPath), route.childRoutes))
  );
}

const isRouteSynchronous = curry(_isRouteSynchronous);

export function isSynchronous(prefix: string = '', routes: PlainRoute | PlainRoute[]) {
  if (Array.isArray(routes)) {
    return every(isRouteSynchronous(prefix, ''), routes);
  }
  return isRouteSynchronous(prefix, '', routes);
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

export function flatten(routes: SyncRoute[]): FlatRoute[] {
  return flatMap(route => flattenRoute([], route), routes);
}

/**
 * Synchronize + flatten
 */
function _query(prefix, routes: PlainRoute[]) {
  const flattenWithPrefix = compose(
    filter(route => route.fullPath.startsWith(prefix)),
    flatten
  );

  const plainRoutes = createRoutes(routes);
  if (isSynchronous(prefix, plainRoutes)) {
    return flattenWithPrefix(plainRoutes);
  }
  return synchronize(prefix, plainRoutes).then(flattenWithPrefix);
}

type Query =
  (prefix: string, routes: PlainRoute[] | SyncRoute[]) => Promise<FlatRoute[]> | FlatRoute[];

export const query: Query = curry(_query);

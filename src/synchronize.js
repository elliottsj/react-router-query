// @flow

import every from 'lodash/fp/every';
import pickBy from 'lodash/fp/pickBy';
import {
  createRoutes,
} from 'react-router';
import pify from 'pify';

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
function matchesPrefix(prefix: string, routePath: string) {
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
function joinPaths(path1, path2) {
  return `${path1.replace(/.\/$/, '')}/${path2.replace(/^\//, '')}`;
}

async function synchronizeRoute(filterChildRoutes, pathprefix, route: PlainRoute): SyncRoute {
  if (!route) {
    return undefined;
  }
  const component: ReactClass = (
    route.component ||
    (route.getComponent && await pify(route.getComponent)(/* nextState: */ null))
  );
  const components: { [key: string]: ReactClass } = (
    route.components ||
    (route.getComponents && await pify(route.getComponents)(/* nextState: */ null))
  );
  const indexRoute: SyncRoute = await synchronizeRoute(
    filterChildRoutes,
    pathprefix + route.path,
    route.indexRoute ||
    (route.getIndexRoute && await pify(route.getIndexRoute)(/* partialNextState: */ null))
  );
  const childRoutes: PlainRoute[] = await synchronizeRoutes(
    filterChildRoutes,
    pathprefix + route.path,
    route.childRoutes ||
    (route.getChildRoutes && await pify(route.getChildRoutes)(/* partialNextState: */ null))
  );
  return {
    ...route,
    component,
    components,
    indexRoute,
    ...(isEmptyArray(childRoutes)
      ? {}
      : { childRoutes }
    ),
  };
}

/**
 * Turn PlainRoutes into SyncRoutes by resolving react-router async getters
 * to their synchronous equivalents:
 *  - getChildRoutes -> childRoutes
 *  - getComponent   -> component
 *  - getComponents  -> components
 *  - getIndexRoute  -> indexRoute
 *
 * @param prefix Only routes matching this prefix will be returned
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

function isRouteSynchronous(filterPrefix, parentPrefix, route) {
  const fullPath = joinPaths(parentPrefix, route.path || '');
  return !matchesPrefix(filterPrefix, fullPath) || (
    !route.getComponent &&
    !route.getComponents &&
    !route.getIndexRoute &&
    !route.getChildRoutes &&
    (!route.childRoutes || every(
      isRouteSynchronous.bind(null, filterPrefix, fullPath),
      route.childRoutes
    ))
  );
}

export function isSynchronous(prefix: string = '', routes: PlainRoute | PlainRoute[]) {
  if (Array.isArray(routes)) {
    return every(isRouteSynchronous.bind(null, prefix, ''), routes);
  }
  return isRouteSynchronous(prefix, '', routes);
}

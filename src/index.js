// @flow

import compact from 'lodash/fp/compact';
import compose from 'lodash/fp/compose';
import flatMap from 'lodash/fp/flatMap';
import map from 'lodash/fp/map';
import pickBy from 'lodash/fp/pickBy';
import {
  createRoutes,
} from 'react-router';
import path from 'path';
import pify from 'pify';

import promiseAllValues from './utils/promiseAllValues';
import match from './utils/match';
import mapValues from 'lodash/fp/mapValues';

export { default as withQuery } from './components/query';
export { default as QueryProvider } from './components/QueryProvider';

export const isEmptyArray = array => Array.isArray(array) && array.length === 0;
export const omitUndefinedValues = pickBy(value => value !== undefined);
export const compactMap = compose(compact, map);

function normalizePath(p: string) {
  return p.replace(/\/\//g, '/');
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
  filterRoutes: (route: PlainRoute, fullpath: string) => boolean,
  pathprefix,
  routes: PlainRoute[] = []
): SyncRoute[] {
  return await Promise.all(routes.filter(
    route => filterRoutes(route, pathprefix + route.path)
  ).map(
    route => synchronizeRoute(filterRoutes, pathprefix, route)
  ));
}

export async function query({ prefix = '' }, routes): SyncRoute[] {
  const plainRoutes: PlainRoute[] = createRoutes(routes);
  return await synchronizeRoutes(
    (route, fullpath) => fullpath.startsWith(prefix),
    '',
    plainRoutes
  );
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
      path: newPath,
      parents: parents.map(parent => ({ component: parent.component })),
    }];
  }
  return flatRoutes;
}

export function flattenRoutes(routes: SyncRoute[]): FlatRoute[] {
  return flatMap(route => flattenRoute([], route), routes);
}

async function getIndexRoute(route) {
  if (route.indexRoute) {
    return route.indexRoute;
  } else if (route.getIndexRoute) {
    return new Promise((resolve, reject) => route.getIndexRoute(null, (error, indexRoute) => {
      if (error) {
        reject(error);
      } else {
        resolve(indexRoute);
      }
    }));
  }
  return null;
}

async function isIndexRoute(routes) {
  const indexRoute = await getIndexRoute(routes[routes.length - 2]);
  const lastRoute = routes[routes.length - 1];
  return indexRoute === lastRoute;
}

async function getChildRoutes(route) {
  if (route.childRoutes) {
    return route.childRoutes;
  }
  return pify(route.getChildRoutes)(/* location: */ null);
}

export function queryRoute(location) {
  return async (routes) => {
    const [redirectLocation, renderProps] = await match({ routes, location });
    if (redirectLocation) {
      throw new Error(`Unexpected redirect: ${redirectLocation}`);
    }
    const matchedRoutes = renderProps.routes;
    const route =
      await isIndexRoute(matchedRoutes)
        ? matchedRoutes[matchedRoutes.length - 2]
        : matchedRoutes[matchedRoutes.length - 1];
    return route;
  };
}

export function queryChildRoutes(location, { index = true }) {
  return async (routes) => {
    const childRoutes = await getChildRoutes(await queryRoute(location)(routes));
    return childRoutes.map(route => ({
      ...route,
      route,
      fullpath: path.resolve(location.pathname || location, route.path),
    }));
  };
}

async function resolveQueries(routes, component) {
  if (!component.nucleateQuery) {
    return null;
  }
  return promiseAllValues(mapValues(query => query(routes), component.nucleateQuery));
}

export async function resolveComponentsQueries(routes, components) {
  return new Map(await Promise.all(components.map(
    async component => [component, await resolveQueries(routes, component)]
  )));
}

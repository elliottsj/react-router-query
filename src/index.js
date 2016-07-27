// @flow

import curry from 'lodash/fp/curry';
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
  routes: PlainRoute[]
): SyncRoute[] {
  return await Promise.all(routes.filter(
    route => filterRoutes(route, pathprefix + route.path)
  ).map(async (route) => {
    const component: ReactClass = (
      route.component ||
      route.getComponent && await pify(route.getComponent)(/* nextState: */ null)
    );
    const components: { [key: string]: ReactClass } = (
      route.components ||
      route.getComponents && await pify(route.getComponents)(/* nextState: */ null)
    );
    const indexRoute: SyncRoute = (
      route.indexRoute ||
      route.getIndexRoute && await pify(route.getIndexRoute)(/* partialNextState: */ null)
    );
    const childRoutes: PlainRoute[] = await synchronizeRoutes(
      filterRoutes,
      pathprefix + route.path,
      route.childRoutes ||
      route.getChildRoutes && await pify(route.getChildRoutes)(/* partialNextState: */ null) ||
      []
    );
    return {
      ...route,
      component,
      components,
      indexRoute,
      childRoutes,
    };
  }));
}

export async function query({ prefix = '' }, routes): SyncRoute[] {
  const plainRoutes: PlainRoute[] = createRoutes(routes);
  return await synchronizeRoutes(
    (route, fullpath) => fullpath.startsWith(prefix),
    '',
    plainRoutes
  );
}

export function flatten(routes: SyncRoute[]): FlatRoute[] {

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

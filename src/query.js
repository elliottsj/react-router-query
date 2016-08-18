// @flow

import compose from 'lodash/fp/compose';
import curry from 'lodash/fp/curry';
import filter from 'lodash/fp/filter';
import {
  createRoutes,
} from 'react-router';

import {
  flatten,
} from './flatten';
import synchronize, {
  isSynchronous,
} from './synchronize';

/**
 * Return an array of `FlatRoute`s which are rooted at the given prefix.
 *
 * If routes that match the given prefix are asynchronous, then a promise will be returned,
 * resolving with an array of `FlatRoute`s.
 */
function _query(
  prefix: string,
  routes: PlainRoute[] | SyncRoute[],
): Promise<FlatRoute[]> | FlatRoute[] {
  const flattenWithPrefix = compose(
    filter(route => route.fullPath.startsWith(prefix)),
    flatten
  );

  const plainRoutes: PlainRoute[] = createRoutes(routes);
  if (isSynchronous(prefix, plainRoutes)) {
    return flattenWithPrefix(plainRoutes);
  }
  return synchronize(prefix, plainRoutes).then(flattenWithPrefix);
}

export const query:
  (prefix: string) =>
  (routes: PlainRoute[] | SyncRoute[]) =>
  Promise<FlatRoute[]> | FlatRoute[] =
    curry(_query);

// @flow

import curry from 'lodash/fp/curry';

import flatten from './flatten';
import synchronize from './synchronize';

/**
 * Return an array of `FlatRoute`s which are rooted at the given prefix.
 *
 * If routes that match the given prefix are asynchronous, then a promise will be returned,
 * resolving with an array of `FlatRoute`s.
 */
function _query(
  prefix: string,
  routes: PlainRoute | PlainRoute[],
  cb: CPSCallback<FlatRoute[]>,
) {
  synchronize(prefix, routes, (error, syncRoutes) => {
    const flatRoutes = flatten(syncRoutes);
    const matchedRoutes = flatRoutes.filter(
      route => route.fullPath.startsWith(prefix)
    );
    cb(null, matchedRoutes);
  });
}

const query:
  (prefix: string) =>
  (routes: PlainRoute | PlainRoute[]) =>
  (cb: CPSCallback<FlatRoute[]>) =>
  void =
  curry(_query);

export default query;

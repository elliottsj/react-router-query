// @flow

import Rx, { Observable } from 'rxjs/Rx';
import compose from 'lodash/fp/compose';
import filter from 'lodash/fp/filter';
import fromPairs from 'lodash/fp/fromPairs';
import map from 'lodash/fp/map';
import mapValues from 'lodash/fp/mapValues';
import partition from 'lodash/fp/partition';
import pickBy from 'lodash/fp/pickBy';
import pipe from 'lodash/fp/pipe';
import toPairs from 'lodash/fp/toPairs';
import { PropTypes } from 'react';
import { getContext, mapPropsStream, withProps } from 'recompose';

import isPromise from '../utils/isPromise';

function resolveQueryProps(props$) {
  const rxjsProps$ = Rx.Observable.from(props$);
  // Instantiate queries
  const queries$: Observable<{ [name: string]: CPSFunction0<FlatRoute[]> }> = rxjsProps$.map(
    ({ __routes, queries }) => mapValues(query => query(__routes), queries),
  );
  const queryResults$: Observable<[string, FlatRoute[]]> =
    queries$
      .flatMap(queries => Rx.Observable.pairs(queries))
      .flatMap(([name, partialQuery]: [string, CPSFunction0<FlatRoute[]>]) => {
        const query$ = Rx.Observable.bindNodeCallback(partialQuery)();
        return query$.map(
          result => {
            return [name, result]
          },
        );
      })
      .scan(
        (acc: { [name: string]: FlatRoute[] }, [name, routes]: [string, FlatRoute[]]) => {
          return {
            ...acc,
            [name]: routes,
          };
        },
        {}
      );
  return rxjsProps$.combineLatest(
    queryResults$,
    (props, queryResults) => {
      return {
        ...props,
        ...queryResults,
      }
    },
  );
}

type PartialQuery = (routes: PlainRoute | PlainRoute[]) => (cb: CPSCallback<FlatRoute[]>) => void;

const withQuery = (queries: { [name: string]: PartialQuery }) => compose(
  withProps({ queries }),
  getContext({
    __routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  }),
  mapPropsStream(resolveQueryProps),
);

export default withQuery;

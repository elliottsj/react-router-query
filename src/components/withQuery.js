// @flow

import Rx from 'rxjs/Rx';
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
import { getContext, lifecycle, mapPropsStream, withProps } from 'recompose';

import isPromise from '../utils/isPromise';

type Query = [string, FlatRoute[] | Promise<FlatRoute[]>];
type QuerySet = { [name: string]: FlatRoute[] | Promise<FlatRoute[]> };

export default queries => compose(
  withProps({ queries }),
  getContext({
    __routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  }),
  mapPropsStream(
    props$ => {
      const rxjsProps$ = Rx.Observable.from(props$);
      const queries$: Observable<QuerySet> = rxjsProps$.map(
        ({ __routes, queries }) => mapValues(query => query(__routes), queries),
      );
      const syncQueryResults$ = queries$.map(
        pickBy(route => !isPromise(route))
      );
      const asyncQueryResults$ = Rx.Observable.of({}).concat(queries$.flatMap(
        pipe(
          pickBy(isPromise),
          toPairs,
          map(([name, routesPromise]) => {
            return routesPromise.then(routes => {
              return [name, routes];
            });
          }),
          promises => Promise.all(promises).then(fromPairs)
        )
      ));
      return rxjsProps$.combineLatest(
        syncQueryResults$,
        asyncQueryResults$,
        (props, syncQueryResults, asyncQueryResults) => {
          return {
            ...props,
            ...syncQueryResults,
            ...asyncQueryResults,
          };
        },
      );
    }
  ),
);

// @flow

import Rx, { Observable } from 'rxjs/Rx';
import compose from 'lodash/fp/compose';
import mapValues from 'lodash/fp/mapValues';
import { PropTypes } from 'react';
import { getContext, mapPropsStream, setStatic, withProps } from 'recompose';

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
        return query$.map(result => [name, result]);
      })
      .scan(
        (acc: { [name: string]: FlatRoute[] }, [name, routes]: [string, FlatRoute[]]) => ({
          ...acc,
          [name]: routes,
        }),
        {}
      );
  return rxjsProps$.combineLatest(
    queryResults$,
    (props, queryResults) => ({
      ...props,
      ...queryResults,
    }),
  );
}

type PartialQuery = (routes: PlainRoute | PlainRoute[]) => (cb: CPSCallback<FlatRoute[]>) => void;

const withQuery = (queries: { [name: string]: PartialQuery }) => compose(
  setStatic('__queries', queries),
  withProps({ queries }),
  getContext({
    __routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  }),
  mapPropsStream(resolveQueryProps),
);

export default withQuery;

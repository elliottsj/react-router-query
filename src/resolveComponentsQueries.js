// @flow

import applyEach from 'async/applyEach';
import compact from 'lodash/fp/compact';
import flatMap from 'lodash/fp/flatMap';
import map from 'lodash/fp/map';
import pipe from 'lodash/fp/pipe';
import values from 'lodash/fp/values';

const getComponentsQueries: (components: ReactClass<*>) => PartialQuery[] = pipe(
  map(component => component.__queries),
  compact,
  flatMap(values),
);

export default function resolveComponentsQueries(
  components: ReactClass<*>,
  routes,
  cb: CPSCallback0
) {
  const queries: PartialQuery[] = getComponentsQueries(components);
  applyEach(queries, routes, cb);
}

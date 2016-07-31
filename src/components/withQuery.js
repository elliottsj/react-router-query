import compose from 'lodash/fp/compose';
import { PropTypes } from 'react';
import { getContext } from 'recompose';

export default compose(
  getContext({
    routes: PropTypes.object.isRequired,
  })
);

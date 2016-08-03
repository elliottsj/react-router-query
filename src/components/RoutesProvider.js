import { PropTypes } from 'react';
import { createRoutes } from 'react-router';
import { withContext } from 'recompose';
import Children from './Children';

export default withContext(
  {
    __routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  },
  ({ routes }) => ({ __routes: createRoutes(routes) }),
)(Children);

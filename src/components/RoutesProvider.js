import { PropTypes } from 'react';
import { withContext } from 'recompose';
import Children from './Children';

export default withContext(
  {
    routes: PropTypes.object.isRequired,
  },
  ({ routes }) => ({ routes }),
)(Children);

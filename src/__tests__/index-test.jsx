// @flow

import {
  shallow,
} from 'enzyme';
import React from 'react';
import {
  createMemoryHistory,
  IndexRoute,
  Redirect,
  Route,
  Router,
} from 'react-router';
import {
  flatten,
  query,
  QueryProvider,
  withQuery,
} from '..';

function App() {
  return <div>App</div>;
}
function Dashboard() {
  return <div>Dashboard</div>;
}
function About() {
  return <div>About</div>;
}
function Inbox() {
  return <div>Inbox</div>;
}
function Message() {
  return <div>Message</div>;
}
function Messages() {
  return <div>Messages</div>;
}
function Settings() {
  return <div>Settings</div>;
}

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={Dashboard} />
    <Route path="about" component={About} />
    <Route path="inbox" component={Inbox}>
      <IndexRoute component={Messages} />
      <Route path="settings" component={Settings} />
      <Redirect from="messages/:id" to="/messages/:id" />
    </Route>
    <Route component={Inbox}>
      <Route path="messages/:id" component={Message} />
    </Route>
  </Route>
);

describe('query', () => {
  fit('resolves with all routes given a prefix "/"', async () => {
    const result = await query({ prefix: '/' }, routes);
    // expect(result).toEqual([
    //   {
    //     path: '/',
    //     component: App,
    //     indexRoute: {
    //       component: App,
    //     },
    //     childRoutes: [
    //       {
    //         path: 'about',
    //         component: About,
    //       },
    //       {
    //         path: 'inbox',
    //         component: Inbox,
    //         indexRoute: {
    //           component: Messages,
    //         },
    //         childRoutes: [
    //           {
    //             path: 'settings',
    //             component: Settings,
    //           },
    //           {
    //             from: 'messages/:id',
    //             to: '/messages/:id',
    //             path: 'messages/:id',
    //             onEnter: jasmine.any(Function),
    //           },
    //         ],
    //       },
    //       {
    //         component: Inbox,
    //         childRoutes: [
    //           {
    //             path: 'messages/:id',
    //             component: Message,
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // ]);
    expect(result.length).toBe(1);
    expect(result[0].path).toBe('/');
    expect(result[0].component).toBe(App);
    expect(result[0].indexRoute.component).toBe(Dashboard);
    expect(result[0].childRoutes.length).toBe(3);
    expect(result[0].childRoutes[0].path).toBe('about');
    expect(result[0].childRoutes[0].component).toBe(About);
    expect(result[0].childRoutes[1].path).toBe('inbox');
    expect(result[0].childRoutes[1].component).toBe(Inbox);
    expect(result[0].childRoutes[1].childRoutes.length).toBe(2);
    expect(result[0].childRoutes[1].indexRoute.component).toBe(Messages);
    expect(result[0].childRoutes[1].childRoutes[0].path).toBe('settings');
    expect(result[0].childRoutes[1].childRoutes[0].component).toBe(Settings);
    expect(result[0].childRoutes[1].childRoutes[1].from).toBe('messages/:id');
    expect(result[0].childRoutes[1].childRoutes[1].to).toBe('/messages/:id');
    expect(result[0].childRoutes[1].childRoutes[1].path).toBe('messages/:id');
    expect(result[0].childRoutes[1].childRoutes[1].onEnter).toEqual(jasmine.any(Function));
    expect(result[0].childRoutes[2].component).toBe(Inbox);
    expect(result[0].childRoutes[2].childRoutes.length).toBe(1);
    expect(result[0].childRoutes[2].childRoutes[0].path).toBe('messages/:id');
    expect(result[0].childRoutes[2].childRoutes[0].component).toBe(Message);
  });
});

describe('flatten', () => {
  it('flattens routes', async () => {
    const result = flatten(await query({ prefix: '/' }, routes));
    expect(result).toEqual([
      {
        path: '/',
        component: Dashboard,
        parents: [App],
      },
      {
        path: '/about',
        component: About,
        parents: [App],
      },
      {
        path: '/inbox',
        component: Inbox,
        parents: [App],
      },
      {
        path: '/inbox/messages/:id',
        onEnter: null, // todo: populate
        parents: [App, Inbox],
      },
      {
        path: '/messages/:id',
        component: Message,
        parents: [App, Inbox],
      },
    ]);
  });
});

describe('withQuery', () => {
  it('creates a higher-order component, with props corresponding to queries', () => {
    const AppWithQuery = withQuery({
      pages: query({ prefix: '/' }),
    })(App);

    const routes = (
      <Route path="/" component={AppWithQuery}>
        <IndexRoute component={Dashboard} />
        <Route path="about" component={About} />
        <Route path="inbox" component={Inbox}>
          <Redirect from="messages/:id" to="/messages/:id" />
        </Route>
        <Route component={Inbox}>
          <Route path="messages/:id" component={Message} />
        </Route>
      </Route>
    );

    function Root() {
      return (
        <QueryProvider routes={routes}>
          <Router history={createMemoryHistory()}>{routes}</Router>
        </QueryProvider>
      );
    }

    const wrapper = shallow(<Root />);
    expect(wrapper.some(AppWithQuery)).toBe(true);
    const app = wrapper.find(AppWithQuery);
    // TODO: assert props
  });
});

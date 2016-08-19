import flatten from '../flatten';
import {
  App,
  Dashboard,
  About,
  Inbox,
  Message,
  Messages,
  Settings,
  routesPlain,
} from '../__test_fixtures__';

describe('flatten', () => {
  it('flattens routes', async () => {
    const result = flatten(routesPlain);
    expect(result).toEqual([
      {
        fullPath: '/',
        component: Dashboard,
        parents: [jasmine.objectContaining({ component: App })],
      },
      {
        path: 'about',
        fullPath: '/about',
        component: About,
        parents: [jasmine.objectContaining({ component: App })],
      },
      {
        fullPath: '/inbox',
        component: Messages,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'settings',
        fullPath: '/inbox/settings',
        component: Settings,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        from: 'messages/:id',
        to: '/messages/:id',
        path: 'messages/:id',
        fullPath: '/inbox/messages/:id',
        onEnter: jasmine.any(Function),
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
      {
        path: 'messages/:id',
        fullPath: '/messages/:id',
        component: Message,
        parents: [
          jasmine.objectContaining({ component: App }),
          jasmine.objectContaining({ component: Inbox }),
        ],
      },
    ]);
  });
});

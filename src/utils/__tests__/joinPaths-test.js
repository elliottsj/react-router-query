import joinPaths from '../joinPaths';

describe('joinPaths', () => {
  it('joins paths', () => {
    expect(joinPaths('/', '')).toBe('/');
    expect(joinPaths('/', 'inbox')).toBe('/inbox');
    expect(joinPaths('/', '/inbox')).toBe('/inbox');
    expect(joinPaths('inbox', 'messages')).toBe('inbox/messages');
    expect(joinPaths('/inbox/messages/', '/1/')).toBe('/inbox/messages/1');
  });
});

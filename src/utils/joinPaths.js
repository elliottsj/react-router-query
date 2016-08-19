/**
 * Join two '/'-delimited paths, removing duplicate '/'s at the point of joining.
 *
 * @example
 *   joinPaths('/', 'inbox')              // '/inbox'
 *   joinPaths('/', '/inbox')             // '/inbox'
 *   joinPaths('inbox', 'messages')       // 'inbox/messages'
 *   joinPaths('/inbox/messages/', '/1/') // '/inbox/messages/1'
 */
export default function joinPaths(path1: string, path2: string = ''): string {
  const segment1 = path1.replace(/\/$/, '');
  const segment2 = path2.replace(/^\//, '');
  return `${segment1}/${segment2}`.replace(/(.)\/$/, '$1');
}

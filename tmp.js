function test() {
  var done = false;
  async.parallel([
    (cb) => { setImmediate(() => cb(null, 'hi')) },
    (cb) => { setImmediate(() => cb(null, 'bye')) },
  ], (error, result) => {
    done = true;
    console.info('result', result);
  });
  console.info('done', done);
}

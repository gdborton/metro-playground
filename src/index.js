// const ReadableStream = require('readable-stream');
// console.log(ReadableStream);
// const Stream = require('stream');
// console.log(Stream);

// const inherits = require('util');
// console.log(inherits);

module.exports = {
  func: function() {
    return '1';
  }
};

console.log(require('./other')());
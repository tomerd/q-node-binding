var fs = require('fs');
var ffi = require('ffi');
var ref = require('ref');
var struct = require('ref-struct');

var q = 'void'; // `q` is an "opaque" type, so we don't know its layout
var q_ptr = ref.refType(q);
var q_ptr_ptr = ref.refType(q_ptr);

/*
var q_job = 'void';
/~
var q_job = struct({
  'uid': 'string',
  'data': 'string'
});~/
var q_job_ptr = ref.refType(q_job);
var q_job_error = 'void'
/~
var q_job_error = struct({
  'description': 'string'
});~/
var q_job_error_ptr = ref.refType(q_job_error);
var q_job_error_ptr_ptr = ref.refType(q_job_error_ptr);
*/
var q_worker_delegate = 'pointer'; // TODO: use ffi.Callback when #76 is implemented
var q_observer_delegate = 'pointer'; // TODO: use ffi.Callback when #76 is implemented
var string_ptr = ref.refType('string');

var Q = ffi.Library('libq', {
	'q_version': [ 'string', [ ] ],
	'q_connect': [ 'void', [ q_ptr_ptr ] ],
	'q_disconnect': [ 'void', [ q_ptr ] ],
	'q_post': [ 'string', [ q_ptr, 'string', 'string', 'long' ]],
	'q_worker': [ 'void', [ q_ptr, 'string', q_worker_delegate ] ],
	'q_observer': [ 'void', [ q_ptr, 'string', q_observer_delegate ] ],	
})

// print out the "libsqlite3" version number
console.log('Using q version %s...', Q.q_version())

// create a storage area for the db pointer q gives us
var queue_ptr = ref.alloc(q_ptr_ptr)

// open the database object
Q.q_connect(queue_ptr)

// we don't care about the `q **`, but rather the `q *` that it's
// pointing to, so we must deref()
var queue = queue_ptr.deref()

/*
var worker1 = ffi.Callback('void', [string_ptr], function (dataptr) 
{
	var data = dataptr.deref();
	//throw("x");
	console.log("node worker1 received '" + data + "'");
});
Q.q_worker(queue, "channel1", worker1)

var worker2 = ffi.Callback('void', [string_ptr], function (dataptr) 
{	
	var data = dataptr.deref();
	console.log("node worker2 received '" + data + "'");
});
Q.q_worker(queue, "channel1", worker2)

var observer1 = ffi.Callback('void', [string_ptr], function (dataptr) 
{
	var data = dataptr.deref();
	console.log("node observer1 received '" + data + "'");
});
Q.q_observer(queue, "channel1", observer1)
*/

var jid = Q.q_post(queue, "channel1", "node 11", 0)
jid = Q.q_post(queue, "channel1", "node 12", (new Date().getTime() / 1000 + 3))
jid = Q.q_post(queue, "channel1", "node 13", 0)

setTimeout(function()
{
	var jid = Q.q_post(queue, "channel1", "node 21", 0)
	jid = Q.q_post(queue, "channel1", "node 22", 0)
	jid = Q.q_post(queue, "channel1", "node 23", 0)

}, 2000);

setTimeout(function()
{
	Q.q_disconnect(queue);
	console.log("done");
}, 5000);




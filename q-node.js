var fs = require('fs');
var ffi = require('ffi');
var ref = require('ref');
var struct = require('ref-struct');

var q = 'void'; // `q` is an "opaque" type, so we don't know its layout
var q_ptr = ref.refType(q);
var q_ptr_ptr = ref.refType(q_ptr);

var q_worker_delegate = 'pointer'; // TODO: use ffi.Callback when #76 is implemented
var q_observer_delegate = 'pointer'; // TODO: use ffi.Callback when #76 is implemented
var string_ptr = ref.refType('string');

var libq = ffi.Library('libq', { 'q_version': [ 'string', [ ] ],
								'q_connect': [ 'void', [ q_ptr_ptr, 'string' ] ],
								'q_disconnect': [ 'void', [ q_ptr ] ],
								'q_post': [ 'string', [ q_ptr, 'string', 'string', 'long' ]],
								'q_worker': [ 'void', [ q_ptr, 'string', q_worker_delegate ] ],
								'q_observer': [ 'void', [ q_ptr, 'string', q_observer_delegate ] ],	
								});

var qp = null;

exports.version = function()
{
	return libq.q_version();
}

exports.connect = function(config)
{
	if (qp) return;
	var qpp = ref.alloc(q_ptr_ptr);
	libq.q_connect(qpp, config);
	qp = qpp.deref();
}

exports.post = function(channel, data, at)
{
	if (!qp) return;
	return libq.q_post(qp, channel, data, at);
}

exports.worker = function(channel, worker)
{
	if (!qp) return;
	var q_worker = ffi.Callback('void', [string_ptr], function (dataptr) 
	{
		var data = dataptr.deref();
		worker(data);
	});
	libq.q_worker(qp, channel, q_worker);
}

exports.observer = function(channel, observer)
{
	if (!qp) return;
	var q_observer = ffi.Callback('void', [string_ptr], function (dataptr) 
	{
		var data = dataptr.deref();
		observer(data);
	});
	libq.q_observer(qp, channel, q_observer);
}

exports.disconnect= function()
{
	if (!qp) return;
	libq.q_disconnect(qp);
}

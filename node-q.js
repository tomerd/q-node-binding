var fs = require('fs');
var ffi = require('ffi');
var ref = require('ref');
var struct = require('ref-struct');

var q = ref.types.void; // `q` is an "opaque" type, so we don't know its layout
var ptr_q = ref.refType(q);
var ptr_ptr_q = ref.refType(ptr_q);

var ptr_string = ref.refType(ref.types.CString);

var libq = ffi.Library('libq', { 'q_version': [ 'string', [ ] ],
								 'q_connect': [ 'void', [ ptr_ptr_q, 'string' ] ],
								 'q_disconnect': [ 'void', [ ptr_q ] ],
								 'q_post': [ 'void', [ ptr_q, 'string', 'string', 'string', 'long', ptr_string ]],
								 'q_update': [ 'bool', [ ptr_q, 'string', 'long' ]],
								 'q_remove': [ 'bool', [ ptr_q, 'string' ]],
								  // https://github.com/rbranson/node-ffi/issues/76
								 'q_worker': [ 'void', [ ptr_q, 'string', 'pointer' ] ],
								 'q_observer': [ 'void', [ ptr_q, 'string', 'pointer' ] ],
								 'q_flush': [ 'void', [ ptr_q ] ],	
								});

var pq = null;
var workers=[];
var observers=[];

exports.version = function()
{
	return libq.q_version();
}

exports.connect = function(config)
{
	if (pq) return;
	if (config) config = JSON.stringify(config);
	var ppq = ref.alloc(ptr_ptr_q);
	libq.q_connect(ppq, config);
	pq = ppq.deref();
}

exports.disconnect = function()
{
	if (!pq) return;
	libq.q_disconnect(pq);
	pq = null;
	workers = [];
	observers = [];	
}

exports.post = function(channel, job)
{
	if (!pq) return;
	if (!channel) return;
	if (!job) return;
	if (!job.data) return;
	var data = job.data === Object(job.data) ? JSON.stringify(job.data) : job.data;
	var run_at = job.run_at ? job.run_at/1000 : 0;
	var puid = ref.alloc(ref.types.CString);
	libq.q_post(pq, channel, job.uid, data, run_at, puid);
	return puid.deref();
}

exports.update = function(uid, run_at)
{
	if (!pq) return;
	if (!uid) return;
	run_at = run_at ? run_at/1000 : 0;
	return libq.q_update(pq, uid, run_at);
}

exports.remove = function(uid)
{
	if (!pq) return;
	if (!uid) return;
	return libq.q_remove(pq, uid);
}

exports.worker = function(channel, worker)
{
	if (!pq) return;
	if (!channel) return;
	var q_worker = ffi.Callback('void', [ptr_string], function (pdata) 
	{
		var data = pdata.deref();
		worker(data);
	});
	// https://github.com/rbranson/node-ffi/issues/84
	workers.push(q_worker);
	libq.q_worker(pq, channel, q_worker);
}

exports.observer = function(channel, observer)
{
	if (!pq) return;
	if (!channel) return;
	var q_observer = ffi.Callback('void', [ptr_string], function (pdata) 
	{
		var data = pdata.deref();
		observer(data);
	});
	// https://github.com/rbranson/node-ffi/issues/84	
	observers.push(q_observer); 
	libq.q_observer(pq, channel, q_observer);
}

// careful, flushes the queue!
exports.flush = function()
{
	if (!pq) return;
	libq.q_flush(pq);
}


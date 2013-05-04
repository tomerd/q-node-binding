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
								 'q_post': [ 'string', [ ptr_q, 'string', 'string', 'long', ptr_string ]],
								  // https://github.com/rbranson/node-ffi/issues/76
								 'q_worker': [ 'void', [ ptr_q, 'string', 'pointer' ] ],
								 'q_observer': [ 'void', [ ptr_q, 'string', 'pointer' ] ],	
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

exports.post = function(channel, data, at)
{
	if (!pq) return;
	if (!channel) return;
	if (!data) return;	
	if (data === Object(data)) data = JSON.stringify(data);
	if (!at) at = 0;
	var puid = ref.alloc(ref.types.CString);
	libq.q_post(pq, channel, data, at, puid);
	return puid.deref();
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

exports.disconnect= function()
{
	if (!pq) return;
	libq.q_disconnect(pq);
	workers = [];
	observers = [];	
}



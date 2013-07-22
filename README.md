***************************************************************************************

This project is work in progress. if you are interested in contributing or otherwise have input
please touch base via github

***************************************************************************************

### about

q is a queueing toolkit. the idea is to provide a universal application programming interface that can be used throughout the entire
application development lifecycle without the need to commit to a specific queueing technology or to set up complex queueing environments 
where such are not required. you can think of it as an ORM for queueing. 

q runs on multiple back-ends and has bindings to many programing languages. and so, while during development you will most likely run it in-memory and let it clear when the process dies, you may choose a redis back-end on your test environment and running dedicated servers backed by rabbitMQ, amazon SQS or some other enterprise queueing system on production. 

see more about the core library at https://github.com/tomerd/q

### q bindings for node.js 

q bindings for node.js uses the ffi module to bind to q's native API. q is represented by the node-q module which exposes a simple API:

* *version:* returns the version of q

* *connect(config):* connects to the library and initialized a connection to the backend specified by the config param. see further documentation on backends at the core library.

* *disconnect:* disconnect from the library. no further calls can be made after this.

* *post(queue, job):*/ posts a job to a named queue (aka channel). a job is represented by the simple json.
	
	the job's json consists of 3 fields:
	+ uid (string, optional): a unique identifier for the job, useful if you plan on updating or rescheduling the job.
	+ data (string): the payload, will be used by the consumer to actually perform the job.
	+ run_at (date, optional): if you want the job to be scheduled in the future, use this field to specify the target timestamp.

* *reschedule(uid, run_at):* reschedule the job identified by uid to a new target date.

* *cancel(uid):* cancel a scheduled jobs.

* *worker(queue, &delegate):* register a worker [function] for a named queue (aka channel). the worker will start receiving jobs immediately.

* *observer(queue, &delegate):* register an observer [function] for a named queue (aka channel). the observer will start receiving jobs immediately. the difference between an observer and a worker is that the observer is passive in nature and as such is notified only after a
worker has completed the job successfully.

* *drop:* careful, drops all queues! useful in development scenarios when you need to flush the entire queue system.

##### usage example

	var q = require('./node-q');

	q.connect(	{ driver: 'redis',  host: '127.0.0.1'  });
	
	var total = 100;
	for (var index=0; index < total; index++)
	{
		var uid = q.post("channel1", { data: "node " + index });
		console.info("posted %s", uid);
	}
	
	var received = 0;
	q.worker("channel1", function(data)
	{
		received++;
		console.info("node worker received [%s]", data);
	});

	setInterval(function()
	{
		console.info(received + "/" +  total);
		
		if (received == total)
		{
			console.info("done");
			q.disconnect();
			process.exit(0);
		}
		
	}, 1000);
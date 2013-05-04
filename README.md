***************************************************************************************

This project is work in progress. if you are interested in contributing or otherwise have input
please touch base via github

***************************************************************************************

### about

q is a queueing framework. the idea behind it is to provide a universal application interface that can be used across all
development phases and scaling requirements. q runs on multiple back-ends and has binding to many programing languages. and so
while during development you probably want to run it using an in-memory back-end that clears with the process, you may choose 
to use redis on your test environment and amazon SQS on production.

https://github.com/tomerd

### q bindings for node.js 

	var q = require('./node-q');

	q.connect(	{ driver: 'redis',  host: '127.0.0.1'  });
	
	var total = 100;
	for (var index=0; index < total; index++)
	{
		var uid = q.post("channel1", "node " + index);
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
var assert = require('assert');
var q = require('./node-q');

var connection_string = { driver: 'redis', host: '127.0.0.1' };

function test1()
{
	console.info('-------------- test1 --------------');
	console.info('using q version %s', q.version());
	console.info('using %s', connection_string);

	//process.stdin.resume();
	//process.stdout.write("how many: ");
 
	//process.stdin.once('data', function(input) 
	//{
		var total = 100; //input.toString().trim();
	
		q.connect(connection_string);
		q.flush();
	
		for (var index=0; index < total; index++)
		{
			var uid = q.post("channel1", { data: "node " + index });
			//console.info("posted %s", uid);
		}
	
		var received = 0;
		q.worker("channel1", function(data)
		{
			received++;
			console.info("node worker 1 received [%s]", data);
		});
	
		var interval = setInterval(function()
		{
			console.info(received + "/" +  total);
		
			if (received == total)
			{
				clearInterval(interval);
				assert.equal(received, total, "expected " + total);
				next();
			}
		}, 1000);
	
		function next()
		{
			console.info("done");
			q.disconnect();
			test2()
		}
	//});
}

function test2()
{
	console.info('-------------- test2 --------------');
	console.info('using q version %s', q.version());
	console.info('using %s', connection_string);
	
	q.connect(connection_string);
	q.flush();
	
	var received = 0;
	q.worker("channel1", function(data)
	{
		received++;
		console.info("node worker 2 received [%s]", data);
	});
	
	q.post("channel1", { data: "node 1", run_at: new Date().getTime() + 2000 });
	q.post("channel1", { data: "node 2", run_at: new Date().getTime() + 4000 });
	
	setTimeout(function()
	{
		assert.equal(received, 1, "expected 1");
		setTimeout(function()
		{
			assert.equal(received, 2, "expected 2");
			next();
		}, 2000);
	}, 3000);
	

	function next()
	{
		console.info("done");
		q.disconnect();
		test3()
	}
}

function test3()
{
	console.info('-------------- test3 --------------');
	console.info('using q version %s', q.version());
	console.info('using %s', connection_string);
	
	q.connect(connection_string);
	q.flush();
		
	var received = 0;
	q.worker("channel1", function(data)
	{
		received++;
		console.info("node worker 3 received [%s]", data);
	});
	
	q.post("channel1", { uid: "node1", data: "node 1", run_at: new Date().getTime() + 2000 });
	q.post("channel1", { uid: "node2", data: "node 2", run_at: new Date().getTime() + 4000 });	
	
	setTimeout(function()
	{
		assert.equal(received, 1, "expected 1");
		q.update("node2", new Date().getTime() + 4000)
		setTimeout(function()
		{
			assert.equal(received, 1, "expected 1");
			setTimeout(function()
			{
				assert.equal(received, 2, "expected 2");
				next();
			}, 3000);
		}, 2000);
	}, 3000);
	
	function next()
	{
		console.info("done");
		q.disconnect();
		test4()
	}
}

function test4()
{
	console.info('-------------- test4 --------------');
	console.info('using q version %s', q.version());
	console.info('using %s', connection_string);
	
	q.connect(connection_string);
	q.flush();
		
	var received = 0;
	q.worker("channel1", function(data)
	{
		received++;
		console.info("node worker 4 received [%s]", data);
	});
	
	q.post("channel1", { uid: "node1", data: "node 1", run_at: new Date().getTime() + 2000 });
	q.post("channel1", { uid: "node2", data: "node 2", run_at: new Date().getTime() + 4000 });	
	
	setTimeout(function()
	{
		assert.equal(received, 1, "expected 1");
		q.remove("node2");
		setTimeout(function()
		{
			assert.equal(received, 1, "expected 1");
			next();
		}, 2000);
	}, 3000);
	
	function next()
	{
		console.info("done");
		q.disconnect();
		//process.exit(0);
	}
}


test1();




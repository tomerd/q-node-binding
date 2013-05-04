var q = require('./node-q');

console.info('using q version %s', q.version())

process.stdin.resume();
process.stdout.write("how many: ");
 
process.stdin.once('data', function(input) 
{
	var total = input.toString().trim();
	
	q.connect(	/*{
					driver: 'redis', 
					host: '127.0.0.1' 
				}*/);
	
	for (var index=0; index < total; index++)
	{
		var uid = q.post("channel1", "node " + index);
		console.info("posted %s", uid);
	}
	
	var received = 0;
	q.worker("channel1", function(data)
	{
		received++;
		console.info("node worker 1 received [%s]", data);
	});
	
	setInterval(function()
	{
		console.info(received + "/" +  total);
		
		if (recieved == total)
		{
			console.info("done");
			q.disconnect();
			process.exit(0);
		}
		
	}, 1000);
});



/*
q.worker("channel1", function(data)
{
	console.log("node worker 2 received [%s]", data);
});

q.observer("channel1", function(data)
{
	console.log("node observer 1 received [%s]", data);
});

q.post("channel1", "node 11");
q.post("channel1", "node 12", (new Date().getTime() / 1000 + 2));
q.post("channel1", "node 13");

setTimeout(function()
{
	q.post("channel1", "node 21", (new Date().getTime() / 1000 + 2));
	q.post("channel1", "node 22");
	q.post("channel1", "node 23");

}, 4000);

setTimeout(function()
{
	q.disconnect();
	console.log("done");
}, 3000);
*/


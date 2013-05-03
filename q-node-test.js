var q = require('./q-node');

console.log('using q version %s...', q.version())

q.connect(null)

q.worker("channel1", function(data)
{
	console.log("node worker 1 received '" + data + "'");
});

q.worker("channel1", function(data)
{
	console.log("node worker 2 received '" + data + "'");
});

q.observer("channel1", function(data)
{
	console.log("node observer 1 received '" + data + "'");
});

q.post("channel1", "node 11", 0);
q.post("channel1", "node 12", (new Date().getTime() / 1000 + 2));
q.post("channel1", "node 13", 0);

setTimeout(function()
{
	q.post("channel1", "node 21", (new Date().getTime() / 1000 + 2));
	q.post("channel1", "node 22", 0);
	q.post("channel1", "node 23", 0);

}, 4000);

setTimeout(function()
{
	Q.q_disconnect(queue);
	console.log("done");
}, 30000);

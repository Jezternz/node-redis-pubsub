I ended up writing a small node plugin to allow for many pub-sub clients but only require 2 redis connections instead of a new one on every single socketio connection, it should work in general, figured someone else may find use for it.

This code assumed you have socket.io running and setup, basically in this example any number of socket.io clients can connect and it will always still only use 2 redis connections, but all clients can subscribe to their own channels. In this example, all clients get a message 'sweet message!' after 10 seconds.

Example with socket.io:

    var
        rPubSub = require('rpsc');

    var 
        redOne = redis.createClient(port, host),
        redTwo = redis.createClient(port, host);

    rPubSub.init(redOne);

    io.sockets.on('connection', function(socket){
        var cps = rPubSub.createClient();
        cps.onMessage(function(channel, message){
            socket.emit('message', message);
        });
        io.sockets.on('disconnect', function(socket){
            // Dont actually need to unsub, because end() will cleanup all subs, 
            // but if you need to sometime during the connection lifetime, you can.
            cps.unsubscribe('cool_channel');
            cps.end();
        });
        cps.subscribe('cool_channel')
    });

    setTimeout(function(){
        redTwo.publish('cool_channel', 'sweet message!');
    },10000);
    
Any issues please let me know :)

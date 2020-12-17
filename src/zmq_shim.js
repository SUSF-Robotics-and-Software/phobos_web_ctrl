// Simple shim which translates zmq to websockets and vice versa

const zmq = require('zeromq');
const WebSocketServer = require('websocket').server;
const http = require('http');

async function run() {
    const server = http.createServer();
    server.listen(5021);
    const web_tc_server = new WebSocketServer({
        httpServer: server,
    });

    web_tc_server.on('request', async request => {
        console.log(
            `New connection to WebSocket TC server from ${request.origin}`
        );

        // Accept the request
        const connection = request.accept(null, request.origin);

        // Create ZMQ and connect
        const zmq_tc_sock = new zmq.Request();
        await zmq_tc_sock.bind('tcp://*:5020');
        console.log('ZMQ TC Requester bound on localhost:5020');

        // On a signal from the websocket forward it to the ZMQ socket
        connection.on('message', async message => {
            // Format data in JSON string
            var data = JSON.stringify({ raw_tc: message.utf8Data });

            // Send data to zmq
            console.log(` -> ${data}`);
            zmq_tc_sock.send(data);

            // Wait for reply from zmq
            var reply = await zmq_tc_sock.receive();

            // Forward reply to WebSocket
            connection.send(reply);
        });
        connection.on('close', (code, desc) => {
            zmq_tc_sock.close();
            console.log(`WebSocket TC closed: ${code} - ${desc}`);
        });
    });
}

run();

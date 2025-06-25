#!/usr/bin/env node

/**
 * Module dependencies.
 */
let app = require('./app');
let debug = require('debug')('server:server');
let http = require('http');
let connectDB = require('./config/db');
const { createWebSocketServer } = require('./utils/websocket');

/**
 * Get port from environment and store in Express.
 */

let port = normalizePort(process.env.PORT || '7777');
app.set('port', port);

/**
 * Create HTTP server.
 */

let server = http.createServer(app);

/**
 * Create WebSocket server
 */
const wss = createWebSocketServer(server);

/**
 * Listen on provided port, on all network interfaces.
 */

async function startServer() {
    try {
        // connect db first
        await connectDB();

        // start http server
        server.listen(port);
        server.on('error', onError);
        server.on('listening', onListening);

        console.log(`server is started, listen at: ${port}`);
    } catch (err) {
        console.error('server failed to start', err);
        process.exit(1);
    }
}

// invoke start server
startServer().catch(err => {
    console.error('an error occurred when starting th server:', err);
    process.exit(1);
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    let bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    let addr = server.address();
    let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

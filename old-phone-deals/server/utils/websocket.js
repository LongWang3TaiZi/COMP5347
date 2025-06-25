const WebSocket = require('ws');

// Store all connected clients
const clients = new Set();

// Create WebSocket server
function createWebSocketServer(server) {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        // Add new client
        clients.add(ws);

        // Handle client disconnection
        ws.on('close', () => {
            clients.delete(ws);
        });
    });

    return wss;
}

// Broadcast message to all connected clients
function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

module.exports = {
    createWebSocketServer,
    broadcast
}; 
const express = require('express');
const http = require('http');
const cors = require('cors')
const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 8200;
const API = '/api/v1';
const colors = ['#03cffc', '#1f8023', '#cf6808', '#940000', '#000000', '#ad02a2'];
const faces = [':D', ':)', ':(', ':O', ':/'];

app.use(cors());
app.use(express.static('public'));

app.get(`${API}/status`, (req, res) => {
    const json = {status: 'UP'};
    res.send(json);
});

let positions = {};

io.on('connection', socket => {
    io.emit('user connected', { user: 'a user', message: 'connected' });

    positions[socket.id] = {
        x: randomNumber(600),
        y: randomNumber(600),
        color: getColor(),
        face: getFace()
    };

    socket.emit('setup', positions[socket.id]);

    socket.on('move', (position) => {
        positions[socket.id].x = position.x;
        positions[socket.id].y = position.y;
    });

    socket.on('user message', (msg) => {
        io.emit('user message', { user: 'a user', message: msg });
    });

    socket.on('disconnect', () => {
        delete positions[socket.id];
        io.emit('user disconnected', { user: 'a user', message: 'disconnect', id: socket.id });
    });
});

const t = setInterval(() => {
    io.emit('redraw', positions);
}, 50);

const randomNumber = (max) => {
    return Math.floor(Math.random() * max);
};

const getColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
};

const getFace = () => {
    return faces[Math.floor(Math.random() * faces.length)];
};

server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));

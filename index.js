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
const boundaries = {top: 32, bottom: 992, left: 0, right: 1920};

app.use(cors());
app.use(express.static('public'));

app.get(`${API}/status`, (req, res) => {
    const json = {status: 'UP'};
    res.send(json);
});

let positions = {};
let goodies = {};

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
        positions[socket.id].x = position.x < boundaries.left ? boundaries.left : position.x + 100 > boundaries.right ? boundaries.right - 100 : position.x;
        positions[socket.id].y = position.y < boundaries.top ? boundaries.top : position.y + 100 > boundaries.bottom ? boundaries.bottom - 100 : position.y;

        const collisions = checkGoodyCollisions(socket);
        collisions.forEach(goody => goodyCollide(socket, goody));
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
    io.emit('redraw', {positions, goodies});
}, 50);

const checkGoodyCollisions = socket => {
    return Object.entries(goodies).filter(goody => {
        const xHit = goody[1].x > positions[socket.id].x && goody[1].x < positions[socket.id].x + 100;
        const yHit = goody[1].y > positions[socket.id].y && goody[1].y < positions[socket.id].y + 100;
        return xHit && yHit;
    });
}

const goodyCollide = (socket, goody) => {
    socket.emit('score', {points: 10});
    delete goodies[goody[0]];
    io.emit('remove goody', {id: goody[0]});
    const latestGoody = generateGoody();
    goodies[latestGoody.id] = latestGoody.position;
}

const randomNumber = (max) => {
    return Math.floor(Math.random() * max);
};

const getColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
};

const getFace = () => {
    return faces[Math.floor(Math.random() * faces.length)];
};

const generateGoody = () => {
    return {id: uuidv4(), position: {x: randomNumber(boundaries.right - 24), y: randomNumber(boundaries.bottom - 24)}};
};

const initialGoody = generateGoody();
goodies[initialGoody.id] = initialGoody.position;

server.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));

const path = require('path');
// set up the server to handle socket.io
const http = require("http");
const express = require("express");
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
// set static folder
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

// set up post 
app.post('/', function (req, res) {
    const user = new User({
        username: req.body.username,
        room: req.body.room
    });

    // set up get rout

    app.get('/', function (req, res) {
        res.render("/");
    });

    const botName = 'OnChat';
    // run when client connects
    io.on('connection', socket => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.on('joinRoom', ({ username, room }) => {
            // welcome current user
            socket.emit('message', formatMessage(botName, 'welcome to OnChat!'));

            // Broadcast when a user connects
            socket.broadcast.to(user.room).emit('message', formatMessage(botName,
                `${user.username} has joined the chat`));

            // send users and room info

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        });

        // listen for chat Message
        socket.on('chatMessage', msg => {

            const user = getCurrentUser(socket.id);
            // emit the message to the client
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        });

        // runs when client disconnects 
        socket.on('disconnect', () => {

            const user = userLeave(socket.id);
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            // send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        });

    });

    const port = 5000 || process.env.PORT;

    app.listen(port, function () {
        console.log("Server Started successfully.")
    });
});
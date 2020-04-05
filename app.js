const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require("cors");
//const bcrypt = require("bcrypt");

const indexRouter = require('./router/index');
const chatBySocket = require('./chatBySocket');
const connectDB = require('./connectDB');

const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);

connectDB();

// const hashPass = async () => {
//     const hash = await bcrypt.hash("teo123", 10);
//     console.log(hash);
// }
// hashPass();


app.use(cors());
app.use(indexRouter);
const io = socketIo(server);
chatBySocket(io);

server.listen(PORT, () => console.log(`Server listen on port ${PORT}`));

const app = require("express")();
//const server = require("http").createServer(app);
const cors = require("cors");

const fs = require('fs');
const path = require('path')


var https = require('https');
var options = {
  key: fs.readFileSync('./cert/servicerobotpro/privkey.pem'),
  cert: fs.readFileSync('./cert/servicerobotpro/cert.pem')
};
var server = https.createServer(options, app);

// const privateKey = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/privkey.pem'));
// const certificate = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/cert.pem'));
// const ca = fs.readFileSync(path.resolve(__dirname,'./cert/servicerobotpro/chain.pem'));

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Running");
});

io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", {
      signal: signalData,
      from,
      name,
    });
  });

  socket.on("updateMyMedia", ({ type, currentMediaStatus }) => {
    console.log("updateMyMedia");
    socket.broadcast.emit("updateUserMedia", { type, currentMediaStatus });
  });

  socket.on("msgUser", ({ name, to, msg, sender }) => {
    io.to(to).emit("msgRcv", { name, msg, sender });
  });

  socket.on("answerCall", (data) => {
    socket.broadcast.emit("updateUserMedia", {
      type: data.type,
      currentMediaStatus: data.myMediaStatus,
    });
    io.to(data.to).emit("callAccepted", data);
  });
  socket.on("endCall", ({ id }) => {
    io.to(id).emit("endCall");
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

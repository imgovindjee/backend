const { createServer } = require("http");
const { Server } = require("socket.io");

const app = createServer();

const port = 3500;

const io = new Server(app, {
    cors: ["http://localhost:5173/", "https://imgovindjee.github.io/Tic-Tac-Toe-/"]
});


const allUser = {};
const allRooms = [];

io.on("connection", (socket) => {

    allUser[socket.id] = {
        socket: socket,
        online: true,
    }

    socket.on("request_to_play", (data) => {
        // console.log(data);
        const currentUser = allUser[socket.id];
        currentUser.playerName = data.playerName;
        // console.log(currentUser);

        let opponentPlayer;
        for (const key in allUser) {
            const user = allUser[key]
            if (user.online && !user.playing && socket.id !== key) {
                opponentPlayer = user;
                break;
            }
        }
        if (opponentPlayer) {
            // storing the present values of ARRAY
            allRooms.push({
                player1: opponentPlayer,
                player2: currentUser,
            })

            console.log(opponentPlayer);
            // console.log("opponentPlayer found");
            currentUser.socket.emit("OppoenetFound", {
                opponentName: opponentPlayer.playerName,
                playingAs: "circle",
            })
            opponentPlayer.socket.emit("OppoenetFound", {
                opponentName: currentUser.playerName,
                playingAs: "cross",
            })

            // if recive changes form currnetplayer then
            // needed to return to oppenent player
            // about what the changes is
            currentUser.socket.on("playerMoveFromClient", (data) => {
                console.log(data);
                opponentPlayer.socket.emit("playerMoveFromServer", {
                    ...data,
                })
            })
            // if recive changes form opponentPlayer then
            // needed to return to currentplayer
            // about what the changes is
            opponentPlayer.socket.on("playerMoveFromClient", (data) => {
                console.log(data);
                currentUser.socket.emit("playerMoveFromServer", {
                    ...data,
                })
            })
        } else {
            // console.log("opponentPlayer not found");
            currentUser.socket.emit("OpponentNotFound")
        }
    })


    socket.on("disconnect", () => {
        const currentUser = allUser[socket.id]
        currentUser.online = false;
        currentUser.playing = false;
        // console.log(`User with id-${socket.id} Disconnected`);

        for (let i = 0; i < allRooms.length; i++) {
            const { player1, player2 } = allRooms[i];

            if (player1.socket.id === socket.id) {
                player2.socket.emit("opponentLeftMatch");
                break;
            }
            if (player2.socket.id === socket.id) {
                player1.socket.emit("opponentLeftMatch");
                break;
            }
        }
    })
})





app.listen(port, () => {
    console.log(`Server listening at ${port}`);
})
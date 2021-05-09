const AREA_WIDTH = 3000;
const AREA_HEIGHT = 3000;
const HOST = 'localhost:8000'
const TEXTURE_URL = `http://${HOST}/load_data`;
const WS_URL = `ws://${HOST}/ws`;

let action = {up: false, down: false, left: false, right: false, shot: false};
let lastAction = {};
let sendMovement = false;
let playerId = '';
let playerScore = 0;

let cameraOffsetX = 0;
let cameraOffsetY = 0;


function evaluate_movement(event, action_flag) {
    switch (event.keyCode) {
        case 65: // A
            action.left = action_flag;
            break;
        case 87: // W
            action.up = action_flag;
            break;
        case 68: // D
            action.right = action_flag;
            break;
        case 83: // S
            action.down = action_flag;
            break;
        case 32: // space
            action.shot = action_flag;
            break;
    }
    for (let key in action) {
        if (lastAction[key] !== action[key]) {
            lastAction[key] = action[key];
            sendMovement = true;
        }
    }
}

function handle_message(event, render) {
    let data = JSON.parse(event.data);

    if (data.hasOwnProperty('player_id') && typeof data.player_id === "string") {
        playerId = data.player_id;
    } else {
        let selfObject = data.entities.find((elem) => elem.id === playerId)
        if (selfObject) {
            playerScore = selfObject.score;
        }
        let currentEntities = new Set();
        data.entities.forEach(elem => {
            if (elem.c) {
                [elem.x, elem.y, elem.r,] = elem.c.split(' ')
            } else {
                [elem.x, elem.y, elem.r] = [0, 0, 0]
            }
            currentEntities.add(elem.id);
        });
        render.render_screen(selfObject, data.entities, data.frame_time);
    }
}

function handle_close(event, render) {
    render.game_over('Connection closed')
}

function handle_open_socket(event) {
    socket.send(JSON.stringify({'name': player_name}));
    setInterval(function () {
        if (sendMovement) {
            socket.send(JSON.stringify(action));
            sendMovement = false;
        }
    }, 100);
}

function startGame() {
    const render = new Render()
    render.init()
        .then(() => {
            socket = new WebSocket(WS_URL)
            socket.addEventListener('message', event => handle_message(event, render));
            socket.addEventListener('open', event => handle_open_socket(event));
            socket.addEventListener('close', event => handle_close(event, render));
            document.addEventListener('keydown', event => evaluate_movement(event, true));
            document.addEventListener('keyup', event => evaluate_movement(event, false));
            console.log("Game started")
        })
}

window.onload = startGame;
const SEA_COLOR = "#3d9ae3";
const AREA_WIDTH = 3000;
const AREA_HEIGHT = 3000;
const HOST = 'localhost:8000'
const TEXTURE_URL = `http://${HOST}/load_data`;
const WS_URL = `ws://${HOST}/ws`;

let action = {up: false, down: false, left: false, right: false, shot: false};
let last_action = {};
let send_movement = false;
let player_id = '';
let player_score = 0;


let camera_offset_x = 0;
let camera_offset_y = 0;


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
        if (last_action[key] !== action[key]) {
            last_action[key] = action[key];
            send_movement = true;
        }
    }
}

function handle_message(event, render) {
    let data = JSON.parse(event.data);

    if (typeof data.player_id === "string") {
        player_id = data.player_id;
    } else {
        let self_object = data.entities.find(function (elem) {
            return elem.id === player_id
        })
        if (self_object) {
            player_score = self_object.score;
        }
        data.entities.forEach(elem => {
            if (elem.c) {
                let coords = elem.c.split(' ')
                elem.x = coords[0]
                elem.y = coords[1]
                elem.r = coords[2]
            } else {
                elem.x = 0
                elem.y = 0
                elem.r = 0
            }
        })
        render.render_screen(self_object, data.entities, data.frame_time);
    }
}

function handle_close(event, render) {
    render.game_over('Connection closed')
}

function handle_open_socket(event) {

    socket.send(JSON.stringify({'name': player_name}));
    setInterval(function () {
        if (send_movement) {
            socket.send(JSON.stringify(action));
            send_movement = false;
        }
    }, 100);
}

window.onload = function () {
    async function start() {
        const render = new Render()
        await render.init()
        socket = new WebSocket(WS_URL)
        socket.addEventListener('message', event => handle_message(event, render));
        socket.addEventListener('open', event => handle_open_socket(event));
        socket.addEventListener('close', event => handle_close(event, render));
        document.addEventListener('keydown', event => evaluate_movement(event, true));
        document.addEventListener('keyup', event => evaluate_movement(event, false));
    }

    start().then(function () {
        console.log("Game started")
    });
}

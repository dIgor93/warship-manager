const SEA_COLOR = "#256692";
const AREA_WIDTH = 3000;
const AREA_HEIGHT = 3000;
let DRAW_BORDERS = false;
const HOST = 'steel-rebbot-2.herokuapp.com'
const TEXTURE_URL = `https://${HOST}/load_data`;
const WS_URL = `wss://${HOST}/ws`;

let action = {up: false, down: false, left: false, right: false, shot: false};
let last_action = {};
let send_movement = false;
let player_id = '';
let player_score = 0;

let back_img = new Image();
back_img.src = `static/img/space_contrust.png`;

let camera_offset_x = 0;
let camera_offset_y = 0;

class Render {
    constructor() {
        this.drawingCanvas = document.getElementById('screen');
        this.screen_width = window.innerWidth;
        this.screen_height = window.innerHeight;
        if (this.drawingCanvas && this.drawingCanvas.getContext) {
            this.context = this.drawingCanvas.getContext('2d');
            this.context.canvas.width = this.screen_width;
            this.context.canvas.height = this.screen_height;
        }
        this.resource_data = null
    }

    async init() {
        this.resource_data = await fetch(TEXTURE_URL)
            .then((res) => res.json())
            .catch(err => {
                throw err
            });
        for (let elem in this.resource_data) {
            let img = new Image();
            img.src = `static/img/${this.resource_data[elem].texture}`;
            this.resource_data[elem].texture = img;
        }
        ;
    }

    render_screen(player_data, all_data, effects, frame_time) {
        if (player_data) {
            if (player_data.x > (this.screen_width / 2)) {
                camera_offset_x = this.screen_width / 2 - player_data.x
            }
            if (player_data.x > AREA_WIDTH - (this.screen_width / 2)) {
                camera_offset_x = this.screen_width - AREA_WIDTH
            }
            if (player_data.y > (this.screen_height / 2)) {
                camera_offset_y = this.screen_height / 2 - player_data.y
            }
            if (player_data.y > AREA_HEIGHT - (this.screen_height / 2)) {
                camera_offset_y = this.screen_height - AREA_HEIGHT
            }
            this.context.translate(camera_offset_x, camera_offset_y);
            this.clean_field();
            all_data.forEach((elem) => {
                this.render_entity(elem)
            });
            effects.forEach((elem) => this.animation(elem))
            this.context.translate(-camera_offset_x, -camera_offset_y);
            this.minimap(player_data, all_data)
            this.info(frame_time)
            this.score(player_data)
        } else {
            this.game_over('Game over', player_score)
        }
    }

    clean_field() {
        this.context.drawImage(back_img, 0, 0, AREA_WIDTH, AREA_HEIGHT);
    }

    point(x, y) {
        this.context.beginPath();
        this.context.fillStyle = "rgb(52,251,6)";
        this.context.arc(x, y, 1, 0, 2 * Math.PI, true);
        this.context.fill();
    }

    point_minimap(x, y, color, radius) {
        this.context.beginPath();
        this.context.fillStyle = color;
        this.context.arc(x, y, radius, 0, 2 * Math.PI, true);
        this.context.fill();
    }

    game_over(text, score) {
        this.clean_field()
        this.context.fillStyle = "white";
        this.context.font = 'bold 33px Arial';
        this.context.fillText(text, this.screen_width / 2, this.screen_height / 2 - 17)

        if (score) {
            this.context.fillStyle = "yellow";
            this.context.font = 'bold 33px Arial';
            this.context.fillText(`Score: ${score}`, this.screen_width / 2, this.screen_height / 2 + 17)
        }
    }

    render_entity(elem) {
        this.context.save();
        this.context.translate(elem.x, elem.y);
        this.context.rotate(elem.r);

        let obj = this.resource_data[elem.context_id]
        this.context.drawImage(obj.texture, obj.offset_x, obj.offset_y, obj.width, obj.height);
        this.context.restore();

        switch (elem.type) {
            case 'Player':
            case 'Enemy':
                this.life_count(elem)
                this.nick_name(elem)
                break
        }

        if (DRAW_BORDERS) {
            this.context.rect(elem.aabb[0], elem.aabb[1], elem.aabb[2] - elem.aabb[0], elem.aabb[3] - elem.aabb[1]);
            this.context.stroke();
            this.point(elem.x, elem.y)
            this.context.fillStyle = "rgba(23,236,112,0.58)";
            this.context.strokeStyle = "rgb(23,236,112)";
        }
    }

    life_count(elem) {
        this.context.fillStyle = "black";
        this.context.fillRect(elem.x - elem.hp_max / 2 - 1, elem.aabb[1] - 20, elem.hp_max + 2, 10);
        this.context.fillStyle = "green";
        this.context.fillRect(elem.x - elem.hp_max / 2, elem.aabb[1] - 19, elem.hp, 8);
    }

    nick_name(elem) {
        this.context.fillStyle = "black";
        let width = this.context.measureText(elem.name).width;
        this.context.fillRect(elem.x - elem.hp_max / 2 - 1, elem.aabb[1] - 36, width + 10, 17);

        this.context.fillStyle = "white";
        this.context.font = 'bold 13px Arial';
        this.context.fillText(elem.name, elem.x - elem.hp_max / 2 + 2, elem.aabb[1] - 24, elem.hp_max)
    }

    minimap(player, all_elems) {
        let map_size = 250;
        this.context.drawImage(back_img, this.screen_width - map_size, this.screen_height - map_size, map_size, map_size);
        this.context.strokeStyle = '#18455f';
        this.context.lineWidth = 2;
        this.context.strokeRect(this.screen_width - map_size, this.screen_height - map_size, map_size, map_size);
        all_elems.forEach((elem) => {
            let mini_x = elem.x * map_size / AREA_WIDTH + this.screen_width - map_size
            let mini_y = elem.y * map_size / AREA_HEIGHT + this.screen_height - map_size
            switch (elem.type) {
                case 'Player':
                case 'Enemy':
                    if (player.id === elem.id) {
                        this.point_minimap(mini_x, mini_y, "rgb(92,251,6)", 3);
                    } else {
                        this.point_minimap(mini_x, mini_y, "rgb(251,35,6)", 2)
                    }
                    break;
                case 'Bullet':
                    this.point_minimap(mini_x, mini_y, "rgb(248,176,51)", 1);
            }
        });
    }

    info(info) {
        this.context.fillStyle = "white";
        this.context.font = 'bold 13px Arial';
        this.context.fillText(`frame time: ${Math.round(info * 100000) / 100000}`, this.screen_width - 200, 24)
    }

    score(player) {
        this.context.fillStyle = "yellow";
        this.context.font = 'bold 13px Arial';
        this.context.fillText(`score: ${player.score}`, this.screen_width - 200, 44)
    }

    animation(elem) {
        let animation = this.resource_data[elem.id]
        let frame = animation.frames[elem.step]
        if (frame) {
            this.context.drawImage(animation.texture,
                frame.sx, frame.sy, frame.width, frame.height,
                elem.x - (frame.width / 2), elem.y - (frame.height / 2), frame.width, frame.height);
        }
    }
}


class Animation {
    constructor() {
        this.animation_pool = []
        this.duration = 1000
        this.step_duration = 200
    }

    add_events(list_events) {
        let now = Date.now()
        let ap = this.animation_pool
        list_events.forEach((eff) =>
            this.animation_pool.push({
                'id': eff.id,
                'x': eff.x,
                'y': eff.y,
                'start': now,
                'finish': now + this.duration
            })
        )
    }

    get_current_frames() {
        let now = Date.now()
        let res_anim = [];
        [...this.animation_pool].forEach((elem) => {
            if (Date.now() > elem.finish) {
                let index = this.animation_pool.indexOf(elem)
                this.animation_pool.splice(index, 1);
            } else {
                let step_number = ((now - elem.start) / this.step_duration >> 0)
                res_anim.push({'id': elem.id, 'x': elem.x, 'y': elem.y, 'step': step_number})
            }
        })
        return res_anim
    }
}


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

function handle_message(event, render, animation) {
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
        animation.add_events(data.effects)
        render.render_screen(self_object, data.entities, animation.get_current_frames(), data.frame_time);
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

function render_point(event) {
    console.log(`{"x": ${Math.round(event.x - camera_offset_x)}, "y": ${Math.round(event.y - camera_offset_y)}},`)
}

window.onload = function () {
    async function start() {
        let render = new Render()
        await render.init()
        let animator = new Animation()
        socket = new WebSocket(WS_URL)
        socket.addEventListener('message', event => handle_message(event, render, animator));
        socket.addEventListener('open', event => handle_open_socket(event));
        socket.addEventListener('close', event => handle_close(event, render));
        document.addEventListener('click', event => render_point(event))
        document.addEventListener('keydown', event => evaluate_movement(event, true));
        document.addEventListener('keyup', event => evaluate_movement(event, false));
    }

    start().then(function () {
        console.log("Game started")
    });
}

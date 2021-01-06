const TEXTURE_PATH = 'static/img';
const SPACESHIPS = ['SpaceShip', 'Bot'];

class Render {
    constructor() {
        this.screen_width = window.innerWidth;
        this.screen_height = window.innerHeight;
        this.app = new PIXI.Application({
            width: this.screen_width,
            height: this.screen_height
        });
        document.body.appendChild(this.app.view);

        // for all game objects: game field, players...
        this.stage = new PIXI.Container();
        this.stage.width = AREA_WIDTH
        this.stage.height = AREA_HEIGHT
        this.app.stage.addChild(this.stage);

        // for HUD
        this.hud = new PIXI.Container();
        this.hud.width = this.screen_width
        this.hud.height = this.screen_height
        this.app.stage.addChild(this.hud);

        this.game_containers_hash = new Map();
        this.resource_data = null;
        this.previous_objects = [];
        this.game_started = false;
        this.score = 0;
    }

    async init() {
        this.resource_data = await fetch(TEXTURE_URL)
            .then((res) => res.json())
            .catch(err => {
                throw err
            });

        for (let elem in this.resource_data) {
            this.resource_data[elem].pixi_texture = PIXI.Texture.from(
                `${TEXTURE_PATH}/${this.resource_data[elem].texture}`
            );
        }
        this.init_stars();

        this.minimap = new Minimap(this.screen_width, this.screen_height, 250);
        this.hud.addChild(this.minimap.getGraphicsObj());

        this.scoreText = this.info_text(this.screen_width - 10, this.screen_height - 280);
        this.hud.addChild(this.scoreText);

        this.fpsText = this.info_text(this.screen_width - 10, this.screen_height - 260);
        this.hud.addChild(this.fpsText);

        this.bonus = new Bonus(this.screen_width - 60, 160);
        this.hud.addChild(this.bonus.getContainer());
    }

    info_text(x, y) {
        const style = new PIXI.TextStyle({
            fontFamily: 'Courier New',
            fontSize: 15,
            fontWeight: 'bold',
            fill: '#f8f8f8'
        });
        const textObject = new PIXI.Text('---', style);
        textObject.anchor.set(1);
        textObject.x = x;
        textObject.y = y;
        return textObject;
    }

    init_stars() {
        const starsTextureLevelFirst = PIXI.Texture.from(`${TEXTURE_PATH}/stars_layer_1.png`);
        const starsTextureLevelSecond = PIXI.Texture.from(`${TEXTURE_PATH}/stars_layer_2.png`);

        this.starsContainerLevelFirst = new PIXI.Container();
        this.starsContainerLevelSecond = new PIXI.Container();

        function init_stars(pixi_texture, pixi_container, main_stage, tile_size) {
            main_stage.addChild(pixi_container);

            for (let h = 0; h <= AREA_HEIGHT / tile_size + 1; h++) {
                for (let w = 0; w <= AREA_WIDTH / tile_size + 1; w++) {
                    const space_tile = new PIXI.Sprite(pixi_texture);
                    space_tile.x = (w) * tile_size
                    space_tile.y = (h) * tile_size
                    pixi_container.addChild(space_tile)
                }
            }
        }

        init_stars(starsTextureLevelFirst, this.starsContainerLevelFirst, this.stage, 500);
        init_stars(starsTextureLevelSecond, this.starsContainerLevelSecond, this.stage, 300);
    }

    evaluate_camera_offset(player_x, player_y) {
        if (player_x > (this.screen_width / 2)) {
            camera_offset_x = this.screen_width / 2 - player_x
        }
        if (player_x > AREA_WIDTH - (this.screen_width / 2)) {
            camera_offset_x = this.screen_width - AREA_WIDTH
        }
        if (player_y > (this.screen_height / 2)) {
            camera_offset_y = this.screen_height / 2 - player_y
        }
        if (player_y > AREA_HEIGHT - (this.screen_height / 2)) {
            camera_offset_y = this.screen_height - AREA_HEIGHT
        }
        return [camera_offset_x, camera_offset_y];
    }

    move_stars(camera_offset_x, camera_offset_y) {
        const ratio_x = 0.3;
        const ratio_y = 0.1;

        this.starsContainerLevelFirst.x = camera_offset_x * ratio_x;
        this.starsContainerLevelFirst.y = camera_offset_y * ratio_x;

        this.starsContainerLevelSecond.x = camera_offset_x * ratio_y;
        this.starsContainerLevelSecond.y = camera_offset_y * ratio_y;
    }

    move_camera(camera_offset_x, camera_offset_y) {
        this.stage.pivot.x = -1 * camera_offset_x;
        this.stage.pivot.y = -1 * camera_offset_y;
    }

    render_entity(elem, is_main_player) {
        if (!this.game_containers_hash.has(elem.id)) {
            let newContainer = this.register_container(elem);
            if (SPACESHIPS.includes(elem.type)) {
                this.register_lifeline(elem, newContainer);
                this.register_nickname(elem, newContainer, is_main_player);
                if (this.kek === undefined) {
                    this.kek = 1;
                    // this.bonus.addBonus('shoot_bonus');
                }
            }
        }
        let cont = this.game_containers_hash.get(elem.id);
        cont.x = elem.x;
        cont.y = elem.y;
        cont.getChildAt(0).rotation = elem.r; // крутим спрайт
        if (SPACESHIPS.includes(elem.type)) {
            this.update_life_count(elem, cont);
        }
    }

    update_life_count(elem, cont) {
        let hp_graph = cont.getChildAt(1);
        hp_graph.width = elem.hp;
    }

    register_container(elem) {
        const res_data = this.resource_data[elem.context_id]

        const sprite = new PIXI.Sprite(this.resource_data[elem.context_id].pixi_texture);
        sprite.anchor.set(
            -1 * res_data.offset_x / res_data.width,
            -1 * res_data.offset_y / res_data.height
        );
        sprite.width = res_data.width;
        sprite.height = res_data.height;

        const containerElement = new PIXI.Container();
        containerElement.addChild(sprite)

        this.stage.addChild(containerElement);
        this.game_containers_hash.set(elem.id, containerElement);
        return containerElement;
    }

    register_lifeline(elem, container) {
        let bounds = container.getChildAt(0).getLocalBounds();
        const greenLine = new PIXI.Graphics();
        greenLine.beginFill(0x10f50f);
        greenLine.drawRect(-elem.hp_max / 2, bounds.y + 1, elem.hp + 2, 8);
        greenLine.endFill()
        container.addChild(greenLine);
    }

    register_nickname(elem, container, is_main_player) {
        let bounds = container.getChildAt(0).getLocalBounds();

        const style = new PIXI.TextStyle({
            fontFamily: 'Courier New',
            fontSize: 15,
            fontWeight: 'bold',
            fill: '#5394BA',
        })
        if (is_main_player) {
            style.fill = '#FFFFFF';
        }
        const richText = new PIXI.Text(elem.name, style);
        richText.y = bounds.y - 8;
        richText.anchor.set(0.5);
        container.addChild(richText);
    }

    unregister_container(_id) {
        let del_container = this.game_containers_hash.get(_id);

        const x = del_container.x;
        const y = del_container.y;
        this.stage.addChild(this.explode_mini(x, y));

        this.game_containers_hash.delete(_id);
        del_container.destroy();
    }

    render_screen(player_object, inner_objects, frame_time) {
        if (player_object) {
            const [camera_x, camera_y] = this.evaluate_camera_offset(player_object.x, player_object.y)

            this.move_stars(camera_x, camera_y);
            this.move_camera(camera_x, camera_y);

            // cleanup expired object containers
            const curr_ids = Array.from(inner_objects, x => x.id);
            this.previous_objects.filter(x => !curr_ids.includes(x))
                .forEach((elem) => this.unregister_container(elem));
            this.previous_objects = curr_ids;

            // render input objects
            inner_objects.forEach((elem) => {
                if (elem.id === player_object.id) {
                    this.render_entity(elem, true);
                } else {
                    this.render_entity(elem, false);
                }
            })
            this.scoreText.text = `score: ${player_object.score}`;
            this.fpsText.text = `frame time: ${frame_time.toFixed(4)}`;
            this.minimap.update(player_object, inner_objects);
            this.bonus.update(player_object.bonuses);

            this.game_started = true;
            this.score = player_object.score;
        } else {
            if (this.game_started) {
                this.gameOver("Game over", this.score);
                this.game_started = false;
            }
        }
    }

    explode_mini(x ,y) {
        let textureArray = [];

        const baseTexture = PIXI.Texture.from(`${TEXTURE_PATH}/explosive.png`);
        const orig = new PIXI.Rectangle (0, 0, 100, 100);

        for (let i = 0; i < 8; i++) {
            const frame = new PIXI.Rectangle (i * 100, 0, 100, 100);
            let texture = new PIXI.Texture(baseTexture, frame, orig);
            textureArray.push(texture);
        }
        let animatedSprite = new PIXI.AnimatedSprite(textureArray);
        animatedSprite.animationSpeed=0.15;
        animatedSprite.x = x;
        animatedSprite.y = y;
        animatedSprite.anchor.set(0.5);
        animatedSprite.loop = false;
        animatedSprite.onComplete = function () {
            this.destroy();
         };
        animatedSprite.play();
        return animatedSprite
    }

    gameOver(text, score) {
        const style = new PIXI.TextStyle({
            fontFamily: "Times New Roman",
            fontSize: 50,
            fontWeight: 'bold',
            fill: '#ffe907',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 5,
            dropShadowAngle: -4.2,
            dropShadowDistance: 1,
        })
        const richText = new PIXI.Text(text, style);
        richText.anchor.set(0.5);
        richText.x = this.screen_width / 2;
        richText.y = this.screen_height / 2 - 17;
        this.app.stage.addChild(richText);

        if (score !== undefined) {
            const richText = new PIXI.Text(`Score: ${score}`, style);
            richText.anchor.set(0.5);
            richText.x = this.screen_width / 2;
            richText.y = this.screen_height / 2 + 30;
            this.app.stage.addChild(richText);
        }
        const restartStyle = new PIXI.TextStyle({
            fill: "white",
            fontFamily: "Times New Roman",
            fontSize: 23,
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 5,
            dropShadowAngle: -4.2,
            dropShadowDistance: 1,
        })
        const restartText = new PIXI.Text('press F5 for new game', restartStyle);
        restartText.anchor.set(0.5);
        restartText.x = this.screen_width / 2;
        restartText.y = this.screen_height - 30;
        this.app.stage.addChild(restartText);
    }
}

class Minimap {
    constructor(screen_width, screen_height, map_size) {
        this.map_size = map_size;
        this.screen_width = screen_width;
        this.screen_height = screen_height;
        this.graphics = new PIXI.Graphics();
    }

    getGraphicsObj() {
        return this.graphics;
    }

    point(x, y, color, radius) {
        this.graphics.lineStyle(2, color, 1);
        this.graphics.beginFill(color);
        this.graphics.drawRect(x, y, radius, radius);
        this.graphics.endFill();
    }

    update(player, all_elements) {
        this.graphics.clear();
        this.graphics.lineStyle(4, 0x103758, 1);
        this.graphics.beginFill(0x18455F, 0.6);
        this.graphics.drawRect(
            this.screen_width - this.map_size,
            this.screen_height - this.map_size,
            this.map_size,
            this.map_size
        );
        this.graphics.endFill()
        all_elements.forEach((elem) => {
            let mini_x = elem.x * this.map_size / AREA_WIDTH + this.screen_width - this.map_size
            let mini_y = elem.y * this.map_size / AREA_HEIGHT + this.screen_height - this.map_size
            if (SPACESHIPS.includes(elem.type)) {
                if (player.id === elem.id) {
                    this.point(mini_x, mini_y, 0xFFFFFF, 3);
                } else {
                    this.point(mini_x, mini_y, 0x256692, 2)
                }
            }
        });
    }
}

class Bonus {
    constructor(position_x, position_y) {
        this.bonusesMap = {};
        this.bonusCount = 0;
        this.bonusBar = new PIXI.Container();
        this.bonusBar.x = position_x;
        this.bonusBar.y = position_y;
    }

    addBonus(name) {
        const mapping = {
            'fire_egg': 'shoot_bonus',
            'fast_egg': 'move_bonus'
        }
        const cont = new PIXI.Container();

        const graphics = new PIXI.Graphics();
        graphics.lineStyle(15, 0x149101, 1);
        graphics.arc(0, 0, 23, 0, 2 * Math.PI * (25/25));
        graphics.lineStyle(2, 0x000000, 1);
        graphics.arc(0, 0, 30, 0, 2 * Math.PI * (25/25));
        cont.addChild(graphics);

        const texture = PIXI.Texture.from(`${TEXTURE_PATH}/${mapping[name]}.png`);
        const sprite = new PIXI.Sprite(texture);
        sprite.width = 45;
        sprite.height = 45;
        sprite.anchor.set(0.5);
        cont.addChild(sprite);

        cont.y = this.bonusCount * 75;

        this.bonusBar.addChild(cont);
        this.bonusesMap[name] = {container: cont, timer: 0};
        this.bonusCount ++;
    }

    update(bonuses) {
        bonuses.forEach((elem) => {
            if (!this.bonusesMap.hasOwnProperty(elem.context)) {
                this.addBonus(elem.context);
            }
            const bonus = this.bonusesMap[elem.context];
            bonus.timer = elem.curr_timer/elem.full_timer;

            const graphics = bonus.container.getChildAt(0);
            graphics.clear();
            graphics.lineStyle(15, this.colorMapping(bonus.timer), 1);
            graphics.arc(0, 0, 23, 0, 2 * Math.PI * (bonus.timer));
            graphics.lineStyle(2, 0x000000, 1);
            graphics.arc(0, 0, 30, 0, 2 * Math.PI * (bonus.timer));
        });
        this.cleanZeroTimers();
    }

    cleanZeroTimers() {
        let keysForDelete = [];
        for (let key in this.bonusesMap) {
            if (this.bonusesMap[key].timer < 0.01) {
                this.bonusesMap[key].container.destroy();
                keysForDelete.push(key);
            }
        }

        keysForDelete.forEach((elem) => {
            delete this.bonusesMap[elem];
            this.bonusCount --;
        })
    }

    colorMapping(value) {
        if (value > 0.5) return 0x10f50f;
        if (value > 0.25) return 0xFFA200;
        return 0xC60000;
    }

    getContainer() {
        return this.bonusBar;
    }
}
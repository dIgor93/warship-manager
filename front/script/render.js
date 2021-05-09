const TEXTURE_PATH = 'static/img';
const SPACESHIPS = ['SpaceShip', 'Bot'];
const SPRITE_MAP_PATH = 'static/spriteMaps';
let player_object = null;
let resources = {};

class Render {
    constructor() {
        this.screen_width = window.innerWidth;
        this.screen_height = window.innerHeight;
        this.previousObjIds = new Set();
        this.app = new PIXI.Application({
            width: this.screen_width,
            height: this.screen_height,
            backgroundColor: '0x1d1e1f'
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

        this.game_started = false;
        this.score = 0;
        this.player_object = null;

        this.ship_manager = new SpaceShipManager();
        this.object_manager = new ObjectManager(this.stage);
    }

    loadJson(url) {
        return fetch(url)
            .then(response => {
                if (response.status == 200) {
                    return response.json();
                } else {
                    throw new Error(response.status);
                }
            })
    }

    add_resources() {
        this.loadJson(TEXTURE_URL)
            .then((res_data) => {
                for (let key in res_data) {
                    resources[key] = res_data[key]
                    if (res_data[key].hasOwnProperty('animation_sprite')) {
                        PIXI.Loader.shared.add(key, `${SPRITE_MAP_PATH}/${res_data[key].animation_sprite}.json`);
                    }
                }
            })
    }

    async init() {
        this.add_resources()
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
            cameraOffsetX = this.screen_width / 2 - player_x
        }
        if (player_x > AREA_WIDTH - (this.screen_width / 2)) {
            cameraOffsetX = this.screen_width - AREA_WIDTH
        }
        if (player_y > (this.screen_height / 2)) {
            cameraOffsetY = this.screen_height / 2 - player_y
        }
        if (player_y > AREA_HEIGHT - (this.screen_height / 2)) {
            cameraOffsetY = this.screen_height - AREA_HEIGHT
        }
        return [cameraOffsetX, cameraOffsetY];
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

    render_screen(innerPlayerObject, innerObjects, frameTime) {
        PIXI.Loader.shared.load();
        if (!PIXI.Loader.shared.resources['main_spaceship'].spritesheet) {
            console.log('Not loaded')
            return;
        }
        player_object = innerPlayerObject;
        if (player_object) {
            let innerObjIds = new Set(innerObjects.map((elem) => elem.id));
            let removedEntityIds = new Set([...this.previousObjIds].filter(x => !innerObjIds.has(x)));
            let newEntityIds = new Set([...innerObjIds].filter(x => !this.previousObjIds.has(x)));

            const [camera_x, camera_y] = this.evaluate_camera_offset(player_object.x, player_object.y)

            this.move_stars(camera_x, camera_y);
            this.move_camera(camera_x, camera_y);

            this.ship_manager.registerNew(innerObjects, newEntityIds, this.stage);
            this.ship_manager.cleanup(removedEntityIds);

            this.object_manager.registerNew(innerObjects, newEntityIds, this.stage);
            this.object_manager.cleanup(removedEntityIds);

            this.ship_manager.update(innerObjects);
            this.object_manager.update(innerObjects);
            this.minimap.update(player_object, innerObjects);
            this.bonus.update(player_object.bonuses);

            this.scoreText.text = `score: ${player_object.score}`;
            this.fpsText.text = `frame time: ${frameTime.toFixed(4)}`;

            this.game_started = true;
            this.previousObjIds = innerObjIds;
        } else {
            if (this.game_started) {
                this.gameOver("Game over", this.score);
                this.game_started = false;
            }
        }
    }

    gameOver(text, score) {
        const style = new PIXI.TextStyle({
            fontFamily: "Times New Roman",
            fontSize: 50,
            fontWeight: 'bold',
            fill: '#f4f8f6',
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
        const restartText = new PIXI.Text('refresh page for new game...', restartStyle);
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
        graphics.arc(0, 0, 23, 0, 2 * Math.PI * (25 / 25));
        graphics.lineStyle(2, 0x000000, 1);
        graphics.arc(0, 0, 30, 0, 2 * Math.PI * (25 / 25));
        cont.addChild(graphics);

        const baseTexture = PIXI.Texture.from(`${TEXTURE_PATH}/${mapping[name]}.png`);
        const rectangle = new PIXI.Rectangle(0, 0, 100, 100);
        const texture = new PIXI.Texture(baseTexture, rectangle, rectangle);
        const sprite = new PIXI.Sprite(texture);
        sprite.width = 65;
        sprite.height = 65;
        sprite.x = -2; // подровнял, возможно потом можно удалить
        sprite.anchor.set(0.5);
        cont.addChild(sprite);

        cont.y = this.bonusCount * 75;

        this.bonusBar.addChild(cont);
        this.bonusesMap[name] = {container: cont, timer: 0};
        this.bonusCount++;
    }

    update(bonuses) {
        bonuses.forEach((elem) => {
            if (!this.bonusesMap.hasOwnProperty(elem.context)) {
                this.addBonus(elem.context);
            }
            const bonus = this.bonusesMap[elem.context];
            bonus.timer = elem.curr_timer / elem.full_timer;

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
        let counter = 0;
        for (let key in this.bonusesMap) {
            if (this.bonusesMap[key].timer < 0.01) {
                this.bonusesMap[key].container.destroy();
                keysForDelete.push(key);
            } else {
                this.bonusesMap[key].container.y = 75 * counter;
                counter++;
            }
        }

        keysForDelete.forEach((elem) => {
            delete this.bonusesMap[elem];
            this.bonusCount--;
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

class SpaceShipManager {
    constructor() {
        this.spacehips = {};
    }

    createSpaceship(id, type, nickname, isMainPlayer) {
        const mainContainer = new PIXI.Container()
        let spaceShipObj = {
            'type': type,
            'animations': {},
            'mainContainer': mainContainer,
            'nickname': this.nickname(nickname, mainContainer, isMainPlayer),
            'lifeline': this.lifeline(mainContainer),
        };
        const resource = PIXI.Loader.shared.resources[type]
        const animations = resource.spritesheet.animations;
        for (let id in animations) {
            const animatedSprite = new PIXI.AnimatedSprite(animations[id]);
            animatedSprite.visible = false;
            animatedSprite.animationSpeed = 0.2;
            animatedSprite.anchor.set(0.5);
            spaceShipObj.animations[id] = animatedSprite
            spaceShipObj.mainContainer.addChild(animatedSprite)
        }

        this.spacehips[id] = spaceShipObj;
        spaceShipObj.mainContainer.addChild(spaceShipObj.nickname, spaceShipObj.lifeline);
        return spaceShipObj.mainContainer;
    }

    nickname(nickname, container, is_main_player) {
        const style = new PIXI.TextStyle({
            fontFamily: 'Courier New',
            fontSize: 15,
            fontWeight: 'bold',
            fill: '#f8f8f8'
        })
        if (is_main_player) {
            style.fill = '#FFFFFF';
        }
        const richText = new PIXI.Text(nickname, style);
        richText.y = -65;
        richText.anchor.set(0.5);
        return richText;
    }

    lifeline() {
        return new PIXI.Graphics();
    }

    colorMapping(value) {
        if (value > 0.5) return 0x10f50f;
        if (value > 0.25) return 0xFFA200;
        return 0xC60000;
    }

    updateLifeline(current, max, container) {
        const width = 100;
        const heigth = 7;
        container.clear();
        container.beginFill(0x141414);
        container.drawRect(-50, -55, width, heigth);
        container.endFill();

        const percent = current / max;

        container.beginFill(this.colorMapping(percent));
        container.drawRect(-50, -55, width * percent, heigth);
        container.endFill();
    }

    registerNew(innerObjects, newEntityIds, stage) {
        innerObjects.forEach((elem) => {
            if (newEntityIds.has(elem.id)) {
                if (SPACESHIPS.includes(elem.type)) {
                    stage.addChild(this.createSpaceship(elem.id, elem.context_id, elem.name, player_object === elem))
                }
            }
        })
    }

    update(elements) {
        for (let key in this.spacehips) {
            const sourceElem = elements.find((elem) => elem.id === key)
            if (sourceElem && this.spacehips.hasOwnProperty(sourceElem.id)) {
                const currElem = this.spacehips[sourceElem.id]

                let animForPlay = sourceElem.state
                if (!currElem.animations[animForPlay]) {
                    animForPlay = 'default'
                }

                for (let animName in currElem.animations) {
                    if (animName === animForPlay) {
                        currElem.animations[animName].visible = true;
                        if (!currElem.animations[animName].playing) {
                            currElem.animations[animName].play();
                        }
                        currElem.animations[animName].rotation = sourceElem.r;
                    } else {
                        currElem.animations[animName].visible = false;
                        if (currElem.animations[animName].playing) {
                            currElem.animations[animName].stop();
                        }
                    }
                }
                currElem.mainContainer.x = sourceElem.x;
                currElem.mainContainer.y = sourceElem.y;

                this.updateLifeline(sourceElem.hp, sourceElem.hp_max, currElem.lifeline);
            }
        }
    }

    cleanup(removedEntityIds) {
        removedEntityIds.forEach((_id) => {
            if (this.spacehips.hasOwnProperty(_id)) {
                this.spacehips[_id].mainContainer.destroy();
                delete this.spacehips[_id];
            }
        })
    }
}

class ObjectManager {
    constructor(stage) {
        this.objects = {};
        this.stage = stage
    }

    registerNew(innerObjects, newEntityIds) {
        innerObjects.forEach((elem) => {
            if ((newEntityIds.has(elem.id)) && (![...SPACESHIPS].includes(elem.type))) {

                const animations = PIXI.Loader.shared.resources[elem.context_id]
                let animatedSprite = new PIXI.AnimatedSprite(animations.spritesheet.animations['default']);
                animatedSprite.visible = true;
                animatedSprite.animationSpeed = 0.1;
                const modelInfo = resources[elem.context_id]
                animatedSprite.anchor.set(
                    Math.abs(modelInfo['offset_x'] / modelInfo['width']),
                    Math.abs(modelInfo['offset_y'] / modelInfo['height'])
                );
                animatedSprite.play();

                // const graphics = new PIXI.Graphics();
                // graphics.beginFill(0xFF3300);
                // graphics.lineStyle(4, 0xffd900, 1);
                // graphics.moveTo(elem['bounds'][0][0], elem['bounds'][0][1]);
                //
                // elem['bounds'].forEach((elem) => {
                //     graphics.lineTo(elem[0], elem[1]);
                // })
                // graphics.closePath();
                // graphics.endFill();
                // this.stage.addChild(graphics);

                if (animatedSprite) {
                    this.objects[elem.id] = {'animatedSprite': animatedSprite, 'contextId': elem.context_id}
                    this.stage.addChild(animatedSprite)
                } else {
                    console.log(`Animated sprite for ${elem.context_id}, ${elem.id} not found`)
                }
            }
        })
    }

    update(elements) {
        for (let key in this.objects) {
            const sourceElem = elements.find((elem) => elem.id === key)
            if (sourceElem && this.objects.hasOwnProperty(sourceElem.id)) {
                const currElem = this.objects[sourceElem.id].animatedSprite

                currElem.rotation = sourceElem.r;
                currElem.x = sourceElem.x;
                currElem.y = sourceElem.y;
            }
        }
    }

    ondestroyAnimations(_id) {
        let elem = this.objects[_id].animatedSprite
        let contextId = this.objects[_id].contextId
        const stage = this.stage
        const objects = this.objects

        const animations = PIXI.Loader.shared.resources[contextId].spritesheet.animations;
        if (animations.hasOwnProperty('dead')) {
            let animatedSprite = new PIXI.AnimatedSprite(animations['dead']);
            animatedSprite.visible = true;
            animatedSprite.animationSpeed = 0.1;
            animatedSprite.anchor.set(0.5);
            animatedSprite.x = elem.x;
            animatedSprite.y = elem.y;
            animatedSprite.angle = 360 * Math.random();
            animatedSprite.loop = false;
            animatedSprite.play();
            animatedSprite.onComplete = function () {
                this.destroy();
            }
            stage.addChild(animatedSprite)
            objects[elem.id] = {'animatedSprite': animatedSprite, 'contextId': contextId};
        }
    }

    cleanup(removedEntityIds) {
        removedEntityIds.forEach((_id) => {
            if (this.objects.hasOwnProperty(_id)) {
                this.ondestroyAnimations(_id)
                this.objects[_id].animatedSprite.destroy();
                delete this.objects[_id];
            }
        })
    }
}

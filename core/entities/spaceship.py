import core.entities as ee
from core.entities.bonus import Bonus, BonusSystem
from core.entity_manager import EntityManager
from core.models import SpaceShipModel


class GunState:
    def __init__(self, speed):
        self.is_shooting = False
        self.shot_counter = 0
        self.shot_speed = speed


class SpaceShip(ee.Entity):
    def __init__(self,
                 x: float,
                 y: float,
                 r: float,
                 uid: str,
                 ship_model: SpaceShipModel,
                 prepared_name):
        super().__init__(x, y, r, ship_model.content_id)
        self.id = uid
        self.name = prepared_name
        self.ship_model = ship_model
        self.physics.load_points(ship_model.points, ship_model.offset_x, ship_model.offset_y)
        self.physics.vector_motion.set_delta(ship_model.acceleration)
        self.physics.vector_motion.set_max_current(ship_model.speed)
        self.physics.angle_motion.set_delta(ship_model.mobility)

        self.physics.eval_approximately_aabb()
        self.gun_state = GunState(ship_model.shot_speed)
        self.hp = ship_model.hp_max
        self.hp_max = ship_model.hp_max
        self.score = 0
        self.__bonus_system = BonusSystem()

    def set_shooting(self, flag):
        if flag:
            self.gun_state.is_shooting = True
        else:
            self.gun_state.is_shooting = False

    def shooting(self, time_delta):
        if self.gun_state.is_shooting:
            if self.gun_state.shot_counter <= 0:
                self.gun_state.shot_counter = 1 / self.gun_state.shot_speed
                EntityManager().create_bullet(self.x, self.y, self.r, self)
            else:
                self.gun_state.shot_counter -= time_delta

    def action_on_collision(self, entity):
        if isinstance(entity, SpaceShip) or isinstance(entity, ee.Statics):
            self.physics.rollback()
        if isinstance(entity, Bonus):
            pass

    def next(self, t: float):
        super(SpaceShip, self).next(t)
        self.shooting(t)
        self.__bonus_system.update(t)

        _moving = self.physics.get_moving()
        if self.__bonus_system.check_for('fast_egg'):
            if _moving == 1:
                self.state = 'forward_boost'
            elif _moving == -1:
                self.state = 'backward_boost'
        else:
            if _moving == 1:
                self.state = 'forward'
            elif _moving == -1:
                self.state = 'backward'

    def get_info(self):
        data = super(SpaceShip, self).get_info()
        additional_info = {'hp': self.hp,
                           'hp_max': self.hp_max,
                           'name': self.name,
                           'score': self.score
                           }
        data.update(additional_info)
        data.update(self.__bonus_system.get_info())
        return data

    def on_dead(self):
        EntityManager().create_bonus(self.x, self.y)

    def reg_bonus(self, egg_obj):
        egg_obj.set_target(self)
        self.__bonus_system.register(egg_obj)

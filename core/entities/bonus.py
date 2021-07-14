from abc import ABC, abstractmethod
from enum import Enum

from core.entities import Entity
import core.entities as ee
from core.storage import ResourceStorage

characteristic = Enum('bonus_shoot', 'bonus_speed')


class Egg(ABC):
    def __init__(self):
        self.expired = False
        self._applied = False
        self._full_timer = 0
        self._timer = 0
        self._target = None
        self._context = 'default_egg'

    def set_target(self, target):
        self._target = target

    def get_target(self):
        return self._target

    def reset_timer(self):
        self._timer = self._full_timer

    def update(self, delta_time):
        if not self._applied:
            self._applied = True
            self._full_timer = self._timer
            self._apply()
        self._timer -= delta_time
        if self._timer <= 0:
            self.expired = True
            self._unapply()

    def get_info(self):
        return {'full_timer': self._full_timer,
                'curr_timer': self._timer,
                'context': self._context}

    @abstractmethod
    def _apply(self):
        pass

    @abstractmethod
    def _unapply(self):
        pass


class FireEgg(Egg):
    def __init__(self):
        super().__init__()
        self._context = 'fire_egg'
        self._timer = 20

    def _apply(self):
        self.shoot_speed = self._target.gun_state.shot_speed
        self._target.gun_state.shot_speed *= 1.5

    def _unapply(self):
        self._target.gun_state.shot_speed = self.shoot_speed


class FasterEgg(Egg):
    def __init__(self):
        super().__init__()
        self._context = 'fast_egg'
        self._timer = 25

    def _apply(self):
        self._target.physics.vector_motion.set_delta(self._target.ship_model.acceleration * 2)
        self._target.physics.vector_motion.set_max_current(self._target.ship_model.speed * 1.3)
        self._target.physics.angle_motion.set_delta(self._target.ship_model.mobility * 2)

    def _unapply(self):
        self._target.physics.vector_motion.set_delta(self._target.ship_model.acceleration)
        self._target.physics.vector_motion.set_max_current(self._target.ship_model.speed)
        self._target.physics.angle_motion.set_delta(self._target.ship_model.mobility)


class Bonus(Entity):
    def __init__(self, x, y, char: characteristic):
        if char == 'bonus_shoot':
            egg = FireEgg()
        else:
            egg = FasterEgg()
        bonus = ResourceStorage().get_bonus(char)
        super().__init__(x, y, 0, char)
        self.hp = bonus.hp_max
        self.physics.load_points(bonus.points, bonus.offset_x, bonus.offset_y)
        self.egg = egg

    def action_on_collision(self, entity):
        if isinstance(entity, ee.SpaceShip):
            entity.reg_bonus(self.egg)
            self.hp = 0


class BonusSystem:
    def __init__(self):
        self._bonuses = []

    def update(self, delta_time):
        for bonus in self._bonuses[::]:
            bonus.update(delta_time)
            if bonus.expired:
                self._bonuses.remove(bonus)

    def register(self, egg_object: Egg):
        for b in self._bonuses:
            if (b.get_target() == egg_object.get_target()) and (type(b) == type(egg_object)):
                b.reset_timer()
                return
        self._bonuses.append(egg_object)

    def get_info(self):
        return {'bonuses': [x.get_info() for x in self._bonuses]}

    def check_for(self, bonus_context_name):
        for bonus in self._bonuses:
            if bonus.get_info()['context'] == bonus_context_name:
                return True
        else:
            return False



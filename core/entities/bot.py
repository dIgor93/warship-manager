import uuid
from random import randint

import core.entities as be
from core.models import SpaceShipModel


class Bot(be.SpaceShip):
    def __init__(self,
                 x: float,
                 y: float,
                 ship_model: SpaceShipModel):
        super(Bot, self).__init__(x, y, randint(0, 360), f'bot-{str(uuid.uuid1())[:8]}', ship_model, '')
        self.action_recorder = ActionRecorder()

        self.action_recorder.add_to_pool(150, self.set_moving, randint(-1, 1), 1)
        self.action_recorder.add_to_pool(250, self.set_moving, randint(-1, 1), 1)

    def action_on_collision(self, entity):
        super().action_on_collision(entity)
        if isinstance(entity, be.SpaceShip):
            pass
        elif isinstance(entity, be.Statics):
            self.action_recorder.clear_pool()
            self.action_recorder.add_to_pool(randint(20, 250), self.set_moving, randint(-1, 1), 0)
            self.action_recorder.add_to_pool(150, self.set_moving, randint(-1, 1), 1)
            self.action_recorder.add_to_pool(250, self.set_moving, randint(-1, 1), 1)
            self.action_recorder.add_to_pool(100, self.set_moving, randint(-1, 1), 1)
            self.action_recorder.add_to_pool(1, self.set_moving, 0, 1)
        elif isinstance(entity, be.Bullet):
            pass
        elif isinstance(entity, be.Bonus):
            pass
        else:
            print(f'Enemy. Not described case for type {type(entity)}')

    def next(self, t: float):
        super().next(t)
        self.action_recorder.do_tick()
        self.set_shooting(1)


class ActionRecorder:
    def __init__(self):
        self.pool = []

    def add_to_pool(self, count, func, *args):
        self.pool.append({'func': func, 'args': args, 'count': count})

    def do_tick(self):
        if self.pool:
            action = self.pool[0]
            action['func'](*action['args'])
            action['count'] -= 1
            if action['count'] <= 0:
                self.pool.pop(0)

    def clear_pool(self):
        self.pool.clear()

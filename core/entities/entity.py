import uuid

from core.physics import CasualPhysics


class Entity:
    def __init__(self, x: float, y: float, r: float, context: str):
        self.id = f'entity-{str(uuid.uuid1())[:8]}'
        self.hp = 1
        self.context_id = context
        self.state = 'default'
        self.physics: CasualPhysics = CasualPhysics(x, y, r)

    @property
    def x(self):
        return self.physics.x

    @property
    def y(self):
        return self.physics.y

    @property
    def r(self):
        return self.physics.r

    def next(self, t: float):
        self.state = 'default'
        self.physics.update(t)

    def action_on_collision(self, entity):
        pass

    def set_moving(self, rotate, direction):
        self.physics.angle_motion.set_moving(rotate)
        self.physics.vector_motion.set_moving(direction)

    def get_info(self):
        return {'id': self.id,
                'type': type(self).__name__,
                'c': f'{int(self.x)} {int(self.y)} {round(self.r, 2)}',
                'context_id': self.context_id,
                'state': self.state
                # 'bounds': self.physics.bounds
                }

    def on_dead(self):
        pass

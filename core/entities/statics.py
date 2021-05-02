import uuid

from core.entities.entity import Entity
from core.models import StaticsModel


class Statics(Entity):
    def __init__(self, x, y, r, model: StaticsModel):
        super(Statics, self).__init__(x, y, r, model.content_id)
        self.id = f'static-{str(uuid.uuid1())[:8]}'
        self.physics.x, self.physics.y = model.x, model.y
        self.physics.bounds = [[p['x'] + model.x + model.offset_x,
                                p['y'] + model.y + model.offset_y]
                               for p in model.points]
        self.physics.eval_natural_aabb()

    def next(self, t: float):
        pass

    def do_action(self, asd):
        pass

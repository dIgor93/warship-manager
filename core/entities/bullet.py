import uuid

from core.entities.entity import Entity
from core.physics import LinePhysics
from core.storage import ResourceStorage


class Bullet(Entity):
    def __init__(self, x: float, y: float, r: float, player_owner):
        __resource_name = f'bullet_{player_owner.ship_model.content_id}'
        super().__init__(x, y, r, __resource_name)
        self.id = f'bullet_{player_owner.ship_model.content_id}-{str(uuid.uuid1())[:8]}'
        self.owner = player_owner
        self.damage = self.owner.ship_model.bullet_damage
        self.physics = LinePhysics(x, y, r)
        bullet = ResourceStorage().get_bullet(__resource_name)
        self.physics.load_points(bullet.points, bullet.offset_x, bullet.offset_y)
        self.physics.set_move_speed(player_owner.ship_model.bullet_speed)

    def action_on_collision(self, entity):
        import core.entities as ee
        if isinstance(entity, ee.SpaceShip):
            entity.hp -= self.damage
            if entity.hp > 0:
                self.owner.score += 10
            else:
                self.owner.score += 50
            self.hp = 0
        elif isinstance(entity, ee.Statics):
            self.hp = 0
        elif isinstance(entity, Bullet):
            self.hp = 0
            entity.hp = 0
        elif isinstance(entity, ee.Bonus):
            entity.hp -= self.damage
            self.hp = 0
        else:
            print(f'Bullet. Not described case for type {type(entity)}')

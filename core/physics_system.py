import itertools
from typing import Tuple

from core.entities import Entity, Bullet


class PhysicsSystem:
    def __init__(self):
        self._entities = []

    def add(self, entity: Entity):
        self._entities.append(entity)

    def delete(self, entity: Entity):
        if entity in self._entities:
            self._entities.remove(entity)

    def aabb_collision(self,
                       source_aabb: Tuple[float, float, float, float],
                       target_aabb: Tuple[float, float, float, float] = None):
        if target_aabb:
            x1, y1, x2, y2 = source_aabb
            x3, y3, x4, y4 = target_aabb
            if (x2 >= x3) and (x4 >= x1) and (y2 >= y3) and (y4 >= y1):
                return True
            return False
        else:
            for entity in self._entities:
                if self.aabb_collision(entity.physics.aabb, source_aabb):
                    return True
            else:
                return False

    @staticmethod
    def detail_collision(source_bounds, target_bounds):
        def vector_multiple(_p0, _p1, _p2):
            return (_p1[0] - _p0[0]) * (_p2[1] - _p0[1]) - (_p2[0] - _p0[0]) * (_p1[1] - _p0[1])

        def get_segments(_bounds):
            return [(_bounds[i], _bounds[(i + 1) % len(_bounds)]) for i in range(0, len(_bounds))]

        for p1, p2 in get_segments(source_bounds):
            for p3, p4 in get_segments(target_bounds):
                if vector_multiple(p1, p3, p2) * vector_multiple(p1, p4, p2) <= 0 and \
                        vector_multiple(p3, p1, p4) * vector_multiple(p3, p2, p4) <= 0:
                    return True
        return False

    def collision_computer(self):
        for pair in itertools.combinations(self._entities, 2):
            if not (isinstance(pair[0], Bullet) and pair[0].owner.id == pair[1].id) and \
                    not (isinstance(pair[1], Bullet) and pair[1].owner.id == pair[0].id):
                if self.aabb_collision(pair[0].physics.aabb, pair[1].physics.aabb):
                    if self.detail_collision(pair[0].physics.bounds, pair[1].physics.bounds):
                        pair[0].action_on_collision(pair[1])
                        pair[1].action_on_collision(pair[0])

    def exec_next(self, time_delta):
        for entity in self._entities:
            entity.next(time_delta)

    @property
    def entities(self):
        return self._entities

from abc import ABC, abstractmethod
from math import sin, cos

from core.models import GeometryParams
from core.movement import UniformlyMotion, ConstMotion


class Physics(ABC):
    def __init__(self, x, y, r):
        self.x = x
        self.y = y
        self.r = r
        self.bounds = []
        self.aabb = [0, 0, 0, 0]
        self._last_delta_time = 0

    @abstractmethod
    def update(self, delta_time):
        pass

    @abstractmethod
    def rollback(self):
        pass

    @property
    def aabb_int(self):
        return int(self.aabb[0]), int(self.aabb[1]), int(self.aabb[2]), int(self.aabb[3])

    def load_points(self, points: list, offset_x: float, offset_y: float):
        self.bounds = [[p['x'] + offset_x + self.x, p['y'] + offset_y + self.y]
                       for p in points]

        for point in self.bounds:
            tmp_x = self.x + (point[0] - self.x) * cos(self.r) - (point[1] - self.y) * sin(self.r)
            point[1] = self.y + (point[1] - self.y) * cos(self.r) + (point[0] - self.x) * sin(self.r)
            point[0] = tmp_x

        self.eval_natural_aabb()

    def eval_natural_aabb(self):
        min_x = min(self.bounds, key=lambda a: a[0])[0]
        min_y = min(self.bounds, key=lambda a: a[1])[1]
        max_x = max(self.bounds, key=lambda a: a[0])[0]
        max_y = max(self.bounds, key=lambda a: a[1])[1]
        self.aabb = [min_x, min_y, max_x, max_y]

    def eval_approximately_aabb(self, radius=40):
        self.aabb = [self.x - radius, self.y - radius, self.x + radius, self.y + radius]


class CasualPhysics(Physics):
    def __init__(self, x: float, y: float, r: float):
        super().__init__(x, y, r)
        self.angle_motion = ConstMotion()
        self.vector_motion = UniformlyMotion()

    def calculate_coords(self, delta_time):
        r_delta = self.angle_motion.current * delta_time
        self.r += r_delta

        x_delta = self.vector_motion.current * sin(self.r) * delta_time
        y_delta = self.vector_motion.current * cos(self.r) * delta_time

        for point in self.bounds:
            tmp_x = (point[0] - self.x) * cos(r_delta) + self.x - \
                    (point[1] - self.y) * sin(r_delta) - x_delta
            point[1] = (point[1] - self.y) * cos(r_delta) + self.y + \
                       (point[0] - self.x) * sin(r_delta) + y_delta
            point[0] = tmp_x
        self.x -= x_delta
        self.y += y_delta

        self.aabb[0] -= x_delta
        self.aabb[2] -= x_delta
        self.aabb[1] += y_delta
        self.aabb[3] += y_delta

    def update(self, delta_time):
        self._last_delta_time = delta_time
        self.angle_motion.update(delta_time)
        self.vector_motion.update(delta_time)

        self.calculate_coords(delta_time=delta_time)

    def rollback(self):
        self.calculate_coords(delta_time=-1 * self._last_delta_time)

        self.vector_motion.switch_current()
        self.angle_motion.switch_current()


class LinePhysics(Physics):
    def __init__(self, x: float, y: float, r: float):
        super().__init__(x, y, r)
        self.vector_motion = ConstMotion(moving=1)

    def set_move_speed(self, speed):
        self.vector_motion.set_delta(speed)

    def update(self, delta_time):
        self.vector_motion.update(delta_time)

        x_delta = self.vector_motion.current * sin(self.r) * delta_time
        y_delta = self.vector_motion.current * cos(self.r) * delta_time

        for point in self.bounds:
            point[0] -= x_delta
            point[1] += y_delta

        self.aabb[0] -= x_delta
        self.aabb[2] -= x_delta
        self.aabb[1] += y_delta
        self.aabb[3] += y_delta

        self.x -= x_delta
        self.y += y_delta

    def rollback(self):
        self.update(-1 * self._last_delta_time)

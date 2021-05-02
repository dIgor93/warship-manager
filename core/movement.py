from abc import abstractmethod, ABC

MOVING = [1, -1, 0]


class DeltaBehaviour(ABC):
    def __init__(self):
        self._current = 0
        self._moving = 0

    @abstractmethod
    def update(self, time: float):
        pass

    def set_moving(self, moving: MOVING):
        if moving in MOVING:
            self._moving = moving
        else:
            return ValueError(f'moving parameter must be an one of {MOVING}')

    def switch_current(self):
        self._current *= -1

    @property
    def current(self):
        return self._current


class UniformlyMotion(DeltaBehaviour):
    def __init__(self, delta=0.0, max_value=0.0, moving=0.0):
        super().__init__()
        self._max = max_value
        self._delta = delta
        self._moving = moving

    def update(self, time: float):
        delta_time = self._delta * time
        if self._moving == 0:
            if abs(self._current) < delta_time:
                self._current = 0
            else:
                if self._current > 0:
                    self._current -= delta_time
                elif self._current < 0:
                    self._current += delta_time
                else:
                    pass
        elif self._moving == 1:
            new_curr = self._current + self._moving * delta_time
            self._current = self._max if new_curr >= self._max else new_curr
        elif self._moving == -1:
            new_curr = self._current + self._moving * delta_time
            self._current = -self._max if new_curr <= -self._max else new_curr
        else:
            pass

    def set_delta(self, delta):
        self._delta = delta

    def set_max_current(self, max_value):
        self._max = max_value

    def __str__(self):
        return f'curr: {self._current} moving: {self._moving} delta: {self._delta}'


class ConstMotion(DeltaBehaviour):
    def __init__(self, delta=0.0, moving=0):
        super().__init__()
        self._const_delta = delta
        self._moving = moving

    def update(self, time: float):
        if self._moving == 0:
            self._current = 0
        elif self._moving == 1:
            self._current = self._const_delta + time
        elif self._moving == -1:
            self._current = -self._const_delta + time
        else:
            pass

    def set_delta(self, speed):
        self._const_delta = speed

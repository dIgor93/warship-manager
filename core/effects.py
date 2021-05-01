from core.singleton import SingletonMeta


class EffectFactory(metaclass=SingletonMeta):
    def __init__(self):
        self.pool = []

    def add_to_pool(self, id_eff, x, y):
        self.pool.append({'id': id_eff, 'x': x, 'y': y})

    def get_effects(self):
        res = self.pool[::]
        self.pool.clear()
        return res

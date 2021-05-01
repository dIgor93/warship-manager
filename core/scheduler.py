class Scheduler:
    def __init__(self):
        self.__pool = []

    def add(self, obj, func, *args):
        command = obj, func, *args
        self.__pool.append(command)

    def exec_all(self):
        for command in self.__pool:
            entity, func, *args = command
            func(entity, *args)
        self.__pool = []

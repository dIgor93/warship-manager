class Endpoint:
    def __init__(self, data_bus):
        self.__data_bus = data_bus

    def scan_players(self, previous_players: dict):
        data = self.__data_bus.players_state

        current_keys = set(data.keys())
        previous_keys = set(previous_players.keys())

        new_players = [{**data[pl], 'player_id': pl} for pl in (current_keys - previous_keys)]
        dead_players = [pl for pl in (previous_keys - current_keys)]
        current_players = {pl: data[pl] for pl in current_keys}

        return current_players, new_players, dead_players

    def send_data_to_player(self, state: dict):
        self.__data_bus.game_state = state

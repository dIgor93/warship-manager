class DataBus:
    def __init__(self):
        self.players_state = {}
        self.game_state = {}

    def add_player(self, player_name, player_id):
        player = {
            'player_name': player_name,
            'shooting': 0,
            'angle': 0,
            'direction': 0
        }
        self.players_state[player_id] = player

    def del_player(self, player_id):
        del self.players_state[player_id]

    def set_moving(self, player_id, angle, direction):
        self.players_state[player_id]['angle'] = angle
        self.players_state[player_id]['direction'] = direction

    def set_shooting(self, player_id, shooting):
        self.players_state[player_id]['shooting'] = shooting

    def get_message(self):
        return self.game_state

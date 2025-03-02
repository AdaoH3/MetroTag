from flask import Flask, request, jsonify
from geopy.distance import geodesic  # For distance calculations
from geopy import Point  # For working with coordinates
from flask_cors import CORS  # Import CORS
import logging

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

class Location:
    def __init__(self, latitude, longitude):
        self.latitude = latitude  # Corrected
        self.longitude = longitude  # Corrected

class Player:
    def __init__(self, user_name, role = "runner"):
        self.user_name = user_name
        # runner or tagger
        self.role = role
        self.location = Location(0.0, 0.0)
        self.is_tagged = False
        
class Game:
    def __init__(self, lobby_name):
        self.lobby_name = lobby_name
        self.is_active = True
        self.players = []

games = []

def verify_credentials_data(data):
    if 'lobby_name' not in data:
        return -1
    
    if not isinstance(data['lobby_name'], str):
        return -1

    for index, game in enumerate(games):
        if game.lobby_name == data['lobby_name']:
            return index
    return -1

def verify_credentials_arguments(lobby_name):
    if not isinstance(lobby_name, str):
        return -1

    for index, game in enumerate(games):
        if game.lobby_name == lobby_name:
            return index
    return -1
        
def identify_tagger(players):
    for player in players:
        if player.role == "tagger":
            return player
    return None

def distance_from_tagger(player, game):
    if(player.role == 'runner'): 
        runner_coords = (player.location.latitude, player.location.longitude)
        tagger_coords = (identify_tagger(game.players).location.latitude, identify_tagger(game.players).location.longitude)
        distance = geodesic(runner_coords, tagger_coords).meters
    elif(player.role == 'tagger'):
        tagger_coords = (player.location.latitude, player.location.longitude)
        nearest_runner_coords = (find_nearest_player(player, game.players))
        distance = geodesic(tagger_coords, nearest_runner_coords).meters
    
    return distance

def find_nearest_player(tagger, players):
    nearest_player = None
    min_distance = float('inf')  # Initialize with a large value

    for player in players:
        if player.user_name != tagger.user_name and player.is_tagged:  # Skip the tagger itself and untagged players
            # Calculate distance using geopy
            tagger_location = (tagger.location.latitude, tagger.location.longitude)
            player_location = (player.location.latitude, player.location.longitude)
            distance = geodesic(tagger_location, player_location).kilometers
            if distance < min_distance:
                min_distance = distance
                nearest_player = player

    return nearest_player

def find_center_coordinates(players):
    if not players:
        return None  # Return None if no players exist

    # Extract latitudes and longitudes
    latitudes = [player.location.latitude for player in players]
    longitudes = [player.location.longitude for player in players]

    # Calculate the center (average of latitudes and longitudes)
    center_lat = sum(latitudes) / len(latitudes)
    center_lon = sum(longitudes) / len(longitudes)

    return (center_lat, center_lon)

@app.route('/create_game', methods=['POST'])
def create_game():
    global games
    data = request.get_json()

    if 'lobby_name' not in data or not isinstance(data['lobby_name'], str) or len(data['lobby_name'].strip()) == 0:
        return jsonify({"code": 7})  # Invalid input

    for game in games:
        if game.lobby_name == data['lobby_name']:
            return jsonify({"code": 1})  # Lobby already exists

    games.append(Game(data['lobby_name']))
    return jsonify({"code": 0})  # Success

@app.route('/join_game', methods=['POST'])
def join_game():
    global games
    data = request.get_json()
    
    index = verify_credentials_data(data)
    if index == -1:
        return jsonify({"code": 7})  # Invalid lobby

    if 'user_name' not in data or not isinstance(data['user_name'], str) or len(data['user_name'].strip()) == 0:
        return jsonify({"code": 7})  # Invalid username

    # Prevent duplicate usernames
    for player in games[index].players:
        if player.user_name == data['user_name']:
            return jsonify({"code": 8})  # Username already exists in the lobby

    games[index].players.append(Player(data['user_name']))
    
    return jsonify({"code": 0})  # Successfully joined

@app.route('/get_game_state', methods=['GET'])
def get_gamestate():
    global games
    lobby_name = request.args.get("lobby_name")

    if not lobby_name:
        return jsonify({"code": 9})

    if not isinstance(lobby_name, str):
        return jsonify({"code": 7})

    for index, game in enumerate(games):
        if game.lobby_name == data['lobby_name']:
            game = games[index]

    game_state = {
        "code": 0,
        "game_status": game.is_active,
        "players": {
            player.user_name: {
                "role": player.role,
                "location": [player.location.latitude, player.location.longitude],
                "is_tagged": player.is_tagged
            }
            for player in game.players
        }
    }

    return jsonify(game_state)

@app.route('/update_player_data', methods=['POST'])
def update_player_data():
    global games
    data = request.get_json()
    
    index = verify_credentials_data(data)
    
    if index == -1:
        return jsonify({"code": 7})
    
    if not isinstance(data['user_name'], str) or not isinstance(data['latitude'], float) or not isinstance(data['longitude'], float) or not isinstance(data['is_tagged'], bool):
        return jsonify({"code": 7})
    
    for player in games[index].players:
        if player.user_name == data['user_name']:
            if 'role' in data:
                player.role = data['role']
            if 'latitude' in data:
                player.location.latitude = data['latitude']
            if 'longitude' in data:
                player.location.longitude = data['longitude']
            if 'is_tagged' in data:
                player.is_tagged = data['is_tagged']
            return jsonify({"code": 0})

    return jsonify({"code": 7})

@app.route('/get_center_coords', methods=['GET'])
def get_center_coords():
    global games
    lobby_name = request.args.get("lobby_name")

    if not lobby_name:
        return jsonify({"code": 7})

    index = verify_credentials_arguments(lobby_name)
    if index == -1:
        return jsonify({"code": 7})

    game = games[index]

    center = find_center_coordinates(game.players)
    if center is None:
        return jsonify({"code": 8})

    return jsonify({"code": 0, "center_coordinates":center})

@app.route('/end_game', methods=['POST'])
def end_game():
    global games
    data = request.get_json()
    
    index = verify_credentials_data(data)
    
    if index == -1:
        return jsonify({"code": 7})
    
    for player in games[index].players:
        player.is_tagged = True
    
    games.pop(index)
    
    return jsonify({"code": 0})
    
@app.route('/nearby_tagger', methods=['GET'])
def nearby_tagger():
    global games
    lobby_name = request.args.get("lobby_name")

    if not lobby_name:
        return jsonify({"code": 9})

    if not isinstance(lobby_name, str):
        return jsonify({"code": 7})

    for index, game in enumerate(games):
        if game.lobby_name == ['lobby_name']:
            game = games[index]
    
    tagger = find_nearest_player(identify_tagger(game.players), game.players)
    returnCoords = [tagger.latitude, tagger.longitude]
    return returnCoords
    
if __name__ == '__main__':
    # Enable threaded mode to handle multiple requests concurrently
    app.run(debug=True, use_reloader=False, threaded=True)
# MetroTag

## MetroTag App Explained
MetroTag is essentially a real-world game of tag using GPS locations. Players can be either taggers (who chase) or runners (who flee), and they use their mobile devices to track each other's positions.
----
<img width="518" height="434" alt="image" src="https://github.com/user-attachments/assets/d3a0bbd4-2105-4657-adf0-bd6915cc6dc6" />

----
Uses Flask Server for backend:    
const host_url = `https://43ppk7jt-5000.use.devtunnels.ms`;
Dedicates role: "Tagger" or "Runner"
Performs functions for getting distance from a tagger, finding the nearest player from tagger, finding center coordinates (for map display), creating, joining, and getting game state. 
----
## Expo Go App Functions:
  
### For Runner: 
user_name: name,
latitude: loc.coords.latitude,
longitude: loc.coords.longitude,
is_tagged: tagged,
lobby_name: lobby_name
This data is sent to the server to be displayed on the taggers arrow and the leaflet JS map.  
  
### For Tagger:
Gets GPS: Latitude and Longitude 
When location state changes fetches the nearest player from the server
Server responds with nearest player's coordinates
Updates the state with the closest longitude and latitude of the player
Calculates the Bearing angle using spherical geometry
Updates angle to bearing 
Calculates arrow angle as an offset based on players current angle (using phone's magnometer)
Loop until tagger state changes. 

<img width="520" height="839" alt="image" src="https://github.com/user-attachments/assets/c25efe34-5cf4-4cc7-ade6-8a80a6cf5010" />

----
## Map:
Uses Leaflet JS library   
Fetches center coordinates and game state from flask server. 
Displays tagger as red and runners as blue on map.
Shows popup for player when hovering over.  
  
<img width="792" height="580" alt="image" src="https://github.com/user-attachments/assets/150cd8e4-f632-43ca-bbc4-edbdf20a3447" />
```

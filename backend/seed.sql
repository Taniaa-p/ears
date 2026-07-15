INSERT INTO hospitals (name, location) VALUES
('Rajiv Gandhi Government General Hospital', ST_SetSRID(ST_MakePoint(80.277194, 13.081417), 4326)::geography),
('Hindu Mission Hospital', ST_SetSRID(ST_MakePoint(80.11389, 12.92389), 4326)::geography),
('ESIC Hospital Ayanavaram', ST_SetSRID(ST_MakePoint(80.2391, 13.0949), 4326)::geography);

INSERT INTO police_stations (name, location) VALUES
('Chennai Police Commissionerate', ST_SetSRID(ST_MakePoint(80.2633, 13.0812), 4326)::geography);

INSERT INTO fire_stations (name, location) VALUES
('Egmore Fire Station', ST_SetSRID(ST_MakePoint(80.2609, 13.0732), 4326)::geography),
('Anna Nagar Fire Station', ST_SetSRID(ST_MakePoint(80.2087, 13.0850), 4326)::geography);


SELECT name, ST_Distance(location, $1) AS distance_meters
FROM hospitals
ORDER BY location <-> $1
LIMIT 1;
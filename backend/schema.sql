CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hospitals_location ON hospitals USING GIST (location);

CREATE TABLE police_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_police_stations_location ON police_stations USING GIST (location);

CREATE TABLE fire_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fire_stations_location ON fire_stations USING GIST (location);

CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    responders_needed TEXT[] NOT NULL CHECK (array_length(responders_needed, 1) > 0),
    description TEXT,
    victim_count INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'resolved')),
    image_url TEXT,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    reported_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidents_location ON incidents USING GIST (location);
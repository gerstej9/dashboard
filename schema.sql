DROP TABLE IF EXISTS numeraiDatabase

CREATE TABLE numeraiDatabase(
ID SERIAL PRIMARY KEY,
round DECIMAL,
model VARCHAR(255),
corr DECIMAL,
mmc DECIMAL,
);
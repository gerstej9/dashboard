DROP TABLE IF EXISTS userProfile CASCADE;
DROP TABLE IF EXISTS synthModelData CASCADE;

CREATE TABLE userProfile(
  ID SERIAL PRIMARY KEY,
  username VARCHAR(255),
  models TEXT []
);

CREATE TABLE synthModelData(
ID SERIAL PRIMARY KEY,
model VARCHAR(255),
corr DECIMAL,
mmc DECIMAL,
newscore DECIMAL,
round DECIMAL,
abovePercent VARCHAR(255),
percentvalue DECIMAL,
percentile DECIMAL
);
DROP TABLE IF EXISTS userProfile CASCADE;
DROP TABLE IF EXISTS ModelData CASCADE;
DROP TABLE IF EXISTS gBoy CASCADE;

CREATE TABLE userProfile(
  ID SERIAL PRIMARY KEY,
  username VARCHAR(255),
  models TEXT []
);

CREATE TABLE ModelData(
ID SERIAL PRIMARY KEY,
round DECIMAL,
model VARCHAR(255),
corr DECIMAL,
percentileAllModelCorr DECIMAL,
passingPercentile VARCHAR(255),
percentileValue DECIMAL,
mmc DECIMAL,
newscore DECIMAL,
percentileNewscoreRelativeGboy DECIMAL,
abovePercentNewscoreRelativeGboy VARCHAR(255),
percentvalueNewscoreRelativeGboy DECIMAL
);

CREATE TABLE gBoy(
  ID SERIAL PRIMARY KEY,
  models TEXT []
);
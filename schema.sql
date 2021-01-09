DROP TABLE IF EXISTS userProfile CASCADE;

CREATE TABLE userProfile(
  ID SERIAL PRIMARY KEY,
  username VARCHAR(255),
  models TEXT []
);
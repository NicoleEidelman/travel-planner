// Creates an app user with readWrite on 'travel_planner'
db = db.getSiblingDB('travel_planner');
db.createUser({
  user: "appuser",
  pwd: "apppass",
  roles: [ { role: "readWrite", db: "travel_planner" } ]
});

// Creates an admin user with readWriteAnyDatabase
db = db.getSiblingDB('admin');
db.createUser({
  user: "adminuser",
  pwd: "adminpass",
  roles: [ { role: "readWriteAnyDatabase", db: "admin" } ]
});

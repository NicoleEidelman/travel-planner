import session from 'express-session';
import MongoStore from 'connect-mongo';

// Create and configure the session middleware for Express using MongoDB
export function sessionMiddleware({ mongoUrl, secret }) {
  return session({
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000*60*60*24*7 },
    store: MongoStore.create({ mongoUrl, dbName: 'travel_planner', stringify: false })
  });
}
// This file is part of the server configuration for the Travel Planner MVP application.
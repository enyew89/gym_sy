import passport from 'passport';
import User from '../models/User.js';

export function configurePassport() {
  // Configure Passport Local Strategy via passport-local-mongoose
  passport.use(User.createStrategy());

  // Serialize and deserialize user instances to and from the session
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
}

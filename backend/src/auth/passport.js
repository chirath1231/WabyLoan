import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { env, oauthEnabled } from '../env.js';
import { upsertOAuthUser } from '../services/authService.js';

if (oauthEnabled.google) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      (_accessToken, _refreshToken, profile, done) => {
        upsertOAuthUser('google', profile.id, profile.emails?.[0]?.value, profile.displayName)
          .then((result) => done(null, result))
          .catch((err) => done(err));
      },
    ),
  );
}

if (oauthEnabled.facebook) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.facebook.clientId,
        clientSecret: env.facebook.clientSecret,
        callbackURL: env.facebook.callbackUrl,
        profileFields: ['id', 'displayName', 'emails'],
      },
      (_accessToken, _refreshToken, profile, done) => {
        upsertOAuthUser('facebook', profile.id, profile.emails?.[0]?.value, profile.displayName)
          .then((result) => done(null, result))
          .catch((err) => done(err));
      },
    ),
  );
}

export default passport;

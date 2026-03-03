import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User";

export function configurePassport(): void {
  const backendBaseUrl = (process.env.BACKEND_URL ?? "http://localhost:5000").replace(/\/+$/, "");
  const callbackURL = process.env.GOOGLE_CALLBACK_URL ?? `${backendBaseUrl}/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? "";
          const image = profile.photos?.[0]?.value ?? "";
          const displayName = profile.displayName ?? "Learner";

          if (!email) {
            return done(new Error("Google profile did not include an email address"), undefined);
          }

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            // Safety for existing users created before Google ID linking.
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              if (!user.image && image) user.image = image;
              if (!user.name && displayName) user.name = displayName;
              await user.save();
            }
          }

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              email,
              name: displayName,
              image,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}

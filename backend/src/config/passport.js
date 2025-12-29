// CONFIG: Passport.js Configuration for Social Authentication

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/index.js";
import dotenv from "dotenv";

dotenv.config();

/**
 * Cấu hình Google OAuth Strategy
 * Cần thiết lập trong .env:
 * GOOGLE_CLIENT_ID=your_google_client_id
 * GOOGLE_CLIENT_SECRET=your_google_client_secret
 * GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Kiểm tra user đã tồn tại chưa (qua googleId hoặc email)
        let user = await User.findOne({
          $or: [
            { "socialIds.googleId": profile.id },
            { email: profile.emails[0].value },
          ],
        });

        if (user) {
          // User đã tồn tại
          // Nếu tìm thấy qua email nhưng chưa có googleId -> Link account
          if (!user.socialIds?.googleId) {
            user.socialIds = user.socialIds || {};
            user.socialIds.googleId = profile.id;

            // Nếu user chưa verify email, đánh dấu là đã verify vì Google đã xác thực
            if (!user.emailVerified) {
              user.emailVerified = true;
              user.emailVerifiedAt = new Date();
            }

            await user.save();
          }
          return done(null, user);
        }

        // Tạo user mới từ Google profile
        const username =
          profile.emails[0].value.split("@")[0] + "_" + Date.now();

        user = await User.create({
          username,
          email: profile.emails[0].value,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash:
            "GOOGLE_AUTH_" + Math.random().toString(36).substring(7), // Random password
          fullName:
            profile.displayName ||
            profile.name?.givenName + " " + profile.name?.familyName,
          profileImageUrl: profile.photos?.[0]?.value,
          socialIds: {
            googleId: profile.id,
          },
          roles: ["bidder"],
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// Serialize user vào session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user từ session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-passwordHash -otp");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

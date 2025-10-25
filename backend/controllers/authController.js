import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import generateToken from "../utils/generateToken.js";

/**
 * Sends the OAuth result to the client along with a freshly minted JWT.
 */
export const handleGoogleCallback = async (req, res, user, info) => {
  if (info?.message === "Invalid domain") {
    return res.status(403).json({ success: false, message: "Invalid domain", data: null });
  }

  if (!user) {
    const message = info?.message || "Authentication failed";
    return res.status(401).json({ success: false, message, data: null });
  }

  const payload = {
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);

  let roleDetails = null;

  if (user.role === "student") {
    roleDetails = await Student.findOne({ user: user._id }).select("name email department year joinedClubs profilePic");
  } else if (user.role === "teacher") {
    roleDetails = await Teacher.findOne({ user: user._id }).select("name email department designation profilePic");
  }

  const profile = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic,
    roleDetails,
  };

  const clientOrigins = process.env.CLIENT_URL?.split(",").map((origin) => origin.trim()).filter(Boolean);

  if (clientOrigins?.length) {
    const [primaryOrigin] = clientOrigins;

    try {
      const redirectUrl = new URL("/auth/callback", primaryOrigin);
      redirectUrl.searchParams.set("success", "true");
      redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("profile", JSON.stringify(profile));

      if (req.query?.state) {
        redirectUrl.searchParams.set("state", String(req.query.state));
      }

      return res.redirect(302, redirectUrl.toString());
    } catch (error) {
      console.error("Failed to build OAuth redirect URL", error);
    }
  }

  return res.status(200).json({ success: true, message: "Authentication successful", data: { token, user: profile } });
};

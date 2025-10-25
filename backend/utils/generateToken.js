import jwt from "jsonwebtoken";

/**
 * Generates a signed JWT for the provided user payload.
 */
const generateToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, secret, { expiresIn: "7d", ...options });
};

export default generateToken;

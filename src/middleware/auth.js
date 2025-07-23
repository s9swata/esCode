const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

if (!process.env.CLERK_JWKS_URI) {
  throw new Error("CLERK_JWKS_URI environment variable is not set");
}

const client = jwksClient({
  jwksUri: process.env.CLERK_JWKS_URI || "",
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10, // Default is 10, adjust as needed
  cacheMaxEntries: 5, // Default is 5, adjust as needed
  cacheMaxAge: 600000, // Default is 10 minutes, adjust as needed
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

const auth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err || !decoded || typeof decoded === "string") {
      res.status(403).json({ message: "JWT verification failed" });
      return;
    }
    req.userId = decoded.sub;
    next();
  });
};

module.exports = { auth };

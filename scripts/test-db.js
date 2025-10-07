// Try loading dotenv if it's installed, otherwise fall back to a tiny .env parser so
// this script will pick up values from a .env file in the project root.
let dotenvLoaded = false;
try {
  require("dotenv").config();
  dotenvLoaded = true;
} catch (err) {
  // ignore — we'll try the manual fallback
}

if (!dotenvLoaded) {
  const fs = require("fs");
  const path = require("path");
  const envPath = path.resolve(__dirname, "..", ".env");
  try {
    const envContents = fs.readFileSync(envPath, "utf8");
    envContents.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      // remove surrounding quotes if present
      val = val.replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = val;
    });
  } catch (err) {
    // if reading .env fails, continue — script will notify about missing var later
  }
}

const mongoose = require("mongoose");

// Support both MONGODB_URI and NEXT_PUBLIC_MONGODB_URI (the repo currently uses NEXT_PUBLIC_)
const MONGODB_URI =
  process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

(async () => {
  if (!MONGODB_URI) {
    console.error(
      "ERROR: MONGODB_URI (or NEXT_PUBLIC_MONGODB_URI) environment variable is not set."
    );
    console.error(
      "If you have a .env file, ensure it is at the project root and contains MONGODB_URI or NEXT_PUBLIC_MONGODB_URI."
    );
    console.error(
      'You can also set it in PowerShell: $env:MONGODB_URI = "<your-uri>"'
    );
    process.exit(2);
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    const { host, port, name } = mongoose.connection;
    console.log(`Connected to MongoDB: host=${host} port=${port} db=${name}`);
    await mongoose.connection.close();
    console.log("Connection closed. Test successful.");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:");
    console.error(err);
    process.exit(1);
  }
})();

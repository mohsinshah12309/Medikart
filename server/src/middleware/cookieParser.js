/**
 * Lightweight cookie parser middleware.
 * Populates req.cookies object from the Cookie HTTP request header.
 */
const cookieParser = (req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return next();

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    const val = pair.slice(eqIdx + 1).trim();
    if (key) {
      try {
        req.cookies[key] = decodeURIComponent(val);
      } catch (e) {
        req.cookies[key] = val;
      }
    }
  }
  next();
};

module.exports = cookieParser;

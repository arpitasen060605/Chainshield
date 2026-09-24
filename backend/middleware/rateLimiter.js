// Simple in-memory rate limiter for authentication endpoints
const rateLimitMap = new Map();

/**
 * Basic rate limiter middleware for authentication attempts
 * @param {Object} options - { windowMs, max, message }
 */
export const authRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 20; // 20 requests per window
  const message = options.message || 'Too many login attempts from this IP, please try again after 15 minutes';

  return (req, res, next) => {
    let rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1';
    if (typeof rawIp === 'string' && rawIp.includes(',')) {
      rawIp = rawIp.split(',')[0].trim();
    }
    const ip = String(rawIp).trim();
    const now = Date.now();

    // Periodic cleanup of expired entries to keep memory clean
    if (rateLimitMap.size > 500) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
          rateLimitMap.delete(key);
        }
      }
    }

    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }

    rateLimitMap.set(ip, record);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

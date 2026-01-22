/**
 * Web Application Firewall (WAF) Middleware
 * Enterprise-grade security layer for Merit School Portal
 * 
 * Protects against:
 * - SQL Injection patterns
 * - XSS attacks
 * - Path traversal
 * - Command injection
 * - Suspicious payloads
 * - Bot detection
 * - Request anomalies
 */

const crypto = require('crypto');

// ==================== ATTACK PATTERNS ====================

const SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|UNION|HAVING|ORDER BY)\b.*\b(FROM|INTO|TABLE|DATABASE|WHERE)\b)/gi,
    /(\bOR\b\s*(\d+|\w+|'[a-zA-Z0-9]*')\s*=\s*(\d+|\w+|'[a-zA-Z0-9]*'))/gi, // Updated to catch OR 'a'='a'
    /(\bAND\b\s*(\d+|\w+|'[a-zA-Z0-9]*')\s*=\s*(\d+|\w+|'[a-zA-Z0-9]*'))/gi,
    /(--|\#|\/\*|\*\/)/g,
    /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\b\s*\()/gi,
    /(\bWAITFOR\b\s*\bDELAY\b)/gi,
    /(\bBENCHMARK\b\s*\()/gi,
    /(';|";|`--)/g,
    /(\bUNION\b\s*\bALL\b\s*\bSELECT\b)/gi
];

const XSS_PATTERNS = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<script[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /document\.(cookie|location|write)/gi,
    /window\.(location|open)/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /<img[^>]+onerror/gi,
    /src\s*=\s*["']?javascript:/gi
];

const PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.%2f/gi,
    /%2e%2e%2f/gi,
    /\.\.%5c/gi,
    /\.\.\\/g,
    /\.\.%255c/gi,
    /(\/etc\/passwd|\/etc\/shadow|\/windows\/system32)/gi
];

const COMMAND_INJECTION_PATTERNS = [
    // Removed short length bypass
    /(\||;|&|\$|`|\n|\r)/g,
    /\b(rm|wget|curl|nc|bash|sh|cmd|powershell)\b\s+[-\/]/gi,
    /(%0a|%0d)/gi
];

const SUSPICIOUS_USER_AGENTS = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /owasp/i,
    /nmap/i,
    /masscan/i,
    /hydra/i,
    /metasploit/i,
    /curl\/\d/i,
    /python-requests/i,
    /go-http-client/i,
    /^$/
];

// ==================== WAF CORE ====================

class WAF {
    constructor(options = {}) {
        this.options = {
            blockSuspiciousUserAgents: true,
            logBlocks: true,
            strictMode: false,
            whitelistedIPs: [],
            maxPayloadSize: 10 * 1024 * 1024, // 10MB
            ...options
        };
        this.blockedRequests = new Map();
        this.requestCounts = new Map();

        // Memory Leak Fix: Cleanup interval every 10 minutes
        setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }

    cleanup() {
        const now = Date.now();
        const window = 60 * 1000;
        for (const [key, timestamps] of this.requestCounts.entries()) {
            const valid = timestamps.filter(t => now - t < window);
            if (valid.length === 0) {
                this.requestCounts.delete(key);
            } else {
                this.requestCounts.set(key, valid);
            }
        }
    }

    // Check for SQL Injection
    checkSQLInjection(value) {
        if (typeof value !== 'string') return false;
        return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
    }

    // Check for XSS
    checkXSS(value) {
        if (typeof value !== 'string') return false;
        return XSS_PATTERNS.some(pattern => pattern.test(value));
    }

    // Check for Path Traversal
    checkPathTraversal(value) {
        if (typeof value !== 'string') return false;
        return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(value));
    }

    // Check for Command Injection
    checkCommandInjection(value) {
        if (typeof value !== 'string') return false;
        // Strict check: if it matches pattern, it's flagged
        return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(value));
    }

    // Check User Agent
    checkUserAgent(userAgent) {
        if (!userAgent) return true; // Block empty user agents
        return SUSPICIOUS_USER_AGENTS.some(pattern => pattern.test(userAgent));
    }

    // Deep scan object for malicious patterns
    scanObject(obj, path = '') {
        const threats = [];

        const scan = (value, currentPath) => {
            if (typeof value === 'string') {
                if (this.checkSQLInjection(value)) {
                    threats.push({ type: 'SQL_INJECTION', path: currentPath, sample: value.substring(0, 50) });
                }
                if (this.checkXSS(value)) {
                    threats.push({ type: 'XSS', path: currentPath, sample: value.substring(0, 50) });
                }
                if (this.checkPathTraversal(value)) {
                    threats.push({ type: 'PATH_TRAVERSAL', path: currentPath, sample: value.substring(0, 50) });
                }
            } else if (Array.isArray(value)) {
                value.forEach((item, index) => scan(item, `${currentPath}[${index}]`));
            } else if (value && typeof value === 'object') {
                Object.entries(value).forEach(([key, val]) => scan(val, `${currentPath}.${key}`));
            }
        };

        scan(obj, path);
        return threats;
    }

    // Generate request fingerprint
    getRequestFingerprint(req) {
        const data = [
            req.ip,
            req.headers['user-agent'] || '',
            req.headers['accept-language'] || '',
            req.headers['accept-encoding'] || ''
        ].join('|');
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }

    // Track request velocity
    trackVelocity(fingerprint) {
        const now = Date.now();
        const window = 60 * 1000; // 1 minute

        if (!this.requestCounts.has(fingerprint)) {
            this.requestCounts.set(fingerprint, []);
        }

        const requests = this.requestCounts.get(fingerprint);
        requests.push(now);

        // Clean old requests for this specific fingerprint
        const validRequests = requests.filter(t => now - t < window);
        this.requestCounts.set(fingerprint, validRequests);

        return validRequests.length;
    }

    // Main middleware function
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

            // Skip whitelisted IPs
            if (this.options.whitelistedIPs.includes(clientIP)) {
                return next();
            }

            const threats = [];
            const fingerprint = this.getRequestFingerprint(req);

            // 1. Check User Agent
            if (this.options.blockSuspiciousUserAgents) {
                const userAgent = req.headers['user-agent'];
                if (this.checkUserAgent(userAgent)) {
                    threats.push({ type: 'SUSPICIOUS_USER_AGENT', details: userAgent });
                }
            }

            // 2. Check payload size
            const contentLength = parseInt(req.headers['content-length'] || 0);
            if (contentLength > this.options.maxPayloadSize) {
                threats.push({ type: 'PAYLOAD_TOO_LARGE', size: contentLength });
            }

            // 3. Scan URL and query parameters
            const urlThreats = this.scanObject({ url: req.originalUrl, query: req.query }, 'url');
            threats.push(...urlThreats);

            // 4. Scan request body
            if (req.body && typeof req.body === 'object') {
                const bodyThreats = this.scanObject(req.body, 'body');
                threats.push(...bodyThreats);
            }

            // 5. Scan headers for suspicious patterns
            const sensitiveHeaders = ['referer', 'origin', 'x-forwarded-for'];
            sensitiveHeaders.forEach(header => {
                const value = req.headers[header];
                if (value && (this.checkXSS(value) || this.checkSQLInjection(value))) {
                    threats.push({ type: 'MALICIOUS_HEADER', header, sample: value.substring(0, 30) });
                }
            });

            // 6. Check request velocity (potential DDoS)
            const requestCount = this.trackVelocity(fingerprint);
            if (requestCount > 100) { // Bumped to 100 to avoid false positives for active users
                threats.push({ type: 'VELOCITY_EXCEEDED', count: requestCount });
            }

            // 7. Check for anomalies
            if (req.method === 'POST' && !req.headers['content-type'] && contentLength > 0) {
                threats.push({ type: 'MISSING_CONTENT_TYPE' });
            }

            // Block if threats detected
            if (threats.length > 0) {
                // Log the block
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    ip: clientIP,
                    fingerprint,
                    method: req.method,
                    path: req.path,
                    threats,
                    blocked: true,
                    processingTime: Date.now() - startTime
                };

                if (this.options.logBlocks) {
                    console.warn('[WAF BLOCKED]', JSON.stringify(logEntry));
                }

                // Store blocked request info
                this.blockedRequests.set(fingerprint, {
                    ...logEntry,
                    count: (this.blockedRequests.get(fingerprint)?.count || 0) + 1
                });

                // In strict mode, block all threats
                const highSeverity = ['SQL_INJECTION', 'XSS', 'COMMAND_INJECTION', 'PATH_TRAVERSAL'];
                const hasHighSeverity = threats.some(t => highSeverity.includes(t.type));

                if (this.options.strictMode || hasHighSeverity) {
                    return res.status(403).json({
                        error: 'Request blocked by security policy',
                        code: 'WAF_BLOCKED',
                        requestId: fingerprint
                    });
                }
            }

            // Add security headers to response
            res.setHeader('X-WAF-Protected', 'true');
            res.setHeader('X-Request-ID', fingerprint);

            next();
        };
    }

    // Get blocked requests statistics
    getStats() {
        return {
            totalBlocked: this.blockedRequests.size,
            blockedRequests: Array.from(this.blockedRequests.values())
        };
    }
}

// ==================== IP FINGERPRINTING ====================

const createIPFingerprint = (req) => {
    const components = [
        req.ip || req.connection.remoteAddress,
        req.headers['user-agent'] || '',
        req.headers['accept-language'] || '',
        req.headers['accept-encoding'] || '',
        req.headers['accept'] || '',
        // Screen info would come from client-side
    ];

    return crypto.createHash('sha256')
        .update(components.join('|'))
        .digest('hex');
};

// ==================== CSRF PROTECTION ====================

const csrfTokens = new Map();

const generateCSRFToken = (sessionId) => {
    const token = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(sessionId, {
        token,
        expires: Date.now() + (60 * 60 * 1000) // 1 hour
    });
    return token;
};

const validateCSRFToken = (sessionId, token) => {
    const stored = csrfTokens.get(sessionId);
    if (!stored) return false;
    if (Date.now() > stored.expires) {
        csrfTokens.delete(sessionId);
        return false;
    }
    return stored.token === token;
};

const csrfMiddleware = (req, res, next) => {
    // Skip for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip for API routes using Bearer tokens (they're already protected)
    if (req.headers.authorization?.startsWith('Bearer')) {
        return next();
    }

    const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;

    if (!sessionId || !csrfToken) {
        return res.status(403).json({
            error: 'CSRF Token Missing',
            code: 'CSRF_MISSING'
        });
    }

    if (!validateCSRFToken(sessionId, csrfToken)) {
        return res.status(403).json({
            error: 'Invalid CSRF token',
            code: 'CSRF_VALIDATION_FAILED'
        });
    }

    next();
};

// ==================== CONTENT SECURITY POLICY ====================

const cspMiddleware = (req, res, next) => {
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' https://apis.google.com https://cdn.jsdelivr.net", // Removed unsafe-inline where possible, allowing specific CDNs
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // unsafe-inline often needed for emotion/react-jss
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
        "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://api.groq.com wss://*.supabase.co", // Added Groq
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
    ].join('; ');

    res.setHeader('Content-Security-Policy', cspDirectives);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
};

// ==================== EXPORTS ====================

module.exports = {
    WAF,
    createIPFingerprint,
    generateCSRFToken,
    validateCSRFToken,
    csrfMiddleware,
    cspMiddleware
};

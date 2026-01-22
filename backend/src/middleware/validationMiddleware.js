/**
 * Frontend Action Validation Middleware
 * Validates all frontend requests to prevent cyber attacks
 * Moved from frontend to backend for security hardening
 */

// Security constants (moved from frontend)
const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_SIZE = 50 * 1024; // 50KB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_FILE_NAME_LENGTH = 100;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

// Request tracking for rate limiting
const requestCounts = new Map();

/**
 * Sanitize input to prevent XSS and SQL injection
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove event handlers
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remove javascript: URLs
        .replace(/javascript:/gi, '')
        // Remove SQL injection attempts
        .replace(/(['";]|--|\/\*|\*\/|union\s+select|drop\s+table|insert\s+into|delete\s+from)/gi, '')
        // Escape HTML entities
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate phone number format
 */
const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    return phoneRegex.test(phone);
};

/**
 * Validate UUID format
 */
const isValidUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};

/**
 * Check for suspicious patterns
 */
const hasSuspiciousPatterns = (text) => {
    const suspiciousPatterns = [
        /\b(eval|exec|system|shell|cmd|powershell)\b/i,
        /<(iframe|object|embed|form|input|script|link|meta)/i,
        /(\.\.\/)|(\.\.\\)/,
        /\x00/,
        /(base64|atob|btoa)\s*\(/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
};

/**
 * Validate request body fields
 */
const validateRequestBody = (body, requiredFields = [], optionalFields = []) => {
    const errors = [];
    const allFields = [...requiredFields, ...optionalFields];

    // Check required fields
    for (const field of requiredFields) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Check for unexpected fields (potential injection attempts)
    const bodyFields = Object.keys(body);
    for (const field of bodyFields) {
        if (!allFields.includes(field)) {
            errors.push(`Unexpected field: ${field}`);
        }
    }

    return errors;
};

/**
 * Main validation middleware
 */
const validateFrontendAction = (options = {}) => {
    return (req, res, next) => {
        try {
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const now = Date.now();

            // Rate limiting check
            const key = `${ip}:${req.path}`;
            const requests = requestCounts.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

            if (now > requests.resetTime) {
                requests.count = 1;
                requests.resetTime = now + RATE_LIMIT_WINDOW;
            } else {
                requests.count++;
            }
            requestCounts.set(key, requests);

            if (requests.count > (options.maxRequests || MAX_REQUESTS_PER_WINDOW)) {
                return res.status(429).json({
                    error: 'Too many requests. Please slow down.',
                    retryAfter: Math.ceil((requests.resetTime - now) / 1000)
                });
            }

            // Sanitize all string fields in body
            if (req.body && typeof req.body === 'object') {
                for (const key of Object.keys(req.body)) {
                    if (typeof req.body[key] === 'string') {
                        // Check for suspicious patterns before sanitizing
                        if (hasSuspiciousPatterns(req.body[key])) {
                            console.log(`⚠️ Suspicious pattern detected from ${ip} in field ${key}`);
                            return res.status(400).json({ error: 'Invalid input detected' });
                        }
                        req.body[key] = sanitizeInput(req.body[key]);
                    }
                }
            }

            // Validate required fields if specified
            if (options.requiredFields) {
                const validationErrors = validateRequestBody(
                    req.body,
                    options.requiredFields,
                    options.optionalFields || []
                );
                if (validationErrors.length > 0) {
                    return res.status(400).json({
                        error: 'Validation failed',
                        details: validationErrors
                    });
                }
            }

            // Validate email fields
            if (options.emailFields) {
                for (const field of options.emailFields) {
                    if (req.body[field] && !isValidEmail(req.body[field])) {
                        return res.status(400).json({ error: `Invalid email format: ${field}` });
                    }
                }
            }

            // Validate UUID fields
            if (options.uuidFields) {
                for (const field of options.uuidFields) {
                    if (req.body[field] && !isValidUUID(req.body[field])) {
                        return res.status(400).json({ error: `Invalid ID format: ${field}` });
                    }
                }
            }

            // Validate message length
            if (options.messageField && req.body[options.messageField]) {
                const maxLen = options.maxMessageLength || MAX_MESSAGE_LENGTH;
                if (req.body[options.messageField].length > maxLen) {
                    return res.status(400).json({
                        error: `${options.messageField} exceeds maximum length of ${maxLen} characters`
                    });
                }
            }

            // Validate numeric fields
            if (options.numericFields) {
                for (const config of options.numericFields) {
                    const value = req.body[config.field];
                    if (value !== undefined) {
                        const num = Number(value);
                        if (isNaN(num)) {
                            return res.status(400).json({ error: `${config.field} must be a number` });
                        }
                        if (config.min !== undefined && num < config.min) {
                            return res.status(400).json({ error: `${config.field} must be at least ${config.min}` });
                        }
                        if (config.max !== undefined && num > config.max) {
                            return res.status(400).json({ error: `${config.field} must not exceed ${config.max}` });
                        }
                    }
                }
            }

            // Validate array fields
            if (options.arrayFields) {
                for (const config of options.arrayFields) {
                    const arr = req.body[config.field];
                    if (arr !== undefined) {
                        if (!Array.isArray(arr)) {
                            return res.status(400).json({ error: `${config.field} must be an array` });
                        }
                        if (config.minLength && arr.length < config.minLength) {
                            return res.status(400).json({ error: `${config.field} must have at least ${config.minLength} items` });
                        }
                        if (config.maxLength && arr.length > config.maxLength) {
                            return res.status(400).json({ error: `${config.field} must not exceed ${config.maxLength} items` });
                        }
                    }
                }
            }

            next();
        } catch (err) {
            console.error('Validation middleware error:', err);
            res.status(500).json({ error: 'Internal validation error' });
        }
    };
};

/**
 * Image upload validation
 */
const validateImageUpload = (req, res, next) => {
    if (!req.body.image && !req.body.photo) {
        return next();
    }

    const imageData = req.body.image || req.body.photo;

    // Check if it's a base64 string
    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image format' });
    }

    // Extract mime type
    const mimeMatch = imageData.match(/^data:(image\/[^;]+);base64,/);
    if (!mimeMatch || !ALLOWED_IMAGE_TYPES.includes(mimeMatch[1])) {
        return res.status(400).json({
            error: 'Invalid image type. Allowed: JPEG, PNG, WEBP'
        });
    }

    // Check size (base64 encoded)
    const base64Data = imageData.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;

    if (sizeInBytes > MAX_IMAGE_SIZE) {
        return res.status(400).json({
            error: `Image too large. Maximum size: ${MAX_IMAGE_SIZE / 1024}KB`
        });
    }

    next();
};

/**
 * Student registration validation
 */
const validateStudentRegistration = validateFrontendAction({
    requiredFields: ['surname', 'first_name', 'email', 'phone', 'program_type', 'password'],
    optionalFields: ['middle_name', 'dob', 'gender', 'state', 'lga', 'address', 'subjects', 'photo', 'nin', 'guardian_name', 'guardian_phone'],
    emailFields: ['email'],
    messageField: 'address',
    maxMessageLength: 500
});

/**
 * Chat message validation
 */
const validateChatMessage = validateFrontendAction({
    requiredFields: ['message'],
    optionalFields: ['image'],
    messageField: 'message',
    maxMessageLength: MAX_MESSAGE_LENGTH
});

/**
 * Payment validation
 */
const validatePayment = validateFrontendAction({
    requiredFields: ['amount', 'payment_type'],
    optionalFields: ['tx_ref', 'student_id', 'description'],
    numericFields: [{ field: 'amount', min: 0, max: 1000000 }]
});

/**
 * CBT generation validation
 */
const validateCbtGeneration = validateFrontendAction({
    requiredFields: ['subjects'],
    optionalFields: ['totalTime', 'difficulty'],
    numericFields: [
        { field: 'totalTime', min: 10, max: 300 }
    ],
    arrayFields: [
        { field: 'subjects', minLength: 1, maxLength: 10 }
    ]
});

/**
 * Admin action validation
 */
const validateAdminAction = validateFrontendAction({
    requiredFields: ['action'],
    optionalFields: ['studentId', 'value', 'id', 'status', 'admin_note'],
    uuidFields: ['studentId', 'id']
});

module.exports = {
    validateFrontendAction,
    validateImageUpload,
    validateStudentRegistration,
    validateChatMessage,
    validatePayment,
    validateCbtGeneration,
    validateAdminAction,
    sanitizeInput,
    isValidEmail,
    isValidPhone,
    isValidUUID,
    MAX_MESSAGE_LENGTH,
    MAX_IMAGE_SIZE,
    ALLOWED_IMAGE_TYPES
};

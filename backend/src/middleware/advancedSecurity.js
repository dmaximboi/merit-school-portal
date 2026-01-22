/**
 * Zero Trust Security Framework
 * Implements "Never Trust, Always Verify" principles
 * 
 * Features:
 * - Zero Trust Networking
 * - Real-time Monitoring
 * - Behavior Analysis
 * - Short-lived Credentials
 * - Principle of Least Privilege
 * - Session Isolation
 */

const crypto = require('crypto');
const supabase = require('../config/supabaseClient');

// ==================== ZERO TRUST NETWORKING ====================

/**
 * Every request is verified regardless of source
 * No implicit trust based on network location
 */
class ZeroTrustNetwork {
    constructor() {
        this.trustedContexts = new Map();
        this.suspiciousActivities = new Map();
        this.accessDecisions = [];
    }

    /**
     * Verify request context before granting access
     * Implements "verify explicitly" principle
     */
    verifyRequestContext(req) {
        const context = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
            timestamp: Date.now(),
            path: req.path,
            method: req.method,
            hasAuth: !!req.headers.authorization,
            origin: req.headers.origin,
            referer: req.headers.referer
        };

        const risks = [];

        // Check for missing or suspicious headers
        if (!context.userAgent) risks.push('NO_USER_AGENT');
        if (!context.origin && req.method !== 'GET') risks.push('NO_ORIGIN');

        // Check for IP reputation (simplified)
        if (this.isIPBlacklisted(context.ip)) risks.push('BLACKLISTED_IP');

        // Check for unusual access patterns
        if (this.isUnusualAccess(context)) risks.push('UNUSUAL_ACCESS');

        context.riskScore = risks.length;
        context.risks = risks;
        context.trusted = risks.length === 0;

        return context;
    }

    isIPBlacklisted(ip) {
        // Implement IP blacklist check
        const blacklist = this.getBlacklist();
        return blacklist.includes(ip);
    }

    getBlacklist() {
        // In production, fetch from database or external service
        return [];
    }

    isUnusualAccess(context) {
        // Check for rapid successive requests from same context
        const key = `${context.ip}:${context.path}`;
        const history = this.suspiciousActivities.get(key) || [];
        const recentRequests = history.filter(t => Date.now() - t < 1000);

        history.push(Date.now());
        this.suspiciousActivities.set(key, history.slice(-100));

        return recentRequests.length > 10; // More than 10 requests per second
    }

    /**
     * Zero Trust Middleware
     */
    middleware() {
        return (req, res, next) => {
            const context = this.verifyRequestContext(req);

            req.trustContext = context;

            // Log access decision
            this.logAccessDecision(context);

            // Block high-risk requests
            if (context.riskScore >= 3) {
                return res.status(403).json({
                    error: 'Access denied by Zero Trust policy',
                    code: 'ZERO_TRUST_BLOCKED'
                });
            }

            next();
        };
    }

    logAccessDecision(context) {
        this.accessDecisions.push({
            ...context,
            decision: context.trusted ? 'ALLOW' : 'MONITOR'
        });

        // Keep only last 1000 decisions
        if (this.accessDecisions.length > 1000) {
            this.accessDecisions = this.accessDecisions.slice(-1000);
        }
    }

    getAccessLog() {
        return this.accessDecisions;
    }
}

// ==================== REAL-TIME MONITORING ====================

class RealTimeMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            errors: 0,
            blockedRequests: 0,
            activeUsers: new Set(),
            responseTimesMs: [],
            lastMinuteRequests: []
        };
        this.alerts = [];
        this.thresholds = {
            maxErrorRate: 0.1, // 10%
            maxResponseTimeMs: 5000,
            maxRequestsPerMinute: 1000
        };
    }

    recordRequest(req, res, startTime) {
        const duration = Date.now() - startTime;

        this.metrics.requests++;
        this.metrics.responseTimesMs.push(duration);
        this.metrics.lastMinuteRequests.push(Date.now());

        if (req.user?.id) {
            this.metrics.activeUsers.add(req.user.id);
        }

        // Check for anomalies
        this.checkThresholds();

        // Cleanup old data
        this.cleanup();
    }

    recordError(error, req) {
        this.metrics.errors++;

        this.alerts.push({
            type: 'ERROR',
            timestamp: new Date().toISOString(),
            path: req?.path,
            error: error.message,
            stack: error.stack?.split('\n')[0]
        });
    }

    recordBlocked(reason, req) {
        this.metrics.blockedRequests++;

        this.alerts.push({
            type: 'BLOCKED',
            timestamp: new Date().toISOString(),
            path: req?.path,
            reason,
            ip: req?.ip
        });
    }

    checkThresholds() {
        const recentRequests = this.metrics.lastMinuteRequests
            .filter(t => Date.now() - t < 60000).length;

        if (recentRequests > this.thresholds.maxRequestsPerMinute) {
            this.createAlert('HIGH_TRAFFIC', `${recentRequests} requests/min`);
        }

        const errorRate = this.metrics.errors / Math.max(1, this.metrics.requests);
        if (errorRate > this.thresholds.maxErrorRate) {
            this.createAlert('HIGH_ERROR_RATE', `${(errorRate * 100).toFixed(1)}%`);
        }
    }

    createAlert(type, details) {
        const alert = {
            type,
            details,
            timestamp: new Date().toISOString(),
            severity: type.includes('HIGH') ? 'HIGH' : 'MEDIUM'
        };

        this.alerts.push(alert);
        console.warn('[SECURITY ALERT]', JSON.stringify(alert));
    }

    cleanup() {
        // Keep only last 1000 response times
        if (this.metrics.responseTimesMs.length > 1000) {
            this.metrics.responseTimesMs = this.metrics.responseTimesMs.slice(-1000);
        }

        // Keep only last minute of requests
        const cutoff = Date.now() - 60000;
        this.metrics.lastMinuteRequests = this.metrics.lastMinuteRequests
            .filter(t => t > cutoff);

        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
    }

    getMetrics() {
        const avgResponseTime = this.metrics.responseTimesMs.length > 0
            ? this.metrics.responseTimesMs.reduce((a, b) => a + b, 0) / this.metrics.responseTimesMs.length
            : 0;

        return {
            totalRequests: this.metrics.requests,
            totalErrors: this.metrics.errors,
            blockedRequests: this.metrics.blockedRequests,
            activeUsers: this.metrics.activeUsers.size,
            avgResponseTimeMs: Math.round(avgResponseTime),
            requestsPerMinute: this.metrics.lastMinuteRequests
                .filter(t => Date.now() - t < 60000).length,
            recentAlerts: this.alerts.slice(-10)
        };
    }

    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();

            res.on('finish', () => {
                this.recordRequest(req, res, startTime);
            });

            next();
        };
    }
}

// ==================== BEHAVIOR ANALYSIS ====================

class BehaviorAnalyzer {
    constructor() {
        this.userBehaviors = new Map();
        this.anomalyThresholds = {
            maxRequestsPerMinute: 60,
            maxFailedLogins: 5,
            maxDifferentIPs: 3,
            unusualHours: [0, 1, 2, 3, 4, 5] // 12am-6am
        };
    }

    /**
     * Record user behavior for analysis
     */
    recordBehavior(userId, action, metadata = {}) {
        if (!this.userBehaviors.has(userId)) {
            this.userBehaviors.set(userId, {
                actions: [],
                ips: new Set(),
                failedAttempts: 0,
                lastSeen: null,
                riskScore: 0
            });
        }

        const behavior = this.userBehaviors.get(userId);
        behavior.actions.push({
            action,
            timestamp: Date.now(),
            ...metadata
        });

        if (metadata.ip) behavior.ips.add(metadata.ip);
        if (action === 'LOGIN_FAILED') behavior.failedAttempts++;
        if (action === 'LOGIN_SUCCESS') behavior.failedAttempts = 0;

        behavior.lastSeen = Date.now();

        // Cleanup old actions
        behavior.actions = behavior.actions.slice(-100);

        // Analyze for anomalies
        const anomalies = this.analyzeForAnomalies(userId);
        behavior.riskScore = anomalies.length;

        return anomalies;
    }

    /**
     * Analyze user behavior for anomalies
     */
    analyzeForAnomalies(userId) {
        const behavior = this.userBehaviors.get(userId);
        if (!behavior) return [];

        const anomalies = [];
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Check request frequency
        const recentActions = behavior.actions.filter(a => a.timestamp > oneMinuteAgo);
        if (recentActions.length > this.anomalyThresholds.maxRequestsPerMinute) {
            anomalies.push({ type: 'HIGH_FREQUENCY', count: recentActions.length });
        }

        // Check multiple IPs
        if (behavior.ips.size > this.anomalyThresholds.maxDifferentIPs) {
            anomalies.push({ type: 'MULTIPLE_IPS', count: behavior.ips.size });
        }

        // Check failed login attempts
        if (behavior.failedAttempts >= this.anomalyThresholds.maxFailedLogins) {
            anomalies.push({ type: 'BRUTE_FORCE', attempts: behavior.failedAttempts });
        }

        // Check unusual hours
        const hour = new Date().getHours();
        if (this.anomalyThresholds.unusualHours.includes(hour)) {
            anomalies.push({ type: 'UNUSUAL_HOUR', hour });
        }

        return anomalies;
    }

    /**
     * Get user risk assessment
     */
    getRiskAssessment(userId) {
        const behavior = this.userBehaviors.get(userId);
        if (!behavior) return { riskLevel: 'UNKNOWN', score: 0 };

        const score = behavior.riskScore;
        let riskLevel = 'LOW';

        if (score >= 3) riskLevel = 'CRITICAL';
        else if (score >= 2) riskLevel = 'HIGH';
        else if (score >= 1) riskLevel = 'MEDIUM';

        return {
            riskLevel,
            score,
            lastSeen: behavior.lastSeen,
            totalActions: behavior.actions.length,
            uniqueIPs: behavior.ips.size,
            failedAttempts: behavior.failedAttempts
        };
    }

    middleware() {
        return (req, res, next) => {
            if (req.user?.id) {
                const anomalies = this.recordBehavior(req.user.id, 'API_REQUEST', {
                    ip: req.ip,
                    path: req.path,
                    method: req.method
                });

                req.behaviorAnomalies = anomalies;

                // Block if too many anomalies
                if (anomalies.length >= 3) {
                    return res.status(403).json({
                        error: 'Suspicious behavior detected',
                        code: 'BEHAVIOR_BLOCKED'
                    });
                }
            }

            next();
        };
    }
}

// ==================== SHORT-LIVED CREDENTIALS ====================

class ShortLivedCredentials {
    constructor() {
        this.tokens = new Map();
        this.defaultTTL = 15 * 60 * 1000; // 15 minutes
    }

    /**
     * Generate a short-lived access token
     */
    generateToken(userId, purpose, ttlMs = this.defaultTTL) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + ttlMs;

        this.tokens.set(token, {
            userId,
            purpose,
            expiresAt,
            createdAt: Date.now(),
            used: false
        });

        return { token, expiresAt };
    }

    /**
     * Validate and consume a short-lived token
     */
    validateToken(token, purpose) {
        const data = this.tokens.get(token);

        if (!data) {
            return { valid: false, error: 'Token not found' };
        }

        if (Date.now() > data.expiresAt) {
            this.tokens.delete(token);
            return { valid: false, error: 'Token expired' };
        }

        if (data.purpose !== purpose) {
            return { valid: false, error: 'Token purpose mismatch' };
        }

        if (data.used) {
            return { valid: false, error: 'Token already used' };
        }

        // Mark as used (one-time use)
        data.used = true;
        this.tokens.set(token, data);

        return { valid: true, userId: data.userId };
    }

    /**
     * Revoke all tokens for a user
     */
    revokeUserTokens(userId) {
        for (const [token, data] of this.tokens.entries()) {
            if (data.userId === userId) {
                this.tokens.delete(token);
            }
        }
    }

    /**
     * Cleanup expired tokens
     */
    cleanup() {
        const now = Date.now();
        for (const [token, data] of this.tokens.entries()) {
            if (now > data.expiresAt) {
                this.tokens.delete(token);
            }
        }
    }

    /**
     * Generate a refresh token with longer TTL
     */
    generateRefreshToken(userId) {
        return this.generateToken(userId, 'refresh', 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    /**
     * Generate an access token with short TTL
     */
    generateAccessToken(userId) {
        return this.generateToken(userId, 'access', 15 * 60 * 1000); // 15 minutes
    }
}

// ==================== PRINCIPLE OF LEAST PRIVILEGE ====================

class LeastPrivilege {
    constructor() {
        // Define granular permissions
        this.permissions = {
            // Student permissions
            student: {
                'student:read:self': true,
                'student:update:self': true,
                'quiz:read:public': true,
                'quiz:submit:attempt': true,
                'cbt:read:questions': true,
                'cbt:submit:attempt': true,
                'library:read:resources': true,
                'chat:send:message': true,
                'results:read:self': true
            },
            // Staff permissions
            staff: {
                'student:read:assigned': true,
                'student:update:assigned': true,
                'results:create:assigned': true,
                'results:update:assigned': true,
                'quiz:create:own': true,
                'quiz:read:public': true,
                'library:read:resources': true,
                'library:upload:resources': true,
                'broadcast:create:own': true
            },
            // Parent permissions
            parent: {
                'student:read:child': true,
                'results:read:child': true,
                'quiz:read:public': true,
                'library:read:resources': true
            },
            // Admin permissions
            admin: {
                '*': true // Full access
            }
        };
    }

    /**
     * Check if a role has a specific permission
     */
    hasPermission(role, permission) {
        const rolePermissions = this.permissions[role];

        if (!rolePermissions) return false;

        // Admin has all permissions
        if (rolePermissions['*']) return true;

        // Check specific permission
        return !!rolePermissions[permission];
    }

    /**
     * Get all permissions for a role
     */
    getPermissions(role) {
        return this.permissions[role] || {};
    }

    /**
     * Middleware to enforce least privilege
     */
    requirePermission(permission) {
        return (req, res, next) => {
            const role = req.role || 'anonymous';

            if (!this.hasPermission(role, permission)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'PERMISSION_DENIED',
                    required: permission,
                    role: role
                });
            }

            next();
        };
    }

    /**
     * Add permission to a role dynamically
     */
    grantPermission(role, permission) {
        if (!this.permissions[role]) {
            this.permissions[role] = {};
        }
        this.permissions[role][permission] = true;
    }

    /**
     * Remove permission from a role
     */
    revokePermission(role, permission) {
        if (this.permissions[role]) {
            delete this.permissions[role][permission];
        }
    }
}

// ==================== SESSION ISOLATION ====================

class SessionIsolation {
    constructor() {
        this.sessions = new Map();
        this.maxSessionsPerUser = 3;
    }

    /**
     * Create an isolated session
     */
    createSession(userId, metadata = {}) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const session = {
            id: sessionId,
            userId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            metadata,
            isolated: true
        };

        // Get existing sessions for this user
        const userSessions = Array.from(this.sessions.values())
            .filter(s => s.userId === userId);

        // Remove oldest session if limit exceeded
        if (userSessions.length >= this.maxSessionsPerUser) {
            const oldest = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
            this.sessions.delete(oldest.id);
        }

        this.sessions.set(sessionId, session);
        return sessionId;
    }

    /**
     * Validate session
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);

        if (!session) {
            return { valid: false, error: 'Session not found' };
        }

        // Session expires after 24 hours of inactivity
        if (Date.now() - session.lastActivity > 24 * 60 * 60 * 1000) {
            this.sessions.delete(sessionId);
            return { valid: false, error: 'Session expired' };
        }

        // Update last activity
        session.lastActivity = Date.now();
        this.sessions.set(sessionId, session);

        return { valid: true, session };
    }

    /**
     * Destroy session
     */
    destroySession(sessionId) {
        return this.sessions.delete(sessionId);
    }

    /**
     * Destroy all sessions for a user
     */
    destroyUserSessions(userId) {
        for (const [id, session] of this.sessions.entries()) {
            if (session.userId === userId) {
                this.sessions.delete(id);
            }
        }
    }

    /**
     * Get active sessions for a user
     */
    getUserSessions(userId) {
        return Array.from(this.sessions.values())
            .filter(s => s.userId === userId);
    }
}

// ==================== EXPORTS ====================

const zeroTrust = new ZeroTrustNetwork();
const monitor = new RealTimeMonitor();
const behaviorAnalyzer = new BehaviorAnalyzer();
const shortLivedCredentials = new ShortLivedCredentials();
const leastPrivilege = new LeastPrivilege();
const sessionIsolation = new SessionIsolation();

module.exports = {
    ZeroTrustNetwork,
    RealTimeMonitor,
    BehaviorAnalyzer,
    ShortLivedCredentials,
    LeastPrivilege,
    SessionIsolation,
    // Pre-instantiated singletons
    zeroTrust,
    monitor,
    behaviorAnalyzer,
    shortLivedCredentials,
    leastPrivilege,
    sessionIsolation
};

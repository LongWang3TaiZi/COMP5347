const logger = require('../config/logger');

const adminAuditLogger = (action, targetResource) => {
    return (req, res, next) => {
        const originalSend = res.send;
        const originalJson = res.json;

        let logged = false;

        const interceptResponse = (body) => {
            if (!logged) {
                const adminUser = req.session?.user || req.session?.admin;

                logger.audit(`Admin operation: ${action}`, {
                    action,
                    adminId: adminUser?._id || adminUser?.id || 'unknown',
                    adminEmail: adminUser?.email || 'unknown',
                    adminName: adminUser?.firstname + ' ' + adminUser?.lastname || 'unknown',
                    adminRole: adminUser?.role || 'unknown',
                    targetResource,
                    targetId: req.params?.id || req.body?.id || null,
                    method: req.method,
                    path: req.originalUrl,
                    status: res.statusCode
                });
                logged = true;
            }
            return body;
        };

        res.send = function(body) {
            interceptResponse(body);
            originalSend.call(this, body);
        };

        res.json = function(body) {
            interceptResponse(body);
            originalJson.call(this, body);
        };

        next();
    };
};

module.exports = adminAuditLogger;
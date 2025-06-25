const winston = require('winston');
const path = require('path');

// add levels for logging
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    audit: 5,
};

// set log level based on environment (production environment usually only records info and above)
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};

// log colors in development environment
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
    audit: 'cyan',
};
winston.addColors(colors);

// define log format
const format = winston.format.combine(
    // add timestamp, format: YYYY-MM-DD HH:mm:ss
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
    // if development environment, add colors
    process.env.NODE_ENV === 'development' ? winston.format.colorize({all: true}) : winston.format.uncolorize(),
    // align log information
    winston.format.align(),
    // define log output template, include timestamp, level, message and possible metadata/error stack
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`
    ),
    // ensure Error objects can print stack information correctly
    winston.format.errors({stack: true})
);

const auditFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss:ms'}),
    winston.format.json(),
    winston.format.printf((info) => {
        const {
            timestamp,
            level,
            message,
            action,
            adminId,
            adminEmail,
            adminName,
            adminRole,
            targetResource,
            targetId,
            method,
            changes,
            status,
            ...rest
        } = info;

        const log = {
            timestamp,
            level,
            message,
            action,
            adminId,
            adminEmail,
            adminName,
            adminRole,
            targetResource,
            targetId,
            method,
            changes,
            status,
            ...rest
        };

        return JSON.stringify({
            timestamp,
            action,
            adminEmail,
            adminName,
            adminRole,
            targetResource,
            targetId,
            method,
            status,
            message
        }, null, 2);
    })
);

// level filter function to only allow specific level logs
const levelFilter = (level) => {
    return winston.format((info, opts) => {
        return info.level === level ? info : false;
    })();
};

// define Transports (log output destination)
const transports = [
    // always output to console
    new winston.transports.Console(),
    // output 'error' level and above to error.log file
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'), // __dirname points to the directory of the current file
        level: 'error'
    }),
    // output all logs (based on level) to combined.log file
    new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log')
    }),
];

// create Logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports
});

// create separate audit logger to only log audit level
const auditLogger = winston.createLogger({
    levels,
    level: 'audit',
    format: winston.format.combine(
        levelFilter('audit'),  // only allow audit level logs
        auditFormat
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/admin-audit.log'),
        })
    ]
});

logger.audit = function(message, meta = {}) {
    // use separate auditLogger instead of main logger
    auditLogger.log('audit', message, meta);
};

// export Logger instance
module.exports = logger;
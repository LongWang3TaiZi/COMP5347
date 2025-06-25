const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Old Phone Deals API',
            version: '1.0.0',
            description: 'API documentation for Old Phone Deals application',
        },
        servers: [
            {
                url: 'http://localhost:7777',
                description: 'Development server',
            },
        ],
    },
    apis: [
        './routes/*.js',
        './controllers/*.js',
        './models/*.js',
        './app.js',
        './controllers/admin/*.js',
        './routes/admin/*.js',
    ],
};

const specs = swaggerJsdoc(options);
module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(specs),
    specs
};
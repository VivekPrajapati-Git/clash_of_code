require('dotenv').config();
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
    process.env.NEO4J_URI || 'neo4j://localhost',
    neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
    )
);

module.exports = driver;

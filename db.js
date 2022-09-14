const redis = require('redis');

const client = redis.createClient({url: `redis://default:${process.env.REDIS_PW}@${process.env.REDIS_URL}`});

client.on('error', (err) => console.log('Redis Client Error', err));

module.exports = client;
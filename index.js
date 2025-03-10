const { Telegraf } = require('telegraf');
const JsConfuser = require('js-confuser');
const fs = require('fs');
const express = require('express');
const fetch = require('node-fetch');

const bot = new Telegraf('7928858550:AAHN1UmdI2jgigwMXr6FUB0uOwUt0ZKn_gI');
const app = express();
const startTime = Date.now();
const LOG_FILE = 'bot_log.json';

// Logging Function
function logActivity(user, action) {
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
        logs = JSON.parse(fs.readFileSync(LOG_FILE));
    }
    logs.push({ user, action, timestamp: new Date().toISOString() });
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

// Bot Start Message
bot.start((ctx) => {
    ctx.reply('👋 ආයුබෝවන්! .js file obfuscate කිරීමට `/obfuscate` command එක භාවිතා කරන්න.');
    logActivity(ctx.from.username, 'Started bot');
});

// Obfuscation Command
bot.command('obfuscate', async (ctx) => {
    ctx.reply('📂 කරුණාකර .js ගොනුවක් යවන්න!');
    logActivity(ctx.from.username, 'Requested obfuscation');
    ctx.reply('📝 කරුණාකර ඔබේ කැමති නමක් ලබා දෙන්න:');
});

// Handle Name Input
bot.on('text', async (ctx) => {
    const userName = ctx.message.text;  // Get user input (preferred name)

    // Check if the user has sent a file
    if (ctx.message.document) {
        const fileLink = await ctx.telegram.getFileLink(ctx.message.document.file_id);
        const response = await fetch(fileLink.href);
        const code = await response.text();

        ctx.reply('🔄 Obfuscation පටන් ගන්නවා...');

        // Obfuscation Settings with User's Name as Identifier
        const obfuscatedCode = await JsConfuser.obfuscate(code, {
            target: 'node',
            preset: 'high',
            compact: true,
            minify: true,
            flatten: true,
            stringEncoding: true,
            stringSplitting: 0.5, // Split long strings into multiple parts
            stringConcealing: true, // Hide strings in complex expressions
            stringCompression: true, // Compress strings
            duplicateLiteralsRemoval: 1.0, // Remove duplicate values
            shuffle: { hash: 1.0, true: 1.0 }, // Randomize statements
            stack: true, // Stack variable protection
            controlFlowFlattening: 1.0, // Make logic harder to understand
            opaquePredicates: 0.9, // Add fake conditions
            deadCode: 0.8, // Insert fake code paths
            dispatcher: true, // Dispatcher pattern for function execution
            hexadecimalNumbers: true, // Convert numbers to hex format
            movedDeclarations: true, // Move variable declarations
            objectExtraction: true, // Convert objects into encrypted structures
            globalConcealing: true, // Hide global variables
            calculator: true, // Transform expressions into complex calculations
            identifierGenerator: function () {
                const baseString = userName; // Use the user's provided name
                return baseString + Date.now().toString(36); // Combine it with a timestamp
            }
        });

        await ctx.replyWithDocument({ source: Buffer.from(obfuscatedCode), filename: 'obfuscated_code.js' });
        logActivity(ctx.from.username, 'Sent obfuscated file');
    } else {
        ctx.reply('❌ .js ගොනුවක් ලබා දී නැත. කරුණාකර .js ගොනුවක් යවන්න.');
    }
});

// Express Server for Bot Runtime Tracking
app.get('/', (req, res) => {
    const uptime = (Date.now() - startTime) / 1000;
    res.json({ status: 'Bot Running', uptime: `${uptime} seconds` });
});

// Show Logs via API
app.get('/logs', (req, res) => {
    if (fs.existsSync(LOG_FILE)) {
        res.sendFile(__dirname + '/' + LOG_FILE);
    } else {
        res.json({ message: 'No logs yet' });
    }
});

// Launch Bot & Server
bot.launch();
app.listen(3000, () => console.log('🌍 Bot status available at http://localhost:3000'));

const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const player = new Player(client);

// Load default extractors (YouTube, Spotify, SoundCloud search support)
async function initializePlayer() {
    await player.extractors.loadMulti(DefaultExtractors);
}
initializePlayer();

client.on('ready', () => {
    console.log(`[READY] ${client.user.tag} is online and ready to play music!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // PLAY COMMAND
    if (command === 'play') {
        const query = args.join(' ');
        if (!query) return message.reply('Please provide a song name or URL!');

        const channel = message.member?.voice?.channel;
        if (!channel) return message.reply('You need to join a voice channel first!');

        try {
            await message.reply(`Searching for: \`${query}\`...`);
            
            const { track } = await player.play(channel, query, {
                requestedBy: message.author
            });

            return message.channel.send(`🎶 Now Playing: **${track.title}**`);
        } catch (e) {
            console.error(e);
            return message.channel.send('❌ Something went wrong trying to play that track.');
        }
    }

    // STOP COMMAND (Stops music & clears queue, but STAYS in voice channel)
    if (command === 'stop') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.node.isPlaying()) {
            return message.reply('❌ There is no music playing right now, but I am staying in the voice channel!');
        }

        queue.tracks.clear();
        queue.node.stop();
        return message.reply('🛑 Stopped the music and cleared the queue! I am staying in the voice channel.');
    }

    // LEAVE COMMAND (Forces the bot to disconnect from the voice channel)
    if (command === 'leave') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue) {
            return message.reply('❌ I am not in a voice channel!');
        }

        queue.delete();
        return message.reply('👋 Left the voice channel.');
    }
});

// Dummy web server to satisfy Render's port requirement
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JAL Music v2 is online!');
});
server.listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN);

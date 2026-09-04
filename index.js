const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus } = require('@discordjs/voice');
const play = require('play-dl');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let connection = null;
let player = createAudioPlayer();

client.on('ready', () => {
    console.log(`[READY] ${client.user.tag} is online!`);
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
        if (!query) return message.reply('Please provide a YouTube URL or search query!');

        const channel = message.member?.voice?.channel;
        if (!channel) return message.reply('You need to join a voice channel first!');

        try {
            await message.reply(`Searching for: \`${query}\`...`);

            // Search YouTube safely to get a direct video URL
            let searchResult = await play.search(query, { limit: 1 });
            if (!searchResult || searchResult.length === 0) {
                return message.channel.send('❌ No results found for that query.');
            }

            const videoUrl = searchResult[0].url;

            // Connect to voice channel and keep it persistent
            if (!connection || connection.state.status === VoiceConnectionStatus.Disconnected) {
                connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                    selfDeaf: false
                });
            }

            connection.subscribe(player);

            // Fetch audio stream from the resolved URL
            let streamData = await play.stream(videoUrl);
            let resource = createAudioResource(streamData.stream, { type: streamData.type });

            player.play(resource);
            return message.channel.send(`🎶 Now Playing: **${searchResult[0].title}**`);
        } catch (e) {
            console.error(e);
            return message.channel.send('❌ Something went wrong trying to play that track.');
        }
    }

    // STOP COMMAND (Stops music but stays in voice channel 24/7)
    if (command === 'stop') {
        player.stop();
        return message.reply('🛑 Stopped the music, but I am staying in the voice channel!');
    }

    // LEAVE COMMAND (Disconnects the bot)
    if (command === 'leave') {
        if (connection) {
            connection.destroy();
            connection = null;
        }
        return message.reply('👋 Left the voice channel.');
    }
});

// Simple web server for Render
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('JAL Music v2 is online!');
});
server.listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN);

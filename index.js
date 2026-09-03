const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const player = new Player(client);

client.on('ready', () => {
    console.log(`[READY] ${client.user.tag} is online and ready to play music!`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

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
});

client.login(process.env.DISCORD_TOKEN);

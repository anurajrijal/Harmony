require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { io: SocketClient } = require('socket.io-client');
const MusicManager = require('./managers/MusicManager');
const KeywordManager = require('./managers/KeywordManager');
const RoleManager = require('./managers/RoleManager');
const GreetingManager = require('./managers/GreetingManager');
const { registerCommands } = require('./commands');
const ffmpeg = require('ffmpeg-static');
const play = require('play-dl');

// Forensic Stability Config
console.log('🛡️ [Audio] Identity Masking & SoundCloud Protocol active');

if (!ffmpeg) {
  console.warn('⚠️ [Audio] FFmpeg binary not found in static bundle. Audio may fail.');
} else {
  process.env.FFMPEG_PATH = ffmpeg;
  console.log('🎙️ [Audio] Acoustic Engine initialized (FFmpeg Static) at ' + ffmpeg);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Connect to backend via Socket.io
const socket = SocketClient(process.env.BACKEND_URL || 'http://localhost:3001');

socket.on('connect', () => {
  console.log('🔌 Connected to backend via Socket.io');
});

socket.on('disconnect', () => console.log('⚡ Disconnected from backend'));

// Initialize managers
const musicManager = new MusicManager(client, socket);
const keywordManager = new KeywordManager(client, socket);
const roleManager = new RoleManager(client, socket);
const greetingManager = new GreetingManager(client, socket);

// Listen for dashboard music controls
socket.on('music-control', async (data) => {
  const { guildId, action, data: controlData } = data;
  try {
    switch (action) {
      case 'play': await musicManager.playFromDashboard(guildId, controlData); break;
      case 'addToPlaylist': await musicManager.addToPlaylistFromDashboard(guildId, controlData); break;
      case 'pause': musicManager.pause(guildId); break;
      case 'resume': musicManager.resume(guildId); break;
      case 'skip': await musicManager.skip(guildId); break;
      case 'stop': musicManager.stop(guildId); break;
      case 'volume': musicManager.setVolume(guildId, controlData.volume); break;
    }
  } catch (err) {
    console.error(`[Music Control] Error:`, err.message);
  }
});

// Helper to sync guild to backend
const syncGuild = (guild) => {
  socket.emit('guild-update', {
    guildId: guild.id,
    name: guild.name,
    icon: guild.icon,
    memberCount: guild.memberCount,
    ownerId: guild.ownerId,
  });
};

// Bot ready
client.once(Events.ClientReady, async () => {
  console.log(`\n🤖 Bot logged in as ${client.user.tag}`);
  console.log(`📡 Serving ${client.guilds.cache.size} guilds\n`);
  
  client.user.setActivity('🎵 Music & Moderation', { type: 0 });
  await registerCommands(client);
  await keywordManager.loadAllRules();
  await roleManager.loadAllRules();
  client.guilds.cache.forEach(syncGuild);
  socket.emit('bot-status', { status: 'online', guilds: client.guilds.cache.size });
  socket.emit('sync-guilds', client.guilds.cache.map(g => g.id));
});

// Slash command handling
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;
  try {
    switch (commandName) {
      case 'play': await musicManager.play(interaction, interaction.options.getString('query')); break;
      case 'pause': musicManager.pause(interaction.guildId); await interaction.reply('⏸️ Paused'); break;
      case 'resume': musicManager.resume(interaction.guildId); await interaction.reply('▶️ Resumed'); break;
      case 'skip': await musicManager.skip(interaction.guildId); await interaction.reply('⏭️ Skipped'); break;
      case 'stop': musicManager.stop(interaction.guildId); await interaction.reply('⏹️ Stopped and cleared queue'); break;
      case 'queue': await musicManager.showQueue(interaction); break;
      case 'playlist':
        if (interaction.options.getSubcommand() === 'list') {
          await musicManager.listPlaylists(interaction);
        } else if (interaction.options.getSubcommand() === 'play') {
          await musicManager.playPlaylistCommand(interaction);
        }
        break;
      case 'volume':
        const vol = interaction.options.getInteger('level');
        musicManager.setVolume(interaction.guildId, vol);
        await interaction.reply(`🔊 Volume set to ${vol}%`);
        break;
      case 'help':
        const helpEmbed = {
          title: '🛡️ Harmony Core Tactical brief',
          description: 'Synthesizing available command protocols for this sector.',
          color: 0x5865F2,
          fields: [
            { name: '🎵 Acoustic Studio', value: '`/play`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/volume`, `/playlist list`, `/playlist play`' },
            { name: '🧠 Intelligence Hub', value: 'Auto-replies are active. Manage keywords via the [Dashboard](http://localhost:5173).' },
            { name: '🔒 Security HQ', value: 'Reaction roles and automation are active. Manage via the dashboard.' }
          ],
          footer: { text: 'Harmony Core v1.2 | Operational Status: Green' },
          timestamp: new Date().toISOString()
        };
        await interaction.reply({ embeds: [helpEmbed] });
        break;
    }
  } catch (error) {
    console.error(`[Command Error] ${commandName}:`, error.message);
    const reply = { content: '❌ An error occurred', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  }
});

// Event listeners
client.on(Events.MessageCreate, async (m) => { if (!m.author.bot) await keywordManager.handleMessage(m); });
client.on(Events.MessageReactionAdd, async (r, u) => { if (!u.bot) await roleManager.handleReactionAdd(r, u); });
client.on(Events.MessageReactionRemove, async (r, u) => { if (!u.bot) await roleManager.handleReactionRemove(r, u); });
client.on(Events.GuildMemberAdd, async (m) => {
  await roleManager.handleMemberJoin(m);
  await greetingManager.handleMemberAdd(m);
});
client.on(Events.GuildMemberRemove, async (m) => await greetingManager.handleMemberRemove(m));
client.on(Events.GuildCreate, async (g) => { syncGuild(g); socket.emit('bot-status', { status: 'online', guilds: client.guilds.cache.size }); });

client.on('error', console.error);
process.on('unhandledRejection', console.error);
client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);

// Dummy HTTP server to satisfy Render's port binding requirement if deployed as a Web Service
const http = require('http');
const port = process.env.PORT || process.env.BOT_PORT || 3002;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Discord Bot is running natively.');
}).listen(port, () => {
  console.log(`🌐 Dummy web server listening on port ${port} to satisfy Render port scan`);
});

module.exports = client;

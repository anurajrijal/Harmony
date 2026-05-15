const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder().setName('play').setDescription('Play a song')
    .addStringOption(opt => opt.setName('query').setDescription('Song name or URL').setRequired(true)),
  new SlashCommandBuilder().setName('pause').setDescription('Pause playback'),
  new SlashCommandBuilder().setName('resume').setDescription('Resume playback'),
  new SlashCommandBuilder().setName('skip').setDescription('Skip current song'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop and clear queue'),
  new SlashCommandBuilder().setName('queue').setDescription('Show current queue'),
  new SlashCommandBuilder().setName('volume').setDescription('Set volume')
    .addIntegerOption(opt => opt.setName('level').setDescription('Volume 0-100').setRequired(true).setMinValue(0).setMaxValue(100)),
  new SlashCommandBuilder().setName('help').setDescription('View available forensic commands'),
  new SlashCommandBuilder().setName('playlist').setDescription('Manage and play your server playlists')
    .addSubcommand(sub => sub.setName('list').setDescription('Show all playlists for this server'))
    .addSubcommand(sub => sub.setName('play').setDescription('Play a playlist')
      .addStringOption(opt => opt.setName('name').setDescription('Name of the playlist to play').setRequired(true))),
];

async function registerCommands(client) {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    console.log('🔄 Registering global slash commands...');
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands.map(c => c.toJSON()),
    });
    console.log('✅ Global slash commands registered');

    // Register to all guilds for instant access
    console.log('⚡ Registering guild-specific commands for instant sync...');
    const guilds = await client.guilds.fetch();
    for (const [guildId, guild] of guilds) {
      try {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), {
          body: commands.map(c => c.toJSON()),
        });
        console.log(`✅ Commands synced for guild: ${guild.name} (${guildId})`);
      } catch (err) {
        console.error(`❌ Failed to sync for guild ${guildId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
}

module.exports = { registerCommands, commands };

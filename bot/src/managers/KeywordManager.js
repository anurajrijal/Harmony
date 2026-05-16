const axios = require('axios');

const API = (process.env.BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

class KeywordManager {
  constructor(client, socket) {
    this.client = client;
    this.socket = socket;
    this.rules = new Map(); // guildId -> [rules]
    this.cooldowns = new Map(); // `${guildId}:${keyword}` -> timestamp

    // Listen for real-time keyword updates from dashboard
    socket.on('keyword-update', (data) => {
      console.log(`[Keywords] Rule ${data.action} for guild via dashboard`);
      this.loadRulesForGuild(data.guildId);
    });
  }

  async loadAllRules() {
    for (const guild of this.client.guilds.cache.values()) {
      await this.loadRulesForGuild(guild.id);
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms staggered delay
    }
    console.log(`✅ Loaded keyword rules for ${this.rules.size} guilds`);
  }

  async loadRulesForGuild(guildId) {
    if (!guildId) return;
    try {
      const res = await axios.get(`${API}/api/keywords?guildId=${guildId}`, {
        headers: { 'x-bot-api-key': process.env.BOT_API_KEY }
      });
      if (res.data.success) {
        this.rules.set(guildId, res.data.keywords.filter(k => k.enabled));
      }
    } catch (error) {
      console.error(`[Keywords] Failed to load rules for ${guildId}:`, error.message);
    }
  }

  async handleMessage(message) {
    const guildRules = this.rules.get(message.guildId);
    if (!guildRules || !guildRules.length) return;

    const content = message.content.toLowerCase();

    for (const rule of guildRules) {
      // Check channel restriction
      if (rule.channelIds?.length && !rule.channelIds.includes(message.channelId)) continue;

      let matched = false;
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.keyword, 'i');
          matched = regex.test(message.content);
        } catch { continue; }
      } else {
        matched = content.includes(rule.keyword.toLowerCase());
      }

      if (!matched) continue;

      // Check cooldown
      const cooldownKey = `${message.guildId}:${rule.keyword}`;
      const lastUsed = this.cooldowns.get(cooldownKey) || 0;
      if (Date.now() - lastUsed < (rule.cooldown || 5) * 1000) continue;
      this.cooldowns.set(cooldownKey, Date.now());

      // Replace @username with actual user ping
      let responseText = rule.response || '';
      responseText = responseText.replace(/@username/gi, `<@${message.author.id}>`);

      // Send response
      try {
        const allowedMentions = { parse: ['users', 'roles', 'everyone'] };
        
        if (rule.responseType === 'embed' && rule.embedData) {
          let embedDesc = rule.embedData.description || responseText;
          embedDesc = embedDesc.replace(/@username/gi, `<@${message.author.id}>`);
          
          await message.reply({
            content: responseText !== rule.response ? responseText : undefined, // Include parsed text outside embed if modified
            embeds: [{
              title: rule.embedData.title,
              description: embedDesc,
              color: parseInt(rule.embedData.color?.replace('#', '') || '5865F2', 16),
              footer: rule.embedData.footer ? { text: rule.embedData.footer } : undefined,
              thumbnail: rule.embedData.thumbnail ? { url: rule.embedData.thumbnail } : undefined,
              image: rule.embedData.image ? { url: rule.embedData.image } : undefined,
            }],
            allowedMentions
          });
        } else {
          await message.reply({
            content: responseText,
            allowedMentions
          });
        }

        // Log the auto-reply
        this.socket.emit('log-event', {
          guildId: message.guildId,
          type: 'keyword',
          action: 'auto-reply',
          userId: message.author.id,
          username: message.author.username,
          details: `Triggered keyword "${rule.keyword}" in #${message.channel.name}`,
        });
      } catch (err) {
        console.error('[Keywords] Reply error:', err.message);
      }
      break; // Only match first rule
    }
  }
}

module.exports = KeywordManager;

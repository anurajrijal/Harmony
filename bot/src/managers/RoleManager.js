const axios = require('axios');

const API = process.env.BACKEND_URL || 'http://localhost:3001';

class RoleManager {
  constructor(client, socket) {
    this.client = client;
    this.socket = socket;
    this.rules = new Map(); // guildId -> [rules]

    this.socket.on('role-update', (data) => {
      console.log(`[Roles] Rule ${data.action} for guild via dashboard`);
      this.loadRulesForGuild(data.guildId);
    });
  }

  async loadAllRules() {
    for (const guild of this.client.guilds.cache.values()) {
      await this.loadRulesForGuild(guild.id);
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms staggered delay
    }
    console.log(`✅ Loaded role rules for ${this.rules.size} guilds`);
  }

  async loadRulesForGuild(guildId) {
    try {
      const res = await axios.get(`${API}/api/roles?guildId=${guildId}`, {
        headers: { 'x-bot-api-key': process.env.BOT_API_KEY }
      });
      if (res.data.success) {
        this.rules.set(guildId, res.data.rules.filter(r => r.enabled));
      }
    } catch (error) {
      console.error(`[Roles] Failed to load rules for ${guildId}:`, error.message);
    }
  }

  async handleMemberJoin(member) {
    const guildRules = this.rules.get(member.guild.id);
    if (!guildRules) return;

    const autoJoinRules = guildRules.filter(r => r.type === 'auto-join');
    for (const rule of autoJoinRules) {
      try {
        await member.roles.add(rule.roleId);
        this.socket.emit('log-event', {
          guildId: member.guild.id, type: 'role', action: 'auto-role-assign',
          userId: member.id, username: member.user.username,
          details: `Auto-assigned role ${rule.roleName || rule.roleId}`,
        });
      } catch (err) {
        console.error('[Roles] Auto-join error:', err.message);
      }
    }
  }

  async handleReactionAdd(reaction, user) {
    if (reaction.partial) await reaction.fetch().catch(() => {});
    const guildRules = this.rules.get(reaction.message.guildId);
    if (!guildRules) return;

    const reactionRules = guildRules.filter(r =>
      r.type === 'reaction' && r.messageId === reaction.message.id &&
      r.emoji === (reaction.emoji.id || reaction.emoji.name)
    );

    for (const rule of reactionRules) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.add(rule.roleId);
      } catch (err) {
        console.error('[Roles] Reaction add error:', err.message);
      }
    }
  }

  async handleReactionRemove(reaction, user) {
    if (reaction.partial) await reaction.fetch().catch(() => {});
    const guildRules = this.rules.get(reaction.message.guildId);
    if (!guildRules) return;

    const reactionRules = guildRules.filter(r =>
      r.type === 'reaction' && r.messageId === reaction.message.id &&
      r.emoji === (reaction.emoji.id || reaction.emoji.name)
    );

    for (const rule of reactionRules) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.remove(rule.roleId);
      } catch (err) {
        console.error('[Roles] Reaction remove error:', err.message);
      }
    }
  }
}

module.exports = RoleManager;

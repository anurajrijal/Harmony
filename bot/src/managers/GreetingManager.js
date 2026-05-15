const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const API = process.env.BACKEND_URL || 'http://localhost:3001';

class GreetingManager {
  constructor(client, socket) {
    this.client = client;
    this.socket = socket;
    
    // Listen for realtime greeting updates from dashboard
    socket.on('greeting-update', (data) => {
      console.log(`[Greetings] Settings updated for guild ${data.guildId}`);
    });
  }

  async getGuildSettings(guildId) {
    try {
      const res = await axios.get(`${API}/api/greetings?guildId=${guildId}`, {
        headers: { 'x-bot-api-key': process.env.BOT_API_KEY }
      });
      if (res.data.success && res.data.config.enabled) {
        return res.data.config;
      }
    } catch (err) {
      console.error(`[Greetings] Failed to fetch settings for ${guildId}:`, err.message);
    }
    return null;
  }

  async createGreetingCard(member, settings, type, transparent = false) {
    const canvas = createCanvas(800, 300);
    const ctx = canvas.getContext('2d');

    const imageToUse = type === 'welcome' ? settings.welcomeImage : settings.goodbyeImage;

    if (!transparent) {
      try {
        // 1. Draw Background
        const background = await loadImage(imageToUse || settings.backgroundImage);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      } catch (e) {
        // Fallback if URL is invalid
        ctx.fillStyle = '#23272A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Add slight dimming overlay to make text pop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Draw Avatar
    ctx.save(); // Save state before clipping
    const avatarSize = 150;
    const avatarX = 50;
    const avatarY = (canvas.height / 2) - (avatarSize / 2);
    
    ctx.beginPath();
    ctx.arc(avatarX + (avatarSize / 2), avatarY + (avatarSize / 2), avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarUrl);
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    
    // Restore state to remove clipping
    ctx.restore();
    
    // Add border to avatar
    ctx.beginPath();
    ctx.arc(avatarX + (avatarSize / 2), avatarY + (avatarSize / 2), avatarSize / 2, 0, Math.PI * 2, true);
    ctx.lineWidth = 6;
    ctx.strokeStyle = settings.textColor || '#FFFFFF';
    ctx.stroke();

    // 4. Write Text
    ctx.fillStyle = settings.textColor || '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    
    const titleText = type === 'welcome' ? 'WELCOME TO THE SERVER' : 'GOODBYE';
    ctx.fillText(titleText, 230, 130);

    ctx.font = '48px sans-serif';
    ctx.fillStyle = settings.textColor || '#FFFFFF';
    ctx.fillText(member.user.username.toUpperCase(), 230, 190);
    
    ctx.font = '24px sans-serif';
    const memberCountText = `Member #${member.guild.memberCount}`;
    ctx.fillText(memberCountText, 230, 240);

    return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'greeting.png' });
  }

  async handleMemberAdd(member) {
    const settings = await this.getGuildSettings(member.guild.id);
    if (!settings || !settings.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
    if (!channel) return;

    const text = settings.welcomeMessage.replace(/@user/gi, `<@${member.id}>`);
    const welcomeImg = settings.welcomeImage || settings.backgroundImage;
    // Auto-detect GIF even if toggle is off, but respect toggle if user wants to force it
    const isGif = (settings.welcomeGifMode || welcomeImg?.toLowerCase().includes('.gif')) && welcomeImg;
    const attachment = await this.createGreetingCard(member, settings, 'welcome', isGif);

    if (isGif) {
      const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
      const gifAttachment = new AttachmentBuilder(welcomeImg, { name: 'welcome.gif' });
      
      const embed = new EmbedBuilder()
        .setDescription(text)
        .setImage('attachment://welcome.gif')
        .setThumbnail('attachment://greeting.png')
        .setColor(settings.textColor || 0x5865F2);
      
      await channel.send({ embeds: [embed], files: [attachment, gifAttachment] });
    } else {
      await channel.send({ content: text, files: [attachment] });
    }
  }

  async handleMemberRemove(member) {
    const settings = await this.getGuildSettings(member.guild.id);
    if (!settings || !settings.goodbyeChannelId) return;

    const channel = member.guild.channels.cache.get(settings.goodbyeChannelId);
    if (!channel) return;

    const text = settings.goodbyeMessage.replace(/@user/gi, `**${member.user.username}**`);
    const goodbyeImg = settings.goodbyeImage || settings.backgroundImage;
    // Auto-detect GIF even if toggle is off
    const isGif = (settings.goodbyeGifMode || goodbyeImg?.toLowerCase().includes('.gif')) && goodbyeImg;
    const attachment = await this.createGreetingCard(member, settings, 'goodbye', isGif);

    if (isGif) {
      const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
      const gifAttachment = new AttachmentBuilder(goodbyeImg, { name: 'goodbye.gif' });
      
      const embed = new EmbedBuilder()
        .setDescription(text)
        .setImage('attachment://goodbye.gif')
        .setThumbnail('attachment://greeting.png')
        .setColor(settings.textColor || 0xFF0000);
      
      await channel.send({ embeds: [embed], files: [attachment, gifAttachment] });
    } else {
      await channel.send({ content: text, files: [attachment] });
    }
  }
}

module.exports = GreetingManager;

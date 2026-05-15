const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');
const axios = require('axios');

class MusicManager {
  constructor(client, socket) {
    this.client = client;
    this.socket = socket;
    this.queues = new Map(); // guildId -> { tracks, player, connection, ... }
    this._initPlayDL();
  }

  async _initPlayDL() {
    try {
      // play-dl 1.9+ handles client_id internally if getFreeClientID is called
      const client_id = await play.getFreeClientID();
      if (client_id) {
        await play.setToken({
          soundcloud: {
            client_id: client_id
          }
        });
        console.log('✅ [Music] SoundCloud integration active.');
      }
    } catch (err) {
      console.warn('⚠️ [Music] SoundCloud Handshake Failure:', err.message);
    }
  }

  getQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        tracks: [],
        currentIndex: 0,
        player: createAudioPlayer(),
        connection: null,
        isPlaying: false,
        volume: 50,
        textChannelId: null,
      });
    }
    return this.queues.get(guildId);
  }

  async play(interaction, query) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });
    }

    try {
      await interaction.deferReply();
      let trackInfo;
      const validation = await play.validate(query);

      if (validation.includes('spotify')) {
        if (play.is_active_spotify()) {
          const spData = await play.spotify(query);
          if (spData.type === 'track') {
            trackInfo = {
              title: `${spData.name} - ${spData.artists[0].name}`,
              url: query,
              duration: spData.durationRaw || '0:00',
              thumbnail: spData.thumbnail?.url,
              requestedBy: member.user.username,
              isSpotify: true
            };
          }
        } else {
          const spData = await play.spotify(query).catch(() => null);
          if (spData) {
            trackInfo = {
              title: `${spData.name} - ${spData.artists[0].name}`,
              url: query,
              duration: '0:00',
              thumbnail: spData.thumbnail?.url,
              requestedBy: member.user.username,
              isSpotify: true
            };
          }
        }
      } else if (validation === 'video' || validation === 'playlist') {
        const info = await play.video_info(query);
        trackInfo = {
          title: info.video_details.title,
          url: info.video_details.url,
          duration: info.video_details.durationRaw,
          thumbnail: info.video_details.thumbnails[0]?.url,
          requestedBy: member.user.username,
        };
      } else {
        const results = await play.search(query, { limit: 1 });
        if (!results.length) return interaction.editReply('❌ No results found');
        trackInfo = {
          title: results[0].title,
          url: results[0].url,
          duration: results[0].durationRaw,
          thumbnail: results[0].thumbnails[0]?.url,
          requestedBy: member.user.username,
        };
      }

      const queue = this.getQueue(interaction.guildId);
      queue.tracks.push(trackInfo);
      queue.textChannelId = interaction.channelId;

      if (!queue.connection) {
        queue.connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
          selfDeaf: true,
        });
        queue.connection.on('stateChange', (oldState, newState) => {
          console.log(`[Voice] Protocol State: ${oldState.status} -> ${newState.status}`);
        });
        queue.connection.subscribe(queue.player);
        this._setupPlayerEvents(interaction.guildId);
      }

      if (!queue.isPlaying) {
        await this._playTrack(interaction.guildId);
      }

      this._emitQueueUpdate(interaction.guildId);
      await interaction.editReply(`🎵 Added to deck: **${trackInfo.title}**`);
    } catch (error) {
      console.error('[Music] Play error:', error.message);
      const errMessage = '❌ Forensic stream failure. Check link or try title.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errMessage).catch(() => {});
      } else {
        await interaction.reply({ content: errMessage, ephemeral: true }).catch(() => {});
      }
    }
  }

  async playFromDashboard(guildId, data) {
    const queue = this.getQueue(guildId);
    if (!data?.query && !data?.tracks) return;
    
    try {
      if (data.tracks && Array.isArray(data.tracks)) {
        data.tracks.forEach(track => {
          queue.tracks.push({
            title: track.title,
            url: track.url,
            duration: track.duration || '0:00',
            thumbnail: track.thumbnail,
            requestedBy: 'Dashboard Playlist',
            isSpotify: track.isSpotify || false
          });
        });
      } else if (data.query) {
        let trackInfo;
        const validation = await play.validate(data.query);

        if (validation.includes('spotify')) {
          const spData = await play.spotify(data.query).catch(() => null);
          if (spData) {
            trackInfo = {
              title: `${spData.name} - ${spData.artists[0].name}`,
              url: data.query,
              duration: '0:00',
              thumbnail: spData.thumbnail?.url,
              requestedBy: 'Dashboard',
              isSpotify: true
            };
          }
        } else if (validation === 'video' || validation === 'playlist') {
          const info = await play.video_info(data.query);
          trackInfo = {
            title: info.video_details.title,
            url: info.video_details.url,
            duration: info.video_details.durationRaw,
            thumbnail: info.video_details.thumbnails[0]?.url,
            requestedBy: 'Dashboard',
          };
        } else {
          const results = await play.search(data.query, { limit: 1 });
          if (results.length > 0) {
            trackInfo = {
              title: results[0].title,
              url: results[0].url,
              duration: results[0].durationRaw,
              thumbnail: results[0].thumbnails[0]?.url,
              requestedBy: 'Dashboard',
            };
          }
        }
        
        if (!trackInfo) return;
        queue.tracks.push(trackInfo);
      }

      // Handle Tactical Voice Connection
      if (!queue.connection) {
        const guild = await this.client.guilds.fetch(guildId);
        let voiceChannel;

        if (data.userId) {
          try {
            const member = await guild.members.fetch(data.userId);
            voiceChannel = member?.voice?.channel;
          } catch (err) {
            console.warn(`[Music] Member beacon lost for ${data.userId}`);
          }
        }

        if (!voiceChannel) {
          voiceChannel = guild.channels.cache.find(c => c.type === 2 && c.members.size > 0);
          if (!voiceChannel) {
            // Fallback to any voice channel if empty
            voiceChannel = guild.channels.cache.find(c => c.type === 2);
          }
        }

        if (voiceChannel) {
          console.log(`📡 [Music] Initiating Handshake with channel: ${voiceChannel.name}`);
          queue.connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: guildId,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
          });

          queue.connection.on('stateChange', (oldState, newState) => {
            console.log(`🛰️ [Voice] Protocol State: ${oldState.status} -> ${newState.status}`);
          });

          queue.connection.subscribe(queue.player);
          this._setupPlayerEvents(guildId);
          
          // Tactical Ready Check (Non-blocking)
          const checkReady = setTimeout(() => {
            if (queue.connection?.state.status !== VoiceConnectionStatus.Ready) {
              console.warn('⚠️ [Voice] Stabilization taking too long. Attempting Protocol Reset...');
              // If stuck in connecting, this usually means a UDP block
            }
          }, 10000);

          // We'll proceed with play attempt, the player will buffer once ready
        }
      }

      if (!queue.isPlaying && queue.connection) {
        await this._playTrack(guildId);
      }
      this._emitQueueUpdate(guildId);
    } catch (err) {
      console.error('[Music] Dashboard play error:', err.message);
    }
  }

  async addToPlaylistFromDashboard(guildId, data) {
    if (!data?.query || !data?.playlistId) return;
    try {
      let trackInfo;
      const validation = await play.validate(data.query);

      if (validation.includes('spotify')) {
        const spData = await play.spotify(data.query).catch(() => null);
        if (spData) {
          trackInfo = {
            title: `${spData.name} - ${spData.artists[0].name}`,
            url: data.query,
            duration: '0:00',
            thumbnail: spData.thumbnail?.url,
          };
        }
      } else if (validation === 'video' || validation === 'playlist') {
        const info = await play.video_info(data.query);
        trackInfo = {
          title: info.video_details.title,
          url: info.video_details.url,
          duration: info.video_details.durationRaw,
          thumbnail: info.video_details.thumbnails[0]?.url,
        };
      } else {
        const results = await play.search(data.query, { limit: 1 });
        if (results.length > 0) {
          trackInfo = {
            title: results[0].title,
            url: results[0].url,
            duration: results[0].durationRaw,
            thumbnail: results[0].thumbnails[0]?.url,
          };
        }
      }
      
      if (!trackInfo) return;

      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      await axios.post(`${backendUrl}/api/playlists/${data.playlistId}/tracks`, { track: trackInfo }, {
        headers: { 'x-bot-api-key': process.env.BOT_API_KEY }
      });
      console.log(`✅ [Playlist] Track added to playlist ${data.playlistId}: ${trackInfo.title}`);
      
      // Notify frontend
      this.socket.emit('playlist-updated', { guildId });
    } catch (err) {
      console.error('[Music] Dashboard addToPlaylist error:', err.message);
    }
  }

  async _playTrack(guildId) {
    const queue = this.getQueue(guildId);
    if (queue.currentIndex >= queue.tracks.length) {
      queue.isPlaying = false;
      this._emitQueueUpdate(guildId);
      return;
    }

    const track = queue.tracks[queue.currentIndex];
    try {
      let streamUrl = track.url;
      
      // Spotify to YouTube Translation
      if (track.isSpotify || streamUrl.includes('spotify.com')) {
        const results = await play.search(track.title, { limit: 1 });
        if (results.length) streamUrl = results[0].url;
      }

      // Deep Link Sanitization
      if (streamUrl.includes('music.youtube.com')) {
        streamUrl = streamUrl.replace('music.youtube.com', 'www.youtube.com');
      }

      console.log(`🔍 [Music] Attempting stream for: ${track.title}`);
      
      let stream;
      if (streamUrl.includes('soundcloud.com')) {
        console.log(`☁️ [Music] SoundCloud Signal detected: ${streamUrl}`);
        stream = await play.stream(streamUrl);
      } else {
        console.log(`☁️ [Music] YouTube Signal detected: ${streamUrl}`);
        // Use direct stream for YouTube to bypass some info-gathering blockade triggers
        stream = await play.stream(streamUrl, { 
          quality: 0, // 0 is highest audio, 1 is medium, 2 is lowest
          discordPlayerCompatibility: true
        });
      }
      
      const resource = createAudioResource(stream.stream, { 
        inputType: stream.type,
        inlineVolume: true
      });
      
      resource.volume.setVolume(queue.volume / 100);
      queue.player.play(resource);
      queue.isPlaying = true;
      this._emitQueueUpdate(guildId);
      console.log(`✅ [Music] Successful Handshake: ${track.title}`);
    } catch (error) {
      console.error(`❌ [Music] YouTube Blockade detected for ${track.title}:`, error.message);
      
      if (!track.isRetry) {
        console.log(`☁️ [Music] Initiating Emergency SoundCloud Search for: ${track.title}`);
        try {
          const results = await play.search(track.title, { 
            limit: 1,
            source: { soundcloud: 'tracks' } 
          });
          if (results.length) {
            console.log(`✅ [Music] SoundCloud Signal Found: ${results[0].name}`);
            track.url = results[0].url;
            track.isRetry = true;
            track.isSpotify = false; 
            return this._playTrack(guildId);
          }
        } catch (searchErr) {
          console.error('[Music] Fallback search failed:', searchErr.message);
        }
      }

      queue.currentIndex++;
      await this._playTrack(guildId);
    }
  }

  _setupPlayerEvents(guildId) {
    const queue = this.getQueue(guildId);
    queue.player.on('stateChange', (oldState, newState) => {
      console.log(`[Player] State: ${oldState.status} -> ${newState.status}`);
    });
    queue.player.on(AudioPlayerStatus.Idle, async () => {
      queue.currentIndex++;
      if (queue.currentIndex < queue.tracks.length) {
        await this._playTrack(guildId);
      } else {
        queue.isPlaying = false;
        this._emitQueueUpdate(guildId);
        setTimeout(() => {
          const q = this.queues.get(guildId);
          if (q && !q.isPlaying) this.stop(guildId);
        }, 300000);
      }
    });
    queue.player.on('error', (error) => {
      console.error('[Player Error]', error.message);
      queue.currentIndex++;
      this._playTrack(guildId);
    });
  }

  pause(guildId) {
    const queue = this.queues.get(guildId);
    if (queue?.player) queue.player.pause();
    this._emitQueueUpdate(guildId);
  }

  resume(guildId) {
    const queue = this.queues.get(guildId);
    if (queue?.player) queue.player.unpause();
    this._emitQueueUpdate(guildId);
  }

  async skip(guildId) {
    const queue = this.queues.get(guildId);
    if (queue?.player) queue.player.stop();
  }

  stop(guildId) {
    const queue = this.queues.get(guildId);
    if (!queue) return;
    queue.tracks = [];
    queue.currentIndex = 0;
    queue.isPlaying = false;
    if (queue.player) queue.player.stop();
    if (queue.connection) {
      queue.connection.destroy();
      queue.connection = null;
    }
    this.queues.delete(guildId);
    this._emitQueueUpdate(guildId);
  }

  setVolume(guildId, volume) {
    const queue = this.queues.get(guildId);
    if (queue) {
      queue.volume = volume;
      if (queue.player.state.resource?.volume) {
        queue.player.state.resource.volume.setVolume(volume / 100);
      }
    }
  }

  async showQueue(interaction) {
    const queue = this.queues.get(interaction.guildId);
    if (!queue || !queue.tracks.length) return interaction.reply('📭 Queue is empty');
    const current = queue.tracks[queue.currentIndex];
    const upcoming = queue.tracks.slice(queue.currentIndex + 1, queue.currentIndex + 11);
    let description = `**Now Playing:**\n🎵 ${current.title}\n\n`;
    if (upcoming.length) {
      description += '**Up Next:**\n';
      upcoming.forEach((t, i) => { description += `${i + 1}. ${t.title}\n`; });
    }
    await interaction.reply({ embeds: [{ title: '🎶 Music Deck', description, color: 0x5865F2 }] });
  }

  _emitQueueUpdate(guildId) {
    const queue = this.getQueue(guildId);
    this.socket.emit('queue-update', {
      guildId,
      tracks: queue?.tracks || [],
      currentIndex: queue?.currentIndex || 0,
      isPlaying: queue?.isPlaying || false,
    });
  }

  async listPlaylists(interaction) {
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const res = await axios.get(`${backendUrl}/api/playlists?guildId=${interaction.guildId}`, {
        headers: { 'x-bot-api-key': process.env.BOT_API_KEY }
      });
      if (res.data.success) {
        const playlists = res.data.playlists;
        if (!playlists.length) return interaction.reply('📭 No playlists found for this server.');
        
        const description = playlists.map((p, i) => `**${i + 1}. ${p.name}** (${p.tracks.length} tracks)`).join('\n');
        await interaction.reply({ embeds: [{ title: '📑 Server Playlists', description, color: 0x5865F2 }] });
      } else {
        await interaction.reply({ content: '❌ Failed to fetch playlists', ephemeral: true });
      }
    } catch (err) {
      console.error('[Music] listPlaylists error:', err.message);
      await interaction.reply({ content: '❌ Error fetching playlists', ephemeral: true });
    }
  }

  async playPlaylistCommand(interaction) {
    const name = interaction.options.getString('name');
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });
    }

    try {
      await interaction.deferReply();
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const res = await axios.get(`${backendUrl}/api/playlists?guildId=${interaction.guildId}`, {
        headers: { 'x-bot-api-key': process.env.BOT_API_KEY }
      });
      
      if (!res.data.success) return interaction.editReply('❌ Failed to fetch playlists');
      
      const playlist = res.data.playlists.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (!playlist) return interaction.editReply(`❌ Playlist **${name}** not found.`);
      if (!playlist.tracks.length) return interaction.editReply(`📭 Playlist **${name}** is empty.`);

      const queue = this.getQueue(interaction.guildId);
      
      playlist.tracks.forEach(track => {
        queue.tracks.push({
          title: track.title,
          url: track.url,
          duration: track.duration || '0:00',
          thumbnail: track.thumbnail,
          requestedBy: member.user.username,
          isSpotify: track.isSpotify || false
        });
      });

      queue.textChannelId = interaction.channelId;

      if (!queue.connection) {
        queue.connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
          selfDeaf: true,
        });
        queue.connection.on('stateChange', (oldState, newState) => {
          console.log(`[Voice] Protocol State: ${oldState.status} -> ${newState.status}`);
        });
        queue.connection.subscribe(queue.player);
        this._setupPlayerEvents(interaction.guildId);
      }

      if (!queue.isPlaying) {
        await this._playTrack(interaction.guildId);
      }

      this._emitQueueUpdate(interaction.guildId);
      await interaction.editReply(`🎵 Added **${playlist.tracks.length} tracks** from playlist **${playlist.name}** to deck!`);
    } catch (err) {
      console.error('[Music] playPlaylistCommand error:', err.message);
      await interaction.editReply('❌ Error playing playlist');
    }
  }
}

module.exports = MusicManager;

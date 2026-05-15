const mongoose = require('mongoose');

const greetingSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  welcomeChannelId: { type: String, default: null },
  welcomeMessage: { type: String, default: 'Welcome to the server, @user!' },
  goodbyeChannelId: { type: String, default: null },
  goodbyeMessage: { type: String, default: '@user has left the server.' },
  backgroundImage: { type: String, default: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
  textColor: { type: String, default: '#FFFFFF' },
  useGifMode: { type: Boolean, default: false },
});

module.exports = mongoose.model('Greeting', greetingSchema);

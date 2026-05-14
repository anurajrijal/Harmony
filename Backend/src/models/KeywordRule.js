const mongoose = require('mongoose');

const keywordRuleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  keyword: { type: String, required: true },
  isRegex: { type: Boolean, default: false },
  response: { type: String, required: true },
  responseType: { type: String, enum: ['text', 'embed'], default: 'text' },
  embedData: {
    title: String,
    description: String,
    color: { type: String, default: '#5865F2' },
    footer: String,
    thumbnail: String,
    image: String,
  },
  channelIds: [{ type: String }], // Specific channels, empty = all
  cooldown: { type: Number, default: 5 }, // seconds
  enabled: { type: Boolean, default: true },
  createdBy: { type: String },
}, { timestamps: true });

keywordRuleSchema.index({ guildId: 1, keyword: 1 });

module.exports = mongoose.model('KeywordRule', keywordRuleSchema);

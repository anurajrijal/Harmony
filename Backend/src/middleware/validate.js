const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errors = error.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
};

// Schemas
const keywordSchema = z.object({
  keyword: z.string().min(1).max(200),
  isRegex: z.boolean().optional().default(false),
  response: z.string().min(1).max(2000),
  responseType: z.enum(['text', 'embed']).optional().default('text'),
  embedData: z.object({
    title: z.string().max(256).optional(),
    description: z.string().max(4096).optional(),
    color: z.string().optional(),
    footer: z.string().max(2048).optional(),
    thumbnail: z.string().url().optional().or(z.literal('')),
    image: z.string().url().optional().or(z.literal('')),
  }).optional(),
  channelIds: z.array(z.string()).optional().default([]),
  cooldown: z.number().min(0).max(3600).optional().default(5),
  enabled: z.boolean().optional().default(true),
});

const roleRuleSchema = z.object({
  type: z.enum(['auto-join', 'reaction', 'action']),
  roleId: z.string().min(1),
  roleName: z.string().optional(),
  messageId: z.string().optional(),
  channelId: z.string().optional(),
  emoji: z.string().optional(),
  triggerAction: z.string().optional(),
  triggerValue: z.number().optional(),
  enabled: z.boolean().optional().default(true),
});

const botSettingsSchema = z.object({
  prefix: z.string().min(1).max(5).optional(),
  musicEnabled: z.boolean().optional(),
  autoReplyEnabled: z.boolean().optional(),
  roleAutomationEnabled: z.boolean().optional(),
  allowedMusicChannels: z.array(z.string()).optional(),
  allowedCommandChannels: z.array(z.string()).optional(),
  djRoleId: z.string().optional(),
  defaultVolume: z.number().min(0).max(100).optional(),
  maxQueueSize: z.number().min(1).max(500).optional(),
  autoDisconnectTimeout: z.number().min(30).max(3600).optional(),
  is247Mode: z.boolean().optional(),
  welcomeChannelId: z.string().optional(),
  welcomeMessage: z.string().max(2000).optional(),
  logChannelId: z.string().optional(),
}).partial();

module.exports = {
  validate,
  keywordSchema,
  roleRuleSchema,
  botSettingsSchema,
};

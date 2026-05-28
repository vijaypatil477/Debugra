const express = require('express');
const axios = require('axios');
const logger = require('../utils/logger');
const router = express.Router();

router.post('/room-event', async (req, res) => {
  try {
    const { event, roomId, userName, passwordProtected } = req.body;

    if (!event || !roomId) {
      return res.status(400).json({ error: 'Missing required event fields' });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
    
    // If no webhook URL is configured, silently succeed
    if (!webhookUrl) {
      return res.json({ success: true, ignored: true });
    }

    let title = '';
    let description = '';
    let color = 0x5865F2; // Blurple default

    if (event === 'room_created') {
      title = '🆕 New Room Created!';
      description = `**${userName || 'Anonymous'}** created a new room.\n**Room ID:** \`${roomId}\`\n**Protected:** ${passwordProtected ? 'Yes 🔒' : 'No 🔓'}`;
      color = 0x57F287; // Green
    } else if (event === 'room_joined') {
      title = '👋 User Joined Room';
      description = `**${userName || 'Anonymous'}** joined room \`${roomId}\`.`;
      color = 0xFEE75C; // Yellow
    } else {
      title = 'ℹ️ Room Event';
      description = `Event: ${event} in room \`${roomId}\``;
    }

    // Format for Discord Rich Embed
    const payload = {
      embeds: [
        {
          title,
          description,
          color,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Debugra Notifications',
          },
        },
      ],
    };

    // Note: If using Slack, the payload structure would need to be adapted,
    // but many Slack webhook integrations support Discord-like basic payloads 
    // or standard text. For simplicity, we optimize for Discord embeds.

    await axios.post(webhookUrl, payload);
    logger.info(`Webhook dispatched for event: ${event} (Room: ${roomId})`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to dispatch webhook:', error.message);
    // Don't fail the client request if the webhook fails
    res.json({ success: false, error: 'Webhook dispatch failed' });
  }
});

module.exports = router;

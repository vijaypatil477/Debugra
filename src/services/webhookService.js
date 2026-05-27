const DISCORD_WEBHOOK_URL = import.meta.env.VITE_DISCORD_WEBHOOK_URL?.trim();
const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL?.trim();

function isValidWebhookUrl(url) {
  if (!url) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildFields({ roomId, displayName, language, activeUserCount, roomLink }) {
  return [
    { label: 'Room ID', value: roomId || 'Unknown' },
    { label: 'User', value: displayName || 'Guest' },
    { label: 'Language', value: language || 'Unknown' },
    { label: 'Active Users', value: String(activeUserCount ?? 0) },
    ...(roomLink ? [{ label: 'Room Link', value: roomLink }] : []),
  ];
}

function buildDiscordPayload(eventType, details) {
  const eventTitle = eventType === 'room_created' ? 'New Room Created' : 'User Joined Room';
  const color = eventType === 'room_created' ? 0x22c55e : 0x3b82f6;

  return {
    embeds: [
      {
        title: eventTitle,
        color,
        timestamp: new Date().toISOString(),
        fields: buildFields(details).map(({ label, value }) => ({
          name: label,
          value,
          inline: label !== 'Room Link',
        })),
        ...(details.roomLink ? { url: details.roomLink } : {}),
      },
    ],
  };
}

function buildSlackPayload(eventType, details) {
  const eventTitle = eventType === 'room_created' ? 'New Room Created' : 'User Joined Room';
  const fields = buildFields(details);

  return {
    text: `${eventTitle} in Debugra`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: eventTitle,
        },
      },
      {
        type: 'section',
        fields: fields
          .filter(({ label }) => label !== 'Room Link')
          .map(({ label, value }) => ({
            type: 'mrkdwn',
            text: `*${label}:*\n${value}`,
          })),
      },
      ...(details.roomLink
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Room Link:*\n<${details.roomLink}|Open Debugra room>`,
              },
            },
          ]
        : []),
    ],
  };
}

async function postWebhook(url, payload) {
  if (!isValidWebhookUrl(url)) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Webhook delivery must never interrupt room collaboration.
  }
}

async function sendRoomWebhook(eventType, details) {
  await Promise.allSettled([
    postWebhook(DISCORD_WEBHOOK_URL, buildDiscordPayload(eventType, details)),
    postWebhook(SLACK_WEBHOOK_URL, buildSlackPayload(eventType, details)),
  ]);
}

function getCurrentRoomLink() {
  if (typeof window === 'undefined') return null;
  return window.location.href || null;
}

export function notifyRoomCreated({ roomId, displayName, language, activeUserCount }) {
  void sendRoomWebhook('room_created', {
    roomId,
    displayName,
    language,
    activeUserCount,
    roomLink: getCurrentRoomLink(),
  });
}

export function notifyRoomJoined({ roomId, displayName, language, activeUserCount }) {
  void sendRoomWebhook('room_joined', {
    roomId,
    displayName,
    language,
    activeUserCount,
    roomLink: getCurrentRoomLink(),
  });
}

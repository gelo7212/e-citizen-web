# System Messages in SOS Admin

## Overview

The SOS messaging system automatically detects message type based on content:

- **Text Messages** - Single-line messages (no line breaks)
- **System Messages** - Multi-line messages with special formatting and emojis

No need to manually select - just type and the system adapts!

## How to Send the SOS Creation Message

When a new SOS is created, simply paste your multi-line formatted message into the input field:

```
🚨 New SOS created successfully.

🆔 SOS ID: ${data.sosId}

📞 For faster communication, please share your mobile number.

ℹ️ Tips to help us assist you quicker:
    • Clearly describe your situation and urgency
    • Share your exact location if possible
    • Stay active in the chat for updates

Our support team has been notified and will reach out as soon as possible.
```

The system will automatically detect it as a system message and format it with `whitespace: pre-wrap` to preserve all newlines and spacing.

## Usage in Admin Panel

1. **Single-line message** - Just type and send normally
   ```
   We're on our way to help you!
   ```
   ✓ Automatically sent as text message

2. **Multi-line message** - Press Enter between lines
   ```
   🚨 Emergency Response
   
   Your location has been confirmed.
   ETA: 5 minutes
   ```
   ✓ Automatically sent as system message with formatting preserved

## How It Works

- **Text Detection**: If your message contains any newlines (press Enter), it's automatically sent as a system message
- **No Manual Toggle**: No buttons to click - just type naturally
- **Smart Rendering**: Text messages appear compact, system messages show full formatting with spacing and bullets
- **Character Counter**: Shows line count for multi-line messages

## Technical Details

### Message Structure

```typescript
{

  senderType: 'SOS_ADMIN',
  senderId: 'admin-001',
  senderDisplayName: 'Admin Support',
  contentType: 'system',        // Key: use 'system' for formatted messages
  content: '...',              // Multi-line content preserved
  cityId: 'MNL'
}
```

### Rendering

System messages are rendered with `whitespace: pre-wrap` to preserve:
- ✅ Newlines and line breaks
- ✅ Emojis and special characters
- ✅ Indentation and spacing
- ✅ Bullet points and formatting

Text messages render as single-line breaks.

## Example Use Cases

### 1. SOS Creation Confirmation
```
🚨 New SOS created successfully.

🆔 SOS ID: SOS-2024-001

📍 Location confirmed: Manila, Metro Manila

⏱️ Estimated response time: 5-10 minutes

Your emergency has been registered. Our team is being dispatched now.
```

### 2. Status Update
```
🟡 Status Update

Your SOS has been escalated to Priority Level 2.

📞 Rescuer Assignment:
   Name: Juan Dela Cruz
   Unit: Fire Truck #5
   ETA: 3 minutes

Please keep your phone available for call updates.
```

### 3. Important Safety Tips
```
⚠️ Safety Instructions

While waiting for rescue:
• Stay in a safe location
• Keep your location info updated
• Respond to rescuer calls immediately
• Provide clear directions if asked

Do NOT attempt rescue yourself.
```

## Backend Considerations

When implementing the backend:
1. **Store `contentType`** in the message record
2. **Preserve newlines** in content field (don't strip or collapse)
3. **Support template variables** like `${sosId}` if needed
4. **Return messages with contentType** in API responses

### Example API Response
```json
{
  "success": true,
  "data": {
    "id": "msg-123",
    "sosId": "sos-456",
    "senderType": "SOS_ADMIN",
    "contentType": "system",
    "content": "🚨 New SOS created successfully.\n\n🆔 SOS ID: sos-456\n...",
    "createdAt": "2024-01-10T10:30:00Z"
  }
}
```

## Migration from Existing System

If you currently send formatted messages as plain text:

### Before
```typescript
contentType: 'text',
content: '🚨 New SOS created successfully.\n\n🆔 SOS ID: ...'
```

### After
```typescript
contentType: 'system',
content: `🚨 New SOS created successfully.

🆔 SOS ID: ${sosId}

📞 For faster communication...`
```

## Browser Support

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers
- ✅ All emoji sets supported
- ✅ Unicode characters fully supported

## Troubleshooting

### Message appears without formatting
- Check that `contentType: 'system'` was sent
- Verify newlines are preserved (not converted to spaces)
- Check browser console for errors

### Emojis not displaying
- Ensure UTF-8 encoding in database
- Check API response headers include `charset=utf-8`
- Verify frontend is rendering with proper character encoding

### Line breaks not showing
- Confirm `whitespace: pre-wrap` is applied in CSS
- Check that `\n` characters are preserved in transit
- Verify message content is not being HTML-encoded incorrectly

---

**Last Updated:** January 10, 2024

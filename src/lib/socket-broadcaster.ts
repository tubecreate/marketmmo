export async function broadcastToSocket(room: string, event: string, payload: any) {
  try {
    const socketUrl = process.env.INTERNAL_SOCKET_URL || 'http://localhost:3001/broadcast';
    const res = await fetch(socketUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, event, payload }),
    });
    
    if (!res.ok) {
      console.error(`Socket broadcast failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('Socket broadcast error:', err);
  }
}

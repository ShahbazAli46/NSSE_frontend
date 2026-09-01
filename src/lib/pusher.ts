import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (!pusherInstance) {
    const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY || 'a5c3493bb786a056bf4c';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'ap3';

    pusherInstance = new Pusher(appKey, {
      cluster: cluster,
      forceTLS: true,
    });
  }
  return pusherInstance;
}

import { AnglerPeer, ChatMessage, FishRarity } from '../types';

export interface RoomInfo {
  id: string;
  name: string;
  location: string;
  anglersCount: number;
}

export const AVAILABLE_ROOMS: RoomInfo[] = [
  { id: 'room_1', name: 'Emerald Pier #1', location: 'Village Dock Waters', anglersCount: 6 },
  { id: 'room_2', name: 'Forest Lake #2', location: 'Deep Pine Shore', anglersCount: 4 },
  { id: 'room_3', name: 'Misty Cove #3', location: 'Willow Stream Bend', anglersCount: 5 },
];

export const INITIAL_PEERS: AnglerPeer[] = [
  {
    id: 'peer_1',
    name: 'Dimas_Angler',
    avatar: '🧢',
    color: '#38bdf8',
    position: [-4.2, 0.45, 2.8],
    rotationY: 0.25,
    state: 'waiting',
    lastCatch: { name: 'Golden Carp', rarity: 'UNCOMMON', weight: 2.8 },
  },
  {
    id: 'peer_2',
    name: 'Sakura_Fisher',
    avatar: '👒',
    color: '#f472b6',
    position: [4.6, 0.45, 1.8],
    rotationY: -0.35,
    state: 'reeling',
    lastCatch: { name: 'Rainbow Trout', rarity: 'UNCOMMON', weight: 3.1 },
  },
  {
    id: 'peer_3',
    name: 'Uncle_Bob',
    avatar: '🎣',
    color: '#facc15',
    position: [7.2, 0.45, 3.4],
    rotationY: -0.5,
    state: 'waiting',
    lastCatch: { name: 'Northern Pike', rarity: 'RARE', weight: 6.2 },
  },
  {
    id: 'peer_4',
    name: 'Budi_Santoso',
    avatar: '🛶',
    color: '#4ade80',
    position: [-7.5, 0.45, 3.8],
    rotationY: 0.45,
    state: 'waiting',
    lastCatch: { name: 'Small Bass', rarity: 'COMMON', weight: 0.9 },
  },
];

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg_sys_1',
    sender: 'System',
    text: 'Connected to Emerald Pier #1. Serene water conditions detected.',
    timestamp: Date.now() - 120000,
    isSystem: true,
  },
  {
    id: 'msg_1',
    sender: 'Dimas_Angler',
    avatar: '🧢',
    text: 'Halo semua! Airnya tenang banget sore ini, semoga dapet carp emas.',
    timestamp: Date.now() - 95000,
  },
  {
    id: 'msg_2',
    sender: 'Sakura_Fisher',
    avatar: '👒',
    text: 'The evening breeze feels so peaceful here 🌸',
    timestamp: Date.now() - 60000,
  },
  {
    id: 'msg_3',
    sender: 'Uncle_Bob',
    avatar: '🎣',
    text: 'Remember to keep tension in the green sweet spot when reeling!',
    timestamp: Date.now() - 25000,
  },
];

class MultiplayerService {
  private peers: AnglerPeer[] = [...INITIAL_PEERS];
  private chatMessages: ChatMessage[] = [...INITIAL_CHAT];
  private listeners: Array<() => void> = [];
  private simulationInterval: number | null = null;
  private currentRoomId: string = 'room_1';

  constructor() {
    this.startPeerSimulation();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getPeers(): AnglerPeer[] {
    return this.peers;
  }

  public getChat(): ChatMessage[] {
    return this.chatMessages;
  }

  public getCurrentRoom(): RoomInfo {
    return AVAILABLE_ROOMS.find((r) => r.id === this.currentRoomId) || AVAILABLE_ROOMS[0];
  }

  public switchRoom(roomId: string) {
    this.currentRoomId = roomId;
    const room = this.getCurrentRoom();
    this.addSystemMessage(`Switched to ${room.name} (${room.location})`);
    this.notify();
  }

  public sendUserMessage(userName: string, text: string) {
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender: userName,
      avatar: '🌟',
      text,
      timestamp: Date.now(),
    };
    this.chatMessages.push(newMsg);
    if (this.chatMessages.length > 60) this.chatMessages.shift();
    this.notify();

    // Trigger occasional lively response from peers
    this.simulatePeerResponse(text);
  }

  public broadcastPlayerCatch(playerName: string, fishName: string, rarity: FishRarity, weight: number) {
    const msg: ChatMessage = {
      id: 'catch_' + Date.now(),
      sender: 'Fish Master',
      text: `🎣 ${playerName} landed a ${weight.toFixed(1)}kg ${fishName} [${rarity}]!`,
      timestamp: Date.now(),
      isSystem: true,
      rarity,
    };
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 60) this.chatMessages.shift();
    this.notify();

    // Peers congratulate after a brief pause
    setTimeout(() => {
      const congratulatoryResponses = [
        'Mantap banget tangkapannya!',
        'Nice catch! That was a solid fight!',
        'Gokil ukurannya gede banget!',
        'Sugoi!! Congratulations!',
        'What a trophy! Inspires me to cast again.',
      ];
      const randomPeer = this.peers[Math.floor(Math.random() * this.peers.length)];
      const randomText = congratulatoryResponses[Math.floor(Math.random() * congratulatoryResponses.length)];
      this.chatMessages.push({
        id: 'congrat_' + Date.now(),
        sender: randomPeer.name,
        avatar: randomPeer.avatar,
        text: randomText,
        timestamp: Date.now(),
      });
      this.notify();
    }, 2400);
  }

  public addSystemMessage(text: string) {
    this.chatMessages.push({
      id: 'sys_' + Date.now(),
      sender: 'System',
      text,
      timestamp: Date.now(),
      isSystem: true,
    });
    this.notify();
  }

  private simulatePeerResponse(userText: string) {
    const lower = userText.toLowerCase();
    setTimeout(() => {
      let reply: string | null = null;
      let peer = this.peers[Math.floor(Math.random() * this.peers.length)];

      if (lower.includes('umpan') || lower.includes('bait')) {
        reply = 'Coba pakai earthworm atau minnow lure kalau mau ikan yang agak langka!';
      } else if (lower.includes('malam') || lower.includes('night')) {
        reply = 'Ikan catfish sama moonfin aktif pas malam hari loh.';
      } else if (lower.includes('halo') || lower.includes('hi') || lower.includes('hello')) {
        reply = 'Halo kawan! Selamat menikmati heningnya danau!';
      } else if (Math.random() < 0.4) {
        const casuals = [
          'Satu ikan lagi abis itu udahan deh... eh tapi nagih.',
          'Anginnya sepoi-sepoi banget ya.',
          'Pake senar fluorocarbon biar tarikannya lebih mantep!',
        ];
        reply = casuals[Math.floor(Math.random() * casuals.length)];
      }

      if (reply) {
        this.chatMessages.push({
          id: 'peer_rep_' + Date.now(),
          sender: peer.name,
          avatar: peer.avatar,
          text: reply,
          timestamp: Date.now(),
        });
        this.notify();
      }
    }, 2800);
  }

  private startPeerSimulation() {
    this.simulationInterval = window.setInterval(() => {
      // Rotate a peer's state (casting, reeling, caught)
      const randomIdx = Math.floor(Math.random() * this.peers.length);
      const peer = { ...this.peers[randomIdx] };

      const states: Array<'idle' | 'casting' | 'waiting' | 'reeling' | 'caught'> = [
        'waiting',
        'reeling',
        'waiting',
        'casting',
        'caught',
      ];
      peer.state = states[Math.floor(Math.random() * states.length)];

      if (peer.state === 'caught') {
        const mockCatches = [
          { name: 'Rainbow Trout', rarity: 'UNCOMMON' as FishRarity, weight: 2.4 },
          { name: 'Small Bass', rarity: 'COMMON' as FishRarity, weight: 1.1 },
          { name: 'Calico Koi', rarity: 'UNCOMMON' as FishRarity, weight: 3.5 },
          { name: 'River Minnow', rarity: 'COMMON' as FishRarity, weight: 0.3 },
        ];
        const randomCatch = mockCatches[Math.floor(Math.random() * mockCatches.length)];
        peer.lastCatch = randomCatch;
      }

      this.peers[randomIdx] = peer;
      this.notify();
    }, 7000);
  }

  public destroy() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }
}

export const multiplayerService = new MultiplayerService();

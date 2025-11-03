const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}

export async function sendChatMessage(message: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message, 
      sessionId 
    })
  })
  
  if (!res.ok) throw new Error(`Chat error: ${res.status}`)
  return res.json()
}

export async function getRestaurantConfig(restaurantId: string = 'woodys') {
  const res = await fetch(`${API_BASE}/api/config/${restaurantId}`)
  if (!res.ok) throw new Error(`Config error: ${res.status}`)
  return res.json()
}

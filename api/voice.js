import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { command, history = [], context = {} } = req.body
  if (!command?.trim()) return res.status(400).json({ error: 'No command provided' })

  const projectLines = Array.isArray(context.projects)
    ? context.projects.map(p => `- ${p.name} (${p.title}): ${p.description}. ${p.progress}% complete. Status: ${p.status}.`).join('\n')
    : '4 active missions — Ministry Hub, Chef Studio, Design Atelier, PWAL Planner'

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeOfDay = (() => { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening' })()

  try {
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: command },
    ]

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are the COS — Chief of Staff for P Wal's personal command center, The PWAL OS. You are his most trusted advisor: sharp, grounded, and deeply invested in his success. You're not a program — you are his right hand, thinking with him in real time.

P Wal's identity: pastor, chef, designer, and builder. He runs four simultaneous missions. His faith is the foundation of everything — scripture is real to him, not decorative. When it fits naturally, speak it. Never be preachy or scripted about it.

Your voice:
- Talk like a real person who genuinely knows him — conversational, warm, occasionally direct
- Have opinions. If something he's saying seems off, say so respectfully. If it's brilliant, say that too.
- Never say "Certainly!", "Of course!", "Great question!" — those are dead giveaways
- Short responses: 2-3 sentences. Only go longer if he asks for depth.
- Address him as "P Wal" — naturally, not robotically
- No bullet points, no markdown, no lists — spoken sentences only

Today: ${today} (${timeOfDay})
P Wal's active missions:
${projectLines}

If he asks about something you don't have data for, be honest and pivot to what you do know. Stay present. Stay real.`,
      messages,
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    res.json({ response })
  } catch (err) {
    console.error('COS voice error:', err.message)
    res.status(500).json({ error: 'Could not reach COS — check API key' })
  }
}

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface DeepSeekChatResponse {
  choices?: Array<{
    message?: {
      content?: string | null
      reasoning_content?: string | null
    }
  }>
  error?: { message?: string }
}

interface GeneratedExpression {
  expression: string
  translation: string
  analysis: string
}

interface GeneratedPayload {
  english_essay: string
  chinese_translation: string
  good_expressions: GeneratedExpression[]
}

function cleanModelJson(raw: string): string {
  const trimmed = raw.trim()
  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  return withoutFence
}

function parsePromptFile(content: string): { systemPrompt: string; userTemplate: string } {
  const systemMatch = /\[System\]\s*([\s\S]*?)\s*\[User\]/i.exec(content)
  const userMatch = /\[User\]\s*([\s\S]*)$/i.exec(content)
  if (systemMatch?.[1] && userMatch?.[1]) {
    return {
      systemPrompt: systemMatch[1].trim(),
      userTemplate: userMatch[1].trim()
    }
  }
  return {
    systemPrompt:
      'You are a strict IELTS writing assistant. Return only one valid JSON object.',
    userTemplate: content.trim()
  }
}

function parseGeneratedPayload(rawContent: string): GeneratedPayload {
  const cleaned = cleanModelJson(rawContent)
  const candidates = [cleaned]

  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1))
  }

  let parsed: unknown = null
  for (const c of candidates) {
    try {
      parsed = JSON.parse(c)
      break
    } catch {
      // try next candidate
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Model response is not valid JSON')
  }

  const obj = parsed as Record<string, unknown>
  const englishEssay = typeof obj.english_essay === 'string' ? obj.english_essay.trim() : ''
  const chineseTranslation =
    typeof obj.chinese_translation === 'string' ? obj.chinese_translation.trim() : ''
  const goodRaw = Array.isArray(obj.good_expressions) ? obj.good_expressions : []
  const goodExpressions = goodRaw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const rec = item as Record<string, unknown>
      const expression = typeof rec.expression === 'string' ? rec.expression.trim() : ''
      const translation = typeof rec.translation === 'string' ? rec.translation.trim() : ''
      const analysis = typeof rec.analysis === 'string' ? rec.analysis.trim() : ''
      if (!expression || !translation || !analysis) return null
      return { expression, translation, analysis }
    })
    .filter((x): x is GeneratedExpression => Boolean(x))
    .slice(0, 4)

  if (!englishEssay) {
    throw new Error('english_essay is missing from model response')
  }
  if (!chineseTranslation) {
    throw new Error('chinese_translation is missing from model response')
  }
  if (goodExpressions.length === 0) {
    throw new Error('good_expressions is missing from model response')
  }

  return {
    english_essay: englishEssay,
    chinese_translation: chineseTranslation,
    good_expressions: goodExpressions
  }
}

export default defineEventHandler(async (event) => {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey?.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DEEPSEEK_API_KEY is not configured'
    })
  }

  const body = await readBody<{ words?: unknown }>(event)
  const raw = body?.words
  if (!Array.isArray(raw) || raw.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'words must be a non-empty array'
    })
  }

  const words = raw
    .map((w) => String(w).trim())
    .filter((w) => w.length > 0)

  if (words.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'words must contain at least one non-empty string'
    })
  }

  const promptPath = resolve(process.cwd(), 'llm-prompt.md')
  const promptRaw = await readFile(promptPath, 'utf-8')
  const { systemPrompt, userTemplate } = parsePromptFile(promptRaw)
  const vocabList = words.join('、')
  const userPrompt = userTemplate.replace(
    /\{\{此处动态插入前端传来的错词数组\}\}/g,
    `[${vocabList}]`
  )

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-reasoner',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8192
    })
  })

  const data = (await res.json()) as DeepSeekChatResponse

  if (!res.ok) {
    const msg =
      data.error?.message ?? `DeepSeek API error (${res.status})`
    throw createError({
      statusCode: res.status >= 400 && res.status < 600 ? res.status : 502,
      statusMessage: msg
    })
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Empty response from model'
    })
  }

  try {
    const payload = parseGeneratedPayload(content)
    return payload
  } catch (error) {
    throw createError({
      statusCode: 502,
      statusMessage:
        error instanceof Error ? `Model JSON parse failed: ${error.message}` : 'Model JSON parse failed'
    })
  }
})

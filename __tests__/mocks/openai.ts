import { vi } from 'vitest'

/**
 * Default listing response from OpenAI
 */
export const defaultListingResponse = {
  variations: [
    {
      style: 'professional',
      content:
        'Stunning 3-bedroom, 2-bathroom home in prime location. Features include updated kitchen with modern appliances, hardwood floors throughout, and a spacious backyard perfect for entertaining. This well-maintained property offers 1,500 square feet of comfortable living space.',
    },
    {
      style: 'storytelling',
      content:
        "Imagine coming home to this beautiful 3-bedroom sanctuary where morning coffee on the sunny patio becomes a cherished ritual. The updated kitchen invites you to create memorable meals, while hardwood floors whisper stories of elegant living. With 1,500 square feet of thoughtfully designed space, this isn't just a house—it's where your next chapter begins.",
    },
    {
      style: 'luxury',
      content:
        'An exceptional residence awaits the discerning buyer. This distinguished 3-bedroom, 2-bathroom estate presents 1,500 square feet of refined living, featuring a chef-caliber kitchen and pristine hardwood floors. The manicured grounds provide an exclusive outdoor retreat, embodying sophisticated elegance in every detail.',
    },
  ],
  instagram:
    '🏠 Just listed! Stunning 3BR/2BA home with updated kitchen and hardwood floors. DM for details! #realestate #justlisted #dreamhome #househunting',
  facebook:
    "NEW LISTING ALERT! 🏠\n\nDon't miss this beautiful 3-bedroom, 2-bathroom home featuring an updated kitchen, gorgeous hardwood floors, and a spacious backyard. Schedule your private showing today!\n\n📍 Contact us for address and details\n💰 Priced to sell\n📞 Call/text for more info",
}

/**
 * Create a mock OpenAI client
 */
export function createMockOpenAI(overrides: Record<string, unknown> = {}) {
  const openai = {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: 'chatcmpl-test',
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-4',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify(defaultListingResponse),
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 500,
            total_tokens: 600,
          },
        }),
      },
    },
    ...overrides,
  }

  return openai
}

/**
 * Configure OpenAI to return a specific response
 */
export function mockOpenAIResponse(
  openai: ReturnType<typeof createMockOpenAI>,
  response: unknown
) {
  openai.chat.completions.create.mockResolvedValue({
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify(response),
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 500,
      total_tokens: 600,
    },
  })
}

/**
 * Configure OpenAI to throw an error
 */
export function mockOpenAIError(
  openai: ReturnType<typeof createMockOpenAI>,
  errorMessage: string
) {
  openai.chat.completions.create.mockRejectedValue(new Error(errorMessage))
}

/**
 * Configure OpenAI to return invalid JSON
 */
export function mockOpenAIInvalidJson(openai: ReturnType<typeof createMockOpenAI>) {
  openai.chat.completions.create.mockResolvedValue({
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is not valid JSON',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 10,
      total_tokens: 110,
    },
  })
}

/**
 * Configure OpenAI to return empty response
 */
export function mockOpenAIEmptyResponse(openai: ReturnType<typeof createMockOpenAI>) {
  openai.chat.completions.create.mockResolvedValue({
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4',
    choices: [],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 0,
      total_tokens: 100,
    },
  })
}

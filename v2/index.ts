/**
 * OpenCode 2 entry point for opencode-context (`context_usage` tool).
 *
 * Same adapter strategy as the rest of the kernel: the token accounting lives
 * in `context-usage.ts` and is reused as-is. V2 only changes how the tool is
 * registered and how messages are read.
 */
import { z } from "zod"
import plugin from "../context-usage.ts"

function toV1Message(message: any) {
  const content = Array.isArray(message?.content) ? message.content : []
  return {
    info: { id: message?.id, role: message?.role, ...(message?.agent ? { agent: message.agent } : {}) },
    parts: content,
  }
}

export default {
  id: "context-usage",
  async setup(ctx: any) {
    const hooks: any = await (plugin as any)({
      client: {
        session: {
          messages: async ({ path }: any) => {
            const messages: any[] = (await ctx.session.context({ sessionID: path.id })) ?? []
            return { data: messages.map(toV1Message) }
          },
        },
      },
      directory: ctx.location?.directory ?? process.cwd(),
    })

    const tools = hooks?.tool ?? {}
    await ctx.tool.transform((editor: any) => {
      for (const [name, definition] of Object.entries<any>(tools)) {
        const args = definition.args ?? {}
        const schema: any = Object.keys(args).length > 0
          ? z.toJSONSchema(z.object(args))
          : { type: "object", properties: {}, additionalProperties: false }
        delete schema.$schema
        editor.add({
          name,
          description: definition.description ?? "",
          input: schema,
          async execute(input: any, toolContext: any) {
            const result = await definition.execute(input, {
              sessionID: toolContext?.sessionID,
              agent: toolContext?.agent,
              messageID: toolContext?.messageID,
              abort: toolContext?.signal,
              directory: toolContext?.directory ?? ctx.location?.directory,
            })
            return { content: typeof result === "string" ? result : JSON.stringify(result ?? null, null, 2) }
          },
        })
      }
    })
  },
}

import { StateGraph, StateSchema, START, END } from '@langchain/langgraph'
import { mistralAIModel, cohereModel, geminiModel, geminiJudgeModel } from "./model.ai.js"
import z from 'zod'
import { HumanMessage } from '@langchain/core/messages'

const GraphState = new StateSchema({
    problem: z.string().default(""),
    solution_1: z.string().default(""),
    solution_2: z.string().default(""),
    judge: z.object({
        solution_core_1: z.number().default(0),
        solutin_core_2: z.number().default(0),
        solution_1_reasoning: z.string().default(""),
        solution_2_reasoning: z.string().default(""),
    })
})

const solutionNode = async (state: typeof GraphState.State) => {
    const [mistralResult, cohereResult] = await Promise.allSettled([
        mistralAIModel.invoke(state.problem),
        cohereModel.invoke(state.problem)
    ])

    let text1 = ""
    if (mistralResult.status === 'fulfilled') {
        const val = mistralResult.value
        text1 = typeof val.content === 'string' ? val.content : ((val as any).text || String(val.content || ''))
    } else {
        console.error("Mistral API Error:", mistralResult.reason)
        text1 = `### Solution 1 (Mistral AI)\n*(Notice: Error calling Mistral API: ${mistralResult.reason?.message || String(mistralResult.reason)})*`
    }

    let text2 = ""
    if (cohereResult.status === 'fulfilled') {
        const val = cohereResult.value
        text2 = typeof val.content === 'string' ? val.content : ((val as any).text || String(val.content || ''))
    } else {
        console.error("Cohere API Error:", cohereResult.reason)
        text2 = `### Solution 2 (Cohere AI)\n*(Notice: Error calling Cohere API: ${cohereResult.reason?.message || String(cohereResult.reason)})*`
    }

    return {
        solution_1: text1,
        solution_2: text2,
    }
}

const judgeNode = async (state: typeof GraphState.State) => {
    const { problem, solution_1, solution_2 } = state

    const promptText = `You are a strict, impartial AI evaluator. Your job is to score two AI-generated responses to the same question on a 1–10 scale. You MUST give different scores when the responses differ in quality — do NOT default to similar scores out of politeness.

QUESTION: ${problem}

RESPONSE A:
${solution_1}

RESPONSE B:
${solution_2}

EVALUATION CRITERIA (score each response independently):
1. Accuracy — Is the information factually correct?
2. Completeness — Does it fully answer the question?
3. Clarity — Is it well-structured and easy to understand?
4. Depth — Does it go beyond surface-level facts?
5. Practicality — Is the advice/answer actionable and useful?

SCORING RULES:
- Score range: 1.0 to 10.0 (decimals allowed, e.g. 6.5)
- Be critical and honest. If one response is clearly better, the score gap should be at least 1.5 points.
- If both responses are equally strong, scores may be close, but justify it.
- Do NOT inflate scores. A generic or incomplete answer should score 4–6.
- A truly excellent answer scores 8–10. A poor or wrong answer scores 1–4.

Output ONLY valid JSON with this exact structure (no markdown, no explanation outside the JSON):
{
  "solution_1_score": <number>,
  "solution_2_score": <number>,
  "solution_1_reasoning": "<one concise sentence explaining the score for Response A>",
  "solution_2_reasoning": "<one concise sentence explaining the score for Response B>"
}`

    try {
        // Use direct text invoke (not withStructuredOutput — that forces temp=0)
        const rawResponse = await geminiJudgeModel.invoke([new HumanMessage(promptText)])
        const rawText = typeof rawResponse.content === 'string'
            ? rawResponse.content
            : ((rawResponse as any).text || String(rawResponse.content || ''))

        // Strip markdown code fences if present
        const cleanJson = rawText
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim()

        // Extract JSON object even if there's surrounding text
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error('No JSON object found in judge response')

        const resData = JSON.parse(jsonMatch[0]) as {
            solution_1_score?: number
            solution_2_score?: number
            solution_1_reasoning?: string
            solution_2_reasoning?: string
        }

        const score1 = Math.min(10, Math.max(1, Number(resData.solution_1_score)))
        const score2 = Math.min(10, Math.max(1, Number(resData.solution_2_score)))

        if (isNaN(score1) || isNaN(score2)) throw new Error('Judge returned non-numeric scores')

        const reasoning1 = String(resData.solution_1_reasoning || 'No reasoning provided.')
        const reasoning2 = String(resData.solution_2_reasoning || 'No reasoning provided.')

        console.log(`Judge scores — A: ${score1}, B: ${score2}`)

        return {
            judge: {
                solution_core_1: score1,
                solutin_core_2: score2,
                solution_1_reasoning: reasoning1,
                solution_2_reasoning: reasoning2,
            }
        }
    } catch (error: any) {
        console.error('Gemini Judge Error:', error?.message || error)
        // Re-throw so the graph fails loudly rather than returning fake scores
        throw new Error(`Judge failed: ${error?.message || String(error)}`)
    }
}


const graph = new StateGraph({ state: GraphState })
    .addNode("solution", solutionNode)
    .addNode("judge_node", judgeNode)
    .addEdge(START, "solution")
    .addEdge("solution", "judge_node")
    .addEdge("judge_node", END)
    .compile()

export default async function (problem: string) {
    const result = await graph.invoke({
        problem: problem
    })

    return result
}
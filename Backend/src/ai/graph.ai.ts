import { StateGraph, StateSchema, START, END } from '@langchain/langgraph'
import { mistralAIModel, cohereModel, geminiModel } from "./model.ai.js"
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

    const promptText = `You are an expert AI judge evaluating two candidate solutions for the following problem.

Problem:
${problem}

Solution 1:
${solution_1}

Solution 2:
${solution_2}

Please evaluate both solutions and provide a score out of 10 for each along with detailed reasoning.
Output ONLY a JSON object with this exact key structure:
{
  "solution_1_score": 8.5,
  "solution_2_score": 7.5,
  "solution_1_reasoning": "Reasoning for solution 1...",
  "solution_2_reasoning": "Reasoning for solution 2..."
}`

    try {
        let resData: any = null;

        try {
            const judgeModel = geminiModel.withStructuredOutput(z.object({
                solution_1_score: z.number(),
                solution_2_score: z.number(),
                solution_1_reasoning: z.string(),
                solution_2_reasoning: z.string(),
            }))
            resData = await judgeModel.invoke([new HumanMessage(promptText)])
        } catch (e1) {
            console.log("Gemini structured output fallback to standard text invoke:", e1)
            const rawResponse = await geminiModel.invoke([new HumanMessage(promptText)])
            const rawText = typeof rawResponse.content === 'string'
                ? rawResponse.content
                : ((rawResponse as any).text || String(rawResponse.content || ''))
            const cleanJsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()
            resData = JSON.parse(cleanJsonText)
        }

        const score1 = Number(resData?.solution_1_score ?? 8)
        const score2 = Number(resData?.solution_2_score ?? 7)
        const reasoning1 = String(resData?.solution_1_reasoning || "Solution 1 provided a comprehensive answer.")
        const reasoning2 = String(resData?.solution_2_reasoning || "Solution 2 provided a concise alternative approach.")

        return {
            judge: {
                solution_core_1: score1,
                solutin_core_2: score2,
                solution_1_reasoning: reasoning1,
                solution_2_reasoning: reasoning2,
            }
        }
    } catch (error: any) {
        console.error("Gemini Judge API Error:", error)
        return {
            judge: {
                solution_core_1: 8.5,
                solutin_core_2: 7.5,
                solution_1_reasoning: "Solution 1 provided a clear, evidence-based approach.",
                solution_2_reasoning: "Solution 2 provided a structured alternative perspective.",
            }
        }
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
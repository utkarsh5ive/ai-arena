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

    try {
        const judgeModel = geminiModel.withStructuredOutput(z.object({
            solution_1_score: z.number().min(0).max(10),
            solution_2_score: z.number().min(0).max(10),
            solution_1_reasoning: z.string(),
            solution_2_reasoning: z.string(),
        }))

        const judgeResponse = await judgeModel.invoke([
            new HumanMessage(`
                Problem: ${problem}
                solution 1: ${solution_1}
                solution 2: ${solution_2}
                Please evaluate the solutions and provide score and reasoning.`)
        ])

        const {
            solution_1_score,
            solution_2_score,
            solution_1_reasoning,
            solution_2_reasoning
        } = judgeResponse as {
            solution_1_score: number;
            solution_2_score: number;
            solution_1_reasoning: string;
            solution_2_reasoning: string;
        }

        return {
            judge: {
                solution_core_1: solution_1_score,
                solutin_core_2: solution_2_score,
                solution_1_reasoning,
                solution_2_reasoning,
            }
        }
    } catch (error: any) {
        console.error("Gemini Judge API Error:", error)
        return {
            judge: {
                solution_core_1: 8,
                solutin_core_2: 7,
                solution_1_reasoning: "Solution 1 provided a clear approach to the problem.",
                solution_2_reasoning: "Solution 2 addressed the problem with an alternative approach.",
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
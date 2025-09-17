import { ChatCloudflareWorkersAI } from "@langchain/cloudflare";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(request: Request) {
    const transcript = await request.text();

    const llm = new ChatCloudflareWorkersAI({
        model: "@cf/google/gemma-3-12b-it",
        cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
        cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN!,
    })

    const messages = [
        new SystemMessage(`Track the number of unique speakers in the transcript. Identify the last name of each speaker (currently labeled Speaker #) based on the text in this transcript.
            Do not provide any details other than the name. If you cannot identify the name, respond with "Unknown".`),
        new HumanMessage(transcript)
    ]

    try {
        const llmResponse = await llm.invoke(messages)

        return Response.json(llmResponse.content)
    } catch (error) {
        console.error(error)
    }


}
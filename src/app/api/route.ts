export async function POST(request: Request) {
    const transcript = await request.text();

    try {
        const llmResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/responses`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            },
            body: JSON.stringify({
                "model": "@cf/openai/gpt-oss-120b",
                "input": `Identify the last name of each speaker (currently labeled Speaker #) based on the text in this transcript.
            Do not provide any details other than the name.
            ${transcript}`

            })
        })
        const json = await llmResponse.json()

        return Response.json(json)
    } catch (error) {
        console.error(error)
    }


}
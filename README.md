# Enhanced Diarization with Speaker Names
This project attempts to enhance the diarized transcript of meetings in `transcripts/` and add likely speaker names to them. It calls a LLM to with the instructions and transcript to get the most likely last names of each speaker number. Tech-stack wise, this is a Next.js app where the LLM calling happens in an API route with LangChain JS.

![Screenshot](https://cdn.discordapp.com/attachments/1063604449156808796/1417954478815969383/image.png?ex=68cc5c84&is=68cb0b04&hm=84bfcf97bb0bf27cdb9fb7a785b80954f84d0505dd45a64c0638a7d6da30cfc1)

## Requirements
* Replace speaker numbers in diarized meeting transcripts with the names of each speaker
* Alter the transcripts to be structured text instead of currently unstructured, e.g. JSON
* Easter Egg: Getting the most 🔥 quotes said during the transcript

### What Works (as of 9/17 Congressional Hackathon)
* Uploading a basic diarized meeting transcript and getting speaker last names

## How to Run
The enhanced diarization currently uses LLMs from Cloudflare Workers to provide speaker names. You will need the following environment variables:
```bash
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""
```

Next, run the Next App with:
```bash
npm run dev
```

Upload a file, and you should see the last names of the speakers in the transcript!
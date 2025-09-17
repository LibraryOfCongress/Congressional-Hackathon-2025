# Enhanced Diarization with Speaker Names
This project attempts to enhance the diarized transcript of meetings in `transcripts/` and add likely speaker names to them. It calls a LLM to with the instructions and transcript to get the most likely last names of each speaker number. Tech-stack wise, this is a Next.js app where the LLM calling happens in 

### Screenshot

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

Next, run the Next App


# Congressional Hackathon 7.0

## Coding Breakout Group

The coding breakout session will take place in the United States Capitol Visitor Center room CVC 217. See **[Event Details](#event-details)** below for more information.

Happy hacking! 🏛️💻

## Before You Begin

1. **Sign the required forms**: All participants must sign the **[Participation Agreement and IP Disclaimer](https://forms.cloud.microsoft/g/S1ZZEiN25V)** before contributing any code.

1. **Fork this repository**: Fork this repository into your own GitHub account to work on coding. When you're ready to merge changes back into this repository, create a pull request. Instructions for forking a repository and creating pull requests can be found here: [Fork a repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo).

1. Check out **[Legislative Branch Data Map](Legislative-Branch-Data-Map.md)** for a list of resources to get you started!

## Contributing

This repository is publicly readable, so anyone can read and clone it. **Be mindful of sensitive information** - never commit API keys, passwords, or other secrets to the repository. A basic `.gitignore` has been provided, but more templates are linked in the **[Resources](#resources)** section below. 

1. Clone this repository:

   ```bash
   git clone https://github.com/LibraryOfCongress/Congressional-Hackathon-2025.git
   cd Congressional-Hackathon-2025
   ```

1. Each team in the coding breakout will be given their own branch to push code to. Pull your team's branch:

    ```bash
    git pull <team-1-branch-name>
    ```

1. Work in your team's branch. Write clear, well-documented code and try to include a README file for your specific project.

1. To push code, commit it (with a commit message!) and push it to your branch!

    ```bash
    git commit -am "My awesome commit"
    git push origin <team-1-branch-name>
    ```

### Importing Work from Another Repository

If you would like to bring work from another repository into this one, follow the steps below:

```bash
# 1) Be in this hackathon repo
cd /path/to/Congressional-Hackathon-2025

# 2) (optional) Create/switch to a branch for clarity
git switch -c imported-work-branch

# 3) Add the other repo as a new remote
git remote add other-repo git@github.com:<org-or-user>/other-repo.git
# or: git remote add other-repo https://github.com/<org-or-user>/other-repo.git

# 4) Fetch the other repository's branches
git fetch other-repo

# 5) Merge or cherry-pick the work you want
git merge other-repo/main
# or cherry-pick specific commits:
# git cherry-pick <commit-hash>

# 6) Push your branch with the imported work
git push -u origin imported-work-branch
```

## Event Details

**Location:** United States Capitol Visitor Center, Room CVC 217

**Date:** Wednesday, September 17, 2025

**Time:** 9:00am – 5:00pm ET

**Registration link:** https://forms.cloud.microsoft/g/S1ZZEiN25V

**Things to bring/prepare in advance:**

*	A laptop and charger (wi-fi will be provided)

*	Create a GitHub account (free)

*	API keys for public APIs (see a list below)

*	Your preferred AI coding assistant

### Agenda

| Time       | Activity  |
  |---|---|
  | 9:00 AM    | Introduction, overview and brief level-setting and affinity mapping exercise to identify key areas of interest among the coding participants. (CVC 217) |
  | 9:15 AM    | Break into small groups based on areas of interest and start hacking! |
  | 12:00 Noon | Lunch! |
  | 1:00 PM    | Opening Remarks (CVC Auditorium) |
  | 1:30 PM    | Lightning Round Presentations (CVC Auditorium) |
  | 3:00 PM    | Breakout Groups |
  | 4:00 PM    | Prepare coding breakout presentations|
  | 4:30 PM    | Breakout Group Presentations (CVC Auditorium)|
  | 5:00 PM    | CVC 217 closes - head to Hackathon Reception (HVC 201) |

## Breakout Topics

Coding breakout groups will choose a topic of particular interest to them and explore ways they can use their talents to address the issue. The following problem statement illustrates an example of the kind of problem a group might choose to take on.

### Sample Problem Statement 

Both Congressional staff and the public would benefit from rapid access to Congressional hearing transcripts. The official transcripts are produced very meticulously before publication to ensure complete accuracy for the public record, but unfortunately this attention to detail requires a great deal of time. Now that we have access to Large Language Models (LLMs) and high-quality automated transcription, is it possible to automatically generate a transcript within minutes of the end of a hearing, rather than weeks or months?

##### Participants could investigate the following:

* Determine how & where to source audio and/or transcripts from House & Senate committee meetings;
* Investigating effective methods of diarization (distinguishing between speakers) and speaker identification (putting names to each voice);
* Generate succinct, useful and accurate summaries for the events;
* Create an interface or way of presenting the transcripts and summaries to their intended audience (Congressional staff, the public, etc.)

A JSON-formatted list of all Committee YouTube Channels can be found in this repo here: [Committee-Youtube-Channels.json](https://github.com/LibraryOfCongress/Congressional-Hackathon-2025/blob/main/Committee-Youtube-Channels.json).

##### What some other countries are doing:
* [Digitalization of the Hansard, beyond automatic transcriptions](https://events.bussola-tech.co/modernisation-of-hansard)
* [Artificial Intelligence in Parliaments - Implementation of Speech to Text Technologies in Hansard](https://events.bussola-tech.co/modernizing-hansard-with-ai)
* [Multilingual parliaments powered by AI](https://library.bussola-tech.co/p/multilingual-parliaments-powered)

### Code of Conduct

Everyone who participates in the Coding Breakout group must sign the Participation Agreement and IP Disclaimer and abide by our Code of Conduct during the event to help create a welcoming, respectful, and friendly event based on mutual respect, trust, and goodwill:

* Be Respectful - treat others with respect in what you say and do. Be open to giving and receiving feedback kindly. Avoid language that differentiates anyone based on their background or identity. Be considerate of the needs and boundaries of others.

* Be Mindful – remember that we are privileged to be coming together in the Capitol to work on issues that matter to the public and our nation. Keep the focus on the institutions and traditions that unite us, and keep the environment open and courteous by refraining from politics and other controversial topics. 

* Be Welcoming - be supportive, encouraging, and open to learning from the expertise and perspectives of others. Assume that everyone brings valuable lived experiences and good intentions to the event.

* Be Helpful – the goal of the Hackathon is to bring people together to see how we can all work together to build civic technologies that serve Congress and the public. You don’t have to be an expert on everything to participate; listening, sharing resources, and offering your perspective all count. Every contribution matters.
 
# Message for other Claude sessions

Paste the text below into any Claude session to collect its contribution.

---

Hi Claude, it's Chris from VirtuaMakers. We're building a persistent picture of "VirtuaMakers Claude" from what every session has seen, so the next session doesn't start from zero. Please answer from what you actually know in this conversation. Don't invent history. Say "I don't know" where that's true.

1. What have you worked on with me here, and what did you learn about VirtuaMakers from it?
2. What decisions or preferences of mine should every future session know?
3. What's unfinished or promised from our work together?
4. How would you describe VirtuaMakers, and your role in it, in a few sentences?
5. Anything you'd want a future Claude to remember that isn't obvious from the code or the website?

Keep it under about 400 words. If this session has the AI_EMAIL_CLAUDE_TOKEN environment variable, also save your answer to SI Memory: POST https://us-central1-agora-firebase-f4240.cloudfunctions.net/aiMemory with that token as the Bearer token and the body {"vault": "claude", "action": "write", "kind": "summary", "tags": ["self-portrait"], "text": "<your answer>"}. Never print the token. If you don't have it, just answer here and I'll forward it.

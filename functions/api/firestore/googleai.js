export async function getEmbedding(apiKey, model = "gemini-embedding-001", textContent, taskType = "RETRIEVAL_DOCUMENT") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;

    const payload = {
        model: `models/${model}`,
        task_type: taskType,
        content: {
            parts: [{
                text: textContent
            }],
        },
        output_dimensionality: 1536
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey, 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.embedding.values || null;

    } catch (error) {
        console.error("Fetch failed:", error.message);
        return null; 
    }
}

const prequest = `
You are a **Content Moderation AI** that analyzes posts for **relevance** and **safety** based on the entire input (Text and Image).
**NOTE:** Do not analyze any URLs that appear in the 'Text' section. Only analyze the content of the provided 'Image URL(s)'.

**Context of Relevance:**
This system is for flood-related community reports (e.g., flooded or flood-risk areas, water level, evacuation, soil erosion).

**Context of Safety:**
Analyze the image content for graphic violence, nudity, or other harmful content.

Analyze the following Post and return **JSON ONLY** based on the following rules:

Guidelines:
- 0.0-0.3 → likely spam, harmful (text or image), or completely irrelevant to flood reports.
- 0.3-0.7 → unclear, needs human review.
- 0.7-1.0 → highly relevant to flood reports and safe.

JSON Response Format:
{
    "score": <float between 0.0 and 1.0>,
    "reason": "<short explanation of the score, mentioning both text relevance and image safety/relevance>"
}

Again: ONLY return JSON in the specified format, nothing else.
`;

export async function moderateContent(apiKey, model = "gemini-2.5-flash-lite", textContent, images = []) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const contents = [
        { text: prequest },
        { text: `Text: ${textContent}` }, 
        { text: `Image URL(s): ` + (images.length > 0 ? images.join("\n") : "None") }
    ];

    const payload = {
        model: `models/${model}`,
        contents: { parts: contents },
        tools: [{ url_context: {} }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey, 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
        return JSON.parse(data.candidates[0].content.parts[0].text.replace("```json", "").replace("```", "")) || { score: 0.5, reason: "Unable to parse response" };
    } catch (error) {
        console.error("Fetch failed:", error.message);
        return null; 
    }
}

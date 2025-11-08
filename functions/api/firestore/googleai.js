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
        
        // The API returns an object with an 'embedding' property.
        // The vector itself is in 'data.embedding.values'.
        return data.embedding.values || null;

    } catch (error) {
        console.error("Fetch failed:", error.message);
        return null; 
    }
}

// Example usage:
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
const EMBEDDING_MODEL = "gemini-embedding-001";
const INPUT_TEXT = "What is the meaning of life?";

/*
getEmbedding(GEMINI_API_KEY, EMBEDDING_MODEL, INPUT_TEXT)
    .then(embedding => {
        if (embedding) {
            console.log("Embedding vector generated. Dimension:", embedding.length);
            // console.log("First 5 values:", embedding.slice(0, 5));
        } else {
            console.log("Failed to retrieve embedding.");
        }
    });
*/
export async function submitFeedback(data) {
    try {
        const API_URL = "https://n8n.coldblood.games/webhook/916272da-e297-489f-99b8-b323697e4b19";

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            return 'Feedback submitted!';
        } else {
            throw new Error(response);
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw new Error('An error occurred while submitting feedback.');
    }
}

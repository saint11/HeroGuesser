export async function submitFeedback(data) {
    try {
        const API_URL = "https://n8n.coldblood.games/webhook/heroGuesser/feedback";

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

export async function submitGuesses(data) {
    try {
        const API_URL = "https://n8n.coldblood.games/webhook/heroGuesser/guessed";
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const lastSubmissionDate = localStorage.getItem('lastSubmissionDate');

        // Check if data was already sent today
        if (!data.random && lastSubmissionDate === today) {
            console.log
            return 'Already submitted today';
        }

        // Make the POST request
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            localStorage.setItem('lastSubmissionDate', today); // Store the submission date
            return 'Guesses submitted!';
        } else {
            throw new Error(response.statusText);
        }
    } catch (error) {
        console.error('Error submitting guesses:', error);
        throw new Error('An error occurred while submitting guesses.');
    }
}

export async function getWorldStats() {
    try {
        const API_URL = "https://n8n.coldblood.games/webhook/heroGuesser/totals";

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.error(response.statusText);
            return {}
        }
    } catch (error) {
        console.error('Error fetching totals:', error);
        return {}
    }
}
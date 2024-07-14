export async function submitFeedback(data) {
    try {
        const API_URL = "https://n8n.coldblood.games/webhook/heroGuesser/feedback";
        // const API_URL = "https://n8n.coldblood.games/webhook-test/feedback";

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
        // const API_URL = "https://n8n.coldblood.games/webhook-test/heroGuesser/guessed";
        const API_URL = "https://n8n.coldblood.games/webhook/heroGuesser/guessed";
        
        const today = data.day;
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
            localStorage.setItem('lastSubmissionDate', data.day); // Store the submission date
            localStorage.setItem('lastSubmissionGuessCount', data.guesses); // Store the guess count
            return 'Guesses submitted!';
        } else {
            throw new Error(response.statusText);
        }
    } catch (error) {
        console.error('Error submitting guesses:', error);
        throw new Error('An error occurred while submitting guesses.');
    }
}

export async function getWorldStats(current_day) {
    try {
        // const API_URL = "https://n8n.coldblood.games/webhook-test/heroGuesser/totals"
        const API_URL = "https://n8n.coldblood.games/webhook/heroGuesser/totals";

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'day': current_day
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
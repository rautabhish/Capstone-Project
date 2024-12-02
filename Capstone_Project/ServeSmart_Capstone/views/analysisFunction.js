// Retrieve restaurant data from local storage
const restaurantData = JSON.parse(localStorage.getItem('restaurantData'));
if (!restaurantData) {
    alert('No restaurant data found. Please go back and authenticate.');
    window.location.href = '/dashboard.html';
}
function showRatingAnalysis() {
    const ratings = restaurantData.map(item => item.ratings);
    const averageRating = (ratings.reduce((acc, rating) => acc + rating, 0) / ratings.length).toFixed(2);

    // Count ratings distribution
    const excellent = ratings.filter(rating => rating >= 4.5).length;
    const good = ratings.filter(rating => rating >= 3.5 && rating < 4.5).length;
    const average = ratings.filter(rating => rating >= 2.5 && rating < 3.5).length;
    const poor = ratings.filter(rating => rating < 2.5).length;

    // Display summary text
    const ratingSummary = `
        Average Rating: ${averageRating} out of 5\n\n
        Rating Distribution:
        - Excellent (4.5 - 5): ${excellent}
        - Good (3.5 - 4.4): ${good}
        - Average (2.5 - 3.4): ${average}
        - Poor (below 2.5): ${poor}
    `;

    // Show the rating analysis summary
    document.getElementById('analysisDisplay').textContent = ratingSummary;
}


// Function to perform Rating Analysis
function showSentimentAnalysis() {
    const reviews = restaurantData.flatMap(item => item.reviews).join(' ').toLowerCase();

    const positiveKeywords = ["great", "excellent", "fantastic", "wonderful", "love", "amazing",
        "good", "delightful", "pleased", "satisfied", "enjoyable", "positive",
        "beautiful", "pleasant", "happy", "recommend", "top-notch", "perfect",
        "friendly", "exceptional", "remarkable", "outstanding", "impressive",
        "superb", "brilliant", "high quality", "not bad", "decent", "fine",
        "worth it", "satisfying", "above expectations", "better than expected",
        "appreciated", "memorable", "valued", "lovely","not bad", "not terrible", "not poor", "not disappointing",
        "not horrible", "not awful", "not unpleasant", "not a waste",
        "not a regret", "not low quality", "not below expectations",
        "not lacking", "not mediocre", "not subpar"];
    const negativeKeywords = ["bad", "terrible", "poor", "disappointing", "horrible", "awful",
        "unpleasant", "worse", "mediocre", "annoyed", "upset", "unsatisfactory",
        "dislike", "hate", "unhappy", "not good", "waste", "low quality",
        "regret", "frustrated", "unfortunate", "negative", "not worth",
        "subpar", "lacking", "below expectations", "meh", "not great",
        "needs improvement", "poorly", "didn't quite match"];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach(keyword => {
        positiveCount += (reviews.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    });

    negativeKeywords.forEach(keyword => {
        negativeCount += (reviews.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    });

    const totalReviews = restaurantData.flatMap(item => item.reviews).length;
    const analysisSummary = `Sentiment Analysis:
  - Positive Mentions: ${positiveCount}
  - Negative Mentions: ${negativeCount}
  - Total Reviews Analyzed: ${totalReviews}\n\n`;

    const sentimentResult = positiveCount > negativeCount
        ? "Overall, the sentiment is positive."
        : negativeCount > positiveCount
            ? "Overall, the sentiment is negative."
            : "The sentiment is mixed.";

    document.getElementById('analysisDisplay').textContent = analysisSummary + sentimentResult;
}


// Function to analyze Areas to Improve
function showAreasToImprove() {
    const improvementKeywords = ["didn't quite match the hype", "slow", "expensive", "overcooked", "undercooked", "bland", "noisy",
        "crowded", "small portions", "rushed", "inconsistent", "greasy", "cold",
        "tough", "dry", "poor service", "lack of flavor", "overpriced", "stale",
        "unfriendly", "long wait", "dirty", "cramped", "not fresh", "limited options",
        "burnt", "too salty", "too sweet", "too spicy", "mediocre", "awkward seating",
        "hard to find parking", "poor lighting", "uncomfortable chairs",
        "slow service", "overly seasoned", "not worth it", "disorganized",
        "unappetizing presentation", "weak drinks", "needs improvement",
        "lack of variety", "not as expected"];
    const reviews = restaurantData.flatMap(item => item.reviews).join(' ').toLowerCase();

    let improvementSuggestions = improvementKeywords
        .map(keyword => {
            const count = (reviews.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
            return count > 0 ? `${keyword}: mentioned ${count} times` : null;
        })
        .filter(Boolean)  // Filter out keywords with zero mentions
        .join('\n');

    improvementSuggestions = improvementSuggestions || 'No specific areas for improvement identified.';

    document.getElementById('analysisDisplay').textContent = `Areas to Improve:\n${improvementSuggestions}`;
}


// Function to display Menu Feedback
function showMenuFeedback() {
    const feedbackText = restaurantData.flatMap(item => item.reviews).join(' ').toLowerCase();

    // Keywords to track in the reviews
    const positiveKeywords = ["delicious", "tasty", "amazing", "perfect", "excellent", "not disappoint",
        "savory", "flavorful", "mouthwatering", "succulent", "fresh", "well-seasoned",
        "appetizing", "satisfying", "pleasing", "well-cooked", "balanced flavors",
        "impressive", "exquisite", "spot-on", "worth every penny", "rich", "yummy",
        "divine", "well-prepared", "just right", "authentic", "fantastic", "scrumptious",
        "high quality", "tender", "not bland", "not overcooked", "not dry", "not undercooked", "not bland", "not disappointing", "not bad", "not overcooked", "not poor",
        "not dry", "not undercooked", "not greasy", "not tasteless", "not stale",
        "not flavorless", "not unappetizing", "not soggy", "not cold", "not low quality",
        "not tough", "not rubbery", "not artificial", "not overpriced"];
    const negativeKeywords = ["bland", "disappointing", "bad", "poor", "overcooked", "dry", "tasteless",
        "unappetizing", "stale", "undercooked", "greasy", "unpleasant", "flavorless",
        "soggy", "too salty", "too sweet", "too spicy", "burnt", "cold", "not fresh",
        "low quality", "rubbery", "overpriced", "inedible", "mediocre", "not worth it",
        "artificial", "unbalanced", "tough", "dull", "not satisfying", "lackluster",
        "overdone", "messy", "not as expected", "not impressive", "not worth the money"];

    // Count occurrences of positive and negative words
    let positiveCount = 0;
    let negativeCount = 0;

    positiveKeywords.forEach(keyword => {
        positiveCount += (feedbackText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    });

    negativeKeywords.forEach(keyword => {
        negativeCount += (feedbackText.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    });

    // Generate analysis results
    let analysisResult = `Menu Feedback Analysis:\nPositive Mentions: ${positiveCount}\nNegative Mentions: ${negativeCount}\n\n`;
    if (positiveCount > negativeCount) {
        analysisResult += "Overall, customers seem to have a positive experience with the menu.";
    } else if (negativeCount > positiveCount) {
        analysisResult += "There are more negative mentions, indicating potential areas to improve in the menu.";
    } else {
        analysisResult += "The feedback is mixed with equal mentions of positives and negatives.";
    }

    // Display analysis results
    document.getElementById('analysisDisplay').textContent = analysisResult;
}
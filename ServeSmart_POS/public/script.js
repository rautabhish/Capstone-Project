// Login Handler
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const restaurant_name = document.getElementById('restaurant_name').value.trim();
    const pin = document.getElementById('pin').value.trim();

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_name, pin }),
    });

    const result = await response.json();

    if (response.ok) {
        alert('Login successful');
        localStorage.setItem('restaurant_name', restaurant_name); // Store restaurant name
        window.location.href = '/add-item.html'; // Redirect to Add Item page
    } else {
        alert(result.error || 'Login failed');
    }
});

// Add Item Page Logic
if (window.location.pathname === '/add-item.html') {
    window.onload = () => {
        const restaurantNameElement = document.getElementById('restaurant-name');
        const currentDateElement = document.getElementById('current-date');

        // Get the restaurant name from localStorage
        const restaurantName = localStorage.getItem('restaurant_name');

        // If no restaurant name is found, redirect to the login page
        if (!restaurantName) {
            alert('You are not logged in! Redirecting to login page.');
            window.location.href = '/index.html'; // Update with your login page URL
            return;
        }

        // Display restaurant name and today's date
        restaurantNameElement.textContent = restaurantName;

        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        currentDateElement.textContent = currentDate;
    };

    // Handle Add Item Form Submission
    document.getElementById('add-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const itemName = document.getElementById('item_name').value.trim();
        const price = parseFloat(document.getElementById('price').value.trim());
        const feedbackMessage = document.getElementById('feedback-message');

        if (!itemName || price <= 0) {
            feedbackMessage.textContent = 'Please enter a valid item name and price.';
            feedbackMessage.style.color = '#f12711';
            feedbackMessage.style.display = 'block';
            return;
        }

        try {
            const response = await fetch('/pos/add-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_name: itemName, price }),
            });

            const result = await response.json();

            if (response.ok) {
                feedbackMessage.textContent = 'Item added successfully!';
                feedbackMessage.style.color = 'green';
                feedbackMessage.style.display = 'block';
                document.getElementById('add-item-form').reset();
            } else {
                feedbackMessage.textContent = result.error || 'Failed to add item.';
                feedbackMessage.style.color = '#f12711';
                feedbackMessage.style.display = 'block';
            }
        } catch (error) {
            feedbackMessage.textContent = 'An error occurred. Please try again.';
            feedbackMessage.style.color = '#f12711';
            feedbackMessage.style.display = 'block';
        }
    });
}

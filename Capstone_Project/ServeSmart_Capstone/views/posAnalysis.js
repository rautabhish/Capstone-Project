document.addEventListener('DOMContentLoaded', () => {
    const posData = JSON.parse(localStorage.getItem('posData'));

    if (!posData || posData.length === 0) {
        alert('No POS data found.');
        return;
    }

    let currentChart; // To store the instance of the current chart

    function renderChart(data, chartTitle) {
        const ctx = document.getElementById('posChart').getContext('2d');

        // Destroy the existing chart instance if it exists
        if (currentChart) {
            currentChart.destroy();
        }

        // Create a new chart instance
        currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.itemName), // X-axis labels
                datasets: [{
                    label: chartTitle,
                    data: data.map(item => item.count), // Y-axis data
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: data.length > 1 ? 'Item Name' : 'Total', // Dynamic axis label
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Sales Amount ($)' // Adjust Y-axis label
                        }
                    }
                },
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Show the chart container
        document.getElementById('chartContainer').classList.add('active');
    }

    function showMostSellingItem() {
        const itemCounts = {};
        posData.forEach(item => {
            const itemName = item.item_name;
            itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
        });

        const sortedItems = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([itemName, count]) => ({ itemName, count }));

        const mostSelling = sortedItems[0];
        document.getElementById('posAnalysisDisplay').innerHTML = `
            <h4>Most Selling Item:</h4>
            <p>${mostSelling.itemName} - Sold ${mostSelling.count} times</p>
        `;

        renderChart(sortedItems, 'Most Selling Items');
    }

    function showLessSellingItem() {
        const itemCounts = {};
        posData.forEach(item => {
            const itemName = item.item_name;
            itemCounts[itemName] = (itemCounts[itemName] || 0) + 1;
        });

        const sortedItems = Object.entries(itemCounts)
            .sort((a, b) => a[1] - b[1])
            .map(([itemName, count]) => ({ itemName, count }));

        const lessSelling = sortedItems[0];
        document.getElementById('posAnalysisDisplay').innerHTML = `
            <h4>Less Selling Item:</h4>
            <p>${lessSelling.itemName} - Sold ${lessSelling.count} times</p>
        `;

        renderChart(sortedItems, 'Less Selling Items');
    }

    function showExpectedSales(period) {
        const currentDate = new Date();
        let startDate;
        let totalPeriodSales = 0;
        let totalItemsSold = 0;
        let fractionPassed = 0;

        // day fractionPassed= endOfDay−startDate / currentDate−startDate
        // week fractionPassed = endOfWeek−startDate / currentDate−startDate
        //month fractionPassed = endOfMonth−startDate / currentDate−startDate



        switch (period) {
            case 'day':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
                fractionPassed = (currentDate - startDate) / (endOfDay - startDate);
                break;
            case 'week':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - currentDate.getDay());
                const endOfWeek = new Date(currentDate);
                endOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 6);
                fractionPassed = (currentDate - startDate) / (endOfWeek - startDate);
                break;
            case 'month':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                fractionPassed = (currentDate - startDate) / (endOfMonth - startDate);
                break;
            default:
                return;
        }

        const filteredData = posData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate <= currentDate;
        });

        const salesByItem = {};
        filteredData.forEach(item => {
            const itemName = item.item_name;
            salesByItem[itemName] = (salesByItem[itemName] || 0) + parseFloat(item.price);
            totalPeriodSales += parseFloat(item.price);
            totalItemsSold++;
        });

        const salesData = Object.entries(salesByItem)
            .map(([itemName, totalSales]) => ({ itemName, count: totalSales }));

        const totalSales = salesData.reduce((sum, item) => sum + item.count, 0);

        // Calculate the expected sales
        const expectedSales = totalSales / fractionPassed;

        document.getElementById('posAnalysisDisplay').innerHTML = `
            <h4>Expected Sales (${period.charAt(0).toUpperCase() + period.slice(1)}):</h4>
            <p>Total Sales (till now): $${totalSales.toFixed(2)}</p>
            <p>Expected Sales: $${expectedSales.toFixed(2)}</p>
        `;

        // Chart data for actual vs expected sales
        renderChart([
            { itemName: 'Total Sales (Actual)', count: totalSales },
            { itemName: 'Expected Sales', count: expectedSales }
        ], `Expected Sales (${period.charAt(0).toUpperCase() + period.slice(1)})`);
    }

    document.getElementById('mostSellingButton').addEventListener('click', showMostSellingItem);
    document.getElementById('lessSellingButton').addEventListener('click', showLessSellingItem);
    document.getElementById('expectedSalesDay').addEventListener('click', () => showExpectedSales('day'));
    document.getElementById('expectedSalesWeek').addEventListener('click', () => showExpectedSales('week'));
    document.getElementById('expectedSalesMonth').addEventListener('click', () => showExpectedSales('month'));
});

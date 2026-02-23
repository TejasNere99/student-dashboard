/**
 * CHART MANAGER
 * Handles all Chart.js visualizations and data rendering
 */

class ChartManager {
    constructor() {
        this.charts = {};
    }

    /**
     * Initialize all charts
     */
    initializeCharts(stats) {
        this.renderDepartmentChart(stats.departmentDistribution);
        this.renderYearChart(stats.yearDistribution);
        this.renderTrendChart(stats.registrationTrend);
        this.renderGenderChart(stats.genderDistribution);
        this.renderGPAChart(stats.gpaDistribution);
        this.renderAttendanceChart(stats.attendanceDistribution);
    }

    /**
     * Get text color based on theme
     */
    getTextColor() {
        return document.body.classList.contains('dark-mode') ? '#f1f5f9' : '#1f2937';
    }

    /**
     * Get grid color based on theme
     */
    getGridColor() {
        return document.body.classList.contains('dark-mode') ? '#334155' : '#e5e7eb';
    }

    /**
     * Get background color based on theme
     */
    getBackgroundColor() {
        return document.body.classList.contains('dark-mode') ? '#1e293b' : '#ffffff';
    }

    /**
     * Render department distribution pie chart
     */
    renderDepartmentChart(data) {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;

        if (this.charts.department) {
            this.charts.department.destroy();
        }

        const labels = data.map(d => d.name);
        const values = data.map(d => d.count);
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

        this.charts.department = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: this.getBackgroundColor(),
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12, weight: '600' },
                            color: this.getTextColor()
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                }
            }
        });
    }

    /**
     * Render year-wise distribution bar chart
     */
    renderYearChart(data) {
        const ctx = document.getElementById('yearChart');
        if (!ctx) return;

        if (this.charts.year) {
            this.charts.year.destroy();
        }

        const labels = data.map(d => d.name);
        const values = data.map(d => d.count);

        this.charts.year = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Students',
                    data: values,
                    backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'x',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 12, weight: '600' },
                            color: this.getTextColor(),
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    x: {
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Render registration trend line chart
     */
    renderTrendChart(data) {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;

        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        const labels = data.map(d => d.date);
        const values = data.map(d => d.count);

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'New Registrations',
                    data: values,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 12, weight: '600' },
                            color: this.getTextColor(),
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    x: {
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Render gender distribution pie chart
     */
    renderGenderChart(data) {
        const ctx = document.getElementById('genderChart');
        if (!ctx) return;

        if (this.charts.gender) {
            this.charts.gender.destroy();
        }

        const labels = data.map(d => d.name);
        const values = data.map(d => d.count);
        const colors = ['#667eea', '#f093fb', '#43e97b'];

        this.charts.gender = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: this.getBackgroundColor(),
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12, weight: '600' },
                            color: this.getTextColor()
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                }
            }
        });
    }

    /**
     * Render GPA distribution bar chart
     */
    renderGPAChart(data) {
        const ctx = document.getElementById('gpaChart');
        if (!ctx) return;

        if (this.charts.gpa) {
            this.charts.gpa.destroy();
        }

        const labels = data.map(d => d.name);
        const values = data.map(d => d.count);

        this.charts.gpa = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Students',
                    data: values,
                    backgroundColor: '#8b5cf6',
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 12, weight: '600' },
                            color: this.getTextColor(),
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    y: {
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Render attendance distribution bar chart
     */
    renderAttendanceChart(data) {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        if (this.charts.attendance) {
            this.charts.attendance.destroy();
        }

        const labels = data.map(d => d.name);
        const values = data.map(d => d.count);

        this.charts.attendance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Number of Students',
                    data: values,
                    backgroundColor: '#10b981',
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 12, weight: '600' },
                            color: this.getTextColor(),
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    y: {
                        ticks: {
                            color: this.getTextColor(),
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    /**
     * Update chart theme
     */
    updateChartTheme() {
        this.destroyAllCharts();
    }
}

// Create global instance
const chartManager = new ChartManager();

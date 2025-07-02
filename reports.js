document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const debts = JSON.parse(localStorage.getItem('debts')) || [];

    // عناصر DOM
    const reportType = document.getElementById('report-type');
    const monthInput = document.getElementById('report-month');
    const chartCanvas = document.getElementById('reportChart');
    const reportTable = document.getElementById('report-table').querySelector('tbody');
    const incomeEl = document.getElementById('report-income');
    const expenseEl = document.getElementById('report-expense');
    const balanceEl = document.getElementById('report-balance');

    // تعيين الشهر الحالي كافتراضي
    const today = new Date();
    monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // أحداث التغيير
    reportType.addEventListener('change', generateReport);
    monthInput.addEventListener('change', generateReport);

    // إنشاء التقرير
    function generateReport() {
        const type = reportType.value;
        const monthYear = monthInput.value;
        
        if (type === 'monthly') {
            generateMonthlyReport(monthYear);
        } else if (type === 'category') {
            generateCategoryReport(monthYear);
        } else if (type === 'yearly') {
            generateYearlyReport();
        }
    }

    // تقرير شهري
    function generateMonthlyReport(monthYear) {
        const [year, month] = monthYear.split('-').map(Number);
        
        // تصفية المعاملات للشهر المحدد
        const monthlyTransactions = transactions.filter(trx => {
            const trxDate = new Date(trx.date);
            return trxDate.getFullYear() === year && (trxDate.getMonth() + 1) === month;
        });

        // حساب الإحصائيات
        const income = monthlyTransactions
            .filter(trx => trx.type === 'income')
            .reduce((sum, trx) => sum + parseFloat(trx.amount), 0);
        
        const expense = monthlyTransactions
            .filter(trx => trx.type === 'expense')
            .reduce((sum, trx) => sum + parseFloat(trx.amount), 0);
        
        const balance = income - expense;

        // تحديث العناصر
        incomeEl.textContent = income.toFixed(2) + ' جنيه';
        expenseEl.textContent = expense.toFixed(2) + ' جنيه';
        balanceEl.textContent = balance.toFixed(2) + ' جنيه';
        balanceEl.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

        // تجهيز بيانات المخطط
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyData = Array(daysInMonth).fill().map(() => ({ income: 0, expense: 0 }));

        monthlyTransactions.forEach(trx => {
            const day = new Date(trx.date).getDate() - 1;
            if (trx.type === 'income') {
                dailyData[day].income += parseFloat(trx.amount);
            } else {
                dailyData[day].expense += parseFloat(trx.amount);
            }
        });

        // إنشاء المخطط
        renderChart(
            Array.from({ length: daysInMonth }, (_, i) => i + 1),
            dailyData.map(d => d.income),
            dailyData.map(d => d.expense),
            'يوم'
        );

        // تحديث الجدول
        updateTable(monthlyTransactions);
    }

    // تقرير حسب الفئة
    function generateCategoryReport(monthYear) {
        const [year, month] = monthYear.split('-').map(Number);
        
        // تصفية المعاملات للشهر المحدد
        const monthlyTransactions = transactions.filter(trx => {
            const trxDate = new Date(trx.date);
            return trxDate.getFullYear() === year && (trxDate.getMonth() + 1) === month;
        });

        // تجميع حسب الفئة
        const categories = {
            income: {},
            expense: {}
        };

        monthlyTransactions.forEach(trx => {
            if (!categories[trx.type][trx.category]) {
                categories[trx.type][trx.category] = 0;
            }
            categories[trx.type][trx.category] += parseFloat(trx.amount);
        });

        // حساب الإحصائيات
        const income = Object.values(categories.income).reduce((sum, val) => sum + val, 0);
        const expense = Object.values(categories.expense).reduce((sum, val) => sum + val, 0);
        const balance = income - expense;

        // تحديث العناصر
        incomeEl.textContent = income.toFixed(2) + ' جنيه';
        expenseEl.textContent = expense.toFixed(2) + ' جنيه';
        balanceEl.textContent = balance.toFixed(2) + ' جنيه';
        balanceEl.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

        // تجهيز بيانات المخطط
        const categoryNames = [
            ...Object.keys(categories.income).map(name => `مدخول - ${getCategoryName(name)}`),
            ...Object.keys(categories.expense).map(name => `مصروف - ${getCategoryName(name)}`)
        ];
        
        const categoryAmounts = [
            ...Object.values(categories.income),
            ...Object.values(categories.expense)
        ];

        // إنشاء مخطط دائري
        renderPieChart(categoryNames, categoryAmounts);

        // تحديث الجدول
        updateCategoryTable(categories);
    }

    // تقرير سنوي
    function generateYearlyReport() {
        const year = new Date().getFullYear();
        
        // تصفية المعاملات للسنة الحالية
        const yearlyTransactions = transactions.filter(trx => {
            const trxDate = new Date(trx.date);
            return trxDate.getFullYear() === year;
        });

        // تجميع البيانات الشهرية
        const monthlyData = Array(12).fill().map(() => ({ income: 0, expense: 0 }));

        yearlyTransactions.forEach(trx => {
            const month = new Date(trx.date).getMonth();
            if (trx.type === 'income') {
                monthlyData[month].income += parseFloat(trx.amount);
            } else {
                monthlyData[month].expense += parseFloat(trx.amount);
            }
        });

        // حساب الإحصائيات
        const income = monthlyData.reduce((sum, month) => sum + month.income, 0);
        const expense = monthlyData.reduce((sum, month) => sum + month.expense, 0);
        const balance = income - expense;

        // تحديث العناصر
        incomeEl.textContent = income.toFixed(2) + ' جنيه';
        expenseEl.textContent = expense.toFixed(2) + ' جنيه';
        balanceEl.textContent = balance.toFixed(2) + ' جنيه';
        balanceEl.style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

        // إنشاء المخطط
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        renderChart(
            months,
            monthlyData.map(m => m.income),
            monthlyData.map(m => m.expense),
            'شهر'
        );

        // تحديث الجدول
        updateYearlyTable(monthlyData, months);
    }

    // عرض المخطط الشريطي
    function renderChart(labels, incomeData, expenseData, labelSuffix) {
        if (window.reportChart) {
            window.reportChart.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        window.reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'مدخول',
                        data: incomeData,
                        backgroundColor: 'rgba(76, 201, 240, 0.7)',
                        borderColor: 'rgba(76, 201, 240, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'مصروف',
                        data: expenseData,
                        backgroundColor: 'rgba(247, 37, 133, 0.7)',
                        borderColor: 'rgba(247, 37, 133, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' ج';
                            }
                        }
                    }
                }
            }
        });
    }

    // عرض المخطط الدائري
    function renderPieChart(labels, data) {
        if (window.reportChart) {
            window.reportChart.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        window.reportChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#4cc9f0', '#4895ef', '#4361ee', '#3f37c9', 
                        '#f72585', '#b5179e', '#7209b7', '#560bad',
                        '#3a0ca3', '#3f37c9', '#4361ee', '#4895ef'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'left',
                        rtl: true
                    }
                }
            }
        });
    }

    // تحديث الجدول للتقرير الشهري
    function updateTable(transactions) {
        reportTable.innerHTML = '';
        
        transactions.forEach(trx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${trx.type === 'income' ? 'مدخول' : 'مصروف'} - ${getCategoryName(trx.category)}</td>
                <td>${parseFloat(trx.amount).toFixed(2)} جنيه</td>
                <td>${formatDateForTable(trx.date)}</td>
            `;
            reportTable.appendChild(row);
        });
    }

    // تحديث الجدول لتقرير الفئات
    function updateCategoryTable(categories) {
        reportTable.innerHTML = '';
        
        // إضافة المدخولات
        Object.entries(categories.income).forEach(([category, amount]) => {
            const totalIncome = Object.values(categories.income).reduce((a, b) => a + b, 0);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${getCategoryName(category)}</td>
                <td>${amount.toFixed(2)} جنيه</td>
                <td>${totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : '0'}%</td>
            `;
            reportTable.appendChild(row);
        });
        
        // إضافة المصروفات
        Object.entries(categories.expense).forEach(([category, amount]) => {
            const totalExpense = Object.values(categories.expense).reduce((a, b) => a + b, 0);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${getCategoryName(category)}</td>
                <td>${amount.toFixed(2)} جنيه</td>
                <td>${totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0'}%</td>
            `;
            reportTable.appendChild(row);
        });
    }

    // تحديث الجدول للتقرير السنوي
    function updateYearlyTable(monthlyData, months) {
        reportTable.innerHTML = '';
        
        monthlyData.forEach((month, index) => {
            const total = month.income + month.expense;
            if (total === 0) return;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${months[index]}</td>
                <td>${total.toFixed(2)} جنيه</td>
                <td>${month.income > 0 ? (month.income / total * 100).toFixed(1) : '0'}%</td>
            `;
            reportTable.appendChild(row);
        });
    }

    // اسم الفئة
    function getCategoryName(category) {
        const categories = {
            'salary': 'راتب',
            'investment': 'استثمار',
            'gift': 'هدية',
            'food': 'طعام',
            'transport': 'مواصلات',
            'bills': 'فواتير',
            'shopping': 'تسوق',
            'other-income': 'أخرى (مدخول)',
            'other-expense': 'أخرى (مصروف)'
        };
        return categories[category] || category;
    }

    // تنسيق التاريخ للجدول
    function formatDateForTable(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString; // إذا كان التاريخ غير صالح، نعيده كما هو
            }
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('ar-EG', options);
        } catch (e) {
            return dateString;
        }
    }

    // التحميل الأولي
    generateReport();
});

const Income = require('../models/Income');
const Expense = require('../models/Expense');
const {isValidObjectId, Types} = require('mongoose');

// Dashboard Data
exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;
        const userObjectId = new Types.ObjectId(String(userId));

        // fetch total income and expenses
        const totalIncome = await Income.aggregate([
            {$match: {userId: userObjectId}},
            {$group: {_id: null, total: {$sum: '$amount'}}}
        ]);

        console.log("totalIncome", {totalIncome, userId: isValidObjectId(userId)});

        const totalExpense = await Expense.aggregate([
            {$match: {userId: userObjectId}},
            {$group: {_id: null, total: {$sum: '$amount'}}}
        ]);

        // Calculate the date 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        console.log("Querying expenses from:", thirtyDaysAgo);

        // get income transactions in last 60 days
        const last60DaysIncomeTransactions = await Income.find({
            userId,
            date: {$gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)},
    }).sort({date: -1});

        // get total income for last 60 days
        const incomeLast60Days = last60DaysIncomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

        // get expense transactions in last 30 days
        const last30DaysExpenseTransactions = await Expense.find({
            userId: userObjectId,
            date: {$gte: thirtyDaysAgo}
        }).sort({date: -1});

        console.log("Found expenses:", last30DaysExpenseTransactions);

        // get total expense for last 30 days
        const expenseLast30Days = last30DaysExpenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

        // fetch last 5 transactions (income + expense)
        const last5Transactions = [
            ...(await Income.find({userId: userObjectId}).sort({date: -1}).limit(5)).map((txn) => ({
                ...txn.toObject(),
                type: "income",
            })),
            ...(await Expense.find({userId: userObjectId}).sort({date: -1}).limit(5)).map((txn) => ({
                ...txn.toObject(),
                type: "expense",
            }))
        ].sort((a,b) => b.date - a.date); // sort latest first

        // final response
        const response = {
            totalBalance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
            totalIncome: totalIncome[0]?.total || 0,
            totalExpenses: totalExpense[0]?.total || 0,
            last30DaysExpenses: {
                total: expenseLast30Days,
                transactions: last30DaysExpenseTransactions,
            },
            last60DaysIncome: {
                total: incomeLast60Days,
                transactions: last60DaysIncomeTransactions,
            },
            recentTransactions: last5Transactions,
        };

        console.log("Sending response:", response);
        res.json(response);
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({message: "Error getting dashboard data"});
    }
}
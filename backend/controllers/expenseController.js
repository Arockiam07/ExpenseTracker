const xlsx = require('xlsx');
const Expense = require('../models/Expense');

// add Expense source
exports.addExpense = async (req,res) => {
    const userId = req.user.id;
    try {
        const {icon, category, amount, date} = req.body;

        // validation: check for missing fields
        if(!category || !amount || !date) {
            return res.status(400).json({message: "Please fill in all fields"});
        }

        const newExpense = new Expense({
            userId,
            icon,
            category,
            amount,
            date: new Date(date),
        });

        await newExpense.save();
        res.status(201).json(newExpense);
    } catch (error) {
        res.status(500).json({message: "Error adding Expense"});
    }
}

// get all expense source
exports.getAllExpense = async (req,res) => {
    const userId = req.user.id;

    try {
        const expense = await Expense.find({userId}).sort({date: -1});   
        res.json(expense); 
    } catch (error) {
        res.status(500).json({message: "Error getting Expense"});
    }
}

// delete expense source
exports.deleteExpense = async (req,res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({message: "Expense deleted successfully"});
    } catch (error) {
        res.status(500).json({message: "Error deleting Expense"});
    }
}

// download excel
exports.downloadExpenseExcel = async (req,res) => {
    const userId = req.user.id;

    try {
        const expense = await Expense.find({userId}).sort({date: -1});

        // prepare data for excel
        const data = expense.map((item) => ({
            Category: item.category,
            Amount: item.amount,
            Date: new Date(item.date).toLocaleDateString(),
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Expense");
        
        // Write to buffer instead of file
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        // Set headers for excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=expense_details.xlsx');
        
        // Send buffer directly
        res.send(excelBuffer);
    } catch (error) {
        console.error("Error downloading Expense Excel:", error);
        res.status(500).json({message: "Error downloading Expense Excel"});
    }
}
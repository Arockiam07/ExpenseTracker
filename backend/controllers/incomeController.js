const xlsx = require('xlsx');
const Income = require('../models/Income');

// add income source
exports.addIncome = async (req,res) => {
    const userId = req.user.id;
    try {
        const {icon, source, amount, date} = req.body;

        // validation: check for missing fields
        if(!source || !amount || !date) {
            return res.status(400).json({message: "Please fill in all fields"});
        }

        const newIncome = new Income({
            userId,
            icon,
            source,
            amount,
            date: new Date(date),
        });

        await newIncome.save();
        res.status(201).json(newIncome);
    } catch (error) {
        res.status(500).json({message: "Error adding Income"});
    }
}

// get all income source
exports.getAllIncome = async (req,res) => {
    const userId = req.user.id;

    try {
        const income = await Income.find({userId}).sort({date: -1});   
        res.json(income); 
    } catch (error) {
        res.status(500).json({message: "Error getting Income"});
    }
}

// delete income source
exports.deleteIncome = async (req,res) => {
    try {
        await Income.findByIdAndDelete(req.params.id);
        res.json({message: "Income deleted successfully"});
    } catch (error) {
        res.status(500).json({message: "Error deleting Income"});
    }
}

// download excel
exports.downloadIncomeExcel = async (req,res) => {
    const userId = req.user.id;

    try {
        const income = await Income.find({userId}).sort({date: -1});

        // prepare data for excel
        const data = income.map((item) => ({
            Source: item.source,
            Amount: item.amount,
            Date: new Date(item.date).toLocaleDateString(),
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Income");
        
        // Write to buffer instead of file
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        // Set headers for excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=income_details.xlsx');
        
        // Send buffer directly
        res.send(excelBuffer);
    } catch (error) {
        console.error("Error downloading Income Excel:", error);
        res.status(500).json({message: "Error downloading Income Excel"});
    }
}
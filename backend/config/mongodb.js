const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://Hellnight:Hellnight2005@backend.c9lq1ir.mongodb.net/hospital_reports?retryWrites=true&w=majority&appName=Backend';
        await mongoose.connect(uri);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

module.exports = connectMongo;

const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/hospital_reports';
        await mongoose.connect(uri);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

module.exports = connectMongo;

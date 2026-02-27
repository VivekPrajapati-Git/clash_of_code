require('dotenv').config();
const mongoose = require('mongoose');

// Define Mongoose Schema for the Report (same as in report.js)
const reportSchema = new mongoose.Schema({
    patient_sql_id: { type: String, required: true },
    test_data: {
        type: { type: String },
        result: { type: String },
        lab_tech_id: { type: String }
    },
    ai_layer: {
        preliminary_priority: { type: Number },
        auto_triggered: { type: Boolean },
    },
    clinical_verification: {
        status: { type: String, default: 'PENDING' },
        doctor_id: { type: String },
    }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

const fakeReports = [
    {
        patient_sql_id: "PAT_101",
        test_data: {
            type: "BLOOD_TEST",
            result: "ABNORMAL - High WBC",
            lab_tech_id: "TECH_505"
        },
        ai_layer: {
            preliminary_priority: 8, // High priority
            auto_triggered: true
        },
        clinical_verification: {
            status: "PENDING",
            doctor_id: "DOC_101"
        }
    },
    {
        patient_sql_id: "PAT_102",
        test_data: {
            type: "X_RAY",
            result: "NORMAL",
            lab_tech_id: "TECH_505"
        },
        ai_layer: {
            preliminary_priority: 2, // Low priority
            auto_triggered: false
        },
        clinical_verification: {
            status: "PENDING",
            doctor_id: "DOC_102"
        }
    },
    {
        patient_sql_id: "PAT_103",
        test_data: {
            type: "MRI",
            result: "CRITICAL - Brain Hemorrhage",
            lab_tech_id: "TECH_505"
        },
        ai_layer: {
            preliminary_priority: 10, // Max priority
            auto_triggered: true
        },
        clinical_verification: {
            status: "PENDING",
            doctor_id: "DOC_101"
        }
    },
    {
        patient_sql_id: "PAT_104",
        test_data: {
            type: "URINE_TEST",
            result: "MILD INFECTION",
            lab_tech_id: "TECH_505"
        },
        ai_layer: {
            preliminary_priority: 5, // Medium priority
            auto_triggered: false
        },
        clinical_verification: {
            status: "PENDING",
            doctor_id: "DOC_103"
        }
    }
];

async function seedReports() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://Hellnight:Hellnight2005@backend.c9lq1ir.mongodb.net/hospital_reports?retryWrites=true&w=majority&appName=Backend';
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB Atlas");

        // Optional: Clear existing reports for a clean slate
        // await Report.deleteMany({});
        // console.log("Cleared existing reports");

        const inserted = await Report.insertMany(fakeReports);
        console.log(`Successfully inserted ${inserted.length} fake reports!`);

    } catch (error) {
        console.error("Error seeding reports:", error);
    } finally {
        mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

seedReports();

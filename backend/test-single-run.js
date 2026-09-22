const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_BASE = "http://localhost:5000/api/v1";

async function run() {
    const timestamp = Date.now();
    const user = {
        name: "Verification User",
        email: `verify_${timestamp}@example.com`,
        password: "Password123!"
    };

    console.log("=== STEP 1: Registering verification user ===");
    const regRes = await axios.post(`${API_BASE}/auth/register`, user);
    console.log("Registration status:", regRes.status);

    console.log("=== STEP 2: Logging in verification user ===");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: user.email,
        password: user.password
    });
    console.log("Login status:", loginRes.status);
    const token = loginRes.data.data.token;
    console.log("Token received, length:", token.length);

    console.log("\n=== STEP 3: Triggering ONE controlled research generation ===");
    console.log("Query: 'Paracetamol use in sepsis'");
    console.log("Request initiated at:", new Date().toISOString());

    const client = axios.create({
        baseURL: API_BASE,
        headers: {
            Authorization: `Bearer ${token}`
        },
        timeout: 120000 // 2 minutes max to avoid indefinite wait
    });

    let stage = "before response generation";
    try {
        stage = "during generation";
        const res = await client.post("/research/generate", {
            query: "Paracetamol use in sepsis"
        });

        stage = "after generation";
        console.log("\nGeneration HTTP Status:", res.status);
        console.log("Success flag:", res.data.success);
        console.log("Message:", res.data.message);

        const data = res.data.data;
        const savedReport = data.savedReport;
        console.log("\nSaved Report ID:", savedReport?.id);
        console.log("Report Title:", savedReport?.title);
        console.log("Summary length (chars):", savedReport?.summary?.length);
        console.log("aiInsights (full report) length (chars):", savedReport?.aiInsights?.length);
        console.log("Literature count:", data.literatureData?.articles?.length);
        console.log("Clinical trials count:", data.clinicalTrialData?.trials?.length);

        // Save report output to scratch for detailed verification
        fs.writeFileSync(
            path.join(__dirname, "last_report_result.json"),
            JSON.stringify(data, null, 2),
            "utf-8"
        );
        console.log("\nReport metadata saved to last_report_result.json");

        // Step 4: Verify PDF endpoint
        console.log("\n=== STEP 4: Verifying PDF generation endpoint ===");
        const pdfRes = await client.get(`/research/reports/${savedReport.id}/pdf`, {
            responseType: "arraybuffer"
        });
        console.log("PDF HTTP Status:", pdfRes.status);
        console.log("PDF Content-Type:", pdfRes.headers["content-type"]);
        console.log("PDF Size (bytes):", pdfRes.data.length);
        fs.writeFileSync(path.join(__dirname, "last_report.pdf"), pdfRes.data);
        console.log("PDF saved to last_report.pdf");

        return {
            success: true,
            user,
            token,
            reportId: savedReport.id
        };
    } catch (err) {
        console.error("\n*** GENERATION ERROR ***");
        console.error("Failure stage:", stage);
        if (err.response) {
            console.error("HTTP Status:", err.response.status);
            console.error("Error data:", err.response.data);
        } else {
            console.error("Error message:", err.message);
        }
        return {
            success: false,
            stage,
            status: err.response?.status || "N/A",
            message: err.response?.data?.message || err.message
        };
    }
}

run().catch(console.error);

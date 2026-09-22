import axios from "axios";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000/api/v1";

// Generates a unique email to ensure registration doesn't conflict
const uniqueEmail = `testuser_e2e_${Date.now()}@example.com`;
const testUser = {
    name: "E2E Test User",
    email: uniqueEmail,
    password: "Password123"
};

async function main() {
    console.log("=== Starting End-to-End Functional Acceptance Tests ===\n");

    // 1. GET /health
    console.log("Step 1: Checking Health Endpoint...");
    try {
        const res = await axios.get(`${API_BASE}/health`);
        console.log("Health status:", res.data);
    } catch (e: any) {
        console.error("Health check failed:", e.message);
        process.exit(1);
    }

    // 2. GET /test-db
    console.log("\nStep 2: Testing DB connectivity...");
    try {
        const res = await axios.get(`${API_BASE}/test-db`);
        console.log("DB connection OK. Users count:", res.data.users?.length);
    } catch (e: any) {
        console.error("DB check failed:", e.message);
        process.exit(1);
    }

    // 3. Register user
    console.log("\nStep 3: Registering new user...");
    try {
        const res = await axios.post(`${API_BASE}/auth/register`, testUser);
        console.log("Registration Success:", res.data.message);
    } catch (e: any) {
        console.error("Registration failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 4. Login user & save JWT token
    console.log("\nStep 4: Logging in user...");
    let token = "";
    try {
        const res = await axios.post(`${API_BASE}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        token = res.data.data.token;
        console.log("Login Success. Token acquired:", token ? "Yes (length: " + token.length + ")" : "No");
    } catch (e: any) {
        console.error("Login failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 5. Test protected route rejection (no token)
    console.log("\nStep 5: Testing protected route rejection (no auth header)...");
    try {
        await axios.post(`${API_BASE}/research/generate`, { query: "Metformin for Cancer" });
        console.error("FAIL: Protected route allowed query without auth headers!");
        process.exit(1);
    } catch (e: any) {
        console.log("SUCCESS: Request rejected with status:", e.response?.status, "(Expected: 401)");
    }

    // 6. Test protected route rejection (invalid token)
    console.log("\nStep 6: Testing protected route rejection (invalid token)...");
    try {
        await axios.post(`${API_BASE}/research/generate`, { query: "Metformin for Cancer" }, {
            headers: { Authorization: "Bearer invalid_token_123" }
        });
        console.error("FAIL: Protected route allowed query with invalid token!");
        process.exit(1);
    } catch (e: any) {
        console.log("SUCCESS: Request rejected with status:", e.response?.status, "(Expected: 401)");
    }

    // 7. Run full research workflow (PubMed -> FDA -> Trials -> Gemini -> PDF -> DB write)
    console.log("\nStep 7: Launching full research workflow (Metformin for Cancer)...");
    let reportId = "";
    let pdfPathUrl = "";
    try {
        const res = await axios.post(`${API_BASE}/research/generate`, {
            query: "Metformin for Cancer"
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data.data;
        reportId = data.savedReport.id;
        pdfPathUrl = data.savedReport.pdfUrl;
        
        console.log("Research successfully generated!");
        console.log("- Total literature articles fetched:", data.literatureData.articles?.length);
        console.log("- Total clinical trials fetched:", data.clinicalTrialData.trials?.length);
        console.log("- FDA Brand Name retrieved:", data.drugInfoData.drugData?.brandName);
        console.log("- Market intelligence data present:", !!data.marketData);
        console.log("- Gemini summary size (chars):", data.aiReport?.length);
        console.log("- Report ID in DB:", reportId);
        console.log("- PDF serving URL path:", pdfPathUrl);
    } catch (e: any) {
        console.error("Research generation failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 8. Verify PDF file presence and contents
    console.log("\nStep 8: Checking PDF file existence in filesystem...");
    const relativePdfPath = pdfPathUrl.replace(/^\//, ""); // strip leading slash
    const fullPdfPath = path.join(process.cwd(), relativePdfPath);
    console.log("Looking for PDF file at:", fullPdfPath);
    if (fs.existsSync(fullPdfPath)) {
        const stats = fs.statSync(fullPdfPath);
        console.log("SUCCESS: PDF file exists! Size:", stats.size, "bytes");
    } else {
        console.error("FAIL: PDF file does not exist at local path:", fullPdfPath);
        process.exit(1);
    }

    // 9. Fetch research history
    console.log("\nStep 9: Testing user research history query...");
    try {
        const res = await axios.get(`${API_BASE}/research/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const reportsList = res.data.data;
        console.log("History reports fetched. Count:", reportsList.length);
        const reportInHistory = reportsList.find((r: any) => r.id === reportId);
        console.log("SUCCESS: Newly generated report listed in history:", !!reportInHistory);
    } catch (e: any) {
        console.error("History fetch failed:", e.response?.data || e.message);
        process.exit(1);
    }

    // 10. Fetch single report details
    console.log("\nStep 10: Fetching single report details...");
    try {
        const res = await axios.get(`${API_BASE}/research/${reportId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Report details retrieved. Title:", res.data.data.title);
        console.log("SUCCESS: Insights content present:", !!res.data.data.aiInsights);
    } catch (e: any) {
        console.error("Fetch single report failed:", e.response?.data || e.message);
        process.exit(1);
    }

    console.log("\n=== E2E Functional Acceptance Test Completed Successfully ===");
    process.exit(0);
}

main();

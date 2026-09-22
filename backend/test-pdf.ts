import { generateResearchPDF } from "./src/services/pdf.service";

async function main() {
    const reportId = "test-pdf-generation-id";
    const query = "Ibuprofen for COVID-19";
    const mockReportText = `
# Executive Summary
This is a test research report evaluating Ibuprofen for repurposing in COVID-19 treatment.
Pharmacological interventions require rigorous evaluation.

> **Key Finding:** Ibuprofen has shown potential in reducing the inflammatory response in preclinical models.
> **Warning:** Adverse gastrointestinal effects must be monitored closely in clinical settings.

# Disease Background
COVID-19 pathophysiology involves severe respiratory symptoms and hyper-inflammation.
There is a significant unmet medical need for host-directed therapies.

# Drug Overview
Ibuprofen is a widely available non-steroidal anti-inflammatory drug (NSAID).

| Brand Name | Generic Name | Manufacturer |
|---|---|---|
| Advil | Ibuprofen | GSK |
| Motrin | Ibuprofen | McNeil |
| CVS Ibuprofen | Ibuprofen | CVS Pharmacy |

# Clinical Insights
We analyzed clinical trials comparing ibuprofen against other therapeutics.

| Trial ID | Title | Status | Phase |
|---|---|---|---|
| NCT01234567 | Safety of Ibuprofen in COVID-19 | Completed | Phase 3 |
| NCT76543210 | Ibuprofen vs Paracetamol | Recruiting | Phase 4 |

# Conclusion
The repurposing hypothesis warrants further research.

# References
1. Smith et al. Ibuprofen in acute inflammation. Journal of Medicine, 2024.
2. Doe et al. Clinical trial outcomes for COVID-19. Lancet, 2025.
`;

    console.log("--- Testing PDF Generation Service ---");
    try {
        const pdfUrl = await generateResearchPDF(reportId, query, mockReportText);
        console.log("PDF Generation Success. Saved to URL:", pdfUrl);
    } catch (e) {
        console.error("PDF generation failed with error:", e);
    }
}

main();

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f5e97000/health", (c) => {
  return c.json({ status: "ok" });
});

// Get usage data
app.get("/make-server-f5e97000/usage", async (c) => {
  try {
    const usageData = await kv.get("cfo-helper-usage") || { scenarios: 0, reports: 0 };
    return c.json(usageData);
  } catch (error) {
    console.log("Error loading usage data:", error);
    return c.json({ scenarios: 0, reports: 0 }, 500);
  }
});

// Update usage data
app.post("/make-server-f5e97000/usage", async (c) => {
  try {
    const { scenarios, reports } = await c.req.json();
    await kv.set("cfo-helper-usage", { scenarios, reports, lastUpdated: new Date().toISOString() });
    return c.json({ success: true, scenarios, reports });
  } catch (error) {
    console.log("Error saving usage data:", error);
    return c.json({ error: "Failed to save usage data" }, 500);
  }
});

// Save scenario data
app.post("/make-server-f5e97000/scenario", async (c) => {
  try {
    const scenarioData = await c.req.json();
    const scenarioId = `scenario-${Date.now()}`;
    await kv.set(scenarioId, {
      ...scenarioData,
      timestamp: new Date().toISOString()
    });
    
    // Update scenario counter
    const usageData = await kv.get("cfo-helper-usage") || { scenarios: 0, reports: 0 };
    usageData.scenarios += 1;
    await kv.set("cfo-helper-usage", usageData);
    
    return c.json({ success: true, scenarioId });
  } catch (error) {
    console.log("Error saving scenario:", error);
    return c.json({ error: "Failed to save scenario" }, 500);
  }
});

// Get recent scenarios
app.get("/make-server-f5e97000/scenarios", async (c) => {
  try {
    const scenarios = await kv.getByPrefix("scenario-");
    const sortedScenarios = scenarios
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10); // Return last 10 scenarios
    
    return c.json({ scenarios: sortedScenarios });
  } catch (error) {
    console.log("Error loading scenarios:", error);
    return c.json({ scenarios: [] }, 500);
  }
});

// Generate report data
app.post("/make-server-f5e97000/generate-report", async (c) => {
  try {
    const reportData = await c.req.json();
    const reportId = `report-${Date.now()}`;
    
    // Enhanced report with AI insights
    const enhancedReport = {
      ...reportData,
      id: reportId,
      timestamp: new Date().toISOString(),
      aiInsights: generateAIInsights(reportData),
      projections: generateProjections(reportData)
    };
    
    await kv.set(reportId, enhancedReport);
    
    // Update reports counter
    const usageData = await kv.get("cfo-helper-usage") || { scenarios: 0, reports: 0 };
    usageData.reports += 1;
    await kv.set("cfo-helper-usage", usageData);
    
    return c.json({ success: true, reportId, report: enhancedReport });
  } catch (error) {
    console.log("Error generating report:", error);
    return c.json({ error: "Failed to generate report" }, 500);
  }
});

// Helper function to generate AI insights
function generateAIInsights(data) {
  const insights = [];
  const { totalMonthlyBurn, monthlyRevenue, runwayMonths, employees, productPrice } = data.metrics;
  
  // Cash flow analysis
  if (monthlyRevenue > totalMonthlyBurn) {
    insights.push({
      category: "Cash Flow",
      type: "positive",
      message: "Strong positive cash flow indicates healthy business operations."
    });
  } else {
    insights.push({
      category: "Cash Flow",
      type: "warning",
      message: "Negative cash flow requires immediate attention to extend runway."
    });
  }
  
  // Runway analysis
  if (runwayMonths < 6) {
    insights.push({
      category: "Runway",
      type: "critical",
      message: "Critical runway situation. Focus on revenue growth or cost reduction."
    });
  } else if (runwayMonths > 18) {
    insights.push({
      category: "Runway",
      type: "opportunity",
      message: "Healthy runway provides opportunity for strategic investments."
    });
  }
  
  // Pricing analysis
  if (productPrice < 200) {
    insights.push({
      category: "Pricing",
      type: "opportunity",
      message: "Consider price optimization to improve unit economics."
    });
  }
  
  return insights;
}

// Helper function to generate financial projections
function generateProjections(data) {
  const { totalMonthlyBurn, monthlyRevenue, currentCash } = data.metrics;
  const projections = [];
  let cashBalance = currentCash;
  
  for (let month = 1; month <= 12; month++) {
    cashBalance += (monthlyRevenue - totalMonthlyBurn);
    projections.push({
      month,
      cashBalance: Math.max(0, cashBalance),
      revenue: monthlyRevenue,
      expenses: totalMonthlyBurn,
      netFlow: monthlyRevenue - totalMonthlyBurn
    });
  }
  
  return projections;
}

Deno.serve(app.fetch);
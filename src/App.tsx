import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Slider } from './components/ui/slider';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Separator } from './components/ui/separator';
import { Alert, AlertDescription } from './components/ui/alert';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar, BarChart3, FileText, AlertTriangle, TrendingDown, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from './utils/supabase/info';

export default function App() {
  const [employees, setEmployees] = useState([5]);
  const [marketingBudget, setMarketingBudget] = useState([30000]);
  const [productPrice, setProductPrice] = useState([150]);
  const [currentCash, setCurrentCash] = useState([800000]);
  const [scenariosAnalyzed, setScenariosAnalyzed] = useState(0);
  const [reportsGenerated, setReportsGenerated] = useState(0);
  const [isUpdatingData, setIsUpdatingData] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  const [baseCustomerCount, setBaseCustomerCount] = useState(100);
  const [fixedMonthlyCosts, setFixedMonthlyCosts] = useState(20000);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Animated values for smooth transitions
  const [animatedValues, setAnimatedValues] = useState({
    burn: 0,
    revenue: 0,
    runway: 0,
    customers: 0
  });

  // Load usage data from backend on component mount
  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f5e97000/usage`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setScenariosAnalyzed(data.scenarios || 0);
        setReportsGenerated(data.reports || 0);
      }
    } catch (error) {
      console.log('Could not load usage data:', error);
      // Fallback to localStorage
      const scenarios = localStorage.getItem('cfh-scenarios');
      const reports = localStorage.getItem('cfh-reports');
      if (scenarios) setScenariosAnalyzed(parseInt(scenarios));
      if (reports) setReportsGenerated(parseInt(reports));
    }
  };

  const saveUsageData = async (scenarios: number, reports: number) => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f5e97000/usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scenarios, reports })
      });
    } catch (error) {
      console.log('Could not save usage data:', error);
      // Fallback to localStorage
      localStorage.setItem('cfh-scenarios', scenarios.toString());
      localStorage.setItem('cfh-reports', reports.toString());
    }
  };

  // Format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  // Enhanced calculations with live data
  const monthlySalaryCost = employees[0] * 60000;
  const totalMonthlyBurn = monthlySalaryCost + marketingBudget[0] + fixedMonthlyCosts;
  const monthlyRevenue = baseCustomerCount * productPrice[0];
  const netCashFlow = monthlyRevenue - totalMonthlyBurn;
  const runwayMonths = totalMonthlyBurn > 0 ? currentCash[0] / totalMonthlyBurn : 999;
  const breakEvenCustomers = Math.ceil(totalMonthlyBurn / productPrice[0]);

  // Animate values when they change
  useEffect(() => {
    const animateToTarget = (currentValue: number, targetValue: number, key: keyof typeof animatedValues) => {
      const diff = targetValue - currentValue;
      const steps = 10;
      const stepSize = diff / steps;
      
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const newValue = currentValue + (stepSize * step);
        
        setAnimatedValues(prev => ({
          ...prev,
          [key]: step === steps ? targetValue : newValue
        }));
        
        if (step === steps) {
          clearInterval(interval);
        }
      }, 50);
      
      return interval;
    };

    const intervals = [
      animateToTarget(animatedValues.burn, totalMonthlyBurn, 'burn'),
      animateToTarget(animatedValues.revenue, monthlyRevenue, 'revenue'),
      animateToTarget(animatedValues.runway, runwayMonths, 'runway'),
      animateToTarget(animatedValues.customers, breakEvenCustomers, 'customers')
    ];

    return () => intervals.forEach(clearInterval);
  }, [totalMonthlyBurn, monthlyRevenue, runwayMonths, breakEvenCustomers]);

  // Get runway status color and message
  const getRunwayStatus = (months: number) => {
    if (months > 12) return { color: 'bg-green-500', text: 'Healthy', level: 'safe' };
    if (months >= 6) return { color: 'bg-yellow-500', text: 'Cautious', level: 'warning' };
    return { color: 'bg-red-500', text: 'Critical', level: 'danger' };
  };

  const runwayStatus = getRunwayStatus(runwayMonths);

  // AI Recommendations based on current scenario
  const getAIRecommendations = () => {
    const recommendations = [];
    
    if (runwayMonths < 3) {
      recommendations.push({
        type: 'critical',
        icon: AlertTriangle,
        title: 'Critical Cash Situation',
        message: 'Immediate action required. Consider reducing costs or raising funds within 60 days.',
        color: 'text-red-400'
      });
    }
    
    if (netCashFlow >= 0) {
      recommendations.push({
        type: 'positive',
        icon: CheckCircle,
        title: 'Profitable Operations',
        message: 'Great! Consider reinvesting profits into growth or building reserves.',
        color: 'text-green-400'
      });
    }
    
    if (employees[0] > 10 && runwayMonths < 6) {
      recommendations.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'High Burn from Team Size',
        message: 'Consider optimizing team size or increasing revenue to sustain current headcount.',
        color: 'text-yellow-400'
      });
    }
    
    if (productPrice[0] < 100 && breakEvenCustomers > 500) {
      recommendations.push({
        type: 'opportunity',
        icon: TrendingUp,
        title: 'Pricing Opportunity',
        message: 'Consider raising prices. Even a 20% increase could significantly improve unit economics.',
        color: 'text-blue-400'
      });
    }

    return recommendations;
  };

  // Generate 12-month projection data for charts
  const generateProjectionData = () => {
    const data = [];
    let cashBalance = currentCash[0];
    
    for (let month = 1; month <= 12; month++) {
      cashBalance += netCashFlow;
      data.push({
        month: `Month ${month}`,
        cash: Math.max(0, cashBalance),
        revenue: monthlyRevenue,
        expenses: totalMonthlyBurn,
        netFlow: netCashFlow
      });
    }
    
    return data;
  };

  const projectionData = generateProjectionData();

  // Handle slider changes and increment scenario counter
  const handleSliderChange = useCallback((setter: any, value: any) => {
    setter(value);
    const newCount = scenariosAnalyzed + 1;
    setScenariosAnalyzed(newCount);
    saveUsageData(newCount, reportsGenerated);
    toast.success(`Scenario ${newCount} analyzed`);
  }, [scenariosAnalyzed, reportsGenerated]);

  // Simulate market data update
  const handleUpdateMarketData = async () => {
    setIsUpdatingData(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Randomly adjust market conditions
      const newCustomerCount = Math.floor(80 + Math.random() * 40); // 80-120 customers
      const newFixedCosts = Math.floor(15000 + Math.random() * 10000); // ₹15k-25k
      
      setBaseCustomerCount(newCustomerCount);
      setFixedMonthlyCosts(newFixedCosts);
      setLastDataUpdate(new Date());
      
      const newCount = scenariosAnalyzed + 1;
      setScenariosAnalyzed(newCount);
      saveUsageData(newCount, reportsGenerated);
      
      toast.success('Market data updated successfully!');
    } catch (error) {
      toast.error('Failed to update market data');
    } finally {
      setIsUpdatingData(false);
    }
  };

  // Generate and download report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const reportData = {
        timestamp: new Date().toISOString(),
        parameters: {
          employees: employees[0],
          marketingBudget: marketingBudget[0],
          productPrice: productPrice[0],
          currentCash: currentCash[0]
        },
        metrics: {
          monthlyBurn: totalMonthlyBurn,
          monthlyRevenue,
          netCashFlow,
          runway: runwayMonths,
          breakEvenCustomers
        },
        recommendations: getAIRecommendations()
      };

      // Create and download a simple text report
      const reportContent = `CFO Helper - Financial Scenario Report
Generated: ${new Date().toLocaleString()}

BUSINESS PARAMETERS:
• Employees: ${employees[0]}
• Monthly Marketing Budget: ${formatCurrency(marketingBudget[0])}
• Product Price: ${formatCurrency(productPrice[0])}
• Current Cash: ${formatCurrency(currentCash[0])}

FINANCIAL ANALYSIS:
• Monthly Burn Rate: ${formatCurrency(totalMonthlyBurn)}
• Monthly Revenue: ${formatCurrency(monthlyRevenue)}
• Net Cash Flow: ${formatCurrency(netCashFlow)}
• Runway: ${runwayMonths.toFixed(1)} months
• Break-even Customers: ${breakEvenCustomers}

STATUS: ${netCashFlow >= 0 ? 'PROFITABLE' : 'BURNING CASH'}
RUNWAY STATUS: ${runwayStatus.text.toUpperCase()}

AI RECOMMENDATIONS:
${getAIRecommendations().map(rec => `• ${rec.title}: ${rec.message}`).join('\n')}
`;

      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cfo-helper-report-${Date.now()}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      const newCount = reportsGenerated + 1;
      setReportsGenerated(newCount);
      saveUsageData(scenariosAnalyzed, newCount);
      
      toast.success('Report generated and downloaded!');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CFO Helper</h1>
              <p className="text-slate-400">Smart Financial Scenarios</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {lastDataUpdate && (
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" />
                <span>Updated: {lastDataUpdate.toLocaleTimeString()}</span>
              </div>
            )}
            <Badge variant="outline" className="border-blue-500 text-blue-400">
              Live Data Enabled
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span>Business Parameters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Employees Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Employees</label>
                    <span className="text-2xl font-bold text-blue-400">{employees[0]}</span>
                  </div>
                  <Slider
                    value={employees}
                    onValueChange={(value) => handleSliderChange(setEmployees, value)}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Marketing Budget Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Monthly Marketing Budget</label>
                    <span className="text-2xl font-bold text-green-400">{formatCurrency(marketingBudget[0])}</span>
                  </div>
                  <Slider
                    value={marketingBudget}
                    onValueChange={(value) => handleSliderChange(setMarketingBudget, value)}
                    max={200000}
                    min={0}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>₹0</span>
                    <span>₹2,00,000</span>
                  </div>
                </div>

                {/* Product Price Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Product Price</label>
                    <span className="text-2xl font-bold text-purple-400">{formatCurrency(productPrice[0])}</span>
                  </div>
                  <Slider
                    value={productPrice}
                    onValueChange={(value) => handleSliderChange(setProductPrice, value)}
                    max={1000}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>₹10</span>
                    <span>₹1,000</span>
                  </div>
                </div>

                {/* Current Cash Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Current Cash</label>
                    <span className="text-2xl font-bold text-yellow-400">{formatCurrency(currentCash[0])}</span>
                  </div>
                  <Slider
                    value={currentCash}
                    onValueChange={(value) => handleSliderChange(setCurrentCash, value)}
                    max={10000000}
                    min={100000}
                    step={50000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>₹1,00,000</span>
                    <span>₹1,00,00,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Analysis */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-400" />
                  <span>Financial Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-slate-400">Monthly Burn Rate</p>
                    <p className="text-3xl font-bold text-red-400">{formatCurrency(animatedValues.burn)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-400">Runway</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${runwayStatus.color}`}></div>
                      <p className="text-3xl font-bold">{animatedValues.runway.toFixed(1)} months</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-400">Break-even Customers</p>
                    <p className="text-3xl font-bold text-orange-400">{Math.round(animatedValues.customers)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-400">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-green-400">{formatCurrency(animatedValues.revenue)}</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Net Cash Flow</span>
                    <span className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    {netCashFlow >= 0 ? 'Your business is profitable!' : 'Your business is burning cash'}
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Runway Status</span>
                      <span className={runwayStatus.color.replace('bg-', 'text-')}>{runwayStatus.text}</span>
                    </div>
                    <Progress 
                      value={Math.min(100, (runwayMonths / 24) * 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cash Flow Projection */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">12-Month Cash Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value), 'Cash']}
                        labelStyle={{ color: '#1F2937' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                      />
                      <Line type="monotone" dataKey="cash" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue vs Expenses */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[{ name: 'Current Month', revenue: monthlyRevenue, expenses: totalMonthlyBurn }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [formatCurrency(value), name === 'revenue' ? 'Revenue' : 'Expenses']}
                        labelStyle={{ color: '#1F2937' }}
                        contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                      />
                      <Bar dataKey="revenue" fill="#10B981" />
                      <Bar dataKey="expenses" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                  <span>AI Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getAIRecommendations().map((rec, index) => (
                  <Alert key={index} className="bg-slate-700 border-slate-600">
                    <rec.icon className={`h-4 w-4 ${rec.color}`} />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className={`font-medium ${rec.color}`}>{rec.title}</p>
                        <p className="text-slate-300">{rec.message}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Tracking with Billing */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <span>Usage & Billing</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scenarios Analyzed</span>
                  <Badge variant="secondary" className="bg-blue-600 text-white">{scenariosAnalyzed}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Reports Generated</span>
                  <Badge variant="secondary" className="bg-green-600 text-white">{reportsGenerated}</Badge>
                </div>
                
                <Separator className="bg-slate-600" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Scenarios (₹10 each)</span>
                    <span>{formatCurrency(scenariosAnalyzed * 10)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Reports (₹25 each)</span>
                    <span>{formatCurrency(reportsGenerated * 25)}</span>
                  </div>
                  <Separator className="bg-slate-600" />
                  <div className="flex justify-between items-center font-medium">
                    <span>Session Total</span>
                    <span className="text-xl font-bold text-blue-400">
                      {formatCurrency(scenariosAnalyzed * 10 + reportsGenerated * 25)}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Credits Used</span>
                    <Badge variant={scenariosAnalyzed + reportsGenerated > 10 ? "destructive" : "secondary"}>
                      {scenariosAnalyzed + reportsGenerated}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span>Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 hover:bg-slate-700"
                  onClick={handleUpdateMarketData}
                  disabled={isUpdatingData}
                >
                  {isUpdatingData ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Update Market Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Market Data Status */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${lastDataUpdate ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span>Live Market Data</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Customer Base</span>
                  <span>{baseCustomerCount} customers</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Market Fixed Costs</span>
                  <span>{formatCurrency(fixedMonthlyCosts)}</span>
                </div>
                {lastDataUpdate && (
                  <div className="text-xs text-slate-400">
                    Last updated: {lastDataUpdate.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Salary Costs</span>
                  <span>{formatCurrency(monthlySalaryCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fixed Costs</span>
                  <span>{formatCurrency(fixedMonthlyCosts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Marketing Spend</span>
                  <span>{formatCurrency(marketingBudget[0])}</span>
                </div>
                <Separator className="bg-slate-600" />
                <div className="flex justify-between font-medium">
                  <span>Total Monthly Burn</span>
                  <span className="text-red-400">{formatCurrency(totalMonthlyBurn)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
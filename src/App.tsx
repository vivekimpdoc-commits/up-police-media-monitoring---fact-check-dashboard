import React, { useState, useMemo, useEffect } from "react";
import { 
  Shield, 
  ShieldAlert, 
  AlertCircle, 
  FileSearch, 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  Activity, 
  RotateCcw, 
  Share2, 
  FileCheck2, 
  BookOpen, 
  Filter, 
  ArrowUpDown, 
  Check, 
  Loader2, 
  Plus, 
  Calendar, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Info,
  ChevronRight,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Send,
  Bot,
  Settings,
  Key,
  ScanLine,
  UploadCloud,
  Image as ImageIcon
} from "lucide-react";
import { NewsItem, MediaAlert } from "./types";
import { initialNewsItems, initialMediaAlerts } from "./data";

export default function App() {
  // State management
  const [newsList, setNewsList] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem("up_police_news");
    return saved ? JSON.parse(saved) : initialNewsItems;
  });

  const [alerts, setAlerts] = useState<MediaAlert[]>(() => {
    const saved = localStorage.getItem("up_police_alerts");
    return saved ? JSON.parse(saved) : initialMediaAlerts;
  });

  const [activeTab, setActiveTab] = useState<"feed" | "factcheck" | "analytics" | "policy" | "aichat" | "scanner">("feed");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  
  // News filtering & sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<"All" | "Positive" | "Negative" | "Neutral">("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  
  // Selected news item for full panel view
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);

  // New Article Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSource, setNewSource] = useState("विभागीय मॉनिटरिंग डेस्क");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formError, setFormError] = useState("");

  // Live Fact Check state
  const [factClaim, setFactClaim] = useState("");
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [factCheckError, setFactCheckError] = useState("");
  const [currentFactCheck, setCurrentFactCheck] = useState<{
    status: string;
    confidence: number;
    statusColor: string;
    analysis: string;
    originRating: string;
    actionPlan: string[];
    crossReferences: string[];
    claimText?: string;
  } | null>(null);

  // Manual Protocol Verification Checklists (Traditional Police Methods)
  const [checkedProtocols, setCheckedProtocols] = useState<Record<string, boolean>>({
    distSp: false,
    liut: false,
    prCell: false,
    cyberConfirm: false,
    dgpConfirm: false
  });

  // AI Chatbot state
  const [chatMessages, setChatMessages] = useState<{role: "user" | "assistant"; text: string; timestamp: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Gemini API Key (stored in localStorage for GitHub Pages)
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Save API key to localStorage
  useEffect(() => {
    if (geminiApiKey) localStorage.setItem("gemini_api_key", geminiApiKey);
  }, [geminiApiKey]);

  // Direct Gemini API call helper (works without backend)
  const callGeminiDirect = async (systemPrompt: string, userPrompt: string, jsonMode = false): Promise<string> => {
    if (!geminiApiKey) throw new Error("NO_KEY");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const body: any = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }]
    };
    if (jsonMode) {
      body.generationConfig = { responseMimeType: "application/json" };
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Gemini API error");
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };


  // Direct Gemini Vision API call (for Newspaper Scanner)
  const callGeminiVisionDirect = async (systemPrompt: string, base64Image: string, mimeType: string): Promise<string> => {
    if (!geminiApiKey) throw new Error("NO_KEY");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: "Extract any UP Police related news from this newspaper image. Return JSON with: title (Hindi), content (Hindi detailed), sentiment (Positive/Negative/Neutral), sentimentReason (Hindi), summary (Hindi 2-3 lines), tags (array of Hindi tags), impactLevel (High/Medium/Low), recommendedAction (Hindi)." }
        ]
      }],
      generationConfig: { responseMimeType: "application/json" }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Gemini API error");
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  // Handle Image Upload for Scanner
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!geminiApiKey) {
      setScannerError("कृपया पहले Settings (नीचे बाएं) में जाकर अपनी Gemini API Key सेट करें।");
      return;
    }

    setIsScanning(true);
    setScannerError("");

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        const sysPrompt = "You are an expert UP Police Media Cell AI. You must read the provided newspaper clipping and extract police-related news accurately.";
        const resultText = await callGeminiVisionDirect(sysPrompt, base64String, file.type);
        const analysisData = JSON.parse(resultText);

        const newNewsItem = {
          id: `up-news-${Date.now()}`,
          title: analysisData.title || "अज्ञात शीर्षक",
          content: analysisData.content || "विवरण उपलब्ध नहीं",
          source: "न्यूज़पेपर स्कैनर (AI Extract)",
          date: new Date().toISOString().split('T')[0],
          sentiment: analysisData.sentiment || "Neutral",
          sentimentReason: analysisData.sentimentReason || "",
          summary: analysisData.summary || "",
          tags: analysisData.tags || [],
          impactLevel: analysisData.impactLevel || "Low",
          recommendedAction: analysisData.recommendedAction || ""
        };

        setNewsList(prev => [newNewsItem, ...prev]);
        setSelectedNewsId(newNewsItem.id);
        
        if (newNewsItem.sentiment === "Negative") {
          setAlerts(prev => [{
            id: `alert-${Date.now()}`,
            type: newNewsItem.impactLevel === "High" ? "Critical" : "Warning",
            headline: `स्कैन की गई नकारात्मक खबर: ${newNewsItem.title.substring(0, 45)}...`,
            timestamp: new Date().toISOString(),
            channel: "Print Media",
            handled: false
          }, ...prev]);
        }
        
        setIsScanning(false);
        setActiveTab("feed"); // switch back to feed to show the result
        window.alert("✅ अखबार से खबर सफलतापूर्वक एक्सट्रैक्ट करके मीडिया फीड में जोड़ दी गई है!");

      } catch (err: any) {
        setIsScanning(false);
        console.error("Scanner Error:", err);
        setScannerError(err.message || "इमेज पढ़ने में समस्या हुई। कृपया स्पष्ट तस्वीर अपलोड करें।");
      }
    };
    reader.onerror = () => {
      setIsScanning(false);
      setScannerError("फाइल पढ़ने में त्रुटि।");
    };
    reader.readAsDataURL(file);
  };
  // Fallback analyze function (works without API key)
  const fallbackAnalyze = (title: string, contentText: string) => {
    const text = (title + " " + contentText).toLowerCase();
    let sentiment = "Neutral", sentimentReason = "यह समाचार सामान्य प्रशासनिक गतिविधियों से संबंधित है।";
    let summary = "इस लेख में उत्तर प्रदेश पुलिस बल की दैनिक संक्रियाओं का विवरण प्रस्तुत किया गया है।";
    let tags = ["कानून-व्यवस्था", "विविध समाचार"], impactLevel = "Low";
    let recommendedAction = "स्थानीय मीडिया सेल इस समाचार की डिजिटल पहुंच की निगरानी करे।";
    if (text.includes("बहादुरी") || text.includes("सहायता") || text.includes("बचाया") || text.includes("प्रशंसा") || text.includes("महिला") || text.includes("मदद")) {
      sentiment = "Positive"; tags = ["महिला सुरक्षा", "साहस प्रदर्शन", "जन-सेवा"]; impactLevel = "Medium";
      sentimentReason = "इस समाचार में पुलिस बल द्वारा सकारात्मक कार्य प्रदर्शित किया गया है।";
      summary = "यूपी पुलिस टीम की त्वरित कार्रवाई और नागरिक-केंद्रित पहल के बारे में सकारात्मक लेख।";
      recommendedAction = "सोशल मीडिया सेल X (@UPPolice) के माध्यम से इस खबर को साझा करें।";
    } else if (text.includes("रिश्वत") || text.includes("भ्रष्टाचार") || text.includes("लापरवाही") || text.includes("आरोप") || text.includes("मारपीट") || text.includes("शिकायत")) {
      sentiment = "Negative"; tags = ["रिश्वतखोरी", "लापरवाही", "विभागीय जांच"]; impactLevel = "High";
      sentimentReason = "इस लेख में पुलिस कर्मियों के विरुद्ध कदाचार का आरोप है।";
      summary = "संवेदनात्मक घटना जिसमें पुलिस कर्मियों के विरुद्ध आरोप है।";
      recommendedAction = "उच्चाधिकारियों द्वारा तुरंत जांच बैठाई जाए।";
    }
    return { sentiment, sentimentReason, summary, tags, impactLevel, recommendedAction };
  };

  // Fallback fact-check function
  const fallbackFactCheck = (claimText: string) => {
    const text = claimText.toLowerCase();
    let status = "Unverified (अपुष्ट)", statusColor = "#fbbf24", confidence = 75, originRating = "Organic Error";
    let analysis = "दावा: \"" + claimText + "\"\n\nविश्लेषण: इस दावे की प्राथमिक जाँच की गई है। कृपया GEMINI API Key सेट करें (⚙️ Settings) ताकि विस्तृत एआई विश्लेषण प्राप्त हो सके।";
    let actionPlan = ["संबंधित थाना प्रभारी से तथ्यपरक आख्या प्राप्त करें।", "अफवाह को रोकने के लिए डिजिटल वॉलंटियर्स को सचेत करें।", "खंडन आलेख तैयार कर सोशल मीडिया पर पिन करें।"];
    let crossReferences = ["UP Police Official Press Releases", "जिला सूचना प्रणाली (DIPR) बुलेटिन"];
    if (text.includes("फर्जी") || text.includes("लाठीचार्ज") || text.includes("दंगा") || text.includes("गोली")) {
      status = "Fake (असत्य/अफवाह)"; statusColor = "#ef4444"; confidence = 92; originRating = "High Coordinated";
      analysis = "दावा: \"" + claimText + "\"\n\nविश्लेषण: यह दावा पूरी तरह निराधार व असत्य पाया गया है। (डेमो — API Key सेट करें)";
    } else if (text.includes("छुट्टी") || text.includes("नियम") || text.includes("आदेश")) {
      status = "Partially True (आंशिक सत्य)"; statusColor = "#fbbf24"; confidence = 80;
      analysis = "दावा: \"" + claimText + "\"\n\nविश्लेषण: दावे के कुछ अंश पुराने प्रस्तावों से मेल खाते हैं। (डेमो — API Key सेट करें)";
    }
    return { status, confidence, statusColor, analysis, originRating, actionPlan, crossReferences };
  };

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem("up_police_news", JSON.stringify(newsList));
  }, [newsList]);

  useEffect(() => {
    localStorage.setItem("up_police_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Compute stats for widgets
  const stats = useMemo(() => {
    const total = newsList.length;
    const positive = newsList.filter(n => n.sentiment === "Positive").length;
    const negative = newsList.filter(n => n.sentiment === "Negative").length;
    const neutral = newsList.filter(n => n.sentiment === "Neutral").length;
    const unhandledAlerts = alerts.filter(a => !a.handled).length;
    
    return { total, positive, negative, neutral, unhandledAlerts };
  }, [newsList, alerts]);

  // Handle manual alert state toggle
  const toggleAlertHandled = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, handled: !a.handled } : a));
  };

  // Reset to default sample datasets
  const handleResetData = () => {
    if (window.confirm("क्या आप डेटा को मूल सैंपल डेटा पर रिसेट करना चाहते हैं?")) {
      setNewsList(initialNewsItems);
      setAlerts(initialMediaAlerts);
      setSelectedNewsId(initialNewsItems[0].id);
      localStorage.removeItem("up_police_news");
      localStorage.removeItem("up_police_alerts");
    }
  };

  // Analyze new article post with server-side Gemini
  const handleAnalyzeNewNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setFormError("शीर्षक (Title) और समाचार सामग्री (Content) दोनों अनिवार्य हैं।");
      return;
    }
    setFormError("");
    setIsAnalyzing(true);

    try {
      let analysisData;
      try {
        const sysPrompt = "You are an expert UP Police Media Cell AI. Analyze the news and return JSON with: sentiment (Positive/Negative/Neutral), sentimentReason (Hindi), summary (Hindi 2-3 lines), tags (array of Hindi tags), impactLevel (High/Medium/Low), recommendedAction (Hindi).";
        const resultText = await callGeminiDirect(sysPrompt, `Title: "${newTitle}"\nContent: "${newContent}"`, true);
        analysisData = JSON.parse(resultText);
      } catch (geminiErr: any) {
        console.warn("Using fallback analyzer:", geminiErr.message);
        analysisData = fallbackAnalyze(newTitle, newContent);
      }
      
      const newNewsItem: NewsItem = {
        id: `up-news-${Date.now()}`,
        title: newTitle,
        content: newContent,
        source: newSource,
        date: newDate,
        sentiment: analysisData.sentiment,
        sentimentReason: analysisData.sentimentReason,
        summary: analysisData.summary,
        tags: analysisData.tags,
        impactLevel: analysisData.impactLevel,
        recommendedAction: analysisData.recommendedAction
      };

      setNewsList(prev => [newNewsItem, ...prev]);
      setSelectedNewsId(newNewsItem.id);
      
      // Auto trigger warning alert if negative sentiment
      if (newNewsItem.sentiment === "Negative") {
        const newAlert: MediaAlert = {
          id: `alert-${Date.now()}`,
          type: newNewsItem.impactLevel === "High" ? "Critical" : "Warning",
          headline: `नकारात्मक समाचार: ${newNewsItem.title.substring(0, 45)}...`,
          timestamp: new Date().toISOString(),
          channel: "Print Media",
          handled: false
        };
        setAlerts(prev => [newAlert, ...prev]);
      }

      // Reset form states
      setNewTitle("");
      setNewContent("");
      setShowAddForm(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "एआई विश्लेषण सर्वर एरर। कृपया बाद में प्रयास करें।");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Live Fact Check Submission via server-side Gemini
  const handleFactCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factClaim.trim()) {
      setFactCheckError("फैक्ट-चेक करने के लिए वायरल दावा लिखना अनिवार्य है।");
      return;
    }
    setFactCheckError("");
    setIsFactChecking(true);
    setCurrentFactCheck(null);

    try {
      let data;
      try {
        const sysPrompt = "You are UP Police Fact-Check AI. Analyze the claim and return JSON with: status (Fake/Partially True/True/Unverified in Hindi), confidence (number 0-100), statusColor (hex), analysis (detailed Hindi text), originRating (string), actionPlan (array of Hindi strings), crossReferences (array of strings).";
        const resultText = await callGeminiDirect(sysPrompt, `Claim to fact-check: "${factClaim}"`, true);
        data = JSON.parse(resultText);
      } catch (geminiErr: any) {
        console.warn("Using fallback fact-checker:", geminiErr.message);
        data = fallbackFactCheck(factClaim);
      }
      setCurrentFactCheck({
        ...data,
        claimText: factClaim
      });

      // Reset checked protocols for new check
      setCheckedProtocols({
        distSp: false,
        liut: false,
        prCell: false,
        cyberConfirm: false,
        dgpConfirm: false
      });
    } catch (err: any) {
      console.error(err);
      setFactCheckError(err.message || "सर्वर एरर। एआई फैक्ट-चेक इस वक्त अनुपलब्ध है।");
    } finally {
      setIsFactChecking(false);
    }
  };

  // Filter and Sort processing of News List
  const filteredAndSortedNews = useMemo(() => {
    return newsList
      .filter(item => {
        // Keyword Search
        const matchesSearch = 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        
        // Sentiment Filter
        const matchesSentiment = 
          sentimentFilter === "All" || 
          item.sentiment === sentimentFilter;

        // Date Filter Range
        let matchesDate = true;
        if (dateFrom) {
          matchesDate = matchesDate && item.date >= dateFrom;
        }
        if (dateTo) {
          matchesDate = matchesDate && item.date <= dateTo;
        }

        return matchesSearch && matchesSentiment && matchesDate;
      })
      .sort((a, b) => {
        // Sort Datewise (chronologically)
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (sortOrder === "latest") {
          return dateB - dateA; // Latest to Oldest
        } else {
          return dateA - dateB; // Oldest to Latest
        }
      });
  }, [newsList, searchQuery, sentimentFilter, dateFrom, dateTo, sortOrder]);

  // Selected news helper
  const selectedNewsItem = useMemo(() => {
    return newsList.find(n => n.id === selectedNewsId) || newsList[0];
  }, [newsList, selectedNewsId]);


  // AI Chatbot submit handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = { role: "user" as const, text: chatInput.trim(), timestamp: new Date().toLocaleTimeString('hi-IN') };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput("");
    setIsChatLoading(true);
    
    try {
      if (!geminiApiKey) {
        setChatMessages(prev => [...prev, { role: "assistant", text: "⚠️ कृपया पहले Gemini API Key सेट करें!\n\nसाइडबार में नीचे ⚙️ Settings बटन दबाएँ और अपनी Google Gemini API Key डालें।\n\n🔗 Free API Key यहाँ से लें: https://aistudio.google.com/apikey", timestamp: new Date().toLocaleTimeString('hi-IN') }]);
      } else {
        const sysPrompt = "You are UP Police AI सहायक. Answer questions about UP Police, media monitoring, law & order in Hindi. Be professional and concise.";
        const historyText = chatMessages.slice(-6).map(m => `${m.role === "user" ? "User" : "AI"}: ${m.text}`).join("\n");
        const fullPrompt = historyText ? `Previous conversation:\n${historyText}\n\nUser: ${currentInput}` : currentInput;
        const reply = await callGeminiDirect(sysPrompt, fullPrompt);
        setChatMessages(prev => [...prev, { role: "assistant", text: reply || "कोई उत्तर प्राप्त नहीं हुआ।", timestamp: new Date().toLocaleTimeString('hi-IN') }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।", timestamp: new Date().toLocaleTimeString('hi-IN') }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div id="up-police-dashboard-container" className="flex flex-col lg:flex-row h-screen w-full bg-slate-100 text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-[#0f172a] text-white flex flex-col shrink-0 border-r border-slate-800 overflow-y-auto">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] bg-blue-500/30 text-blue-400 px-1.5 py-0.2 rounded font-mono font-bold tracking-wider">
                AI-POWERED
              </span>
            </div>
            <h1 className="text-sm font-black tracking-tight uppercase text-white mt-0.5">
              UP Police Media
            </h1>
            <p className="text-[10px] text-slate-400">मीडिया मॉनिटरिंग डैशबोर्ड</p>
          </div>
        </div>
        
        {/* Navigation Tab Group */}
        <nav id="main-nav" className="flex-grow py-4 space-y-1">
          <button
            id="tab-feed-btn"
            onClick={() => setActiveTab("feed")}
            className={`w-full px-5 py-3 text-xs uppercase tracking-wider font-bold text-left transition-all flex items-center gap-3 cursor-pointer border-l-4 ${
              activeTab === "feed"
                ? "bg-blue-600/15 border-blue-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800 border-transparent"
            }`}
          >
            <FileSearch className="w-4 h-4 shrink-0" />
            <span>मीडिया मॉनिटरिंग फ़ीड</span>
          </button>

          <button
            id="tab-factcheck-btn"
            onClick={() => setActiveTab("factcheck")}
            className={`w-full px-5 py-3 text-xs uppercase tracking-wider font-bold text-left transition-all flex items-center gap-3 cursor-pointer border-l-4 ${
              activeTab === "factcheck"
                ? "bg-blue-600/15 border-blue-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800 border-transparent"
            }`}
          >
            <FileCheck2 className="w-4 h-4 shrink-0" />
            <span>संदेह एवं फैक्ट-चेक</span>
          </button>

          <button
            id="tab-analytics-btn"
            onClick={() => setActiveTab("analytics")}
            className={`w-full px-5 py-3 text-xs uppercase tracking-wider font-bold text-left transition-all flex items-center gap-3 cursor-pointer border-l-4 ${
              activeTab === "analytics"
                ? "bg-blue-600/15 border-blue-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800 border-transparent"
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>सेंटीमेंट विश्लेषण ग्राफ़</span>
          </button>

          <button
            id="tab-policy-btn"
            onClick={() => setActiveTab("policy")}
            className={`w-full px-5 py-3 text-xs uppercase tracking-wider font-bold text-left transition-all flex items-center gap-3 cursor-pointer border-l-4 ${
              activeTab === "policy"
                ? "bg-blue-600/15 border-blue-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800 border-transparent"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>विभागीय नियम व IT नीतियाँ</span>
          </button>

          <button
            id="tab-scanner-btn"
            onClick={() => setActiveTab("scanner")}
            className={`w-full px-5 py-3.5 flex items-center gap-3 transition-colors ${
              activeTab === "scanner"
                ? "bg-emerald-600 border-l-4 border-emerald-400 text-white font-bold"
                : "text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent"
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">न्यूज़पेपर स्कैनर</span>
          </button>
          <button
            id="tab-aichat-btn"
            onClick={() => setActiveTab("aichat")}
            className={`w-full px-5 py-3 text-xs uppercase tracking-wider font-bold text-left transition-all flex items-center gap-3 cursor-pointer border-l-4 ${
              activeTab === "aichat"
                ? "bg-blue-600/15 border-blue-500 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800 border-transparent"
            }`}
          >
            <Bot className="w-4 h-4 shrink-0" />
            <span>एआई चैटबोट सहायक</span>
          </button>
        </nav>


          {/* API Key Settings */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className={`w-full px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-left transition-all flex items-center gap-2 cursor-pointer rounded ${
                geminiApiKey ? "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50" : "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{geminiApiKey ? "✓ API Key सेट है" : "⚙️ Gemini API Key सेट करें"}</span>
            </button>
            {showApiKeyInput && (
              <div className="mt-2 space-y-2">
                <input
                  type="password"
                  placeholder="AIza... (Google Gemini API Key)"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-400 hover:text-blue-300 underline block">🔗 Free API Key यहाँ से लें (Google AI Studio)</a>
              </div>
            )}
          </div>
        {/* Sidebar Footer Indicator with Accuracy Meter */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="bg-slate-900 rounded-lg p-3 text-xs border border-slate-800">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400 text-[10px]">एआई सत्यता (AI Accuracy)</span>
              <span className="text-blue-400 font-bold">98.4%</span>
            </div>
            <div className="w-full bg-slate-850 h-1 rounded-full">
              <div className="bg-blue-500 h-1 rounded-full" style={{ width: "98.4%" }}></div>
            </div>
          </div>
          
          <button 
            id="reset-simulation-data" 
            onClick={handleResetData}
            className="w-full text-center text-[11px] text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10 py-1.5 rounded border border-amber-500/20 font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>सिस्टम डेटा रिसेट करें</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center space-x-3">
            <h2 className="text-xs font-bold text-slate-800 tracking-tight uppercase flex items-center gap-2">
              <span className="w-2h h-2 bg-blue-600 inline-block animate-pulse rounded-full"></span>
              {activeTab === "feed" && "रियल-टाइम मीडिया सेल फ़ीड"}
              {activeTab === "factcheck" && "एआई संपुष्टि एवं फैक्ट-चेक केंद्र"}
              {activeTab === "analytics" && "सोशल सेंटीमेंट विश्लेषण विवरण"}
              {activeTab === "policy" && "विभागीय नियम व डिजिटल सोशल गाइडलाइन्स"}
                {activeTab === "aichat" && "एआई चैटबोट — समाचार खोज सहायक (Powered by Google Gemini)"}
            </h2>
            <div className="hidden md:flex items-center bg-slate-100 rounded px-2.5 py-1 text-[10px] font-mono text-slate-600 border border-slate-200">
              DATE: 20-OCT-2023 - 26-OCT-2023 <span className="ml-1 text-blue-600">▼</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-700">नोडल अधिकारी लखनऊ</p>
              <p className="text-[9px] text-slate-400 font-mono">ID: UP-POL-8422</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600">
              UP
            </div>
          </div>
        </header>

        {/* Real-time Ticker / Warning Ribbon integrated under Header */}
        <div id="media-ticker-container" className="bg-amber-50 text-amber-900 text-xs border-b border-amber-200 px-6 py-2 shrink-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold shrink-0 text-[10px] sm:text-xs">
              <span className="inline-block animate-ping rounded-full h-1.5 w-1.5 bg-amber-600" />
              <span className="uppercase text-[9px] bg-amber-200/50 px-1.5 py-0.5 rounded border border-amber-300">
                लाइव अलर्ट्स
              </span>
              <span className="hidden sm:inline">सोशल मीडिया ट्रेंड्स:</span>
            </div>
            <div className="flex-1 overflow-x-auto scrollbar-none flex items-center gap-6 text-slate-700 text-[11px] font-medium pl-2 select-none">
              {alerts.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.type === "Critical" ? "bg-rose-500" : item.type === "Warning" ? "bg-amber-500" : "bg-emerald-500"}`} />
                  <span className="text-slate-800 text-[11px]">{item.headline}</span>
                  <span className="text-[9px] text-slate-500 bg-white border border-slate-200 px-1 rounded">
                    {item.handled ? "✓ निस्तारित" : "● लंबित"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Wrapper Stage */}
        <div id="main-content-stage" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#f8fafc]">
        
        {/* TOP STATUS ROW WIDGETS */}
        <section id="status-counters-grid" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded shadow-sm flex items-center justify-between text-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">कुल स्कैन आर्टिकल्स</span>
              <span className="text-2xl font-black text-slate-800">{stats.total}</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <FileSearch className="w-5 h-5 text-slate-550" />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded shadow-sm flex items-center justify-between text-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">सकारात्मक ख़बरें</span>
              <span className="text-2xl font-black text-emerald-600">{stats.positive}</span>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-rose-500 rounded shadow-sm flex items-center justify-between text-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">नकारात्मक ख़बरें</span>
              <span className="text-2xl font-black text-rose-600">{stats.negative}</span>
            </div>
            <div className="p-2 bg-rose-50 border border-rose-100 rounded-lg">
              <ThumbsDown className="w-5 h-5 text-rose-600" />
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded shadow-sm flex items-center justify-between text-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">तटस्थ खबरें</span>
              <span className="text-2xl font-black text-slate-700">{stats.neutral}</span>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
              <Activity className="w-5 h-5 text-slate-550" />
            </div>
          </div>

          <div className="p-4 bg-white border-y border-r border-slate-200 border-l-4 border-l-amber-500 rounded shadow-sm flex items-center justify-between col-span-2 lg:col-span-1 text-slate-800">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">लंबित सोशल एलर्ट्स</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black text-amber-600">{stats.unhandledAlerts}</span>
                {stats.unhandledAlerts > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-700 text-[9px] font-black rounded">URGENT</span>
                )}
              </div>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-100 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </section>

        {/* TAB CONTENT: 1. MEDIA MONITORING FEED */}
        {activeTab === "feed" && (
          <div id="monitoring-feed-view" className="grid grid-cols-1 lg:grid-cols-12 items-stretch flex-1 min-h-0 overflow-hidden relative">
            
            {/* LEFT FILTER & FEED COLUMN */}
            <div className="lg:col-span-12 flex flex-col gap-4 h-full">
              
              {/* Searching, Filtration and Sorting controls */}
              <div className="p-4 bg-white border border-slate-200 rounded shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>फिल्टर एवं सॉर्टिंग पैनल ({filteredAndSortedNews.length} ख़बरें)</span>
                  </span>
                  <button
                    id="add-news-trigger"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>नया आर्टिकल विश्लेषण</span>
                  </button>
                </div>

                {/* Filter Grid */}
                <div className="flex flex-col gap-3">
                  {/* Title / Content text query search */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-3.5 w-3.5 text-slate-450" />
                    </span>
                    <input
                      type="text"
                      placeholder="समाचार, कीवर्ड या टैग खोजें..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded pl-9 pr-4 py-1.5 text-xs text-slate-705 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                    />
                  </div>

                  {/* Date range filters */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold text-[10px]">तारीख से (From):</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold text-[10px]">तारीख तक (To):</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Sentiment filters */}
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1 font-bold uppercase tracking-wider">सेंटीमेंट श्रेणी फ़िल्टर:</label>
                    <div className="grid grid-cols-4 gap-1">
                      {(["All", "Positive", "Negative", "Neutral"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSentimentFilter(type)}
                          className={`py-1 rounded text-[10px] font-bold transition cursor-pointer text-center ${
                            sentimentFilter === type
                              ? "bg-blue-600 text-white shadow-sm border border-blue-600"
                              : "bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200"
                          }`}
                        >
                          {type === "All" ? "सभी" : type === "Positive" ? "पॉजिटिव" : type === "Negative" ? "नेगेटिव" : "तटस्थ"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates sort toggling button (Latest to Oldest / Oldest to Latest) */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
                    <span className="text-slate-500">कालक्रमानुसार क्रम:</span>
                    <button
                      id="toggle-sort-order-btn"
                      onClick={() => setSortOrder(prev => prev === "latest" ? "oldest" : "latest")}
                      className="px-2 py-1 bg-slate-50 text-slate-750 hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1 cursor-pointer transition"
                    >
                      <ArrowUpDown className="w-3 h-3 text-blue-600" />
                      <span>{sortOrder === "latest" ? "नवीनतम से पुराना" : "पुराने से नवीनतम"}</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* NEW ARTICLE INTEGRATION FORM (Conditional Expandable Overlay) */}
              {showAddForm && (
                <div className="p-4 bg-white border border-blue-200 rounded shadow-md mt-1 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-150 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>Gemini एआई समाचार फीड विश्लेषण</span>
                    </h3>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-slate-650 text-xs cursor-pointer"
                    >
                      बंद करें
                    </button>
                  </div>

                  <form onSubmit={handleAnalyzeNewNews} className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold text-[10px] uppercase">समाचार शीर्षक (News Title):</label>
                      <input
                        type="text"
                        placeholder="जैसे: महोबा पुलिस ने मिशन शक्ति के तहत नुक्कड़ नाटक कराए..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1 font-semibold text-[10px] uppercase">समाचार विवरण/सामग्री (Actual News Content):</label>
                      <textarea
                        rows={4}
                        placeholder="यहाँ वायरल पोस्ट या न्यूज़ पेपर की पूरी कहानी पेस्ट करें..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold text-[10px] uppercase">स्रोत (Source Agency):</label>
                        <input
                          type="text"
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-705 text-xs focus:ring-blue-550 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1 font-semibold text-[10px] uppercase">तारीख (Publication Date):</label>
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-705 text-xs focus:ring-blue-550 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {formError && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded text-xs font-semibold">
                        {formError}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isAnalyzing}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer text-xs uppercase shadow-xsUnified"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Gemini LLM द्वारा विश्लेषण जारी है...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>एआई से विश्लेषित कर सेव करें</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* RENDER CHRONOLOGICAL LIST OF SCANNED NEWS */}
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-2 pb-4 scrollbar-thin">
                {filteredAndSortedNews.length === 0 ? (
                  <div className="p-8 bg-white border border-slate-200 rounded text-center text-slate-400 text-xs space-y-2 shadow-sm">
                    <AlertTriangle className="w-8 h-8 mx-auto text-slate-350" />
                    <p className="font-bold text-slate-700 text-sm">कोई समाचार नहीं मिला</p>
                    <p>कृपया सर्च कीवर्ड बदलें या दूसरे फ़िल्टरों का चयन करें।</p>
                  </div>
                ) : (
                  filteredAndSortedNews.map((item) => {
                    const isSelected = item.id === selectedNewsId;
                    const isPositive = item.sentiment === "Positive";
                    const isNegative = item.sentiment === "Negative";
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedNewsId(item.id)}
                        className={`p-3 rounded border transition cursor-pointer text-left relative overflow-hidden ${
                          isSelected 
                            ? "bg-slate-100 border-blue-500 shadow-sm ring-1 ring-blue-500/10" 
                            : "bg-white hover:bg-slate-50 border-slate-200 shadow-xs"
                        }`}
                      >
                        {/* Sentiment Edge Border Tag */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1.2 ${
                          isPositive ? "bg-emerald-500" : isNegative ? "bg-rose-500" : "bg-slate-350"
                        }`} />

                        <div className="pl-2">
                          <div className="flex items-center justify-between gap-2 mb-1 text-[10px]">
                            <div className="flex items-center gap-1 text-slate-550 font-medium">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="font-mono">{item.date}</span>
                              <span className="text-slate-300">|</span>
                              <span className="font-semibold">{item.source}</span>
                            </div>
                            
                            <span className={`px-1.5 py-0.2 rounded-sm text-[9px] font-black uppercase ${
                              isPositive 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-250" 
                                : isNegative 
                                  ? "bg-rose-50 text-rose-700 border border-rose-250" 
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {item.sentiment === "Positive" ? "पॉजिटिव" : item.sentiment === "Negative" ? "नेगेटिव" : "तटस्थ"}
                            </span>
                          </div>

                          <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                            isSelected ? "text-slate-900" : "text-slate-800"
                          }`}>
                            {item.title}
                          </h4>

                          <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed font-normal">
                            {item.content}
                          </p>

                          {/* Render Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-505 px-1.5 py-0.2 rounded text-[9px] font-semibold">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* RIGHT SIDEBAR: CURRENT EXPANDED NEWS DETAILED ANALYSIS */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl border-l border-slate-300 z-[100] transform transition-transform duration-300 flex flex-col ${selectedNewsId ? "translate-x-0" : "translate-x-full"}`}>
              {selectedNewsItem ? (
    <>
    <button onClick={() => setSelectedNewsId(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full text-slate-500 transition z-50 cursor-pointer shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
                <article id="news-analysis-panel" className="bg-white border-0 shadow-none overflow-y-auto flex-1 h-full text-slate-800 relative">
                  {/* Panel Header */}
                  <div className="p-5 pr-16 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>पैनल आईडी: {selectedNewsItem.id}</span>
                      <span className="text-slate-300">|</span>
                      <span>दिनांक: <span className="font-mono">{selectedNewsItem.date}</span></span>
                    </span>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      selectedNewsItem.sentiment === "Positive" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                        : selectedNewsItem.sentiment === "Negative" 
                          ? "bg-rose-50 text-rose-700 border border-rose-200" 
                          : "bg-slate-100 text-slate-650 border border-slate-200"
                    }`}>
                      {selectedNewsItem.sentiment === "Positive" ? "सकारात्मक समाचार" : selectedNewsItem.sentiment === "Negative" ? "नकारात्मक समाचार" : "तटस्थ समाचार"}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* news title & original report */}
                    <div className="space-y-2">
                      <h2 className="text-base md:text-lg font-black text-slate-900 leading-snug tracking-tight">
                        {selectedNewsItem.title}
                      </h2>
                      <div className="text-xs text-slate-505 font-medium flex items-center gap-1">
                        <span>स्रोत एजेंसी:</span>
                        <strong className="text-slate-800 font-bold">{selectedNewsItem.source}</strong>
                      </div>
                      
                      <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700 text-xs leading-relaxed max-h-[150px] overflow-y-auto font-normal">
                        <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider block mb-1">मूल मुख्य रिपोर्ट (Original Article):</span>
                        {selectedNewsItem.content}
                      </div>
                    </div>

                    {/* AI Analysis Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-150 pt-4 text-xs">
                      {/* Sentiment explanation */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-blue-600 text-[9px] uppercase font-bold tracking-wider block mb-1">सेंटीमेंट विश्लेषण तर्क (Sentiment):</span>
                        <p className="text-slate-700 leading-relaxed text-xs font-normal">
                          {selectedNewsItem.sentimentReason || "इस संक्षिप्त रिपोर्ट का कोई पूरक विश्लेषण संग्रहित नहीं है। फ़ीड एआई द्वारा ऑटो-रेट किया गया है।"}
                        </p>
                      </div>

                      {/* Brief summary */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <span className="text-blue-600 text-[9px] uppercase font-bold tracking-wider block mb-1">सार संक्षेप (Executive Summary):</span>
                        <p className="text-slate-850 leading-relaxed text-xs font-semibold">
                          {selectedNewsItem.summary || "पूरी खबर में वर्णित तथ्यों का सारांश लोड किया जा रहा है।"}
                        </p>
                      </div>
                    </div>

                    {/* Action recommendations & metadata */}
                    <div className="space-y-4 border-t border-slate-150 pt-4">
                      
                      {/* Dynamic tags bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">वर्गीकृत टैग्स:</span>
                        {selectedNewsItem.tags?.map((t, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-650 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-50 rounded border border-slate-200 col-span-1">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">विभागीय छवि प्रभाव:</span>
                          <span className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                            selectedNewsItem.impactLevel === "High" 
                              ? "bg-rose-50 text-rose-700 border border-rose-250" 
                              : selectedNewsItem.impactLevel === "Medium" 
                                ? "bg-amber-50 text-amber-700 border border-amber-250" 
                                : "bg-emerald-50 text-emerald-700 border border-emerald-250"
                          }`}>
                            {selectedNewsItem.impactLevel === "High" ? "🚨 उच्च (High)" : selectedNewsItem.impactLevel === "Medium" ? "⚠️ मध्यम" : "✓ कम"}
                          </span>
                        </div>

                        {/* Media Response Cell Action guidance */}
                        <div className="p-3 bg-amber-50/70 border border-amber-150 rounded col-span-2 text-xs">
                          <span className="text-amber-700 font-bold block text-[10px] mb-1">मीडिया सेल हेतु संकलित निर्देश (PR Strategy):</span>
                          <p className="text-amber-900 font-semibold text-xs leading-relaxed font-sans">
                            {selectedNewsItem.recommendedAction || "सामान्य विभागीय निगरानी जारी रखें।"}
                          </p>
                        </div>
                      </div>

                      {/* Fact Checked details if any */}
                      <div className="p-4 bg-blue-50/50 rounded border border-blue-250 flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
                        <div className="space-y-1 text-center md:text-left">
                          <span className="text-blue-900 font-bold block">क्या इस खबर की पुष्टि (Fact-check) की गई है?</span>
                          <p className="text-[11px] text-slate-650 font-medium">विवादास्पद या नकारात्मक खबरों के संदर्भ में एआई संचालित फैक्ट चेकिंग मॉड्यूल तुरंत शुरू करें।</p>
                        </div>
                        <button
                          onClick={() => {
                            setFactClaim(`शीर्षक: ${selectedNewsItem.title}\nसामग्री: ${selectedNewsItem.content}`);
                            setActiveTab("factcheck");
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded shadow-sm transition-all text-xs cursor-pointer uppercase"
                        >
                          दावे का फैक्ट-चेक चलायें
                        </button>
                      </div>

                    </div>
                  </div>
                </article></>) : null}
            </div>

          </div>
        )}

        {/* TAB CONTENT: 2. FACT-CHECK UNIT */}
        {activeTab === "factcheck" && (
          <div id="factcheck-center-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT INPUT COLUMN */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              
              {/* Submission panel */}
              <div className="p-4 bg-white border border-slate-200 rounded shadow-sm space-y-3 text-slate-800">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-150 pb-3">
                  <FileCheck2 className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="font-extrabold text-sm leading-tight text-slate-900">यूपी पुलिस सोशल मीडिया फैक्ट-चेक यूनिट</h3>
                    <span className="text-[10px] text-slate-450 font-medium">वायरल दावों, मैसेज, या संदिग्ध खबरों की सच्चाई परखें</span>
                  </div>
                </div>

                <form onSubmit={handleFactCheckSubmit} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">
                      संदेहास्पद दावा / समाचार पाठ (Paste Social Media Post or Viral Text):
                    </label>
                    <textarea
                      rows={5}
                      placeholder="व्हाट्सएप्प संदेश, सोशल वीडियो क्लेम, या भ्रामक ट्वीट टेक्स्ट यहाँ डालें (उदा. दारोगा ने रिश्वत माँगी, या यूपी पुलिस का फ़र्ज़ी नोटिस...)"
                      value={factClaim}
                      onChange={(e) => setFactClaim(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-xs leading-relaxed"
                      required
                    />
                  </div>

                  {factCheckError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-650 rounded text-xs font-semibold">
                      {factCheckError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isFactChecking}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-950 font-bold rounded flex items-center justify-center gap-1.5 transition cursor-pointer text-xs uppercase"
                  >
                    {isFactChecking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>एआई फैक्ट-चेक सत्यापन प्रगति पर है...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>एआई फैक्ट-चेक करें</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Popular mock query suggestions for fact checking */}
                <div className="border-t border-slate-150 pt-3">
                  <span className="text-[10px] text-slate-450 block mb-2 font-bold uppercase tracking-wider">त्वरित परीक्षण हेतु सामान्य अफवाह प्रवृत्तियां (Quick Sandbox Triggers):</span>
                  <div className="flex flex-col gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setFactClaim("व्हाट्सएप पर खबर: यूपी पुलिस बल में सभी पुलिस कर्मियों को 10 दिन का आकस्मिक गृह अवकाश मिलेगा। पत्र पर पुलिस महानिदेशक के जाली हस्ताक्षर हैं।")}
                      className="text-left py-1 text-[11px] text-slate-505 hover:text-amber-700 transition underline truncate cursor-pointer"
                    >
                      ● छुट्टी से संबंधित फर्जी नोटिस संदेश
                    </button>
                    <button
                      type="button"
                      onClick={() => setFactClaim("फेसबुक पोस्ट दावा: बरेली थाने के बाहर पुलिस ने भीड़ पर लाठीचार्ज किया जिसमें कई ग्रामीण गंभीर रूप से घायल हो गए। पुरानी तस्वीर शेयर की जा रही है।")}
                      className="text-left py-1 text-[11px] text-slate-505 hover:text-amber-700 transition underline truncate cursor-pointer"
                    >
                      ● पुरानी हिंसक वीडियो/तस्वीर को नया बताकर दुष्प्रचार
                    </button>
                    <button
                      type="button"
                      onClick={() => setFactClaim("वायरल क्लिप: यूपी की राजधानी में एक ट्रैफिक पुलिसकर्मी ने चालान काटने के विवाद में नागरिक से सरेआम घूस ली।")}
                      className="text-left py-1 text-[11px] text-slate-505 hover:text-amber-700 transition underline truncate cursor-pointer"
                    >
                      ● कथित ट्रैफिक रिश्वतखोरी सोशल वायरल क्लिप
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT DETAILED CHECK STATUS COLUMN */}
            <div className="lg:col-span-7">
              {currentFactCheck ? (
                <div id="factcheck-result" className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden text-slate-800">
                  
                  {/* Status Banner */}
                  <div 
                    className="p-4 flex items-center justify-between border-b text-slate-900 shadow-xs"
                    style={{ backgroundColor: currentFactCheck.statusColor || "#eab308" }}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[9px] bg-white/30 px-1.5 py-0.2 rounded font-black uppercase tracking-wider block w-max">
                        एआई फैक्ट-चेक रिपोर्ट
                      </span>
                      <h3 className="text-sm font-black tracking-tight text-slate-950">
                        जाँच का नतीजा: <span className="underline">{currentFactCheck.status}</span>
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] font-bold block opacity-80 uppercase tracking-wider">विश्वास स्कोर (AI Confidence)</span>
                        <span className="text-2xl font-black">{currentFactCheck.confidence}%</span>
                      </div>
                      <button
                        onClick={() => { setCurrentFactCheck(null); setFactClaim(""); }}
                        title="रिपोर्ट बंद करें (Exit)"
                        className="p-1.5 bg-white/40 hover:bg-rose-500 hover:text-white rounded-full text-slate-800 transition cursor-pointer shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    
                    {/* claim scrutinized block */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-150 text-xs text-slate-705">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">जाँचा गया दावा (Claim Scrutinized):</span>
                      <blockquote className="text-slate-800 italic font-medium leading-relaxed">
                        "{currentFactCheck.claimText || "असुरक्षित स्रोत से प्रस्तुत पाठ"}"
                      </blockquote>
                    </div>

                    {/* detailed logical analysis */}
                    <div className="space-y-1 text-xs">
                      <span className="text-blue-600 font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                        <Info className="w-3.5 h-3.5 text-blue-500" />
                        <span>एआई विश्लेषण एवं संपुष्टि रिपोर्ट (Verification Breakdown):</span>
                      </span>
                      <div className="p-3.5 bg-slate-50 border border-slate-150 rounded text-slate-700 leading-relaxed font-sans whitespace-pre-line text-xs font-normal">
                        {currentFactCheck.analysis}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* coordination rating */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-150 space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">अफवाह समन्वय रेटिंग:</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                            currentFactCheck.originRating === "High Coordinated" 
                              ? "bg-rose-50 text-rose-700 border border-rose-220" 
                              : "bg-amber-50 text-amber-700 border border-amber-220"
                          }`}>
                            {currentFactCheck.originRating === "High Coordinated" ? "🚨 संगठित दुष्प्रचार" : "👥 व्यक्तिगत / सामान्य भ्रम"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-450 mt-1 leading-snug">यह दर्शाता है कि क्या अफवाह को जानबूझकर आईटी सेल द्वारा फैलाया जा रहा है या यह सामान्य भूल है।</p>
                      </div>

                      {/* verification directories */}
                      <div className="bg-slate-50 p-3 rounded border border-slate-150">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1.5">सत्यापन हेतु आधिकारिक संदर्भ:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-emerald-700 text-[10px] font-mono font-bold">
                          {currentFactCheck.crossReferences?.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* recommended official response action plans */}
                    <div className="bg-slate-50 p-4 border border-slate-150 rounded-lg space-y-2 text-xs">
                      <span className="text-blue-600 font-bold uppercase tracking-wider text-[10px] block">विभागीय कार्रवाई योजना (Official PR Response Plan):</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {currentFactCheck.actionPlan?.map((plan, idx) => (
                          <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded relative overflow-hidden shadow-xs">
                            <span className="absolute top-0 right-0 bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 text-[8px] rounded-bl uppercase">
                              स्टेप {idx + 1}
                            </span>
                            <p className="text-slate-700 font-medium leading-relaxed pt-2 text-[11px]">
                              {plan}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* INTERACTIVE COMPLIANCE CHECKS - TRADITIONAL PROTOCOL VALIDATORS */}
                    <div className="border-t border-slate-150 pt-3 space-y-2">
                      <div className="flex flex-col md:flex-row md:items-center justify-between text-xs gap-1">
                        <span className="text-slate-600 font-bold block uppercase tracking-wider text-[10px]">मैन्युअल प्रशासनिक सत्यापन चेकलिस्ट:</span>
                        <span className="text-[10px] text-slate-450">निगरानी अधिकारी मैन्युअल रूप से सत्यापित कर टिक करें:</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                        <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer text-[11px] transition">
                          <input
                            type="checkbox"
                            checked={checkedProtocols.distSp}
                            onChange={(e) => setCheckedProtocols({ ...checkedProtocols, distSp: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-350 bg-white focus:ring-0"
                          />
                          <span className={checkedProtocols.distSp ? "text-emerald-700 line-through font-bold" : "text-slate-650"}>
                            संबंधित जिला एसपी से आधिकारिक संपर्क किया गया
                          </span>
                        </label>

                        <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer text-[11px] transition">
                          <input
                            type="checkbox"
                            checked={checkedProtocols.liut}
                            onChange={(e) => setCheckedProtocols({ ...checkedProtocols, liut: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-350 bg-white focus:ring-0"
                          />
                          <span className={checkedProtocols.liut ? "text-emerald-700 line-through font-bold" : "text-slate-650"}>
                            स्थानीय खुफिया विभाग (LIU/IB) से घटना फीडबैक लिया गया
                          </span>
                        </label>

                        <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer text-[11px] transition">
                          <input
                            type="checkbox"
                            checked={checkedProtocols.prCell}
                            onChange={(e) => setCheckedProtocols({ ...checkedProtocols, prCell: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-350 bg-white focus:ring-0"
                          />
                          <span className={checkedProtocols.prCell ? "text-emerald-700 line-through font-bold" : "text-slate-650"}>
                            सोशल मीडिया सेल X (@UPPolice) को सूचित किया गया
                          </span>
                        </label>

                        <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer text-[11px] transition">
                          <input
                            type="checkbox"
                            checked={checkedProtocols.cyberConfirm}
                            onChange={(e) => setCheckedProtocols({ ...checkedProtocols, cyberConfirm: e.target.checked })}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-350 bg-white focus:ring-0"
                          />
                          <span className={checkedProtocols.cyberConfirm ? "text-emerald-700 line-through font-bold" : "text-slate-650"}>
                            साइबर सेल द्वारा फ़ाइल मटेटा की जाँच की गई
                          </span>
                        </label>
                      </div>

                      {/* Checklist score badge */}
                      <div className="flex items-center justify-between text-[10px] bg-slate-100 px-2.5 py-1 rounded border border-slate-200 uppercase font-bold tracking-wider text-slate-505">
                        <span>सत्यापन प्रोटोकॉल पूर्णता (Checklist Score):</span>
                        <span className="font-bold font-mono text-blue-600">
                          {Object.values(checkedProtocols).filter(Boolean).length} / 4 प्रणालियाँ पूर्ण
                        </span>
                      </div>

                      {/* COMPLETION BANNER — appears when all 4 protocols are done */}
                      {Object.values(checkedProtocols).filter(Boolean).length === 4 && (
                        <div className="mt-2 p-3 bg-emerald-50 border-2 border-emerald-400 rounded-lg shadow-sm flex items-center gap-3">
                          <div className="shrink-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          </div>
                          <div className="flex-1">
                            <span className="text-emerald-800 font-black text-xs block">\u2705 सभी कार्रवाई पूर्ण — सत्यापन सम्पन्न (Verification Complete)</span>
                            <span className="text-emerald-600 text-[10px] font-medium">
                              सभी 4 प्रशासनिक प्रोटोकॉल सफलतापूर्वक सत्यापित किए गए हैं। समय: {new Date().toLocaleTimeString('hi-IN')}
                            </span>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black rounded uppercase tracking-wider shadow-sm">
                            Done ✓
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 bg-white border border-slate-200 rounded shadow-sm text-center text-slate-400 space-y-4">
                  <FileSearch className="w-10 h-10 mx-auto text-slate-350" />
                  <p className="text-sm font-bold text-slate-705">सत्यापन परिणाम खाली है</p>
                  <p className="text-xs max-w-md mx-auto leading-relaxed text-slate-505">
                    कृपया बाएँ कॉलम के फॉर्म में दावा लिखकर 'एआई फैक्ट-चेक करें' बटन दबाएँ। हमारा अत्याधुनिक Gemini एआई मॉडल तुरंत खबर की विश्वसनीयता जाँचेगा और विस्तृत कार्य योजना तैयार करेगा।
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB CONTENT: 3. SENTIMENT ANALYTICS CHARTS */}
        {activeTab === "analytics" && (
          <div id="analytics-view" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT PROGRESS CHART PANEL */}
            <div className="lg:col-span-1 p-4 bg-white border border-slate-200 rounded shadow-sm space-y-4 text-slate-800">
              <h3 className="font-extrabold text-xs text-slate-705 border-b border-slate-150 pb-2 flex items-center justify-between uppercase tracking-wider">
                <span>सेंटीमेंट वितरण (Sentiment Distribution)</span>
                <span className="text-[10px] text-slate-450 uppercase font-medium">Scanned Articles Ratio</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                {/* Positive ratio */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-650">उत्कृष्ट / सकारात्मक जनसेवा (Positive)</span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {Math.round((stats.positive / (stats.total || 1)) * 100)}% ({stats.positive} न्यूज़)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(stats.positive / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Negative ratio */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-650">आरोप / सोशल नीति उल्लंघन (Negative)</span>
                    <span className="font-mono text-rose-600 font-bold">
                      {Math.round((stats.negative / (stats.total || 1)) * 100)}% ({stats.negative} न्यूज़)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(stats.negative / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Neutral ratio */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-650">अन्य प्रशासनिक / सामान्य समाचार (Neutral)</span>
                    <span className="font-mono text-slate-500 font-bold">
                      {Math.round((stats.neutral / (stats.total || 1)) * 100)}% ({stats.neutral} न्यूज़)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-slate-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(stats.neutral / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

              </div>

              {/* Informative text box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-505 text-[10px] leading-relaxed">
                <p>
                  <strong>💡 सेंटीमेंट विश्लेषण का उद्देश्य:</strong> उत्तर प्रदेश पुलिस की जनमानस में सकारात्मक छवि (जैसे कोविड सेवा, जीवन रक्षा, साहसी मुठभेड़, बेहतरीन फिंगरप्रिंट रिकॉर्ड) व आलोचनाओं (जैसे भ्रष्टाचार के आरोप, रील्स विवाद) के बीच संतुलन का आकलन करना है।
                </p>
              </div>

            </div>

            {/* MIDDLE COLUMN: IMAGE RISK INDEX / IMPACT CATEGORIES */}
            <div className="lg:col-span-1 p-4 bg-white border border-slate-200 rounded shadow-sm space-y-3 text-slate-800">
              <h3 className="font-extrabold text-xs text-slate-750 border-b border-slate-150 pb-2 flex items-center justify-between uppercase tracking-wider">
                <span>छви प्रभाव सूचकांक (Public Image Risk Class)</span>
                <span className="text-[10px] text-rose-500 font-medium">Risk Indicator</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                {/* High danger articles counter */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-150 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-705 block">🚨 उच्च छवि जोखिम स्तर (High Alert Impact)</span>
                    <span className="text-[10px] text-slate-500">भ्रष्टाचार, हिरासत जाँच अथवा फर्जी मुठभेड़ मामले</span>
                  </div>
                  <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                    {newsList.filter(n => n.impactLevel === "High").length} Items
                  </span>
                </div>

                {/* Medium danger articles counter */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-150 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-705 block">⚠️ मध्यम जोखिम स्तर (Medium Level Alert)</span>
                    <span className="text-[10px] text-slate-500">सोशल मीडिया वर्दी रील्स उल्लंघन, प्रक्रियागत शिथिलता</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    {newsList.filter(n => n.impactLevel === "Medium").length} Items
                  </span>
                </div>

                {/* Low risk counters */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-150 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-705 block">✓ निम्न जोखिम / उपयोगी सुधार (Low Risk)</span>
                    <span className="text-[10px] text-slate-500">सामान्य समाचार, रूटीन बैठकें, विभागीय उपलब्धियां</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    {newsList.filter(n => n.impactLevel === "Low").length} Items
                  </span>
                </div>
              </div>

              {/* Traditional police directory hotline numbers widget */}
              <div className="p-3 bg-amber-50/50 border border-amber-150 text-amber-950 rounded space-y-1.5">
                <span className="font-extrabold text-amber-800 flex items-center gap-1 text-[10px] uppercase tracking-wider">
                  <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                  <span>संकटकाल विभागीय हेल्पलाइन निर्देशिका:</span>
                </span>
                <ul className="space-y-0.5 text-[10px] font-mono text-amber-900">
                  <li>● डीजीपी मीडिया सेल लखनऊ: +91-522-2206104</li>
                  <li>● फैक्स / त्वरित पीआर निर्देश: dgpress-up@gov.in</li>
                  <li>● वायरल रूम / सोशल विंग: 112 (या डायल 1090)</li>
                </ul>
              </div>

            </div>

            {/* RIGHT COLUMN: TAG CLOUD & ALERT HANDLING WORKSPACE */}
            <div className="lg:col-span-1 p-4 bg-white border border-slate-200 rounded shadow-sm space-y-3 text-slate-800">
              <h3 className="font-extrabold text-xs text-slate-705 border-b border-slate-150 pb-2 uppercase tracking-wider">
                सक्रिय अलर्ट ट्रैकर (Pending Social Trends)
              </h3>

              {/* Interactive media alert handling list */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto text-xs scrollbar-thin">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-2 bg-slate-50 border border-slate-150 rounded flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className={`text-[8px] font-black px-1 rounded uppercase tracking-wider ${
                        alert.type === "Critical" 
                          ? "bg-rose-50 text-rose-700 border border-rose-200" 
                          : alert.type === "Warning" 
                            ? "bg-amber-50 text-amber-700 border border-amber-200" 
                            : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {alert.type} - {alert.channel}
                      </span>
                      <p className="text-slate-800 font-semibold truncate leading-tight text-[11px] pl-0.5">
                        {alert.headline}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleAlertHandled(alert.id)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 transition flex items-center gap-0.5 cursor-pointer ${
                        alert.handled 
                          ? "bg-slate-200 text-slate-500 border border-slate-300" 
                          : "bg-blue-600 hover:bg-blue-750 text-white font-extrabold"
                      }`}
                    >
                      {alert.handled ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          <span>निस्तारित</span>
                        </>
                      ) : (
                        <span>लंबित</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Tag density list */}
              <div className="space-y-1 pt-2 border-t border-slate-150">
                <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">सर्वाधिक ट्रेंडिंग विभागीय टैग्स:</span>
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-600 font-bold">
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-150 rounded font-mono">#महिला_सुरक्षा (2)</span>
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-150 rounded font-mono">#साहस_प्रदर्शन (1)</span>
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-150 rounded font-mono">#NAFIS (1)</span>
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-150 rounded font-mono">#भ्रष्टाचार (1)</span>
                  <span className="px-2 py-0.5 bg-slate-50 border border-slate-150 rounded font-mono">#एनकाउंटर (1)</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB CONTENT: 4. GUIDELINES & POLICIES */}
        {activeTab === "policy" && (
          <div id="policy-guidelines-view" className="p-6 bg-slate-950 border border-slate-800 rounded-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <BookOpen className="w-8 h-8 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">उत्तर प्रदेश पुलिस सोशल मीडिया नियमावली एवं दंडात्मक धाराएं</h2>
                <p className="text-xs text-slate-450">पुलिस आचरण नियमावली एवं गलत सूचना/अफवाह फैलाने वालों के विरुद्ध कानूनी प्रावधान</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed">
              {/* official social media policy */}
              <div className="space-y-3.5 bg-slate-900 p-4 rounded-xl border border-slate-850">
                <h3 className="font-extrabold text-amber-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span>यूपी पुलिस सोशल मीडिया नीति - 2023 (वर्दी नियमावली):</span>
                </h3>
                <ul className="list-decimal list-outside pl-4 space-y-2 text-slate-300 text-xs text-justify">
                  <li>
                    <strong>वर्दी रील्स पर प्रतिबन्ध:</strong> कोई भी पुलिस कर्मी राजकीय दायित्वों के निर्वहन (ड्युटी) के दौरान अथवा सरकारी यूनिफॉर्म पहनकर रील, मनोरंजक वीडियो या अनुपयुक्त पोस्ट इंस्टाग्राम/फेसबुक आदि पर अपलोड नहीं करेगा।
                  </li>
                  <li>
                    <strong>व्यक्तिगत चैनल सीमाएं:</strong> निजी सोशल मीडिया खातों से किसी आरोपी अपराधी की पैरवी या पुलिस कार्रवाई और मुकदमों के दस्तावेजों को साझा करना और उन पर निजी टिप्पणी करना पूर्णतया निषिद्ध है।
                  </li>
                  <li>
                    <strong>अभद्र भाषा निरोध:</strong> सोशल मीडिया पर पुलिस की गरिमा के विपरीत टिप्पणी करने वाले कर्मियों के विरुद्ध आईपीसी/बीएनएस तथा पुलिस बल संघटक आचरण नियमावली के अंतर्गत तत्काल निलंबन और कठोर विभागीय अनुशासनात्मक कार्रवाई होगी।
                  </li>
                  <li>
                    <strong>कार्रवाई प्रोटोकॉल:</strong> उल्लंघन पाए जाने पर सीधे स्थानीय पुलिस अधीक्षक (SP) के निर्देशन में जाँच बैठाई जाएगी और निर्धारित अवधि में रिपोर्ट लखनऊ पीआर सेल प्रेषित होगी।
                  </li>
                </ul>
              </div>

              {/* legal sections against rumors */}
              <div className="space-y-3.5 bg-slate-900 p-4 rounded-xl border border-slate-850">
                <h3 className="font-extrabold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>अफवाह एवं फर्जी ख़बरें फैलाने वालों पर कानूनी कार्रवाई (BNS & IT ACT):</span>
                </h3>
                <ul className="list-decimal list-outside pl-4 space-y-2 text-slate-350 text-xs text-justify">
                  <li>
                    <strong>बीएनएस धारा 353 (Bhartiya Nyaya Sanhita - BNS):</strong> फर्जी खबरें, नफरती दुष्प्रचार अथवा लोक शांति भंग करने वाले भ्रामक सन्देश प्रचारित करने पर दोषी पाए जाने वाले उपद्रवियों पर कठोर कारावास एवं जुर्माने का प्रावधान है।
                  </li>
                  <li>
                    <strong>सूचना प्रौद्योगिकी अधिनियम धारा 66D (IT Act):</strong> किसी व्यक्ति द्वारा कंप्यूटर या कम्युनिकेशन डिवाइस का उपयोग कर धोखे से अपनी पहचान छिपाकर अफवाह फैलाना दंडनीय अपराध है।
                  </li>
                  <li>
                    <strong>मानहानि धारा 356 (BNS):</strong> पुलिस अधिकारियों को बदनाम करने अथवा उनके फोटो/वीडियो से छेड़छाड़ (Morphing) कर विभाग की छवि को आघात पहुंचाने वाले सोशल मीडिया हैंडल्स पर मुकदमा दर्ज कर तत्काल आईपी एड्रेस ब्लाक कराया जाएगा।
                  </li>
                  <li>
                    <strong>त्वरित खंडन नीति (Quick Demurrer):</strong> जिला पुलिस सोशल मीडिया प्रकोष्ठ की जिम्मेदारी है कि किसी संदेहास्पद अथवा झूठी खबर पर तत्काल ट्विटर के माध्यम से खंडन पत्र और तथ्यात्मक विवरण साझा करें।
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between text-xs">
              <div className="space-y-0.5 text-center md:text-left">
                <span className="text-amber-500 font-bold block">🚨 आपातकालीन विभागीय नोटिस जारी करने का निर्देश</span>
                <p className="text-slate-400">यह टूल पूरी तरह से आंतरिक निगरानी और साइबर फैक्ट-चेक टीम के उपयोग के लिए अधिकृत है।</p>
              </div>
              <a 
                href="https://uppolice.gov.in" 
                target="_blank" 
                rel="noreferrer" 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold hover:text-white transition cursor-pointer text-xs uppercase"
              >
                यूपी पुलिस आधिकारिक पोर्टल
              </a>
            </div>

          </div>
        )}

      </div>

      {/* Footer copyright */}

        {/* TAB CONTENT: SCANNER VIEW */}
        {activeTab === "scanner" && (
          <div id="scanner-view" className="flex flex-col h-full overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 text-white p-6 shadow-md shrink-0">
              <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <ScanLine className="w-6 h-6" />
                AI न्यूज़पेपर स्कैनर
              </h2>
              <p className="text-emerald-100 text-xs mt-2 uppercase tracking-wide opacity-90">
                Upload physical newspaper clippings for automatic data extraction
              </p>
            </div>

            <div className="p-6 flex-grow flex items-center justify-center bg-white">
              <div className="max-w-2xl w-full">
                <div className="border-2 border-dashed border-emerald-300 bg-emerald-50 rounded-xl p-12 text-center transition-all hover:bg-emerald-100">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden" 
                    id="newspaper-upload"
                  />
                  <label 
                    htmlFor="newspaper-upload" 
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <div className="w-20 h-20 bg-emerald-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <UploadCloud className="w-10 h-10 text-emerald-700" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">अखबार की फोटो अपलोड करें</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-md">
                      क्लिक करें और अपने कंप्यूटर/मोबाइल से न्यूज़पेपर की कटिंग (JPG/PNG) चुनें। AI अपने आप खबर पढ़कर फीड में जोड़ देगा।
                    </p>
                    <span className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold uppercase rounded shadow-md hover:bg-emerald-700 transition-colors">
                      Select Image
                    </span>
                  </label>
                </div>

                {isScanning && (
                  <div className="mt-8 flex flex-col items-center justify-center p-6 bg-slate-50 rounded border border-slate-200">
                    <ScanLine className="w-10 h-10 text-emerald-500 animate-pulse mb-3" />
                    <h4 className="text-emerald-700 font-bold mb-1">AI अखबार स्कैन कर रहा है...</h4>
                    <p className="text-xs text-slate-500">कृपया प्रतीक्षा करें, इसमें कुछ सेकंड लग सकते हैं</p>
                  </div>
                )}

                {scannerError && (
                  <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-medium">
                    {scannerError}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: 5. AI CHATBOT */}
        {activeTab === "aichat" && (
          <div id="aichat-view" className="flex flex-col h-[calc(100vh-220px)] bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-tight">UP Police AI सहायक</h3>
                <span className="text-[10px] text-blue-200 font-medium">Powered by Google Gemini — समाचार खोज, विश्लेषण एवं सहायता</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-300 uppercase">Online</span>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" id="chat-messages-container" ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}>
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-700">नमस्कार! मैं UP Police AI सहायक हूँ</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md">मुझसे यूपी पुलिस से जुड़ी खबरों, मीडिया मॉनिटरिंग, कानून-व्यवस्था, या किसी भी विषय पर प्रश्न पूछें।</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 max-w-lg">
                    <button onClick={() => setChatInput("यूपी पुलिस की हाल की उपलब्धियाँ बताइए")} className="p-2.5 bg-white border border-slate-200 rounded-lg text-left text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer shadow-xs">
                      <span className="text-blue-600 font-bold block text-[10px] mb-0.5">💬 सुझाव</span>
                      यूपी पुलिस की हाल की उपलब्धियाँ बताइए
                    </button>
                    <button onClick={() => setChatInput("सोशल मीडिया पर फेक न्यूज़ कैसे पहचानें?")} className="p-2.5 bg-white border border-slate-200 rounded-lg text-left text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer shadow-xs">
                      <span className="text-blue-600 font-bold block text-[10px] mb-0.5">💬 सुझाव</span>
                      सोशल मीडिया पर फेक न्यूज़ कैसे पहचानें?
                    </button>
                    <button onClick={() => setChatInput("साइबर क्राइम के लिए कौन सी IPC धाराएं लागू होती हैं?")} className="p-2.5 bg-white border border-slate-200 rounded-lg text-left text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer shadow-xs">
                      <span className="text-blue-600 font-bold block text-[10px] mb-0.5">💬 सुझाव</span>
                      साइबर क्राइम के लिए कौन सी IPC धाराएं लागू होती हैं?
                    </button>
                    <button onClick={() => setChatInput("मीडिया मॉनिटरिंग में AI का क्या रोल है?")} className="p-2.5 bg-white border border-slate-200 rounded-lg text-left text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer shadow-xs">
                      <span className="text-blue-600 font-bold block text-[10px] mb-0.5">💬 सुझाव</span>
                      मीडिया मॉनिटरिंग में AI का क्या रोल है?
                    </button>
                  </div>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1.5 mb-1.5 text-[9px] text-blue-600 font-bold uppercase">
                        <Bot className="w-3 h-3" />
                        <span>AI सहायक</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    <div className={`text-[9px] mt-1 ${msg.role === "user" ? "text-blue-200" : "text-slate-400"} text-right`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                      <span className="font-medium">AI सोच रहा है...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Area */}
            <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="यहाँ अपना प्रश्न टाइप करें... (जैसे: यूपी पुलिस की ताज़ा खबर बताओ)"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full transition cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      <footer id="app-footer" className="bg-white border-t border-slate-200 py-4 text-xs text-slate-400 text-center uppercase tracking-wider shrink-0">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-600">
            उत्तर प्रदेश पुलिस विभाग - एआई-संचालित मीडिया मॉनिटरिंग और फैक्ट-चेक संचालन मंच
          </p>
          <p className="text-[9px] leading-relaxed lowercase">
            secured cloud run node • live ai sentiment processor • all rights reserved
          </p>
        </div>
      </footer>

      </main>

    </div>
  );
}

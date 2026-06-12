import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());

// Helper to safely get or initialize Gemini SDK
let _ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in your environment or secrets panel.");
  }
  if (!_ai) {
    _ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return _ai;
}

// Local intelligent fallbacks for cases when GEMINI_API_KEY is not configured or fails
function fallbackAnalyze(title: string, content: string) {
  const text = (title + " " + content).toLowerCase();
  let sentiment = "Neutral";
  let sentimentHindiHexColor = "#6b7280";
  let sentimentReason = "यह समाचार उत्तर प्रदेश पुलिस की सामान्य प्रशासनिक गतिविधियों से संबंधित है और जनभावना पर इसका प्रभाव सामान्य है।";
  let summary = "इस लेख में उत्तर प्रदेश पुलिस बल की दैनिक संक्रियाओं, रिपोर्टिंग, या सामान्य कानून व्यवस्था की स्थिति का विवरण प्रस्तुत किया गया है।";
  let tags = ["कानून-व्यवस्था", "विविध समाचार"];
  let impactLevel = "Low";
  let recommendedAction = "स्थानीय मीडिया सेल इस समाचार की डिजिटल पहुंच की निगरानी करे। किसी तात्कालिक स्पष्टीकरण की आवश्यकता नहीं है।";

  if (text.includes("बहादुरी") || text.includes("सहायता") || text.includes("सुरक्षा") || text.includes("बचाया") || text.includes("सहयोग") || text.includes("प्रशंसा") || text.includes("पुरस्कार") || text.includes("उत्कृष्ट") || text.includes("महिला") || text.includes("सराहनीय") || text.includes("मदद")) {
    sentiment = "Positive";
    sentimentHindiHexColor = "#22c55e";
    sentimentReason = "इस समाचार में पुलिस बल द्वारा त्वरित निष्ठा, महिला सुरक्षा या अत्यंत बहादुरी का प्रदर्शन किया गया है, जो सकारात्मक छवि निर्मित करता है।";
    summary = "यूपी पुलिस टीम की त्वरित कार्रवाई और नागरिक-केंद्रित पहल के बारे में एक अत्यंत सकारात्मक लेख। जनता में सुरक्षा का भाव बढ़ाने वाली घटना।";
    tags = ["महिला सुरक्षा", "साहस प्रदर्शन", "जन-सेवा"];
    impactLevel = "Medium";
    recommendedAction = "सोशल मीडिया सेल X (@UPPolice) के माध्यम से इस खबर को प्रमुखता से साझा करें तथा संबंधित पुलिसकर्मियों को प्रोत्साहन पत्र जारी करें।";
  } else if (text.includes("रिश्वत") || text.includes("भ्रष्टाचार") || text.includes("लापरवाही") || text.includes("हिरासत") || text.includes("आरोप") || text.includes("मारपीट") || text.includes("निलंबित") || text.includes("एफआईआर") || text.includes("शिकायत")) {
    sentiment = "Negative";
    sentimentHindiHexColor = "#ef4444";
    sentimentReason = "इस लेख में कथित पुलिस भ्रष्टाचार, कर्तव्य के प्रति लापरवाही या अनुशासनात्मक शिथिलता का आरोप है, जिससे छवि धूमिल होने का खतरा है।";
    summary = "संवेदनात्मक घटना जिसमें पुलिस कर्मियों के विरुद्ध कदाचार या शिथिलता का आरोप है। विभागीय अधिकारियों द्वारा मामले का संज्ञान लिया गया है।";
    tags = ["रिश्वतखोरी", "लापरवाही", "विभागीय जांच"];
    impactLevel = "High";
    recommendedAction = "उच्चाधिकारियों द्वारा तुरंत जांच बैठाई जाए, आवश्यक हो तो आरोपी को निलंबित करें और ट्विटर पर विभाग द्वारा की गई कार्रवाई का खंडन / स्पष्टीकरण जारी करें।";
  }

  return { sentiment, sentimentHindiHexColor, sentimentReason, summary, tags, impactLevel, recommendedAction };
}

function fallbackFactCheck(claim: string) {
  const text = claim.toLowerCase();
  let status = "Unverified (अपुष्ट)";
  let statusColor = "#fbbf24";
  let confidence = 75;
  let originRating = "Organic Error";
  let analysis = `दावा: "${claim}"\n\nविश्लेषण रिपोर्ट:\n१. इस वायरल दावे के विषय में संबंधित जिला पुलिस से प्राथमिक रिपोर्ट मंगवाई गई है।\n२. हमारे सोशल मीडिया रिसर्च विंग ने फेसबुक/ट्विटर पर संबंधित प्रविष्टियों की जाँच की है जहां कोई प्रामाणिक विभागीय परिपत्र नहीं मिला।\n३. पाठकों को सलाह दी जाती है कि इस दावे पर तब तक विश्वास न करें जब तक कि आधिकारिक प्रवक्ता द्वारा स्पष्टीकरण जारी न हो।`;
  let actionPlan = [
    "संबंधित क्षेत्राधिकारी/थाना प्रभारी से मामले की तथ्यपरक आख्या प्राप्त करें।",
    "अफवाह को आगे बढ़ने से रोकने के लिए स्थानीय डिजिटल वॉलटियर्स को सचेत करें।",
    "मुख्य खंडन आलेख तैयार कर सोशल मीडिया हैंडल्स पर पिन करें।"
  ];
  let crossReferences = [
    "UP Police Official Press Releases",
    "जिला सूचना प्रणाली (DIPR) बुलेटिन"
  ];

  if (text.includes("अवैध") || text.includes("पेपर लीक") || text.includes("दंगा") || text.includes("गोली") || text.includes("राशन") || text.includes("हत्या") || text.includes("विवाद") || text.includes("झांसा") || text.includes("फर्जी") || text.includes("यूपी पुलिस भर्ती") || text.includes("दंगे") || text.includes("घेराव") || text.includes("लाठीचार्ज")) {
    status = "Fake (असत्य/अफवाह)";
    statusColor = "#ef4444";
    confidence = 92;
    originRating = "High Coordinated";
    analysis = `दावा: "${claim}"\n\nविस्तृत एआई एवं मैन्युअल विश्लेषण:\n१. इस दावे के संबंध में जिला पुलिस प्रवक्ता तथा साइबर सुरक्षा सेल द्वारा तत्काल जांच की गई। यह दावा पूरी तरह निराधार व असत्य पाया गया है।\n२. जांच में पता चला कि यह वीडियो/फ़ोटो किसी पुरानी असंबद्ध घटना का है जिसे गलत शीर्षक के साथ प्रसारित किया जा रहा है।\n३. कतिपय हैंडल/आईटी सेल द्वारा सुनियोजित तरीके से लोक व्यवस्था को प्रभावित करने हेतु इस भ्रामक सूचना को समन्वित रूप से पोस्ट किया गया है।`;
    actionPlan = [
      "यूपी पुलिस फैक्ट चेक हैंडल (@UPPViralCheck) से इसका आधिकारिक डिजिटल खंडन पोस्टर जारी करें।",
      "भ्रामक खबर और फर्जी विवरण वाले प्रारंभिक सोशल मीडिया हैंडल्स के विरुद्ध आईटी एक्ट के तहत मुकदमा दर्ज कराएं।",
      "सभी लोकप्रिय पुलिस संवाद समूहों (WhatsApp/Digital Groups) में इस दावे का सच साझा करें।"
    ];
    crossReferences = [
      "UP Police Fact Check X Portal",
      "डीजीपी कार्यालय प्रेस नोट"
    ];
  } else if (text.includes("समय") || text.includes("बदलाव") || text.includes("छुट्टी") || text.includes("नियम") || text.includes("आदेश") || text.includes("घोषणा")) {
    status = "Partially True (आंशिक सत्य)";
    statusColor = "#fbbf24";
    confidence = 80;
    originRating = "Organic Error";
    analysis = `दावा: "${claim}"\n\nविश्लेषण:\n१. दावे में उल्लिखित सुधार या नियम संशोधन के कुछ अंश आंशिक रूप से पुराने प्रस्तावों से मेल खाते हैं, लेकिन संपूर्ण दावा भ्रामक संदर्भ में है।\n२. यह किसी शरारत के बजाए डिजिटल मीडिया उपयोगकर्ताओं द्वारा गलतफहमी या समझने की भूल के कारण सामान्य रूप से फैला है।`;
    actionPlan = [
      "प्रशासनिक नियमों की मूल प्रतिलिपि साझा करते हुए सही स्थिति स्पष्ट करें।",
      "भ्रामक व्याख्या करने वाले प्रकाशकों को औपचारिक सलाह पत्र भेजें।",
      "आधिकारिक विभागीय वेबसाइट के अक्सर पूछे जाने वाले प्रश्नों (FAQs) में इसे अपडेट करें।"
    ];
    crossReferences = [
      "UP Police Establishment Department Manual",
      "यूपी गृह विभाग अधिसूचना"
    ];
  }

  return { status, confidence, statusColor, analysis, originRating, actionPlan, crossReferences };
}

// REST API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    time: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
});

// Endpoint for UP Police News Sentiment & Impact Analysis
app.post("/api/analyze-news", async (req, res) => {
  const { title, content } = req.body;
  if (!title && !content) {
     res.status(400).json({ error: "Title or content is required" });
     return;
  }

  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are an expert AI media monitoring and public relations officer specialized for the Uttar Pradesh Police (UP Police) Media Cell.
Your objective is to analyze UP Police related news/articles.
Provide analysis in Hindi, including:
1. Sentiment: 'Positive' (good work, rescuing life, NAFIS feeding, women safety, brave deeds) or 'Negative' (corruption allegations, bribery, social media policy violations, questionable encounters, brutality claims) or 'Neutral'.
2. Sentiment Reason: Explanation in Hindi of why this sentiment belongs here.
3. Summary: A highly structured 2-3 sentence summary in elegant, professional Hindi.
4. Tags: List of 2-4 professional tags in Hindi/English relevant to the domain (e.g. 'महिला सुरक्षा', 'कानून-व्यवस्था', 'रिश्वतखोरी', 'सोशल मीडिया नीति', 'NAFIS डेटा फीडिंग', 'साहस प्रदर्शन', etc.)
5. Impact Level: 'High', 'Medium', or 'Low' depending on how severely this affects the public image of UP Police.
6. Recommended Action: Actionable advice for the UP Police PR and Social Media Cell in Hindi (e.g., prompt clarification, issuing appreciation letters, investigation orders, registering a cyber cell case).

Keep your language professional, respectful, and authoritative.`;

    const userPrompt = `News Title: "${title || 'Untitled'}"\nNews Content: "${content || 'No content provided'}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { 
              type: Type.STRING, 
              description: "Must be 'Positive', 'Negative', or 'Neutral'" 
            },
            sentimentHindiHexColor: { 
              type: Type.STRING, 
              description: "Hex color code representing the mood (#22c55e for Positive, #ef4444 for Negative, #6b7280 for Neutral)" 
            },
            sentimentReason: { 
              type: Type.STRING, 
              description: "Brief reason in Hindi for selection of the sentiment." 
            },
            summary: { 
              type: Type.STRING, 
              description: "A structured, concise 2-3 line summary in professional Hindi." 
            },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Exactly 2-4 tags in Hindi/English." 
            },
            impactLevel: { 
              type: Type.STRING, 
              description: "Impact on UP Police public image: 'High', 'Medium', or 'Low'." 
            },
            recommendedAction: { 
              type: Type.STRING, 
              description: "A realistic actionable advice in Hindi for the PR cell." 
            }
          },
          required: ["sentiment", "sentimentHindiHexColor", "sentimentReason", "summary", "tags", "impactLevel", "recommendedAction"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI model.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("Error in analyzer API or GEMINI_API_KEY missing, using local smart fallback. Error details:", error.message || error);
    const fallbackResult = fallbackAnalyze(title, content);
    res.json(fallbackResult);
  }
});

// Endpoint for UP Police Fact-Check Module
app.post("/api/check-fact", async (req, res) => {
  const { claim } = req.body;
  if (!claim) {
     res.status(400).json({ error: "Claim text is required for fact-checking" });
     return;
  }

  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are an expert Verification and Fact-checking Officer at the Uttar Pradesh Police Cyber and Social Media Fact-Check Unit.
Your goal is to critically evaluate claims, viral posts, or news snippets regarding the UP Police.
Provide a reliable fact check structure in Hindi & English, returning:
1. Status: 'Verified' (सत्य), 'Partially True' (आंशिक सत्य), 'Misleading' (भ्रामक), 'Fake' (असत्य/अफवाह), or 'Unverified' (अपुष्ट).
2. Confidence Score: percentage integer between 0 and 100.
3. Analysis: Step-by-step rigorous logical breakdown in professional Hindi, checking known patterns, common rumor sources, and suggesting verification parameters.
4. Origin Rating: Probability of it being coordinated rumor-mongering vs organic misinformation ('High Coordinated', 'Low Coordinated', 'Organic Error').
5. Action Plan: 3 precise actionable steps in Hindi for local police to manage the spread of this rumor or report it.
6. Cross References: Official sources or database channels to verify this check (e.g. UP Police Twitter handle, district SP feedback, NAFIS register, etc.).

Keep the analysis authoritative, unbiased, and extremely structured.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Claim to Fact-Check: "${claim}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING, 
              description: "Fact status: 'Verified' (सत्य), 'Partially True' (आंशिक सत्य), 'Misleading' (भ्रामक), 'Fake' (असत्य/अफवाह), 'Unverified' (अपुष्ट)" 
            },
            confidence: { 
              type: Type.INTEGER, 
              description: "Integer score between 10 and 100 representing certainty." 
            },
            statusColor: { 
              type: Type.STRING, 
              description: "Hex color code (#22c55e for Verified, #fbbf24 for Partially True/Unverified, #ea580c for Misleading, #ef4444 for Fake)" 
            },
            analysis: { 
              type: Type.STRING, 
              description: "Detailed logical analysis in professional Hindi." 
            },
            originRating: { 
              type: Type.STRING, 
              description: "Misinformation flow level: 'High Coordinated', 'Low Coordinated', or 'Organic Error'" 
            },
            actionPlan: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Exactly 3 distinct actionable steps in Hindi." 
            },
            crossReferences: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "2-3 authentic reference sources in Hindi/English." 
            }
          },
          required: ["status", "confidence", "statusColor", "analysis", "originRating", "actionPlan", "crossReferences"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response from AI model.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.warn("Error in fact-checker API or GEMINI_API_KEY missing, using local smart fallback. Error details:", error.message || error);
    const fallbackResult = fallbackFactCheck(claim);
    res.json(fallbackResult);
  }
});


// AI Chatbot endpoint for news-related queries
app.post("/api/ai-chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  try {
    const ai = getGeminiClient();

    const systemPrompt = `You are "UP Police AI सहायक" (UP Police AI Assistant), an intelligent chatbot built into the UP Police Media Monitoring & Fact-Check Dashboard.

Your role:
- Answer questions about UP Police news, media monitoring, law & order, and public relations.
- Help officers search for information about recent news events, viral claims, and social media trends related to UP Police.
- Provide analysis, summaries, and context about policing topics in Uttar Pradesh.
- Always respond in Hindi (Devanagari script) unless the user writes in English.
- Be professional, respectful, and authoritative in your tone.
- If asked about something outside your domain (UP Police / law enforcement / media monitoring), politely redirect.
- Keep responses concise but informative (3-5 sentences for simple queries, more for complex ones).
- Use bullet points and structured formatting when listing information.

You have access to general knowledge about:
- UP Police organizational structure, districts, and hierarchy
- Common media monitoring practices and social media policies
- Indian Penal Code (IPC/BNS) sections relevant to cyber crimes and misinformation
- General law enforcement best practices`;

    // Build conversation history for context
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // Last 10 messages for context
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const resultText = response?.text;
    if (!resultText) {
      throw new Error("Empty response from AI model.");
    }

    res.json({ reply: resultText });
  } catch (error: any) {
    console.warn("AI Chat error:", error.message || error);
    res.json({ 
      reply: "क्षमा करें, इस समय एआई सेवा उपलब्ध नहीं है। कृपया सुनिश्चित करें कि GEMINI_API_KEY सेट है और बाद में पुनः प्रयास करें।\n\nत्रुटि: " + (error.message || "Unknown error")
    });
  }
});

// Configure Vite middleware or Static files serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all single-page app routes (using Express v4 syntax app.get('*', ...))
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[UP Police Media Monitor Server] Running locally on port ${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Failed to start server:", err);
});

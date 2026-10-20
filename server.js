const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Directories (with Vercel /tmp fallback support)
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const RECORDINGS_DIR = isVercel ? path.join('/tmp', 'recordings') : path.join(DATA_DIR, 'recordings');
const CALLS_FILE = path.join(DATA_DIR, 'calls.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Directory init note:', e.message);
}

// Multer storage for recorded call audio
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, RECORDINGS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.webm';
    const uniqueSuffix = 'call_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
    cb(null, uniqueSuffix);
  }
});
const upload = multer({ storage: storage });

// Serve static recordings with correct MIME types
app.use('/recordings', express.static(RECORDINGS_DIR));

// Helper to read JSON with fallback to packaged files
function readJson(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    const packagedPath = path.join(__dirname, 'data', path.basename(filePath));
    if (fs.existsSync(packagedPath)) {
      const data = fs.readFileSync(packagedPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultValue;
}

// Helper to write JSON with /tmp fallback
function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    try {
      const tmpPath = path.join('/tmp', path.basename(filePath));
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e2) {
      console.warn('writeJson in-memory fallback:', e2.message);
      return false;
    }
  }
}

// Seed default products if not present
const DEFAULT_PRODUCTS = [
  {
    id: 'nexusflow-ai',
    name: 'NexusFlow AI',
    tagline: 'Autonomous AI Voice & Customer Experience Platform',
    category: 'Customer Support & Sales AI',
    pricing: '$49/seat/mo (Starter) | $149/seat/mo (Pro Enterprise)',
    targetAudience: 'SaaS companies, BPOs, e-commerce, and high-velocity sales teams',
    keyFeatures: [
      'Zero-latency conversational voice engine in 50+ languages',
      'Real-time CRM sync with HubSpot, Salesforce & Zoho',
      'Smart objection handling & automatic calendar scheduling',
      'Instant post-call transcriptions, summaries & sales status classification'
    ],
    pitch: 'NexusFlow AI transforms your inbound and outbound customer support into hyper-personalized, 24/7 autonomous voice conversations that close deals and resolve 85% of tickets automatically.',
    faqs: [
      { q: 'Can it integrate with our existing telephony?', a: 'Yes, NexusFlow connects with Twilio, Plivo, Genesys, and modern SIP trunks in minutes.' },
      { q: 'Is there a free trial?', a: 'Yes! We offer a full 14-day free trial with 500 complimentary voice minutes.' }
    ]
  },
  {
    id: 'cloudguard-pro',
    name: 'CloudGuard Pro',
    tagline: 'Automated SOC-2, ISO27001 & Cloud Security Posture Platform',
    category: 'Cybersecurity & Compliance SaaS',
    pricing: '$299/mo (Standard) | $799/mo (Enterprise Unlimited)',
    targetAudience: 'Fast-growing startups, fintech, healthcare SaaS needing compliance fast',
    keyFeatures: [
      'Automated SOC-2 Type II audit readiness in under 14 days',
      'Continuous 24/7 AWS, GCP, Azure infrastructure scanning',
      'Automated vendor risk management & evidence collection',
      'Guaranteed compliance certification pass rate with auditor portal'
    ],
    pitch: 'CloudGuard Pro cuts SOC-2 and ISO27001 compliance prep from 9 months down to just 2 weeks with automated evidence collection and continuous cloud posture scanning.',
    faqs: [
      { q: 'How fast can we get audit ready?', a: 'Most teams pass their audit in less than 3 weeks with our automated evidence pipelines.' },
      { q: 'Does it support multi-cloud?', a: 'Yes, full native coverage across AWS, Azure, Google Cloud, and Kubernetes.' }
    ]
  },
  {
    id: 'scalepulse-crm',
    name: 'ScalePulse CRM',
    tagline: 'Predictive Sales Pipeline & Revenue Intelligence Platform',
    category: 'Sales Tech & Revenue Operations',
    pricing: '$79/user/mo (Growth) | $199/user/mo (Scale)',
    targetAudience: 'B2B sales teams, agency owners, revenue leaders looking to 3x win rates',
    keyFeatures: [
      'AI deal forecasting with 94% forecast accuracy',
      'Automated follow-up sequences with dynamic email & SMS',
      'Conversation intelligence highlighting lost deals & customer intent',
      'One-click WhatsApp and omnichannel sales inbox'
    ],
    pitch: 'ScalePulse CRM unifies your pipeline, tracks buying signals automatically, and guides reps on exact next actions to close more enterprise deals faster.',
    faqs: [
      { q: 'Can we migrate from HubSpot or Salesforce?', a: 'Yes, our 1-click migration wizard imports all your contacts, deals, and history in 15 minutes.' }
    ]
  }
];

if (!fs.existsSync(PRODUCTS_FILE)) {
  writeJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
}

// Seed default calls if empty
function initializeSeedCalls() {
  const existingCalls = readJson(CALLS_FILE, []);
  if (existingCalls.length === 0) {
    const seedCalls = [
      {
        id: 'call_seed_101',
        productName: 'NexusFlow AI',
        productId: 'nexusflow-ai',
        customerName: 'Rajesh Sharma',
        customerCompany: 'Apex Retail Tech',
        customerPhone: '+91 98765 43210',
        language: 'English',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        durationSeconds: 142,
        durationFormatted: '02:22',
        salesStatus: 'Converted',
        sentiment: 'Positive',
        confidenceScore: 96,
        summary: 'Customer called inquiring about automating high-volume customer support during festival sales. Explored NexusFlow Pro tier features, integration with Shopify and Zendesk. Customer was impressed by multilingual voice support (Hindi/English) and converted immediately on the annual Growth plan.',
        requirements: [
          'Handling 5,000+ support calls daily during festive season',
          'Bilingual English & Hindi speech recognition',
          'Direct integration with Shopify order lookup'
        ],
        objections: [
          'Initial concern regarding latency during peak hours (Resolved: explained sub-350ms edge voice nodes)'
        ],
        nextSteps: [
          'Account setup link dispatched via email',
          'Onboarding call scheduled with Solutions Architect for tomorrow 11 AM'
        ],
        transcript: [
          { speaker: 'bot', text: 'Hello! Thank you for contacting NexusFlow AI. I am your AI sales specialist. How can I help supercharge your customer operations today?', time: '00:02' },
          { speaker: 'customer', text: 'Hi, we run an e-commerce platform and our call center is getting overwhelmed with order status calls. Can NexusFlow handle voice calls automatically?', time: '00:10' },
          { speaker: 'bot', text: 'Absolutely Rajesh! NexusFlow AI handles autonomous 2-way voice conversations with sub-350ms latency. We integrate directly with Shopify and your CRM to answer order queries and resolve up to 85% of inbound calls without human agents.', time: '00:18' },
          { speaker: 'customer', text: 'That sounds great. Do you support Hindi as well as English?', time: '00:26' },
          { speaker: 'bot', text: 'Yes, we natively support English, Hindi, Telugu, and 50+ languages with natural human intonation and accent recognition.', time: '00:32' },
          { speaker: 'customer', text: 'What is the pricing for this?', time: '00:38' },
          { speaker: 'bot', text: 'Our Pro plan is $149 per seat per month with unlimited voice workflows and 10,000 minutes included. If you subscribe annually today, we offer a 20% discount plus complimentary VIP onboarding.', time: '00:46' },
          { speaker: 'customer', text: 'I love that offer. Let us go ahead and get started with the annual plan right away.', time: '00:54' },
          { speaker: 'bot', text: 'Fantastic! I have created your activation order. Welcome aboard NexusFlow AI! I will send your welcome pack and schedule our onboarding specialist for tomorrow.', time: '01:02' }
        ],
        recordingUrl: null,
        recordingConsentGiven: true
      },
      {
        id: 'call_seed_102',
        productName: 'CloudGuard Pro',
        productId: 'cloudguard-pro',
        customerName: 'Priya Sundaram',
        customerCompany: 'FinSecure Labs',
        customerPhone: '+91 98111 22334',
        language: 'English',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        durationSeconds: 185,
        durationFormatted: '03:05',
        salesStatus: 'Demo Requested',
        sentiment: 'Positive',
        confidenceScore: 91,
        summary: 'Lead is preparing for enterprise fintech pilot and urgently requires SOC-2 Type II certification within 45 days. Discussed CloudGuard automated cloud scanning and auditor-approved evidence vault. Lead requested a comprehensive technical demo with their VP of Infrastructure.',
        requirements: [
          'SOC-2 Type II audit readiness for AWS & Kubernetes',
          'Continuous monitoring for 120 cloud resources',
          'Auditor portal to share evidence without manual spreadsheets'
        ],
        objections: [
          'Wanted confirmation that the evidence is accepted by Big-4 auditing firms'
        ],
        nextSteps: [
          'Schedule 30-minute deep dive demo with Principal Security Architect for Thursday 3:00 PM IST',
          'Send SOC-2 auditor acceptance whitepaper and sample audit report'
        ],
        transcript: [
          { speaker: 'bot', text: 'Welcome to CloudGuard Pro! I am your AI compliance advisor. Are you looking to accelerate your security certification today?', time: '00:03' },
          { speaker: 'customer', text: 'Hello, we are closing a bank deal and they demand SOC-2 Type II within two months. Can CloudGuard help us do that in time?', time: '00:12' },
          { speaker: 'bot', text: 'Yes! CloudGuard Pro automates 90% of evidence collection across your AWS, GCP, and Kubernetes stacks. Most of our clients achieve complete audit readiness in just 14 to 21 days.', time: '00:22' },
          { speaker: 'customer', text: 'Do Big Four auditors accept your automated evidence reports?', time: '00:30' },
          { speaker: 'bot', text: 'Yes, 100%. Our reports and continuous control monitoring are pre-mapped to AICPA standards and accepted by Deloitte, PwC, EY, KPMG, and top boutique auditors.', time: '00:40' },
          { speaker: 'customer', text: 'That is encouraging. Can we schedule a live demo so my VP of Security can see the AWS integration firsthand?', time: '00:50' },
          { speaker: 'bot', text: 'Certainly! I can book a dedicated technical demo for your team this Thursday at 3 PM IST. Does that slot work for you?', time: '00:58' },
          { speaker: 'customer', text: 'Thursday at 3 PM works perfectly. Send the calendar invite to priya@finsecurelabs.io.', time: '01:05' },
          { speaker: 'bot', text: 'Invite sent! We look forward to showing you and your VP how effortless compliance can be.', time: '01:12' }
        ],
        recordingUrl: null,
        recordingConsentGiven: true
      },
      {
        id: 'call_seed_103',
        productName: 'ScalePulse CRM',
        productId: 'scalepulse-crm',
        customerName: 'Venkat Rao',
        customerCompany: 'Deccan Logistics',
        customerPhone: '+91 97000 88990',
        language: 'Telugu',
        timestamp: new Date(Date.now() - 3600000 * 28).toISOString(),
        durationSeconds: 110,
        durationFormatted: '01:50',
        salesStatus: 'Follow-up Required',
        sentiment: 'Neutral',
        confidenceScore: 84,
        summary: 'Customer inquired in Telugu regarding sales pipeline automation and WhatsApp lead capture for fleet logistics. Showed keen interest in automated WhatsApp notifications. Decision requires approval from Managing Director who is travelling until next Tuesday.',
        requirements: [
          'WhatsApp integration for freight booking leads',
          'Field sales rep live tracking',
          'Telugu language interface or voice prompts'
        ],
        objections: [
          'Decision pending MD approval; budget cycle closes next month'
        ],
        nextSteps: [
          'Send Telugu product one-pager and video walkthrough via WhatsApp',
          'Follow-up telephone call scheduled for next Wednesday 11:30 AM'
        ],
        transcript: [
          { speaker: 'bot', text: 'నమస్కారం! ScalePulse CRM కి స్వాగతం. మీ వ్యాపార అమ్మకాలను వేగవంతం చేయడంలో నేను ఎలా సహాయపడగలను?', time: '00:04' },
          { speaker: 'customer', text: 'నమస్తే, మా లాజిస్టిక్స్ బిజినెస్ కి వాట్సాప్ లీడ్స్ ట్రాక్ చేయడానికి CRM కావాలి. ఇందులో ఆ ఫీచర్ ఉందా?', time: '00:15' },
          { speaker: 'bot', text: 'అవును వెంకట్ గారు! ScalePulse CRM లో డైరెక్ట్ వాట్సాప్ ఇంటిగ్రేషన్ ఉంది. లీడ్స్ రాగానే ఆటోమేటిక్ గా సేల్స్ టీమ్ కి అప్పగిస్తుంది మరియు కొటేషన్స్ పంపుతుంది.', time: '00:26' },
          { speaker: 'customer', text: 'చాలా బాగుంది. కానీ మా మేనేజింగ్ డైరెక్టర్ వచ్చే వారం వరకు టూర్ లో ఉన్నారు. వారి అప్రూవల్ కావాలి.', time: '00:38' },
          { speaker: 'bot', text: 'ఖచ్చితంగా అర్థం చేసుకున్నాను. నేను మీకు వాట్సాప్ లో బ్రోచర్ మరియు డెమో వీడియో పంపుతాను. వచ్చే బుధవారం ఉదయం 11:30 కి తిరిగి కాల్ చేయమంటారా?', time: '00:50' },
          { speaker: 'customer', text: 'సరే, బుధవారం కాల్ చేయండి.', time: '00:56' },
          { speaker: 'bot', text: 'ధన్యవాదాలు వెంకట్ గారు! వచ్చే బుధవారం 11:30 కి మాట్లాడుకుందాం. హావ్ ఏ గ్రేట్ డే!', time: '01:03' }
        ],
        recordingUrl: null,
        recordingConsentGiven: true
      },
      {
        id: 'call_seed_104',
        productName: 'NexusFlow AI',
        productId: 'nexusflow-ai',
        customerName: 'Amit Saxena',
        customerCompany: 'Northwind Travel',
        customerPhone: '+91 99887 66554',
        language: 'Hindi',
        timestamp: new Date(Date.now() - 3600000 * 42).toISOString(),
        durationSeconds: 125,
        durationFormatted: '02:05',
        salesStatus: 'Interested',
        sentiment: 'Positive',
        confidenceScore: 88,
        summary: 'Customer called to enquire about automating booking inquiries for tours in Hindi and English. Highly impressed with response speed. Requested detailed pricing breakdown for 20 seats.',
        requirements: [
          'Handling flight and hotel booking FAQs',
          'Hindi voice synthesis with natural Indian accent',
          '20 support agent seats'
        ],
        objections: [
          'Needs approval on monthly versus annual pricing discount'
        ],
        nextSteps: [
          'Email custom quotation for 20 seats with 25% annual discount',
          'Invite customer to test the interactive voice sandbox'
        ],
        transcript: [
          { speaker: 'bot', text: 'नमस्ते! NexusFlow AI में आपका स्वागत है। मैं आपकी सेल्स स्पेशलिस्ट हूँ। आपकी क्या सहायता कर सकती हूँ?', time: '00:03' },
          { speaker: 'customer', text: 'नमस्ते, क्या आपका बॉट हमारे ट्रैवल ग्राहकों से हिंदी में बात करके पैकेज की जानकारी दे सकता है?', time: '00:14' },
          { speaker: 'bot', text: 'जी हाँ अमित जी! NexusFlow AI हिंदी और अंग्रेजी दोनों में बिना किसी देरी के स्वाभाविक बातचीत करता है और बुकिंग्स भी कन्फर्म करता है।', time: '00:25' },
          { speaker: 'customer', text: 'बहुत बढ़िया! हमें लगभग 20 सीट्स के लिए चाहिए। क्या आप इसका प्राइसिंग डिटेल भेज सकते हैं?', time: '00:35' },
          { speaker: 'bot', text: 'ज़रूर! 20 सीट्स के लिए हमारे पास स्पेशल एनुअल पैकेज है जिस पर 25% तक की छूट मिलती है। मैं आपके ईमेल पर कोटेशन और ट्रायल लिंक अभी भेज रही हूँ।', time: '00:48' },
          { speaker: 'customer', text: 'जी, कृपया amit@northwind.in पर भेज दीजिए।', time: '00:55' },
          { speaker: 'bot', text: 'मेल भेज दिया गया है अमित जी। जानकारी देखने के बाद हम आगे की प्रक्रिया शुरू कर सकते हैं। धन्यवाद!', time: '01:04' }
        ],
        recordingUrl: null,
        recordingConsentGiven: true
      },
      {
        id: 'call_seed_105',
        productName: 'ScalePulse CRM',
        productId: 'scalepulse-crm',
        customerName: 'Sanjay Deshmukh',
        customerCompany: 'TechVertex Inc',
        customerPhone: '+91 98220 11223',
        language: 'English',
        timestamp: new Date(Date.now() - 3600000 * 60).toISOString(),
        durationSeconds: 68,
        durationFormatted: '01:08',
        salesStatus: 'Not Interested',
        sentiment: 'Negative',
        confidenceScore: 92,
        summary: 'Lead expressed that they recently signed a multi-year global enterprise contract with Salesforce last month and have no appetite for evaluating alternative CRMs at this stage.',
        requirements: [
          'None at this time'
        ],
        objections: [
          'Locked into 3-year Salesforce Enterprise contract'
        ],
        nextSteps: [
          'Mark status as Not Interested',
          'Add to nurture newsletter with re-evaluation reminder in 24 months'
        ],
        transcript: [
          { speaker: 'bot', text: 'Hello! Welcome to ScalePulse CRM. Are you looking to streamline your sales pipeline and accelerate deal closures?', time: '00:03' },
          { speaker: 'customer', text: 'Hi, we just renewed a 3-year contract with Salesforce last week. We are definitely not looking to switch systems.', time: '00:15' },
          { speaker: 'bot', text: 'Understood Sanjay! Salesforce is a formidable platform. We also offer bi-directional sync plugins that augment Salesforce with predictive AI deal scoring. Would you be open to seeing that down the line?', time: '00:26' },
          { speaker: 'customer', text: 'No thanks, our leadership has frozen all sales tech spending for this fiscal year.', time: '00:33' },
          { speaker: 'bot', text: 'Understood completely Sanjay. Thank you for your time and transparency today. Wishing you and TechVertex tremendous success with Salesforce!', time: '00:42' }
        ],
        recordingUrl: null,
        recordingConsentGiven: true
      },
      {
        id: 'call_seed_106',
        productName: 'CloudGuard Pro',
        productId: 'cloudguard-pro',
        customerName: 'Unknown Caller',
        customerCompany: 'Inbound Line',
        customerPhone: '+91 97123 45678',
        language: 'English',
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
        durationSeconds: 15,
        durationFormatted: '00:15',
        salesStatus: 'No Response',
        sentiment: 'Neutral',
        confidenceScore: 99,
        summary: 'Call connected. AI greeted the caller, but there was continuous silence and no audio input detected from the customer side. Call ended after 15 seconds.',
        requirements: [],
        objections: [],
        nextSteps: [
          'Trigger automated follow-up SMS with self-service link',
          'Retry outbound voice outreach in 48 hours'
        ],
        transcript: [
          { speaker: 'bot', text: 'Hello! Thank you for calling CloudGuard Pro security hotline. How may I assist your compliance today?', time: '00:02' },
          { speaker: 'customer', text: '[Silence / No speech detected]', time: '00:08' },
          { speaker: 'bot', text: 'Hello, are you there? I am unable to hear you. Please speak up or call back when ready.', time: '00:11' }
        ],
        recordingUrl: null,
        recordingConsentGiven: true
      }
    ];
    writeJson(CALLS_FILE, seedCalls);
  }
}
initializeSeedCalls();

// API: Get Products
app.get('/api/products', (req, res) => {
  const products = readJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
  res.json({ success: true, products });
});

// API: Add Custom Product
app.post('/api/products', (req, res) => {
  try {
    const { name, tagline, category, pricing, targetAudience, pitch, keyFeatures, faqs } = req.body;
    if (!name || !pitch) {
      return res.status(400).json({ success: false, error: 'Product name and pitch are required' });
    }
    const products = readJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
    const newProduct = {
      id: 'prod_' + Date.now(),
      name,
      tagline: tagline || 'Modern SaaS Solution',
      category: category || 'Enterprise Software',
      pricing: pricing || 'Contact for custom pricing',
      targetAudience: targetAudience || 'Modern Businesses',
      pitch,
      keyFeatures: Array.isArray(keyFeatures) ? keyFeatures : [keyFeatures].filter(Boolean),
      faqs: Array.isArray(faqs) ? faqs : []
    };
    products.unshift(newProduct);
    writeJson(PRODUCTS_FILE, products);
    res.json({ success: true, product: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Get Calls
app.get('/api/calls', (req, res) => {
  const calls = readJson(CALLS_FILE, []);
  res.json({ success: true, calls });
});

// API: Save Call
app.post('/api/calls', (req, res) => {
  try {
    const callData = req.body;
    if (!callData.id) {
      callData.id = 'call_' + Date.now();
    }
    if (!callData.timestamp) {
      callData.timestamp = new Date().toISOString();
    }
    const calls = readJson(CALLS_FILE, []);
    calls.unshift(callData);
    writeJson(CALLS_FILE, calls);
    res.json({ success: true, call: callData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Delete Call
app.delete('/api/calls/:id', (req, res) => {
  try {
    const { id } = req.params;
    let calls = readJson(CALLS_FILE, []);
    calls = calls.filter(c => c.id !== id);
    writeJson(CALLS_FILE, calls);
    res.json({ success: true, message: 'Call deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Upload Audio Recording
app.post('/api/recordings', upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }
    const recordingUrl = `/recordings/${req.file.filename}`;
    res.json({
      success: true,
      recordingUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Intelligent Conversation Analyzer (Fallback or Server-side AI)
app.post('/api/analyze', (req, res) => {
  try {
    const { transcript, productName, language } = req.body;
    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return res.json({
        success: true,
        summary: 'Call disconnected without conversation.',
        requirements: [],
        objections: [],
        nextSteps: ['Follow up via SMS or retry call later.'],
        salesStatus: 'No Response',
        sentiment: 'Neutral',
        confidenceScore: 98
      });
    }

    const customerMessages = transcript.filter(m => m.speaker === 'customer').map(m => m.text.toLowerCase());
    const fullText = transcript.map(m => `${m.speaker}: ${m.text}`).join('\n').toLowerCase();

    // Classification heuristics & keyword analytics
    let salesStatus = 'Interested';
    let sentiment = 'Neutral';
    let confidenceScore = 85;

    const convertKeywords = ['buy', 'sign up', 'purchase', 'deal', 'get started', 'annual plan', 'subscribe', 'send invoice', 'take it', 'ఖరీదు', 'తీసుకుంటా', 'సబ్స్క్రయిబ్', 'खरीदेंगे', 'शुरू करते हैं', 'शुरू करें'];
    const demoKeywords = ['demo', 'demonstration', 'walkthrough', 'schedule', 'show me', 'calendar', 'meeting', 'డెమో', 'చూపించండి', 'मीटिंग', 'डेमो', 'दिखाइए'];
    const followUpKeywords = ['call back', 'later', 'next week', 'manager', 'director', 'boss', 'team', 'budget cycle', 'వచ్చే వారం', 'తరువాత', 'బాస్', 'बाद में', 'अगले हफ्ते', 'टीम से बात'];
    const notInterestedKeywords = ['not interested', 'no thanks', 'already use', 'salesforce', 'dont need', 'stop calling', 'వద్దు', 'అవసరం లేదు', 'नहीं चाहिए', 'रुचि नहीं'];

    if (customerMessages.length === 0 || customerMessages.every(t => t.includes('silence') || t.trim().length === 0)) {
      salesStatus = 'No Response';
      sentiment = 'Neutral';
      confidenceScore = 95;
    } else if (convertKeywords.some(k => fullText.includes(k))) {
      salesStatus = 'Converted';
      sentiment = 'Positive';
      confidenceScore = 94;
    } else if (demoKeywords.some(k => fullText.includes(k))) {
      salesStatus = 'Demo Requested';
      sentiment = 'Positive';
      confidenceScore = 92;
    } else if (notInterestedKeywords.some(k => fullText.includes(k))) {
      salesStatus = 'Not Interested';
      sentiment = 'Negative';
      confidenceScore = 90;
    } else if (followUpKeywords.some(k => fullText.includes(k))) {
      salesStatus = 'Follow-up Required';
      sentiment = 'Neutral';
      confidenceScore = 88;
    } else {
      salesStatus = 'Interested';
      sentiment = 'Positive';
      confidenceScore = 86;
    }

    // Extract requirements, objections, next steps
    const requirements = [];
    if (fullText.includes('price') || fullText.includes('cost') || fullText.includes('pricing') || fullText.includes('ధర') || fullText.includes('प्राइस')) {
      requirements.push('Transparent pricing and subscription terms clarification');
    }
    if (fullText.includes('integrate') || fullText.includes('api') || fullText.includes('shopify') || fullText.includes('crm') || fullText.includes('aws') || fullText.includes('whatsapp')) {
      requirements.push('System integration with current enterprise tech stack');
    }
    if (fullText.includes('support') || fullText.includes('scale') || fullText.includes('seats') || fullText.includes('users') || fullText.includes('hindi') || fullText.includes('telugu')) {
      requirements.push('Multi-lingual capability & team scalability support');
    }
    if (requirements.length === 0) {
      requirements.push(`Evaluation of ${productName || 'SaaS'} core capabilities`);
    }

    const objections = [];
    if (fullText.includes('expensive') || fullText.includes('budget') || fullText.includes('discount')) {
      objections.push('Cost & budget alignment concerns addressed during call');
    }
    if (fullText.includes('competitor') || fullText.includes('salesforce') || fullText.includes('already have')) {
      objections.push('Existing vendor contract or workflow lock-in');
    }
    if (fullText.includes('security') || fullText.includes('audit') || fullText.includes('compliance')) {
      objections.push('Information security & data privacy compliance verification');
    }

    const nextSteps = [];
    if (salesStatus === 'Converted') {
      nextSteps.push('Generate customer onboarding account and dispatch license credentials');
      nextSteps.push('Schedule VIP Kickoff session with Customer Success team');
    } else if (salesStatus === 'Demo Requested') {
      nextSteps.push('Send calendar invitation for live product demonstration');
      nextSteps.push('Prepare personalized presentation addressing customer tech stack');
    } else if (salesStatus === 'Follow-up Required') {
      nextSteps.push('Send product overview deck and pricing sheet');
      nextSteps.push('Set automated follow-up reminder in CRM for agreed callback date');
    } else if (salesStatus === 'Not Interested') {
      nextSteps.push('Update CRM contact status to Unqualified/Not Interested');
      nextSteps.push('Archive lead with re-engagement trigger in 12 months');
    } else if (salesStatus === 'No Response') {
      nextSteps.push('Queue automated follow-up SMS and email note');
    } else {
      nextSteps.push('Send product brochure and self-paced interactive trial link');
      nextSteps.push('Assign inbound sales development rep for touchpoint');
    }

    const summary = `Interactive voice sales call regarding ${productName || 'the product'}. The customer engaged across ${transcript.length} dialogue turns. Evaluated key product value propositions and addressed technical queries. The call reached a definitive resolution categorized as "${salesStatus}".`;

    res.json({
      success: true,
      summary,
      requirements,
      objections: objections.length > 0 ? objections : ['No critical blocking objections encountered'],
      nextSteps,
      salesStatus,
      sentiment,
      confidenceScore
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server if run directly (local development)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` VoxSales AI - Autonomous Voice Sales Platform Server  `);
    console.log(` Running at http://localhost:${PORT}                   `);
    console.log(`=======================================================`);
  });
}

// Export for Vercel serverless handler
module.exports = app;

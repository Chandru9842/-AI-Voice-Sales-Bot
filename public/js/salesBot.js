// Advanced Sales Bot Logic & Conversational State Machine
// Handles SaaS sales stages: Greeting -> Discovery -> Solution -> Objection Handling -> Closing
// Native multi-language support: English, Hindi, Telugu

class SalesBot {
  constructor() {
    this.currentStage = 'GREETING'; // GREETING, DISCOVERY, SOLUTION, OBJECTION, CLOSING, ENDED
    this.language = 'English'; // 'English', 'Hindi', 'Telugu'
    this.product = null;
    this.transcript = [];
    this.callStartTime = null;
    this.customerName = 'Valued Customer';
    this.detectedNeeds = [];
    this.detectedObjections = [];
    this.finalStatus = 'Interested';
    this.apiKey = localStorage.getItem('gemini_api_key') || '';
  }

  initCall(product, language = 'English', customerName = 'Guest') {
    this.product = product;
    this.language = language;
    this.customerName = customerName || 'Valued Customer';
    this.currentStage = 'GREETING';
    this.transcript = [];
    this.callStartTime = Date.now();
    this.detectedNeeds = [];
    this.detectedObjections = [];
    this.finalStatus = 'Interested';
  }

  // Get initial sales greeting
  getInitialGreeting() {
    const p = this.product;
    if (this.language === 'Telugu') {
      return `నమస్కారం! ${p.name} కి స్వాగతం. నేను మీ ఏఐ సేల్స్ అడ్వైజర్ ని. మీ వ్యాపారంలో ${p.tagline} ద్వారా గ్రోత్ సాధించడానికి మీకు ఎలా సహాయపడగలను?`;
    } else if (this.language === 'Hindi') {
      return `नमस्ते! ${p.name} में आपका स्वागत है। मैं आपका AI सेल्स स्पेशलिस्ट हूँ। ${p.name} आपके बिज़नेस को ऑटोमेट करने और रेवेन्यू बढ़ाने में कैसे मदद कर सकता है, आइए जानते हैं।`;
    } else {
      return `Hello! Welcome to ${p.name}. I'm your AI sales advisor. We help forward-thinking teams with ${p.tagline}. Are you looking to improve your operations and cut down manual workload today?`;
    }
  }

  // Detect customer intent from speech text
  detectIntent(text) {
    const t = text.toLowerCase();

    // Buy / Convert Intent
    if (
      t.includes('buy') || t.includes('purchase') || t.includes('sign up') || t.includes('subscribe') ||
      t.includes('get started') || t.includes('annual plan') || t.includes('send invoice') ||
      t.includes('తీసుకుంటా') || t.includes('సబ్స్క్రయిబ్') || t.includes('ఖరీదు') ||
      t.includes('खरीदना') || t.includes('शुरू करना') || t.includes('शुरू करते हैं') || t.includes('साइन अप')
    ) {
      return 'CONVERT';
    }

    // Demo Intent
    if (
      t.includes('demo') || t.includes('walkthrough') || t.includes('presentation') || t.includes('show me') ||
      t.includes('meeting') || t.includes('schedule') ||
      t.includes('డెమో') || t.includes('చూపించండి') || t.includes('మీటింగ్') ||
      t.includes('डेमो') || t.includes('दिखाइए') || t.includes('मीटिंग')
    ) {
      return 'DEMO';
    }

    // Not Interested
    if (
      t.includes('not interested') || t.includes('no thanks') || t.includes('stop calling') ||
      t.includes('dont need') || t.includes("don't need") || t.includes('leave me alone') ||
      t.includes('వద్దు') || t.includes('అవసరం లేదు') || t.includes('ఆసక్తి లేదు') ||
      t.includes('नहीं चाहिए') || t.includes('रुचि नहीं') || t.includes('ज़रूरत नहीं')
    ) {
      return 'NOT_INTERESTED';
    }

    // Follow-up / Callback
    if (
      t.includes('call back') || t.includes('call later') || t.includes('next week') || t.includes('discuss with') ||
      t.includes('boss') || t.includes('manager') || t.includes('team') || t.includes('budget cycle') ||
      t.includes('తరువాత') || t.includes('వచ్చే వారం') || t.includes('మాట్లాడి చెప్తా') ||
      t.includes('बाद में') || t.includes('अगले हफ्ते') || t.includes('बॉस से पूछकर')
    ) {
      return 'FOLLOW_UP';
    }

    // Pricing Intent
    if (
      t.includes('price') || t.includes('pricing') || t.includes('cost') || t.includes('how much') ||
      t.includes('expensive') || t.includes('discount') || t.includes('cheap') ||
      t.includes('ధర') || t.includes('ఖరీదు') || t.includes('ఎంత అవుతుంది') ||
      t.includes('प्राइस') || t.includes('दाम') || t.includes('कितना लगेगा') || t.includes('महंगा')
    ) {
      return 'PRICING';
    }

    // Competitor / Existing Tool
    if (
      t.includes('already use') || t.includes('competitor') || t.includes('salesforce') ||
      t.includes('hubspot') || t.includes('zendesk') || t.includes('aws') ||
      t.includes('వేరే టూల్') || t.includes('వాడుతున్నాం') ||
      t.includes('दूसरा टूल') || t.includes('पहले से यूज़')
    ) {
      return 'COMPETITOR';
    }

    // Security & Compliance
    if (
      t.includes('security') || t.includes('soc2') || t.includes('safe') || t.includes('data privacy') ||
      t.includes('iso') || t.includes('audit') ||
      t.includes('సెక్యూరిటీ') || t.includes('భద్రత') ||
      t.includes('सुरक्षा') || t.includes('डेटा प्राइवेसी')
    ) {
      return 'SECURITY';
    }

    // Features
    if (
      t.includes('feature') || t.includes('capabilities') || t.includes('what can it do') ||
      t.includes('how does it work') || t.includes('integrate') ||
      t.includes('ఫీచర్లు') || t.includes('ఎలా పనిచేస్తుంది') ||
      t.includes('फीचर्स') || t.includes('कैसे काम करता है')
    ) {
      return 'FEATURES';
    }

    return 'GENERAL';
  }

  // Generate sales conversational reply
  async generateResponse(customerText) {
    const p = this.product;
    const intent = this.detectIntent(customerText);
    const lang = this.language;

    // Track needs and objections
    if (intent === 'PRICING' && (customerText.toLowerCase().includes('expensive') || customerText.toLowerCase().includes('महंगा'))) {
      this.detectedObjections.push('Cost sensitivity and budget constraints');
    }
    if (intent === 'COMPETITOR') {
      this.detectedObjections.push('Existing competitor software installed');
    }
    if (intent === 'SECURITY') {
      this.detectedNeeds.push('Enterprise-grade security and compliance certification');
    }
    if (intent === 'FEATURES') {
      this.detectedNeeds.push('Workflow automation and seamless integrations');
    }

    let response = '';

    // Handle by Intent & Language
    switch (intent) {
      case 'CONVERT':
        this.finalStatus = 'Converted';
        this.currentStage = 'CLOSING';
        if (lang === 'Telugu') {
          response = `అద్భుతం! ${p.name} ను ఎంచుకున్నందుకు చాలా సంతోషం. నేను మీ ఖాతా యాక్టివేషన్ లింక్ మరియు 20% ప్రత్యేక వార్షిక తగ్గింపు కోడ్ ను వెంటనే పంపుతున్నాను. వెల్కమ్ అబార్డ్!`;
        } else if (lang === 'Hindi') {
          response = `शानदार फैसला! ${p.name} को चुनने के लिए धन्यवाद। मैं आपके ईमेल पर एक्टिवेशन लिंक और स्पेशल 20% डिस्काउंट तुरंत भेज रहा हूँ। आपका बहुत-बहुत स्वागत है!`;
        } else {
          response = `Outstanding! Welcome aboard to ${p.name}! I have locked in your special 20% annual discount and dispatching your account activation link right now. You are going to love the results!`;
        }
        break;

      case 'DEMO':
        this.finalStatus = 'Demo Requested';
        this.currentStage = 'CLOSING';
        if (lang === 'Telugu') {
          response = `ఖచ్చితంగా! మీ టీమ్ తో 30 నిమిషాల లైవ్ ప్రాక్టికల్ డెమోను మేము షెడ్యూల్ చేయవచ్చు. రేపు మధ్యాహ్నం 3 గంటలకు మీకు సమయం వీలవుతుందా? నేను క్యాలెండర్ ఇన్వైట్ పంపుతాను.`;
        } else if (lang === 'Hindi') {
          response = `बिल्कुल! हम आपकी टीम के लिए एक 30-मिनट का लाइव डेमो शेड्यूल कर सकते हैं। क्या कल दोपहर 3 बजे का समय आपके लिए ठीक रहेगा? मैं इनवाइट भेज देता हूँ।`;
        } else {
          response = `Absolutely! I would love to arrange a personalized 30-minute technical demonstration for you and your team. Does tomorrow at 3:00 PM work for you, or do you prefer Thursday morning?`;
        }
        break;

      case 'NOT_INTERESTED':
        this.finalStatus = 'Not Interested';
        this.currentStage = 'ENDED';
        if (lang === 'Telugu') {
          response = `అర్థం చేసుకున్నాను. మీ సమయానికి ధన్యవాదాలు. భవిష్యత్తులో మీకు ${p.name} ఎప్పుడైనా అవసరమైతే మేము ఎల్లప్పుడూ సిద్ధంగా ఉంటాము. హావ్ ఏ గ్రేట్ డే!`;
        } else if (lang === 'Hindi') {
          response = `मैं समझ सकता हूँ। अपना बहुमूल्य समय देने के लिए धन्यवाद। भविष्य में जब भी आपको ज़रूरत हो, हम हमेशा हाज़िर हैं। आपका दिन शुभ हो!`;
        } else {
          response = `I completely respect that! Thank you so much for your time today. If your requirements change in the future, ${p.name} will be here to help. Have a wonderful rest of your day!`;
        }
        break;

      case 'FOLLOW_UP':
        this.finalStatus = 'Follow-up Required';
        this.currentStage = 'CLOSING';
        if (lang === 'Telugu') {
          response = `సరేనండి! మీ నిర్ణయం మరియు టీమ్ డిస్కషన్ ముఖ్యం. నేను మీకు సంక్షిప్త వివరాలు మరియు కేస్ స్టడీ పంపుతాను. వచ్చే వారం బుధవారం ఉదయం 11 గంటలకు తిరిగి కాల్ చేయమంటారా?`;
        } else if (lang === 'Hindi') {
          response = `बिल्कुल ठीक! आप अपनी टीम से चर्चा कर लीजिए। मैं आपको पूरी जानकारी और ब्रोशर भेज रहा हूँ। क्या अगले हफ्ते बुधवार को 11 बजे हम दोबारा बात कर सकते हैं?`;
        } else {
          response = `Understood completely! It makes complete sense to review this with your leadership. I will email you our 1-page executive summary and case studies. Shall I reconnect with you next Wednesday at 11 AM?`;
        }
        break;

      case 'PRICING':
        this.currentStage = 'OBJECTION';
        if (lang === 'Telugu') {
          response = `${p.name} ప్రైసింగ్ చాలా సౌకర్యవంతంగా ఉంది: ${p.pricing}. పైగా మీరు వార్షిక ప్లాన్ తీసుకుంటే 20% వరకు డిస్కౌంట్ మరియు 14 రోజుల ఫ్రీ ట్రయల్ కూడా లభిస్తుంది. మీరు ఫ్రీ ట్రయల్ తో ప్రారంభించాలనుకుంటున్నారా?`;
        } else if (lang === 'Hindi') {
          response = `${p.name} का प्राइसिंग बहुत ही किफायती है: ${p.pricing}। इसके अलावा 14 दिन का फुल-फीचर्ड फ्री ट्रायल और एनुअल प्लान पर 20% की छूट भी उपलब्ध है। क्या आप फ्री ट्रायल शुरू करना चाहेंगे?`;
        } else {
          response = `${p.name} offers transparent value-driven pricing: ${p.pricing}. Plus, you get a zero-risk 14-day free trial and a 20% annual savings bonus. Would you like me to set up your free trial access right now?`;
        }
        break;

      case 'COMPETITOR':
        this.currentStage = 'SOLUTION';
        if (lang === 'Telugu') {
          response = `అది మంచి టూల్ అండీ! అయితే చాలా మంది కస్టమర్లు మా వద్దకు రావడానికి కారణం, ${p.name} వారి కంటే 3 రెట్లు వేగంగా సెటప్ అవుతుంది మరియు 40% ఖర్చును ఆదా చేస్తుంది. అంతేకాకుండా మీ పాత టూల్ నుండి డేటాను 15 నిమిషాల్లో మార్చవచ్చు.`;
        } else if (lang === 'Hindi') {
          response = `वह भी अच्छा समाधान है! लेकिन ग्राहक ${p.name} को इसलिए चुनते हैं क्योंकि यह सेटअप में 3 गुना तेज़ है और 40% तक लागत घटाता है। साथ ही हम आपके पुराने टूल से 15 मिनट में डेटा माइग्रेट कर देते हैं।`;
        } else {
          response = `That is a solid legacy platform! However, teams switch to ${p.name} because we deliver 3x faster time-to-value, seamless native modern AI automation, and cut total cost of ownership by up to 40%. Plus, our 1-click importer migrates your data in under 15 minutes.`;
        }
        break;

      case 'SECURITY':
        this.currentStage = 'SOLUTION';
        if (lang === 'Telugu') {
          response = `ఖచ్చితంగా భద్రత మా ప్రథమ ప్రాధాన్యత! ${p.name} ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్షన్, SOC-2 మరియు ISO ప్రమాణాలను కలిగి ఉంది. మీ డేటా పూర్తిగా ప్రైవేట్ మరియు సురక్షితం.`;
        } else if (lang === 'Hindi') {
          response = `सुरक्षा हमारी सर्वोच्च प्राथमिकता है! ${p.name} पूरी तरह से SOC-2 कंप्लायंट, एंड-टू-एंड एन्क्रिप्टेड और बैंक-ग्रेड सुरक्षा प्रोटोकॉल से लैस है। आपका डेटा 100% सुरक्षित रहता है।`;
        } else {
          response = `Security and data sovereignty are our top priority! ${p.name} is SOC-2 Type II certified, GDPR compliant, and features end-to-end 256-bit AES encryption. Your enterprise data is never shared or used to train third-party models.`;
        }
        break;

      case 'FEATURES':
        this.currentStage = 'SOLUTION';
        const topFeature = p.keyFeatures && p.keyFeatures.length > 0 ? p.keyFeatures[0] : p.tagline;
        if (lang === 'Telugu') {
          response = `${p.name} లో ముఖ్యమైన ఫీచర్లు: ${topFeature}. ఇది మీ రోజువారీ వర్క్‌ఫ్లోను ఆటోమేట్ చేసి సేల్స్ మరియు సపోర్ట్ ను సులభతరం చేస్తుంది. మీరు ప్రత్యక్షంగా డెమోలో చూడాలనుకుంటున్నారా?`;
        } else if (lang === 'Hindi') {
          response = `${p.name} की सबसे बड़ी खूबी है: ${topFeature}। यह आपके मैन्युअल काम को पूरी तरह से ऑटोमेट कर देता है। क्या आप इसे एक लाइव 5-मिनट वॉकथ्रू में देखना चाहेंगे?`;
        } else {
          response = `The standout capability of ${p.name} is: ${topFeature}. It directly automates your team workflows and boosts conversion by up to 35%. Would you like to see how this fits your exact setup in a quick live walkthrough?`;
        }
        break;

      default:
        // Contextual progression based on current stage
        if (this.currentStage === 'GREETING') {
          this.currentStage = 'DISCOVERY';
          if (lang === 'Telugu') {
            response = `చక్కగా చెప్పారు! ${p.pitch} మీ టీమ్ ప్రస్తుతానికి దీన్ని ఎలా నిర్వహిస్తోంది? మీరు ఎదుర్కొంటున్న ప్రధాన సమస్య ఏమిటి?`;
          } else if (lang === 'Hindi') {
            response = `बहुत बढ़िया! ${p.pitch} वर्तमान में आपकी टीम इस काम को कैसे संभालती है? आपकी सबसे बड़ी चुनौती क्या है?`;
          } else {
            response = `That sounds very relevant! ${p.pitch} How is your team currently handling this workflow today, and what is your single biggest bottleneck?`;
          }
        } else if (this.currentStage === 'DISCOVERY') {
          this.currentStage = 'SOLUTION';
          if (lang === 'Telugu') {
            response = `మీ సమస్యను నేను అర్థం చేసుకోగలను. ${p.name} ప్రత్యేకంగా ఈ సవాలును పరిష్కరించడానికి రూపొందించబడింది. ఇది మీ టీమ్ సమయాన్ని వారానికి 15 గంటలకు పైగా ఆదా చేస్తుంది. మనం దీనిని ప్రైసింగ్ లేదా డెమో ద్వారా పరిశీలిద్దామా?`;
          } else if (lang === 'Hindi') {
            response = `मैं आपकी स्थिति समझ सकता हूँ। ${p.name} विशेष रूप से इसी समस्या को सुलझाने के लिए बनाया गया है। इससे आपकी टीम का हफ़्ते में 15 घंटे से ज़्यादा समय बचता है। क्या हम इसकी प्राइसिंग या डेमो देखें?`;
          } else {
            response = `I hear you loud and clear. That bottleneck is exactly why companies adopt ${p.name}. We automate those repetitive tasks so your team saves over 15 hours each week. Would you like to review pricing, or see a quick interactive demo?`;
          }
        } else {
          this.currentStage = 'CLOSING';
          if (lang === 'Telugu') {
            response = `${p.name} మీ బిజినెస్ కి అత్యుత్తమ ఫలితాలు అందిస్తుంది. మీరు 14 రోజుల ఉచిత ట్రయల్ తో ఇప్పుడే ప్రారంభించాలనుకుంటున్నారా, లేదా రేపు ఒక లైవ్ డెమోను షెడ్యూల్ చేయమంటారా?`;
          } else if (lang === 'Hindi') {
            response = `${p.name} आपके व्यवसाय के लिए बेहद फायदेमंद रहेगा। क्या आप 14 दिन का फ्री ट्रायल आज ही शुरू करना चाहेंगे, या कल के लिए एक लाइव डेमो रख लें?`;
          } else {
            response = `${p.name} is ready to make an immediate impact on your revenue. Would you prefer to activate your 14-day zero-risk trial right now, or shall we book a 20-minute live demonstration for tomorrow?`;
          }
        }
        break;
    }

    return response;
  }
}

// Global instance
window.salesBot = new SalesBot();

// AI Conversation Intelligence & Analytics Engine
// Extracts: Summary, Requirements, Objections, Next Steps, and Sales Status Classification

class AIAnalytics {
  constructor() {}

  async analyzeCall(transcript, product, durationSeconds, language) {
    // 1. Try server endpoint first
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          productName: product ? product.name : 'SaaS Product',
          language
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend /api/analyze failed, falling back to client-side NLP analyzer', e);
    }

    // 2. Client-side NLP Analyzer fallback
    return this.runClientAnalysis(transcript, product, durationSeconds, language);
  }

  runClientAnalysis(transcript, product, durationSeconds, language) {
    const pName = product ? product.name : 'SaaS Platform';

    if (!transcript || transcript.length === 0 || durationSeconds < 8) {
      return {
        summary: `Call connected for ${pName} but disconnected before substantive customer dialogue took place.`,
        requirements: [],
        objections: [],
        nextSteps: [
          'Send automated SMS and WhatsApp brochure',
          'Schedule re-engagement call attempt in 48 hours'
        ],
        salesStatus: 'No Response',
        sentiment: 'Neutral',
        confidenceScore: 98
      };
    }

    const fullDialogue = transcript.map(t => `${t.speaker}: ${t.text}`).join(' ').toLowerCase();
    const customerLines = transcript.filter(t => t.speaker === 'customer').map(t => t.text.toLowerCase());

    // Check for silence / empty
    if (customerLines.length === 0 || customerLines.every(line => line.includes('silence') || line.trim().length === 0)) {
      return {
        summary: `Call established but no audible customer responses were received. Automated silence handler concluded the session.`,
        requirements: [],
        objections: [],
        nextSteps: ['Queue follow-up outreach via SMS / Email'],
        salesStatus: 'No Response',
        sentiment: 'Neutral',
        confidenceScore: 96
      };
    }

    // Check for explicit statuses
    let salesStatus = 'Interested';
    let sentiment = 'Neutral';
    let confidenceScore = 85;

    const convertTerms = ['buy', 'purchase', 'sign up', 'subscribe', 'annual plan', 'invoice', 'deal', 'started', 'ఖరీదు', 'తీసుకుంటా', 'खरीद', 'शुरू करते'];
    const demoTerms = ['demo', 'presentation', 'walkthrough', 'meeting', 'schedule', 'calendar', 'డెమో', 'చూపించండి', 'डेमो', 'दिखाइए'];
    const notInterestedTerms = ['not interested', 'no thanks', 'stop', 'dont need', "don't need", 'salesforce', 'వద్దు', 'అవసరం లేదు', 'नहीं चाहिए'];
    const followUpTerms = ['later', 'call back', 'next week', 'discuss', 'team', 'boss', 'budget', 'తరువాత', 'వచ్చే వారం', 'बाद में', 'अगले हफ्ते'];

    if (convertTerms.some(term => fullDialogue.includes(term))) {
      salesStatus = 'Converted';
      sentiment = 'Positive';
      confidenceScore = 95;
    } else if (demoTerms.some(term => fullDialogue.includes(term))) {
      salesStatus = 'Demo Requested';
      sentiment = 'Positive';
      confidenceScore = 92;
    } else if (notInterestedTerms.some(term => fullDialogue.includes(term))) {
      salesStatus = 'Not Interested';
      sentiment = 'Negative';
      confidenceScore = 90;
    } else if (followUpTerms.some(term => fullDialogue.includes(term))) {
      salesStatus = 'Follow-up Required';
      sentiment = 'Neutral';
      confidenceScore = 87;
    } else {
      salesStatus = 'Interested';
      sentiment = 'Positive';
      confidenceScore = 84;
    }

    // Detect Requirements
    const requirements = [];
    if (fullDialogue.includes('price') || fullDialogue.includes('cost') || fullDialogue.includes('pricing') || fullDialogue.includes('ధర') || fullDialogue.includes('प्राइस')) {
      requirements.push('Transparent tier pricing & annual discount structure');
    }
    if (fullDialogue.includes('integra') || fullDialogue.includes('api') || fullDialogue.includes('crm') || fullDialogue.includes('shopify') || fullDialogue.includes('whatsapp')) {
      requirements.push('Turnkey integration with existing business systems');
    }
    if (fullDialogue.includes('security') || fullDialogue.includes('soc2') || fullDialogue.includes('privacy') || fullDialogue.includes('safe') || fullDialogue.includes('భద్రత') || fullDialogue.includes('सुरक्षा')) {
      requirements.push('Enterprise security compliance (SOC-2 / ISO standards)');
    }
    if (fullDialogue.includes('hindi') || fullDialogue.includes('telugu') || fullDialogue.includes('language') || fullDialogue.includes('support')) {
      requirements.push(`Multi-lingual communication capability (${language})`);
    }
    if (requirements.length === 0) {
      requirements.push(`Core automated capabilities of ${pName}`);
    }

    // Detect Objections
    const objections = [];
    if (fullDialogue.includes('expensive') || fullDialogue.includes('budget') || fullDialogue.includes('cost') || fullDialogue.includes('महंगा') || fullDialogue.includes('ఎక్కువ')) {
      objections.push('Budget sensitivity regarding monthly vs annual commitment');
    }
    if (fullDialogue.includes('already use') || fullDialogue.includes('competitor') || fullDialogue.includes('salesforce') || fullDialogue.includes('zendesk')) {
      objections.push('Existing competitor software contract in place');
    }
    if (fullDialogue.includes('time') || fullDialogue.includes('migration') || fullDialogue.includes('setup')) {
      objections.push('Implementation and migration onboarding timeline');
    }
    if (objections.length === 0) {
      objections.push('No blocking objections raised during the conversation');
    }

    // Determine Next Steps
    const nextSteps = [];
    if (salesStatus === 'Converted') {
      nextSteps.push('Generate customer activation account credentials');
      nextSteps.push('Schedule VIP Kickoff session with Customer Success specialist');
    } else if (salesStatus === 'Demo Requested') {
      nextSteps.push('Send calendar invitation for live 30-minute product demonstration');
      nextSteps.push('Prepare customized demonstration tailored to customer workflows');
    } else if (salesStatus === 'Follow-up Required') {
      nextSteps.push('Send product overview deck, video guide, and ROI calculator');
      nextSteps.push('Set automated CRM callback reminder for next week');
    } else if (salesStatus === 'Not Interested') {
      nextSteps.push('Log objection reason into CRM and update status to Not Interested');
      nextSteps.push('Enroll in periodic low-touch quarterly product release newsletter');
    } else {
      nextSteps.push('Email 14-day full feature trial activation link');
      nextSteps.push('Assign Inbound Sales Development Rep for follow-up touchpoint');
    }

    const summary = `Interactive voice sales session for ${pName}. Customer engaged across ${transcript.length} turns in ${language}. Evaluated core platform capabilities and discussed implementation. The interaction concluded with status "${salesStatus}".`;

    return {
      summary,
      requirements,
      objections,
      nextSteps,
      salesStatus,
      sentiment,
      confidenceScore
    };
  }
}

// Global instance
window.aiAnalytics = new AIAnalytics();

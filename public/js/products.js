// Pre-configured SaaS Products and Custom Product Management

const DEFAULT_SAAS_PRODUCTS = [
  {
    id: 'nexusflow-ai',
    name: 'NexusFlow AI',
    tagline: 'Autonomous AI Voice & Customer Experience Platform',
    category: 'Customer Support & Sales AI',
    pricing: '$49/seat/mo (Starter) | $149/seat/mo (Pro Enterprise)',
    targetAudience: 'SaaS companies, BPOs, e-commerce, and high-velocity sales teams',
    keyFeatures: [
      'Sub-350ms real-time conversational voice in 50+ languages',
      'Native 2-way sync with HubSpot, Salesforce, Zoho & Zendesk',
      'Automated objection handling and calendar demo booking',
      'Live transcription, AI summary & CRM status classifier'
    ],
    pitch: 'NexusFlow AI empowers your business with 24/7 human-like voice agents that qualify inbound leads, answer customer questions, and resolve 85% of support calls without human intervention.',
    faqs: [
      { q: 'Can it connect with our phone numbers?', a: 'Yes! It integrates with Twilio, Plivo, Vonage, and SIP trunks in under 5 minutes.' },
      { q: 'Is there a free trial?', a: 'Yes! We offer a 14-day free trial with 500 complimentary voice minutes.' }
    ]
  },
  {
    id: 'cloudguard-pro',
    name: 'CloudGuard Pro',
    tagline: 'Automated SOC-2, ISO27001 & Cloud Security Compliance',
    category: 'Cybersecurity SaaS',
    pricing: '$299/mo (Standard) | $799/mo (Enterprise Unlimited)',
    targetAudience: 'Fast-growing startups, fintech, healthcare SaaS needing compliance fast',
    keyFeatures: [
      'Automated SOC-2 Type II audit readiness in under 14 days',
      'Continuous 24/7 scanning of AWS, GCP, Azure, and Kubernetes',
      'Automated vendor risk management and evidence collection',
      'Auditor-approved evidence room accepted by Big-4 auditing firms'
    ],
    pitch: 'CloudGuard Pro eliminates 90% of compliance grunt work, turning 9-month SOC-2 and ISO27001 audit preparation into a frictionless 2-week automated process.',
    faqs: [
      { q: 'Do Big 4 auditors accept your evidence?', a: 'Yes, our reports are pre-mapped to AICPA trust principles and accepted by Deloitte, PwC, EY, KPMG.' },
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
      'Automated follow-up sequences across Email and WhatsApp',
      'Conversation intelligence highlighting lost deals and objections',
      '1-click migration from Salesforce, HubSpot, and Pipedrive'
    ],
    pitch: 'ScalePulse CRM unifies your pipeline, tracks buying signals automatically, and guides reps on exact next actions to close more enterprise deals faster.',
    faqs: [
      { q: 'Can we migrate from HubSpot or Salesforce?', a: 'Yes, our 1-click migration wizard imports all your contacts, deals, and history in 15 minutes.' }
    ]
  }
];

class ProductManager {
  constructor() {
    this.products = [...DEFAULT_SAAS_PRODUCTS];
    this.selectedProduct = this.products[0];
    this.loadProducts();
  }

  async loadProducts() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          this.products = data.products;
          this.selectedProduct = this.products[0];
        }
      }
    } catch (e) {
      console.warn('Backend unavailable, using local default products', e);
    }
  }

  setSelectedProduct(id) {
    const found = this.products.find(p => p.id === id);
    if (found) {
      this.selectedProduct = found;
      return true;
    }
    return false;
  }

  getSelectedProduct() {
    return this.selectedProduct || this.products[0];
  }

  async addCustomProduct(productData) {
    const newProduct = {
      id: 'custom_' + Date.now(),
      name: productData.name,
      tagline: productData.tagline || 'Next-Gen SaaS Solution',
      category: productData.category || 'B2B SaaS',
      pricing: productData.pricing || '$99/mo',
      targetAudience: productData.targetAudience || 'Modern Businesses',
      pitch: productData.pitch,
      keyFeatures: productData.keyFeatures || [],
      faqs: productData.faqs || []
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          this.products.unshift(data.product);
          this.selectedProduct = data.product;
          return data.product;
        }
      }
    } catch (e) {
      console.warn('Could not save product to server, saving locally', e);
    }

    this.products.unshift(newProduct);
    this.selectedProduct = newProduct;
    return newProduct;
  }
}

// Global instance
window.productManager = new ProductManager();

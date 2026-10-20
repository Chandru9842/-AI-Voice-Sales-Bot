// VoxSales AI - Main Application Controller
// Orchestrates VoiceEngine, SalesBot, AIAnalytics, and CRMStorage

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewSections = document.querySelectorAll('.view-section');

  // Call Studio Elements
  const productSelect = document.getElementById('product-select');
  const languageSelect = document.getElementById('language-select');
  const customerNameInput = document.getElementById('customer-name-input');
  const consentCheckbox = document.getElementById('consent-checkbox');
  const btnStartCall = document.getElementById('btn-start-call');
  const btnEndCall = document.getElementById('btn-end-call');
  const btnToggleMute = document.getElementById('btn-toggle-mute');
  const btnToggleSpeaker = document.getElementById('btn-toggle-speaker');
  const callStatusBadge = document.getElementById('call-status-badge');
  const callDurationDisplay = document.getElementById('call-duration');
  const chatFeed = document.getElementById('chat-feed');
  const customerTextInput = document.getElementById('customer-text-input');
  const btnSendText = document.getElementById('btn-send-text');
  const promptPills = document.querySelectorAll('.prompt-pill');
  const visualizerCanvas = document.getElementById('audio-visualizer');

  // CRM Elements
  const crmTableBody = document.getElementById('crm-table-body');
  const crmCardsContainer = document.getElementById('crm-cards-container');
  const crmFilterPills = document.querySelectorAll('.crm-filter-pill');
  const crmSearchInput = document.getElementById('crm-search-input');
  const crmLanguageSelect = document.getElementById('crm-language-select');
  const btnExportJson = document.getElementById('btn-export-json');

  // Stat Elements
  const statTotalCalls = document.getElementById('stat-total-calls');
  const statConversionRate = document.getElementById('stat-conversion-rate');
  const statConverted = document.getElementById('stat-converted');
  const statDemo = document.getElementById('stat-demo');
  const statFollowUp = document.getElementById('stat-followup');
  const statNotInterested = document.getElementById('stat-not-interested');

  // Modal Elements
  const postCallModal = document.getElementById('post-call-modal');
  const btnClosePostModal = document.getElementById('btn-close-post-modal');
  const postModalProduct = document.getElementById('post-modal-product');
  const postModalStatusBadge = document.getElementById('post-modal-status');
  const postModalDuration = document.getElementById('post-modal-duration');
  const postModalSummary = document.getElementById('post-modal-summary');
  const postModalRequirements = document.getElementById('post-modal-requirements');
  const postModalObjections = document.getElementById('post-modal-objections');
  const postModalNextSteps = document.getElementById('post-modal-next-steps');
  const postModalAudio = document.getElementById('post-modal-audio');
  const btnDownloadRecording = document.getElementById('btn-download-recording');
  const btnViewInCrm = document.getElementById('btn-view-in-crm');

  // Detail Modal Elements
  const callDetailModal = document.getElementById('call-detail-modal');
  const btnCloseDetailModal = document.getElementById('btn-close-detail-modal');
  const detailModalContent = document.getElementById('detail-modal-content');

  // Custom Product Form
  const customProductForm = document.getElementById('custom-product-form');

  // Application State
  let callTimerInterval = null;
  let callStartTime = null;
  let callDurationSeconds = 0;
  let isCallActive = false;
  let currentRecordingResult = null;
  let currentCallRecord = null;
  let visualizerAnimFrame = null;

  // Initialize
  await window.productManager.loadProducts();
  populateProductSelect();
  await window.crmStorage.loadCalls();
  renderCrmView();
  updateCrmStats();
  initVisualizer();

  // Navigation Tabs
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      viewSections.forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');

      if (targetId === 'view-crm') {
        renderCrmView();
        updateCrmStats();
      }
    });
  });

  // Populate Product Select
  function populateProductSelect() {
    productSelect.innerHTML = '';
    window.productManager.products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} - ${p.category}`;
      productSelect.appendChild(opt);
    });

    // Update active product details card
    updateProductCard();
  }

  function updateProductCard() {
    const selected = window.productManager.getSelectedProduct();
    const nameEl = document.getElementById('active-product-name');
    const taglineEl = document.getElementById('active-product-tagline');
    const pricingEl = document.getElementById('active-product-pricing');
    const pitchEl = document.getElementById('active-product-pitch');
    const featuresEl = document.getElementById('active-product-features');

    if (nameEl) nameEl.textContent = selected.name;
    if (taglineEl) taglineEl.textContent = selected.tagline;
    if (pricingEl) pricingEl.textContent = selected.pricing;
    if (pitchEl) pitchEl.textContent = selected.pitch;

    if (featuresEl) {
      featuresEl.innerHTML = '';
      (selected.keyFeatures || []).forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        featuresEl.appendChild(li);
      });
    }
  }

  productSelect.addEventListener('change', () => {
    window.productManager.setSelectedProduct(productSelect.value);
    updateProductCard();
  });

  // Language Select change
  languageSelect.addEventListener('change', () => {
    const lang = languageSelect.value;
    window.voiceEngine.setLanguage(lang);
    updatePromptPillsLanguage(lang);
  });

  function updatePromptPillsLanguage(lang) {
    const pillsContainer = document.getElementById('prompt-pills-container');
    if (!pillsContainer) return;

    let prompts = [];
    if (lang === 'Telugu') {
      prompts = [
        { label: 'డెమో కావాలి (Demo)', text: 'మాకు మీ ప్రొడక్ట్ లైవ్ డెమో చూపించండి.' },
        { label: 'ధర ఎంత? (Pricing)', text: 'దీని ప్రైసింగ్ ఎంత? ఏదైనా డిస్కౌంట్ ఉందా?' },
        { label: 'తీసుకుంటాం (Buy)', text: 'నాకు నచ్చింది! నేను ఈ రోజే ప్రారంభించాలనుకుంటున్నాను.' },
        { label: 'తరువాత కాల్ చేయండి (Follow-up)', text: 'మా డైరెక్టర్ తో మాట్లాడి వచ్చే వారం చెప్తాము.' },
        { label: 'వేరే టూల్ ఉంది (Competitor)', text: 'మేము ఇప్పటికే మరొక సాఫ్ట్‌వేర్ వాడుతున్నాము.' },
        { label: 'ఆసక్తి లేదు (Not Interested)', text: 'ధన్యవాదాలు, మాకు ఇప్పుడు ఇది అవసరం లేదు.' }
      ];
    } else if (lang === 'Hindi') {
      prompts = [
        { label: 'डेमो चाहिए (Demo)', text: 'क्या आप हमें इसका एक लाइव डेमो दिखा सकते हैं?' },
        { label: 'प्राइसिंग क्या है? (Pricing)', text: 'इसकी क्या कीमत है? क्या कोई एनुअल डिस्काउंट है?' },
        { label: 'खरीदना है (Buy)', text: 'मुझे यह बहुत पसंद आया! हम आज ही शुरू करना चाहते हैं।' },
        { label: 'बाद में कॉल करें (Follow-up)', text: 'हम अपनी टीम से बात करके अगले हफ्ते बताएंगे।' },
        { label: 'दूसरा टूल है (Competitor)', text: 'हम पहले से ही दूसरा टूल यूज़ कर रहे हैं।' },
        { label: 'रुचि नहीं है (Not Interested)', text: 'नहीं धन्यवाद, हमें अभी इसकी आवश्यकता नहीं है।' }
      ];
    } else {
      prompts = [
        { label: 'Request Demo', text: 'Can you show me a quick live demo of how this works?' },
        { label: 'What is the pricing?', text: 'How much does this cost per month, and is there a discount?' },
        { label: 'Ready to Buy', text: 'This looks fantastic! Let us sign up for the annual plan today.' },
        { label: 'Need to discuss with team', text: 'I need to review this with my boss, please call back next Wednesday.' },
        { label: 'Already use competitor', text: 'We already use Salesforce and HubSpot, why should we switch?' },
        { label: 'Not interested', text: 'No thanks, our budget is frozen and we do not need this.' }
      ];
    }

    pillsContainer.innerHTML = '';
    prompts.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'prompt-pill';
      btn.textContent = p.label;
      btn.title = p.text;
      btn.addEventListener('click', () => {
        if (!isCallActive) {
          showToast('Please start the call first to speak or send prompts!', 'warning');
          return;
        }
        handleCustomerInput(p.text);
      });
      pillsContainer.appendChild(btn);
    });
  }

  // Visualizer Canvas Init
  function initVisualizer() {
    if (!visualizerCanvas) return;
    const ctx = visualizerCanvas.getContext('2d');

    function render() {
      visualizerAnimFrame = requestAnimationFrame(render);
      const width = visualizerCanvas.width;
      const height = visualizerCanvas.height;
      ctx.clearRect(0, 0, width, height);

      const data = window.voiceEngine.getVisualizerData();
      const numBars = 32;
      const barWidth = (width / numBars) - 2;

      for (let i = 0; i < numBars; i++) {
        let val = 10;
        if (data && data.length > 0) {
          const index = Math.floor((i / numBars) * data.length);
          val = Math.max(8, (data[index] / 255) * height);
        } else if (isCallActive) {
          // Subtle idle resting pulse
          val = 8 + Math.sin(Date.now() / 200 + i) * 6;
        }

        const x = i * (barWidth + 2);
        const y = height - val;

        // Gradient
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        if (window.voiceEngine.isSpeaking) {
          grad.addColorStop(0, '#6366f1');
          grad.addColorStop(1, '#a855f7');
        } else {
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(1, '#10b981');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, val, [4, 4, 0, 0]);
        ctx.fill();
      }
    }
    render();
  }

  // Voice Engine Event Handlers
  window.voiceEngine.onUserSpeech = (text) => {
    handleCustomerInput(text);
  };

  window.voiceEngine.onInterimSpeech = (text) => {
    updateInterimTranscript(text);
  };

  window.voiceEngine.onStatusChange = (status) => {
    updateCallStatus(status);
  };

  window.voiceEngine.onBotSpeechStart = () => {
    updateCallStatus('Bot Speaking...');
    setPulseGlow(true);
  };

  window.voiceEngine.onBotSpeechEnd = () => {
    if (isCallActive) {
      updateCallStatus('Listening to Customer...');
    }
    setPulseGlow(false);
  };

  window.voiceEngine.onError = (msg) => {
    showToast(msg, 'error');
  };

  function setPulseGlow(isBotSpeaking) {
    const avatar = document.getElementById('bot-calling-avatar');
    if (avatar) {
      if (isBotSpeaking) {
        avatar.classList.add('speaking');
      } else {
        avatar.classList.remove('speaking');
      }
    }
  }

  function updateCallStatus(text) {
    if (callStatusBadge) {
      callStatusBadge.textContent = text;
      callStatusBadge.className = 'status-badge';
      if (text.includes('Speaking')) {
        callStatusBadge.classList.add('status-speaking');
      } else if (text.includes('Listening')) {
        callStatusBadge.classList.add('status-listening');
      } else if (text.includes('Ended')) {
        callStatusBadge.classList.add('status-ended');
      } else {
        callStatusBadge.classList.add('status-ready');
      }
    }
  }

  // START CALL
  btnStartCall.addEventListener('click', async () => {
    if (!consentCheckbox.checked) {
      showToast('Please check the call recording consent box to proceed.', 'warning');
      consentCheckbox.focus();
      return;
    }

    const selectedProduct = window.productManager.getSelectedProduct();
    const language = languageSelect.value;
    const customerName = customerNameInput.value.trim() || 'Prospective Customer';

    isCallActive = true;
    callStartTime = Date.now();
    callDurationSeconds = 0;
    updateDurationDisplay();

    // Toggle UI buttons
    btnStartCall.classList.add('hidden');
    btnEndCall.classList.remove('hidden');
    btnToggleMute.classList.remove('hidden');
    btnToggleSpeaker.classList.remove('hidden');
    chatFeed.innerHTML = '';

    // Initialize bot & voice engine
    window.salesBot.initCall(selectedProduct, language, customerName);
    window.voiceEngine.setLanguage(language);
    await window.voiceEngine.startSession();

    // Start timer
    callTimerInterval = setInterval(() => {
      callDurationSeconds = Math.floor((Date.now() - callStartTime) / 1000);
      updateDurationDisplay();
    }, 1000);

    // Initial Bot Greeting
    const greeting = window.salesBot.getInitialGreeting();
    appendChatMessage('bot', greeting, '00:01');
    window.salesBot.transcript.push({ speaker: 'bot', text: greeting, time: '00:01' });

    // Speak Greeting
    await window.voiceEngine.speak(greeting);
  });

  // END CALL
  btnEndCall.addEventListener('click', async () => {
    await endActiveCall();
  });

  async function endActiveCall() {
    if (!isCallActive) return;
    isCallActive = false;

    clearInterval(callTimerInterval);
    updateCallStatus('Analyzing Call with AI...');
    setPulseGlow(false);

    // Stop Voice Engine & get recording
    const recordingResult = await window.voiceEngine.stopSession();
    currentRecordingResult = recordingResult;

    // Reset UI buttons
    btnStartCall.classList.remove('hidden');
    btnEndCall.classList.add('hidden');
    btnToggleMute.classList.add('hidden');
    btnToggleSpeaker.classList.add('hidden');

    // Upload Audio Recording if available
    let uploadedAudioUrl = null;
    if (recordingResult && recordingResult.blob) {
      uploadedAudioUrl = await uploadRecordingAudio(recordingResult.blob);
    }

    // Run AI Post-Call Intelligence
    const product = window.productManager.getSelectedProduct();
    const lang = languageSelect.value;
    const analysis = await window.aiAnalytics.analyzeCall(
      window.salesBot.transcript,
      product,
      callDurationSeconds,
      lang
    );

    // Format duration
    const minutes = Math.floor(callDurationSeconds / 60).toString().padStart(2, '0');
    const seconds = (callDurationSeconds % 60).toString().padStart(2, '0');
    const durationFormatted = `${minutes}:${seconds}`;

    // Construct Call Record
    const callRecord = {
      id: 'call_' + Date.now(),
      productId: product.id,
      productName: product.name,
      customerName: customerNameInput.value.trim() || 'Prospective Customer',
      customerCompany: 'Enterprise Prospect',
      customerPhone: '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
      language: lang,
      timestamp: new Date().toISOString(),
      durationSeconds: callDurationSeconds,
      durationFormatted: durationFormatted,
      salesStatus: analysis.salesStatus || window.salesBot.finalStatus || 'Interested',
      sentiment: analysis.sentiment || 'Positive',
      confidenceScore: analysis.confidenceScore || 90,
      summary: analysis.summary,
      requirements: analysis.requirements || [],
      objections: analysis.objections || [],
      nextSteps: analysis.nextSteps || [],
      transcript: window.salesBot.transcript,
      recordingUrl: uploadedAudioUrl || (recordingResult ? recordingResult.url : null),
      recordingConsentGiven: consentCheckbox.checked
    };

    currentCallRecord = callRecord;

    // Save to CRM & Storage
    await window.crmStorage.saveCall(callRecord);
    renderCrmView();
    updateCrmStats();

    updateCallStatus('Call Completed');

    // Show Post-Call Intelligence Modal
    showPostCallModal(callRecord);
  }

  // Upload recording audio to server
  async function uploadRecordingAudio(blob) {
    try {
      const formData = new FormData();
      formData.append('audio', blob, `rec_${Date.now()}.webm`);
      const res = await fetch('/api/recordings', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.recordingUrl) {
          return data.recordingUrl;
        }
      }
    } catch (e) {
      console.warn('Audio upload failed, keeping blob URL:', e);
    }
    return null;
  }

  // Handle Customer Input (voice or text prompt)
  async function handleCustomerInput(text) {
    if (!text || text.trim().length === 0 || !isCallActive) return;

    // Clear any interim element
    removeInterimTranscript();

    const timeStr = getCurrentCallTimestamp();
    appendChatMessage('customer', text, timeStr);
    window.salesBot.transcript.push({ speaker: 'customer', text, time: timeStr });

    // Bot generates response
    updateCallStatus('AI Sales Bot is Thinking...');
    const botResponse = await window.salesBot.generateResponse(text);

    const botTime = getCurrentCallTimestamp();
    appendChatMessage('bot', botResponse, botTime);
    window.salesBot.transcript.push({ speaker: 'bot', text: botResponse, time: botTime });

    // Bot speaks
    await window.voiceEngine.speak(botResponse);

    // Check if conversation concluded
    if (window.salesBot.currentStage === 'ENDED') {
      setTimeout(() => {
        endActiveCall();
      }, 2500);
    }
  }

  // Send Text button & Enter key
  btnSendText.addEventListener('click', () => {
    const text = customerTextInput.value.trim();
    if (text) {
      if (!isCallActive) {
        showToast('Please start the call first!', 'warning');
        return;
      }
      handleCustomerInput(text);
      customerTextInput.value = '';
    }
  });

  customerTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnSendText.click();
    }
  });

  // Mute / Speaker Toggles
  btnToggleMute.addEventListener('click', () => {
    const isMuted = window.voiceEngine.toggleMute();
    btnToggleMute.classList.toggle('active-control', isMuted);
    btnToggleMute.innerHTML = isMuted
      ? '<span class="icon">🔇</span> Mic Muted'
      : '<span class="icon">🎙️</span> Mute Mic';
    showToast(isMuted ? 'Microphone muted' : 'Microphone unmuted', 'info');
  });

  btnToggleSpeaker.addEventListener('click', () => {
    const isMuted = window.voiceEngine.toggleSpeaker();
    btnToggleSpeaker.classList.toggle('active-control', isMuted);
    btnToggleSpeaker.innerHTML = isMuted
      ? '<span class="icon">🔈</span> Bot Muted'
      : '<span class="icon">🔊</span> Bot Audio';
    showToast(isMuted ? 'Bot voice output muted' : 'Bot voice output active', 'info');
  });

  // Chat Feed Helpers
  function appendChatMessage(speaker, text, time) {
    const row = document.createElement('div');
    row.className = `chat-message-row ${speaker === 'bot' ? 'msg-bot' : 'msg-customer'}`;

    const avatar = speaker === 'bot' ? '🤖' : '👤';
    const senderName = speaker === 'bot' ? window.salesBot.product.name + ' AI' : (customerNameInput.value.trim() || 'You');

    row.innerHTML = `
      <div class="msg-avatar">${avatar}</div>
      <div class="msg-content">
        <div class="msg-header">
          <span class="msg-sender">${senderName}</span>
          <span class="msg-time">${time}</span>
        </div>
        <div class="msg-bubble">${escapeHtml(text)}</div>
      </div>
    `;

    chatFeed.appendChild(row);
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  let interimRow = null;
  function updateInterimTranscript(text) {
    if (!interimRow) {
      interimRow = document.createElement('div');
      interimRow.className = 'chat-message-row msg-customer interim-message';
      interimRow.innerHTML = `
        <div class="msg-avatar">👤</div>
        <div class="msg-content">
          <div class="msg-header"><span class="msg-sender">Speaking...</span></div>
          <div class="msg-bubble interim-text">${escapeHtml(text)}</div>
        </div>
      `;
      chatFeed.appendChild(interimRow);
    } else {
      const bubble = interimRow.querySelector('.interim-text');
      if (bubble) bubble.textContent = text;
    }
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  function removeInterimTranscript() {
    if (interimRow) {
      interimRow.remove();
      interimRow = null;
    }
  }

  function getCurrentCallTimestamp() {
    const mins = Math.floor(callDurationSeconds / 60).toString().padStart(2, '0');
    const secs = (callDurationSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  function updateDurationDisplay() {
    if (callDurationDisplay) {
      callDurationDisplay.textContent = getCurrentCallTimestamp();
    }
  }

  // POST-CALL MODAL
  function showPostCallModal(call) {
    postModalProduct.textContent = call.productName;
    postModalDuration.textContent = call.durationFormatted;

    // Set badge style
    postModalStatusBadge.textContent = call.salesStatus;
    postModalStatusBadge.className = `sales-badge status-${call.salesStatus.toLowerCase().replace(/\s+/g, '-')}`;

    postModalSummary.textContent = call.summary || 'Summary unavailable.';

    // Requirements
    postModalRequirements.innerHTML = '';
    (call.requirements || []).forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      postModalRequirements.appendChild(li);
    });

    // Objections
    postModalObjections.innerHTML = '';
    (call.objections || []).forEach(o => {
      const li = document.createElement('li');
      li.textContent = o;
      postModalObjections.appendChild(li);
    });

    // Next Steps
    postModalNextSteps.innerHTML = '';
    (call.nextSteps || []).forEach(n => {
      const li = document.createElement('li');
      li.textContent = n;
      postModalNextSteps.appendChild(li);
    });

    // Audio Player
    if (call.recordingUrl) {
      postModalAudio.src = call.recordingUrl;
      postModalAudio.classList.remove('hidden');
      btnDownloadRecording.classList.remove('hidden');
      btnDownloadRecording.onclick = () => {
        const a = document.createElement('a');
        a.href = call.recordingUrl;
        a.download = `${call.id}_recording.webm`;
        a.click();
      };
    } else {
      postModalAudio.classList.add('hidden');
      btnDownloadRecording.classList.add('hidden');
    }

    postCallModal.classList.add('active');
  }

  btnClosePostModal.addEventListener('click', () => {
    postCallModal.classList.remove('active');
    if (postModalAudio) postModalAudio.pause();
  });

  btnViewInCrm.addEventListener('click', () => {
    postCallModal.classList.remove('active');
    if (postModalAudio) postModalAudio.pause();
    // Switch to CRM view
    const crmTab = document.querySelector('.nav-tab[data-target="view-crm"]');
    if (crmTab) crmTab.click();
  });

  // CRM VIEW RENDERING
  function renderCrmView() {
    const calls = window.crmStorage.getFilteredCalls();

    // Table view
    crmTableBody.innerHTML = '';
    if (calls.length === 0) {
      crmTableBody.innerHTML = `<tr><td colspan="7" class="empty-table">No conversations found matching criteria.</td></tr>`;
    } else {
      calls.forEach(call => {
        const tr = document.createElement('tr');
        const badgeClass = `sales-badge status-${call.salesStatus.toLowerCase().replace(/\s+/g, '-')}`;

        tr.innerHTML = `
          <td>
            <div class="caller-cell">
              <strong>${escapeHtml(call.customerName || 'Anonymous')}</strong>
              <small>${escapeHtml(call.customerCompany || 'N/A')}</small>
            </div>
          </td>
          <td><span class="product-tag">${escapeHtml(call.productName)}</span></td>
          <td><span class="lang-tag">${escapeHtml(call.language || 'English')}</span></td>
          <td>${call.durationFormatted || call.durationSeconds + 's'}</td>
          <td><span class="${badgeClass}">${call.salesStatus}</span></td>
          <td>${new Date(call.timestamp).toLocaleDateString()} ${new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
          <td class="action-cell">
            <button class="btn-table-action btn-inspect" data-id="${call.id}" title="Inspect conversation">🔍 View</button>
            <button class="btn-table-action btn-del" data-id="${call.id}" title="Delete record">🗑️</button>
          </td>
        `;

        tr.querySelector('.btn-inspect').addEventListener('click', () => {
          openCallDetail(call);
        });

        tr.querySelector('.btn-del').addEventListener('click', async (e) => {
          e.stopPropagation();
          if (confirm(`Delete conversation log for ${call.customerName}?`)) {
            await window.crmStorage.deleteCall(call.id);
            renderCrmView();
            updateCrmStats();
            showToast('Call deleted', 'info');
          }
        });

        crmTableBody.appendChild(tr);
      });
    }
  }

  function updateCrmStats() {
    const stats = window.crmStorage.getCallStats();
    if (statTotalCalls) statTotalCalls.textContent = stats.total;
    if (statConversionRate) statConversionRate.textContent = `${stats.conversionRate}%`;
    if (statConverted) statConverted.textContent = stats.converted;
    if (statDemo) statDemo.textContent = stats.demo;
    if (statFollowUp) statFollowUp.textContent = stats.followUp;
    if (statNotInterested) statNotInterested.textContent = stats.notInterested;
  }

  // Filter Pills in CRM
  crmFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      crmFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      window.crmStorage.activeFilter = pill.getAttribute('data-status');
      renderCrmView();
    });
  });

  // Search in CRM
  crmSearchInput.addEventListener('input', () => {
    window.crmStorage.searchQuery = crmSearchInput.value;
    renderCrmView();
  });

  // Language Filter in CRM
  crmLanguageSelect.addEventListener('change', () => {
    window.crmStorage.languageFilter = crmLanguageSelect.value;
    renderCrmView();
  });

  // Export JSON
  btnExportJson.addEventListener('click', () => {
    window.crmStorage.exportToJSON();
    showToast('Exported call history to JSON', 'success');
  });

  // CALL DETAIL MODAL
  function openCallDetail(call) {
    const badgeClass = `sales-badge status-${call.salesStatus.toLowerCase().replace(/\s+/g, '-')}`;

    detailModalContent.innerHTML = `
      <div class="detail-header">
        <div>
          <h2>${escapeHtml(call.customerName)} (${escapeHtml(call.customerCompany || 'N/A')})</h2>
          <div class="detail-sub">${call.productName} • ${call.language} • ${call.durationFormatted} • ${new Date(call.timestamp).toLocaleString()}</div>
        </div>
        <div>
          <span class="${badgeClass}">${call.salesStatus}</span>
        </div>
      </div>

      ${call.recordingUrl ? `
        <div class="detail-card audio-card">
          <h4>🎙️ Call Audio Recording</h4>
          <audio controls src="${call.recordingUrl}" style="width: 100%; margin-top: 8px;"></audio>
        </div>
      ` : `
        <div class="detail-card notice-card">
          <small>ℹ️ Audio file simulated for demonstration dataset or recording storage was bypassed.</small>
        </div>
      `}

      <div class="detail-grid">
        <div class="detail-card">
          <h4>📋 Executive Summary</h4>
          <p>${escapeHtml(call.summary || 'Summary unavailable.')}</p>
        </div>

        <div class="detail-card">
          <h4>🎯 Customer Requirements</h4>
          <ul>
            ${(call.requirements || []).map(r => `<li>${escapeHtml(r)}</li>`).join('') || '<li>None recorded</li>'}
          </ul>
        </div>

        <div class="detail-card">
          <h4>🛡️ Objections Raised & Handled</h4>
          <ul>
            ${(call.objections || []).map(o => `<li>${escapeHtml(o)}</li>`).join('') || '<li>No blocking objections</li>'}
          </ul>
        </div>

        <div class="detail-card">
          <h4>🚀 Next Steps</h4>
          <ul>
            ${(call.nextSteps || []).map(n => `<li>${escapeHtml(n)}</li>`).join('') || '<li>Standard follow up</li>'}
          </ul>
        </div>
      </div>

      <div class="detail-card transcript-section">
        <div class="transcript-header">
          <h4>💬 Complete Conversation Transcript (${(call.transcript || []).length} turns)</h4>
          <button id="btn-print-report" class="btn-secondary btn-sm">🖨️ Export PDF / Print</button>
        </div>
        <div class="transcript-container">
          ${(call.transcript || []).map(t => `
            <div class="dialogue-row ${t.speaker === 'bot' ? 'diag-bot' : 'diag-cust'}">
              <span class="diag-speaker">${t.speaker === 'bot' ? '🤖 AI Bot' : '👤 ' + (call.customerName || 'Customer')}:</span>
              <span class="diag-text">${escapeHtml(t.text)}</span>
              <span class="diag-time">${t.time || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-print-report').addEventListener('click', () => {
      window.crmStorage.exportCallReport(call);
    });

    callDetailModal.classList.add('active');
  }

  btnCloseDetailModal.addEventListener('click', () => {
    callDetailModal.classList.remove('active');
  });

  // CUSTOM PRODUCT FORM SUBMISSION
  if (customProductForm) {
    customProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('new-prod-name').value.trim();
      const tagline = document.getElementById('new-prod-tagline').value.trim();
      const category = document.getElementById('new-prod-category').value.trim();
      const pricing = document.getElementById('new-prod-pricing').value.trim();
      const pitch = document.getElementById('new-prod-pitch').value.trim();
      const featuresRaw = document.getElementById('new-prod-features').value.trim();

      const keyFeatures = featuresRaw.split('\n').map(s => s.trim()).filter(Boolean);

      const created = await window.productManager.addCustomProduct({
        name,
        tagline,
        category,
        pricing,
        pitch,
        keyFeatures
      });

      populateProductSelect();
      productSelect.value = created.id;
      window.productManager.setSelectedProduct(created.id);
      updateProductCard();

      showToast(`Custom SaaS product "${name}" added successfully!`, 'success');
      customProductForm.reset();

      // Switch back to Call Studio
      const studioTab = document.querySelector('.nav-tab[data-target="view-studio"]');
      if (studioTab) studioTab.click();
    });
  }

  // Toast Notifications
  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // Set default prompt pills on load
  updatePromptPillsLanguage('English');
});

// CRM Storage & Call History Management
// Manages: persistent call logs, server sync, local storage backup, filtering, export

class CRMStorage {
  constructor() {
    this.calls = [];
    this.activeFilter = 'ALL';
    this.searchQuery = '';
    this.languageFilter = 'ALL';
    this.loadCalls();
  }

  async loadCalls() {
    try {
      const res = await fetch('/api/calls');
      if (res.ok) {
        const data = await res.json();
        if (data.calls && Array.isArray(data.calls)) {
          this.calls = data.calls;
          this.saveToLocal();
          return this.calls;
        }
      }
    } catch (e) {
      console.warn('Backend /api/calls unavailable, falling back to localStorage', e);
    }

    // LocalStorage fallback
    const local = localStorage.getItem('voxsales_calls');
    if (local) {
      try {
        this.calls = JSON.parse(local);
      } catch (err) {
        this.calls = [];
      }
    }
    return this.calls;
  }

  saveToLocal() {
    try {
      localStorage.setItem('voxsales_calls', JSON.stringify(this.calls));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  async saveCall(callData) {
    // Generate ID if missing
    if (!callData.id) {
      callData.id = 'call_' + Date.now();
    }
    if (!callData.timestamp) {
      callData.timestamp = new Date().toISOString();
    }

    // Try server post
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callData)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.call) {
          this.calls.unshift(data.call);
          this.saveToLocal();
          return data.call;
        }
      }
    } catch (e) {
      console.warn('Could not save call to server, saving locally', e);
    }

    // Local fallback
    this.calls.unshift(callData);
    this.saveToLocal();
    return callData;
  }

  async deleteCall(id) {
    try {
      await fetch(`/api/calls/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Server delete failed', e);
    }
    this.calls = this.calls.filter(c => c.id !== id);
    this.saveToLocal();
    return true;
  }

  getFilteredCalls() {
    return this.calls.filter(c => {
      // Status filter
      if (this.activeFilter !== 'ALL' && c.salesStatus !== this.activeFilter) {
        return false;
      }
      // Language filter
      if (this.languageFilter !== 'ALL' && c.language !== this.languageFilter) {
        return false;
      }
      // Search query
      if (this.searchQuery && this.searchQuery.trim().length > 0) {
        const q = this.searchQuery.toLowerCase().trim();
        const str = [
          c.productName,
          c.customerName,
          c.customerCompany,
          c.salesStatus,
          c.summary,
          c.language
        ].filter(Boolean).join(' ').toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }

  getCallStats() {
    const total = this.calls.length;
    const converted = this.calls.filter(c => c.salesStatus === 'Converted').length;
    const demo = this.calls.filter(c => c.salesStatus === 'Demo Requested').length;
    const interested = this.calls.filter(c => c.salesStatus === 'Interested').length;
    const followUp = this.calls.filter(c => c.salesStatus === 'Follow-up Required').length;
    const notInterested = this.calls.filter(c => c.salesStatus === 'Not Interested').length;
    const noResponse = this.calls.filter(c => c.salesStatus === 'No Response').length;

    const conversionRate = total > 0 ? Math.round(((converted + demo) / total) * 100) : 0;

    return {
      total,
      converted,
      demo,
      interested,
      followUp,
      notInterested,
      noResponse,
      conversionRate
    };
  }

  exportToJSON() {
    const jsonStr = JSON.stringify(this.calls, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voxsales_call_history_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  exportCallReport(call) {
    const printWindow = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Call Report - ${call.customerName || 'Lead'}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
          h1 { color: #4338ca; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; text-transform: uppercase; background: #e0e7ff; color: #3730a3; }
          .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; }
          .section { margin: 24px 0; }
          .section-title { font-weight: 700; color: #0f172a; border-left: 4px solid #6366f1; padding-left: 8px; margin-bottom: 10px; }
          .transcript-box { background: #f1f5f9; padding: 16px; border-radius: 8px; font-size: 14px; }
          .transcript-item { margin-bottom: 10px; }
          .speaker-bot { color: #4f46e5; font-weight: 600; }
          .speaker-cust { color: #0f172a; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>VoxSales AI - Sales Conversation Report</h1>
        <div class="meta">
          <div><strong>Product:</strong> ${call.productName}</div>
          <div><strong>Sales Status:</strong> <span class="badge">${call.salesStatus}</span></div>
          <div><strong>Customer:</strong> ${call.customerName || 'Anonymous'} (${call.customerCompany || 'N/A'})</div>
          <div><strong>Language:</strong> ${call.language}</div>
          <div><strong>Call Duration:</strong> ${call.durationFormatted || call.durationSeconds + 's'}</div>
          <div><strong>Timestamp:</strong> ${new Date(call.timestamp).toLocaleString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Executive AI Summary</div>
          <p>${call.summary || 'N/A'}</p>
        </div>

        <div class="section">
          <div class="section-title">Customer Requirements</div>
          <ul>
            ${(call.requirements || []).map(r => `<li>${r}</li>`).join('') || '<li>No specific requirements identified</li>'}
          </ul>
        </div>

        <div class="section">
          <div class="section-title">Objections Identified & Handled</div>
          <ul>
            ${(call.objections || []).map(o => `<li>${o}</li>`).join('') || '<li>No blocking objections</li>'}
          </ul>
        </div>

        <div class="section">
          <div class="section-title">Recommended Next Steps</div>
          <ul>
            ${(call.nextSteps || []).map(n => `<li>${n}</li>`).join('') || '<li>Follow up with lead</li>'}
          </ul>
        </div>

        <div class="section">
          <div class="section-title">Full Conversation Transcript</div>
          <div class="transcript-box">
            ${(call.transcript || []).map(t => `
              <div class="transcript-item">
                <span class="${t.speaker === 'bot' ? 'speaker-bot' : 'speaker-cust'}">[${t.time || ''}] ${t.speaker === 'bot' ? 'AI Bot' : 'Customer'}:</span>
                ${t.text}
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }
}

// Global instance
window.crmStorage = new CRMStorage();

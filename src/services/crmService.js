const axios = require('axios');

// ⚠️ Safety Check: Warn in the console if environment variables are missing
if (!process.env.CRM_BASE_URL) {
  console.warn("⚠️ [CRM Service] CRM_BASE_URL is not defined in .env! Using local mock URL fallback.");
}
if (!process.env.QUALITY_BASE_URL) {
  console.warn("⚠️ [CRM Service] QUALITY_BASE_URL is not defined in .env! Using local mock URL fallback.");
}

// Safely fall back to a local URL so developers don't accidentally hit production databases if their .env is missing
const CRM_BASE_URL = process.env.CRM_BASE_URL || 'http://localhost:3000/mock-crm-api';
const QUALITY_BASE_URL = process.env.QUALITY_BASE_URL || 'http://localhost:3000/mock-quality-api';
const CRM_TIMEOUT = Number(process.env.CRM_TIMEOUT) || 15000;

class CRMService {
  
  /**
   * ─── METHOD 1: FETCH LIST OF QUERIES ───
   */
  async getQueries(targetDate) {
    try {
      console.log(`🔌 [CRM Service] Fetching REAL petition list for date: ${targetDate}`);
      
      // Added encodeURIComponent to safely handle any spaces or special characters in the date
      const safeDate = encodeURIComponent(targetDate);
      const listUrl = `${CRM_BASE_URL}/public-query?date=${safeDate}&limit=1000`;
      
      const response = await axios.get(listUrl, {
        headers: { 'Accept': 'application/json' },
        timeout: CRM_TIMEOUT
      });

      return response.data?.data || response.data || [];

    } catch (error) {
      console.error(`🔴 CRM Service Error [getQueries]:`, error.message);
      
      // Preserve the upstream message and HTTP status code
      const err = new Error(error.response?.data?.message || error.message || "Failed to fetch CRM queries.");
      err.status = error.response?.status || 500;
      throw err;
    }
  }

  /**
   * ─── METHOD 2: FETCH CHAT TRANSCRIPT ───
   */
  async fetchChat(petitionId) {
    try {
      console.log(`🔌 [CRM Service] Fetching chat transcript for Petition: ${petitionId}`);

      // Encode the petition ID just in case it contains unusual characters
      const fallbackUrl = `${CRM_BASE_URL}/public-query/${encodeURIComponent(petitionId)}`;

      const response = await axios.get(fallbackUrl, {
        headers: { 'Accept': 'application/json' },
        timeout: CRM_TIMEOUT 
      });

      const rawData = response.data;
      let chatMessages = [];

      // Data Normalization: Safely handles different potential API response structures
      if (rawData?.data?.messages && Array.isArray(rawData.data.messages)) {
        chatMessages = rawData.data.messages;
      } else if (rawData?.messages && Array.isArray(rawData.messages)) {
        chatMessages = rawData.messages;
      } else if (rawData?.data?.transcript && Array.isArray(rawData.data.transcript)) {
        chatMessages = rawData.data.transcript;
      } else if (Array.isArray(rawData)) {
        chatMessages = rawData;
      } else if (rawData?.data && Array.isArray(rawData.data)) {
        chatMessages = rawData.data; 
      }

      if (chatMessages.length === 0) {
        console.warn(`⚠️ [CRM Service] Connected, but no messages found for petition: ${petitionId}`);
      }

      return {
        petitionId: petitionId,
        messages: chatMessages
      };

    } catch (error) {
      console.error(`🔴 CRM Service Error [fetchChat] for ${petitionId}:`, error.message);
      
      const err = new Error(error.response?.data?.message || `Failed to fetch conversation for ${petitionId}`);
      err.status = error.response?.status || 500;
      throw err;
    }
  }

  /**
   * ─── METHOD 3: EVALUATE GRAMMAR ───
   */
  async evaluateGrammar(petitionId, payload) {
    try {
      console.log(`🔌 [CRM Service] Triggering grammar evaluation for Petition: ${petitionId}`);
      
      const grammarUrl = `${QUALITY_BASE_URL}/quality-monitoring/observations/evaluate-grammar/${encodeURIComponent(petitionId)}`;
      
      const response = await axios.post(
        grammarUrl, 
        payload || {}, 
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          timeout: CRM_TIMEOUT
        }
      );

      return response.data;

    } catch (error) {
      console.error(`🔴 CRM Service Error [evaluateGrammar]:`, error.message);
      
      const err = new Error(error.response?.data?.message || "Grammar evaluation failed.");
      err.status = error.response?.status || 500;
      throw err;
    }
  }

  /**
   * ─── METHOD 4: FETCH EMPLOYEES (BFF PROXY) ───
   */
  async getEmployees(authToken) {
    try {
      console.log(`🔌 [CRM Service] Proxying request to fetch employees...`);
      
      const url = `${QUALITY_BASE_URL}/quality-monitoring/employees`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          // ✨ Forward the exact JWT token from the frontend if it exists
          ...(authToken && { 'Authorization': authToken }) 
        },
        timeout: CRM_TIMEOUT
      });

      return response.data;
    } catch (error) {
      console.error(`🔴 CRM Service Error [getEmployees]:`, error.message);
      
      // ✨ Preserve exact upstream HTTP status and message
      const err = new Error(error.response?.data?.message || "Failed to fetch employees from Quality backend.");
      err.status = error.response?.status || 500;
      throw err;
    }
  }

  /**
   * ─── METHOD 5: FETCH CENTERS (BFF PROXY) ───
   */
  async getCenters(authToken) {
    try {
      console.log(`🔌 [CRM Service] Proxying request to fetch centers...`);
      
      const url = `${QUALITY_BASE_URL}/quality-monitoring/centers`;
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          ...(authToken && { 'Authorization': authToken }) 
        },
        timeout: CRM_TIMEOUT
      });

      return response.data;
    } catch (error) {
      console.error(`🔴 CRM Service Error [getCenters]:`, error.message);
      
      const err = new Error(error.response?.data?.message || "Failed to fetch centers from Quality backend.");
      err.status = error.response?.status || 500;
      throw err;
    }
  }
/**
   * ─── METHOD: FETCH BATCH AI AUDIT STATUS (BFF PROXY) ───
   */
  async getBatchEvaluateStatus(authToken, payload) {
    try {
      console.log(`🔌 [CRM Service] Proxying batch evaluate status request...`);
      
      const url = `${QUALITY_BASE_URL}/quality-monitoring/observations/evaluate-status/batch`;
      
      // Using POST to handle arrays of IDs in the payload body
      const response = await axios.post(url, payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': authToken }) 
        },
        timeout: CRM_TIMEOUT
      });

      return response.data;
    } catch (error) {
      console.error(`🔴 CRM Service Error [getBatchEvaluateStatus]:`, error.message);
      const err = new Error(error.response?.data?.message || "Failed to fetch batch evaluate status.");
      err.status = error.response?.status || 500;
      throw err;
    }
  }
  
}

module.exports = new CRMService();
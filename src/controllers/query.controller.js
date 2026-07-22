const crmService = require('../services/crmService');

// ==========================================
// 1. Fetch List of Queries
// ==========================================
const getQueries = async (req, res, next) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    const tickets = await crmService.getQueries(targetDate);
    
    return res.status(200).json({
      success: true,
      count: tickets?.length || 0,
      data: tickets 
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// 2. Fetch Specific Petition Details
// ==========================================
const getQueryDetails = async (req, res, next) => {
  try {
    const { petitionId } = req.params;

    if (!petitionId) {
      return res.status(400).json({
        success: false,
        message: "Petition ID is required."
      });
    }

    // 🛠️ Calling fetchChat() correctly based on your CRMService
    const ticketDetails = await crmService.fetchChat(petitionId);

    if (!ticketDetails) {
      return res.status(404).json({
        success: false,
        message: `No details found for petition ID: ${petitionId}`
      });
    }

    return res.status(200).json({
      success: true,
      data: ticketDetails
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.message
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  getQueries,
  getQueryDetails
};
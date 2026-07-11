class ApiResponse {
  constructor(statusCode, message = 'Success', data = null) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
    this.error = null;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      error: this.error
    });
  }
}

module.exports = ApiResponse;
class ApiError extends Error {
  stack = "";
  constructor(statuscode, message = "soemthing wenst wronge ", stack) {
    super(message);
    this.statuscode = statuscode;
    this.data = null;
    this.message = message;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this,this.constructor);
    }
  }
}


export  {ApiError}
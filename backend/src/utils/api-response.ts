export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;

  constructor(success: boolean, message: string, data?: T, error?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Helper to return a successful API response wrapper.
   */
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data);
  }

  /**
   * Helper to return an error API response wrapper.
   */
  static error<T>(message: string, error?: string): ApiResponse<T> {
    return new ApiResponse<T>(false, message, undefined, error);
  }
}

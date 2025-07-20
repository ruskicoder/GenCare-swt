import { Request, Response, NextFunction } from 'express';
import { errorHandler, isAuthenticated } from '../../middlewares/errorHandler';

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };
    nextFunction = jest.fn();
  });

  it('should handle error and return 500 status', () => {
    const error = new Error('Test error');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Lỗi hệ thống'
    });
  });

  it('should include error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Test error message');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Lỗi hệ thống',
      error: 'Test error message'
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should not include error message in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Secret error message');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Lỗi hệ thống'
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should call next if headers already sent', () => {
    const error = new Error('Test error');
    mockResponse.headersSent = true;
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalledWith(error);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});

describe('isAuthenticated', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  it('should call next if user is authenticated', () => {
    mockRequest.isAuthenticated = jest.fn().mockReturnValue(true);
    
    isAuthenticated(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated', () => {
    mockRequest.isAuthenticated = jest.fn().mockReturnValue(false);
    
    isAuthenticated(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if isAuthenticated method does not exist', () => {
    mockRequest.isAuthenticated = undefined;
    
    isAuthenticated(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
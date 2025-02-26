import { JadeAPI } from '../../src/jade-api';  // Import the JadeAPI class
import { IJade, RPCRequest, RPCResponse } from '../../src/types';  // Import the IJade, RPCRequest, and RPCResponse interfaces


const createMockIJade = (): IJade => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  // buildRequest returns a basic object with id, method, and params.
  buildRequest: jest.fn((id: string, method: string, params?: any): RPCRequest => ({
    id,
    method,
    params,
  })),
  makeRPCCall: jest.fn(),
});


describe('JadeAPI - Constructor', () => {
  it('should throw an error if no IJade instance is provided', () => {
    // @ts-ignore: intentional to test missing dependency
    expect(() => new JadeAPI(undefined)).toThrowError(/valid JadeInterface instance/);
  });

  it('should initialize correctly with a valid IJade instance', () => {
    const mockJade = createMockIJade();
    const jadeApi = new JadeAPI(mockJade);
    expect(jadeApi).toBeInstanceOf(JadeAPI);
  });
});

describe('JadeAPI - Basic Method Calls', () => {
  let mockJade: IJade;
  let jadeApi: JadeAPI;
  let buildRequestMock: jest.Mock;
  let makeRPCCallMock: jest.Mock;

  beforeEach(() => {
    mockJade = createMockIJade();
    // Grab the mocks so we can inspect their calls
    buildRequestMock = mockJade.buildRequest as jest.Mock;
    makeRPCCallMock = mockJade.makeRPCCall as jest.Mock;
    jadeApi = new JadeAPI(mockJade);
  });

  it('ping() should call jadeRpc with "ping" and return expected result', async () => {
    const expectedResult = 42;
    // When jadeRpc is called, simulate a reply with { result: expectedResult }
    makeRPCCallMock.mockResolvedValue({ result: expectedResult });

    const result = await jadeApi.ping();

    // Verify that buildRequest was called with the method 'ping'
    expect(buildRequestMock).toHaveBeenCalled();
    const firstCallArgs = buildRequestMock.mock.calls[0];
    expect(firstCallArgs[1]).toBe('ping'); // method argument

    // Verify that makeRPCCall was called with the request (which includes method 'ping')
    expect(makeRPCCallMock).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'ping' }),
      false
    );
    // Verify that ping() returns the expected value
    expect(result).toEqual(expectedResult);
  });

  it('getVersionInfo() should pass nonblocking parameter when true', async () => {
    const fakeVersionInfo = { firmware: '1.2.3', api: '4.5.6' };
    makeRPCCallMock.mockResolvedValue({ result: fakeVersionInfo });

    const result = await jadeApi.getVersionInfo(true);

    // Check that buildRequest was called with the nonblocking parameter
    expect(buildRequestMock).toHaveBeenCalledWith(
      expect.any(String),
      'get_version_info',
      { nonblocking: true }
    );
    expect(result).toEqual(fakeVersionInfo);
  });

  it('logout() should call jadeRpc with "logout" and return expected result', async () => {
    const logoutResponse = true;
    makeRPCCallMock.mockResolvedValue({ result: logoutResponse });

    const result = await jadeApi.logout();

    expect(buildRequestMock).toHaveBeenCalledWith(
      expect.any(String),
      'logout',
      undefined
    );
    expect(makeRPCCallMock).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'logout' }),
      false
    );
    expect(result).toEqual(logoutResponse);
  });
});

describe('JadeAPI - Error Handling', () => {
  let mockJade: IJade;
  let jadeApi: JadeAPI;
  let buildRequestMock: jest.Mock;
  let makeRPCCallMock: jest.Mock;

  beforeEach(() => {
    mockJade = createMockIJade();
    buildRequestMock = mockJade.buildRequest as jest.Mock;
    makeRPCCallMock = mockJade.makeRPCCall as jest.Mock;
    jadeApi = new JadeAPI(mockJade);
  });

  it('should propagate errors when jadeRpc (makeRPCCall) rejects', async () => {
    const testError = new Error('Device not connected');
    makeRPCCallMock.mockRejectedValue(testError);

    await expect(jadeApi.ping()).rejects.toThrow('Device not connected');
  });

  it('should throw an error if reply contains an error object', async () => {
    const errorResponse = { error: { code: 123, message: 'Unauthorized' } };
    makeRPCCallMock.mockResolvedValue(errorResponse);

    await expect(jadeApi.getVersionInfo()).rejects.toThrow(
      'RPC Error 123: Unauthorized'
    );
  });
});

describe('JadeAPI - HTTP Request Flow', () => {
  let mockJade: IJade;
  let jadeApi: JadeAPI;
  let buildRequestMock: jest.Mock;
  let makeRPCCallMock: jest.Mock;

  beforeEach(() => {
    mockJade = createMockIJade();
    buildRequestMock = mockJade.buildRequest as jest.Mock;
    makeRPCCallMock = mockJade.makeRPCCall as jest.Mock;
    jadeApi = new JadeAPI(mockJade);
  });

  it('should handle an HTTP request flow and return the final result', async () => {
    // Simulate the first response containing an http_request field.
    const firstResponse = {
      result: {
        http_request: {
          'on-reply': 'ping',
          params: { some: 'data' },
        },
      },
    };
    // Simulate the final response.
    const finalResponse = { result: 'final_result' };

    // Set up makeRPCCall: first call returns firstResponse, second returns finalResponse.
    makeRPCCallMock
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(finalResponse);

    // Create a mock HTTP request function that returns a dummy response.
    const httpRequestFn = jest.fn().mockResolvedValue({ body: 'final_body' });

    // Call the private jadeRpc method directly to test the recursive HTTP flow.
    const result = await (jadeApi as any).jadeRpc('ping', undefined, undefined, false, httpRequestFn);

    expect(result).toEqual('final_result');
    expect(httpRequestFn).toHaveBeenCalledWith({ some: 'data' });
    // Ensure that buildRequest and makeRPCCall were each called twice.
    expect(buildRequestMock).toHaveBeenCalledTimes(2);
    expect(makeRPCCallMock).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if HTTP request function is not provided but needed', async () => {
    // Simulate a response that requires an HTTP request.
    const firstResponse = {
      result: {
        http_request: {
          'on-reply': 'ping',
          params: { some: 'data' },
        },
      },
    };
    makeRPCCallMock.mockResolvedValue(firstResponse);

    // Call the private jadeRpc method without providing the HTTP request function.
    await expect(
      (jadeApi as any).jadeRpc('ping')
    ).rejects.toThrow('HTTP request function not provided');
  });
});






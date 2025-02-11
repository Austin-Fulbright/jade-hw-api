import { JadeAPI } from '../src/jade-api';
import { JadeInterface } from '../src/jade-interface';


describe('JadeAPI Unit Tests', () => {
    // Create a fake JadeInterface with jest.fn() mocks
    const fakeInterface: Partial<JadeInterface> = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      buildRequest: jest.fn((id: string, method: string, params?: any) => ({ id, method, params })),
      makeRPCCall: jest.fn().mockResolvedValue({ id: '123', result: { status: 'ok' } }),
    };
  
    let api: JadeAPI;
  
    beforeEach(() => {
      // Typecast fakeInterface to JadeInterface (it only needs the methods we use)
      api = new JadeAPI(fakeInterface as JadeInterface);
    });
  
    test('connect calls underlying interface connect', async () => {
      await api.connect();
      expect(fakeInterface.connect).toHaveBeenCalled();
    });
  
    test('ping returns correct result', async () => {
      // Assume that jadeRpc will resolve with { status: 'ok' }
      const result = await api.ping();
      // Adjust expectation according to your protocol (here we expect status)
      expect(result).toEqual({ status: 'ok' });
      expect(fakeInterface.makeRPCCall).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'ping' })
      );
    });
  
    test('getVersionInfo returns correct result', async () => {
      const result = await api.getVersionInfo();
      expect(result).toEqual({ status: 'ok' });
      expect(fakeInterface.makeRPCCall).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'get_version_info' })
      );
    });
  });
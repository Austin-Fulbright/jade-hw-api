// jade-interface.ts
import { EventEmitter } from 'events';
import { ISerialPort } from './serial';
import { RPCRequest, RPCResponse } from './types';

export class JadeInterface extends EventEmitter {
  private impl: ISerialPort;

  constructor(impl: ISerialPort) {
    super();
    if (!impl) throw new Error('A serial/ble implementation is required');
    this.impl = impl;
  }

  async connect(): Promise<void> {
    return this.impl.connect();
  }

  async disconnect(): Promise<void> {
    return this.impl.disconnect();
  }

  buildRequest(id: string, method: string, params?: any): RPCRequest {
    return { id, method, params };
  }

  async makeRPCCall(request: RPCRequest, long_timeout: boolean = false): Promise<RPCResponse> {
    // Validate request fields
    if (!request.id || request.id.length > 16) {
      throw new Error('Request id must be non-empty and less than 16 characters');
    }
    if (!request.method || request.method.length > 32) {
      throw new Error('Request method must be non-empty and less than 32 characters');
    }
    
    // Send the RPC message (encoded as CBOR)
    await this.impl.sendMessage(request);
    
    return new Promise<RPCResponse>((resolve, reject) => {
      const onResponse = (msg: RPCResponse) => {
        if (msg && msg.id === request.id) {
          this.impl.removeListener('message', onResponse);
          if (timeoutId) clearTimeout(timeoutId);
          resolve(msg);
        }
      };
      this.impl.onMessage(onResponse);
      
      // If not a long timeout, set a timeout to reject the promise
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      if (!long_timeout) {
        timeoutId = setTimeout(() => {
          this.impl.removeListener('message', onResponse);
          reject(new Error('RPC call timed out'));
        }, 5000); // 5000 milliseconds timeout
      }
    });
  }
}
  

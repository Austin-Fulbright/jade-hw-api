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

  async makeRPCCall(request: RPCRequest, timeout?: number): Promise<RPCResponse> {
    // (Optional) Validate request fields:
    if (!request.id || request.id.length > 16) {
      throw new Error('Request id must be non-empty and less than 16 characters');
    }
    if (!request.method || request.method.length > 32) {
      throw new Error('Request method must be non-empty and less than 32 characters');
    }
    await this.impl.sendMessage(request);
    return new Promise<RPCResponse>((resolve, reject) => {
      const onResponse = (msg: RPCResponse) => {
        if (msg && msg.id === request.id) {
          this.impl.removeListener('message', onResponse);
          resolve(msg);
        }
      };
      this.impl.onMessage(onResponse);
    });
  }
}

import EventEmitter from "events";
export interface RPCRequest {
    id: string;
    method: string;
    params?: any;
  };
  
export interface RPCResponse {
    id: string;
    result?: any;
    error?: {
      code: number;
      message: string;
      data?: any;
    };
  };
  

export interface SerialPortOptions {
    device?: string;
    baudRate?: number;
    timeout?: number;
};

export interface IDevice extends EventEmitter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(message: any): Promise<void>;
  onMessage(callback: (message: any) => void): void;
};


export interface BitcoinMultisig {


};

export interface IJade {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  buildRequest(id: string, method: string, params?: any): RPCRequest;
  makeRPCCall(request: RPCRequest, long_timeout: boolean): Promise<RPCResponse>;
};
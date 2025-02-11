

export interface RPCRequest {
    id: string;
    method: string;
    params?: any;
  }
  
export interface RPCResponse {
    id: string;
    result?: any;
    error?: {
      code: number;
      message: string;
      data?: any;
    };
  }
  

export interface SerialPortOptions {
    device?: string;
    baudRate?: number;
    timeout?: number;
}

import { EventEmitter } from 'events';
import net from 'net';
import { encode, decode } from 'cbor2';
import { IDevice } from './types';

export class TcpDevice extends EventEmitter implements IDevice {
  private device: string;
  private timeout: number;
  private socket: net.Socket | null = null;
  private receivedBuffer: Buffer = Buffer.alloc(0);

  constructor(device: string, timeout: number = 5000) {
    super();
    if (!device.startsWith('tcp:')) {
      throw new Error("Device must start with 'tcp:'");
    }
    this.device = device;
    this.timeout = timeout;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deviceStr = this.device.slice('tcp:'.length);
      const [host, portStr] = deviceStr.split(':');
      const port = parseInt(portStr, 10);

      this.socket = new net.Socket();
      this.socket.setTimeout(this.timeout);

      this.socket.connect(port, host, () => {
        this.socket!.on('data', (data: Buffer) => {
          this.receivedBuffer = Buffer.concat([this.receivedBuffer, data]);
          this.processReceivedData();
        });
        resolve();
      });

      this.socket.on('error', (err) => {
        reject(err);
      });

      this.socket.on('timeout', () => {
        reject(new Error('TCP connection timed out'));
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.end(() => {
          this.socket!.destroy();
          this.socket = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async sendMessage(message: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not connected'));
      }
      try {
        const encoded = encode(message);
        this.socket.write(encoded, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(callback: (message: any) => void): void {
    this.on('message', callback);
  }

  /**
   * Processes the accumulated data in the received buffer.
   * Attempts to decode slices of the buffer as CBOR messages.
   * If a valid message (containing one of the expected keys) is decoded,
   * it is emitted as a 'message' event.
   */
  private processReceivedData(): void {
    let index = 1;
    while (index <= this.receivedBuffer.length) {
      try {
        const sliceToTry = this.receivedBuffer.slice(0, index);
        const decoded = decode(sliceToTry);
        if (
          decoded &&
          typeof decoded === 'object' &&
          (('error' in decoded) ||
            ('result' in decoded) ||
            ('log' in decoded) ||
            ('method' in decoded))
        ) {
          this.emit('message', decoded);
        } else {
          console.warn('[TcpDevice] Decoded message missing expected keys:', decoded);
        }
        // Remove processed bytes from the buffer.
        this.receivedBuffer = this.receivedBuffer.slice(index);
        index = 1;
      } catch (error: any) {
        if (
          error.message &&
          (error.message.includes('Offset is outside') ||
            error.message.includes('Insufficient data') ||
            error.message.includes('Unexpected end of stream'))
        ) {
          index++;
          if (index > this.receivedBuffer.length) {
            break;
          }
        } else {
          console.error('[TcpDevice] CBOR decode error:', error);
          this.receivedBuffer = Buffer.alloc(0);
          break;
        }
      }
    }
  }
}

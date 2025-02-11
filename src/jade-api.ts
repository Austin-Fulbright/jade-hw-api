// jade-api.ts
import { JadeInterface } from './jade-interface';

export class JadeAPI {
  private iface: JadeInterface;

  constructor(iface: JadeInterface) {
    if (!iface) throw new Error('A valid JadeInterface instance is required');
    this.iface = iface;
  }

  static createSerial(device?: string, baudRate: number = 115200, timeout?: number): JadeAPI {
    const { WebSerialPort } = require('./serial');
    const options = { device, baudRate, timeout };
    const serial = new WebSerialPort(options);
    const iface = new JadeInterface(serial);
    return new JadeAPI(iface);
  }

  async connect(): Promise<void> {
    return this.iface.connect();
  }

  async disconnect(): Promise<void> {
    return this.iface.disconnect();
  }

  private async jadeRpc(method: string, params?: any, id?: string): Promise<any> {
    const requestId = id || Math.floor(Math.random() * 1000000).toString();
    const request = this.iface.buildRequest(requestId, method, params);
    const reply = await this.iface.makeRPCCall(request);
    if (reply.error) {
      throw new Error(`RPC Error ${reply.error.code}: ${reply.error.message}`);
    }
    return reply.result;
  }

  // Public API methods


  //basic RPC

  ping(): Promise<number> {
    return this.jadeRpc('ping');
  }

  getVersionInfo(nonblocking: boolean = false): Promise<any> {
    const params = nonblocking ? { nonblocking: true } : undefined;
    return this.jadeRpc('get_version_info', params);
  }

  logout(): Promise<boolean> {
    return this.jadeRpc('logout');
  }

  //wallet management
  addEntropy(entropy: any): Promise<any> {
    const params = { entropy };
    return this.jadeRpc('add_entropy', params);
  }

  setEpoch(epoch?: number): Promise<any> {
    const params = { epoch: epoch !== undefined ? epoch : Math.floor(Date.now() / 1000) };
    return this.jadeRpc('set_epoch', params);
  }

  setMnemonic(mnemonic: string, passphrase?: string, temporaryWallet: boolean = false): Promise<boolean> {
    const params = { mnemonic, passphrase, temporary_wallet: temporaryWallet };
    return this.jadeRpc('set_mnemonic', params);
  }

  setSeed(seed: Uint8Array): Promise<boolean> {
    const params = { seed };
    return this.jadeRpc('set_seed', params);
  }

  //camera

  //advanced wallet operations







}

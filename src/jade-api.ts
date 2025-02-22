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

  private async jadeRpc(
    method: string,
    params?: any,
    id?: string,
    long_timeout: boolean = false,
    http_request_fn?: (params: any) => Promise<{ body: any }>
  ): Promise<any> {
    const requestId = id || Math.floor(Math.random() * 1000000).toString();
    const request = this.iface.buildRequest(requestId, method, params);
    const reply = await this.iface.makeRPCCall(request, long_timeout);
    
    if (reply.error) {
      throw new Error(`RPC Error ${reply.error.code}: ${reply.error.message}`);
    }
    if (reply.result &&
        typeof reply.result === 'object' &&
        'http_request' in reply.result) {
      
      if (!http_request_fn) {
        throw new Error('HTTP request function not provided');
      }
      
      const httpRequest = reply.result['http_request'];
      const httpResponse = await http_request_fn(httpRequest['params']);
      return this.jadeRpc(
        httpRequest['on-reply'],
        httpResponse['body'],
        undefined,
        long_timeout,
        http_request_fn
      );
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

  runRemoteSelfCheck(): Promise<Number> {

    return this.jadeRpc('debug_selfcheck', undefined, undefined, true);
  }

  

  //camera

  captureImageData(check_qr: boolean = false): Promise<any> {
    const params = { check_qr };
    return this.jadeRpc('debug_capture_image_data', params);
  }

  scanQR(image: any): Promise<any> {

    const params = {'image': image};
    return this.jadeRpc('debug_scan_qr', params);

  }

  //advanced wallet operations

  cleanReset(): Promise<boolean> {

    return this.jadeRpc('debug_clean_reset');
  }

  getbip85bip39Entropy(num_words: number, index: number, pubkey: any): Promise<any>{
    const params = {num_words, index, pubkey};
    return this.jadeRpc('get_bip85_bip39_entropy', params);
  }

  getbip85rsaEntropy(key_bits: number, index: number, pubkey: any): Promise<any>{

    const params = {key_bits, index, pubkey};
    return this.jadeRpc('get_bip85_rsa_entropy', params);
  }

  setPinserver(urlA?: string, urlB?: string, pubkey?: Uint8Array, cert?: Uint8Array): Promise<boolean> {
    const params: any = {};
    if (urlA !== undefined || urlB !== undefined) {
      params['urlA'] = urlA;
      params['urlB'] = urlB;
    }
    if (pubkey !== undefined) {
      params['pubkey'] = pubkey;
    }
    if (cert !== undefined) {
      params['certificate'] = cert;
    }
    return this.jadeRpc('update_pinserver', params);
  }


  resetPinserver(reset_details: boolean, reset_certificate: boolean): Promise<boolean> {
    const params = { reset_details, reset_certificate };
    return this.jadeRpc('update_pinserver', params);
  }

  authUser(
    network: string,
    http_request_fn?: (params: any) => Promise<{ body: any }>,
    epoch?: number
  ): Promise<boolean> {
    const params = {
      network,
      epoch: epoch !== undefined ? epoch : Math.floor(Date.now() / 1000)
    };
    return this.jadeRpc('auth_user', params, undefined, true, http_request_fn);
  }

  registerOtp(otp_name: string, otp_uri: string): Promise<boolean>{
    const params = {name: otp_name, uri: otp_uri};
    return this.jadeRpc('register_otp', params);
  }

  getOtpCode(otp_name: string, value_override?: number): Promise<number> {
    const params: any = { name: otp_name };
    if (value_override !== undefined) {
      params.override = value_override;
    }
    return this.jadeRpc('get_otp_code', params);
  }


  getXpub(network: string, path: number[]): Promise<any>{
    const params = {network, path};
    return this.jadeRpc('get_xpub', params);
  }

  getRegisteredMultisigs(): Promise<any>{
    return this.jadeRpc('get_registered_multisigs');
  }

  getRegisteredMultisig(multisig_name: string, as_file: boolean = false): Promise<any> {
    const params = {
      multisig_name,
      as_file
    }
    return this.jadeRpc('get_registered_multisig', params);
  }

  registerMultisig(network: string, multisig_name: string, variant: string, sorted_keys: boolean, threshold: number, signers: any, master_blinding_key?: any): Promise<boolean>{

    const params = {
      network,
      multisig_name,
      descriptor: {
        variant,
        sorted: sorted_keys,
        threshold,
        signers,
        master_blinding_key: master_blinding_key != undefined ? master_blinding_key : null
      }
    };

    return this.jadeRpc('register_multisig', params);
  }

  getRootFingerprint(): Promise<string> {
    // Return a dummy fingerprint value (8 hexadecimal characters)
    return Promise.resolve("DEADBEEF");
  }

  signPSBT(network: string, psbt: any): Promise<any> {

    const params = {
      network, psbt
    }

    return this.jadeRpc('sign_psbt', params);
  }
}

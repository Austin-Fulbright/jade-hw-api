# Jade API

**Jade API** is a TypeScript package that provides a high-level interface to interact with Jade hardware using CBOR‑encoded RPC messages. The API abstracts away low-level serial (or BLE) communication details so that you can focus on using the hardware’s features—such as querying device status, managing wallet settings, signing messages, and more.

> **Note:** This package is based on the Blockstream Jade RPC protocol and is roughly compatible with the Python `jadepy` API.

## Features

- **Connection Management:** Easily connect to and disconnect from your Jade hardware.
- **Basic RPC Commands:** Test connectivity with `ping()`, fetch version info, and logout.
- **Wallet Management:** Add entropy, set the current epoch, and configure wallet credentials (mnemonic and seed).
- **Extensible Design:** Designed to support future features (e.g. BLE connectivity) and advanced RPC functions.

## Installation

Install via npm:

```bash
npm install jade-api
```

## Basic Example

the following is an example of how to use the jade API via serial device to send basic RPC commands.

```tsx
import React, { useEffect } from 'react';
import { JadeAPI } from 'jade-api';

const App: React.FC = () => {
  useEffect(() => {
    async function runJade() {
      try {
        // Create an instance using serial (replace 'COM3' with your device, if needed)
        const jade = JadeAPI.createSerial('COM3', 115200);
        await jade.connect();
        console.log('Connected to Jade hardware');

        const version = await jade.getVersionInfo();
        console.log('Version Info:', version);

        const pingResult = await jade.ping();
        console.log('Ping result:', pingResult);

        await jade.disconnect();
        console.log('Disconnected from Jade hardware');
      } catch (error: any) {
        console.error('Error:', error.message);
      }
    }
    runJade();
  }, []);

  return (
    <div>
      <h1>Jade API Test</h1>
      <p>Open the console to see output.</p>
    </div>
  );
};

export default App;
```

## Note

This is a basic example future versions will include more functionality until it has fully implemented all of the functions in the RPC api for jade [here](https://raw.githubusercontent.com/Blockstream/Jade/refs/heads/master/docs/index.rst)




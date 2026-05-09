class RpcClient {
  #host = '';
  #path = '/rpc';
  #ssl = true;
  #port = 443;
  #id = 0;

  constructor(url = null) {
    if (url) {
      this.setUrl(url);
    }
  }

  #parseUrl(url) {
    let u = url;

    this.#ssl = false;
    this.#port = 80;

    if (u.startsWith('https://')) {
      this.#ssl = true;
      this.#port = 443;
      u = u.slice(8);
    } else if (u.startsWith('http://')) {
      u = u.slice(7);
    }

    const slash = u.indexOf('/');

    if (slash !== -1) {
      this.#path = u.slice(slash);
      this.#host = u.slice(0, slash);
    } else {
      this.#path = '/rpc';
      this.#host = u;
    }

    const colon = this.#host.indexOf(':');

    if (colon !== -1) {
      this.#port = Number(this.#host.slice(colon + 1));
      this.#host = this.#host.slice(0, colon);
    }
  }

  setUrl(url) {
    this.#parseUrl(url);
  }

  async #request(body, timeoutSec = 30) {
    const protocol = this.#ssl ? 'https' : 'http';

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, timeoutSec * 1000);

    try {
      const response = await fetch(
        `${protocol}://${this.#host}:${this.#port}${this.#path}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        }
      );

      return await response.text();
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  #parseResponse(body) {
    try {
      const json = JSON.parse(body);

      if ('result' in json) {
        return {
          ok: true,
          result: json.result,
          error: ''
        };
      }

      if ('error' in json) {
        const error =
          typeof json.error === 'object'
            ? (json.error.message || 'rpc error')
            : JSON.stringify(json.error);

        return {
          ok: false,
          result: null,
          error
        };
      }

      return {
        ok: false,
        result: null,
        error: 'unknown rpc response'
      };
    } catch (err) {
      return {
        ok: false,
        result: null,
        error: `parse error: ${err.message}`
      };
    }
  }

  async call(method, params = [], timeoutSec = 30) {
    const payload = {
      jsonrpc: '2.0',
      method,
      params,
      id: ++this.#id
    };

    const body = await this.#request(payload, timeoutSec);

    if (!body) {
      return {
        ok: false,
        result: null,
        error: 'connection failed'
      };
    }

    return this.#parseResponse(body);
  }

  async getBalance(addr) {
    return this.call('octra_balance', [addr]);
  }

  async getAccount(addr, limit = 20) {
    return this.call('octra_account', [addr, limit]);
  }

  async getTransaction(hash) {
    return this.call('octra_transaction', [hash]);
  }

  async submitTx(tx) {
    return this.call('octra_submit', [tx]);
  }

  async getViewPubkey(addr) {
    return this.call('octra_viewPubkey', [addr]);
  }

  async getPublicKey(addr) {
    return this.call('octra_publicKey', [addr]);
  }

  async getEncryptedBalance(addr, sigB64, pubB64) {
    return this.call('octra_encryptedBalance', [
      addr,
      sigB64,
      pubB64
    ]);
  }

  async getEncryptedCipher(addr) {
    return this.call('octra_encryptedCipher', [addr]);
  }

  async registerPvacPubkey(
    addr,
    pkB64,
    sigB64,
    pubB64,
    aesKatHex = ''
  ) {
    return this.call('octra_registerPvacPubkey', [
      addr,
      pkB64,
      sigB64,
      pubB64,
      aesKatHex
    ]);
  }

  async getPvacPubkey(addr) {
    return this.call('octra_pvacPubkey', [addr]);
  }

  async registerPublicKey(addr, pubB64, sigB64) {
    return this.call('octra_registerPublicKey', [
      addr,
      pubB64,
      sigB64
    ]);
  }

  async getStealthOutputs(fromEpoch = 0) {
    return this.call('octra_stealthOutputs', [fromEpoch]);
  }

  async stagingView() {
    return this.call('staging_view', [], 5);
  }

  async compileAssembly(source) {
    return this.call('octra_compileAssembly', [source], 10);
  }

  async compileAml(source) {
    return this.call('octra_compileAml', [source], 10);
  }

  async compileAmlMulti(files, mainPath) {
    return this.call(
      'octra_compileAmlMulti',
      [
        {
          files,
          main: mainPath
        }
      ],
      15
    );
  }

  async computeContractAddress(
    bytecodeB64,
    deployer,
    nonce = 0
  ) {
    return this.call(
      'octra_computeContractAddress',
      [bytecodeB64, deployer, nonce]
    );
  }

  async vmContract(addr) {
    return this.call('vm_contract', [addr]);
  }

  async contractReceipt(hash) {
    return this.call('contract_receipt', [hash]);
  }

  async contractCallView(
    addr,
    method,
    params,
    caller
  ) {
    return this.call(
      'contract_call',
      [addr, method, params, caller],
      15
    );
  }

  async listContracts() {
    return this.call('octra_listContracts', [], 10);
  }

  async contractStorage(addr, key) {
    return this.call('octra_contractStorage', [
      addr,
      key
    ]);
  }

  async contractAbi(addr) {
    return this.call('octra_contractAbi', [addr]);
  }

  async saveAbi(addr, abi) {
    return this.call('contract_saveAbi', [addr, abi]);
  }

  async getTxsByAddress(
    addr,
    limit = 50,
    offset = 0
  ) {
    return this.call(
      'octra_transactionsByAddress',
      [addr, limit, offset],
      15
    );
  }

  async callBatch(
    methods,
    paramsList = [],
    timeoutSec = 10
  ) {
    const count = methods.length;

    if (!count) {
      return [];
    }

    const payload = methods.map((method, index) => ({
      jsonrpc: '2.0',
      method,
      params: paramsList[index] || [],
      id: index + 1
    }));

    const body = await this.#request(payload, timeoutSec);

    if (!body) {
      return Array.from(
        { length: count },
        () => ({
          ok: false,
          result: null,
          error: 'connection failed'
        })
      );
    }

    try {
      const json = JSON.parse(body);

      if (!Array.isArray(json)) {
        return Array.from(
          { length: count },
          () => ({
            ok: false,
            result: null,
            error: 'batch response not array'
          })
        );
      }

      const out = Array.from(
        { length: count },
        () => ({
          ok: false,
          result: null,
          error: 'no response'
        })
      );

      for (const item of json) {
        const id = item?.id;

        if (
          typeof id !== 'number' ||
          id < 1 ||
          id > count
        ) {
          continue;
        }

        if ('result' in item) {
          out[id - 1] = {
            ok: true,
            result: item.result,
            error: ''
          };
        } else if ('error' in item) {
          const error =
            typeof item.error === 'object'
              ? (item.error.message || 'rpc error')
              : JSON.stringify(item.error);

          out[id - 1] = {
            ok: false,
            result: null,
            error
          };
        }
      }

      return out;
    } catch (err) {
      return Array.from(
        { length: count },
        () => ({
          ok: false,
          result: null,
          error: `parse error: ${err.message}`
        })
      );
    }
  }
}

export default RpcClient;
import { JsonRpcProvider } from '@walletconnect/jsonrpc-provider';
import type {
  JsonRpcPayload,
  JsonRpcRequest,
  RequestArguments,
} from '@walletconnect/jsonrpc-utils';
import { isJsonRpcError } from '@walletconnect/jsonrpc-utils';
import { formatJsonRpcRequestPatched } from 'src/shared/custom-rpc/formatJsonRpcRequestPatched';
import { InvalidParams, MethodNotImplemented } from 'src/shared/errors/errors';
import { WalletNameFlag } from 'src/shared/types/WalletNameFlag';
import { isEthereumAddress } from 'src/shared/isEthereumAddress';
import type { Connection } from './connection';

function accountsEquals(arr1: string[], arr2: string[]) {
  // it's okay to perform search like this because `accounts`
  // always has at most one element
  return (
    arr1.length === arr2.length && arr1.every((item) => arr2.includes(item))
  );
}

async function fetchInitialState(connection: Connection) {
  return Promise.all([
    connection.send<string>(formatJsonRpcRequestPatched('eth_chainId', [])),
    connection.send<string[]>(formatJsonRpcRequestPatched('eth_accounts', [])),
    connection.send<WalletNameFlag[]>(
      formatJsonRpcRequestPatched('wallet_getWalletNameFlags', {
        origin: window.location.origin,
      })
    ),
  ]).then(([chainId, accounts, walletNameFlags]) => ({
    chainId,
    accounts,
    walletNameFlags,
  }));
}

class MetamaskExperimentalNamespace {
  isUnlocked() {
    return true;
    // throw new MethodNotImplemented('_metamask.isUnlocked: Not implemented');
  }

  requestBatch() {
    throw new MethodNotImplemented('_metamask.requestBatch: Not implemented');
  }
}

function updateChainId(self: EthereumProvider, chainId: string) {
  self.chainId = chainId;
  self.networkVersion = String(parseInt(chainId, 16));
}
export class EthereumProvider extends JsonRpcProvider {
  accounts: string[];
  chainId: string;
  networkVersion: string;
  isZerion = true;
  isMetaMask?: boolean;
  // Metamask provides this proxy with few experimental functions
  // Some dapps rely on its methods (e.g. app.hop.exchange)
  _metamask?: MetamaskExperimentalNamespace;
  connection: Connection;
  _openPromise: Promise<void> | null = null;

  nonEip6963Request = false;

  prefersOtherWalletStrategy?: (params: {
    request: RequestArguments & { id?: number };
    originalError: Error;
  }) => Promise<unknown>;

  constructor(connection: Connection) {
    super(connection);
    this.connection = connection;
    this.shimLegacy();
    this.chainId = '0x1';
    this.networkVersion = '1';
    this.accounts = [];

    connection.on(
      'ethereumEvent',
      ({ event, value }: { event: string; value: unknown }) => {
        if (event === 'connect') {
          this.events.emit('connect', { chainId: this.chainId });
          return;
        }

        if (event === 'chainChanged' && typeof value === 'string') {
          if (value === this.chainId) {
            return;
          }
          updateChainId(this, value);
        }
        if (event === 'accountsChanged' && Array.isArray(value)) {
          if (
            // it's okay to perform search like this because `this.accounts`
            // always has at most one element
            accountsEquals(value, this.accounts)
          ) {
            // Do not emit accountChanged because value hasn't changed
            return;
          } else if (value.length && !isEthereumAddress(value.at(0))) {
            this.accounts = [];
          } else {
            this.accounts = value;
          }
        }
        this.events.emit(event, value);
      }
    );

    this.open();
  }

  on(event: string, listener: (params: unknown) => unknown) {
    super.on(event, listener);
    return this;
  }

  off(event: string, listener: (params: unknown) => unknown) {
    super.off(event, listener);
    return this;
  }

  markAsMetamask() {
    this.isMetaMask = true;
    this._metamask = new MetamaskExperimentalNamespace();
  }

  unmarkAsMetamask() {
    this.isMetaMask = false;
  }

  private async _prepareState() {
    return fetchInitialState(this.connection).then(
      ({ chainId, accounts, walletNameFlags }) => {
        updateChainId(this, chainId);
        this.accounts = accounts;
        if (walletNameFlags.includes(WalletNameFlag.isMetaMask)) {
          this.markAsMetamask();
        }
      }
    );
  }

  /**
   * Some DApps make unbound calls to request, e.g. https://app.phuture.finance/
   * To handle this, make request bound to instance
   */
  public request = async (
    request: RequestArguments,
    context?: unknown
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> => {
    if (request.method === 'eth_chainId') {
      return Promise.resolve(this.chainId);
    }
    if (request.method === 'eth_accounts' && this.accounts.length) {
      return Promise.resolve(this.accounts);
    }
    let params = request.params;
    if (request.method === 'eth_requestAccounts' && this.nonEip6963Request) {
      params = [
        {
          ...(request.params || [])[0],
          nonEip6963Request: this.nonEip6963Request,
        },
        ...(request.params || []).slice(1),
      ];
    }
    const promise = this._getRequestPromise(
      formatJsonRpcRequestPatched(request.method, params || [], request.id),
      context
    );
    if (request.method === 'eth_requestAccounts' && this.nonEip6963Request) {
      return promise.catch((originalError) => {
        if (this.prefersOtherWalletStrategy) {
          return this.prefersOtherWalletStrategy({ request, originalError });
        } else {
          throw originalError;
        }
      });
    }
    return promise;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _getRequestPromise<Result = any, Params = any>(
    request: JsonRpcRequest<Params>,
    _context?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<Result> {
    if (!this.connection.connected) {
      await this.open();
    }
    return new Promise((resolve, reject) => {
      this.events.once(`${request.id}`, (response) => {
        if (isJsonRpcError(response)) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
      });
      this.connection.send(request);
    });
  }

  // Taken from Rabby
  // shim for legacy api
  sendAsync = (
    payload: unknown,
    callback: (error: null | Error, result: unknown) => void
  ) => {
    if (Array.isArray(payload)) {
      return Promise.all(
        payload.map(
          (item) =>
            new Promise((resolve) => {
              this.sendAsync(item, (_err, res) => {
                // ignore error
                resolve(res);
              });
            })
        )
      ).then((result) => callback(null, result));
    }
    const { method, params, ...rest } = payload as JsonRpcRequest;
    this.request({ method, params })
      .then((result) => callback(null, { ...rest, method, result }))
      .catch((error) => callback(error, { ...rest, method, error }));
  };

  // shim for legacy api
  send = (payload: unknown, callback: unknown) => {
    if (typeof payload === 'string' && (!callback || Array.isArray(callback))) {
      return this.request({
        method: payload,
        params: callback,
      }).then((result) => ({
        id: undefined,
        jsonrpc: '2.0',
        result,
      }));
    }

    if (typeof payload === 'object' && typeof callback === 'function') {
      // @ts-ignore callback should have appropriate signature
      return this.sendAsync(payload, callback);
    }

    throw new InvalidParams();
  };

  shimLegacy() {
    const legacyMethods = [
      ['enable', 'eth_requestAccounts'],
      ['net_version', 'net_version'],
    ];

    for (const [_method, method] of legacyMethods) {
      // @ts-ignore
      this[_method] = () => this.request({ method });
    }
  }

  isConnected() {
    return this.connection.connected;
  }

  private async _internalOpen(connection: Connection) {
    if (this.connection === connection && this.connection.connected) return;
    if (this.connection.connected) this.close();
    this.connection = connection; // this.setConnection();
    await Promise.all([this.connection.open(), this._prepareState()]);
    this.connection.on('payload', (payload: JsonRpcPayload) => {
      this.onPayload(payload);
    });
    this.connection.on('close', () => {
      this.events.emit('disconnect');
    });
    this.events.emit('connect', { chainId: this.chainId });
  }

  open(connection: Connection = this.connection) {
    if (!this._openPromise) {
      this._openPromise = this._internalOpen(connection);
    }
    return this._openPromise;
  }

  /**
   * Not part of EIP-1193
   */
  removeAllListeners(event?: string) {
    // eslint-disable-next-line no-console
    console.warn(
      'ethereum.removeAllListeners() is not part of EIP-1193 standard and you should not rely on it'
    );
    this.events.removeAllListeners(event);
  }

  /**
   * Not part of EIP-1193
   */
  emit(event: string, ...props: unknown[]) {
    // eslint-disable-next-line no-console
    console.warn(
      'ethereum.emit() is not part of EIP-1193 standard and you should not rely on it'
    );
    if (event) {
      this.events.emit(event, ...props);
    }
  }
}

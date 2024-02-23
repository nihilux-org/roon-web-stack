export class TransientObject<TObject extends object> {
  private _isDisposed = false;
  private _proxy?: { proxy: TObject; revoke: () => void };
  private _promise: Promise<TObject>;
  private _resolve?: (value: TObject) => void;
  private _reject?: (reason?: any) => void;

  constructor() {
    this._promise = new Promise((resolve, reject) => {
      this._resolve = async (obj) => {
        this._proxy = Proxy.revocable(obj, {});
        if (this._isDisposed) {
          this._proxy.revoke();
        }
        resolve(this._proxy.proxy);
      };
      this._reject = reject;
    });
  }

  public get isDisposed(): boolean {
    return this._isDisposed;
  }

  public getObject(): Promise<TObject> {
    return this._promise;
  }

  public resolve(obj: TObject): TObject {
    this._resolve!(obj);
    return this._proxy!.proxy;
  }

  public reject(reason?: any): void {
    this._reject!(reason);
  }

  public dispose(): void {
    if (!this._isDisposed) {
      this._isDisposed = true;
      this._proxy?.revoke();
    }
  }
}

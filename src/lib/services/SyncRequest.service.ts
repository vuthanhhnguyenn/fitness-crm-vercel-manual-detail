export default class SyncRequestService {
  #promise: Promise<string | null> | null = null;

  set promise(promise: Promise<string | null> | null) {
    this.#promise = promise;
  }

  get promise(): Promise<string | null> | null {
    return this.#promise;
  }
}

import type { Characteristic, Logging, Service, WithUUID } from 'homebridge';

import type { Bulb, Plug } from 'tplink-smarthome-api';

export type TplinkDevice = Bulb | Plug;

export function isObjectLike(
  candidate: unknown
): candidate is Record<string, unknown> {
  return (
    (typeof candidate === 'object' && candidate !== null) ||
    typeof candidate === 'function'
  );
}

export function callbackify<T>(
  func: (...args: unknown[]) => Promise<T>,
  errFunc: (error: Error) => void
): (error?: Error | null | undefined, value?: T | undefined) => void {
  return (...args: unknown[]) => {
    type Callback = (
      error?: Error | null | undefined,
      value?: T | undefined
    ) => void;

    const onlyArgs = [];
    let callback: Callback;

    for (const arg of args) {
      if (typeof arg === 'function') {
        callback = arg as Callback;
        break;
      }

      onlyArgs.push(arg);
    }

    func(...onlyArgs)
      .then((data) => callback(null, data))
      .catch((err) => {
        if (typeof errFunc === 'function') errFunc(err);
        callback(err);
      });
  };
}

export function callbackifyLogError<T>(
  acc: { name: string; log: Logging },
  func: (...args: unknown[]) => Promise<T>
): (error?: Error | null | undefined, value?: T | undefined) => void {
  return callbackify(func.bind(acc), (reason) => {
    acc.log.error('[%s] %s', acc.name, func.name);
    acc.log.error(String(reason));
  });
}

/**
 * Creates a function that will "batch" calls that are within the `timeout`
 *
 * The first time the function that is created is called, it will wait the `timeout` for additional calls.
 * After the `timeout` expires the result of one execution of `fn` will be resolved to all calls during the `timeout`.
 *
 * If `runNowFn` is specified it will be run synchronously without a timeout. Useful for functions that are used to set rather than get.
 *
 * @param {() => Promise<T>} fn
 * @param {number} timeout (ms)
 * @param {(arg: U) => void} [runNowFn]
 * @returns {(arg?: U) => Promise<T>}
 */
export function deferAndCombine<T, U>(
  fn: () => Promise<T>,
  timeout: number,
  runNowFn?: (arg: U) => void
): (arg?: U) => Promise<T> {
  const requests: {
    resolve: (value?: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  }[] = [];
  let isWaiting = false;

  return (arg) => {
    if (runNowFn !== undefined && arg !== undefined) {
      runNowFn(arg);
    }

    return new Promise((resolve, reject) => {
      requests.push({ resolve, reject });

      if (isWaiting) return;
      isWaiting = true;

      setTimeout(() => {
        isWaiting = false;
        fn()
          .then((value) => {
            for (const d of requests) {
              d.resolve(value);
            }
          })
          .catch((error) => {
            for (const d of requests) {
              d.reject(error);
            }
          });
      }, timeout);
    });
  };
}

export function getOrAddCharacteristic(
  service: Service,
  characteristic: WithUUID<new () => Characteristic>
): Characteristic {
  return (
    service.getCharacteristic(characteristic) ||
    service.addCharacteristic(characteristic)
  );
}

export function kelvinToMired(kelvin: number): number {
  return 1e6 / kelvin;
}

export function lookup<T>(
  object: unknown,
  compareFn: undefined | ((objectProp: unknown, search: T) => boolean),
  value: T
): string | undefined {
  const compare =
    compareFn ??
    ((objectProp: unknown, search: T): boolean => objectProp === search);

  if (isObjectLike(object)) {
    const keys = Object.keys(object);
    for (let i = 0; i < keys.length; i += 1) {
      if (compare(object[keys[i]], value)) {
        return keys[i];
      }
    }
  }
  return undefined;
}

export function lookupCharacteristicNameByUUID(
  characteristic: typeof Characteristic,
  uuid: string
): string | undefined {
  const keys = Object.keys(characteristic);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    // @ts-ignore: not sure how to make this correct in typescript
    const c = characteristic[key];
    if ('UUID' in c && c.UUID === uuid) {
      return key;
    }
  }
  return undefined;
}

export function miredToKelvin(mired: number): number {
  return 1e6 / mired;
}

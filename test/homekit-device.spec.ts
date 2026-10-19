import { HAPStatus, HapStatusError } from 'hap-nodejs';

import HomekitDevice from '../src/homekit-device';

class TestHomekitDevice extends HomekitDevice {
  identify(): void {
    this.log.debug('identify');
  }

  write(promise: Promise<unknown>): Promise<void> {
    return this.handleDeviceWrite(promise);
  }
}

describe('HomekitDevice device writes', () => {
  const warn = jest.fn();
  const device = Object.assign(Object.create(TestHomekitDevice.prototype), {
    log: { warn },
    platform: { api: { hap: { HapStatusError } } },
  }) as TestHomekitDevice;

  beforeEach(() => warn.mockClear());

  it('resolves after a successful write', async () => {
    await expect(device.write(Promise.resolve(true))).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns a HAP communication failure when the device is unreachable', async () => {
    const error = Object.assign(new Error('connect EHOSTUNREACH'), {
      code: 'EHOSTUNREACH',
    });

    await expect(device.write(Promise.reject(error))).rejects.toMatchObject({
      hapStatus: HAPStatus.SERVICE_COMMUNICATION_FAILURE,
    });
    expect(warn).toHaveBeenCalledWith(
      'Device write failed: Error: connect EHOSTUNREACH'
    );
  });
});

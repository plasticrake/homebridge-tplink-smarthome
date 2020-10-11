const { Device, UdpServer } = require('tplink-smarthome-simulator');

function startSimulator() {
  const port = null;
  const emeter = {
    realtime: {
      current: 1.1256,
      voltage: 122.049119,
      power: 3.14,
      total: 51.493,
    },
  };

  const devices = [];
  devices.push(
    new Device({
      port,
      model: 'hs100',
      data: { alias: 'Mock HS100', mac: 'aa:aa:aa:8f:58:18', deviceId: 'A100' },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'hs105',
      data: { alias: 'Mock HS105', mac: 'aa:aa:aa:d8:bf:d4', deviceId: 'A105' },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'hs110',
      data: {
        alias: 'Mock HS110',
        mac: 'aa:aa:aa:0d:91:8c',
        deviceId: 'A110',
        emeter,
      },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'hs110v2',
      data: {
        alias: 'Mock HS110v2',
        mac: 'aa:aa:aa:B7:F3:50',
        deviceId: 'A110F2',
        emeter,
      },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'hs200',
      data: { alias: 'Mock HS200', mac: 'aa:aa:aa:46:b4:24', deviceId: 'A200' },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'hs220',
      data: { alias: 'Mock HS220', mac: 'aa:aa:aa:46:b5:34', deviceId: 'A220' },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'hs300',
      data: {
        alias: 'Mock HS300',
        mac: 'aa:aa:aa:EE:0C:9D',
        deviceId: 'A300',
        emeter,
      },
    })
  );

  devices.push(
    new Device({
      port,
      model: 'lb100',
      data: {
        alias: 'Mock LB100',
        mac: 'aa:aa:aa:49:ca:42',
        deviceId: 'BB100',
      },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'lb120',
      data: {
        alias: 'Mock LB120',
        mac: 'aa:aa:aa:90:9b:da',
        deviceId: 'BB120',
      },
    })
  );
  devices.push(
    new Device({
      port,
      model: 'lb130',
      data: {
        alias: 'Mock LB130',
        mac: 'aa:aa:aa:b1:04:d3',
        deviceId: 'BB130',
      },
    })
  );

  devices.forEach((d) => {
    d.start();
  });

  UdpServer.start();
}

module.exports = { startSimulator };

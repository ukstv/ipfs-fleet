import { withFleet } from "./with-fleet";
import faker from "faker";
import getPort from "get-port";
import { Fleet } from "./fleet";

test("return result of the task", async () => {
  const expectedResult = faker.datatype.string();
  const actualResult = await withFleet(2, async (fleet) => {
    expect(fleet.instances.length).toEqual(2);
    return expectedResult;
  });
  expect(actualResult).toEqual(expectedResult);
}, 12000);

test("accept extended config", async () => {
  const customPort = await getPort();
  const customConfig = {
    config: {
      Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${customPort}`] },
    },
  };
  await withFleet(1, customConfig, async (fleet) => {
    expect(fleet.instances.length).toEqual(1);
    const instance = fleet.instances[0];
    const addresses = await instance.swarm.localAddrs();
    expect(addresses.length).toEqual(1);
    const addr = addresses[0] as any;
    const actualPort = addr.nodeAddress().port;
    expect(actualPort).toEqual(customPort);
  });
});

test("stop if task throws", async () => {
  let fleet: Fleet;
  await expect(
    withFleet(1, async (created) => {
      fleet = created;
      throw new Error("Inside");
    })
  ).rejects.toThrow(`Inside`);
  expect(fleet!.isRunning).toBeFalsy();
});

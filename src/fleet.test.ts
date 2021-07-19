import * as faker from "faker";
import { Fleet } from "./fleet";
import * as ipfs from "ipfs-core";

test("Fleet.build", async () => {
  const n = faker.datatype.number(5);
  const fleet = await Fleet.build(n);
  expect(fleet.instances.length).toEqual(n);
  expect(fleet.isRunning).toBeTruthy();
  await Promise.all(fleet.instances.map((ipfs) => ipfs.stop()));
}, 100000);

test("Fleet#stop", async () => {
  const n = faker.datatype.number(5);
  const repositoryParent = { cleanup: jest.fn(), path: "" };
  const instances = Array.from(Array(n)).map(() => {
    return {
      stop: jest.fn(),
    };
  }) as unknown as ipfs.IPFS[];
  const fleet = new Fleet(repositoryParent, instances);
  await fleet.stop();
  expect(repositoryParent.cleanup).toBeCalled();
  instances.forEach((instance) => {
    expect(instance.stop).toBeCalled();
  });
});

test("Fleet#connect", async () => {
  const n = 3;
  const fleet = await Fleet.build(n);
  const a = fleet.instances[0];
  const b = fleet.instances[2];
  expect((await a.swarm.peers()).length).toEqual(0);
  expect((await b.swarm.peers()).length).toEqual(0);

  await fleet.connect(a, b);

  expect((await a.swarm.peers()).length).toEqual(1);
  expect((await b.swarm.peers()).length).toEqual(1);

  const aPeers = await a.swarm.peers();
  const bPeers = await b.swarm.peers();
  const aId = (await a.id()).id;
  const bId = (await b.id()).id;
  expect(aPeers.map((p) => p.peer.toString())[0]).toEqual(bId);
  expect(bPeers.map((p) => p.peer.toString())[0]).toEqual(aId);

  await fleet.stop();
}, 100000);

test("Fleet#disconnect", async () => {
  const n = 3;
  const fleet = await Fleet.build(n);
  const a = fleet.instances[0];
  const b = fleet.instances[2];
  expect((await a.swarm.peers()).length).toEqual(0);
  expect((await b.swarm.peers()).length).toEqual(0);

  await fleet.connect(a, b);

  expect((await a.swarm.peers()).length).toEqual(1);
  expect((await b.swarm.peers()).length).toEqual(1);

  await fleet.disconnect(a, b);

  expect((await a.swarm.peers()).length).toEqual(0);
  expect((await b.swarm.peers()).length).toEqual(0);

  await fleet.stop();
}, 100000);

test("Fleet#connectAll", async () => {
  const n = 3;
  const fleet = await Fleet.build(n);
  const a = fleet.instances[0];
  const b = fleet.instances[1];
  const c = fleet.instances[2];
  expect((await a.swarm.peers()).length).toEqual(0);
  expect((await b.swarm.peers()).length).toEqual(0);
  expect((await c.swarm.peers()).length).toEqual(0);

  await fleet.connectAll();

  expect((await a.swarm.peers()).length).toEqual(2);
  expect((await b.swarm.peers()).length).toEqual(2);
  expect((await c.swarm.peers()).length).toEqual(2);

  await fleet.stop();
}, 100000);

test("Fleet#disconnectAll", async () => {
  const n = 3;
  const fleet = await Fleet.build(n);
  const a = fleet.instances[0];
  const b = fleet.instances[1];
  const c = fleet.instances[2];
  await fleet.connectAll();
  await fleet.disconnectAll();

  expect((await a.swarm.peers()).length).toEqual(0);
  expect((await b.swarm.peers()).length).toEqual(0);
  expect((await c.swarm.peers()).length).toEqual(0);

  await fleet.stop();
}, 100000);

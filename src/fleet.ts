import tmp from "tmp-promise";
import type { DirectoryResult } from "tmp-promise";
import IPFS from "ipfs";

export function ipfsConfig(parent: string, id: number) {
  return {
    repo: `${parent}/ipfs_${id}/`,
    config: {
      Addresses: { Swarm: [`/ip4/127.0.0.1/tcp/${4004 + id}`] },
      Bootstrap: [],
      Discovery: {
        MDNS: {
          Enabled: false,
        },
      },
    },
  };
}

async function withAddresses<A>(instance: IPFS.Ipfs, f: (address: IPFS.Ipfs.Multiaddr) => Promise<A>): Promise<A[]> {
  const addresses = (await instance.id()).addresses;
  return Promise.all(
    addresses.map((address) => {
      return f(address);
    })
  );
}

export class Fleet {
  isRunning: boolean = true;

  constructor(readonly repositoryParent: DirectoryResult, readonly instances: IPFS.Ipfs[]) {}

  static async build(n: number = 1): Promise<Fleet> {
    const repositoryParent: DirectoryResult = await tmp.dir({
      unsafeCleanup: true,
    });
    const repositoryParentPath = repositoryParent.path;
    const instancesP = Array.from(Array(n)).map((_, i) => {
      return IPFS.create(ipfsConfig(repositoryParentPath, i));
    });
    const instances = await Promise.all(instancesP);
    return new Fleet(repositoryParent, instances);
  }

  async connect(a: IPFS.Ipfs, b: IPFS.Ipfs): Promise<void> {
    await withAddresses(b, async (address) => {
      await a.swarm.connect(address);
    });
  }

  async disconnect(a: IPFS.Ipfs, b: IPFS.Ipfs): Promise<void> {
    await withAddresses(a, async (address) => {
      await b.swarm.disconnect(address);
    });
    await withAddresses(b, async (address) => {
      await a.swarm.disconnect(address);
    });
  }

  async connectAll(): Promise<void> {
    for (let a of this.instances) {
      for (let b of this.instances) {
        const aId = await a.id();
        const bId = await b.id();
        // Do not connect to self
        if (aId.id !== bId.id) {
          await this.connect(a, b);
        }
      }
    }
  }

  async disconnectAll(): Promise<void> {
    for (let a of this.instances) {
      for (let b of this.instances) {
        await this.disconnect(a, b);
      }
    }
  }

  async stop(): Promise<void> {
    await this.repositoryParent.cleanup();
    await Promise.all(this.instances.map((ipfs) => ipfs.stop()));
    this.isRunning = false;
  }
}

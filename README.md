# IPFS Fleet

> Manage IPFS nodes fleet easily

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

It is common now while testing to create multiple IPFS nodes. Then tests proceed with checking against
different connectivity graphs of those nodes. Code gets verbose fast. This library provides simple API over IPFS instantiation and connectivity graph.

You could create any number of IPFS nodes in one process, and manage how they connect to each other.

## Installation

Add `@ukstv/ipfs-fleet` using your package manager.

```
npm add @ukstv/ipfs-fleet
```

## Usage

Below is a typical usage scenario. You create fleet of IPFS nodes, then connect them as you wish via `fleet.connect`.

IPFS node expect you to `stop` them explicitly, so do not forget to put `fleet.stop` at the end.

```typescript
import {Fleet} from '@ukstv/ipfs-fleet';
const n = 3;
const fleet = await Fleet.build(n);
// Here 3 IPFS nodes are created. They do not know about each other now.

await fleet.connect(fleet.instances[0], fleet.instances[2]);
// Now the first and the third nodes are connected to each other.

await fleet.connectAll();
// And now all the nodes aware of each other.

// You could make them disconnect pairwise.
await fleet.disconnect(fleet.instances[1], fleet.instances[2]);

// Or you could disconnect them all at once.
await fleet.disconnectAll();

// As we are done, let IPFS nodes stop.
await fleet.stop();
```

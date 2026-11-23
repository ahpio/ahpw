---
title: The computer page shows its facts in sections
created: 2026-11-23
refs:
  - git://77d1e62d9fe4061d6135599a97a06433a65b89b8 - the commit of this repository the facts were checked at
  - git://fcef83870df3299dd7b5882eca9032d28d0c2278 - the commit of ahpd the computer records were checked at
  - git://7b0cae0d0c993fc9445d486e6abdd8769947c71d - the base of the worktree `computer-mockup`, which holds the mockup uncommitted
  - file:///github/ahpw.worktrees/computer-mockup/src/resources/computers/mockup/Mockup.tsx - the mockup, for a Docker computer, a libvirt VM and an ssh box, served by `computer-mockup.html`
  - "[code://src/resources/computers/Page.tsx#L27-L45](../../src/resources/computers/Page.tsx#L27-L45) - `factsList`, the one flat list of facts the page draws today"
  - "[code://src/resources/computers/Page.tsx#L48-L67](../../src/resources/computers/Page.tsx#L48-L67) - `UsageView`, the CPU and memory meters and the counts under them"
  - "[code://src/resources/computers/Page.tsx#L127-L150](../../src/resources/computers/Page.tsx#L127-L150) - the facts, the usage and the mounts, in that order"
  - "[code://src/resources/computers/machines.ts#L17-L24](../../src/resources/computers/machines.ts#L17-L24) - `ComputerRecord`, whose `status` is the runtime's own record"
  - "[code://src/resources/computers/machines.ts#L90-L125](../../src/resources/computers/machines.ts#L90-L125) - `factsOf`, which reads a dozen fields of that record"
  - https://github.com/ahpio/ahpd/blob/fcef83870df3299dd7b5882eca9032d28d0c2278/packages/computer/src/runtime.ts#L2629-L2640 - a Docker computer's record is `docker inspect` of its container
  - https://github.com/ahpio/ahpd/blob/fcef83870df3299dd7b5882eca9032d28d0c2278/packages/computer/src/vm.ts#L287-L296 - a VM's record, in Docker's shape with a few fields
  - https://github.com/ahpio/ahpd/blob/fcef83870df3299dd7b5882eca9032d28d0c2278/packages/computer/src/ssh.ts#L482-L490 - an ssh box's record
  - https://github.com/ahpio/ahpd/blob/fcef83870df3299dd7b5882eca9032d28d0c2278/packages/computer/src/node.ts#L92-L95 - a node's record, its id and folder only
  - https://docs.docker.com/desktop/use-desktop/container/ - Docker Desktop's container view, checked 2026-11-23
  - https://docs.portainer.io/user/docker/containers/view - Portainer's container details, checked 2026-11-23
---

# The computer page shows its facts in sections

Softov wants a computer's page to show more of what its runtime says, grouped so a person finds each fact.
Today the page draws one flat list of a dozen facts, then the usage, then the mounts.
The mockup in the worktree `computer-mockup` draws the page as he wants it, for a Docker computer, a libvirt VM and an ssh box.

## What others do

- Docker Desktop opens a container on tabs: *Logs*, *Inspect*, *Bind mounts*, *Exec*, *Files* and *Stats*.
  *Inspect* holds the low-level details, such as the image and the port mapping.
  *Stats* holds the CPU, memory, network and disk use.
- Portainer shows a container's status and configuration on one details view: ports, environment, labels, volumes and networks. Logs, inspect, stats and the console are actions beside it.
- The mockup follows neither one whole. It keeps one page, as ahpw's other pages are, and splits it into titled sections in the order a person checks a computer.

## What ahpw has today

- [`factsList`](../../src/resources/computers/Page.tsx#L27-L45) draws image, destination, command, folder, network mode, cores, memory limit, exit code, started, created, container and process id in one two-column list.
- [`UsageView`](../../src/resources/computers/Page.tsx#L48-L67) draws CPU and memory as meters, with processes, network and disk under them, read from the `stats` leaf every 5 seconds.
- The mounts are a list of source, arrow, target, with a badge for a read-only one.
- [`factsOf`](../../src/resources/computers/machines.ts#L90-L125) reads these from the record's `status`, which is the runtime's own record.

## What each runtime's record holds

| Runtime | The record | Usage |
|---|---|---|
| Docker | the whole `docker inspect` of the container | a `stats` leaf |
| VM (libvirt, Proxmox) | Docker's shape with `Id`, `Name`, `Config.Labels`, `Config.Image` (the template), `Config.WorkingDir`, `State.Running` and `State.Status` | a `stats` leaf |
| ssh box | `id`, `destination`, `port`, `identity`, `workdir`, `host` and `agents` | a `stats` leaf |
| node | `id` and `workdir` | none |

No record names its runtime.
A reader can tell them apart only by their shape: `HostConfig` for Docker, `Config` without `HostConfig` for a VM, `destination` for ssh.

## The mockup's sections, and where each fact is

| Section | Facts | Source |
|---|---|---|
| Head | the id, the standing, a badge with the runtime, Stop and Restart | the runtime is not in the record; see *Open points* |
| Usage | CPU of its cores, memory of its limit with the share, processes, network, disk | the `stats` leaf, and `HostConfig.NanoCpus` for the cores |
| Process & resources | image or template, process, CPUs, memory limit, memory and swap, restarts, started, created, container | Docker: `Config.Image`, `State.Pid`, `HostConfig.NanoCpus`, `Memory`, `MemorySwap`, `RestartCount`, `State.StartedAt`, `Created`, `Id`; a VM: `Config.Image` and `State.Status` |
| The command and folder, as a code block | the command, the working folder, an ssh box's host command | `Config.Cmd`, `Config.WorkingDir`; an ssh box's `workdir` and `host` |
| Network | mode, IPv4, gateway, MAC, published ports, extra hosts | `HostConfig.NetworkMode`, `NetworkSettings.Networks`, `NetworkSettings.Ports`, `HostConfig.ExtraHosts` |
| Connection, for an ssh box | destination, port, identity | the record's `destination`, `port`, `identity` |
| Mounts | the kind, the target, read-only or read-write, the source | `Mounts[].Type`, `Destination`, `RW`, `Source` or `Name` |
| Security & lifecycle | privileged, killed for memory, restart policy, AppArmor, read-only root, the container runtime | `HostConfig.Privileged`, `State.OOMKilled`, `HostConfig.RestartPolicy.Name`, `AppArmorProfile`, `HostConfig.ReadonlyRootfs`, `HostConfig.Runtime` |
| AHP metadata | the `ahpd.*` labels: agents, owner, profile, state, parts | `Config.Labels`, for Docker and a VM; an ssh box's `agents` |
| Foot | platform and storage driver | `Platform`, `Driver` |
| Record, Remove | as today | as today |

A section with no fact for a computer is not drawn: a VM has no network section, and an ssh box no mounts.

## Who writes

- `src/resources/computers/` has no open branch in ahpw at the checked commit.
- The worktree `computer-mockup` holds the mockup, uncommitted, on a detached HEAD. It is the design, so it stays until a plan is built from this brief.

## The change

- The page draws its facts in the mockup's sections, in its order, with a title and an icon each.
- The usage is the first section, and says the cores and the memory limit beside the use.
- `factsOf` reads the further fields of each section from the record, and leaves out a fact a record does not hold.
- A mount shows its kind and whether it is read-only or read-write.
- The `ahpd.*` labels show as their own section.
- The head shows the computer's runtime beside its standing.

## Open points

- Where the runtime comes from: the record's shape, or a field ahpd adds to each record. A field is exact, but it is an ahpd change first.
- Which `ahpd.*` labels to show, and with which words.
  The mockup shows agents, owner, profile, state and parts; ahpd has more, such as team, project, session and host.
- A VM's address and network are not in its record. The mockup draws none for a VM, so this is a gap only if a VM should show them.
- Whether a node, whose record holds only its folder, gets this page or a smaller one.
- Whether an ssh box's identity path is a fact to show a person who may not own that key.

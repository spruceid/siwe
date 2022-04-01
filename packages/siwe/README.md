![Sign-In with Ethereum logo](https://login.xyz/favicon.png "Sign-In with Ethereum logo")

Sign-In with Ethereum describes how Ethereum accounts authenticate with 
off-chain services by signing a standard message format parameterized by scope,
session details, and security mechanisms (e.g., a nonce). The goals of this 
specification are to provide a self-custodied alternative to centralized 
identity providers, improve interoperability across off-chain services for 
Ethereum-based authentication, and provide wallet vendors a consistent 
machine-readable message format to achieve improved user experiences and 
consent management.

## Quickstart Examples
To try it out locally, check out these examples:

- [Node](https://github.com/spruceid/siwe-quickstart/tree/main/00_print)
- [Frontend](https://github.com/spruceid/siwe-quickstart/tree/main/01_frontend)
- [Backend](https://github.com/spruceid/siwe-quickstart/tree/main/02_backend)
- [End to end](https://github.com/spruceid/siwe-quickstart/tree/main/03_complete_app)
- [Sign-In with Ethereum Notepad](https://github.com/spruceid/siwe-notepad)

## Motivation
When signing in to popular non-blockchain services today, users will typically 
use identity providers (IdPs) that are centralized entities with ultimate 
control over users' identifiers, for example, large internet companies and email
providers. Incentives are often misaligned between these parties. Sign-In with
Ethereum offers a new self-custodial option for users who wish to assume more
control and responsibility over their own digital identity.

Already, many services support workflows to authenticate Ethereum accounts using
message signing, such as to establish a cookie-based web session which can 
manage privileged metadata about the authenticating address. This is an 
opportunity to standardize the sign-in workflow and improve interoperability 
across existing services, while also providing wallet vendors a reliable method 
to identify signing requests as Sign-In with Ethereum requests for improved UX.

This work is sponsored by the Ethereum Foundation and Ethereum Name Service 
(ENS). It is being developed in the open through a series of recorded community 
calls and public repositories, and its development is informed by over twenty 
user interviews with a focus on currently-in-production uses, related prior 
EIPs, and fits within product roadmaps.

## Specification
Specification can be found [here](https://eips.ethereum.org/EIPS/eip-4361).

## Disclaimer 

Our TypeScript library for Sign-In with Ethereum has not yet undergone a formal security 
audit. We welcome continued feedback on the usability, architecture, and security 
of this implementation.

## Mono Repo Install and Build
Run `npm install` to install dependencies, then `npm bootstrap` to link the dependencies
in their respective packages. Afteward run `npm run build` to build the library.
Development can occur on the `package/*` level with tests being run on each package itself.


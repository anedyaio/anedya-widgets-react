# Anedya SDK

The Anedya SDK is a JavaScript/TypeScript library that allows you to access the Anedya Platform API from your web application. It provides a simple and intuitive interface for interacting with the Anedya API, making it easy to integrate Anedya into your existing application.

## Installation

You can install the Anedya SDK using npm or yarn:

```bash
npm install anedya-sdk
```

or

```bash
yarn add anedya-sdk
```

## Usage

```javascript
import { Anedya, AnedyaGetDataRequest, AnedyaGetDataResponse} from "anedya-sdk";

const anedya = new Anedya();
const connect_config = anedya.NewConfig(tokenId, token);
const client = anedya.NewClient(connect_config);
const node_1 = anedya.NewNode(client, NodeId);

const getDataReq = new AnedyaGetDataRequest(variableIdentifier,fromTime,toTime);
let getData_resp = new AnedyaGetDataResponse();
res = await node_1.getDataBetween(getDataReq);
```

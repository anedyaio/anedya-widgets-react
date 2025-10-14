[<img alt="PyPI" src="https://img.shields.io/npm/v/%40anedyasystems%2Fanedya-frontend-sdk?style=for-the-badge">](https://www.npmjs.com/package/@anedyasystems/anedya-frontend-sdk)&nbsp;&nbsp;[<img alt="Anedya Documentation" src="https://img.shields.io/badge/Anedya-Documentation-blue?style=for-the-badge">](https://docs.anedya.io?utm_source=github&utm_medium=link&utm_campaign=github-sdk&utm_content=js)


<!---<div style="width:20%; margin:0 auto;margin-bottom:50px;margin-top:50px;">-->
<p align="center">
    <img src="https://cdn.anedya.io/anedya_black_banner.png" alt="Logo">
</p>
<!--</div>-->


# Anedya SDK

The Anedya SDK is a JavaScript/TypeScript library that allows you to access the Anedya Platform API from your web application. It provides a simple and intuitive interface for interacting with the Anedya API, making it easy to integrate Anedya into your existing application.

## Usage

```javascript
import { Anedya, AnedyaGetDataReq, AnedyaGetDataResp} from "@anedyasystems/anedya-frontend-sdk";

const anedya = new Anedya();
const connect_config = anedya.NewConfig(tokenId, token);
const client = anedya.NewClient(connect_config);
const node_1 = anedya.NewNode(client, NodeId);

const req = new AnedyaGetDataReq(variableIdentifier,fromTime,toTime);
const res = await node_1.getData(req);
```

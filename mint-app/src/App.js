import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { AlgorandExtension } from "@magic-ext/algorand";
import axios from "axios";

const algosdk = require('algosdk');
const { createHash } = require('crypto');


const magic = new Magic("pk_test_6785B77E2FE2928E", {
  extensions: {
    algorand: new AlgorandExtension({
      rpcUrl: ""
    })
  }
});

export default function App() {
  const [email, setEmail] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState("");
  const [sendingTransaction, setSendingTransaction] = useState(false);
  const [total, setTotal] = useState(0);
  const [decimals, setDecimal] = useState(0);
  const [assetName, setAssetName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [Image, setImage] = useState({});
  const [URL, setURL] = useState(null);

  useEffect(() => {
    magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const metadata = await magic.user.getMetadata();
        setPublicAddress(metadata.publicAddress);
        setUserMetadata(metadata);
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const fileUpload = axios.create({
    baseURL: "http://localhost:8081"
  })

  const sendTransaction = axios.create({
    traxUrl: "https://api.testnet.algoexplorer.io/v2/transactions"
  })

  function storeToIPFS() {
    const obj = {
      name: "world",
      description: "hello helooo",
      tokenId: 1234
    };
    const json = JSON.stringify(obj);
    const blob = new Blob([json], {
      type: 'application/json'
    });

    var formData = new FormData();

    formData.append("image", Image);
    formData.append("document", blob);

    fileUpload.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(value => setURL(value.data.result.IpfsHash))
  }

  async function createASA() {
    await storeToIPFS();

    let url = 'https://api.testnet.algoexplorer.io/v2/transactions/params';
    let params = await (await fetch(url)).json();

    console.log(params)

    let firstRound = params["last-round"];
    let lastRound = params["last-round"] + 1000;
    let genesisID = params["genesis-id"];
    let genesisHash = params["genesis-hash"];
    params.fee = 1000;

    let getParams = {
      "flatFee": true,
      "fee": params.fee,
      "firstRound": firstRound,
      "lastRound": lastRound,
      "genesisID": genesisID,
      "genesisHash": genesisHash,
    };

    let sender = await magic.algorand.getWallet();

    let metadata = createHash('sha256').update(Buffer.from(JSON.stringify({ assetName, unitName, url }))).digest();
    metadata = new Uint8Array(metadata);

    let note = algosdk.encodeObj("creation of NFTTTTTTTT");

    setSendingTransaction(true);

    const txn = {
      from: sender,
      note: note,
      suggestedParams: getParams,
      assetTotal: total,
      assetDecimals: decimals,
      assetDefaultFrozen: false,
      assetUnitName: unitName,
      assetName: assetName,
      assetURL: `ipfs://ipfs/${URL}`,
      assetMetadataHash: metadata,
      assetManager: sender,
      assetReserve: sender,
      assetFreeze: sender,
      assetClawback: sender,
      type: "acfg",
      reKeyTo: sender,
    };

    console.log("txnnnnnn", txn)
    hanldeTransaction(txn);

  }

  async function hanldeTransaction(txn) {

    let signedTxn = await magic.algorand.signTransaction(txn);

    console.log("Signed transaction with txID: %s", JSON.stringify(signedTxn));

    // var traxUrl = "https://api.testnet.algoexplorer.io/v2/transactions";

    sendTransaction.post('', signedTxn.blob, {
      headers: {
        'Content-Type': 'application/x-binary',
      }
    }).then(response => response.json())
      .then(data => {
        console.log("DATAAAAAAAAAAAAAAA", JSON.stringify(data));

      })
      .catch((error) => {
        console.error('Error:', error);
      });


    // fetch(traxUrl, {
    //   method: 'POST', // or 'PUT'
    //   headers: {
    //     'Content-Type': 'application/x-binary',
    //   },
    //   body: signedTxn.blob,
    // })
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log("DATAAAAAAAAAAAAAAA", JSON.stringify(data));

    //   })
    //   .catch((error) => {
    //     console.error('Error:', error);
    //   });

    setSendingTransaction(false);
    setTxHash(signedTxn.txID);
  }

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Algorand address</h1>
            <div className="info">{publicAddress}</div>
          </div>

          {!URL ? (

            <div className="container">
              <h1>Choose Image</h1>
              <input
                type="file"
                name="file"
                required="required"
                placeholder="Image file"
                onChange={(event) => {
                  setImage(event.target.files[0]);
                }}
              />
              <button onClick={storeToIPFS}>Upload to IPFS</button>
            </div>
          ) : (
            <div className="container">
              <h1>Sign Algorand Transaction</h1>
              {txHash ? (
                <div>
                  <div>Send transaction success</div>
                  <div className="info">{txHash}</div>
                </div>
              ) : sendingTransaction ? (
                <div className="sending-status">Signing transaction</div>
              ) : (
                <div />
              )}
              <input
                type="text"
                name="amount"
                className="full-width"
                required="required"
                placeholder="Asset Name"
                onChange={(event) => {
                  setAssetName(event.target.value);
                }}
              />
              <input
                type="text"
                name="amount"
                className="full-width"
                required="required"
                placeholder="Unit Name (Symbol)"
                onChange={(event) => {
                  setUnitName(event.target.value);
                }}
              />
              <input
                type="text"
                name="amount"
                className="full-width"
                required="required"
                placeholder="Set Total units"
                onChange={(event) => {
                  setTotal(parseInt(event.target.value));
                  setDecimal(Math.log10(parseInt(event.target.value)))
                }}
              />
              <input
                type="text"
                name="amount"
                className="full-width"
                required="required"
                placeholder="Set decimals"
                value={decimals}
              />
              <div className="info">{URL}</div>

              <button id="btn-send-txn" onClick={createASA}>
                Sign Transaction
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

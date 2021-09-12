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
  const [isOptin, setIsOptin] = useState(false);
  const [amount, setAmount] = useState(0);
  const [assetName, setAssetName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [assetID, setAssetID] = useState(0);

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

  const sendTransaction = axios.create({
    traxUrl: "https://api.testnet.algoexplorer.io/v2/transactions"
  })

  const transferASA = async () => {
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

    // If the transaction type is optin then set the receiver address to sender
    if (isOptin == true) {
      setReceiverAddress(publicAddress);
      setAmount(0);
    }

    let metadata = createHash('sha256').update(Buffer.from(JSON.stringify([assetName, unitName, url]))).digest();
    metadata = new Uint8Array(metadata);

    setSendingTransaction(true);

    const txn = {
      type: "axfer",
      from: publicAddress,
      to: publicAddress,
      amount: 0,
      suggestedParams: getParams,
      assetIndex: assetID,
    };

    console.log("Asset Transfer Transaction", txn)
    hanldeTransaction(txn);
  }

  const hanldeTransaction = async (txn) => {

    let signedTxn = await magic.algorand.signTransaction(txn);

    console.log("Signed transaction with txID: %s", JSON.stringify(signedTxn));


    fetch("https://api.testnet.algoexplorer.io/v2/transactions", {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/x-binary',
      },
      body: signedTxn.blob,
    })
      .then(response => response.json())
      .then(data => {
        console.log("DATAAAAAAAAAAAAAAA", JSON.stringify(data));

      })
      .catch((error) => {
        console.error('Error:', error);
      });

    setSendingTransaction(false);
    setTxHash(signedTxn.txID);
    setIsOptin(true);

    console.log(txHash)
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


          {!isOptin ? (

            <div className="container">

              <input
                type="text"
                name="amount"
                className="full-width"
                required="required"
                placeholder="Asset ID"
                onChange={(event) => {
                  setAssetID(parseInt(event.target.value));
                }}
              />
              <button onClick={transferASA}>OPT In</button>

            </div>
          ) : (
            <div className="container">
              OPT IN SUCCESSFUL !
              NOW YOU CAN RECEIVE ASA.
              <input
                type="text"
                name="amount"
                className="full-width"
                required="required"
                placeholder="Asset ID"
                onChange={(event) => {
                  setAssetID(parseInt(event.target.value));
                }}
              />
            </div>

          )}
        </div>
      )}
    </div>
  );
}

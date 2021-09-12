require('dotenv').config()

const express = require('express');
const router = express.Router({ mergeParams: true });

const fs = require("fs");
const formidable = require('formidable');

const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(process.env.pinataApiKey, process.env.pinataSecretApiKey);

router.post('/', async (req, res) => {
    try {

        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {

            var currentPath = files.image.path;

            var fileData = fs.createReadStream(currentPath);

            fs.readFile(files.document.path, (error, data) => {
                if(error) {
                    throw error;
                }
                console.log("dataaaaaaaaaa",JSON.parse(data.toString()));
            });

            
            pinata.testAuthentication().then((result) => {
                console.log(result);

                var options = {
                    pinataMetadata: {
                        name: files.document.name,
                    },
                    pinataOptions: {
                        cidVersion: 0.1,
                        wrapWithDirectory: false
                    }
                };

                pinata.pinFileToIPFS(fileData, options).then((result) => {
                    console.log(result);
                    const metadata = {
                        name: fields.name,
                        description: fields.description,
                        image: `ipfs://ipfs/${result.IpfsHash}`,
                        attributes: [{ "key": "Test", "trait_type": "Test", "value": "Test" }]
                    };

                    pinata.pinJSONToIPFS(metadata, options).then((result) => {
                        console.log(result);
                        res.json({
                            success: true,
                            message: 'Uploaded data on IPFS',
                            result
                        })

                    }).catch(next)

                }).catch((err) => {
                    console.log(err);
                    // throw err;
                });

            }).catch((err) => {
                console.log(err);
                throw err;
            });
        });
    } catch (err) {
        console.log(err);
    }
})

module.exports = router;

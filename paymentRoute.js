const express = require("express");

const router = express.Router();
const PaytmChecksum = require("./PaytmChecksum");
require("dotenv").config();
const formidable = require("formidable");

const https = require("https");
const { v4: uuidv4 } = require("uuid");

router.post("/callback", (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, file) => {
        paytmChecksum = fields.CHECKSUMHASH;
        delete fields.CHECKSUMHASH;

        var isVerifySignature = PaytmChecksum.verifySignature(
            fields,
            process.env.MKEY,
            paytmChecksum
        );
        if (isVerifySignature) {
            const https = require("https");
            /**
             * import checksum generation utility
             * You can get this utility from https://developer.paytm.com/docs/checksum/
             */

            /* initialize an object */
            var paytmParams = {};

            /* body parameters */
            paytmParams.body = {
                /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
                mid: fields.MID,

                /* Enter your order id which needs to be check status for */
                orderId: fields.ORDERID,
            };

            /**
             * Generate checksum by parameters we have in body
             * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
             */
            PaytmChecksum.generateSignature(
                JSON.stringify(paytmParams.body),
                process.env.MKEY
            ).then(function (checksum) {
                /* head parameters */
                paytmParams.head = {
                    /* put generated checksum value here */
                    signature: checksum,
                };

                /* prepare JSON string for request */
                var post_data = JSON.stringify(paytmParams);

                var options = {
                    /* for Staging */
                    hostname: "securegw-stage.paytm.in",

                    /* for Production */
                    // hostname: 'securegw.paytm.in',

                    port: 443,
                    path: "/v3/order/status",
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": post_data.length,
                    },
                };

                // Set up the request
                var response = "";
                var post_req = https.request(options, function (post_res) {
                    post_res.on("data", function (chunk) {
                        response += chunk;
                    });

                    post_res.on("end", function () {
                        res.status("302").redirect(
                            "http://localhost:3000/successful"
                        );
                        //res.json(response);
                        console.log("Response: ", response);
                    });
                });

                // post the data
                post_req.write(post_data);
                post_req.end();
            });

            console.log("Checksum Matched");
        } else {
            console.log("Checksum Mismatched");
        }
        //    console.log(err, fields, file);
    });
});

router.post("/payment", (req, res) => {
    /* import checksum generation utility */

    var paytmParams = {};
    const { amount, email } = req.body;

    /* initialize an array */

    paytmParams["MID"] = process.env.MID;
    paytmParams["WEBSITE"] = process.env.WEBSITE;
    paytmParams["CHANNEL_ID"] = process.env.CHANNEL_ID;
    paytmParams["INDUSTRY_TYPE_ID"] = process.env.INDUSTRY_TYPE_ID;
    paytmParams["ORDER_ID"] = uuidv4();
    paytmParams["CUST_ID"] = process.env.CUST_ID || "team";
    paytmParams["TXN_AMOUNT"] = "100";
    paytmParams["CALLBACK_URL"] = "http://localhost:5000/api/callback";
    paytmParams["EMAIL"] = "abc@gmail.com";
    paytmParams["MOBILE_NO"] = "9452685369";

    /**
     * Generate checksum by parameters we have
     * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
     */
    var paytmChecksum = PaytmChecksum.generateSignature(
        paytmParams,
        process.env.MKEY
    );
    paytmChecksum
        .then(function (checksum) {
            let params = {
                ...paytmParams,
                CHECKSUMHASH: checksum,
            };
            res.json(params);
        })
        .catch(function (error) {
            console.log(error);
        });
});

module.exports = router;

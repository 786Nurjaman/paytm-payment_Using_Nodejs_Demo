const formidable = require('formidable');
const https = require('https');
// const { v4: uuidv4 } = require('uuid');
const PaytmChecksum = require('../PaytmChecksum');

exports.payments = (req, res) => {
    var params = {};
    params['MID'] = 'FUDiqa71467885973812';
    params['WEBSITE'] = 'WEBSTAGING';
    params['CHANNEL_ID'] = 'WEB';
    params['INDUSTRY_TYPE_ID'] = 'Retail';
    params['ORDER_ID'] = 'TEST_' + new Date().getTime();
    params['CUST_ID'] = 'customer_001';
    params['TXN_AMOUNT'] = '200'; 
    params['CALLBACK_URL'] = 'http://localhost:5000/callback';
    params['EMAIL'] = "nur@gmail.com";
    params['MOBILE_NO'] = "1234567892";
    let paytmChecksum = PaytmChecksum.generateSignature(params, '4X&tKQ&huHfXEj@#');
    paytmChecksum.then(response => {
        let paytmChecksumResp = {
            ...params,
            "CHECKSUMHASH": response
        };
        var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; // for staging
        // var txn_url = "https://securegw.paytm.in/theia/processTransaction"; // for production
        var form_fields = "";
        for (var x in paytmChecksumResp) {
            form_fields += "<input type='hidden' name='" + x + "' value='" + paytmChecksumResp[x] + "' >";
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>');
        res.end();
    }).catch(error => {
        res.status(500).json({
            message: 'Error in Payment',
            error: error
        });
    });
}




exports.callback = (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, file) => {

        paytmChecksum = fields.CHECKSUMHASH;
        delete fields.CHECKSUMHASH;

        var isVerifySignature = PaytmChecksum.verifySignature(fields, '4X&tKQ&huHfXEj@#', paytmChecksum);
        if (isVerifySignature) {
            var paytmParams = {};
            paytmParams["MID"] = fields.MID;
            paytmParams["ORDERID"] = fields.ORDERID;

            /*
            * Generate checksum by parameters we have
            * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
            */
            PaytmChecksum.generateSignature(paytmParams, '4X&tKQ&huHfXEj@#').then(function (checksum) {

                paytmParams["CHECKSUMHASH"] = checksum;

                var post_data = JSON.stringify(paytmParams);

                var options = {

                    /* for Staging */
                    hostname: 'securegw-stage.paytm.in',

                    /* for Production */
                    // hostname: 'securegw.paytm.in',

                    port: 443,
                    path: '/order/status',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': post_data.length
                    }
                };
                var response = "";
                var post_req = https.request(options, function (post_res) {
                    post_res.on('data', function (chunk) {
                        response += chunk;
                    });
                    post_res.on('end', function () {
                        let result = JSON.parse(response)
                        if (result.STATUS === 'TXN_SUCCESS') {
                            // res.send('payment sucess')
                            res.sendFile(__dirname + '/txn_success.html');
                        } else {
                            // res.send('payment failed')
                            res.sendFile(__dirname + '/txn_failure.html');
                        }

                    });
                });
                post_req.write(post_data);
                post_req.end();
            });
        } else {
            console.log("Checksum Mismatched");
        }

    })
}

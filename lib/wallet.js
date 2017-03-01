'use strict';
var request;
// if(!self.fetch) {
//     request = require('request');
// }
var Utilities = require('../lib/utilities');

class Wallet {
    constructor(hostname, port) {
        this.hostname = hostname || '127.0.0.1';
        this.port = port || 18082;
        this.params = {};
    }

    /**
     * Get the standard public address of this wallet.
     * @returns {object}
     */
    address() {
        this.method = 'getaddress';
        return _request(this);
    }

    /**
     * Get the current balance of this wallet.
     * @returns {object}
     */
    balance() {
        this.method = 'getbalance';
        return _request(this);
    }

    /**
     * Get the current block height of this wallet.
     * @returns {object}
     */
    height() {
        this.method = 'getheight';
        return _request(this);
    }

    /**
     * Get incoming transfers to this wallet.
     * @param type {string} must be one of: 'all', 'available', or 'unavailable'
     * @returns {object}
     */
    incomingTransfers(type) {
        this.method = 'incoming_transfers'
        this.params = {transfer_type: type}
        return _request(this);
    }

    /**
     * Get payments to this wallet from a single payment id.
     * @param paymentId
     * @returns {object}
     */
    getPayments(paymentId) {
        this.method = 'get_payments';
        this.params = {payment_id: paymentId}
        return _request(this);
    }

    /**
     * Get payments to this wallet from a list of payment ids.
     * @param paymentIds
     * @param minBlockHeight
     * @returns {object}
     */
    getBulkPayments(paymentIds, minBlockHeight) {
        this.method = 'get_bulk_payments';
        this.params.paymentIds = paymentIds;
        this.params.minBlockHeight = minBlockHeight;
        return _request(this);
    }

    makeIntegratedAddress(paymentId) {
        this.method = 'make_integrated_address';
        this.params.payment_id = paymentId;
        return _request(this);
    }

    splitIntegratedAddress(address) {
        return _request('split_integrated_address', {integrated_address: address});
    }

    store() {
        return _request('store');
    }

    stopWallet() {
        return _request('stop_wallet');
    }

    transfer(destinations, options = {}, method = 'transfer') {
        if (Array.isArray(destinations)) {
            destinations.forEach((dest) => dest.amount = Utilities.toAtomic(dest.amount));
        } else {
            destinations.amount = Utilities.toAtomic(destinations.amount);
            destinations = [destinations];
        }
        let params = {
            destinations: destinations,
            mixin: parseInt(options.mixin) || 4,
            unlock_time: parseInt(options.unlockTime) || 0,
            payment_id: options.pid || null
        };
        return _request(method, params);
    }

    transferSplit(destinations, options) {
        return this.transfer(destinations, options, 'transfer_split');
    }

    getTransfers(options) {
        this.method = 'get_transfers'
        this.params = options
        return _request(this);
    }
}

// private method for making RPC requests
function _request(self) {
    let url = `http://${self.hostname}:${self.port}/json_rpc`;
    let body = {
        jsonrpc: '2.0',
        id: '0',
        method: self.method,
        params: self.params
    };
    let options = {
        url: url,
        method: 'POST',
        json: true,
        headers: {'Content-Type': 'application/json'},
        body: body
    };

    if(window && window.fetch) {
        return new Promise((resolve, reject) => {
            fetch(url, {
                method: 'POST',
                body: JSON.stringify(body)
            })
            .then((response) => {
                if(response.ok) {
                    response.json().then((json) => {
                        resolve(json.result)
                    })
                } else {
                    // TODO custom error object?
                    reject(response);
                }
            })
            .catch((error) => {
                return reject(error);
            })
        })
    } else {
        return new Promise((resolve, reject) => {
            request(options, function (err, res, body) {
                if (err) {
                    reject(err);
                } else if (body && body.result) {
                    resolve(body.result);
                } else if (body && body.error) {
                    reject(body.error);
                } else {
                    resolve(body);
                }
            });
        })
    }
}

module.exports = Wallet;


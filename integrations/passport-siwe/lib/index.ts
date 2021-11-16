import { Strategy } from 'passport-strategy';
import util from 'util';
import { lookup } from './utils';
import { SiweMessage } from 'siwe';

/**
 * `SIWEStrategy` constructor.
 *
 * @param {Object} options
 * @api public
 */
export function SIWEStrategy(options) {
    this._message = options.message || 'message';
    this._signature = options.signature || 'signature';

    Strategy.call(this);
    this.name = 'siwe';
    this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(SIWEStrategy, Strategy);

/**
 *
 * @param {Object} req
 * @api protected
 */
SIWEStrategy.prototype.authenticate = function(req, options) {
    options = options || {};
    var message = lookup(req.body, this._message) || lookup(req.query, this._message);
    var signature = lookup(req.body, this._signature) || lookup(req.query, this._signature);

    if (!message || !signature) {
        return this.fail({ message: options.badRequestMessage || 'Missing message or signature' }, 400);
    }

    try {
        let msg = new SiweMessage(message);
        if (!msg.validate(signature)) {
            return this.fail({ message: 'Invalid signature.' }, 403);
        }
    } catch (e) {
        return this.fail({ message: 'Invalid message.' }, 400);
    }

    var self = this;

    function verified(err, user, info) {
        if (err) { return self.error(err); }
        if (!user) { return self.fail(info); }
        self.success(user, info);
    }

    try {
        if (self._passReqToCallback) {
            this._verify(req, message, signature, verified);
        } else {
            this._verify(message, signature, verified);
        }
    } catch (ex) {
        return self.error(ex);
    }
}

/**
 * Authentication challenge.
 *
 * @api private
 */
SIWEStrategy.prototype._nonce = function() {
    return (Math.random() + 1).toString(36).substring(4);
}

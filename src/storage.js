var q = require("q");

exports.createSessionStorage = createSessionStorage;

function createSessionStorage(provideApi) {
    var sessions = { };
    var promises = { };
    
    function get(credentials) {
        var sessionKey = key(credentials);
        
        if (sessions[sessionKey]) {
            return q(sessions[sessionKey]);
        }
        if (promises[sessionKey]) {
            return promises[sessionKey];
        }
        
        return promises[sessionKey] = provideApi()
            .then(function(api) {
                return api.login(credentials);
            })
            .then(function(session) {
                return sessions[sessionKey] = session;
            });
    }
    
    return {
        get: get,
        invalidateAndGet: function(credentials) {
            delete sessions[key(credentials)];
            
            return get(credentials);
        }
    };
}

function key(obj) {
    return JSON.stringify(obj);
}

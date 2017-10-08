exports.createLazyProvider = function createLazyProvider(factory) {
    var provided;
    
    return function provide() {
        return provided || (provided = factory());
    };
};

exports.raise = function raise(status, message) {
    throw { status, message };
}

exports.createLazyProvider = (make) => {
    let provided;
    return () => provided || (provided = make());
};

exports.raise = (status, message) => { throw { status, message }; };

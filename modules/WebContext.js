var TestWrapper = require('./TestWrapper');

var WebContext = {

	_uid:0,
	_db:[],

	/**
	 * Removes the given test from the test database and stops testing
	 * @param {Number} id
	 * @returns {Boolean}
	 */
	clearTest:function(id) {

		// check if test with this id is available
		var test = this._db[id];
		if (!test) {
			return false;
		}

		// destroy test
		this._db[id] = null;
		test.destroy();

	},

	/**
	 * Run test and call 'change' method if outcome changes
	 * @param {String} query
	 * @param {Element} element
	 * @param {Function} cb
	 * @returns {Number} test unique id
	 */
	setTest:function(query,element,factory,cb) {

		var id = this._uid++;

		// store test
		this._db[id] = new TestWrapper(query,element,factory,cb);

		// return the identifier
		return id;

	}

};

module.exports = WebContext;
var ExpressionParser = require('./ExpressionParser');
var Condition = require('./Condition');

function TestWrapper(query,element,factory,cb) {

	var expression = ExpressionParser.parse(query);
	this._element = element;
	this._factory = factory;
	this._tests = expression.getTests();
	this._condition = new Condition(expression,cb);
	this._conditionChangeBind = this._condition.evaluate.bind(this._condition);
	this._load();

};

TestWrapper.prototype = {

	_load:function() {

		// get found test setups from expression and register
		var i = 0;
		var l = this._tests.length;

		for (;i < l;i++) {
			this._setupMonitorForTest(this._tests[i]);
		}

	},

	_setupMonitorForTest:function(test) {

		var self = this;
		var i = 0;
		var l;

		this._factory.create(test,this._element, function(watches) {

			// bind watches to test object
			test.assignWatches(watches);

			// add value watches
			l = watches.length;
			for (;i < l;i++) {

				// implement change method on watchers
				// jshint -W083
				watches[i].changed = self._conditionChangeBind;

			}

			// do initial evaluation
			self._condition.evaluate();

		});

	},

	destroy:function() {

		// unload watches
		var i = 0;
		var l = this._tests.length;

		for (;i < l;i++) {
			this._factory.destroy(this._tests[i]);
		}

		// clean bind
		this._conditionChangeBind = null;

	}

};

module.exports = TestWrapper;
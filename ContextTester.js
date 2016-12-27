var element = require('./monitors/element');
var media = require('./monitors/media');
var pointer = require('./monitors/pointer');

var monitors = {
	element:element,
	media:media,
	pointer
};

function mergeObjects(target,src) {

	var array = Array.isArray(src);
	var dst = array ? [] : {};

	src = src || {};

	if (array) {
		// arrays are not merged
		dst = src.concat();
	}
	else {

		if (target && typeof target === 'object') {

			Object.keys(target).forEach(function(key) {
				dst[key] = target[key];
			});

		}

		Object.keys(src).forEach(function(key) {

			if (typeof src[key] !== 'object' || !src[key]) {
				dst[key] = src[key];
			}
			else {
				if (!target[key]) {
					dst[key] = src[key];
				}
				else {
					dst[key] = mergeObjects(target[key], src[key]);
				}
			}

		});
	}

	return dst;
};

function MonitorFactory() {
	this._uid = 1;
	this._db = [];
	this._expressions = [];
};

MonitorFactory.prototype = {

	/**
	 * Parse expression to deduct test names and expected values
	 *
	 * Splits the expression on a comma and splits the resulting blocks at the semi-colon
	 *
	 * @param {String} expression
	 * @param {Boolean} isSingleTest - is true when only one test is defined, in that case only value can be returned
	 * @returns {*}
	 */
	_parse:function(expression,isSingleTest) {

		// if earlier parse action found return that one
		if (this._expressions[expression]) {
			return this._expressions[expression];
		}

		// parse expression
		var i = 0;
		var expressions = expression.split(',');
		var l = expressions.length;
		var result = [];
		var parts;
		var retain;
		var test;

		for (;i < l;i++) {
			parts = expressions[i].split(':');
			retain = parts[0].indexOf('was ') === 0;
			test = retain ? parts[0].substr(4) : parts[0];
			result.push({

				// retain when value matched
				retain: retain,

				// test name
				test: test,

				// expected custom value or expect true by default
				value:isSingleTest ? test : typeof parts[1] === 'undefined' ? true : parts[1]

			});
		}

		// remember the resulting array
		this._expressions[expression] = result;
		return result;
	},

	_mergeData:function(base,expected,element) {
		return mergeObjects(
			{
				element:element,
				expected:expected
			},
			base
		);
	},

	/**
	 * Create a new Monitor based on passed configuration
	 * @param {Test} test
	 * @param {Element} element
	 * @returns {Promise}
	 */
	create:function(test,element,complete) {

		// path to monitor
		var path = test.getPath();

		// expected value
		var expected = test.getExpected();

		// load monitor configuration
		var self = this;
		var setup = monitors[path];
		//_options.loader.require([_options.paths.monitors + path],function(setup) {

		var i = 0;
		var monitor = self._db[path];
		var id = setup.unload ? self._uid++ : path;
		var l;
		var watch;
		var watches;
		var items;
		var event;
		var item;
		var data;
		var isSingleTest;

		// bind trigger events for this setup if not defined yet
		if (!monitor) {

			// setup
			monitor = {

				// bound watches (each watch has own data object)
				watches:[],

				// change method
				change:function(event) {
					i = 0;
					l = monitor.watches.length;
					for (; i < l; i++) {
						monitor.watches[i].test(event);
					}
				}

			};

			// data holder
			data = setup.unload ? self._mergeData(setup.data,expected,element) : setup.data;

			// if unload method defined
			if (typeof setup.unload === 'function') {
				monitor.unload = (function(data) {
					return function() {
						setup.unload(data);
					};
				}(data));
			}

			// setup trigger events manually
			if (typeof setup.trigger === 'function') {
				setup.trigger(monitor.change,data);
			}

			// auto bind trigger events
			else {
				for (event in setup.trigger) {

					/* istanbul ignore next */
					if (!setup.trigger.hasOwnProperty(event)) {continue;}

					setup.trigger[event].addEventListener(event, monitor.change, false);

				}
			}

			// test if should remember this monitor or should create a new one on each match
			self._db[id] = monitor;
		}

		// remember
		test.assignMonitor(id);

		// add watches
		watches = [];

		// deduce if this setup contains a single test or has a mutiple test setup
		// this is useful to determine parsing setup and watch configuration later on
		isSingleTest = typeof setup.test === 'function';

		// does the monitor have an own custom parse method or should we use the default parse method
		items = setup.parse ? setup.parse(expected,isSingleTest) : self._parse(expected,isSingleTest);

		// cache the amount of items
		l = items.length;

		for (;i < l;i++) {

			item = items[i];

			watch = {

				// on change callback
				changed:null,

				// retain when valid
				retain:item.retain,
				retained: null,

				// default limbo state before we've done any tests
				valid:null,

				// setup data holder for this watcher
				data:setup.unload ? data : self._mergeData(setup.data,item.value,element),

				// setup test method to use
				// eslint-disable-next-line
				test:(function(fn) {
					// @ifdef DEV
					if (!fn) {
						throw new Error('Conditioner: Test "' + item.test + '" not found on "' + path + '" Monitor.');
					}
					// @endif
					return function(event) {
						if (this.retained) {return;}
						var state = fn(this.data, event);
						if (this.valid !== state) {
							this.valid = state;
							if (this.changed) {
								this.changed();
							}
						}
						if (this.valid && this.retain) {
							this.retained = true;
						}
					};
				}(isSingleTest ? setup.test : setup.test[item.test]))

			};

			// run initial test so we have start state
			watch.test();

			// we need to return it for later binding
			watches.push(watch);
		}

		// add these new watches to the already existing watches so they receive trigger updates
		monitor.watches = monitor.watches.concat(watches);

		complete(watches);

	},

	destroy:function(test) {

		// get monitor and remove watches contained in this test
		var monitorId = test.getMonitor();

		// test has no monitor assigned, stop here
		if (monitorId === null) {
			return;
		}

		var	monitor = this._db[monitorId];
		var	monitorWatches = monitor.watches;
		var	l = monitorWatches.length;
		var	i;

		// remove watches
		test.getWatches().forEach(function(watch) {
			for (i = 0;i < l;i++) {
				if (monitorWatches[i] === watch) {
					monitorWatches.splice(i,1);
				}
			}
		});

		// unload monitor, then remove from db
		if (monitor.unload) {
			monitor.unload();
			this._db[monitorId] = null;
		}
	}

};

var _monitorFactory = new MonitorFactory();


/**
 * @class
 * @constructor
 * @param {UnaryExpression} a
 * @param {String} operator
 * @param {UnaryExpression} b
 */
function BinaryExpression(a,operator,b) {

	this._a = a;
	this._operator = operator;
	this._b = b;

};

BinaryExpression.prototype = {

	/**
	 * Tests if valid expression
	 * @returns {Boolean}
	 */
	isTrue:function() {

		return this._operator === 'and' ?

			// is 'and' operator
			this._a.isTrue() && this._b.isTrue() :

			// is 'or' operator
			this._a.isTrue() || this._b.isTrue();

	},

	/**
	 * Returns tests contained in this expression
	 * @returns Array
	 */
	getTests:function() {
		return this._a.getTests().concat(this._b.getTests());
	},

	/**
	 * Outputs the expression as a string
	 * @returns {String}
	 */
	toString:function() {
		return '(' + this._a.toString() + ' ' + this._operator + ' ' + this._b.toString() + ')';
	}

};

/**
 * @class
 * @constructor
 * @param {UnaryExpression|BinaryExpression|Test} expression
 * @param {Boolean} negate
 */
function UnaryExpression(expression,negate) {

	this._expression = expression;
	this._negate = typeof negate === 'undefined' ? false : negate;

};

UnaryExpression.prototype = {

	/**
	 * Tests if valid expression
	 * @returns {Boolean}
	 */
	isTrue:function() {
		return this._expression.isTrue() !== this._negate;
	},

	/**
	 * Returns tests contained in this expression
	 * @returns Array
	 */
	getTests:function() {
		return this._expression instanceof Test ? [this._expression] : this._expression.getTests();
	},

	/**
	 * Cast to string
	 * @returns {string}
	 */
	toString:function() {
		return (this._negate ? 'not ' : '') + this._expression.toString();
	}
};


function Condition(expression,callback) {

	// get expression
	this._expression = expression;

	// on detect change callback
	this._change = callback;

	// default state is limbo
	this._currentState = null;

};

Condition.prototype = {

	/**
	 * Evaluate expression, call change method if there's a diff with the last evaluation
	 */
	evaluate:function() {
		var state = this._expression.isTrue();
		if (state !== this._currentState) {
			this._currentState = state;
			this._change(state);
		}
	}

};
/**
 * Test
 * @param {String} path to monitor
 * @param {String} expected value
 * @constructor
 */
function Test(path,expected) {

	this._path = path;
	this._expected = expected;
	this._watches = [];
	this._count = 0;
	this._monitor = null;

};

Test.prototype = {

	/**
	 * Returns a path to the required monitor
	 * @returns {String}
	 */
	getPath:function() {
		return this._path;
	},

	/**
	 * Returns the expected value
	 * @returns {String}
	 */
	getExpected:function() {
		return this._expected;
	},

	/**
	 * Returns true if none of the watches return a false state
	 * @returns {Boolean}
	 */
	isTrue:function() {
		var i = 0;
		var l = this._count;

		for (;i < l;i++) {
			if (!this._watches[i].valid) {
				return false;
			}
		}
		return true;
	},

	/**
	 * Related monitor
	 * @param {String|Number} monitor
	 */
	assignMonitor:function(monitor) {
		this._monitor = monitor;
	},

	/**
	 * Assigns a new watch for this test
	 * @param watches
	 */
	assignWatches:function(watches) {
		this._watches = watches;
		this._count = watches.length;
	},

	getMonitor:function() {
		return this._monitor;
	},

	/**
	 * Returns watches assigned to this test
	 * @returns {Array}
	 */
	getWatches:function() {
		return this._watches;
	},

	/**
	 * Returns test in path
	 * @returns {String}
	 */
	toString:function() {
		return this._path + ':{' + this._expected + '}';
	}

};

var ExpressionParser = {

	/**
	 * Quickly validates supplied expression for errors, is removed in prod version because of performance penalty
	 * @param {String} expression
	 * @returns {boolean}
	 */
	validate:function(expression) {

		// if not supplied
		if (!expression) {
			return false;
		}

		// regex to match expressions with
		var subExpression = new RegExp('[a-z]+:{[^}]*}','g');

		// get sub expressions
		var subs = expression.match(subExpression);

		// if none found
		if (!subs || !subs.length) {
			return false;
		}

		// remove subs and check if resulting string is valid
		var glue = expression.replace(subExpression,'');
		if (glue.length && glue.replace(/(not|or|and| |\)|\()/g,'').length) {
			return false;
		}

		// get amount of curly braces
		var curlyCount = (expression.match(/[{}]/g) || []).length;

		// if not matched (curly braces count should be double of semi colon count) something is wrong
		return subs.length * 2 === curlyCount;
	},
	// @endif

	/**
	 * Parses an expression in string format and returns the same expression formatted as an expression tree
	 * @memberof ExpressionFormatter
	 * @param {String} expression
	 * @returns {UnaryExpression|BinaryExpression}
	 * @public
	 */
	parse:function(expression) {

		var i = 0;
		var	path = '';
		var	tree = [];
		var	value = '';
		var	negate = false;
		var	isValue = false;
		var	target = null;
		var	parent = null;
		var	parents = [];
		var	l = expression.length;
		var	lastIndex;
		var	index;
		var	operator;
		var	test;
		var	j;
		var	c;
		var	k;
		var	n;
		var	op;
		var	ol;
		var	tl;

		if (!target) {
			target = tree;
		}

		// @ifdef DEV
		// if no invalid expression supplied, throw error
		// this test is not definite but should catch some common mistakes
		if (!expression || !this.validate(expression)) {
			throw new Error('Expressionparser.parse(expression): "expression" is invalid.');
		}
		// @endif

		// read explicit expressions
		for (;i < l;i++) {

			c = expression.charCodeAt(i);

			// check if an expression, test for '{'
			if (c === 123) {

				// now reading the expression
				isValue = true;

				// reset path var
				path = '';

				// fetch path
				k = i - 2;
				while (k >= 0) {
					n = expression.charCodeAt(k);

					// test for ' ' or '('
					if (n === 32 || n === 40) {
						break;
					}
					path = expression.charAt(k) + path;
					k--;
				}

				// on to the next character
				continue;

			}

			// else if is '}'
			else if (c === 125) {

				lastIndex = target.length - 1;
				index = lastIndex + 1;

				// negate if last index contains not operator
				negate = target[lastIndex] === 'not';

				// if negate overwrite not operator location in array
				index = negate ? lastIndex : lastIndex + 1;

				// setup test
				test = new Test(path,value);

				// add expression
				target[index] = new UnaryExpression(
					test,
					negate
				);

				// reset vars
				path = '';
				value = '';

				negate = false;

				// no longer a value
				isValue = false;
			}

			// if we are reading an expression add characters to expression
			if (isValue) {
				value += expression.charAt(i);
				continue;
			}

			// if not in expression
			// check if goes up a level, test for '('
			if (c === 40) {

				// create new empty array in target
				target.push([]);

				// remember current target (is parent)
				parents.push(target);

				// set new child slot as new target
				target = target[target.length - 1];

			}

			// find out if next set of characters is a logical operator. Testing for ' ' or '('
			if (c === 32 || i === 0 || c === 40) {

				operator = expression.substr(i,5).match(/and |or |not /g);
				if (!operator) {
					continue;
				}

				// get reference and calculate length
				op = operator[0];
				ol = op.length - 1;

				// add operator
				target.push(op.substring(0,ol));

				// skip over operator
				i+=ol;
			}

			// expression or level finished, time to clean up. Testing for ')'
			if (c === 41 || i === l - 1) {

				do {

					// get parent reference
					parent = parents.pop();

					// if contains zero elements = ()
					if (target.length === 0) {

						// zero elements added revert to parent
						target = parent;

						continue;
					}

					// if more elements start the grouping process
					j = 0;
					tl = target.length;

					for (;j < tl;j++) {

						if (typeof target[j] !== 'string') {
							continue;
						}

						// handle not expressions first
						if (target[j] === 'not') {
							target.splice(j,2,new UnaryExpression(target[j + 1],true));

							// rewind
							j = -1;
							tl = target.length;
						}
						// handle binary expression
						else if (target[j + 1] !== 'not') {
							target.splice(j - 1,3,new BinaryExpression(target[j - 1],target[j],target[j + 1]));

							// rewind
							j = -1;
							tl = target.length;
						}

					}

					// if contains only one element
					if (target.length === 1 && parent) {

						// overwrite target index with target content
						parent[parent.length - 1] = target[0];

						// set target to parent array
						target = parent;

					}

				}
				while (i === l - 1 && parent);

			}
			// end of ')' character or last index

		}

		return tree.length === 1 ? tree[0] : tree;

	}
};






function TestWrapper(query,element,cb) {

	var expression = ExpressionParser.parse(query);
	this._element = element;
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

		_monitorFactory.create(test,this._element, function(watches) {

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
			_monitorFactory.destroy(this._tests[i]);
		}

		// clean bind
		this._conditionChangeBind = null;

	}

};

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
	setTest:function(query,element,cb) {

		var id = this._uid++;

		// store test
		this._db[id] = new TestWrapper(query,element,cb);

		// return the identifier
		return id;

	}

};

export {
	WebContext
}
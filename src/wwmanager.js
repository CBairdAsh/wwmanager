/*
wwmanager

Web Worker Manager

Version 1.01
Created: 9/18/2018
Author: Chris Ash
Repo: https://github.com/CBairdAsh/wwmanager


*/

(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {

	$.wwmanager = {
		pool: [],
		wk_pool: [],
		pmax: (navigator.hardwareConcurrency || 10),
		queue: []
	};

	$.extend($.fn, {
		wwmanager: function() {
			var _param = arguments[0],
				_args = [].slice.call(arguments).slice(1);

			// API check first
			if ( API[_param] ) {
				var _fn = API[_param];
				return _fn.apply(this, _args);
			} else {
				if ( _param ) {
					var _out = methods.checkAPI($.wwmanager, _param, API);
					$.wwmanager = _out.local;
					API = _out.API;
				}
				// kick off launch
				methods.startup(_param,_args[0],_args[1]);
			}
		}
	});

	var API = {
		debug: function() {
			console.log($.wwmanager);
		},
		spin_up: function(_fnc, _w_type, _fnc_param) {
			methods.spin_up(_fnc, _w_type, _fnc_param);
		}
	};

	var methods = {
    cmds: ['wait','stop'],
		startup: function(_fnc, _w_type, _fnc_param) {
			methods.spin_up(_fnc, _w_type, _fnc_param);
		},
		id_counter: 0,
		newID: function() {
			var _did = new Date();
			_did = _did.getTime()+Math.floor(Math.random()*2000);
			methods.id_counter++;
			return ( ''+ ( _did + methods.id_counter ) );
		},
		checkAPI: function(_local, _param, API) {
			var _loc_out = {};

			for (var _idx in _local) {
				// absorb overrides
				_loc_out[_idx] = _local[_idx];

				if( _param.hasOwnProperty(_idx) ) {
					// check if where we're putting the new data is an object / array
					if ( typeof _loc_out[_idx] == "object" ) {

						// checking inbound data is object/array. If so, replace like with like
						if ( Array.isArray(_loc_out[_idx]) && Array.isArray(_param[_idx]) ) {
							 _loc_out[_idx] = [];
							 var _inner_from = _param[_idx],
								_inner_to = _loc_out[_idx];

							 for ( var itm=0; itm < _param[_idx].length; itm++ ) {
								 var _row = _inner_from[itm];
								 _inner_to.push( _row );
							 }
						} else if ( ( typeof _param[_idx] == "string" ) && ( Array.isArray(_loc_out[_idx]) ) ) {
							_loc_out[_idx].push( _param[_idx] );
						} else {
							_loc_out[_idx] = _param[_idx];
						}

					} else {
						_loc_out[_idx] = _param[_idx];
					}
				}
			}

			// check API for overrides. This should be rare
			$.each( API, function(_idx, _val) {
				// absorb overrides
				if ( _param[_idx] != null ) {
					API[_idx] = _param[_idx];
				}
			});

			return { "local": _loc_out, "API": API };
		},

		terminate: {
			_root: function() {
				return methods;
			},
			chk: function() {
				var _root = this._root();
				var _glob = $.wwmanager;

				// check to terminate workers to spare resources
				var _wrks = _glob.pool.length;
				var _q_max = _glob.queue.length;

				for (var i=0; i < _wrks; i++ ) {
					var _item = _glob.pool[i];
					var _q_pending = 0;

					for ( var q=0; q < _q_max; q++ ) {
						var _row = _glob.queue[q];
						try {
							if ( _item != undefined ) {
								if ( _item.w_type == _row.wk_type ) {
									_q_pending = 1;
									break;
								}
							}
						} catch (er) {
							console.log('[terminate.chk] error checking workers vs queue ',er,_item,_row);
						}
					}

					if ( _item != undefined ) {
						if ( ( _item.available ) && ( _item.persist == false ) && ( _q_pending == 0 ) ) {
							_glob.pool.splice(i,1);
							_item.terminate();
							_item = null;
						}
					}
					if ( _q_pending > 0 ) {
						_root.chk_queue();
						break;
					}
				}

				if ( ( _glob.queue.length == 0 ) && ( _glob.pool.length == 0 ) ) {
					var _watch = this.watch;
					clearInterval(_watch);
					_watch = false;
				}
			},
			watch: false,
			start: function() {
				if ( this.watch == false ) {
					this.watch = setInterval(function() {
						methods.terminate.chk();
					},50);
				}
			}
		},
		get_cmd: function(_data) {
			if ( typeof _data == 'object' ) {
				if ( _data.hasOwnProperty('cmd') ) {
					return _data.cmd;
				}
			}
			return false;
		},
    chk_cmds: function(_source) {
      var _found = false;
      var _mx_cmds = methods.cmds;
      for ( var i=0; i < _mx_cmds; i++) {
          if ( methods.cmds[i] == _source ) {
            _found = true;
            break;
          }
      }
      return _found;
    },
		proc_fn: function(_evt) {
			try {
				var _glob = $.wwmanager;
				var _worker = _evt.currentTarget;
				var _q_len = _glob.queue.length;

				for ( var q=0; q < _q_len; q++ ) {
					var _obj = _glob.queue[q];
					if ( _obj.uid == _worker.uid ) {

						// data is response, but in case of a command, check for a sub 'data'
						var _response = _evt.data;
						var _splice = true;

						var _splice = ( methods.chk_cmds(methods.get_cmd(_response) ) ) ? false : true;

						if (! _splice ) {
							// replace structure with what is in data for return, if there is a data branch
							if ( _response.hasOwnProperty('data') ) {
								_response = _response.data;
							}
						}

						if ( _worker.success ) {
							_obj.fn.success(_response, _evt);
						} else {
							_obj.fn.failure(_response, _evt);
						}

						if ( _splice ) {
							_glob.queue.splice(q,1);
						}
						break;
					}
				}
			} catch (err) {
				console.log('[wwmanager.methods.proc_fn] error ',err);
				console.log('[wwmanager.methods.proc_fn] last attempted to process ',_evt);
			}
		},
		spin_up: function(_fnc, _w_type, _fnc_param) {
			/*
				_fnc_param is the object that is passed to the inline worker function.

				99% of the parameters are whatever are assigned as they are expected to match with what the inline worker is looking for.
			*/
			var _glob = $.wwmanager;

			if ( _fnc_param ) {
				_fnc_param.active = false;
				_fnc_param.wk_type = _w_type;

				var _success_stub = function(resp,e) {
					if ( e.currentTarget.nomsg == false ) console.log('[wwmanager.success] resp',resp);
				}
				var _fail_stub = function(resp,e) {
					if ( e.currentTarget.nomsg == false ) console.log('[wwmanager.failure] resp',resp);
				}

				if ( _fnc_param.hasOwnProperty('fn') ) {
					if ( ! _fnc_param.fn.success )
						_fnc_param.fn.success = _success_stub;

					if ( ! _fnc_param.fn.failure )
						_fnc_param.fn.failure = _fail_stub;
				} else {
					_fnc_param.fn = {
						"success": _success_stub,
						"failure": _fail_stub
					}
				}

				_fnc_param.uid = methods.newID();

				_glob.queue.push(_fnc_param);
			}

			//add to work pool
			if ( _fnc ) {
				_glob.wk_pool.push({
					'fnc': _fnc,
					'type': _w_type
				});
			}

			// spin up workers if need be
			methods.chk_make_thread();

			// run through queue
			methods.chk_queue();

			// start monitor to watch for system idle so threads can be cleared
			methods.terminate.start();
		},
		chk_make_thread: function() {
			var _glob = $.wwmanager;

			var _on_handler = function(e) {
				var _key = e.currentTarget.w_key;

				if ( e.type == 'message' )
					e.currentTarget.success = true;

				if ( e.type == 'error' ) {
					e.currentTarget.success = false;
					console.log('[wwmanager.methods.worker '+_key+'] error ... ',e.message);
					console.log('[wwmanager.methods.worker '+_key+'] details ... ',e);
				}

				var _spin = ( methods.chk_cmds(methods.get_cmd(e.data) ) ) ? false : true;

				methods.proc_fn(e);

				if ( _spin ) {
					// mark as available for reuse or destruction
					e.currentTarget.available = true;

					// automatically check to spin the next up
					methods.spin_up();
				}
			}

			if ( _glob.pool.length < _glob.pmax ) {

				var _start = ( _glob.pool.length-1 < 0 ? 0 : _glob.pool.length-1 );
				for ( var w=_start; w < _glob.pmax; w++ ) {

					if ( _glob.wk_pool.length > 0 ) {
						var _w_fnc = _glob.wk_pool[_glob.wk_pool.length-1];
						var _worker = methods.create_worker(_w_fnc.fnc);
						_glob.wk_pool.pop();

						_worker.w_key = w;
						_worker.w_type = _w_fnc.type;
						_worker.available = true;
						_worker.onmessage = _on_handler;
						_worker.onerror = _on_handler;

						_glob.pool.push(_worker);
					}
				}
			}
		},
		chk_queue: function() {
			var _glob = $.wwmanager;

			// check for more work to do.
			var _run = false;
			var _q_len = _glob.queue.length;
			for ( var q=0; q < _q_len; q++ ) {
				var _obj = _glob.queue[q];
				if ( _obj.active == false ) {
					_run = true;
				}
			}

			if ( _run ) {
				var _wait = true;
				for ( var q=0; q < _q_len; q++ ) {
					var _obj = _glob.queue[q];
					if ( _obj.active == false ) {
						// get params for worker, but make sure we filter out functions... those can't go over a postMessage
						var _param = {};
						for (var _idx in _obj) {
							if ( ( typeof _obj[_idx] != "function" ) && ( _idx != 'fn' ) ) {
								_param[_idx] = _obj[_idx];
							}
						}

						for ( var w=0; w < _glob.pmax; w++ ) {
							var _worker = _glob.pool[w];
							if ( ( _worker.available ) && ( _worker.w_type == _obj.wk_type ) ) {
								_worker.persist = false;
								if ( _param.hasOwnProperty('persist') ) {
									_worker.persist = _param.persist;
								}
								_worker.nomsg = false;
								if ( _param.hasOwnProperty('nomsg') ) {
									_worker.nomsg = _param.nomsg;
								}

								_worker.postMessage(_param);
								_worker.uid = _param.uid;
								_worker.available = false;
								_obj.active = true;
								_wait = false;
								break;
							}
						}
					}
				}
				if ( _wait ) {
					setTimeout(function() {
						// spin up workers if need be
						methods.spin_up();
					},10);
				}
			}
		},
		create_worker: function(fn) {
			var blob = new Blob(['onmessage = (', fn.toString(),')'], { type: 'text/worker' });
			var url = URL.createObjectURL(blob);
			return new Worker(url);
		}

	}

}));

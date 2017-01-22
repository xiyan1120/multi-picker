/**
 * Created by appian on 2016/11/4.
 */
(function (wid, dcm) {
	var win = wid;
	var doc = dcm;
	
	function $id(id) {
		return doc.getElementById(id);
	}

	function $all($parent,selector) {
		return $parent.querySelectorAll(selector);
	}

	function $class(name) {
		return doc.getElementsByClassName(name);
	}
	
	function loop(begin, length, fuc) {
		for ( var i = begin; i < length; i++ ) {
			if (fuc(i)) break;
		}
	}
	
	function on(action, selector, callback) {
		doc.addEventListener(action, function (e) {
			if (selector == e.target.tagName.toLowerCase() || selector == e.target.className || selector == e.target.id) {
				callback(e);
			}
		})
	}

	function MultiPicker(config) {
		this.trigger     = config.trigger;
		this.container = config.container;
		this.jsonData  = config.jsonData;
		this.defaultVal = config.defaultVal;
		this.hasInitDefault = false;
		this.success   = config.success;

		this.isTouchWebkit = "ontouchstart" in window && "WebKitCSSMatrix" in window;
		this.touchstart = "touchstart";
		this.touchmove = "touchmove";
		this.touchend = 'touchend';
		if(!this.isTouchWebkit){
			this.touchstart = "mousedown";
			this.touchmove = "mousemove";
			this.touchend = "mouseup";
		}

		this.ulCount   = 0;
		this.ulIdx     = 0;
		this.ulDomArr  = [];
		this.idxArr    = [];
		this.jsonArr   = [];
		this.liHeight  = 40;
		this.maxHeight = [];
		this.distance  = [];
		this.start     = {
			Y: 0,
			time: ''
		};
		this.move      = {
			Y: 0,
			speed: []
		};
		this.end       = {
			Y: 0,
			status: true,
		};
		this.curTarget = null;
		this.resultArr = [];
		this.initDomFuc();
		this.initReady(0, this.jsonData[0]);
		this.initBinding();
	}
	
	MultiPicker.prototype = {
		constructor: MultiPicker,
		init:function (defaultValue) {
			var _this     = this;
			var bg        = $id('multi-picker-bg-' + _this.container);
			var container = $id('multi-picker-container-' + _this.container);
			var body      = doc.body;
			bg.classList.add('multi-picker-bg-up');
			container.classList.add('multi-picker-container-up');
			body.classList.add('multi-picker-locked');
			_this.defaultVal = defaultValue ? defaultValue : [];
			_this.initDefault(0);
			_this.hasInitDefault = true;
		},
		initDefault:function(idx){
			var _this = this;
			if(!_this.hasInitDefault && _this.defaultVal.length > idx){
				var idVal = _this.defaultVal[idx];
				var $picker = $id('multi-picker-' + _this.container + '-' + idx);
				var $li = $all($picker , "li[data-id='"+ idVal  +"']");
				if($li && $li.length){
					_this.changeRange(_this,idx,$picker,0,(($li[0].offsetTop - _this.liHeight * 2) * -1),true);
				}
			}
		},
		generateArrData: function (targetArr) {
			var tempArr = [];
			loop(0, targetArr.length, function (i) {
				tempArr.push({
					"id": targetArr[i].id,
					"value": targetArr[i].value
				})
			});
			return tempArr;
		},
		checkArrDeep: function (parent) {
			var _this = this;
			if ('child' in parent && parent.child.length > 0) {
				_this.jsonArr.push(_this.generateArrData(parent.child));
				_this.checkArrDeep(parent.child[0]);
			}
			_this.idxArr.push(this.ulIdx++);
		},
		insertLiArr: function (targetUl, arr) {
			var html    = '';
			var nullObj = {
				id: '-99',
				value: '',
			};
			arr.unshift(nullObj, nullObj);
			arr.push(nullObj, nullObj);
			loop(0, arr.length, function (i) {
				html += '<li data-id="' + arr[i].id + '">' + arr[i].value + '</li>';
			});
			targetUl.innerHTML = html;
		},
		initDomFuc: function () {
			var _this                      = this;
			var html                       = '';
			html += '<div class="multi-picker-bg" id="multi-picker-bg-' + _this.container + '">'
				+ '<div  class="multi-picker-container" id="multi-picker-container-' + _this.container + '">'
				+ '<div class="multi-picker-btn-box">'
				+ '<div class="multi-picker-btn" id="multi-picker-btn-cancel">返回</div>'
				+ '<div class="multi-picker-btn" id="multi-picker-btn-save-' + _this.container + '">确定</div>'
				+ '</div>'
				+ '<div class="multi-picker-content">'
				+ '<div class="multi-picker-up-shadow"></div>'
				+ '<div class="multi-picker-down-shadow"></div>'
				+ '<div class="multi-picker-line"></div>'
				+ '</div></div></div>';
			$id(_this.container).innerHTML = html;
			_this.jsonArr.push(_this.generateArrData(_this.jsonData));
		},
		initReady: function (idx, target) {
			var _this            = this;
			this.ulIdx           = 0;
			this.idxArr.length   = idx;
			_this.jsonArr.length = idx + 1;
			_this.checkArrDeep(target);
			var parentNode = $id('multi-picker-container-' + _this.container).children[1];
			var tempMax    = _this.ulCount <= _this.idxArr.length ? _this.ulCount : _this.idxArr.length;
			loop(idx + 1, tempMax, function (i) {
				var $picker = $id('multi-picker-' + _this.container + '-' + i);
				_this.insertLiArr($picker, _this.jsonArr[i]);
				_this.distance[i]             = 0;
				$picker.style.transform       = 'translate3d(0, 0, 0)';
				$picker.style.webkitTransform = 'translate3d(0, 0, 0)';
			});
			if (_this.ulCount <= _this.idxArr.length) {
				loop(_this.ulCount, _this.idxArr.length, function (i) {
					var newPickerDiv = document.createElement('div');
					newPickerDiv.setAttribute('class', 'multi-picker');
					newPickerDiv.innerHTML = '<ul id="multi-picker-' + _this.container + '-' + i + '"></ul>';
					parentNode.insertBefore(newPickerDiv, parentNode.children[parentNode.children.length - 3]);
					var tempDomUl = $id('multi-picker-' + _this.container + '-' + i);
					_this.ulDomArr.push(tempDomUl);
					_this.distance.push(0);
					_this.insertLiArr(tempDomUl, _this.jsonArr[i]);
					tempDomUl.addEventListener(_this.touchstart, function () {
						_this.touch(event, _this, tempDomUl, i);
					}, false);
					tempDomUl.addEventListener(_this.touchmove, function () {
						_this.touch(event, _this, tempDomUl, i);
					}, false);
					tempDomUl.addEventListener(_this.touchend, function () {
						_this.touch(event, _this, tempDomUl, i);
					}, false);
				});
				if(!_this.isTouchWebkit){
					document.addEventListener(_this.touchend, function () {
						if(_this.curTarget){
							_this.touch(event, _this, _this.curTarget.target, _this.curTarget.idx);
						}
					}, false);
				}
			} else {
				for ( var j = _this.ulCount - 1; j > _this.idxArr.length - 1; j-- ) {
					var oldPicker = $class('multi-picker')[j];
					oldPicker.parentNode.removeChild(oldPicker);
					_this.ulDomArr.pop();
					_this.distance.pop();
				}
			}
			
			_this.maxHeight.length = 0;
			_this.resultArr.length = 0;
			loop(0, _this.idxArr.length, function (i) {
				$id(_this.container).querySelectorAll('.multi-picker')[i].style.width = 100 / _this.idxArr.length + '%';
				_this.maxHeight.push($id('multi-picker-' + _this.container + '-' + i).offsetHeight);
				_this.resultArr.push({
					"id": _this.jsonArr[i][_this.distance[i] / _this.liHeight + 2].id,
					"value": _this.jsonArr[i][_this.distance[i] / _this.liHeight + 2].value,
				});
			});
			_this.ulCount = _this.idxArr.length;
		},
		initBinding: function () {
			var _this     = this;
			var bg        = $id('multi-picker-bg-' + _this.container);
			var container = $id('multi-picker-container-' + _this.container);
			var body      = doc.body;
			on(_this.touchstart, _this.trigger, function () {
				_this.init();
			}, false);
			
			on(_this.touchstart, 'multi-picker-btn-save-' + _this.container, function () {
				_this.success(_this.resultArr);
				bg.classList.remove('multi-picker-bg-up');
				container.classList.remove('multi-picker-container-up');
				body.classList.remove('multi-picker-locked');
			}, false);
			
			on(_this.touchstart, 'multi-picker-bg-' + _this.container, function () {
				bg.classList.remove('multi-picker-bg-up');
				container.classList.remove('multi-picker-container-up');
				body.classList.remove('multi-picker-locked');
			}, false);
			
			on(_this.touchstart, 'multi-picker-btn-cancel', function () {
				bg.classList.remove('multi-picker-bg-up');
				container.classList.remove('multi-picker-container-up');
				body.classList.remove('multi-picker-locked');
			}, false);
		},
		checkRange: function (idx) {
			var _this     = this;
			var tempObj   = _this.jsonData;
			var targetIdx = 0;
			loop(0, idx + 1, function (i) {
				targetIdx = _this.distance[i] / _this.liHeight;
				tempObj   = i == 0 ? tempObj[targetIdx] : tempObj.child[targetIdx];
			});
			_this.initReady(idx, tempObj);
		},
		initPosition: function (dis, max, idx) {
			dis     = dis < 0 ? 0 : dis;
			dis     = dis > max ? max : dis;
			var sub = dis % this.liHeight;
			if (sub < this.liHeight / 2) {
				this.distance[idx] = dis - sub;
			} else {
				this.distance[idx] = dis + (this.liHeight - sub);
			}
			return this;
		},
		initSpeed: function (arr, dir, max, idx) {
			var variance = 0;
			var sum      = 0;
			var rate     = 0;
			for ( var i in arr ) {
				sum += arr[i] - 0;
			}
			for ( var j in arr ) {
				variance += (arr[j] - (sum / arr.length)) * (arr[j] - (sum / arr.length));
			}
			if ((variance / arr.length).toFixed(2) > .1) {
				rate = max > this.liHeight * 15 ? dir * 2 : 0;
				this.initPosition(this.distance[idx] + rate, max - this.liHeight * 5, idx);
				this.move.speed[0] = .2;
			} else {
				this.initPosition(this.distance[idx], max, idx);
				this.move.speed[0] = this.move.speed[0] > 0.2 ? .2 : this.move.speed[0];
			}
		},
		pos:function (e) {
			if(this.isTouchWebkit){
				return {
					x: event.touches[0].clientX,
					y: event.touches[0].clientY
				}
			}else{
				e = e || window.event;
				var D = document.documentElement;
				if (e.pageX) return {x: e.pageX, y: e.pageY};
				return {
					x: e.clientX + D.scrollLeft - D.clientLeft,
					y: e.clientY + D.scrollTop - D.clientTop
				};
			}
		},
		changeRange:function(that,idx,$picker,startY,endY,isInitDefault){
			var tempDis        = that.distance[idx] + (startY - endY);
			var temp           = that.distance[idx];
			that.distance[idx] = tempDis < 0 ? 0 : (tempDis < that.maxHeight[idx] - this.liHeight * 5 ? tempDis : that.maxHeight[idx] - this.liHeight * 5);
			that.initSpeed(that.move.speed, startY - endY, that.maxHeight[idx], idx);

			$picker.style.transform        = 'translate3d(0,-' + that.distance[idx] + 'px, 0)';
			$picker.style.webkitTransform  = 'translate3d(0,-' + that.distance[idx] + 'px, 0)';
			$picker.style.transition       = 'transform ' + that.move.speed[0] + 's ease-out';
			$picker.style.webkitTransition = '-webkit-transform ' + that.move.speed[0] + 's ease-out';
			if (temp != that.distance[idx]) {
				that.checkRange(idx);
				if(isInitDefault){
					that.initDefault(idx + 1);
				}
			}
		},
		touch: function (event, that, $picker, idx) {
			event = event || window.event;
			event.preventDefault();
			switch (event.type) {
				case that.touchstart:
					if (that.end.status) {
						that.end.status = !that.end.status;
						event.preventDefault();
						that.move.speed = [];
						that.start.Y    = that.pos(event).y;
						that.start.time = Date.now();
						that.curTarget = !that.isTouchWebkit ? { target : $picker , idx : idx } : null;
					}
					break;
				case that.touchend:
					that.curTarget = null;
					that.end.Y         = Math.abs(that.isTouchWebkit ? event.changedTouches[0].clientY : that.pos(event).y);
					that.changeRange(that,idx,$picker,that.start.Y,that.end.Y);
					setTimeout(function () {
						that.end.status = true;
					}, that.move.speed[0] * 1000);
					break;
				case that.touchmove:
					if(!that.isTouchWebkit && !that.curTarget){
						return;
					}
					event.preventDefault();
					that.move.Y = that.pos(event).y;
					var offset  = that.start.Y - that.move.Y;
					if (that.distance[idx] == 0 && offset < 0) {
						$picker.style.transform        = 'translate3d(0,' + 1.5 * that.liHeight + 'px, 0)';
						$picker.style.webkitTransform  = 'translate3d(0,' + 1.5 * that.liHeight + 'px, 0)';
						$picker.style.transition       = 'transform 0.2s ease-out';
						$picker.style.webkitTransition = '-webkit-transform 0.2s ease-out';
					} else {
						$picker.style.transform       = 'translate3d(0,-' + (offset + that.distance[idx]) + 'px, 0)';
						$picker.style.webkitTransform = 'translate3d(0,-' + (offset + that.distance[idx]) + 'px, 0)';
					}
					if (Math.abs(offset).toFixed(0) % 5 === 0) {
						var time = Date.now();
						that.move.speed.push((Math.abs(offset) / (time - that.start.time)).toFixed(2));
					}
					break;
			}
		}
	};
	if (typeof exports == "object") {
		module.exports = MultiPicker;
	} else if (typeof define == "function" && define.amd) {
		define([], function () {
			return MultiPicker;
		})
	} else {
		win.MultiPicker = MultiPicker;
	}
})(window, document);
  

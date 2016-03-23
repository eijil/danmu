define(function (require, exports, module) {
	var Danmu = function (element, options) {
		this.$element = element;
		this.options = $.extend({}, Danmu.DEFAULTS, options);
		this.danmus = [];
		this.timeline = 0;
		this.init();
	}
	Danmu.DEFAULTS = {
		//全局颜色
		color: '#fff',
		//字体大小
		fontsize: '20px',
		//行高
		lineheight: '30',
		//评论延迟时间，跟后端取数据时间保持一致
		delay: 10
	}
	Danmu.prototype = {
		init: function () {
			var _this = this;
			this.containerHeight = this.$element.height() - 50;
			this.$container = $('<div class="danmuContainer" />').css({
				position: 'absolute',
				width: '100%',
				height: _this.containerHeight,
				'z-index': 10,
				left: 0,
				top: 0,
				overflow: 'hidden'
			});
			this.$element.append(this.$container);
			//屏幕最多能显示的行数
			this.maxLen = Math.floor(this.containerHeight / this.options.lineheight);
			this.rows = new Array(this.maxLen);
			//setTimeline
			setInterval(function () {
				_this.timeline = _this.timeline + 1000;
			}, 1000);
			this.start();
		},
		start: function () {
			var _this = this;
			this.$container.show();
			this.containerWidth = _this.$element.width();
			this.$container.bind('danmu.add', function () {
				for (var i = 0; i < _this.danmus.length; i++) {
					//创建弹幕
					var $danmu = _this.create(_this.danmus[i]);
					_this.$container.append($danmu);
					_this.danmus[i].ele = $danmu;
					_this.danmus[i].width = $danmu.width();
					_this.danmus[i].height = $danmu.height();
					//弹幕飞行时间，文字越多时间越长
					_this.danmus[i].duration = Math.floor(_this.containerWidth * 5 +
						_this.danmus[i].width * 8);
					var rows = [];
					for (var j = 0; j < _this.rows.length; j++) {
						rows.push(j);
					}
					//检测碰撞
					_this.collision(_this.danmus[i], rows);
				}
			})
		},
		//检测碰撞
		collision: function (danmu, rows) {
			var _this = this;
			var inline = false;
			var loop = false;
			//随机选择一行
			var row = rows[Math.floor(Math.random() * rows.length)];
			//查找未检查过的行
			rows.splice(row, 1);
			if (this.rows[row] === undefined) {
				this.rows[row] = {};
				inline = true;
			}
			//所有行遍历了一遍都有重叠的情况下,不继续递归 inline设置为true 时间延后5s
			if (rows.length == 0) {
				danmu.delay = danmu.delay + 5000;
				danmu.timeline = danmu.timeline + 5000;
				inline = true;
			}
			//检查是否可以在同一行显示
			for (var k in this.rows[row]) {
				//飞过的弹幕
				var _danmu = this.rows[row][k];
				var _timeline = _danmu.timeline;
				var _duration = _danmu.duration;
				//当前弹幕
				var timeline = danmu.timeline;
				var duration = danmu.duration;
				var speed = this.containerWidth / _duration;
				//留出一个安全距离，防止重叠
				var safeDistance = _danmu.width / 10;
				//匀速情况下，等上一个弹幕飞出本身的宽度可以则可以同一行
				if (speed * (timeline - _timeline) > _danmu.width + safeDistance) {
					inline = true;
				} else {
					inline = false;
					loop = true;
					break;
				}
			}
			if (inline || !loop) {
				danmu.row = row;
				this.rows[row][danmu.id] = danmu;
				this.fly(danmu);
			} else {
				this.collision(danmu, rows);
			}
		},
		stop: function () {
			this.$container.hide();
			this.$container.unbind('danmu.add');
		},
		/* 添加弹幕 @damus Array
		 * [
		 *   {'id':'123','text':'弹幕'},
		 *	 {'id':'12','text':'弹幕1','style':{'color':'#000000'}}
		 * ]
		 */
		add: function (danmus) {
			var startTimes = this.setStartTime(danmus);
			for (var i = 0; i < danmus.length; i++) {
				danmus[i].delay = startTimes[i];
				//如果是自己发不延迟
				if (danmus[i].type == 'own') {
					danmus[i].delay = 1;
				}
				danmus[i].timeline = startTimes[i] + this.timeline;
			}
			this.danmus = danmus;
			if (danmus.length) {
				this.$container.trigger('danmu.add');
			}
		},
		//随机模拟一个开始时间，让评论有先后顺序
		setStartTime: function (danmus) {
			var _this = this,
				startTimes = [],
				//10s
				randomTime = _this.options.delay * 1000;
			for (var i = 0; i < danmus.length; i++) {
				startTimes.push(Math.floor(Math.random() * randomTime));
			}
			//排序
			startTimes = startTimes.sort(function (a, b) {
				return a > b ? 1 : -1
			});
			return startTimes;
		},
		create: function (obj) {
			var _this = this;
			var danmu;
			var style = {
				'font-size': _this.options.fontsize,
				'position': 'absolute',
				'line-height': _this.options.lineheight + 'px',
				'color': _this.options.color,
				'white-space': 'nowrap',
				'font-family': 'Microsoft YaHei,Hiragino Sans GB',
				'text-shadow': '#000 1px 1px 2px'
			}
			if (obj.hasOwnProperty('style')) {
				style = $.extend(style, obj['style']);
			}
			danmu = $('<div class="dan">' + obj['text'] + '</div>').css(style);
			return danmu;
		},
		fly: function (danmu) {
			var _this = this;
			var row = danmu.row;
			var top = danmu.height * row;
			var delay = danmu.delay;
			danmu.ele.css({
				right: '-' + danmu.width + 'px',
				top: top
			}).delay(delay).animate({
				right: _this.$element.width()
			}, danmu.duration, 'linear', function () {
				//删除数组中的对象
				$(this).remove();
				delete _this.rows[row][danmu.id];
			})
		}
	}
	window.Danmu = Danmu;
})

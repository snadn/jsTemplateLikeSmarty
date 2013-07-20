/*smarty函数和js函数进行转换*/
var StringH = {
	encode4Html: function(s) {
		var el = document.createElement('pre');
		var text = document.createTextNode(s);
		el.appendChild(text);
		return el.innerHTML;
	},
	encode4HtmlValue: function(s) {
		return StringH.encode4Html(s).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}
};
window.foreach = function(arr, callback, pThis) {
	for (var i = 0, len = arr.length; i < len; i++) {
		if (i in arr) {
			callback.call(pThis, arr[i], i, arr);
		}
	}
};
window.empty = function(a){ return !a; };
String.prototype.getDefault = function(a){ return this.toString() || a; };
String.prototype.escape = function(a){
	if (a.toLowerCase() == 'html') {
		return StringH.encode4HtmlValue(this.toString());
	}
	return this.toString();
};

var Tmpl = (function() {
	/*
	sArrName 拼接字符串的变量名。
	*/
	var sArrName = "sArrCMX",
		sLeft = sArrName + '.push("';
	/*
		tag:模板标签,各属性含义：
		tagG: tag系列
		isBgn: 是开始类型的标签
		isEnd: 是结束类型的标签
		cond: 标签条件
		rlt: 标签结果
		sBgn: 开始字符串
		sEnd: 结束字符串
		trans: 对标签中的内容进行转换处理 // 修改新增
	*/
	var tags = {
		'if': {
			tagG: 'if',
			isBgn: 1,
			rlt: 1,
			sBgn: '");if(',
			sEnd: '){' + sLeft
		},
		'elseif': {
			tagG: 'if',
			cond: 1,
			rlt: 1,
			sBgn: '");} else if(',
			sEnd: '){' + sLeft
		},
		'else': {
			tagG: 'if',
			cond: 1,
			rlt: 2,
			sEnd: '");}else{' + sLeft
		},
		'/if': {
			tagG: 'if',
			isEnd: 1,
			sEnd: '");}' + sLeft
		},
		'foreach': {
			tagG: 'foreach',
			isBgn: 1,
			rlt: 1,
			sBgn: '");foreach(', // 修改
			trans: function(e){
				return e.replace(/as\s*([$\w]+)/, function($a, $b){
					return ',function(' + $b + ',' + $b + '_index' + ',' + $b + '_arr';
				}); // 修改新增
			},
			sEnd: '){' + sLeft // 修改
		},
		'/foreach': {
			tagG: 'foreach',
			isEnd: 1,
			sEnd: '")});' + sLeft
		}
	};

	return function(sTmpl, optsName) {
		var N = -1,
			NStat = []; /*语句堆栈;*/
		var ss = [
			[/\{strip\}([\s\S]*?)\{\/strip\}/g, function(a, b) {
				return b.replace(/[\r\n]\s*\}/g, " }").replace(/[\r\n]\s*/g, "");
			}],
			[/\\/g, '\\\\'],
			[/"/g, '\\"'],
			[/\r/g, '\\r'],
			[/\n/g, '\\n'], /*为js作转码.*/
			[
				/\{%[\s\S]*?\S\%}/g, /*js里使用}时，前面要加空格。*/ // 按情况修改标签分隔符
				function(a) {
					a = a.substr(2, a.length-2-2);
					for (var i = 0; i < ss2.length; i++) {a = a.replace(ss2[i][0], ss2[i][1]); }
					var tagName = a;
					if (/^(.\w+)\W/.test(tagName)) {tagName = RegExp.$1; }
					var tag = tags[tagName];
					if (tag) {
						if (tag.isBgn) {
							var stat = NStat[++N] = {
								tagG: tag.tagG,
								rlt: tag.rlt
							};
						}
						if (tag.isEnd) {
							if (N < 0) {throw new Error("Unexpected Tag: " + a); }
							stat = NStat[N--];
							if (stat.tagG != tag.tagG) {throw new Error("Unmatch Tags: " + stat.tagG + "--" + tagName); }
						} else if (!tag.isBgn) {
							if (N < 0) {throw new Error("Unexpected Tag:" + a); }
							stat = NStat[N];
							if (stat.tagG != tag.tagG) {throw new Error("Unmatch Tags: " + stat.tagG + "--" + tagName); }
							if (tag.cond && !(tag.cond & stat.rlt)) {throw new Error("Unexpected Tag: " + tagName); }
							stat.rlt = tag.rlt;
						}
						var tmp = a.substr(tagName.length);
						if(!!tag.trans){ tmp = tag.trans(tmp); } // 修改新增标签转换

						for (var i = 0; i < ss3.length; i++) {tmp = tmp.replace(ss3[i][0], ss3[i][1]); } // 修改新增标签转换

						return (tag.sBgn || '') + tmp + (tag.sEnd || '');
					} else {
						for (var i = 0; i < ss3.length; i++) {a = a.replace(ss3[i][0], ss3[i][1]); } // 修改新增标签转换
						return '",(' + a + '),"';
					}
				}
			]
		];
		var ss2 = [
			[/\\n/g, '\n'],
			[/\\r/g, '\r'],
			[/\\"/g, '"'],
			[/\\\\/g, '\\'],
			[/print\(/g, sArrName + '.push(']
		];
		
		// 修改新增标签转换方法
		var ss3 = [
			[/\|\s*default\s*:\s*([^\s|]*)/, function(a,b){ return '.getDefault(' + b + ')'; }],
			[/\|\s*escape\s*:\s*([^\s|]*)/, function(a,b){ return '.escape(' + b + ')'; }],
			[/([$\w]+)@first/, function(a,b){ return '(' + b + '_index == 0)'; }],
			[/([$\w]+)@last/, function(a,b){ return '(' + b + '_index == ' + b + '.length - 1)'; }],
			[/([$\w]+)@index/, function(a,b){ return '(' + b + '_index)'; }]
		];
		for (var i = 0; i < ss.length; i++) {
			sTmpl = sTmpl.replace(ss[i][0], ss[i][1]);
		}
		if (N >= 0) {throw new Error("Lose end Tag: " + NStat[N].tagG); }
		
		sTmpl = sTmpl.replace(/##7b/g,'{').replace(/##7d/g,'}').replace(/##23/g,'#'); /*替换特殊符号{}#*/
		sTmpl = 'var ' + sArrName + '=[];' + sLeft + sTmpl + '");return ' + sArrName + '.join("");';
		
		/*console.log('转化结果\n'+sTmpl);*/
		try{
			var fun = new Function(optsName, sTmpl);
		} catch (e){
			console.log && console.log("tmpl error");
			throw new Error("tmpl error");
		}
		return fun;
	};
}());
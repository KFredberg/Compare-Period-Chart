define(["client.property-panel/component-utils", "client.property-panel/components/components", "translator", "objects.utils/number-formatter", "objects.utils/date-formatter", "general.utils/number-formatting"], function(a, b, c, d, e, f) {
		function g(a, b) {
			console.log('kf-dima');
			console.log(a);
			console.log('b');
			console.log(b);
			var c, d, e, f;
			switch (a.tooltip.qNumberPresentations[0].qType) {
				case "D":
				case "T":
				case "TS":
					f = k, c = p;
					break;
				case "IV":
					f = l, c = q;
					break;
				case "M":
					f = m, c = o;
					break;
				case "R":
					e = a.tooltip.qNumberPresentations[0].qDec || ".", d = a.tooltip.qNumberPresentations[0].qThou;
				default:
					f = n, c = o
			}
			return f.format(c, "undefined" != typeof b ? b : a.tooltip.qNumberPresentations[0].qFmt, d, e)
		}

		function h(a, b) {
			a.tooltip.qNumberPresentations[0].qFmt = f.getDefaultNumericFormat(a.tooltip.qNumberPresentations[0], b)
		}

		function i(a, b, c) {
			return a === f.getDefaultNumericFormat(b.tooltip.qNumberPresentations[0], c)
		}
		var j, k = new e("", "", "", "D"),
			l = new e("", "", "", "IV"),
			m = new d("", "", "", "M"),
			n = new d("", "", "", "F"),
			o = 1000.12,
			p = new Date(2015, 1, 17, 15, 30, 40),
			q = 1.0453718171296298;
		var j = {
			template: '<div class="pp-component pp-string-component" ng-if="visible" tcl="string">\r\n	<div class="label" ng-if="label">{{label}}</div>\r\n\r\n	<div class="value">\r\n		<input type="text" class="qirby-input" maxlength="{{definition.maxlength || 255}}" tid="{{key}}"\r\n			   ng-model="value" ng-class="{ \'qirby-invalid\': invalid }" ng-disabled="readOnly" ng-change="change()"\r\n			   pp-model-onblur pp-model-onkeyup pp-input-validator/>\r\n\r\n	</div>\r\n</div>\r\n<div class="pp-component pp-number-formatter-component">\r\n	<div class="label">{{example_title}}</div>\r\n	<div class="value">{{example}}</div>\r\n</div>\r\n<button class="qirby-outlinebutton pp-add-property" qva-activate="reset()" qv-enter="reset()" ng-disabled="isDefaultFormat || resetting"\r\n        ng-show="showReset" q-translation="{{definition.resetTranslation}}"></button>',
			controller: ["$scope", function(b) {
				var d = function() {
					return b.data
				};
				a.defineLabel(b, b.definition, d, b.args.handler), a.defineVisible(b, b.args.handler), a.defineReadOnly(b, b.args.handler), a.defineChange(b, b.args.handler), a.defineValue(b, b.definition, d), m.thousandDelimiter = b.args.localeInfo.qMoneyThousandSep || "", m.decimalDelimiter = b.args.localeInfo.qMoneyDecimalSep || ".", l.pattern = b.args.localeInfo.qTimeFmt, n.thousandDelimiter = b.args.localeInfo.qThousandSep || "", n.decimalDelimiter = b.args.localeInfo.qDecimalSep || ".", b.onkeyup = function(a) {
					b.$apply(function() {
						b.example = g(b.data, a[0].value)
					})
				}, b.example_title = c.get("properties.numberFormatting.example"), b.example = g(b.data), b.resetting = !1, b.isDefaultFormat = i(b.data.tooltip.qNumberPresentations[0].qFmt, b.data, b.args.localeInfo), b.showReset = "R" === b.data.tooltip.qNumberPresentations[0].qType, b.reset = function() {
					b.resetting || (h(b.data, b.args.localeInfo), b.resetting = !0, b.$emit("saveProperties"))
				}, b.$on("datachanged", function() {
					b.example = g(b.data), b.resetting = !1, b.isDefaultFormat = i(b.data.tooltip.qNumberPresentations[0].qFmt, b.data, b.args.localeInfo), b.showReset = "R" === b.data.tooltip.qNumberPresentations[0].qType
				})
			}]
		};
		return b.addComponent("kf-tooltip-number-formatter", j), j
	})
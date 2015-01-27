define(["client.property-panel/components/components", "client.property-panel/component-utils", "general.utils/property-resolver", "general.utils/property-mapper", "util","general.utils/array-util"], function(a, b, c, d, e, f) {
		var g = {
			template: '<div class="pp-component pp-list-component" ng-if="visible" tcl="list">\r\n	<button class="qirby-outlinebutton pp-add-property" ng-disabled="addDisabled() || !definition.allowAdd" qva-activate="addClicked()" tid="add-item">\r\n		{{definition.addTranslation | translate}}\r\n	</button>\r\n\r\n	<ul class="pp-expandable-list pp-sublist" pp-sortable="sortableOptions">\r\n		<li ng-repeat="itemData in listData track by itemId( itemData )" ng-class="{ \'locked\': item.locked || !definition.allowMove }">\r\n			<div class="pp-expandable-list-header pp-sublist-header" qva-activate="expandClicked(this)" qva-longtapdrag="enableTouchDrag()"\r\n					ng-class="{ \'expanded\': isExpanded( itemData ), \'unused\': isUnused($index) }" pp-sortable-handle>\r\n				<i class="toggle-expand {{ isExpanded( itemData ) ? \'icon-triangle-bottom\' : \'icon-triangle-right\' }}"></i>\r\n				<span class="text">{{title(itemData, $index)}}</span>\r\n				<span class="icon icon-trash pp-delete-property" ng-if="definition.allowRemove" qva-activate="removeListItemClicked(itemData)" q-title-translation="Common.Delete"></span>\r\n			</div>\r\n			<div class="pp-expandable-list-content" ng-if="isExpanded( itemData )">\r\n				<div include-pp-component x-component="listItemComponent" x-definition="listItemDefinition" x-data="itemData" x-args="args"></div>\r\n			</div>\r\n		</li>\r\n	</ul>\r\n</div>',
			controller: ["$scope", function(f) {
				function g(a) {
					return f.definition.cId ? c.getValue(a, f.definition.cId, "") : a.cId
				}

				function h(a, b) {
					c.setValue(a, f.definition.cId || "cId", b)
				}

				function i() {
					return "function" == typeof f.definition.max ? f.definition.max.call(null, f.data, this) : f.definition.max || 1e6
				}
				var j = f.args.cache,
					k = "list_" + f.definition.ref + "_",
					l = function() {
						return f.data
					};
				b.defineValue(f, f.definition, l, "listData"), b.defineVisible(f, f.args.handler), f.listItemComponent = a.getComponent("items"), f.listItemDefinition = {
					items: f.definition.items || [],
					grouped: f.definition.grouped
				}, f.itemId = function(a) {
					var b = g(a);
					return b || (b = a.$$hashKey, h(a, b), delete a.$$hashKey), b
				}, f.isExpanded = function(a) {
					return j.get(k + g(a))
				}, f.expandClicked = function(a) {
					var b = g(a.itemData),
						c = j.get(k + b) || !1;
					j.put(k + b, !c)
				}, f.addClicked = function() {
					if (!f.addDisabled()) {
						var a = d.mapProperties(f.definition);
						a.cId = e.generateId(), f.listData.forEach(function(a) {
							j.remove(k + a.cId)
						}), "function" == typeof f.definition.add && f.definition.add.call(null, a, f.data, f.args.handler), f.listData.push(a), j.put(k + a.cId, !0), f.$emit("saveProperties")
					}
				}, f.removeListItemClicked = function(a) {
					var b = f.listData.indexOf(a);
					"function" == typeof f.definition.remove && f.definition.remove.call(null, a, f.data, f.args.handler), f.listData.splice(b, 1), f.$emit("saveProperties")
				}, f.sortableOptions = {
					disabled: !f.definition.allowMove,
					onMove: function(old_index, new_index) {
						if (new_index >= f.listData.length) {
       						 var k = new_index - f.listData.length;
        					while ((k--) + 1) {
            					f.listData.push(undefined);
        					}
    					}
    					f.listData.splice(new_index, 0, f.listData.splice(old_index, 1)[0]);
    					f.$emit("saveProperties");
					}
				}, f.addDisabled = function() {
					return f.definition.allowAdd && f.listData.length >= i()
				}, f.isUnused = function(a) {
					return a + 1 > i()
				}, f.title = function(a, b) {
					var d, e = f.definition.itemTitleRef;
					return e ? (d = "function" == typeof e ? e.call(null, a, b, f.args.handler) : c.getValue(a, e, ""), "object" == typeof d && (d = d.qStringExpression ? d.qStringExpression.qExpr : d.qValueExpression.qExpr)) : d = "" + (b + 1), d
				}
			}]
		};
		return a.addComponent("kfMeasureList", g), g
})
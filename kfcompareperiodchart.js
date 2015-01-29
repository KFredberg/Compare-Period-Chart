//TODO 
//add elemnumbers to data
//Add cyclic dimensions for date, week, month, year
//Add custom format for the dimensions


define(["jquery", "text!./kfcompareperiodchart.css", "translator", "general.utils/property-resolver", "general.utils/number-formatting", "util", "qlik", "client.utils/state", "./d3", "./components/kfMeasureList", "./components/kfDimNumberFormatter", "./comparechart", "./lodash.min"], function($, cssContent, translator, pResolver, numFormatting, util, qlik, state) {
	'use strict';
	$("<style>").html(cssContent).appendTo("head");

	function convertDate(date) {
		var result = new Date(1900, 0, 0);
		result.setDate(result.getDate() + date - 1);
		return result;
	};

	function updateDefaultModifiers(object) {

		var dateField = object.qListObjectDef.qDef.qFieldDefs[0];

		pResolver.setValue(object.kfModifierList[0].kfFilterSetList[0], "field", dateField);
		pResolver.setValue(object.kfModifierList[0].kfFilterSetList[0], "rangeFrom", "$(=Date(Min(" + dateField + ")))");
		pResolver.setValue(object.kfModifierList[0].kfFilterSetList[0], "rangeTo", "$(=Date(Max(" + dateField + ")))");
		updateFilterExpression(object.kfModifierList[0].kfFilterSetList[0]);
		pResolver.setValue(object.kfModifierList[1].kfFilterSetList[0], "field", dateField);
		pResolver.setValue(object.kfModifierList[1].kfFilterSetList[0], "rangeFrom", "$(=date(date(Min(" + dateField + "))+" + object.qListObjectDef.shiftDateBy + "))");
		pResolver.setValue(object.kfModifierList[1].kfFilterSetList[0], "rangeTo", "$(=date(date(Max(" + dateField + "))+" + object.qListObjectDef.shiftDateBy + "))");
		updateFilterExpression(object.kfModifierList[1].kfFilterSetList[0]);

		updateFilterSetExpression(object.kfModifierList);

		return true;
	};


	function updateFilterExpression(object) {

		var val = object.values.split(',').map(function(d) {
			return "[" + d.trimLeft().trimRight() + "]";
		}).join(",");

		switch (object.kfFilterType) {
			case 0:
				pResolver.setValue(object, "filterExpression", object.field + "=");
				break;
			case 1:
				pResolver.setValue(object, "filterExpression", object.field + "={" + val + "}");
				break;
			case 2:
				pResolver.setValue(object, "filterExpression", object.field + "={'*'} - {" + val + "}");
				break;
			case 3:
				pResolver.setValue(object, "filterExpression", object.field + "={'>=" + object.rangeFrom + "<=" + object.rangeTo + "'}");
				break;
			default:
				pResolver.setValue(object, "filterExpression", "default");
		}
		return true;
	}

	function updateActiveMeasure(a, b) {

		pResolver.setValue(b, "activeMeasure", Math.max(Math.min(b.activeMeasure, (b.kfMeasureList.length - 2)), 0));

	}

	function updateFilterSetExpression(kfModList) {

		kfModList.forEach(function(kfMod, modKey) {

			var filterSetExpression = "{$<"

			filterSetExpression += kfMod.kfFilterSetList.map(function(d) {
				return d.filterExpression;
			}).join(",");

			filterSetExpression += ">}"


			pResolver.setValue(kfMod, "kfFilterSetExpression", filterSetExpression);

		});

		return true;
	}

	function k(b, d) {
		return pResolver.getValue(b, "qListObjectDef.qDef.qNumberPresentations.qFmt") === numFormatting.getDefaultNumericFormat(b.qListObjectDef.qDef.qNumberPresentations, d ? d.localeInfo : "")
	}

	function l(b, d) {
		return pResolver.getValue(b, "qDef.qNumFormat.qFmt") === numFormatting.getDefaultNumericFormat(b.qDef.qNumFormat, d ? d.localeInfo : "")
	}

	function m(b) {
		var c = pResolver.getValue(b, "qDef.qNumFormat.qType");
		return ["R", "M", "IV"].contains(c) || "U" !== c && pResolver.getValue(b, "qDef.numFormatFromTemplate", !0) === !1
	}

	function n(b) {
		var c = pResolver.getValue(b, "qListObjectDef.qDef.qNumberPresentations.qType");
		return ["R", "M", "IV"].contains(c) || "U" !== c && pResolver.getValue(b, "qListObjectDef.qDef.numFormatFromTemplate", !0) === !1
	}



	return {
		initialProperties: {
			version: 1.0,
			kfMeasureList: [],
			kfModifierList: [],
			activeMeasure: 0,
			qListObjectDef: {
				comparePeriodType: 0,
				shiftDateBy: -364,
				periodType: 0,
				isDate: false,
				qDef: {
					qNumberPresentations: [{
						qType: 'D',
						qFmt: 'WWW YYYY-MM-DD',
						qUseThou: 0,
						qnDec: 0

					}]
				},
				qSortCriterias: {
					qSortByNumeric: 1
				},
				qInitialDataFetch: [{
					qWidth: 2,
					qHeight: 1000
				}]
			},
			currentPeriod: {
				qHyperCubeDef: {
					qDimensions: [],
					qMeasures: [],
					qInitialDataFetch: [{
						qWidth: 4,
						qHeight: 1000
					}]
				}
			},
			comparePeriod: {
				qHyperCubeDef: {
					qDimensions: [],
					qMeasures: [],
					qInitialDataFetch: [{
						qWidth: 4,
						qHeight: 1000
					}]
				}
			}
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimension: {
					type: "items",
					label: "Fields",
					translation: "Common.Dimension",
					ref: "qListObjectDef",
					min: 1,
					max: 1,
					items: {
						label: {
							type: "string",
							ref: "qListObjectDef.qDef.qFieldLabels.0",
							translation: "Common.Label",
							show: true
						},
						libraryId: {
							type: "string",
							component: "library-item",
							libraryItemType: "dimension",
							ref: "qListObjectDef.qLibraryId",
							translation: "Date field",
							show: function(data) {
								return data.qListObjectDef && data.qListObjectDef.qLibraryId;
							}
						},
						field: {
							type: "string",
							expression: "always",
							expressionType: "dimension",
							ref: "qListObjectDef.qDef.qFieldDefs.0",
							translation: "Date field",
							show: function(data) {
								return data.qListObjectDef && !data.qListObjectDef.qLibraryId;
							}
						},
						comparePeriodType: {
							ref: "qListObjectDef.comparePeriodType",
							label: "Compare with",
							component: "dropdown",
							options: [{
								value: 0,
								label: "Previous year"
							}, {
								value: 1,
								label: "Previous period"
							}, {
								value: 2,
								label: "Custom Period"
							}],
							defaultValue: 0
						},
						shiftDateBy: {
							ref: "qListObjectDef.shiftDateBy",
							label: "Shift date by",
							type: "number",
							defaultValue: -364,
							show: function(data) {
								return data.qListObjectDef.comparePeriodType == 2;
							}
						},
						periodType: {
							type: "numeric",
							component: "dropdown",
							label: "Period Type",
							ref: "qListObjectDef.periodType",
							options: [{
								value: 0,
								label: "Min-Max range"
							}, {
								value: 1,
								label: "Selected dates only"
							}],
							defaultValue: 0
						},
						isDate: {
							ref: "qListObjectDef.isDate",
							label: "isDate",
							type: "boolean",
							defaultValue: false,
							show: false
						},
						qSortByNumeric: {
							type: "numeric",
							component: "dropdown",
							label: "Sort by Numeric",
							ref: "qListObjectDef.qDef.qSortCriterias.0.qSortByNumeric",
							options: [{
								value: 1,
								label: "Ascending"
							}, {
								value: 0,
								label: "No"
							}, {
								value: -1,
								label: "Descending"
							}],
							defaultValue: 1,
						}
					}
				},
				kfMeasureList: {
					type: "array",
					component: "kfMeasureList",
					translation: "Common.Measures",
					ref: "kfMeasureList",
					//max: 1,
					allowAdd: true,
					allowRemove: true,
					allowMove: true,
					addTranslation: "properties.measures.add",
					grouped: true,
					itemTitleRef: "qDef.kfMeasureLabel",
					ppPath: "kfMeasureList",
					items: {
						kfMeasureLabel: {
							type: "string",
							ref: "qDef.kfMeasureLabel",
							label: "Label",
							show: true,
							defaultValue: ""
						},
						kfMeasure: {
							type: "string",
							expression: "always",
							expressionType: "measure",
							ref: "qDef.qDef",
							label: "Measure",
							defaultValue: "",
							change: function(a, b) {
								if (a.qDef.kfMeasureLabel == '') {
									a.qDef.kfMeasureLabel = a.qDef.qDef
								};
								return true;
							}
						},
						kfMeasuresType: {
							type: "boolean",
							component: "switch",
							label: "Expression type",
							ref: "qDef.kfMeasuresType",
							defaultValue: false,
							options: [{
								value: false,
								translation: "properties.numberFormatting.simple"
							}, {
								value: true,
								translation: "Advanced"
							}]
						},
						kfAdvancedExpDiscription: {
							component: "text",
							translation: "Use #Set where you want the column modifier to be inserted. Use #filters instead if you want the column modifier to be inserted into an existing set analysis. Can be used multiple times in an expression.",
							show: function(a) {
								return a.kfMeasuresType
							}
						},
						numberFormatting: {
							type: "items",
							items: {
								numberFormattingType: {
									type: "string",
									component: "dropdown",
									ref: "qDef.qNumFormat.qType",
									translation: "properties.numberFormatting",
									defaultValue: "U",
									options: [{
										value: "U",
										translation: "Common.Auto"
									}, {
										value: "F",
										translation: "properties.numberFormatting.types.number"
									}, {
										value: "M",
										translation: "properties.numberFormatting.types.money"
									}, {
										value: "D",
										translation: "properties.numberFormatting.types.date"
									}, {
										value: "IV",
										translation: "properties.numberFormatting.types.duration"
									}, {
										value: "R",
										translation: "Common.Custom"
									}],
									change: function(a, b, d, e) {
										numFormatting.setNumFmtPattern("qType", a.qDef.qNumFormat, e.localeInfo)
									}
								},
								numberFormattingMode: {
									type: "boolean",
									component: "switch",
									ref: "qDef.numFormatFromTemplate",
									translation: "properties.numberFormatting.formatting",
									defaultValue: !0,
									options: [{
										value: !0,
										translation: "properties.numberFormatting.simple"
									}, {
										value: !1,
										translation: "Common.Custom"
									}],
									show: function(b) {
										return ["F", "D", "TS", "T"].contains(pResolver.getValue(b, "qDef.qNumFormat.qType"))
									}
								},
								numberFormattingTemplates: {
									type: "string",
									component: "number-formatter-dropdown",
									ref: "qDef.qNumFormat.qFmt",
									defaultValue: "#,##0",
									show: function(b) {
										var c = pResolver.getValue(b, "qDef.qNumFormat.qType");
										return ["F", "D", "TS", "T"].contains(c) && pResolver.getValue(b, "numFormatFromTemplate", !0) === !0
									},
									filter: function(b) {
										return [pResolver.getValue(b, "qDef.qNumFormat.qType", "F")]
									}
								},
								numDecimals: {
									type: "integer",
									ref: "qDef.qNumFormat.qnDec",
									translation: "properties.numberFormatting.nDec",
									defaultValue: 2,
									min: 0,
									max: 14,
									show: !1
								},
								numPrecisionDigits: {
									type: "integer",
									ref: "qDef.qNumFormat.qnDec",
									translation: "properties.numberFormatting.significantFigures",
									defaultValue: 10,
									min: 1,
									max: 14,
									show: !1
								},
								decimalSep: {
									type: "string",
									ref: "qDef.qNumFormat.qDec",
									translation: "properties.numberFormatting.dec",
									defaultValue: ".",
									show: function(b) {
										var c = pResolver.getValue(b, "qDef.qNumFormat.qType");
										return "R" === c
									},
									change: function(a, b, d, e) {
										numFormatting.setNumFmtPattern("qDec", pResolver.qDef.qNumFormat, e.localeInfo)
									},
									invalid: function(b) {
										return pResolver.getValue(b, "qDef.qNumFormat.qDec") === pResolver.getValue(b, "qDef.qNumFormat.qThou")
									},
									readOnly: function(a, b, c, d) {
										return !l(a, d)
									}
								},
								thousandSep: {
									type: "string",
									ref: "qDef.qNumFormat.qThou",
									translation: "properties.numberFormatting.thousandSeparator",
									defaultValue: "",
									show: function(b) {
										var c = pResolver.getValue(b, "qDef.qNumFormat.qType");
										return "R" === c
									},
									change: function(a, b, d, e) {
										numFormatting.setNumFmtPattern("qThou", pResolver.qDef.qNumFormat, e.localeInfo)
									},
									invalid: function(b) {
										var c = pResolver.getValue(b, "qDef.qNumFormat.qType");
										return "I" === c ? !1 : pResolver.getValue(b, "qDef.qNumFormat.qDec") === pResolver.getValue(b, "qDef.qNumFormat.qThou")
									},
									readOnly: function(a, b, c, d) {
										return !l(a, d)
									}
								},
								format: {
									type: "string",
									component: "kf-dim-number-formatter",
									ref: "qDef.qNumFormat.qFmt",
									resetTranslation: "properties.numberFormatting.resetPattern",
									translation: "properties.numberFormatting.formatPattern",
									defaultValue: "",
									show: function(a) {
										return m(a)
									},
									invalid: function(a, b, c) {
										if (["D", "T", "TS", "IV"].contains(a.qDef.qNumFormat.qType)) return !1;
										var d = "R" === a.qDef.qNumFormat.qType ? a.qDef.qNumFormat.qDec : c.localeInfo["q" + ("M" === a.qDef.qNumFormat.qType ? "Money" : "") + "DecimalSep"],
											e = new RegExp("(0|#)" + util.escapeRegExp(d) + "0*#*"),
											f = (a.qDef.qNumFormat.qFmt || "").split(";"),
											h = f[0].match(e),
											i = h && h[0] ? h[0].length - 2 : 0,
											j = f[1] ? f[1].match(e) : null,
											k = j && j[0] ? j[0].length - 2 : 0;
										return i > 15 || k > 15
									}
								}
							}
						}
					},
					remove: function(a, b) {
						updateActiveMeasure(a, b);
					}
				},
				kfModifierList: {
					type: "array",
					translation: "Modifiers",
					ref: "kfModifierList",
					allowAdd: false,
					allowRemove: false,
					allowMove: false,
					addTranslation: "Add modifier",
					grouped: true,
					itemTitleRef: "kfModifierLabel",
					items: {
						modifierLabel: {
							type: "string",
							ref: "kfModifierLabel",
							label: "Label",
							expression: "optional",
							show: !1,
							defaultValue: ""
						},
						modifierType: {
							component: "dropdown",
							ref: "kfModifierType",
							translation: "Modifier type",
							options: [{
								value: 0,
								label: "Set"
							}, {
								value: 1,
								label: "Filter set"
							}, {
								value: 2,
								label: "Column expression"
							}],
							show: false,
							defaultValue: 1,
							change: function(a, b) {
								if (a.kfSet == "") {
									pResolver.setValue(a, "kfSet", a.kfFilterSetExpression);
								};
								return true;
							}
						},
						kfSet: {
							type: "string",
							expression: "always",
							ref: "kfSet",
							label: "Set",
							defaultValue: "",
							show: function(a) {
								return (a.kfModifierType == 0);
							}
						},
						kfSetDiscription: {
							component: "text",
							translation: "Set with this format {$<...>} is only supported in this version",
							show: function(a) {
								return (a.kfModifierType == 0);
							}
						},
						kfColumnExp: {
							type: "string",
							expression: "always",
							expressionType: "measure",
							ref: "kfColumnExp",
							label: "Column expression",
							defaultValue: "",
							show: function(a) {
								return (a.kfModifierType == 2);
							}
						},
						kfFilterSetList: {
							type: "array",
							translation: "Filters",
							ref: "kfFilterSetList",
							min: 1,
							allowAdd: true,
							allowRemove: true,
							allowMove: false,
							addTranslation: "Add filter",
							grouped: true,
							sourceType: "kfFilter",
							itemTitleRef: "filterExpression",
							items: {
								filterExpression: {
									type: "string",
									ref: "filterExpression",
									label: "Expression",
									show: false,
									defaultValue: "",
									readOnly: true
								},
								field: {
									type: "string",
									expression: "always",
									expressionType: "field",
									ref: "field",
									label: "Field",
									change: function(a, b) {
										updateFilterExpression(a, b);
										return updateFilterSetExpression(b.properties.kfModifierList);
									}
								},
								filterType: {
									component: "dropdown",
									ref: "kfFilterType",
									translation: "Modifier type",
									options: [{
										value: 0,
										label: "Ignore selections in field"
									}, {
										value: 1,
										label: "Equal to"
									}, {
										value: 2,
										label: "Not equal to"
									}, {
										value: 3,
										label: "Range"
									}],
									show: true,
									defaultValue: 0,
									change: function(a, b) {
										updateFilterExpression(a, b);
										return updateFilterSetExpression(b.properties.kfModifierList);
									}
								},
								values: {
									type: "string",
									ref: "values",
									label: "Values",
									show: function(a) {
										return (a.kfFilterType == 1 || a.kfFilterType == 2);
									},
									change: function(a, b) {
										updateFilterExpression(a, b);
										return updateFilterSetExpression(b.properties.kfModifierList);
									}
								},
								rangeFrom: {
									type: "string",
									ref: "rangeFrom",
									label: "Range from (>=)",
									show: function(a) {
										return (a.kfFilterType == 3);
									},
									change: function(a, b) {
										updateFilterExpression(a, b);
										return updateFilterSetExpression(b.properties.kfModifierList);
									}
								},
								rangeTo: {
									type: "string",
									ref: "rangeTo",
									label: "Range to (<=)",
									show: function(a) {
										return (a.kfFilterType == 3);
									},
									change: function(a, b) {
										updateFilterExpression(a, b);
										return updateFilterSetExpression(b.properties.kfModifierList);
									}
								}
							},
							show: function(a) {
								return (a.kfModifierType == 1);
							}
						},
						kfFilterSetExpression: {
							label: "Filter set expression",
							type: "string",
							ref: "kfFilterSetExpression",
							defaultValue: "",
							show: function(a) {
								return (a.kfModifierType == 1);
							},
							change: function(a, b) {
								return updateFilterSetExpression(b.properties.kfModifierList);
							}
						},
						kfModifierHide: {
							label: "Hide column",
							type: "boolean",
							ref: "kfModifierHide",
							defaultValue: false,
							show: false
						}
					}
				},
				settings: {
					uses: "settings",
					items: {
						presentation: {
							type: "items",
							translation: "properties.presentation",
							grouped: !0,
							items: {
								lineType: {
									ref: "lineType",
									type: "string",
									component: "item-selection-list",
									defaultValue: "area",
									horizontal: !0,
									items: [{
										width: 80,
										height: 80,
										icon: "ø",
										component: "icon-item",
										labelPlacement: "bottom",
										labelStyle: "text-align:center; width: 90px; overflow:hidden; text-overflow: ellipsis;",
										translation: "properties.style.area",
										value: "area"
									}, {
										width: 80,
										height: 80,
										icon: "æ",
										component: "icon-item",
										labelPlacement: "bottom",
										labelStyle: "text-align:center; width: 90px; overflow:hidden; text-overflow: ellipsis;",
										translation: "properties.style.line",
										value: "line"
									}]
								},
								nullMode: {
									type: "string",
									component: "dropdown",
									ref: "nullMode",
									translation: "properties.nullMode",
									options: [{
										value: "gap",
										translation: "properties.nullMode.gap"
									}, {
										value: "zero",
										translation: "properties.nullMode.zero"
									/*}, {
										value: "connect",
										translation: "properties.nullMode.connect"*/
									}],
									defaultValue: "gap"
								},
								dataPoints: {
									ref: "dataPoint.show",
									translation: "properties.dataPoints.showDataPoints",
									type: "boolean",
									defaultValue: !1,
									snapshot: !0
								},
								showDataPointLabels: {
									ref: "dataPoint.showLabels",
									translation: "properties.dataPoints.showLabelsOnDataPoints",
									type: "boolean",
									defaultValue: !1,
									show: function(a) {
										return !1 //a.dataPoint && a.dataPoint.show
									},
									snapshot: !0
								},
								/*gridLines: {
									type: "items",
									items: {
										showGridLines: {
											ref: "gridLine.auto",
											type: "boolean",
											translation: "properties.gridLine.spacing",
											component: "switch",
											defaultValue: !0,
											options: [{
												value: !0,
												translation: "Common.Auto"
											}, {
												value: !1,
												translation: "Common.Custom"
											}]
										},
										gridSpacing: {
											type: "number",
											component: "dropdown",
											ref: "gridLine.spacing",
											defaultValue: 2,
											options: [{
												value: 0,
												label: "properties.gridLine.noLines"
											}, {
												value: 1,
												label: "properties.gridLine.wide"
											}, {
												value: 2,
												label: "properties.gridLine.medium"
											}, {
												value: 3,
												label: "properties.gridLine.narrow"
											}],
											show: function(a) {
												return a.gridLine && !a.gridLine.auto
											}
										}
									}
								}*/
							}
						},
						/*colorsAndLegend: {
							uses: "colorsAndLegend",
							items: {
								colors: {
									items: {
										colorMode: {
											filter: function(a, b) {
												var c = ["primary"];
												return 1 === b.getMeasures().length && b.getDimensions().length <= 1 && c.push("byMeasure"), (b.getMeasures().length > 1 || b.getDimensions().length > 1) && c.push("byDimension"), b.getMeasures().length >= 1 && c.push("byExpression"), c
											}
										}
									}
								}
							}
						},*/
						dimensionAxis: {
							type: "items",
							label: translator.get("properties.xAxis"),
							items: {
								show: {
									type: "string",
									component: "dropdown",
									ref: "dimensionAxis.show",
									translation: "properties.axis.labelsAndTitle",
									options: [{
										value: "all",
										translation: "properties.axis.show.all"
											/*}, {
												value: "labels",
												translation: "properties.axis.show.labels"
											}, {
												value: "title",
												translation: "properties.axis.show.title"
											}, {
												value: "none",
												translation: "Common.None"*/
									}],
									defaultValue: "all",
									snapshot: !0
								},
								label: {
									type: "string",
									component: "dropdown",
									ref: "dimensionAxis.label",
									translation: "properties.axis.labelOrientation",
									options: [{
										value: "auto",
										translation: "Common.Auto"
											/*}, {
												value: "horizontal",
												translation: "Common.Horizontal"
											}, {
												value: "tilted",
												translation: "properties.labels.tilted"*/
									}],
									defaultValue: "auto",
									show: function(a) {
										return a.dimensionAxis && ["all", "labels"].contains(a.dimensionAxis.show)
									}
								},
								/*dock: {
									type: "string",
									component: "dropdown",
									ref: "dimensionAxis.dock",
									translation: "Common.Position",
									options: [{
										value: "near",
										label: "Common.Bottom"
									}, {
										value: "far",
										label: "Common.Top"
									}],
									show: function(a) {
										return a.dimensionAxis && "none" !== a.dimensionAxis.show
									},
									defaultValue: "near"
								}*/
							}
						},
						measureAxis: {
							type: "items",
							label: function(b, c) {
								var d, e = c.getMeasureLayout(0);
								return d = e ? translator.get("properties.measureAxisWithInfo", [e.qFallbackTitle]) : translator.get("properties.yAxis")
							},
							grouped: !0,
							items: {
								axis: {
									type: "items",
									items: {
										show: {
											ref: "measureAxis.show",
											translation: "properties.axis.labelsAndTitle",
											type: "string",
											component: "dropdown",
											options: [{
												value: "all",
												translation: "properties.axis.show.all"
													/*}, {
														value: "labels",
														translation: "properties.axis.show.labels"
													}, {
														value: "title",
														translation: "properties.axis.show.title"
													}, {
														value: "none",
														translation: "Common.None"*/
											}],
											defaultValue: "all"
										},
										label: {
											ref: "measureAxis.label",
											translation: "properties.axis.labelOrentation",
											type: "string",
											component: "dropdown",
											options: [{
												value: "auto",
												translation: "Common.Auto"
													/*}, {
														value: "none",
														translation: "Common.None"
													}, {
														value: "horizontal",
														translation: "Common.Horizontal"*/
											}],
											defaultValue: "auto",
											show: function() {
												return !1
											}
										},
										spacing: {
											ref: "measureAxis.spacing",
											translation: "properties.axis.scale",
											type: "number",
											component: "dropdown",
											defaultValue: 1,
											show: function(a) {
												return a.measureAxis && "none" !== a.measureAxis.show
											},
											options: [{
												value: 1,
												label: "properties.gridLine.medium"
													/*}, {
														value: 2,
														label: "properties.gridLine.wide"
													}, {
														value: .5,
														label: "properties.gridLine.narrow"*/
											}]
										}
									}
								}
							}
						},
						tooltip: {
							type: "items",
							label: "Tooltip",
							grouped: !0,
							items: {
								axis: {
									type: "items",
									items: {
										format: {
											type: "string",
											component: "kf-dim-number-formatter",
											ref: "qListObjectDef.qDef.qNumberPresentations.0.qFmt",
											resetTranslation: "properties.numberFormatting.resetPattern",
											translation: "properties.numberFormatting.formatPattern",
											defaultValue: "WWW YYYY-MM-DD",
											show: !0,
											invalid: function(a, b, c) {
												if (["D", "T", "TS", "IV"].contains(a.qListObjectDef.qDef.qNumberPresentations[0].qType)) return !1;
												var d = "R" === a.qListObjectDef.qDef.qNumberPresentations[0].qType ? a.qListObjectDef.qDef.qNumberPresentations[0].qDec : c.localeInfo["q" + ("M" === a.qListObjectDef.qDef.qNumberPresentations[0].qType ? "Money" : "") + "DecimalSep"],
													e = new RegExp("(0|#)" + util.escapeRegExp(d) + "0*#*"),
													f = (a.qListObjectDef.qDef.qNumberPresentations[0].qFmt || "").split(";"),
													h = f[0].match(e),
													i = h && h[0] ? h[0].length - 2 : 0,
													j = f[1] ? f[1].match(e) : null,
													k = j && j[0] ? j[0].length - 2 : 0;
												return i > 15 || k > 15
											}

										},
										arrow: {
											ref: "tooltip.showSymbol",
											translation: "Show arrow",
											type: "boolean",
											defaultValue: !0,
											snapshot: !0
										},
										change: {
											ref: "tooltip.showChange",
											translation: "Show change %",
											type: "boolean",
											defaultValue: !0,
											snapshot: !0
										},

									}
								}
							}
						}
					}
				}
			}
		},
		snapshot: {
			canTakeSnapshot: true
		},


		paint: function($element, layout) {

			console.log('layout');
			console.log(layout);

			var errors = []

			var me = this;

			if (layout.kfModifierList.length < 2) {
				this.backendApi.getProperties().then(function(reply) {
					reply.kfModifierList = [{
						cId: util.generateId(),
						kfModifierLabel: "Current period",
						kfFilterSetList: [{
							readOnly: true,
							filterExpression: "",
							field: "date",
							kfFilterType: 3,
							values: "",
							rangeFrom: "",
							rangeTo: ""
						}],
						kfFilterSetExpression: "",
						kfModifierType: 1
					}, {
						cId: util.generateId(),
						kfModifierLabel: "Compare period",
						kfFilterSetList: [{
							readOnly: true,
							filterExpression: "",
							field: "date",
							kfFilterType: 3,
							values: "",
							rangeFrom: "",
							rangeTo: ""
						}],
						kfFilterSetExpression: "",
						kfModifierType: 1
					}];
					me.backendApi.setProperties(reply);
				});
			}

			console.log(layout);

			var dateFieldIsDate = layout.qListObject.qDimensionInfo.qNumFormat.qType == 'D'

			if (!dateFieldIsDate) {
				errors.push({
					"message": "Dimension is not of date format"
				});
			}


			if (dateFieldIsDate) {

				// get qMatrix data array
				var qMatrixCurrent = layout.currentPeriod.qHyperCube.qDataPages[0].qMatrix;
				var qMatrixCompare = layout.comparePeriod.qHyperCube.qDataPages[0].qMatrix;
				var qMatrixDate = layout.qListObject.qDataPages[0].qMatrix;

				console.log("qMatrixDate");
				console.log(qMatrixDate);

				//check the selected dates
				var selectedates = qMatrixDate.filter(function(d) {
					return (d[0].qState == 'S')
				}).map(function(d) {
					return d[0].qNum
				});

				//check the possible dates
				var possibleDates = qMatrixDate.filter(function(d) {
					return (d[0].qState == 'O')
				}).map(function(d) {
					return d[0].qNum
				});

				var selectionInDateDim = (selectedates.length != 0)


				if (selectionInDateDim) {
					var minDate = selectedates[0]
					var maxDate = selectedates[selectedates.length - 1]
				} else {
					var minDate = possibleDates[0]; //+ layout.qListObject.shiftDateBy;
					var maxDate = possibleDates[possibleDates.length - 1];
				}
			}

			//update the measures

			this.backendApi.getProperties().then(function(reply) {
				updateDefaultModifiers(reply);

				if (reply.qListObjectDef.comparePeriodType == 0) { //previous year

					reply.qListObjectDef.shiftDateBy = -364

				} else if (reply.qListObjectDef.comparePeriodType == 1) { //previous period

					reply.qListObjectDef.shiftDateBy = minDate - maxDate - 1

				}

				me.backendApi.setProperties(reply);
			});

			this.backendApi.getProperties().then(function(reply) {

				reply.currentPeriod.qHyperCubeDef.qDimensions.length = 0;
				reply.comparePeriod.qHyperCubeDef.qDimensions.length = 0;

				reply.currentPeriod.qHyperCubeDef.qDimensions.push({
					qDef: {
						qFieldDefs: [reply.qListObjectDef.qDef.qFieldDefs[0]],
						qFieldLabels: [reply.qListObjectDef.qDef.qFieldLabels[0]],
						autoSort: true,
						qSortCriterias: [reply.qListObjectDef.qSortCriterias],
						qNumberPresentations: reply.qListObjectDef.qDef.qNumberPresentations
					},
					qGrouping: 'C',
					qActiveField: 0



				});
				reply.comparePeriod.qHyperCubeDef.qDimensions.push({
					qDef: {
						qFieldDefs: [reply.qListObjectDef.qDef.qFieldDefs[0]],
						qFieldLabels: [reply.qListObjectDef.qDef.qFieldLabels[0]],
						autoSort: true,
						qSortCriterias: [reply.qListObjectDef.qSortCriterias],
						qNumberPresentations: reply.qListObjectDef.qDef.qNumberPresentations
					},
					qGrouping: 'C',
					qActiveField: 0,



				});

				//
				console.log('reply');
				console.log(reply);

				//remove old measures
				reply.currentPeriod.qHyperCubeDef.qMeasures.length = 0;
				reply.comparePeriod.qHyperCubeDef.qMeasures.length = 0;

				//loop through all rows and columns and create a measure for each combination
				reply.kfMeasureList.forEach(function(kfMea, meaKey) {
					reply.kfModifierList.forEach(function(kfMod, modKey) {
						var qDefString = kfMea.qDef.qDef;
						var columnExpString = kfMod.kfColumnExp;
						var kfFiltersString = '';
						var modifierLength = reply.kfModifierList.length;

						if (!kfMea.kfMeasuresType) {
							qDefString = qDefString.replace(/Sum\(/gi, "Sum(#Set ")
								.replace(/Avg\(/gi, "Avg(#Set ")
								.replace(/Count\(/gi, "Count(#Set ")
								.replace(/Max\(/gi, "Max(#Set ")
								.replace(/Min\(/gi, "Min(#Set ");
						};

						switch (kfMod.kfModifierType) {
							case 0: //set
								qDefString = qDefString.replace(/#set/gi, "{$< #filters >}")
									.replace(/#filters/gi, kfMod.kfSet.substring(3, kfMod.kfSet.length - 2));
								break;
							case 1: //filter set
								qDefString = qDefString.replace(/#set/gi, "{$< #filters >}")
									.replace(/#filters/gi, kfMod.kfFilterSetList.map(function(d) {
										return d.filterExpression;
									}).join(','));
								break;
							case 2: //column expession
								var columnsNum = getColumnNumbers(kfMod.kfColumnExp).map(function(d) {
									return {
										"origNum": d,
										"newNum": (meaKey * modifierLength) + d
									}
								});
								columnsNum.forEach(function(num, numKey) {
									var regEx = "/Column\(" + num.origNum + "\)/gi";
									columnExpString = columnExpString.replace(regEx, "Column(" + num.newNum + ")");
								});
								qDefString = columnExpString;
								break;
							default:
								qDefString = qDefString.replace(/#set/gi, "");
						}
						if (modKey == 0) {
							reply.currentPeriod.qHyperCubeDef.qMeasures.push({
								qDef: {
									qDef: qDefString,
									qLabel: kfMea.kfMeasureLabel + ' - ' + kfMod.kfModifierLabel,
									qNumFormat: kfMea.qDef.qNumFormat
								}
							});
						} else {
							reply.comparePeriod.qHyperCubeDef.qMeasures.push({
								qDef: {
									qDef: qDefString,
									qLabel: kfMea.kfMeasureLabel + ' - ' + kfMod.kfModifierLabel,
									qNumFormat: kfMea.qDef.qNumFormat
								}
							});
						}
					});
				});
				me.backendApi.setProperties(reply);
			});

			//getData

			var data = []
			var dimBuckets = []

			// Scale the range of the data

			if (layout.qListObject.periodType == 1) {
				if (selectedates.length > 0) {
					dimBuckets = selectedates.map(function(d) {
						return convertDate(d);
					});
				} else {
					dimBuckets = possibleDates.map(function(d) {
						return convertDate(d);
					});
				}

			} else {
				dimBuckets = d3.time.days(convertDate(minDate), convertDate(maxDate + 1));
			}

			var dimRangeBuckets = d3.time.days(convertDate(minDate), convertDate(maxDate + 1));

			var color = d3.scale.category10().domain(d3.range(0, 10)); // set the colour scale

			if (layout.kfMeasureList.length == 0) {
				errors.push({
					"message": "Missing measures"
				});
			}
			layout.kfMeasureList.forEach(function(kfMea, key) {


				if (kfMea.qDef.qDef == '') {
					errors.push({
						"message": "Measure nr " + (key + 1) + " is empty"
					});
				} else {

					var missingValues = 0

					var missingValue = layout.nullMode == 'gap' ? null : 0;

					var dataPointSize = layout.dataPoint.show ? 3 : 0

					var newData = qMatrixCurrent.map(function(d) {


						if (d[key + 1].qNum == 'NaN') {
							missingValues += 1
						}

						return {
							"qElemNumbers": [d[0].qElemNumber],
							"x": convertDate(d[0].qNum),
							"xText": d[0].qText,
							"y": d[key + 1].qNum,
							"yText": d[key + 1].qText,
							"size": dataPointSize
						}
					});

					if (missingValues == newData.length) {
						errors.push({
							"message": "Measure nr " + (key + 1) + " has no data"
						});
					}

					newData = dimBuckets
						.map(function(dimBucket) {
							return _.find(newData, {
								x: dimBucket
							}) || {
								x: dimBucket,
								xText: '-',
								y: missingValue,
								yText: '-',
								size: dataPointSize
							};
						});

					newData = dimRangeBuckets
						.map(function(dimRangeBuckets) {
							return _.find(newData, {
								x: dimRangeBuckets
							}) || {
								x: dimRangeBuckets,
								xText: '-',
								y: missingValue,
								yText: '-',
								size: dataPointSize
							};
						});

					data.push({
						"key": kfMea.qDef.kfMeasureLabel,
						"label": "",
						"color": color(key * 2),
						"area": layout.lineType == 'area',
						"disabled": key != layout.activeMeasure,
						"values": newData
					});

					newData = qMatrixCompare.map(function(d) {
						return {
							"x": convertDate(d[0].qNum - layout.qListObject.shiftDateBy),
							"xText": d[0].qText,
							"y": d[key + 1].qNum,
							"yText": d[key + 1].qText,
							"size": dataPointSize
						}
					});

					newData = dimBuckets
						.map(function(dimBucket) {
							return _.find(newData, {
								x: dimBucket
							}) || {
								x: dimBucket,
								xText: '-',
								y: missingValue,
								yText: '-',
								size: dataPointSize
							};
						});

					newData = dimRangeBuckets
						.map(function(dimRangeBuckets) {
							return _.find(newData, {
								x: dimRangeBuckets
							}) || {
								x: dimRangeBuckets,
								xText: '-',
								y: missingValue,
								yText: '-',
								size: dataPointSize
							};
						});

					data.push({
						"key": kfMea.qDef.kfMeasureLabel + ' - compare',
						"label": "",
						"color": color((key * 2) + 1),
						"comparePeriod": true,
						"disabled": key != layout.activeMeasure,
						"values": newData
					});
				}
			});

			var labels = layout.currentPeriod.qHyperCube.qDimensionInfo.map(function(d) {
				return d.qFallbackTitle;
			});

			// create a new array that contains the measure labels
			labels.push(layout.currentPeriod.qHyperCube.qMeasureInfo.map(function(d) {
				return d.qFallbackTitle;
			}));


			// Chart object width
			var width = $element.width();
			// Chart object height
			var height = $element.height();
			// Chart object id
			var id = "container_" + layout.qInfo.qId;

			// Check to see if the chart element has already been created
			if (document.getElementById(id)) {
				// if it has been created, empty it's contents so we can redraw it
				$("#" + id).empty();
			} else {
				// if it hasn't been created, create it with the appropiate id and size
				$element.append($('<div />').attr("id", id).width(width).height(height));
			}

			//update vis if all requierments are fullfilled else through error messages
			if (errors.length == 0) {
				viz(data, labels, width, height, id, layout, me, state.isInEditMode());
			} else {
				var html = '<div class="object-error"><div class="object-error-content"><div class="object-error-title">Error</div>'

				errors.forEach(function(error, key) {
					html += '<div class="object-error-message">' + error.message + '</div>'
				});
				html += '</div></div>'

				$("#" + id).append(html);
			}


		}
	};
});

var viz = function(data, labels, width, height, id, layout, that, isInEditMode) {

	var chart = compareChart();

	var symbols = {
		'thousands': 'TSEK',
		'millions': 'MSEK',
		'billions': 'MDSEK',
		'symbol': 'SEK'
	}

	chart.width(width)
		.height(height)
		.id(id)
		.labels(labels)
		.layout(layout)
		.showTooltipSymbol(layout.tooltip.showSymbol)
		.showTooltipChange(layout.tooltip.showChange)
		.inEditMode(isInEditMode)
		.that(that)
		.symbols(symbols)
		.legend().that(that);

	d3.select("#" + id).append('svg')
		.attr("width", width)
		.attr("height", height)
		.datum(data)
		.call(chart);

}
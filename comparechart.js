//TODO 
//Remove animations for area and line
//Y-Axis scale and ticks
//Show/hide axis labels/ticks
//X-Axis ticks format
//Cleanup code
function compareChart() {

	var lines = line();
	var legend = kf_legend();
	var yAxis = y_axis();
	var xAxis = x_date_axis();


	var margin = {
			top: 50,
			right: 20,
			bottom: 70,
			left: 90
		},
		width,
		height,
		id,
		labels,
		layout,
		that,
		singlePoint;
	inEditMode = true;


	var selectionArray = [];
	var selectionArray0 = [];

	var xValue = function(d) {
		return d.x;
	}
	var yValue = function(d) {
		return d.y;
	}
	var sizeValue = function(d) {
		return d.size || 0
	}
	var isArea = function(d) {
		return d.area
	}
	var isDisabled = function(d) {
		return d.disabled
	}
	var getKey = function(d) {
		return d.key;
	}

	var defsid = Math.floor(Math.random() * 100000);

	var symbols = {};

	var dimFormat = function(d) {
		return d
	}

	var showTooltipSymbol = true

	var showTooltipChange = true


	var transitionDuration = 250

	var interpolate = "linear"

	var highlightedPoint = highlightedPoint0 = -1

	var showLegend = true
	var showYAxis = true
	var showGridLines = false
	var showXAxis = true
	var selectionMode = false

	yAxis.orient('left');
	xAxis.orient('bottom');

	var x = d3.scale.linear(),
		y = d3.scale.linear();
	var x0, y0;

	var state = {},
		defaultState = null,
		dispatch = d3.dispatch('legendClick', 'legendDblclick', 'legendMouseover', 'legendMouseout', 'stateChange', 'changeState');


	var offsetX = 60,
		offsetY = 60;

	var parseDate = d3.time.format("%Y-%m-%d").parse,
		formatTime = d3.time.format("%e %B"),
		formatValue = d3.format("s"),
		formatPercent = d3.format(",.1%");
	var formatDate = function(d) {
		var output = dimFormat.format(d);
		return output;
	};

	function chart(selection) {
		selection.each(function(data) {

			singlePoint = data[0].values.length == 1;

			var container = d3.select(this),
				me = this;

			var labelsPer100Px = (width || parseInt(container.style('width')) || 960) / (data[0].values.length * 100)
			var rotateXLabels = 1 > labelsPer100Px;

			if (rotateXLabels) {
				margin = {
					top: 50,
					right: 20,
					bottom: 80,
					left: 90
				}
			} else {
				margin = {
					top: 50,
					right: 20,
					bottom: 40,
					left: 90
				}
			}

			var innerWidth = (width || parseInt(container.style('width')) || 960) - margin.left - margin.right,
				innerHeight = (height || parseInt(container.style('height')) || 400) - margin.top - margin.bottom;


			chart.update = function() {
				container.transition().duration(transitionDuration).call(chart)
			};
			chart.container = this;

			state.disabled = data.map(function(d) {
				return !!d.disabled
			});


			if (!defaultState) {
				var key;
				defaultState = {};
				for (key in state) {
					if (state[key] instanceof Array)
						defaultState[key] = state[key].slice(0);
					else
						defaultState[key] = state[key];
				}
			}

			x
				.range([0, innerWidth]);

			y
				.range([innerHeight, 0]);

			//tooltip
			var tooltipData = inEditMode ? [] : [data];

			var tooltip = d3.select("body").selectAll("div.kf-tooltip").data(tooltipData)
			tooltip.enter().append('div')
				.attr("class", "kf-tooltip")
				.style("opacity", 0);

			tooltip.exit().remove();


			var tooltipOffsetX = d3.scale.threshold()
				.domain([innerWidth / 2])
				.range([offsetX, -offsetX]);

			var tooltipOffsetY = d3.scale.threshold()
				.domain([innerHeight / 2])
				.range([offsetY, -offsetY]);

			var tooltipPadding = 10;

			var activeMeasure = null;
			var activeMeasureIdx = 0;

			data.forEach(function(series, i) {
				if (!series.disabled && !series.comparePeriod) {

					activeMeasure = series.key
					activeMeasureIdx = i
				}
			});

			rotateXLabels ? xAxis.rotateLabels(-45) : xAxis.rotateLabels(0);

			yAxis.axisLabel(activeMeasure);
			xAxis.axisLabel(labels[0]);

			var wrap = container.selectAll('g.kf-wrap.kf-lineChart').data([data]);
			var gEnter = wrap.enter().append('g').attr('class', 'kfd3 kf-wrap kf-lineChart').append('g');
			var g = wrap.select('g');

			gEnter.append("rect").style("opacity", 0);

			gEnter.append('g').attr('class', 'kf-x kf-axis');
			gEnter.append('g').attr('class', 'kf-y kf-axis');
			gEnter.append('g').attr('class', 'kf-linesWrap');
			gEnter.append('g').attr('class', 'kf-legendWrap');
			gEnter.append('g').attr('class', 'kf-overlay');



			if (showLegend) {

				legend.width(innerWidth);

				g.select('.kf-legendWrap')
					.datum(data)
					.call(legend);

				wrap.select('.kf-legendWrap')
					.attr('transform', 'translate(0,' + (-margin.top) + ')')

			} else {
				g.select('.kf-legendWrap')
					.datum([])
					.call(legend);
			}

			g.select("rect")
				.attr("width", innerWidth)
				.attr("height", (innerHeight > 0) ? innerHeight : 0);

			wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			var seriesData = d3.merge(data.map(function(d) {
				return d.values.map(function(d, i) {
					return {
						x: xValue(d, i),
						y: yValue(d, i),
						size: sizeValue(d, i)
					}
				})
			}));

			x = lines.xScale();
			y = lines.yScale();

			data.forEach(function(series, i) {
				series.values.forEach(function(point) {
					point.series = i;
				});
			});

			lines
				.width(innerWidth)
				.height(innerHeight);


			var linesWrap = g.select('.kf-linesWrap')
				.datum(data.filter(function(d) {
					return !d.disabled
				}))

			linesWrap.transition().call(lines);

			var format = d3.time.format("%Y-%m-%d")
			if (showXAxis) {

				var pxPerLabels = rotateXLabels ? 30 : 100;
				var labelsToShow = Math.min(Math.ceil(innerWidth / pxPerLabels), data[0].values.length);


				xAxis
					.scale(x)
					.tickFormat(formatDate)
					.ticks(labelsToShow);

				g.select('.kf-x.kf-axis')
					.attr('transform', 'translate(0,' + y.range()[0] + ')');
				g.select('.kf-x.kf-axis')
					.transition()
					.call(xAxis);

				if (!showGridLines) {
					g.selectAll('.kf-x.kf-axis .tick')
						.style('stroke-opacity', 0);
				}

			}

			if (showYAxis) {

				/*

				var formatValue = function(d) {

					var thousands = Math.floor(d / 1000),
						millions = Math.floor(d / 1000000),
						billions = Math.floor(d / 1000000000)

					var output = d;

					if (billions && symbols.billions) {
						output = billions + ' ' + symbols.billions;
					} else if (millions && symbols.millions) {
						output = millions + ' ' + symbols.millions;
					} else if (thousands && symbols.thousands) {
						output = thousands + ' ' + symbols.thousands;
					} else if (symbols.symbol) {
						output = output + ' ' + symbols.symbol;
					}
					return output;
				};


*/


				yAxis
					.scale(y)
					.ticks(8)
					.tickFormat(formatValue)
					.tickSize(-innerWidth, 0);

				g.select('.kf-y.kf-axis')
					.transition()
					.call(yAxis);

				if (!showGridLines) {
					g.selectAll('.kf-y.kf-axis .tick')
						.style('stroke-opacity', 0);
				} else {
					g.selectAll('.kf-y.kf-axis .tick')
						.style('stroke-opacity', 0.75);
				}
			}



			var bisectDate = d3.bisector(function(d) {
				return d.x;
			}).left;

			var innerOverlay = wrap.select(".kf-overlay").selectAll("rect").data([data])

			innerOverlay.enter().append('rect')
				.attr("class", "kf-overlay")
				.attr("width", innerWidth)
				.attr("height", innerHeight)
				.on("mouseover", function() {
					tooltip.transition()
						.style('opacity', .9);
				})
				.on("mouseout", function() {
					tooltip.transition()
						.style('opacity', 0);
					clearHighlights(id, singlePoint);
					highlightedPoint = highlightedPoint0 = -1;
				})
				.on("mousemove", mousemove);

			var xAxisHeight = rotateXLabels ? 62 : 22;

			if (!inEditMode) {

				var brush = d3.svg.brush()
					.x(x)
					.on("brushstart", brushstart)
					.on("brush", brushmove)
					.on("brushend", brushend);

				var brushg = wrap.append("g")
					.attr("class", "brush")
					.attr("height", height)
					.call(brush);

				brushg.selectAll("rect.background")
					.attr("height", xAxisHeight)
					.style("cursor", "default")
					.attr("transform", 'translate(0,' + innerHeight + ')');

				brushg.selectAll("rect.extent")
					.style("cursor", "default")
					.attr("height", xAxisHeight)
					.attr('transform', 'translate(0, ' + innerHeight + ')')
					.on("mouseover", function() {
						d3.select(this)
							.classed('hover', true);
					})
					.on("mouseout", function() {
						d3.select(this)
							.classed('hover', false);
					});
				brushg.selectAll(".resize").append("line")
					.attr("transform", "translate(0," + 0 + ")")
					.attr('x1', 0)
					.attr('x2', 0)
					.attr('y1', 0)
					.attr('y2', innerHeight + xAxisHeight)

				brushg.selectAll(".resize").selectAll("rect")
					.attr("height", innerHeight)
					.attr("width", '20px')
					.on("mouseover", function() {
						d3.select(this.parentNode).selectAll("line")
							.classed('hover', true);
					})
					.on("mouseout", function() {
						d3.select(this.parentNode).selectAll("line")
							.classed('hover', false);
					});


				var s = brush.extent();

				brushg.selectAll(".resize").append("rect")
					.attr("x", -48)
					.attr("y", -25)
					.attr("height", 25)
					.attr("width", 90)
					.attr("rx", 6)
					.attr("ry", 6)
					.style("stroke", "grey")
					.style("fill", "white")
					.style("stroke-width", '1px');


				brushg.selectAll(".resize.e").append("text")
					.classed('resize-label', true)
					.attr("x", -40)
					.attr("y", -9)
					.text(function() {
						return formatDate(s[1]) == formatDate(s[0]) ? '' : formatDate(s[1]);
					});

				brushg.selectAll(".resize.w").append("text")
					.classed('resize-label', true)
					.attr("x", -40)
					.attr("y", -9)
					.text(function() {
						return formatDate(s[1]) == formatDate(s[0]) ? '' : formatDate(s[0] + 1);
					});
			}


			function brushstart() {
				if (!inEditMode) {
					selectionMode = true;
				}
			}

			function brushmove() {
				if (!inEditMode) {
					var s = brush.extent();
					var arr = [];

					brushg.selectAll(".resize.e text")
						.text(function() {
							return formatDate(s[1]) == formatDate(s[0]) ? '' : formatDate(s[1]);
						});

					brushg.selectAll(".resize.w text")
						.text(function() {
							return formatDate(s[1]) == formatDate(s[0]) ? '' : formatDate(s[0] + 1);
						});


					data[0].values.forEach(function(d) {
						if (s[0] <= d.x && d.x <= s[1]) {
							arr = arr.concat(d.qElemNumbers ? d.qElemNumbers : []);
						}
					});

					if (arr.length > 0) {

						var segment = wrap.selectAll('line');
						segment.classed("selected", function(d) {
							return s[0] <= d.x1 && d.x2 <= s[1];
						});

						var segmentArea = wrap.selectAll('.kf-segmentarea');
						segmentArea.classed("selected", function(d) {
							return s[0] <= d.values[0].x && d.values[1].x <= s[1];
						});

						var point = wrap.selectAll('.kf-point');
						point.classed("selected", function(d) {
								return s[0] <= d.x && d.x <= s[1] && d.qElemNumbers;
							})
							.attr('r', function(d) {
								return (s[0] <= d.x && d.x <= s[1] && d.qElemNumbers) ? 5 : d.size || 0;
							});

					}
				}
			}

			function brushend() {
				if (!inEditMode) {

					var self = that
					var s = brush.extent();

					data[0].values.forEach(function(d) {
						if (s[0] <= d.x && d.x <= s[1]) {
							selectionArray0 = selectionArray0.concat(d.qElemNumbers ? d.qElemNumbers : []);
						}
					});

					if (!arraysEqual(selectionArray0, selectionArray)) {

						if (selectionArray0.length > 0) {

							var toogleArray = _.difference(selectionArray0, selectionArray).concat(_.difference(selectionArray, selectionArray0))

							self.selectValues(0, toogleArray, true);
							selectionArray = selectionArray0;
							selectionArray0 = [];
						}
					}
				}
			}

			function mousemove() {

				if (!inEditMode && !selectionMode) {

					var x0 = x.invert(d3.mouse(this)[0]),
						i = bisectDate(data[0].values, x0, 1),
						idx = 0;

					if (i == data[0].values.length) {
						i = data[0].values.length - 1
					}

					if (data[0].values.length > 1) {


						var d0 = data[0].values[i - 1],
							d1 = data[0].values[i];


						idx = x0 - d0.x > d1.x - x0 ? i : i - 1;
					}

					highlightedPoint0 = highlightedPoint;
					highlightedPoint = idx;

					if (highlightedPoint != highlightedPoint0) {
						clearHighlights(id, singlePoint);
						highlightPoint(id, highlightedPoint, highlightedPoint0, singlePoint);
					}
					var formatValue = d3.format(".0f");

					var tooltipHtml = ''

					var diff = data[activeMeasureIdx].values[idx].y / data[activeMeasureIdx + 1].values[idx].y - 1;

					var diffColor = 'style="color:rgb(0,0,0);"' //black
					var diffSymbol = ''

					if (diff < 0) {
						diffColor = 'style="color:rgb(255,0,0);"' //red
						diffSymbol = '&#x25bc' //down triangle
						diff = formatPercent(diff);
					}
					if (diff > 0 && diff != Infinity) {
						diffColor = 'style="color:rgb(0,255,0);"' //green
						diffSymbol = '&#x25b2' //up triangle
						diff = formatPercent(diff);
					} else {
						diffSymbol = ''
						diff = ''
					}

					if (!showTooltipSymbol) {
						diffSymbol = ''
					}

					if (!showTooltipChange) {
						diff = ''
					}


					tooltipHtml = '<table><thead><tr><td colspan="6"><strong>' + data[activeMeasureIdx].values[idx].xText + '</strong></td></tr></thead>' +
						'<tbody><tr><td class="tooltip-series-color"><div style="background-color:rgb(' + hexToR(data[activeMeasureIdx].color) + ',' + hexToG(data[activeMeasureIdx].color) + ',' + hexToB(data[activeMeasureIdx].color) + ');"></div></td><td>' + data[activeMeasureIdx].key + ': </td><td>' + data[activeMeasureIdx].values[idx].yText + '</td><td ' + diffColor + '><strong>' + diffSymbol + '</strong></td><td>' + diff + '</td></tr>' +
						'<tr><td colspan="4"><strong>' + data[activeMeasureIdx + 1].values[idx].xText + '</strong></td></tr>' +
						'<tr><td class="tooltip-series-color"><div style="background-color: rgb(' + hexToR(data[activeMeasureIdx + 1].color) + ',' + hexToG(data[activeMeasureIdx + 1].color) + ',' + hexToB(data[activeMeasureIdx + 1].color) + ');"> </div></td><td>' + data[activeMeasureIdx].key + ': </td><td colspan="4">' + data[activeMeasureIdx + 1].values[idx].yText + '</td></tr></tbody></table>'

					var offsetBody = getCoords(that.$element[0]);
					var tooltipWidth = parseInt(tooltip.style("width"));
					var tooltipHeight = parseInt(tooltip.style("height"));
					var tooltipX = x(data[activeMeasureIdx].values[idx].x) - tooltipWidth / 2 + 90 + offsetBody.left
					var tooltipY = y(data[activeMeasureIdx].values[idx].y) - tooltipHeight / 2 - 10 + offsetBody.top;
					tooltip.html(tooltipHtml)
						.style("left", tooltipX + "px")
						.style("top", tooltipY + "px");
				}

			}

			x0 = x.copy();
			y0 = y.copy();

			legend.dispatch.on('stateChange', function(newState) {
				state = newState;
				dispatch.stateChange(state);
				chart.update();
			});


			dispatch.on('changeState', function(e) {

				if (typeof e.disabled !== 'undefined' && data.length === e.disabled.length) {
					data.forEach(function(series, i) {
						series.disabled = e.disabled[i];
					});
					state.disabled = e.disabled;
				}
				chart.update();
			});

		});
	}

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};

	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.id = function(_) {
		if (!arguments.length) return id;
		id = _;
		return chart;
	};

	chart.labels = function(_) {
		if (!arguments.length) return labels;
		labels = _;
		return chart;
	};

	chart.layout = function(_) {
		if (!arguments.length) return layout;
		layout = _;
		return chart;
	};

	chart.that = function(_) {
		if (!arguments.length) return that;
		that = _;
		return chart;
	};

	chart.legend = function(_) {
		if (!arguments.length) return legend;
		legend = _;
		return chart;
	};
	chart.showLegend = function(_) {
		if (!arguments.length) return showLegend;
		showLegend = _;
		return chart;
	};
	chart.showTooltipSymbol = function(_) {
		if (!arguments.length) return showTooltipSymbol;
		showTooltipSymbol = _;
		return chart;
	};
	chart.showTooltipChange = function(_) {
		if (!arguments.length) return showTooltipChange;
		showTooltipChange = _;
		return chart;
	};
	chart.showGridLines = function(_) {
		if (!arguments.length) return showGridLines;
		showGridLines = _;
		return chart;
	};
	chart.inEditMode = function(_) {
		if (!arguments.length) return inEditMode;
		inEditMode = _;
		return chart;
	};

	chart.symbols = function(_) {
		if (!arguments.length) return symbols;
		symbols = _;
		return chart;
	};

	chart.dimFormat = function(_) {
		if (!arguments.length) return dimFormat;
		dimFormat = _;
		return chart;
	};



	return chart;
}

function y_axis() {

	var axis = d3.svg.axis();

	"use strict";
	var margin = {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		},
		width,
		height,
		scale = d3.scale.linear(),
		axisLabelText = null;

	var scale0;

	function chart(selection) {
		selection.each(function(data) {
			var container = d3.select(this);

			var wrap = container.selectAll('g.kf-wrap.kf-axis.kf-y').data([data]);
			var wrapEnter = wrap.enter().append('g').attr('class', 'kf-wrap kf-axis kf-y');
			var gEnter = wrapEnter.append('g');
			var g = wrap.select('g');

			g.transition().call(axis);

			scale0 = scale0 || axis.scale();

			var axisLabel = g.selectAll('text.kf-axislabel')
				.data([axisLabelText || null]);
			axisLabel.exit().remove();

			axisLabel.enter().append('text').attr('class', 'kf-axislabel');
			axisLabel
				.attr("transform", "rotate(-90)")
				.attr("y", -70)
				.attr("x", (-scale.range()[0] / 2))
				.style("text-anchor", "middle")
				.text(function(d) {
					return d
				});
		});

		return chart;
	};

	chart.axis = axis;

	d3.rebind(chart, axis, 'orient', 'ticks', 'tickValues', 'tickSubdivide', 'tickSize', 'tickPadding', 'tickFormat');
	d3.rebind(chart, scale, 'domain', 'range', 'rangeBand', 'rangeBands');

	chart.margin = function(_) {
		if (!arguments.length) return margin;
		margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
		margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
		margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
		margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
		return chart;
	}

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};

	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.axisLabel = function(_) {
		if (!arguments.length) return axisLabelText;
		axisLabelText = _;
		return chart;
	}

	chart.scale = function(_) {
		if (!arguments.length) return scale;
		scale = _;
		axis.scale(scale);
		isOrdinal = typeof scale.rangeBands === 'function';
		d3.rebind(chart, scale, 'domain', 'range', 'rangeBand', 'rangeBands');
		return chart;
	}

	return chart;
};

function x_date_axis() {

	var axis = d3.svg.axis();

	"use strict";
	var margin = {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		},
		width,
		height,
		rotateLabels = 0,
		scale = d3.scale.linear(),
		axisLabelText = null;

	var scale0;

	function chart(selection) {
		selection.each(function(data) {
			var container = d3.select(this);

			var wrap = container.selectAll('g.kf-wrap.kf-axis').data([data]);
			var wrapEnter = wrap.enter().append('g').attr('class', 'kf-wrap kf-axis');
			var gEnter = wrapEnter.append('g');
			var g = wrap.select('g');

			g.transition().call(axis);

			scale0 = scale0 || axis.scale();

			var axisLabel = g.selectAll('text.kf-axislabel')
				.data([axisLabelText || null]);
			axisLabel.exit().remove();

			var xLabelMargin = 36;
			var maxTextWidth = 30;
			var xTicks = g.selectAll('g').select("text");
			if (rotateLabels % 360) {
				xTicks.each(function(d, i) {
					var width = this.getBBox().width;
					if (width > maxTextWidth) maxTextWidth = width;
				});
				var sin = Math.abs(Math.sin(rotateLabels * Math.PI / 180));
				var xLabelMargin = (sin ? sin * maxTextWidth : maxTextWidth) + 30;
				xTicks
					.attr('transform', function(d, i, j) {
						return 'rotate(' + rotateLabels + ' 0,0)'
					})
					.style('text-anchor', rotateLabels % 360 > 0 ? 'start' : 'end');
			}

			var w = (scale.range().length == 2) ? scale.range()[1] : (scale.range()[scale.range().length - 1] + (scale.range()[1] - scale.range()[0]) / 2);

			axisLabel.enter().append('text').attr('class', 'kf-axislabel');

			axisLabel
				.attr("y", xLabelMargin)
				.attr("x", w / 2)
				.style("text-anchor", "middle")
				.text(function(d) {
					return d
				});

		});

		return chart;
	};

	chart.axis = axis;

	d3.rebind(chart, axis, 'orient', 'ticks', 'tickValues', 'tickSubdivide', 'tickSize', 'tickPadding', 'tickFormat');
	d3.rebind(chart, scale, 'domain', 'range', 'rangeBand', 'rangeBands');

	chart.margin = function(_) {
		if (!arguments.length) return margin;
		margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
		margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
		margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
		margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
		return chart;
	}

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};


	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.axisLabel = function(_) {
		if (!arguments.length) return axisLabelText;
		axisLabelText = _;
		return chart;
	}

	chart.rotateLabels = function(_) {
		if (!arguments.length) return rotateLabels;
		rotateLabels = _;
		return chart;
	}
	chart.scale = function(_) {
		if (!arguments.length) return scale;
		scale = _;
		axis.scale(scale);
		isOrdinal = typeof scale.rangeBands === 'function';
		d3.rebind(chart, scale, 'domain', 'range', 'rangeBand', 'rangeBands');
		return chart;
	}

	return chart;
};


function line() {
	"use strict";
	var margin = {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		},
		width = 760,
		height = 220,
		id = Math.floor(Math.random() * 10000),
		xValue = function(d) {
			return d.x;
		},
		yValue = function(d) {
			return d.y;
		},
		sizeValue = function(d) {
			return singlePoint ? 3 : d.size || 0
		},
		isArea = function(d) {
			return d.area
		},
		/*
		defined = function(d, i) {
			return !isNaN(yValue(d, i)) && xValue(d, i) !== null
		},*/
		defined = function(d) {
			return d.y != null;
		},

		xScale = d3.scale.linear(),
		yScale = d3.scale.linear(),
		zScale = d3.scale.linear(),
		xDomain = null,
		yDomain = null,
		xRange = null,
		yRange = null,
		singlePoint = false,
		sizeDomain = null,
		sizeRange = null,
		padData = false,
		padDataOuter = .1,
		pointKey = null,
		forceX = [],
		forceY = [],
		forceSize = [],
		dispatch = d3.dispatch('elementClick', 'elementMouseover', 'elementMouseout'),
		clipEdge = false,
		state = {},
		defaultState = null,
		transitionDuration = 250,
		interpolate = "linear";

	var x0Scale,
		y0Scale,
		z0Scale,
		forceZero = true,
		yMargin = .05;

	function chart(selection) {
		selection.each(function(data) {

			var innerWidth = width - margin.left - margin.right,
				innerHeight = height - margin.top - margin.bottom,
				container = d3.select(this);

			data.forEach(function(series, i) {
				series.values.forEach(function(point) {
					point.series = i;
				});
			});

			singlePoint = data[0].values.length == 1;

			var seriesData = (xDomain && yDomain && sizeDomain) ? [] :
				d3.merge(
					data.map(function(d) {
						return d.values.map(function(d, i) {
							return {
								x: xValue(d, i),
								y: yValue(d, i),
								size: sizeValue(d, i)
							}
						})
					})
				);

			var padding = innerWidth / (data[0].values.length + 1) / 2

			xScale.range([0, innerWidth]);

			xScale.domain([d3.min(seriesData.map(function(d) {
				return d.x - 0.5
			})), d3.max(seriesData.map(function(d) {
				return d.x + 0.5
			}))]);

			//xScale.nice();

			var yExtent = d3.extent(seriesData.map(function(d) {
				return d.y
			}));

			//var yMarginOffset = (yExtent[1] - yExtent[0]) * yMargin

			yScale.domain([d3.min(seriesData.map(function(d) {
					return forceZero ? Math.min(0, d.y) : d.y;
				})), d3.max(seriesData.map(function(d) {
					return d.y
				}))])
				.range(yRange || [innerHeight, 0]);

			zScale.domain(sizeDomain || d3.extent(seriesData.map(function(d) {
					return d.size
				}).concat(forceSize)))
				.range(sizeRange || [16, 256]);

			if (yScale.domain()[0] === yScale.domain()[1])
				yScale.domain()[0] ?
				yScale.domain([yScale.domain()[0] - yScale.domain()[0] * 0.01, yScale.domain()[1] + yScale.domain()[1] * 0.01]) : yScale.domain([-1, 1]);

			
			if (isNaN(xScale.domain()[0])) {
				xScale.domain([-1, 1]);
			}

			if (isNaN(yScale.domain()[0])) {
				yScale.domain([-1, 1]);
			}
			

			yScale.nice();

			x0Scale = x0Scale || xScale;
			y0Scale = y0Scale || yScale;
			z0Scale = z0Scale || zScale;

			var wrap = container.selectAll('g.kf-wrap.kf-line').data([data]);
			var wrapEnter = wrap.enter().append('g').attr('class', 'kfd3 kf-wrap kf-line');
			var defsEnter = wrapEnter.append('defs');
			var gEnter = wrapEnter.append('g');
			var g = wrap.select('g');

			gEnter.append('g').attr('class', 'kf-segmentareagroups');

			gEnter.append('g').attr('class', 'kf-groups');
			gEnter.append('g').attr('class', 'kf-segmentgroups');

			gEnter.append('g').attr('class', 'kf-pointgroups');

			wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			defsEnter.append('clipPath')
				.attr('id', 'kf-edge-clip-' + id)
				.append('rect');

			wrap.select('#kf-edge-clip-' + id + ' rect')
				.attr('width', innerWidth)
				.attr('height', (innerHeight > 0) ? innerHeight : 0);

			g.attr('clip-path', clipEdge ? 'url(#kf-edge-clip-' + id + ')' : '');


			var groups = wrap.select('.kf-groups').selectAll('.kf-group')
				.data(function(d) {
					return d
				}, function(d) {
					return d.key
				});
			groups.enter().append('g')
				.style('stroke-opacity', 1e-6)
				.style('fill-opacity', 1e-6);

			groups.exit().remove();

			groups
				.attr('class', function(d, i) {
					return 'kf-group seriesnr' + i
				})
				.classed('hover', function(d) {
					return d.hover
				})
				.style('fill', function(d, i) {
					return d.color
				})
				.style('stroke', function(d, i) {
					return d.color
				});
			groups
				.transition()
				.style('stroke-opacity', 1)
				.style('fill-opacity', .5);



			var area = groups.selectAll('path.kf-area')
				.data(function(d) {
					return isArea(d) ? [d] : []
				});
			area.enter().append('path')
				.attr('class', 'kf-area')
				.attr('d', function(d) {
					return d3.svg.area()
						.defined(defined)
						.x(function(d, i) {
							return NullToZero(x0Scale(xValue(d, i)))
						})
						.y1(function(d, i) {
							return NullToZero(y0Scale(yValue(d, i)))
						})
						.y0(innerHeight)
						.apply(this, [d.values])
				});
			groups.exit().selectAll('path.kf-area')
				.remove();

			area
				.transition()
				.attr('d', function(d) {
					return d3.svg.area()
						.defined(defined)
						.x(function(d, i) {
							return NullToZero(xScale(xValue(d, i)))
						})
						.y1(function(d, i) {
							return NullToZero(yScale(yValue(d, i)))
						})
						.y0(innerHeight)
						.apply(this, [d.values])
				});

			var line = groups.selectAll('path.kf-line')
				.data(function(d) {
					return [d.values]
				});
			line.enter().append('path')
				.attr('class', 'kf-line')
				.attr('d',
					d3.svg.line()
					.interpolate(interpolate)
					.defined(defined)
					.x(function(d, i) {
						return NullToZero(x0Scale(xValue(d, i)))
					})
					.y(function(d, i) {
						return NullToZero(y0Scale(yValue(d, i)))
					})
				);

			line
				.transition()
				.attr('d',
					d3.svg.line()
					.interpolate(interpolate)
					.defined(defined)
					.x(function(d, i) {
						return NullToZero(xScale(xValue(d, i)))
					})
					.y(function(d, i) {
						return NullToZero(yScale(yValue(d, i)))
					})
				);

			var activeMeasureIdx = 0;
			var activeMeasureColor = null;

			data.forEach(function(series, i) {
				if (!series.disabled && !series.comparePeriod) {
					activeMeasureIdx = i
					activeMeasureColor = series.color
				}
			});


			var segmentData = []
			for (var i = 1; i <= data[activeMeasureIdx].values.length - 1; i++) {

				if (yValue(data[activeMeasureIdx].values[i - 1], i - 1) != null && yValue(data[activeMeasureIdx].values[i], i) != null) {


					segmentData.push({
						'x1': xValue(data[activeMeasureIdx].values[i - 1], i - 1),
						'x2': xValue(data[activeMeasureIdx].values[i], i),
						'y1': yValue(data[activeMeasureIdx].values[i - 1], i - 1),
						'y2': yValue(data[activeMeasureIdx].values[i], i),
						'color': activeMeasureColor
					});
				}


			};


			var segments = wrap.select('.kf-segmentgroups').selectAll('line.kf-segment')
				.data(segmentData);
			segments.enter().append('line')
				.style('stroke-opacity', 1)
				.style('stroke', function(d, i) {
					return d.color
				})
				.attr('x1', function(d, i) {
					return NullToZero(x0Scale(d.x1))
				})
				.attr('x2', function(d, i) {
					return NullToZero(x0Scale(d.x2))
				})
				.attr('y0', function(d, i) {
					return innerHeight
				})
				.attr('y1', function(d, i) {
					return NullToZero(y0Scale(d.y1))
				})
				.attr('y2', function(d, i) {
					return NullToZero(y0Scale(d.y2))
				});
			segments.exit().remove();

			/*

			groups.exit().selectAll('line.kf-segment').transition()
				.attr('x1', function(d, i) {
					return NullToZero(xScale(d.x1))
				})
				.attr('x2', function(d, i) {
					return NullToZero(xScale(d.x2))
				})
				.attr('y0', function(d, i) {
					return innerHeight
				})
				.attr('y1', function(d, i) {
					return NullToZero(yScale(d.y1))
				})
				.attr('y2', function(d, i) {
					return NullToZero(yScale(d.y2))
				})
				.remove();
				*/
			segments.each(function(d, i) {
				d3.select(this)
					.classed('kf-segment', true)
					.classed('kf-segment-' + i + '-' + (i + 1), true);
			});
			segments.transition()
				.attr('x1', function(d, i) {
					return NullToZero(xScale(d.x1))
				})
				.attr('x2', function(d, i) {
					return NullToZero(xScale(d.x2))
				})
				.attr('y0', function(d, i) {
					return innerHeight
				})
				.attr('y1', function(d, i) {
					return NullToZero(yScale(d.y1))
				})
				.attr('y2', function(d, i) {
					return NullToZero(yScale(d.y2))
				});

			var segmentAreaData = []
			for (var i = 1; i <= data[activeMeasureIdx].values.length - 1; i++) {
				var values = []

				if (yValue(data[activeMeasureIdx].values[i - 1], i - 1) != null && yValue(data[activeMeasureIdx].values[i], i) != null) {


					values.push({
						'x': xValue(data[activeMeasureIdx].values[i - 1], i - 1),
						'y': yValue(data[activeMeasureIdx].values[i - 1], i - 1)

					}, {
						'x': xValue(data[activeMeasureIdx].values[i], i),
						'y': yValue(data[activeMeasureIdx].values[i], i)
					});

					segmentAreaData.push({
						'color': activeMeasureColor,
						'values': values
					});
				}

			};


			var segmentArea = wrap.select('.kf-segmentareagroups').selectAll('path.kf-segmentarea')
				.data(segmentAreaData);
			segmentArea.enter().append('path')
				.style('fill', function(d, i) {
					return d.color
				}).attr('d', function(d) {
					return d3.svg.area()
						.x(function(d, i) {
							return NullToZero(x0Scale(d.x))
						})
						.y1(function(d, i) {
							return NullToZero(y0Scale(d.y))
						})
						.y0(innerHeight)
						.apply(this, [d.values])
				});
			segmentArea.exit().selectAll('path.kf-segmentarea')
				.remove();

			segmentArea.each(function(d, i) {
				d3.select(this)
					.classed('kf-segmentarea', true)
					.classed('kf-segmentarea-' + i + '-' + (i + 1), true);
			});

			segmentArea
				.transition()
				.attr('d', function(d) {
					return d3.svg.area()
						.x(function(d, i) {
							return NullToZero(xScale(d.x))
						})
						.y1(function(d, i) {
							return NullToZero(yScale(d.y))
						})
						.y0(innerHeight)
						.apply(this, [d.values])
				});



			var pointGroups = wrap.select('.kf-pointgroups').selectAll('.kf-pointgroup')
				.data(function(d) {
					return d
				}, function(d) {
					return d.key
				});
			pointGroups.enter().append('g')
				.style('stroke-opacity', 1e-6)
				.style('fill-opacity', 1e-6);

			pointGroups.exit().remove();

			pointGroups
				.attr('class', function(d, i) {
					return 'kf-pointgroup seriesnr' + i
				})
				.classed('hover', function(d) {
					return d.hover
				})
				.style('fill', function(d, i) {
					return d.color
				})
				.style('stroke', function(d, i) {
					return d.color
				});
			pointGroups
				.transition()
				.style('stroke-opacity', 1)
				.style('fill-opacity', 1);


			var points = pointGroups.selectAll('circle.kf-point')
				.data(function(d) {
					return d.values
				}, pointKey);
			points.enter().append('circle')
				.attr('class', 'kf-point')
				.style('fill-opacity', 1)
				.style('fill', function(d, i) {
					return d.color
				})
				.style('stroke', function(d, i) {
					return d.color
				})
				.attr('cx', function(d, i) {
					return NullToZero(x0Scale(xValue(d, i)))
				})
				.attr('cy', function(d, i) {
					return NullToZero(y0Scale(yValue(d, i)))
				})
				.attr('r', function(d, i) {
					return sizeValue(d, i)
				});
			points.exit().remove();

			pointGroups.exit().selectAll('circle.kf-point').transition()
				.attr('cx', function(d, i) {
					return NullToZero(xScale(xValue(d, i)))
				})
				.attr('cy', function(d, i) {
					return NullToZero(yScale(yValue(d, i)))
				})
				.remove();
			points.each(function(d, i) {
				d3.select(this)
					.classed('kf-point', true)
					.classed('kf-point-' + i, true)
					.classed('hover', false);
			});
			points.transition()
				.attr('cx', function(d, i) {
					return NullToZero(xScale(xValue(d, i)))
				})
				.attr('cy', function(d, i) {
					return NullToZero(yScale(yValue(d, i)))
				})
				.attr('r', function(d, i) {
					return sizeValue(d, i)
				});

			x0Scale = xScale.copy();
			y0Scale = yScale.copy();
			z0Scale = zScale.copy();

		});

		return chart;
	}

	chart.x = function(_) {
		if (!arguments.length) return xValue;
		xValue = d3.functor(_);
		return chart;
	};

	chart.y = function(_) {
		if (!arguments.length) return yValue;
		yValue = d3.functor(_);
		return chart;
	};

	chart.size = function(_) {
		if (!arguments.length) return sizeValue;
		sizeValue = d3.functor(_);
		return chart;
	};

	chart.margin = function(_) {
		if (!arguments.length) return margin;
		margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
		margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
		margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
		margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
		return chart;
	};

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};

	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.xScale = function(_) {
		if (!arguments.length) return xScale;
		xScale = _;
		return chart;
	};

	chart.yScale = function(_) {
		if (!arguments.length) return yScale;
		yScale = _;
		return chart;
	};

	chart.zScale = function(_) {
		if (!arguments.length) return zScale;
		zScale = _;
		return chart;
	};

	chart.xDomain = function(_) {
		if (!arguments.length) return xDomain;
		xDomain = _;
		return chart;
	};

	chart.yDomain = function(_) {
		if (!arguments.length) return yDomain;
		yDomain = _;
		return chart;
	};

	chart.sizeDomain = function(_) {
		if (!arguments.length) return sizeDomain;
		sizeDomain = _;
		return chart;
	};

	chart.xRange = function(_) {
		if (!arguments.length) return xRange;
		xRange = _;
		return chart;
	};

	chart.yRange = function(_) {
		if (!arguments.length) return yRange;
		yRange = _;
		return chart;
	};

	chart.sizeRange = function(_) {
		if (!arguments.length) return sizeRange;
		sizeRange = _;
		return chart;
	};

	chart.forceX = function(_) {
		if (!arguments.length) return forceX;
		forceX = _;
		return chart;
	};

	chart.forceY = function(_) {
		if (!arguments.length) return forceY;
		forceY = _;
		return chart;
	};

	chart.forceSize = function(_) {
		if (!arguments.length) return forceSize;
		forceSize = _;
		return chart;
	};

	chart.pointKey = function(_) {
		if (!arguments.length) return pointKey;
		pointKey = _;
		return chart;
	};

	chart.padData = function(_) {
		if (!arguments.length) return padData;
		padData = _;
		return chart;
	};

	chart.padDataOuter = function(_) {
		if (!arguments.length) return padDataOuter;
		padDataOuter = _;
		return chart;
	};

	chart.id = function(_) {
		if (!arguments.length) return id;
		id = _;
		return chart;
	};



	return chart;
};

function kf_legend() {
	"use strict";

	var margin = {
			top: 5,
			right: 0,
			bottom: 5,
			left: 0
		},
		width = 400,
		height = 20,
		that,
		isArea = function(d) {
			return d.area
		},
		getKey = function(d) {
			return d.key
		},
		updateState = true,

		dispatch = d3.dispatch('legendClick', 'legendDblclick', 'legendMouseover', 'legendMouseout', 'stateChange');

	function chart(selection) {
		selection.each(function(data) {
			var innerWidth = width - margin.left - margin.right,
				container = d3.select(this);

			var wrap = container.selectAll('g.kf-legend').data([data]);
			var gEnter = wrap.enter().append('g').attr('class', 'kfd3 kf-legend').append('g');
			var g = wrap.select('g');

			wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			var series = g.selectAll('.kf-series')
				.data(data.filter(function(d) {
					return !d.comparePeriod
				}));
			var seriesEnter = series.enter().append('g').attr('class', 'kf-series')
				.on('click', function(d, i) {
					dispatch.legendClick(d, i);
					if (updateState) {

						data.forEach(function(series, key) {
							series.disabled = (i * 2 + 1 == key) ? false : true
						});
						d.disabled = false;

						var me = that;

						that.backendApi.getProperties().then(function(reply) {
							reply.activeMeasure = i
							me.backendApi.setProperties(reply);
						});

						dispatch.stateChange({
							disabled: data.map(function(d) {
								return !!d.disabled
							})
						});
					}
				});

			seriesEnter.append('circle')
				.style('stroke-width', 2)
				.attr('class', 'kf-legend-symbol')
				.attr('r', 5);
			seriesEnter.append('text')
				.attr('text-anchor', 'start')
				.attr('class', 'kf-legend-text')
				.attr('dy', '.32em')
				.attr('dx', '8');
			series.classed('disabled', function(d) {
				return d.disabled
			});
			series.exit().remove();
			series.select('circle')
				.style('fill', function(d, i) {
					return d.color
				})
				.style('stroke', function(d, i) {
					return d.color
				});
			series.select('text').text(getKey);

			var ypos = 5,
				newxpos = 5,
				maxwidth = 0,
				xpos;
			series
				.attr('transform', function(d, i) {
					var length = d3.select(this).select('text').node().getComputedTextLength() + 28;
					xpos = newxpos;

					if (width < margin.left + margin.right + xpos + length) {
						newxpos = xpos = 5;
						ypos += 20;
					}

					newxpos += length;
					if (newxpos > maxwidth) maxwidth = newxpos;

					return 'translate(' + xpos + ',' + ypos + ')';
				});

			g.attr('transform', 'translate(' + (innerWidth - margin.right - maxwidth) + ',' + margin.top + ')');

			height = margin.top + margin.bottom + ypos + 15;


		})

		return chart;
	}

	chart.dispatch = dispatch;

	chart.margin = function(_) {
		if (!arguments.length) return margin;
		margin.top = typeof _.top != 'undefined' ? _.top : margin.top;
		margin.right = typeof _.right != 'undefined' ? _.right : margin.right;
		margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
		margin.left = typeof _.left != 'undefined' ? _.left : margin.left;
		return chart;
	};

	chart.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return chart;
	};

	chart.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return chart;
	};

	chart.key = function(_) {
		if (!arguments.length) return getKey;
		getKey = _;
		return chart;
	};

	chart.updateState = function(_) {
		if (!arguments.length) return updateState;
		updateState = _;
		return chart;
	};

	chart.that = function(_) {
		if (!arguments.length) return that;
		that = _;
		return chart;
	};

	return chart;
}



function nearestValueIndex(values, searchVal) {
	"use strict";
	var yDistMax = Infinity,
		index = null;
	values.forEach(function(d, i) {
		var delta = Math.abs(searchVal - d);
		if (delta <= yDistMax) {
			yDistMax = delta;
			index = i;
		}
	});
	return index;
};

function clearHighlights(id, singlePoint) {
	d3.selectAll("#" + id + " .kf-point.hover")
		.classed("hover", false)
		.transition()
		.attr('r', function(d, i) {
			return singlePoint ? 3 : d.size || 0
		});
};

function highlightPoint(id, pointIndex, clearPointIndex, singlePoint) {
	d3.selectAll("#" + id + " .kf-point-" + pointIndex)
		.classed("hover", true)
		.transition()
		.attr('r', 4);

	d3.selectAll("#" + id + " .kf-point-" + clearPointIndex)
		.classed("hover", false)
		.attr('r', function(d, i) {
			return singlePoint ? 3 : d.size || 0
		});
};

function NullToZero(n) {
	if (n === null || n === Infinity || typeof n !== 'number' || isNaN(n)) return 0;
	return n;
};

function addDays(date, days) {
	var result = new Date(date);
	result.setDate(date.getDate() + days);
	return result;
};

function hexToR(h) {
	return parseInt((cutHex(h)).substring(0, 2), 16)
};

function hexToG(h) {
	return parseInt((cutHex(h)).substring(2, 4), 16)
};

function hexToB(h) {
	return parseInt((cutHex(h)).substring(4, 6), 16)
};

function cutHex(h) {
	return (h.charAt(0) == "#") ? h.substring(1, 7) : h
};

function array_diff(array1, array2) {
	var difference = $.grep(array1, function(el) {
		return $.inArray(el, array2) < 0
	});
	return difference.concat($.grep(array2, function(el) {
		return $.inArray(el, array1) < 0
	}));;
};

function arraysEqual(a1, a2) {
	return JSON.stringify(a1) == JSON.stringify(a2);
};

/*
function getOffset(elem) {
	var offsetLeft = 0;
	var offsetTop = 0;

	do {

		if (!isNaN(elem.offsetLeft)) {
			offsetLeft += elem.offsetLeft;
		}
		if (!isNaN(elem.offsetTop)) {
			offsetTop += elem.offsetTop;
		}
	} while (elem = elem.offsetParent);
	return {
		left: offsetLeft,
		top: offsetTop
	};
}
*/

function getCoords(elem) {
	var box = elem.getBoundingClientRect();

	var body = document.body;
	var docEl = document.documentElement;

	var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
	var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

	var clientTop = docEl.clientTop || body.clientTop || 0;
	var clientLeft = docEl.clientLeft || body.clientLeft || 0;

	var top = box.top + scrollTop - clientTop;
	var left = box.left + scrollLeft - clientLeft;

	return {
		top: Math.round(top),
		left: Math.round(left)
	};
}
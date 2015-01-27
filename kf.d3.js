
function NullToZero(n) {
    if (n === null
        || n === Infinity
        || typeof n !== 'number'
        || isNaN(n)) return 0;
    return n;
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
			return d.size || 1
		},
		isArea = function(d) {
			return d.area
		}, // decides if a line is an area or just a line
		defined = function(d, i) {
			return !isNaN(yValue(d, i)) && xValue(d, i) !== null
		},
		xScale = d3.scale.ordinal(),
		yScale = d3.scale.linear(),
		zScale = d3.scale.linear(),
		xDomain = null, // Override x domain (skips the calculation from data)
		yDomain = null, // Override y domain
		xRange = null, // Override x range
		yRange = null, // Override y range
		sizeDomain = null, // Override point size domain
		sizeRange = null,
		padData = false, // If true, adds half a data points width to front and back, for lining up a line chart with a bar chart
		padDataOuter = .1, //outerPadding to imitate ordinal scale outer padding
		pointKey = null,
		forceX = [], // List of numbers to Force into the X scale (ie. 0, or a max / min, etc.)
		forceY = [], // List of numbers to Force into the Y scale
		forceSize = [], // List of numbers to Force into the Size scale
		singlePoint = false,
		xAxis = d3.svg.axis().scale(xScale).orient("bottom"),
		yAxis = d3.svg.axis().scale(yScale).orient("left"),
		dispatch = d3.dispatch('elementClick', 'elementMouseover', 'elementMouseout'),
		state = {},
		defaultState = null,
		transitionDuration = 250,
		interpolate = "linear";

	var x0Scale,
		y0Scale,
		z0Scale
		
	function chart(selection) {
			selection.each(function(data) {

				var innerWidth = width - margin.left - margin.right,
					innerHeight = height - margin.top - margin.bottom,
					container = d3.select(this);

				//add series index to each data point for reference
				data.forEach(function(series, i) {
					series.values.forEach(function(point) {
						point.series = i;
					});
				});

				//------------------------------------------------------------
				// Setup Scales

				// remap and flatten the data for use in calculating the scales' domains
				var seriesData = (xDomain && yDomain && sizeDomain) ? [] : // if we know xDomain and yDomain and sizeDomain, no need to calculate.... if Size is constant remember to set sizeDomain to speed up performance
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

				

				yScale.domain(yDomain || d3.extent(seriesData.map(function(d) {
						return d.y
					}).concat(forceY)))
					.range(yRange || [innerHeight, 0]);

				zScale.domain(sizeDomain || d3.extent(seriesData.map(function(d) {
						return d.size
					}).concat(forceSize)))
					.range(sizeRange || [16, 256]);

				// If scale's domain don't have a range, slightly adjust to make one... so a chart can show a single data point
				if (xScale.domain()[0] === xScale.domain()[1] || yScale.domain()[0] === yScale.domain()[1]) singlePoint = true;
				if (xScale.domain()[0] === xScale.domain()[1])
					xScale.domain()[0] ?
					xScale.domain([xScale.domain()[0] - xScale.domain()[0] * 0.01, xScale.domain()[1] + xScale.domain()[1] * 0.01]) : xScale.domain([-1, 1]);

				if (yScale.domain()[0] === yScale.domain()[1])
					yScale.domain()[0] ?
					yScale.domain([yScale.domain()[0] - yScale.domain()[0] * 0.01, yScale.domain()[1] + yScale.domain()[1] * 0.01]) : yScale.domain([-1, 1]);

				if (isNaN(xScale.domain()[0])) {
					xScale.domain([-1, 1]);
				}

				if (isNaN(yScale.domain()[0])) {
					yScale.domain([-1, 1]);
				}

				x0Scale = x0Scale || xScale;
				y0Scale = y0Scale || yScale;
				z0Scale = z0Scale || zScale;


				//------------------------------------------------------------
				// Setup containers and skeleton of chart

				var svg = container.selectAll('g.svg.kf-line').data([data]);
				var gEnter = svg.enter().append("svg").append("g");
     			var g = svg.select('g');

				// Update the outer dimensions.
      			svg .attr("width", width)
          			.attr("height", height);

				gEnter.append('g').attr('class', 'kf-series');

				svg.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

				//------------------------------------------------------------

				var series = svg.select('.kf-series').selectAll('.kf-serie')
					.data(function(d) {
						return d
					}, function(d) {
						return d.key
					});
				series.enter().append('g')
					.style('stroke-opacity', 1e-6)
					.style('fill-opacity', 1e-6);

				series.exit().remove();

				series
					.attr('class', function(d, i) {
						return 'kf-series seriesnr' + i
					})
					.style('fill', function(d, i) {
						return d.color
					})
					.style('stroke', function(d, i) {
						return d.color
					});
				series
					.transition()
					.style('stroke-opacity', 1)
					.style('fill-opacity', .5);

				var area = series.selectAll('path.kf-area')
					.data(function(d) {
						return isArea(d) ? [d] : []
					}); // this is done differently than lines because I need to check if series is an area
				area.enter().append('path')
					.attr('class', 'kf-area')
					.style('stroke', 'none')
					.attr('d', function(d) {
						return d3.svg.area()
							.interpolate(interpolate)
							.defined(defined)
							.x(function(d, i) {
								return NullToZero(x0Scale(xValue(d, i)))
							})
							.y0(function(d, i) {
								return NullToZero(y0Scale(yValue(d, i)))
							})
							.y1(function(d, i) {
								return y0Scale(yScale.domain()[0] <= 0 ? yScale.domain()[1] >= 0 ? 0 : yScale.domain()[1] : yScale.domain()[0])
							})
							//.y1(function(d,i) { return y0(0) }) //assuming 0 is within y domain.. may need to tweak this
							.apply(this, [d.values])
					});
				series.exit().selectAll('path.kf-area')
					.remove();

				area
					.transition()
					.attr('d', function(d) {
						return d3.svg.area()
							.interpolate(interpolate)
							.defined(defined)
							.x(function(d, i) {
								return NullToZero(xScale(xValue(d, i)))
							})
							.y0(function(d, i) {
								return NullToZero(yScale(yValue(d, i)))
							})
							.y1(function(d, i) {
								return yScale(yScale.domain()[0] <= 0 ? yScale.domain()[1] >= 0 ? 0 : yScale.domain()[1] : yScale.domain()[0])
							})
							.apply(this, [d.values])
					});

				var line = series.selectAll('path.kf-line')
					.data(function(d) {
						return [d.values]
					});
				line.enter().append('path')
					.attr('class', 'kf-line')
					.style('fill', 'none')
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

				var points = series.selectAll('circle.kf-point')
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
						return Math.sqrt(zScale(sizeValue(d, i)) / Math.PI)
					});
				points.exit().remove();
				series.exit().selectAll('path.kf-point').transition()
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
						return Math.sqrt(zScale(sizeValue(d, i)) / Math.PI)
					});

				
				//store old scales for use in transitions on update
				x0Scale = xScale.copy();
				y0Scale = yScale.copy();
				z0Scale = zScale.copy();

			});

			return chart;
		}
  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------
  chart.clearHighlights = function() {
      //Remove the 'hover' class from all highlighted points.
      d3.selectAll(".kf-chart-" + id + " .kf-point.hover").classed("hover",false);
  };

  chart.highlightPoint = function(seriesIndex,pointIndex,isHoverOver) {
      d3.select(".kf-chart-" + id + " .kf-series-" + seriesIndex + " .kf-point-" + pointIndex)
          .classed("hover",isHoverOver);
  };


  dispatch.on('elementMouseover.point', function(d) {
     if (interactive) chart.highlightPoint(d.seriesIndex,d.pointIndex,true);
  });

  dispatch.on('elementMouseout.point', function(d) {
     if (interactive) chart.highlightPoint(d.seriesIndex,d.pointIndex,false);
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

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
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
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

  chart.singlePoint = function(_) {
    if (!arguments.length) return singlePoint;
    singlePoint = _;
    return chart;
  };

  //============================================================


  return chart;
};

function axis() {
  "use strict";
  
  var axis = d3.svg.axis();

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , width = 75 //only used for tickLabel currently
    , height = 60 //only used for tickLabel currently
    , scale = d3.scale.linear()
    , axisLabelText = null
    , rotateLabels = 0
    , rotateYLabel = true
    , staggerLabels = false
    , isOrdinal = false
    , ticks = null
    , axisLabelDistance = 12 //The larger this number is, the closer the axis label is to the axis.
    ;

  axis
    .scale(scale)
    .orient('bottom')
    .tickFormat(function(d) { return d })
    ;

  var scale0;

  
  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this);


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var svg = container.selectAll('g.svg.kf-axis').data([data]);
      var svgEnter = svg.enter().append('g').attr('class', 'svg kf-axis');
      var gEnter = svgEnter.append('g');
      var g = svg.select('g')

      //------------------------------------------------------------


      if (ticks !== null)
        axis.ticks(ticks);
      else if (axis.orient() == 'top' || axis.orient() == 'bottom')
        axis.ticks(Math.abs(scale.range()[1] - scale.range()[0]) / 100);


      //TODO: consider calculating width/height based on whether or not label is added, for reference in charts using this component


      g.transition().call(axis);

      scale0 = scale0 || axis.scale();

      var fmt = axis.tickFormat();
      if (fmt == null) {
        fmt = scale0.tickFormat();
      }

      var axisLabel = g.selectAll('text.kf-axislabel')
          .data([axisLabelText || null]);
      axisLabel.exit().remove();

      
      switch (axis.orient()) {
        case 'top':
          axisLabel.enter().append('text').attr('class', 'kf-axislabel');
          var w = (scale.range().length==2) ? scale.range()[1] : (scale.range()[scale.range().length-1]+(scale.range()[1]-scale.range()[0]));
          axisLabel
              .attr('text-anchor', 'middle')
              .attr('y', 0)
              .attr('x', w/2);
          break;
        case 'bottom':
          var xLabelMargin = 36;
          var maxTextWidth = 30;
          var xTicks = g.selectAll('g').select("text");
          if (rotateLabels%360) {
            //Calculate the longest xTick width
            xTicks.each(function(d,i){
              var width = this.getBBox().width;
              if(width > maxTextWidth) maxTextWidth = width;
            });
            //Convert to radians before calculating sin. Add 30 to margin for healthy padding.
            var sin = Math.abs(Math.sin(rotateLabels*Math.PI/180));
            var xLabelMargin = (sin ? sin*maxTextWidth : maxTextWidth)+30;
            //Rotate all xTicks
            xTicks
              .attr('transform', function(d,i,j) { return 'rotate(' + rotateLabels + ' 0,0)' })
              .style('text-anchor', rotateLabels%360 > 0 ? 'start' : 'end');
          }
          axisLabel.enter().append('text').attr('class', 'kf-axislabel');
          var w = (scale.range().length==2) ? scale.range()[1] : (scale.range()[scale.range().length-1]+(scale.range()[1]-scale.range()[0]));
          axisLabel
              .attr('text-anchor', 'middle')
              .attr('y', xLabelMargin)
              .attr('x', w/2);
          
          if (staggerLabels)
            xTicks
                .attr('transform', function(d,i) { return 'translate(0,' + (i % 2 == 0 ? '0' : '12') + ')' });

          break;
        case 'right':
          axisLabel.enter().append('text').attr('class', 'kf-axislabel');
          axisLabel
              .style('text-anchor', rotateYLabel ? 'middle' : 'begin')
              .attr('transform', rotateYLabel ? 'rotate(90)' : '')
              .attr('y', rotateYLabel ? (-Math.max(margin.right,width) + 12) : -10) //TODO: consider calculating this based on largest tick width... OR at least expose this on chart
              .attr('x', rotateYLabel ? (scale.range()[0] / 2) : axis.tickPadding());
          break;
        case 'left':
          /*
          //For dynamically placing the label. Can be used with dynamically-sized chart axis margins
          var yTicks = g.selectAll('g').select("text");
          yTicks.each(function(d,i){
            var labelPadding = this.getBBox().width + axis.tickPadding() + 16;
            if(labelPadding > width) width = labelPadding;
          });
          */
          axisLabel.enter().append('text').attr('class', 'kf-axislabel');
          axisLabel
              .style('text-anchor', rotateYLabel ? 'middle' : 'end')
              .attr('transform', rotateYLabel ? 'rotate(-90)' : '')
              .attr('y', rotateYLabel ? (-Math.max(margin.left,width) + axisLabelDistance) : -10) //TODO: consider calculating this based on largest tick width... OR at least expose this on chart
              .attr('x', rotateYLabel ? (-scale.range()[0] / 2) : -axis.tickPadding());
          break;
      }
      axisLabel
          .text(function(d) { return d });

      //store old scales for use in transitions on update
      scale0 = scale.copy();

    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.axis = axis;

  d3.rebind(chart, axis, 'orient', 'tickValues', 'tickSubdivide', 'tickSize', 'tickPadding', 'tickFormat');
  d3.rebind(chart, scale, 'domain', 'range', 'rangeBand', 'rangeBands'); //these are also accessible by chart.scale(), but added common ones directly for ease of use


  chart.margin = function(_) {
    if(!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  }

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.ticks = function(_) {
    if (!arguments.length) return ticks;
    ticks = _;
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

  chart.rotateYLabel = function(_) {
    if(!arguments.length) return rotateYLabel;
    rotateYLabel = _;
    return chart;
  }

  chart.rotateLabels = function(_) {
    if(!arguments.length) return rotateLabels;
    rotateLabels = _;
    return chart;
  }

  chart.staggerLabels = function(_) {
    if (!arguments.length) return staggerLabels;
    staggerLabels = _;
    return chart;
  };

  chart.axisLabelDistance = function(_) {
    if (!arguments.length) return axisLabelDistance;
    axisLabelDistance = _;
    return chart;
  };

  //============================================================


  return chart;

};

function linechart() {
	var lines = line(),
		xAxis = axis(),
    	yAxis = axis();

    var margin = {top: 30, right: 20, bottom: 50, left: 60},
    	width = null,
    	height = null,
    	showXAxis = true,
    	showYAxis = true,
    	rightAlignYAxis = false,
    	xScale,
    	yScale,
    	state = {},
    	defaultState = null,
    	transitionDuration = 300;

    xAxis
      	.orient('bottom')
    	.tickPadding(7);
  	yAxis
    	.orient((rightAlignYAxis) ? 'right' : 'left');

    function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;


      var innerWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          innerHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;



    chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
      chart.container = this;

    xScale = lines.xScale();
    yScale = lines.yScale();

    
    // Setup containers and skeleton of chart
	var svg = container.selectAll('svg.kf-lineChart').data([data]);

	var gEnter = svg.enter().append('g').attr('class', 'svg kf-lineChart').append('g');
	var g = svg.select('g');



	gEnter.append("rect").style("opacity",0);
	gEnter.append('g').attr('class', 'kf-x kf-axis');
	gEnter.append('g').attr('class', 'kf-y kf-axis');
	gEnter.append('g').attr('class', 'kf-linesGroup');

	g.select("rect")
	.attr("width",innerWidth)
	.attr("height",(innerHeight > 0) ? innerHeight : 0);

	svg.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	if (rightAlignYAxis) {
		g.select(".kf-y.kf-axis")
	    	.attr("transform", "translate(" + innerWidth + ",0)");
	}

	lines
        .width(innerWidth)
        .height(innerHeight);

    var linesGroup = g.select('.kf-linesGroup')
    	.datum(data.filter(function(d) { return !d.disabled }))

    linesGroup.transition().call(lines);

      // Setup Axes

      if (showXAxis) {
        xAxis
          .scale(xScale)
          .ticks( innerWidth / 100 )
          .tickSize(-innerHeight, 0)
          
          
        g.select('.kf-x.kf-axis')
            .attr('transform', 'translate(0,' + innerHeight + ')');
        g.select('.kf-x.kf-axis')
            .transition()
            .call(xAxis);
      }

      if (showYAxis) {
        yAxis
          .scale(yScale)
          .ticks( innerHeight / 36 )
          .tickSize( -innerWidth, 0)
          

        g.select('.kf-y.kf-axis')
            .transition()
            .call(yAxis);
      }
      });

    return chart;
  }

  // expose chart's sub-components
  chart.lines = lines;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;
  

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
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

  chart.showXAxis = function(_) {
    if (!arguments.length) return showXAxis;
    showXAxis = _;
    return chart;
  };

  chart.showYAxis = function(_) {
    if (!arguments.length) return showYAxis;
    showYAxis = _;
    return chart;
  };

  chart.rightAlignYAxis = function(_) {
    if(!arguments.length) return rightAlignYAxis;
    rightAlignYAxis = _;
    yAxis.orient( (_) ? 'right' : 'left');
    return chart;
  };

  chart.state = function(_) {
    if (!arguments.length) return state;
    state = _;
    return chart;
  };

  chart.defaultState = function(_) {
    if (!arguments.length) return defaultState;
    defaultState = _;
    return chart;
  };

  chart.transitionDuration = function(_) {
    if (!arguments.length) return transitionDuration;
    transitionDuration = _;
    return chart;
  };

  //============================================================


  return chart;
};


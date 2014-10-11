var ndtv_d3 = (function() {
  var options = {
    defaultDuration: 800, //Duration of each step animation during play or step actions
    scrubDuration: 10, //Sum duration of all step animations when scrubbing, regardless of # of steps
    labelOffset: { //offset of labels FIXME
      x: 12,
      y: 0
    },
    nodeSizeFactor: 100, //sets default node size, as viewport / nodeSizeFactor
    dataChooser: false, //show a select box for choosing different graphs?
    dataChooserDir: 'data/', //web path to dir containing data json files
    playControls: true, //show the player controls
    slider: true, //show the slider control
    animateOnLoad: false, //play the graph animation on page load
    margin: { //svg margins - may be overridden when setting fixed aspect ratio
      x: 20,
      y: 10
    },
    initialDataUrl: null,
  }
  
  var nodes,
      edges,
      container,
      xScale,
      yScale,
      maxTime, 
      slider,
      animate,
      baseNodeSize,
      timeIndex,
      currTime = 0,
      prevTime = 0;

  //Private Functions

  //constructor
  var n3 = function(opts) {
    var _this = this;
    $.extend(true, options, opts); //replace defaults with user-specified options
    if (options.dataChooser) { createDataChooser(); }
    if (options.playControls) { createPlayControls(); }
    SVGSetup();
    if(options.initialDataUrl) { n3.loadData(options.initialDataUrl); }
  }

  var SVGSetup = function() {
    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    function zoomed() {
      container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
      d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
      d3.select(this).classed("dragging", false);
    }

    $(window).resize(n3.resizeGraph);

    var svg = d3.select("#graph")
      .append("svg:svg")
      .append('g')
      .call(zoom)

    var rect = svg.append("rect")
      .attr('id', 'background')
      .style("fill", "none")
      .style("pointer-events", "all");

    container = svg.append("g")
      .attr('id', 'container')
    container.append('g').attr('id', 'edges');
    container.append('g').attr('id', 'nodes');
    container.append('g').attr('id', 'labels');
  }

  var initScales = function() {
    var window_width = $(window).width();
    var window_height = $(window).height()-110;
    if (window_width > window_height) { 
      options.margin.x = (window_width - window_height)/2
    } else {
      options.margin.y = (window_height - window_width)/2
    }

    var width = window_width - (options.margin.x*2);
    var height = window_height - (options.margin.y*2);

    baseNodeSize = width > height ? height /100 : width/100;

    d3.selectAll('#graph svg, #background')
      .attr({
        width: width + options.margin.x * 2,
        height: height + options.margin.y * 2
      })

    d3.select('#container')
      .attr("transform", "translate(" + options.margin.x + "," + options.margin.y + ")");

    xScale = d3.scale.linear()
      .domain([graph.gal['xlim.active'][0][0].xlim[0],graph.gal['xlim.active'][0][0].xlim[1]])
      .range([0, width]);

    yScale = d3.scale.linear()
      .domain([graph.gal['ylim.active'][0][0].ylim[0],graph.gal['ylim.active'][0][0].ylim[1]])
      .range([height, 0]);
  }

  function createDataChooser() {
    var setVidLink = function(url) {
      $('#video_link').attr('href', 'data/'+url.replace('.json', '.mp4'))
    }
    $('body').append($("<div id='data_chooser_container'></div>").append("<select id='data_chooser'/>").append("<a id='video_link' target='_blank'>Video</a>"));
    $.get('data/', function(data){
      $('#data_chooser').change(function() {
        var url = $('#data_chooser').val();
        console.log('hi')
        n3.loadData(url);
        setVidLink(url)
      })
      var matches = data.match(/<td><a href="[^"]*"/g);
      $.each(matches, function(i, m) {
        var url = m.match(/href="([^"]*)"/)[1];
        if (url.match(/.json$/)) {
          $('#data_chooser').append("<option>data/"+url+"</option>")
        }
        if (i == 1) {
          setVidLink(url);
        }
      })
    })
  }
 
  var createPlayControls = function() {
    $('#play-control-container').show();
    $('#step-back-control').click(function() { n3.animateGraph(currTime-1, currTime-1); });
    $('#play-back-control').click(function() { n3.animateGraph(currTime-1, 0); });
    $('#pause-control').click(function() { n3.endAnimation(); });
    $('#play-forward-control').click(function() { n3.animateGraph(currTime+1); });
    $('#step-forward-control').click(function() { n3.animateGraph(currTime+1, currTime+1); });
  }

  var dataFilter = function(type) {
    var dataList = type == 'node' ? nodes : edges;

    return $.grep(dataList, function(item, i) {
      var active = false;
      if (! $.isEmptyObject(item)) {
        if (item.active || (item.atl && item.atl.active)) {
          var activeProperty = type == 'node' ? item.active : item.atl.active;
          $.each(activeProperty, function(i, e) {
            $.each(e, function(i, num){
              if (num == 'Inf') { e[i] = Infinity; }
              if (num == '-Inf') { e[i] = -Infinity; }
            })
            if(e[0] <= currTime && e[1] >= currTime) {
              active = true;
              return false;
            }
          })
        } else {
          active = true;
        }
      }
      return active;
    });
  }

  var timeLookup = function(property, index, time) {
    time = time || currTime;
    var defaults = {
      'vertex.cex': 1,
      //'vertex.col': 'inherit'
    }
    if (timeIndex[time].data[property]) {
      return timeIndex[time].data[property][index];
    } else {
      return defaults[property];
    }
  }
  
  //Public Functions

  n3.loadData = function(url) {
    currTime = 0;
    prevTime = 0;
    $.getJSON(url, function(data) {
      console.time('loadData');
      graph = data;
      if (options.dataChooser) {
        $('#data_chooser').val(url);
      }
      container.select('#edges').selectAll('*').remove();
      container.select('#labels').selectAll('*').remove();
      container.select('#nodes').selectAll('*').remove();

      initScales();
      nodes = graph.val;
      edges = graph.mel;

      $.each(nodes, function(i, n) {
        if (! $.isEmptyObject(n)) {
          n.id = i;
        }
      })
      $.each(edges, function(i, e) {
        if (! $.isEmptyObject(e)) {
          e.id = i;
        }
      })

      var sliceInfo = graph.gal['slice.par'];
      minTime = sliceInfo.start[0];
      maxTime = sliceInfo.end[0];
      interval = sliceInfo.interval[0];

      var valIndex = {};
      timeIndex = [];
      var i = 0;
      for(var t = minTime; t<=maxTime-interval; t+=interval) {
        var slice = {
          startTime: t,
          endTime: t+sliceInfo['aggregate.dur'][0],
          data: {}
        };
        $.each(['coord', 'vertex.cex', 'label', 'vertex.col', 'xlab', 'vertex.sides', 'displaylabels'], function(i, prop) {
          var props = graph.gal[prop+'.active'];
          if (! props) { 
            //console.log('no property: '+prop); 
            return;
          }
          $.each(props[1], function(i, slices){
            if (slices[0] <= t && slices[1] > t) {
              slice.data[prop] = props[0][i][prop];
              return false;
            }
          })      
        })
        timeIndex.push(slice);
        valIndex[t] = i;
        i++;
      }

      $('#slider').html('');

      slider = d3.slider().axis(true).step(interval);
      slider.min(minTime)
      slider.max(maxTime-interval)
      slider.animate(options.defaultDuration)
      slider.value(minTime)
      slider.on('slide', function(ext, value) {
        n3.endAnimation();
        var duration = options.scrubDuration/Math.abs(currTime-value);
        n3.animateGraph(currTime, valIndex[value], duration, true);
      })
      
      slider.on('slideend', function() {
        slider.animate(options.defaultDuration);
      })
      d3.select('#slider').call(slider);
      $('#slider').mousedown(function(e) { 
        slider.animate(options.scrubDuration);
      })
      console.timeEnd('loadData');

      n3.drawGraph(options.defaultDuration);
    })
  }

  n3.drawGraph = function(duration) {

    $('#key').html(timeLookup('xlab', 0))
    var lines = container.select('#edges').selectAll('line').data(dataFilter('edge'), function(e) { return e.id})

      lines.enter().append('line')
        .attr('class', 'edge')
        .attr({
          x1: function(d, i) { return xScale(timeLookup('coord', d.inl[0]-1, prevTime)[0]); },
          y1: function(d, i) { return yScale(timeLookup('coord', d.inl[0]-1, prevTime)[1]); },
          x2: function(d, i) { return xScale(timeLookup('coord', d.outl[0]-1, prevTime)[0]); },
          y2: function(d, i) { return yScale(timeLookup('coord', d.outl[0]-1, prevTime)[1]); },
          opacity: 0
        })
        .style('stroke', 'green')
        .transition()
        .duration(duration*0.45)
        .attr({opacity: 1})
        // .transition()
        // .delay(duration*0.45)
        // .duration(0)
        // .style('stroke', 'black')

        lines.transition()
          .delay(duration/2)
          .duration(duration/2)
          .attr({
            x1: function(d, i) { return xScale(timeLookup('coord', d.inl[0]-1)[0]); },
            y1: function(d, i) { return yScale(timeLookup('coord', d.inl[0]-1)[1]); },
            x2: function(d, i) { return xScale(timeLookup('coord', d.outl[0]-1)[0]); },
            y2: function(d, i) { return yScale(timeLookup('coord', d.outl[0]-1)[1]); },
          })
          .style('stroke', 'black')

      lines.exit()
        .style('stroke', 'red')
        .transition()
        .duration(duration/2)
        .attr('opacity', 0)          
        .remove();

    var circles = container.select('#nodes').selectAll('circle').data(dataFilter('node'), function(e) { return e.id});
      circles.enter().append('circle')
        .attr({
          class: 'node',
          cx: function(d, i) { return xScale(timeLookup('coord', i)[0]); },
          cy: function(d, i) { return yScale(timeLookup('coord', i)[1]); },
          r: function(d, i) { return timeLookup('vertex.cex', i) * baseNodeSize; },
          opacity: 0,
        })
        .transition()
        .duration(duration/2)
        .attr('opacity', 1)
        .style('fill', function(d, i) {
          return timeLookup('vertex.col', i);
        })

      circles.transition()
        .delay(duration/2)
        .duration(duration/2)
        .attr({
          cx: function(d, i) { return xScale(timeLookup('coord', i)[0]); },
          cy: function(d, i) { return yScale(timeLookup('coord', i)[1]); },
          r: function(d, i) { return timeLookup('vertex.cex', i) * baseNodeSize; },
        })
        .style('fill', function(d, i) {
          return timeLookup('vertex.col', i);
        })

      circles.exit()
        .transition()
        .duration(duration*.4)
        .attr('opacity', 0)
        .remove();

    var labels = container.select('#labels').selectAll('text').data(dataFilter('node'), function(e) { return e.id});
      labels.enter().append('text').filter(function(d) { return timeLookup('displaylabels', 0)})
        .attr({
          class: 'label',
          x: function(d, i) { return xScale(timeLookup('coord', i)[0])+options.labelOffset.x; },
          y: function(d, i) { return yScale(timeLookup('coord', i)[1])+options.labelOffset.y; },
          opacity: 0
        })
        .text(function(d, i) { return timeLookup('label', i); })

      labels.transition().filter(function(d) { return timeLookup('displaylabels', 0) !== false})
        .delay(duration/2)
        .duration(duration/2)
        .attr({
          x: function(d, i) { return xScale(timeLookup('coord', i)[0])+options.labelOffset.x; },
          y: function(d, i) { return yScale(timeLookup('coord', i)[1])+options.labelOffset.y; },
          opacity: 1
        })
        .text(function(d, i) { return timeLookup('label', i); })

      labels.exit().remove();
  }

  n3.resizeGraph = function() {
    initScales();
    var lines = container.select('#edges').selectAll('line').data(dataFilter('edge'), function(e) { return e.id})
      .attr({
        x1: function(d, i) { return xScale(timeLookup('coord', d.inl[0]-1)[0]); },
        y1: function(d, i) { return yScale(timeLookup('coord', d.inl[0]-1)[1]); },
        x2: function(d, i) { return xScale(timeLookup('coord', d.outl[0]-1)[0]); },
        y2: function(d, i) { return yScale(timeLookup('coord', d.outl[0]-1)[1]); },
      });

    var circles = container.select('#nodes').selectAll('circle').data(dataFilter('node'), function(e) { return e.id})
      .attr({
        cx: function(d, i) { return xScale(timeLookup('coord', i)[0]); },
        cy: function(d, i) { return yScale(timeLookup('coord', i)[1]); },
        r: function(d, i) { return timeLookup('vertex.cex', i) * baseNodeSize; },
      });

    var labels = container.select('#labels').selectAll('text').data(dataFilter('node'), function(e) { return e.id})
      .attr({
        x: function(d, i) { return xScale(timeLookup('coord', i)[0])+options.labelOffset.x; },
        y: function(d, i) { return yScale(timeLookup('coord', i)[1])+options.labelOffset.y; },
      })
  }

  n3.animateGraph = function(time, endTime, duration, noUpdate) {
    //if (endTime !== undefined && ! $.isNumeric(endTime)) { return; }
    if (time > maxTime-1) { return; }
    //console.log(currTime + ' '+time+' '+endTime+ ' '+nextTime)
    if(! noUpdate) {
      slider.value(timeIndex[time].startTime);
    }
    duration = duration === undefined ? options.defaultDuration : duration;
    //console.log(duration)
    endTime = endTime === undefined ? maxTime : endTime;
    var nextTime = endTime > time ? time +1 : time -1;
    //console.log(nextTime)
    //console.log(currTime + ' '+time+' '+endTime+ ' '+nextTime)

    prevTime = currTime;
    currTime = time == currTime ? nextTime : time;
    //console.log(currTime + ' '+time+' '+endTime+ ' '+nextTime)
    n3.drawGraph(duration);
    if (currTime != endTime) {
      animate = setTimeout(function(){
        n3.animateGraph(nextTime, endTime, duration, noUpdate);
      }, duration)
    }
  }

  n3.endAnimation = function(){
    clearTimeout(animate);
  }
  return n3;
}()); 

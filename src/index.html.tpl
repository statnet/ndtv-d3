<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <link rel='stylesheet' href='../src/lib/d3.slider.css'/>
    <link rel='stylesheet' href='../src/css/styles.css'/>
  </head>
  <body>
    <svg display="none" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="176" height="32" viewBox="0 0 176 32">
      <defs>
        <g id="icon-play"><path class="path1" d="M26.717 15.179l-13.698-8.486c-0.998-0.654-1.814-0.171-1.814 1.072v16.474c0 1.243 0.818 1.725 1.814 1.070l13.699-8.486c0 0 0.486-0.342 0.486-0.822-0.002-0.478-0.488-0.821-0.488-0.821z"></path></g>
        <g id="icon-pause"><path class="path1" d="M21.6 4.8c-1.59 0-2.88 0.49-2.88 2.080v18.24c0 1.59 1.29 2.080 2.88 2.080s2.88-0.49 2.88-2.080v-18.24c0-1.59-1.29-2.080-2.88-2.080zM10.4 4.8c-1.59 0-2.88 0.49-2.88 2.080v18.24c0 1.59 1.29 2.080 2.88 2.080s2.88-0.49 2.88-2.080v-18.24c0-1.59-1.29-2.080-2.88-2.080z"></path></g>
        <g id="icon-first"><path class="path1" d="M11.976 16c0 0.413 0.419 0.707 0.419 0.707l11.64 7.31c0.862 0.565 1.565 0.149 1.565-0.92v-14.195c0-1.070-0.702-1.486-1.565-0.922l-11.64 7.312c0 0.002-0.419 0.294-0.419 0.707zM6.4 8.571v14.858c0 1.421 0.979 1.856 2.4 1.856s2.4-0.435 2.4-1.854v-14.859c0-1.422-0.979-1.858-2.4-1.858s-2.4 0.437-2.4 1.858z"></path></g>
      </defs>
    </svg>
    <script src="../src/lib/d3/d3.min.js" charset="utf-8"></script>
    <script src="../src/lib/jquery/dist/jquery.min.js"></script>
    <script src="../src/lib/d3.slider.js"></script>
    <script src="../src/js/ndtv-d3.js"></script>
    <script>
      //INIT GRAPH DATA HERE
      var graphData = {};
      var options = {};
      //END GRAPH DATA INIT
	   
      //Insert init JS Here
      $(function() {
        options.graphData = options;
        var graph = new ndtv_d3(options);        
		  })
    </script>
  </body>
</html>

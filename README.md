# wwmanager
Web Worker Manager - a manager to create and oversee web workers

Web Worker Manager is a small component that manages the creation of inline web workers with respect to what a given browser on a device can handle. It also monitors each web worker, reusing workers as needed or terminating them when they are idle and no longer needed.

#### Browser Support

The web worker manager is intended for browsers that support web workers ...

- Google Chrome
- Mac OS Safari
- iOS Safari
- IE 11
- MS Edge
- Firefox
- Samsung Internet

#### Dependencies

wwmanager has been tested on jQuery 3.3.1 but should work with jQuery 2.1 and 1.7

#### How to use

Just place before your closing <body> tag, add:

<script type="text/javascript" src="src/wwmanager.js"></script>

Once loaded, wwmanager will attach itself to the currently loaded instance of jQuery and be available for use.

The wwmanager's syntax is as follows:

$.fn.wwmanager(
  <inline script to be turned into a Blob web worker>,
  <unique identifier that can be used to identify the worker>'
  [,<parameters that will be passed to the worker to operate against>]
  [,<function if worker is successful>]
  [,<function if worker is unsuccessful>]
  );

Here is a very simple example:

$.fn.wwmanager(function(e) {
    // this is the inline worker to be created
    var worker_output = 'The worker heard: ' + e.data.msg;
    self.postMessage(worker_output);
  },
  'single_worker',
  {"msg": 'test message'},
  function(resp,e) {
      $('#out').append('<hr><div> success with single_worker script! '+resp+'</div><hr><br>');
  },
  function(resp,e) {
      $('#out').append('<hr><div> fail with single_worker script! '+resp+'</div><hr><br>');
  });




#### License

Copyright (c) 2018 C. B. Ash

Licensed under the MIT License

While this is my own pet project, I always enjoy getting suggestions for improvement here.

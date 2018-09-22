# wwmanager
Web Worker Manager - a manager to create and oversee web workers

Web Worker Manager is a small component that manages the creation of inline web workers with respect to what a given browser on a device can handle. It also monitors each web worker, reusing workers as needed or terminating them when they are idle and no longer needed.

### Browser Support

The web worker manager is intended for browsers that support web workers ...

- Google Chrome
- Mac OS Safari
- iOS Safari
- IE 11
- MS Edge
- Firefox
- Samsung Internet

### Dependencies

wwmanager has been tested on jQuery 3.3.1 but should work with jQuery 2.1 and 1.7

### How to use

Just place before your closing <body> tag, add:

```html
<script type="text/javascript" src="src/wwmanager.js"></script>
```

Once loaded, wwmanager will attach itself to the currently loaded instance of jQuery and be available for use.

##### Syntax

```javascript
$.fn.wwmanager(
  workerFunction,
  uniqueWorkerID
  [,parametersForWorker]
  [,successFunction]
  [,failureFunction]
);
```

#### workerFunction

###### Type: Function
This is the function that is turned into a web worker. Right now, this is an inline function as seen in the tests and examples.

#### uniqueWorkerID

###### Type: String or Number
Each worker must have a unique identifier. This can be anything but it's recommended to make this something recognizable for development purposes.

#### parametersForWorker

###### Type: Object
If the worker needs data to function, it is passed through here. This is an object of the data the worker needs.

#### successFunction

###### Type: Function
This is a function to capture the successful results of the web worker

#### failureFunction

###### Type: Function
This is the function to capture the result if the web worker fails.


##### Example

```javascript
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
```


### License

Copyright (c) 2018 C. B. Ash

Licensed under the MIT License

While this is my own pet project, I always enjoy getting suggestions for improvement here.

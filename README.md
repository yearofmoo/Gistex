# Gistex

Gistex is a Vanilla JavaScript wrapper for loading Github Gist snippets on the fly with AJAX.

Supported by all browsers IE6-IE9, Chrome, Opera, Safari and Firefox.

Works in all common JavaScript frameworks: MooTools, JQuery, Prototype, Dogo.

## Simple Usage

```javascript
<div id="container">This is where the gist code will be loaded.</div>

<script type="text/javascript" src="./gistex.js">
<script type="text/javascript">
var container = document.getElementById('container');
new Gistex(container,'https://gist.github.com/....js?file=...',{
  onLoading : function() { ... },
  onReady : function() { ... },
  onFailure : function() { ... }
});
</script>
```

* More information can be found at http://yearofmoo.com/Gistex ...
